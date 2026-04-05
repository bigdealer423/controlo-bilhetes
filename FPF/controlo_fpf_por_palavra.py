from playwright.sync_api import sync_playwright, TimeoutError as PlaywrightTimeoutError
import os
import json
import smtplib
import urllib.parse
import urllib.request
import mimetypes
import unicodedata
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.application import MIMEApplication

# =========================
# CONFIGURAÇÃO
# =========================

URLS = [
    {
        "url": "https://bilheteira.fpf.pt/",
        "keywords": ["Nigéria", "Chile", "Jamor", "Estádio Nacional"]
    },
    {
        "url": "https://estorilpraia.pt/bilheteira/",
        "keywords": ["FC Porto", ""]
    }
]

# Se o site tiver banner de cookies, coloca aqui o seletor.
# Se não tiver, deixa None.
SELECTOR_COOKIES = None
# Exemplo:
# SELECTOR_COOKIES = "button.btn.btn-secondary.js_cookie_banner_accept_btn"

# Se quiseres procurar só numa zona específica da página, define um seletor aqui.
# Se deixares None, lê o texto da página inteira.
TEXT_CONTAINER_SELECTOR = None
# Exemplo:
# TEXT_CONTAINER_SELECTOR = "main"

SCREENSHOT_DIR = "/tmp/site_monitor"
STATE_FILE = "/tmp/site_monitor_state.json"

# Modo de pesquisa:
# "any" = alerta se aparecer pelo menos 1 palavra
# "all" = alerta só se aparecerem todas
MATCH_MODE = "any"

# =========================
# FUNÇÕES AUXILIARES
# =========================

def garantir_pasta():
    os.makedirs(SCREENSHOT_DIR, exist_ok=True)


def normalizar_texto(txt: str) -> str:
    if not txt:
        return ""
    txt = txt.lower().strip()
    txt = unicodedata.normalize("NFD", txt)
    txt = "".join(c for c in txt if unicodedata.category(c) != "Mn")
    return txt


