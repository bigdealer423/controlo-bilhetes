from playwright.sync_api import sync_playwright, TimeoutError as PlaywrightTimeoutError
import os
import smtplib
import urllib.parse
import urllib.request
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.application import MIMEApplication

URLS = [
    #"https://viagens.slbenfica.pt/programas/sporting-cp-vs-sl-benfica-30-jornada-com-almoco/1005818#ps:777b9859-48aa-4ca9-89e5-4f85fd585cf3",
    "https://viagens.slbenfica.pt/programas/casa-pia-ac-vs-sl-benfica-28-jornada-com-almoco/1005817#ps:c43f8dbd-6376-4c13-99a3-d514153e9b78",
]

SELECTOR_COOKIES = "button.btn.btn-secondary.js_cookie_banner_accept_btn"
SECTION_SELECTOR = "section.package-rooms--container"


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


def obter_texto_secao_rooms(page):
    try:
        secao = page.locator(SECTION_SELECTOR).first

        if secao.count() == 0:
            print("Secção package-rooms--container não encontrada.")
            return ""

        if not secao.is_visible():
            print("Secção package-rooms--container encontrada mas não visível.")
            return ""

        texto = (secao.inner_text() or "").strip()
        print("Texto da secção package-rooms--container:")
        print(texto)
        return texto.lower()

    except Exception as e:
        print(f"Erro ao ler a secção rooms: {e}")
        return ""


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
                print("Não foi possível confirmar a aceitação dos cookies.")
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

                texto_secao = obter_texto_secao_rooms(page)
                tem_esgotado = "esgotado" in texto_secao

                print(f"tem_esgotado_na_secao={tem_esgotado}")

                debug_path = f"/tmp/debug_tentativa_{tentativa+1}.png"
                page.screenshot(path=debug_path, full_page=True)
                print(f"Screenshot debug guardado em: {debug_path}")

                if tem_esgotado:
                    disponibilidade_confirmada = False
                    break

            if disponibilidade_confirmada:
                page.screenshot(path=screenshot_path, full_page=True)

                mensagem = (
                    f"⚡ Disponibilidade detetada!\n\n"
                    f"Página: {url}\n\n"
                    f"Após múltiplas verificações, não foi encontrado o texto 'Esgotado' "
                    f"na secção package-rooms--container.\nSegue screenshot em anexo."
                )

                print("Disponibilidade confirmada -> enviar email e Telegram")
                enviar_email_com_screenshot(mensagem, screenshot_path)
                enviar_telegram(mensagem)
            else:
                print("Continua esgotado.")

        except Exception as e:
            print(f"Erro ao verificar {url}: {e}")

        finally:
            page.close()

    browser.close()
