import requests
from bs4 import BeautifulSoup
import smtplib
from email.message import EmailMessage
import json
import os
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry
import cloudscraper
from urllib.parse import urljoin
import unicodedata
import re

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
    'https://blueticket.meo.pt/pt/search?q=desporto&page=2'
]

HIST_FILE = 'fpf_hist.json'
EMAIL_FROM = os.getenv("EMAIL_USERNAME")
EMAIL_TO = os.getenv("EMAIL_USERNAME")
EMAIL_PASS = os.getenv("EMAIL_PASSWORD")
SMTP_SERVER = 'smtp.gmail.com'
SMTP_PORT = 587

PALAVRAS_CHAVE_FPF = ["Comprar", "Adquirir", "Bilhete", "Ingressos", "Buy", "IRL", "HUN", "Irlanda", "Hungria", "Saber Mais"]
PALAVRAS_CHAVE_SLB = ["Carcavelos", "Fatima", "17ª Jornada", "18ª Jornada"]
PALAVRAS_CHAVE_SPORTING = ["Arouca"]
PALAVRAS_CHAVE_BLUETICKET = ["Benfica"]
PALAVRAS_CHAVE_2TICKET = [""]


def _normalize_text(s: str) -> str:
    if not s:
        return ""
    # normaliza acentos + troca NBSP por espaço normal + colapsa espaços
    s = unicodedata.normalize("NFKC", s).replace("\xa0", " ")
    s = re.sub(r"\s+", " ", s)
    return s.strip().lower()
    
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
                # usar cloudscraper para contornar cloudflare + headers reais
                scraper = cloudscraper.create_scraper(
                    browser={'custom': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 '
                                       '(KHTML, like Gecko) Chrome/124.0 Safari/537.36'}
                )
                headers = {
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                                  "(KHTML, like Gecko) Chrome/124.0 Safari/537.36",
                    "Accept-Language": "pt-PT,pt;q=0.9,en;q=0.8"
                }
                resp = scraper.get(url, headers=headers, timeout=20, allow_redirects=True)
                if resp.status_code != 200:
                    print(f"⚠️ FPF respondeu com status {resp.status_code}, ignorado.", flush=True)
                    continue

                soup = BeautifulSoup(resp.text, 'html.parser')
                keys = [_normalize_text(k) for k in PALAVRAS_CHAVE_FPF]

                candidatos = []

                # 1) âncoras com href (ex.: <a ...> Saber Mais </a>)
                for a in soup.find_all('a', href=True):
                    txt = _normalize_text(a.get_text(" ", strip=True))
                    attrs = _normalize_text(" ".join([
                        str(a.get(attr, "")) for attr in ["aria-label", "title", "data-ga-label"]
                    ]))
                    if any(k in txt or k in attrs for k in keys):
                        href = a['href']
                        full = href if href.startswith('http') else urljoin(url, href)
                        candidatos.append(full)

                # 2) botões/spans/divs com texto correspondente (fallback)
                for tag in soup.find_all(['button', 'span', 'div']):
                    txt = _normalize_text(tag.get_text(" ", strip=True))
                    attrs = _normalize_text(" ".join([
                        str(tag.get(attr, "")) for attr in ["aria-label", "title", "data-ga-label"]
                    ]))
                    if any(k in txt or k in attrs for k in keys):
                        parent_a = tag.find_parent('a', href=True) or tag.find('a', href=True)
                        if parent_a and parent_a.get('href'):
                            href = parent_a['href']
                            full = href if href.startswith('http') else urljoin(url, href)
                            candidatos.append(full)
                        else:
                            candidatos.append(url)  # sem href direto, mas há match na página

                # deduplicar preservando ordem
                vistos = set()
                candidatos = [c for c in candidatos if not (c in vistos or vistos.add(c))]

                if candidatos:
                    links_encontrados.extend(candidatos)
                    # debug útil para confirmar captação do "Saber Mais"
                    print("✅ FPF: matches:", *candidatos, sep="\n  - ", flush=True)
                else:
                    # fallback por texto global (menos preciso)
                    texto_site = _normalize_text(soup.get_text(" ", strip=True))
                    if any(k in texto_site for k in keys):
                        links_encontrados.append(url)
                        print("✅ FPF: match por texto global (fallback).", flush=True)
                    else:
                        print("✅ FPF verificado, nenhum match nas palavras-chave agora.", flush=True)

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