def carregar_estado():
    if os.path.exists(STATE_FILE):
        try:
            with open(STATE_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return {}
    return {}


def guardar_estado(state):
    with open(STATE_FILE, "w", encoding="utf-8") as f:
        json.dump(state, f, ensure_ascii=False, indent=2)


def nome_seguro_ficheiro(url: str) -> str:
    parsed = urllib.parse.urlparse(url)
    base = (parsed.netloc + parsed.path).replace("/", "_").replace(":", "_")
    if not base:
        base = "pagina"
    return base[:180]


def enviar_email_com_screenshot(mensagem, screenshot_path, assunto="ALERTA - palavras detetadas"):
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

    print("Email enviado com sucesso.")


def enviar_telegram_texto(mensagem):
    token = os.environ["TELEGRAM_BOT_TOKEN"]
    chat_id = os.environ["TELEGRAM_CHAT_ID"]

    base_url = f"https://api.telegram.org/bot{token}/sendMessage"
    params = urllib.parse.urlencode({
        "chat_id": chat_id,
        "text": mensagem
    })

    with urllib.request.urlopen(f"{base_url}?{params}") as response:
        resposta = response.read().decode("utf-8")
        print("Telegram texto enviado:", resposta)


def enviar_telegram_com_screenshot(mensagem, screenshot_path):
    token = os.environ["TELEGRAM_BOT_TOKEN"]
    chat_id = os.environ["TELEGRAM_CHAT_ID"]

    if not screenshot_path or not os.path.exists(screenshot_path):
        print("Screenshot não existe, envio apenas texto no Telegram.")
        enviar_telegram_texto(mensagem)
        return

    url = f"https://api.telegram.org/bot{token}/sendPhoto"
    boundary = "----WebKitFormBoundary7MA4YWxkTrZu0gW"

    with open(screenshot_path, "rb") as f:
        file_data = f.read()

    filename = os.path.basename(screenshot_path)
    content_type = mimetypes.guess_type(filename)[0] or "application/octet-stream"

    body = []
    body.append(f"--{boundary}\r\n".encode())
    body.append(b'Content-Disposition: form-data; name="chat_id"\r\n\r\n')
    body.append(f"{chat_id}\r\n".encode())

    body.append(f"--{boundary}\r\n".encode())
    body.append(b'Content-Disposition: form-data; name="caption"\r\n\r\n')
    body.append(mensagem.encode("utf-8"))
    body.append(b"\r\n")

    body.append(f"--{boundary}\r\n".encode())
    body.append(
        f'Content-Disposition: form-data; name="photo"; filename="{filename}"\r\n'.encode()
    )
    body.append(f"Content-Type: {content_type}\r\n\r\n".encode())
    body.append(file_data)
    body.append(b"\r\n")

    body.append(f"--{boundary}--\r\n".encode())
    data = b"".join(body)

    req = urllib.request.Request(url, data=data, method="POST")
    req.add_header("Content-Type", f"multipart/form-data; boundary={boundary}")
    req.add_header("Content-Length", str(len(data)))

    with urllib.request.urlopen(req) as response:
        resposta = response.read().decode("utf-8")
        print("Telegram com imagem enviado:", resposta)


def aceitar_cookies(page):
    if not SELECTOR_COOKIES:
        print("Sem seletor de cookies configurado.")
        return True

    try:
        botao = page.locator(SELECTOR_COOKIES)

        if botao.count() == 0:
            print("Botão de cookies não encontrado.")
            return True

        if botao.first.is_visible():
            print("A aceitar cookies...")
            botao.first.click(force=True, timeout=10000)
            page.wait_for_timeout(3000)

        return True

    except Exception as e:
        print(f"Erro ao aceitar cookies: {e}")
        return True


def obter_texto_pagina(page):
    try:
        if TEXT_CONTAINER_SELECTOR:
            zona = page.locator(TEXT_CONTAINER_SELECTOR).first
            if zona.count() == 0:
                print("Container de texto não encontrado. Vou ler body completo.")
                texto = page.locator("body").inner_text()
            else:
                texto = zona.inner_text()
        else:
            texto = page.locator("body").inner_text()

        texto = texto or ""
        print("Texto extraído com sucesso.")
        return normalizar_texto(texto)

    except Exception as e:
        print(f"Erro ao obter texto da página: {e}")
        return ""


def verificar_keywords(texto_normalizado, keywords):
    keywords_norm = [normalizar_texto(k) for k in keywords if k.strip()]
    encontradas = [k for k in keywords_norm if k in texto_normalizado]
    em_falta = [k for k in keywords_norm if k not in texto_normalizado]

    if MATCH_MODE == "all":
        match = len(encontradas) == len(keywords_norm) and len(keywords_norm) > 0
    else:
        match = len(encontradas) > 0

    return match, encontradas, em_falta


# =========================
# EXECUÇÃO PRINCIPAL
# =========================

def main():
    garantir_pasta()
    estado = carregar_estado()

    with sync_playwright() as p:
        browser = p.chromium.launch(
            headless=True,
            args=["--no-sandbox", "--disable-setuid-sandbox"]
        )

        for item in URLS:
            url = item["url"]
            keywords = item["keywords"]

            page = browser.new_page(
                viewport={"width": 1440, "height": 2200},
                user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
            )

            try:
                page.set_extra_http_headers({
                    "Accept-Language": "pt-PT,pt;q=0.9,en;q=0.8"
                })

                print(f"\nA verificar: {url}")
                page.goto(url, wait_until="domcontentloaded", timeout=90000)
                page.wait_for_timeout(7000)

                aceitar_cookies(page)

                try:
                    page.wait_for_load_state("networkidle", timeout=15000)
                except PlaywrightTimeoutError:
                    print("Network idle não atingido, continuo na mesma.")

                page.wait_for_timeout(5000)

                screenshot_path = os.path.join(
                    SCREENSHOT_DIR,
                    f"{nome_seguro_ficheiro(url)}.png"
                )
                page.screenshot(path=screenshot_path, full_page=True)
                print(f"Screenshot guardado: {screenshot_path}")

                texto = obter_texto_pagina(page)
                match, encontradas, em_falta = verificar_keywords(texto, keywords)

                print(f"Palavras encontradas: {encontradas}")
                print(f"Palavras em falta: {em_falta}")

                url_key = normalizar_texto(url)
                anteriormente_detetado = estado.get(url_key, False)

                if match and not anteriormente_detetado:
                    mensagem = (
                        f"⚡ Palavra(s) detetada(s) na página\n\n"
                        f"URL: {url}\n"
                        f"Modo de pesquisa: {MATCH_MODE}\n"
                        f"Encontradas: {', '.join(encontradas) if encontradas else '-'}\n"
                        f"Em falta: {', '.join(em_falta) if em_falta else '-'}\n\n"
                        f"Segue screenshot para confirmação."
                    )

                    print("Deteção nova -> enviar email e Telegram")
                    enviar_email_com_screenshot(
                        mensagem,
                        screenshot_path,
                        assunto="ALERTA - palavras detetadas no site"
                    )
                    enviar_telegram_com_screenshot(mensagem, screenshot_path)

                    estado[url_key] = True

                elif not match:
                    print("Nenhuma palavra detetada nesta execução.")
                    estado[url_key] = False

                else:
                    print("Já tinha sido detetado antes. Não envio novo alerta.")

            except Exception as e:
                print(f"Erro ao verificar {url}: {e}")

            finally:
                page.close()

        browser.close()

    guardar_estado(estado)


if __name__ == "__main__":
    main()
