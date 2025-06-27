from playwright.sync_api import sync_playwright
import os
import smtplib
from email.message import EmailMessage

def enviar_alerta(mensagem):
    EMAIL = os.environ.get("ALERT_EMAIL")
    PWD = os.environ.get("ALERT_PWD")
    DEST = os.environ.get("ALERT_DEST")

    if not EMAIL or not PWD or not DEST:
        print("⚠️ Variáveis de ambiente de email não configuradas.")
        return

    msg = EmailMessage()
    msg["Subject"] = "🎟️ Venda Benfica Aberta"
    msg["From"] = EMAIL
    msg["To"] = DEST
    msg.set_content(mensagem)

    with smtplib.SMTP_SSL("smtp.gmail.com", 465) as smtp:
        smtp.login(EMAIL, PWD)
        smtp.send_message(msg)

def verificar_bilhetes():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto("https://www.slbenfica.pt/bilhetes")
        page.wait_for_timeout(7000)  # espera 7 segundos para JS carregar

        botoes = page.locator("button:has-text('Comprar')")
        if botoes.count() > 0:
            mensagem = "✅ Venda de bilhetes aberta no Benfica! Vai a https://www.slbenfica.pt/bilhetes"
            print(mensagem)
            enviar_alerta(mensagem)
        else:
            print("❌ Ainda não há vendas abertas.")
        browser.close()

if __name__ == "__main__":
    verificar_bilhetes()
