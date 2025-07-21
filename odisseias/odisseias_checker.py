from playwright.sync_api import sync_playwright
import smtplib
from email.message import EmailMessage
import time
import os
import subprocess

# ⚙️ Instalação do Chromium (necessário em ambientes tipo Render)
subprocess.run(["playwright", "install", "chromium"], check=True)

# ---- CONFIGURAÇÕES ----
EMAIL = "miguelitocosta423@gmail.com"
PASSWORD = "Pedrosara18#"
PALAVRAS_CHAVE = ["fenerbahçe", "benfica", "sporting", "porto"]

LOGIN_URL = "https://www.odisseias.com/Account/Login"
PRODUTOS_URL = "https://www.odisseias.com/Book/ProductList"

# Configuração de email (usa variáveis de ambiente)
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

def verificar_eventos():
    with sync_playwright() as p:
        print("🚀 A iniciar browser...")
        browser = p.chromium.launch(headless=True, args=["--disable-dev-shm-usage", "--no-sandbox"])
        context = browser.new_context()
        page = context.new_page()

        try:
            print("🔐 A aceder à página de login...")
            page.goto(LOGIN_URL, timeout=60000, wait_until="domcontentloaded")

            page.fill('input[name="Email"]', EMAIL)
            page.fill('input[name="Password"]', PASSWORD)
            page.locator('button:has-text("Entrar")').click()

            page.wait_for_load_state("networkidle", timeout=60000)
            print("✅ Login feito com sucesso.")

            # Esperar e clicar no botão "Reservar"
            print("🧭 A procurar botão 'Reservar'...")
            botao_reservar = page.locator("button.btn-orange.button-book")
            botao_reservar.wait_for(state="visible", timeout=20000)
            botao_reservar.first.click()
            print("✅ Botão 'Reservar' clicado.")

            print("✅ Botão 'Reservar' clicado.")

            # Esperar que redirecione para a página de produtos
            page.wait_for_url("**/Book/ProductList", timeout=10000)
            page.wait_for_selector(".ProductSummaryDetailsWrapper h2", timeout=15000)
            print("📦 Página de produtos carregada.")

            # Extrair títulos
            titulos = page.locator(".ProductSummaryDetailsWrapper h2").all_text_contents()
            print(f"🔍 {len(titulos)} títulos encontrados.")
            for t in titulos:
                print("-", t)

            # Verificar palavras-chave
            titulos_baixo = [t.lower() for t in titulos]
            for palavra in PALAVRAS_CHAVE:
                for titulo, titulo_original in zip(titulos_baixo, titulos):
                    if palavra.lower() in titulo:
                        print(f"✅ Palavra '{palavra}' encontrada no título: {titulo_original}")
                        enviar_email_alerta(palavra, PRODUTOS_URL)
                        return  # Envia apenas um alerta por execução

            print("❌ Nenhuma palavra encontrada nos títulos.")

        except Exception as e:
            print("❌ Erro durante a verificação:", str(e))

        finally:
            browser.close()

if __name__ == "__main__":
    verificar_eventos()
