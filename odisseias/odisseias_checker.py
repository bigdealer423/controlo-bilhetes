from playwright.sync_api import sync_playwright
import smtplib
from email.message import EmailMessage
import os
import subprocess

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
STORAGE_STATE = "/opt/render/project/src/odisseias/storage_state.json"

# ✅ Garante que o Chromium está instalado no ambiente Render
subprocess.run(["playwright", "install", "chromium"], check=True)

# ---- CONFIGURAÇÕES ----
PALAVRAS_CHAVE = ["alverca", "benfica", "sporting", "porto"]
PRODUTOS_URL = "https://www.odisseias.com/packs/experiencia/sport-lisboa-e-benfica-bilhetes-para-jogo-no-estadio-da-luz-cachecois/314649"

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

                        # esperar a página carregar totalmente (JS incluído)
            page.wait_for_load_state("networkidle", timeout=60000)
            print("📦 Página de produtos carregada (HTML final).")
            
            # screenshot continua útil para debug
            page.screenshot(path="debug_produtos.png", full_page=True)
            
            # obter HTML final
            html = page.content().lower()
            
            for palavra in PALAVRAS_CHAVE:
                if palavra.lower() in html:
                    print(f"✅ Palavra '{palavra}' encontrada no HTML da página.")
                    enviar_email_alerta(palavra, PRODUTOS_URL)
                    return
            
            print("❌ Nenhuma palavra encontrada no HTML.")


        except Exception as e:
            print("❌ Erro:", str(e))

        finally:
            browser.close()

if __name__ == "__main__":
    verificar_eventos()
