from playwright.sync_api import sync_playwright, TimeoutError as PlaywrightTimeoutError
import os
import smtplib
import urllib.parse
import urllib.request
from email.mime.text import MIMEText

URLS = [
    "https://viagens.slbenfica.pt/programas/sporting-cp-vs-sl-benfica-30-jornada-com-almoco/1005818", 
    "https://viagens.slbenfica.pt/programas/casa-pia-ac-vs-sl-benfica-28-jornada-com-almoco/1005817#ps:c43f8dbd-6376-4c13-99a3-d514153e9b78"
    # "https://viagens.slbenfica.pt/programas/outro-link-real",
]

# ISTO É PARA PROCURAR "ESGOTADO" no SITE DA BENFICA VIAGENS
SELECTOR_ESGOTADO = "span.soldout.is-hidden-mobile"
SELECTOR_PLUS = 'button.btn.btn-secondary.button-plus[data-field="room-1-number"]'


def enviar_email(mensagem):
    email_from = os.environ["EMAIL_FROM"]
    email_to = os.environ["EMAIL_TO"]
    password = os.environ["EMAIL_PASSWORD"]

    msg = MIMEText(mensagem, "plain", "utf-8")
    msg["Subject"] = "ALERTA - disponibilidade detetada"
    msg["From"] = email_from
    msg["To"] = email_to

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


with sync_playwright() as p:
    browser = p.chromium.launch(
        headless=True,
        args=["--no-sandbox", "--disable-setuid-sandbox"]
    )

    for url in URLS:
        page = browser.new_page()

        try:
            print(f"\nA verificar página: {url}")

            page.goto(url, wait_until="domcontentloaded", timeout=60000)
            page.wait_for_timeout(10000)

            tem_esgotado = False
            tem_botao_plus = False

            try:
                page.wait_for_load_state("networkidle", timeout=10000)
            except PlaywrightTimeoutError:
                print("Network idle não atingido.")

            el_esgotado = page.query_selector(SELECTOR_ESGOTADO)
            if el_esgotado:
                texto_esgotado = (el_esgotado.inner_text() or "").strip().lower()
                tem_esgotado = "esgotado" in texto_esgotado

            el_plus = page.query_selector(SELECTOR_PLUS)
            if el_plus:
                tem_botao_plus = True

            print(f"tem_esgotado={tem_esgotado}")
            print(f"tem_botao_plus={tem_botao_plus}")

            if (not tem_esgotado) and tem_botao_plus:
                mensagem = (
                    f"⚡ Disponibilidade detetada!\n\n"
                    f"Página: {url}\n\n"
                    f"Já não aparece 'Esgotado' e o botão '+' está visível."
                )

                print("Disponibilidade confirmada -> enviar email e Telegram")
                enviar_email(mensagem)
                enviar_telegram(mensagem)
            else:
                print("Sem disponibilidade confirmada.")

        except Exception as e:
            print(f"Erro ao verificar {url}: {e}")

        finally:
            page.close()

    browser.close()
