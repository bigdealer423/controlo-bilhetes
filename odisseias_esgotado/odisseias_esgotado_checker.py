from playwright.sync_api import sync_playwright, TimeoutError as PlaywrightTimeoutError
import os
import re
import smtplib
import urllib.parse
import urllib.request
import pytesseract
from PIL import Image
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.application import MIMEApplication

URLS = [
    "https://viagens.slbenfica.pt/programas/sporting-cp-vs-sl-benfica-30-jornada-com-almoco/1005818#ps:777b9859-48aa-4ca9-89e5-4f85fd585cf3",
    "https://viagens.slbenfica.pt/programas/casa-pia-ac-vs-sl-benfica-28-jornada-com-almoco/1005817#ps:c43f8dbd-6376-4c13-99a3-d514153e9b78",
]

SELECTOR_COOKIES = "button.btn.btn-secondary.js_cookie_banner_accept_btn"


def enviar_email_com_screenshot(mensagem, screenshot_path, assunto="ALERTA - disponibilidade detetada"):
    email_from = os.environ["EMAIL_FROM"]
    email_to = os.environ["EMAIL_TO"]
    password = os.environ["EMAIL_PASSWORD"]

    msg = MIMEMultipart()
    msg["Subject"] = assunto
    msg["From"] = email_from
    msg["To"] = email_to

    msg.attach(MIMEText(mensagem, "plain", "utf-8"))

    if screenshot_path and os.path.exists(screenshot_path):
        with open(screenshot_path, "rb") as f:
            anexo = MIMEApplication(f.read(), _subtype="png")
            anexo.add_header(
                "Content-Disposition",
                "attachment",
                filename=os.path.basename(screenshot_path)
            )
            msg.attach(anexo)

    with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
        server.login(email_from, password)
        server.sendmail(email_from, email_to, msg.as_string())


def enviar_telegram(mensagem):
    token = os.environ["TELEGRAM_BOT_TOKEN"]
    chat_id = os.environ["TELEGRAM_CHAT_ID"]

    base_url = f"https://api.telegram.org/bot{token}/sendMessage"
    params = urllib.parse.urlencode({
        "chat_id": chat_id,
        "text": mensagem
    })

    with urllib.request.urlopen(f"{base_url}?{params}") as response:
        resposta = response.read().decode("utf-8")
        print("Telegram enviado com sucesso:", resposta)


def aceitar_cookies(page):
    try:
        print("À procura do banner de cookies...")
        botao = page.locator(SELECTOR_COOKIES)

        total = botao.count()
        if total == 0:
            print("Botão de cookies não encontrado no DOM.")
            return True

        if botao.first.is_visible():
            print("Botão de cookies visível. A clicar...")
            botao.first.click(force=True, timeout=10000)
            page.wait_for_timeout(8000)

            try:
                if botao.first.is_visible():
                    print("Botão ainda visível. A tentar clique por JavaScript...")
                    page.evaluate("""
                        () => {
                            const el = document.querySelector('button.btn.btn-secondary.js_cookie_banner_accept_btn');
                            if (el) el.click();
                        }
                    """)
                    page.wait_for_timeout(8000)
            except Exception:
                pass

            try:
                ainda_visivel = botao.first.is_visible()
            except Exception:
                ainda_visivel = False

            if ainda_visivel:
                print("Banner de cookies continua visível.")
                return False

            print("Cookies aceites com sucesso.")
            return True

        print("Botão de cookies existe mas está oculto. Assumo cookies já tratados.")
        return True

    except Exception as e:
        print(f"Erro ao tratar cookies: {e}")
        return True


def contar_esgotado_visivel_dom(page):
    total_visiveis = 0
    loc = page.locator("text=/esgotado/i")
    total = loc.count()

    print(f"Ocorrências totais de 'Esgotado' encontradas no DOM: {total}")

    for i in range(total):
        item = loc.nth(i)
        try:
            if item.is_visible():
                texto = (item.inner_text() or "").strip()
                print(f"[VISÍVEL] Esgotado #{i+1}: {texto}")
                total_visiveis += 1
            else:
                print(f"[OCULTO] Esgotado #{i+1}")
        except Exception as e:
            print(f"Erro ao avaliar ocorrência #{i+1}: {e}")

    return total_visiveis


