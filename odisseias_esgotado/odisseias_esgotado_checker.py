from playwright.sync_api import sync_playwright
import os
import smtplib
from email.mime.text import MIMEText

URL = "https://viagens.slbenfica.pt/programas/sporting-cp-vs-sl-benfica-30-jornada-com-almoco/1005818#ps:4c043c43-1ebb-4796-a9d7-8c921df3789f/ps:e72ebad9-8e71-4989-bebf-eeb6c60a9ed2/ps:1b35e567-5c05-4909-bbaf-d61f2730faf3/ps:fd12648f-d196-4316-a02f-501ddac23f2f/ps:94bb73db-dddf-4a24-8f2a-8df30cb1d023/ps:81f27aba-6e24-46c4-a09a-0ccacbfcda45/ps:70b6a374-c1c0-408a-a9d3-49d7b0608d1a/ps:7a5542a5-c431-4c7b-b8f5-1f782ccd9003/ps:7f5123be-9e25-4a83-a33e-658e7aa95058/ps:cfe504e2-34b8-41fe-b10d-9f2f359557e7/ps:503f11d2-d3e5-4727-b0a1-92c65dd7afe9/ps:5b1cc57e-56c5-47a4-a8aa-9137205e5195/ps:7db844c5-6e88-4ac7-b456-224f1a23f48c/ps:804a4d3f-b201-4071-a6ce-efe1f0db4209"


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
