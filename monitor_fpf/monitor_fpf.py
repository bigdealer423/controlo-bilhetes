import requests
from bs4 import BeautifulSoup
import smtplib
from email.message import EmailMessage
import json
import os

# ----------------- CONFIGURAÇÕES -----------------
URL = 'https://bilheteira.fpf.pt/'
HIST_FILE = 'fpf_hist.json'
EMAIL_FROM = os.getenv("EMAIL_USERNAME")
EMAIL_TO = os.getenv("EMAIL_USERNAME")
EMAIL_PASS = os.getenv("EMAIL_PASSWORD")  # guardado em Environment no Render
SMTP_SERVER = 'smtp.gmail.com'
SMTP_PORT = 587

# --------------------------------------------------

def carregar_historico():
    if os.path.exists(HIST_FILE):
        with open(HIST_FILE) as f:
            return json.load(f)
    return []

def guardar_historico(historico):
    with open(HIST_FILE, 'w') as f:
        json.dump(historico, f)

def buscar_links_novos():
    resp = requests.get(URL, timeout=15)
    soup = BeautifulSoup(resp.text, 'html.parser')
    links = [a['href'] for a in soup.find_all('a', href=True) if 'Comprar' in a.get_text()]
    return links


def enviar_email(novos_links):
    msg = EmailMessage()
    msg['Subject'] = '⚽ FPF - Nova venda de bilhetes disponível'
    msg['From'] = EMAIL_FROM
    msg['To'] = EMAIL_TO
    corpo = "Novas vendas de bilhetes disponíveis:\n\n" + "\n".join(novos_links) + "\n\nLink direto: " + URL
    msg.set_content(corpo)

    with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as smtp:
        smtp.starttls()
        smtp.login(EMAIL_FROM, EMAIL_PASS)
        smtp.send_message(msg)
        print("✅ Email enviado com sucesso.")

def main():
    historico = carregar_historico()
    links_atuais = buscar_links_novos()
    novos = [link for link in links_atuais if link not in historico]

    if novos:
        enviar_email(novos)
        historico.extend(novos)
        guardar_historico(historico)
    else:
        print("Sem novos bilhetes no momento.")

if __name__ == '__main__':
    main()
