import requests
from bs4 import BeautifulSoup
import smtplib
from email.message import EmailMessage
import json
import os
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry
import cloudscraper

# ----------------- CONFIGURAÇÕES -----------------
URLS = [
    'https://bilheteira.fpf.pt/',
    'https://viagens.slbenfica.pt/follow-my-team/futebol',
    'https://viagens.slbenfica.pt/follow-my-team/futebol/primeira-liga-fora',
    'https://viagens.slbenfica.pt/follow-my-team/futebol/primeira-liga-casa',
    'https://viagens.slbenfica.pt/follow-my-team/futebol/taca-de-portugal',
    'https://viagens.slbenfica.pt/follow-my-team/futebol/champions-league',
    'https://viagens.slbenfica.pt/follow-my-team/futebol/taca-da-liga',
    'https://viagens.slbenfica.pt/follow-my-team/futebol/liga-europa',
    'https://viagens.slbenfica.pt/follow-my-team/futebol/supertaca-candido-de-oliveira',
    'https://viagens.slbenfica.pt/follow-my-team/futebol/eusebio-cup',
    'https://www.sporting.pt/pt/bilhetes-e-gamebox/bilhetes',
    'https://2ticket.pt/casapiaac/lista-eventos',  # ✅ CASA PIA
    'https://blueticket.meo.pt/pt/search?q=desporto&page=2'
]

HIST_FILE = 'fpf_hist.json'
EMAIL_FROM = os.getenv("EMAIL_USERNAME")
EMAIL_TO = os.getenv("EMAIL_USERNAME")
EMAIL_PASS = os.getenv("EMAIL_PASSWORD")
SMTP_SERVER = 'smtp.gmail.com'
SMTP_PORT = 587

PALAVRAS_CHAVE_FPF = ["Comprar", "Adquirir", "Bilhete", "Ingressos", "Buy", "IRL", "HUN", "Irlanda", "Hungria"]
PALAVRAS_CHAVE_SLB = ["Carcavelos", "Fatima", "17ª Jornada", "18ª Jornada"]
PALAVRAS_CHAVE_SPORTING = ["comprar bilhetes"]
PALAVRAS_CHAVE_BLUETICKET = ["Benfica"]
PALAVRAS_CHAVE_2TICKET = ["comprar bilhetes"]

def carregar_historico():
    if os.path.exists(HIST_FILE):
        with open(HIST_FILE) as f:
            return json.load(f)
    return []

def guardar_historico(historico):
    with open(HIST_FILE, 'w') as f:
        json.dump(historico, f)

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

            # FPF
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

            # SL Benfica Viagens
            elif 'viagens.slbenfica.pt' in url:
                scraper = cloudscraper.create_scraper()
                try:
                    resp = scraper.get(url, timeout=15)
                    if resp.status_code != 200:
                        print(f"⚠️ Benfica Viagens respondeu com status {resp.status_code}, ignorado.", flush=True)
                        continue

                    soup = BeautifulSoup(resp.text, 'html.parser')
                    texto_site = soup.get_text(separator=' ', strip=True)
                    if any(palavra.lower() in texto_site.lower() for palavra in PALAVRAS_CHAVE_SLB):
                        links_encontrados.append(url)
                        print(f"✅ Encontrada referência a {PALAVRAS_CHAVE_SLB} em Benfica Viagens.", flush=True)

                except Exception as e:
                    print(f"⚠️ Benfica Viagens não respondeu ou bloqueou: {e}", flush=True)
                    continue

            # Sporting
            elif 'sporting.pt' in url:
                headers = {"User-Agent": "Mozilla/5.0"}
                resp = session.get(url, headers=headers, timeout=15)
                if resp.status_code != 200:
                    print(f"⚠️ Sporting respondeu com status {resp.status_code}, ignorado.", flush=True)
                    continue

                soup = BeautifulSoup(resp.text, 'html.parser')
                texto_site = soup.get_text(separator=' ', strip=True).lower()
                if any(palavra in texto_site for palavra in PALAVRAS_CHAVE_SPORTING):
                    links_encontrados.append(url)
                    print(f"✅ Encontrada referência a {PALAVRAS_CHAVE_SPORTING} no Sporting.", flush=True)
                else:
                    print("✅ Sporting verificado, 'comprar bilhetes' não encontrado no momento.", flush=True)

            # Blueticket
            elif 'blueticket.meo.pt' in url:
                headers = {"User-Agent": "Mozilla/5.0"}
                resp = session.get(url, headers=headers, timeout=15)
                if resp.status_code != 200:
                    print(f"⚠️ Blueticket respondeu com status {resp.status_code}, ignorado.", flush=True)
                    continue

                soup = BeautifulSoup(resp.text, 'html.parser')
                texto_site = soup.get_text(separator=' ', strip=True).lower()
                if any(palavra.lower() in texto_site for palavra in PALAVRAS_CHAVE_BLUETICKET):
                    links_encontrados.append(url)
                    print(f"✅ Encontrada referência a {PALAVRAS_CHAVE_BLUETICKET} no Blueticket.", flush=True)
                else:
                    print("✅ Blueticket verificado, 'Benfica' não encontrado no momento.", flush=True)

                    # 2Ticket.pt Casapia
            elif '2ticket.pt/casapiaac/lista-eventos' in url:
                try:
                    scraper = cloudscraper.create_scraper()
                    resp = scraper.get(url, timeout=15)
            
                    if resp.status_code != 200:
                        print(f"⚠️ 2Ticket respondeu com status {resp.status_code}, ignorado.", flush=True)
                        continue
            
                    soup = BeautifulSoup(resp.text, 'html.parser')
                    texto_site = soup.get_text(separator=' ', strip=True).lower()
                    if any(palavra in texto_site for palavra in PALAVRAS_CHAVE_2TICKET):
                        links_encontrados.append(url)
                        print(f"✅ Encontrada referência a {PALAVRAS_CHAVE_2TICKET} no 2Ticket Casapia.", flush=True)
                    else:
                        print("✅ 2Ticket verificado, 'comprar bilhetes' não encontrado no momento.", flush=True)
                except Exception as e:
                    print(f"⚠️ 2Ticket Casapia falhou: {e}", flush=True)
                    continue



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
