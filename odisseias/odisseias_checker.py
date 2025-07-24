from playwright.sync_api import sync_playwright
import smtplib
from email.message import EmailMessage
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
STORAGE_STATE = os.path.join(BASE_DIR, "storage_state.json")
import subprocess

# ✅ Garante que o Chromium está instalado no ambiente Render
subprocess.run(["playwright", "install", "chromium"], check=True)

# ---- CONFIGURAÇÕES ----
PALAVRAS_CHAVE = ["fenerbahçe", "benfica", "sporting", "porto"]
PRODUTOS_URL = "https://www.odisseias.com/Book/ProductList"
STORAGE_STATE = "storage_state.json"

# Email de alerta
EMAIL_FROM = os.getenv("EMAIL_USERNAME")
EMAIL_TO = os.getenv("EMAIL_USERNAME")
EMAIL_PASS = os.getenv("EMAIL_PASSWORD")
SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 587

def enviar_email_alerta(palavra_encontrada, url_produto):
    msg = EmailMessage()
    msg["Subject"] = f"⚽ Alerta: '{palavra_encontrada}' encontrado na Odisseias"
    msg["From"] = EMAIL_FROM
    msg["To"] = EMAIL_TO
    msg.set_content(f"Foi encontrada a palavra '{palavra_encontrada}' em:\n{url_produto}")

    for screenshot in ["debug_produtos.png"]:
        if os.path.exists(screenshot):
            with open(screenshot, "rb") as f:
                msg.add_attachment(f.read(), maintype="image", subtype="png", filename=screenshot)

    with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as smtp:
        smtp.starttls()
        smtp.login(EMAIL_FROM, EMAIL_PASS)
        smtp.send_message(msg)
        print("✅ Email enviado com screenshot!")

def verificar_eventos():
    with sync_playwright() as p:
        print("🚀 A iniciar browser com sessão guardada...")
        browser = p.chromium.launch(headless=True, args=["--disable-dev-shm-usage", "--no-sandbox"])
        context = browser.new_context(storage_state=STORAGE_STATE)
        page = context.new_page()

        try:
            print("🌐 Aceder à página de produtos...")
            page.goto(PRODUTOS_URL, timeout=60000)

            page.wait_for_selector(".ProductSummaryDetailsWrapper h2", timeout=15000)
            print("📦 Página de produtos carregada.")
            page.screenshot(path="debug_produtos.png", full_page=True)

            titulos = page.locator(".ProductSummaryDetailsWrapper h2").all_text_contents()
            print(f"🔍 {len(titulos)} títulos encontrados:")
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
            print("❌ Erro:", str(e))

        finally:
            browser.close()

if __name__ == "__main__":
    verificar_eventos()
