from playwright.sync_api import sync_playwright, TimeoutError as PlaywrightTimeoutError
import os
import smtplib
from email.mime.text import MIMEText

URL = "https://viagens.slbenfica.pt/programas/sporting-cp-vs-sl-benfica-30-jornada-com-almoco/1005818#ps:4c043c43-1ebb-4796-a9d7-8c921df3789f/ps:e72ebad9-8e71-4989-bebf-eeb6c60a9ed2/ps:1b35e567-5c05-4909-bbaf-d61f2730faf3/ps:fd12648f-d196-4316-a02f-501ddac23f2f/ps:94bb73db-dddf-4a24-8f2a-8df30cb1d023/ps:81f27aba-6e24-46c4-a09a-0ccacbfcda45/ps:70b6a374-c1c0-408a-a9d3-49d7b0608d1a/ps:7a5542a5-c431-4c7b-b8f5-1f782ccd9003/ps:7f5123be-9e25-4a83-a33e-658e7aa95058/ps:cfe504e2-34b8-41fe-b10d-9f2f359557e7/ps:503f11d2-d3e5-4727-b0a1-92c65dd7afe9/ps:5b1cc57e-56c5-47a4-a8aa-9137205e5195/ps:7db844c5-6e88-4ac7-b456-224f1a23f48c/ps:804a4d3f-b201-4071-a6ce-efe1f0db4209/ps:c078f1bd-b52f-420e-a676-e32c0f8f4536/ps:a2349d82-543d-4686-9c84-224b96111ff0/ps:ad364576-3f96-4edc-9c55-bb079f6582d3/ps:87e3b869-805c-4611-ae22-0f075b0d44dc/ps:6e1da060-bb33-46fc-8a5d-611faf90df46/ps:de9ecf85-5dbd-4cfe-b7d8-18391f707656/ps:1b1f31fa-250d-46aa-aef7-0f6d3233705e/ps:c8968b3e-8d28-4cd3-8328-3c79bc654986/ps:19afaf2e-f421-4449-8f4c-a507afa3844b/ps:374617c4-cfc8-4b77-a97c-4d9c2ea78fed/ps:0d9f3ea6-f05c-4a39-9bbc-2fd4e893eeb1/ps:aac7e739-0923-40f7-997c-4ad0daebfbfd/ps:ca1c4788-6de5-4728-a078-c148dbc60b10/ps:e425f44f-1d3f-4e67-881f-1e230930b457/ps:037c151a-b15d-4b8d-8f85-234823aad68f/ps:5ccd35aa-07c2-4e61-ae08-9a80677c2b42/ps:de9aa376-a6fb-4054-9d0f-fc7b39c42e14/ps:8b5d59c4-5fbf-4403-88ce-4680719cdf8d/ps:695b70fb-009e-4feb-b605-264513bebd53/ps:9d463764-a280-4ad9-84e7-ff814a2994be/ps:e5ad40a6-c0d8-4224-b674-4d09edcef10a/ps:9c730f38-2d82-4523-8a46-76ac4cdd8c28/ps:7154bbd3-8ab2-4a00-aa37-2b5aa9382be0/ps:d0831618-bfcb-4f49-afee-16e5230bb114/ps:f80a0b05-db8a-4bff-9b73-1e6f4799882d/ps:9b2ec8fa-f091-41be-bdb6-3c8ff22d9a0c/ps:ae3c905c-41d7-4614-a710-b71ec290c450/ps:e69388af-3334-43f0-97d4-2b24f9621e4f/ps:eef62f73-2cab-4390-9260-034ffd666f5a/ps:6d9b4d2c-976b-4af9-a5e0-4d8a1845c443/ps:7df282c0-2f23-402e-a3a9-77d9640cdf9c/ps:34d69310-0a2b-46d2-8db8-e10d04237dd4/ps:f7fc73b8-60c6-42c7-973f-a77a4cafed6a/ps:c7e78b06-3f90-461c-a312-0121f7649ff8/ps:7c06a17c-6e1f-4787-b1e5-74d313b20ce5/ps:e07ee305-a1c9-4556-896f-08c083227697/ps:537996bc-dc2e-4c20-9e93-7b557e67a331/ps:29162ea9-a34a-4033-be66-b5b7b34f5765/ps:adae6fdb-a6e3-4581-a349-dd5f4e44540b/ps:23d76b50-5c2d-4d25-8f5a-d07d5c6bf386/ps:6a5a900a-d995-4327-a8ae-ab7d7be1a4dd/ps:c8bb09e1-c5cf-4fe4-a7b1-3862b16d3a64/ps:3f9c23c7-fecd-490b-86d1-acff49fed899/ps:13cbcc1c-123b-4ca1-8902-bd47f9eba178/ps:a8a7cfeb-77e4-435e-95df-5c82c7730f80/ps:7448b20c-99f1-47cb-aea6-f6e3eb315ece/ps:ae14aa7f-b831-4fed-a868-4868bd5c419a/ps:38ad636d-a7cc-4aa0-80fc-7c74e5a37c2e/ps:102cfe80-a05e-4f89-8f47-064bfff21082/ps:186c6170-ab73-4b53-9b03-b0b624bdb0c5/ps:32d9a5d1-65c4-4459-b758-96d22a9d6a6b/ps:9c11cf35-b621-482c-98ee-d3e54af5b52c/ps:c9301256-0a1b-4ea6-8141-9a00fd418036/ps:78fd89ee-6f64-42fe-a8d5-cf69169f0395/ps:dc38acd2-480f-4476-b3ce-2ab829564655/ps:3fd42582-e1ab-4304-ac01-9046817483fb/ps:5df09c71-5299-4d87-a91c-49d03d536b45/ps:2b3417ec-b759-4dc4-b3d4-ef79a2970f0b/ps:966d0a02-90d4-429e-8fb4-6994ca7f642b/ps:6b74fb20-3219-43da-8a25-367a36924fbf/ps:b4fae182-9cff-4621-9a22-5dd70aac566c/ps:8d63b7da-f4f8-4a5c-ab4d-b37812dcdf61/ps:d829450e-5cc2-4fc1-8608-acb27bcd4d4a/ps:236f638d-1a46-4311-a556-f023875abe48/ps:cbe5e101-be9c-4dfb-bed7-fb22a0723c15/ps:26177c60-c3d8-40e8-986b-a181a38e4026/ps:568b8076-233e-4f87-9da3-717b4f7af8a4/ps:5528bed3-b7cc-4900-a8ed-83f9c3b0ad90/ps:47511114-6635-4d73-a078-4e4ed2df0b88/ps:550df7a6-f851-467c-9d53-54591a370c51/ps:1dd33da7-f9a6-4cc1-a778-3bbe33b9e820/ps:f40e49de-62b4-40b3-ba75-8587b7b77765/ps:6677143d-dcc7-401b-8436-b1183219f061/ps:16624b31-58a7-4471-bd94-36227e12fa91/ps:2546b3a5-f7fa-434e-9b86-13fa380d1864/ps:8b53a7bf-4fdd-44ba-9f8b-81842847ce49/ps:61910d76-d7a3-433e-ac25-0e7ff217c632/ps:cbb7defd-a65f-47b7-8ad3-ab31b173ae91/ps:5699a8b0-b44f-4356-9330-09dac9778cfb/ps:7872c7c4-bcc5-473f-a2de-76aeb2715ba6/ps:ccd6e694-eb94-44ac-942b-1644a0028b7b"

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
    browser = p.chromium.launch(
        headless=True,
        args=["--no-sandbox", "--disable-setuid-sandbox"]
    )
    page = browser.new_page()

    print("A abrir página...")
    page.goto(URL, wait_until="domcontentloaded", timeout=60000)

    # esperar um pouco para a página renderizar conteúdo dinâmico
    page.wait_for_timeout(10000)

    # tentar esperar pelo elemento 'Esgotado'
    try:
        page.wait_for_selector("span.soldout.is-hidden-mobile", timeout=10000)
    except PlaywrightTimeoutError:
        print("Elemento 'Esgotado' não apareceu dentro do tempo de espera.")

    esgotado = page.query_selector("span.soldout.is-hidden-mobile")

    if esgotado is None:
        print("⚡ 'Esgotado' não encontrado -> enviar email")
        enviar_email(f"Já não aparece 'Esgotado' na página {URL}")
    else:
        texto = (esgotado.inner_text() or "").strip().lower()
        print(f"Elemento encontrado com texto: {texto}")

        if "esgotado" in texto:
            print("Ainda aparece 'Esgotado'")
        else:
            print("Elemento existe mas o texto não é 'Esgotado' -> enviar email")
            enviar_email(f"O elemento existe mas já não mostra 'Esgotado' na página {URL}")

    browser.close()
