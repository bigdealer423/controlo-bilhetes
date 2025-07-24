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

    for screenshot in ["debug_after_login.png", "debug_login.png"]:
        if os.path.exists(screenshot):
            with open(screenshot, "rb") as f:
                msg.add_attachment(f.read(), maintype="image", subtype="png", filename=screenshot)

    with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as smtp:
        smtp.starttls()
        smtp.login(EMAIL_FROM, EMAIL_PASS)
        smtp.send_message(msg)
        print("✅ Email enviado com screenshots!")

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

            print("⌛ A aguardar redirecionamento após login...")
            time.sleep(5)  # Espera simples
            print("🌐 URL após 5 segundos:", page.url)

            page.screenshot(path="debug_after_login.png", full_page=True)
            print("📸 Screenshot 'debug_after_login.png' capturada")

            print("🧭 A procurar botão 'Reservar'...")
            page.screenshot(path="debug_login.png", full_page=True)
            print("📸 Screenshot tirada para debug (debug_login.png)")

            botao_reservar = page.locator("button.btn-orange.button-book")
            botao_reservar.wait_for(state="visible", timeout=20000)
            botao_reservar.first.click()
            print("✅ Botão 'Reservar' clicado.")

            page.wait_for_url("**/Book/ProductList", timeout=10000)
            page.wait_for_selector(".ProductSummaryDetailsWrapper h2", timeout=15000)
            print("📦 Página de produtos carregada.")

            titulos = page.locator(".ProductSummaryDetailsWrapper h2").all_text_contents()
            print(f"🔍 {len(titulos)} títulos encontrados.")
            for t in titulos:
                print("-", t)

            titulos_baixo = [t.lower() for t in titulos]
            for palavra in PALAVRAS_CHAVE:
                for titulo, titulo_original in zip(titulos_baixo, titulos):
                    if palavra.lower() in titulo:
                        print(f"✅ Palavra '{palavra}' encontrada no título: {titulo_original}")
                        enviar_email_alerta(palavra, PRODUTOS_URL)
                        return

            print("❌ Nenhuma palavra encontrada nos títulos.")

        except Exception as e:
            print("❌ Erro durante a verificação:", str(e))
        
            # Enviar email de erro com screenshots
            msg = EmailMessage()
            msg["Subject"] = f"❌ Erro na verificação Odisseias"
            msg["From"] = EMAIL_FROM
            msg["To"] = EMAIL_TO
            msg.set_content(f"Ocorreu um erro durante a execução:\n\n{str(e)}")
        
            for screenshot in ["debug_after_login.png", "debug_login.png"]:
                if os.path.exists(screenshot):
                    with open(screenshot, "rb") as f:
                        msg.add_attachment(f.read(), maintype="image", subtype="png", filename=screenshot)
        
            try:
                with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as smtp:
                    smtp.starttls()
                    smtp.login(EMAIL_FROM, EMAIL_PASS)
                    smtp.send_message(msg)
                    print("📧 Email de erro enviado com screenshots.")
             except Exception as email_err:
                 print("⚠️ Falha ao enviar email de erro:", email_err)


        finally:
            browser.close()

if __name__ == "__main__":
    verificar_eventos()
