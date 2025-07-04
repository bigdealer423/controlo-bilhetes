import requests
from bs4 import BeautifulSoup
import smtplib
from email.message import EmailMessage
import json
import os

# ----------------- CONFIGURAÇÕES -----------------
URLS = [
    'https://bilheteira.fpf.pt/',
    'https://viagens.slbenfica.pt/follow-my-team/futebol'
]
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

PALAVRAS_CHAVE_FPF = ["Comprar", "Adquirir", "Bilhete", "Ingressos", "Buy"]
PALAVRA_CHAVE_SLB = "Sporting"

def buscar_links_novos():
    links_encontrados = []
    for url in URLS:
        try:
            resp = requests.get(url, timeout=15)
            soup = BeautifulSoup(resp.text, 'html.parser')

            # Caso seja o site FPF
            if 'bilheteira.fpf.pt' in url:
                links = [
                    a['href'] if a['href'].startswith('http') else url.rstrip('/') + '/' + a['href'].lstrip('/')
                    for a in soup.find_all('a', href=True)
                    if any(palavra.lower() in a.get_text().lower() for palavra in PALAVRAS_CHAVE_FPF)
                ]
                links_encontrados.extend(links)

            # Caso seja o site Benfica Viagens
            elif 'viagens.slbenfica.pt' in url:
                texto_site = soup.get_text(separator=' ', strip=True)
                if PALAVRA_CHAVE_SLB.lower() in texto_site.lower():
                    links_encontrados.append(url)

        except Exception as e:
            print(f"Erro ao processar {url}: {e}")
    return links_encontrados

def enviar_email(novos_links):
    msg = EmailMessage()
    msg['Subject'] = '⚽ Novos alertas de bilhetes/viagens disponíveis'
    msg['From'] = EMAIL_FROM
    msg['To'] = EMAIL_TO

    corpo = "Foram encontrados os seguintes novos alertas:\n\n" + "\n".join(novos_links)
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
        print("Sem novos alertas no momento.")

if __name__ == '__main__':
    main()
