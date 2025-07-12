from playwright.sync_api import sync_playwright
import smtplib
from email.message import EmailMessage
import time
import os
import subprocess

# ⚙️ Garante que o browser está presente mesmo no ambiente cronjob isolado
subprocess.run(["playwright", "install", "chromium"], check=True)


# ---- CONFIGURAÇÕES ----
EMAIL = "miguelitocosta423@gmail.com"
PASSWORD = "Pedrosara18#"
LOGIN_URL = "https://www.odisseias.com/Account/Login"
PRODUTOS_URL = "https://www.odisseias.com/Book/ProductList"
PALAVRA_CHAVE = "sporting"

# Email de envio
EMAIL_FROM = os.getenv("EMAIL_USERNAME")
EMAIL_TO = os.getenv("EMAIL_USERNAME")
EMAIL_PASS = os.getenv("EMAIL_PASSWORD")
SMTP_SERVER = 'smtp.gmail.com'
SMTP_PORT = 587

def enviar_email_alerta():
    msg = EmailMessage()
    msg["Subject"] = "⚽ Alerta: 'Sporting' encontrado na Odisseias"
    msg["From"] = EMAIL_FROM
    msg["To"] = EMAIL_TO
    msg.set_content("Foi encontrada a palavra 'Sporting' em: https://www.odisseias.com/Book/ProductList")

    with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as smtp:
        smtp.starttls()
        smtp.login(EMAIL_FROM, EMAIL_PASS)
        smtp.send_message(msg)
        print("✅ Email enviado com sucesso!")

def verificar_sporting():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        print("🚀 A aceder à página de login...")
        page.goto(LOGIN_URL)

        page.fill('input[name="Email"]', EMAIL)
        page.fill('input[name="Password"]', PASSWORD)
        botao_submit = page.locator('button:has-text("Entrar")')
        botao_submit.wait_for(state="visible", timeout=15000)
        botao_submit.click()

        



        page.wait_for_load_state("networkidle")
        time.sleep(2)

        print("🔐 Login concluído. A aceder à lista de produtos...")
        page.goto(PRODUTOS_URL)
        page.wait_for_load_state("networkidle")
        time.sleep(2)

        conteudo = page.content().lower()

        if PALAVRA_CHAVE.lower() in conteudo:
            print(f"✅ Palavra '{PALAVRA_CHAVE}' encontrada!")
            enviar_email_alerta()
        else:
            print(f"❌ Palavra '{PALAVRA_CHAVE}' não encontrada.")

        browser.close()

if __name__ == "__main__":
    verificar_sporting()
