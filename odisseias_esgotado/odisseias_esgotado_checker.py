from playwright.sync_api import sync_playwright
import os
import smtplib
from email.mime.text import MIMEText

URL = "COLOQUE_AQUI_O_URL"


def enviar_email(mensagem):
    email_from = os.environ["EMAIL_FROM"]
    email_to = os.environ["EMAIL_TO"]
    password = os.environ["EMAIL_PASSWORD"]

    msg = MIMEText(mensagem)
    msg["Subject"] = "ALERTA - já não aparece Esgotado"
    msg["From"] = email_from
    msg["To"] = email_to

    with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
        server.login(email_from, password)
        server.sendmail(email_from, email_to, msg.as_string())


with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()

    page.goto(URL)

    esgotado = page.query_selector("span.soldout.is-hidden-mobile")

    if esgotado is None:
        print("⚡ 'Esgotado' não encontrado -> enviar email")
        enviar_email(f"Já não aparece 'Esgotado' na página {URL}")
    else:
        print("Ainda aparece 'Esgotado'")

    browser.close()