def preprocessar_imagem_para_ocr(caminho_entrada, caminho_saida):
    img = Image.open(caminho_entrada).convert("L")
    img = img.point(lambda x: 0 if x < 160 else 255, mode="1")
    img.save(caminho_saida)


def ocr_tem_esgotado(screenshot_path):
    try:
        imagem_processada = "/tmp/ocr_processada.png"
        preprocessar_imagem_para_ocr(screenshot_path, imagem_processada)

        img = Image.open(imagem_processada)
        texto = pytesseract.image_to_string(img, lang="eng")

        texto_normalizado = re.sub(r"\s+", " ", texto).strip().lower()

        print("Texto OCR extraído:")
        print(texto_normalizado[:1000])

        return "esgotado" in texto_normalizado
    except Exception as e:
        print(f"Erro no OCR: {e}")
        return None


with sync_playwright() as p:
    browser = p.chromium.launch(
        headless=True,
        args=["--no-sandbox", "--disable-setuid-sandbox"]
    )

    for url in URLS:
        page = browser.new_page(
            viewport={"width": 1400, "height": 1600},
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
        )

        try:
            page.set_extra_http_headers({
                "Accept-Language": "pt-PT,pt;q=0.9,en;q=0.8"
            })

            print(f"\nA verificar página: {url}")
            page.goto(url, wait_until="domcontentloaded", timeout=90000)

            page.wait_for_timeout(15000)
            cookies_ok = aceitar_cookies(page)
            page.wait_for_timeout(15000)

            screenshot_path = "/tmp/alerta_disponibilidade.png"

            if not cookies_ok:
                page.screenshot(path=screenshot_path, full_page=True)

                mensagem = (
                    f"⚠️ Não foi possível validar corretamente a página porque o banner de cookies "
                    f"continuou presente ou não foi tratado.\n\n"
                    f"Página: {url}\n\n"
                    f"Segue screenshot em anexo para análise."
                )

                enviar_email_com_screenshot(
                    mensagem,
                    screenshot_path,
                    assunto="ALERTA - cookies não aceites / validação incompleta"
                )
                continue

            disponibilidade_confirmada = True

            for tentativa in range(4):
                print(f"Tentativa {tentativa + 1}/4")

                if tentativa > 0:
                    page.reload(wait_until="domcontentloaded", timeout=90000)
                    page.wait_for_timeout(15000)
                    aceitar_cookies(page)
                    page.wait_for_timeout(15000)

                try:
                    page.wait_for_load_state("networkidle", timeout=15000)
                except PlaywrightTimeoutError:
                    print("Network idle não atingido.")

                page.wait_for_timeout(10000)

                debug_path = f"/tmp/debug_tentativa_{tentativa+1}.png"
                page.screenshot(path=debug_path, full_page=True)
                print(f"Screenshot debug guardado em: {debug_path}")

                esgotados_visiveis_dom = contar_esgotado_visivel_dom(page)
                print(f"Esgotados visíveis no DOM: {esgotados_visiveis_dom}")

                tem_esgotado_ocr = ocr_tem_esgotado(debug_path)
                print(f"OCR encontrou 'Esgotado': {tem_esgotado_ocr}")

                if esgotados_visiveis_dom > 0:
                    disponibilidade_confirmada = False
                    print("DOM encontrou 'Esgotado' -> continua esgotado.")
                    break

                if tem_esgotado_ocr is True:
                    disponibilidade_confirmada = False
                    print("OCR encontrou 'Esgotado' -> continua esgotado.")
                    break

                if tem_esgotado_ocr is None:
                    disponibilidade_confirmada = False
                    print("OCR inconclusivo -> não enviar alerta.")
                    break

            if disponibilidade_confirmada:
                page.screenshot(path=screenshot_path, full_page=True)

                mensagem = (
                    f"⚡ Disponibilidade detetada!\n\n"
                    f"Página: {url}\n\n"
                    f"Após múltiplas verificações, nem o DOM nem o OCR encontraram "
                    f"a palavra 'Esgotado'.\nSegue screenshot em anexo."
                )

                print("Disponibilidade confirmada -> enviar email e Telegram")
                enviar_email_com_screenshot(mensagem, screenshot_path)
                enviar_telegram(mensagem)
            else:
                print("Continua esgotado ou validação inconclusiva.")

        except Exception as e:
            print(f"Erro ao verificar {url}: {e}")

        finally:
            page.close()

    browser.close()
