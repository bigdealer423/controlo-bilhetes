import requests
from bs4 import BeautifulSoup
import smtplib
from email.message import EmailMessage
import json
import os
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

# ----------------- CONFIGURAÇÕES -----------------
URLS = [
    'https://bilheteira.fpf.pt/',
    'https://viagens.slbenfica.pt/follow-my-team/futebol'
]
HIST_FILE = 'fpf_hist.json'
EMAIL_FROM = os.getenv("EMAIL_USERNAME")
EMAIL_TO = os.getenv("EMAIL_USERNAME")
EMAIL_PASS = os.getenv("EMAIL_PASSWORD")
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

    session = requests.Session()
    retry = Retry(connect=2, backoff_factor=1)
    adapter = HTTPAdapter(max_retries=retry)
    session.mount('https://', adapter)
    session.mount('http://', adapter)

    for url in URLS:
        try:
            print(f"🔍 A verificar {url}...", flush=True)

            # Se for FPF, ignorar HEAD, fazer GET diretamente
            if 'bilheteira.fpf.pt' in url:
                resp = session.get(url, timeout=15)
                soup = BeautifulSoup(resp.text, 'html.parser')
                links = [
                    a['href'] if a['href'].startswith('http') else url.rstrip('/') + '/' + a['href'].lstrip('/')
                    for a in soup.find_all('a', href=True)
                    if any(palavra.lower() in a.get_text().lower() for palavra in PALAVRAS_CHAVE_FPF)
                ]
                if links:
                    links_encontrados.extend(links)
                    print(f"✅ Encontrados {len(links)} novos links na FPF.", flush=True)

            # Se for Benfica Viagens, fazer HEAD antes de GET
            elif 'viagens.slbenfica.pt' in url:
                head_resp = session.head(url, timeout=10)
                if head_resp.status_code != 200:
                    print(f"⚠️ HEAD falhou em {url} (status {head_resp.status_code}), a ignorar.", flush=True)
                    continue

                resp = session.get(url, timeout=15)
                soup = BeautifulSoup(resp.text, 'html.parser')
                texto_site = soup.get_text(separator=' ', strip=True)
                if PALAVRA_CHAVE_SLB.lower() in texto_site.lower():
                    links_encontrados.append(url)
                    print(f"✅ Encontrada referência a '{PALAVRA_CHAVE_SLB}' em Benfica Viagens.", flush=True)

        except Exception as e:
            print(f"❌ Erro ao processar {url}: {e}", flush=True)
            continue

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
        print("✅ Email enviado com sucesso.", flush=True)

def main():
    print("🚀 Início do monitoramento de bilhetes/viagens...", flush=True)
    historico = carregar_historico()
    links_atuais = buscar_links_novos()
    novos = [link for link in links_atuais if link not in historico]

    if novos:
        enviar_email(novos)
        historico.extend(novos)
        guardar_historico(historico)
    else:
        print("✅ Sem novos alertas no momento.", flush=True)

if __name__ == '__main__':
    main()
