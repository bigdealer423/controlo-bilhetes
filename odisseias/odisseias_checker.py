from playwright.sync_api import sync_playwright
import smtplib
from email.message import EmailMessage
import time
import os
import subprocess

# ⚙️ Instalação do browser
subprocess.run(["playwright", "install", "chromium"], check=True)

# ---- CONFIGURAÇÕES ----
EMAIL = "miguelitocosta423@gmail.com"
PASSWORD = "Pedrosara18#"
LOGIN_URL = "https://www.odisseias.com/Account/Login"
PRODUTOS_URL = "https://www.odisseias.com/Book/ProductList"
PALAVRAS_CHAVE = ["fenerbahçe", "benfica", "sporting", "porto"]

# Email envio
EMAIL_FROM = os.getenv("EMAIL_USERNAME")
EMAIL_TO = os.getenv("EMAIL_USERNAME")
EMAIL_PASS = os.getenv("EMAIL_PASSWORD")
SMTP_SERVER = 'smtp.gmail.com'
SMTP_PORT = 587

def enviar_email_alerta(palavra_encontrada, url_produto):
    msg = EmailMessage()
    msg["Subject"] = f"⚽ Alerta: '{palavra_encontrada}' encontrado na Odisseias"
    msg["From"] = EMAIL_FROM
    msg["To"] = EMAIL_TO
    msg.set_content(f"Foi encontrada a palavra '{palavra_encontrada}' em:\n{url_produto}")

    with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as smtp:
        smtp.starttls()
        smtp.login(EMAIL_FROM, EMAIL_PASS)
        smtp.send_message(msg)
        print("✅ Email enviado com sucesso!")

def verificar_sporting():
    with sync_playwright() as p:
        print("🚀 A iniciar browser...")
        browser = p.chromium.launch(headless=True, args=["--disable-dev-shm-usage", "--no-sandbox"])
        context = browser.new_context(user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36")
        page = context.new_page()

        try:
            print("🔐 A aceder à página de login...")
            page.goto(LOGIN_URL, timeout=60000, wait_until="domcontentloaded")
            page.fill('input[name="Email"]', EMAIL)
            page.fill('input[name="Password"]', PASSWORD)
            page.locator('button:has-text("Entrar")').click()
            page.wait_for_load_state("networkidle", timeout=60000)
            print("✅ Login feito com sucesso.")

            print("📦 A aceder à lista de produtos...")
            page.goto(PRODUTOS_URL, timeout=60000, wait_until="networkidle")
            time.sleep(3)

            titulos = page.locator(".ProductSummaryDetailsWrapper h2").all_text_contents()
            titulos_baixo = [t.lower() for t in titulos]
            print("🔍 A verificar palavras-chave...")

            for palavra in PALAVRAS_CHAVE:
                for titulo, titulo_original in zip(titulos_baixo, titulos):
                    if palavra.lower() in titulo:
                        print(f"✅ Palavra '{palavra}' encontrada no título: {titulo_original}")
                        enviar_email_alerta(palavra, PRODUTOS_URL)
                        return  # Só envia 1 alerta por execução

            print("❌ Nenhuma palavra encontrada nos títulos.")

        except Exception as e:
            print("❌ Erro durante a verificação:", str(e))

        finally:
            browser.close()

if __name__ == "__main__":
    verificar_sporting()
