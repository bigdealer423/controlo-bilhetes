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

PALAVRAS_CHAVE_FPF = ["COMPRAR", "Adquirir", "Ingressos", "Buy", "IRL", "HUN", "Irlanda", "Hungria", "Estádio José Alvalade"]
PALAVRAS_CHAVE_SLB = ["Carcavelos"]
PALAVRAS_CHAVE_SPORTING = ["Arouca"]
PALAVRAS_CHAVE_BLUETICKET = ["Benfica"]
PALAVRAS_CHAVE_2TICKET = [""]


INVISIBLES_RE = re.compile(
    r"[\u00ad\u034f\u061c\u115f\u1160\u17b4\u17b5\u180e\u200b-\u200f\u2028\u2029\u202a-\u202e\u2060-\u2064\u2066-\u206f\ufeff]"
)


def encontrar_palavras_em_html(html: str, keys: list[str]) -> list[str]:
    """Devolve a lista de keywords encontradas no HTML normalizado."""
    t = _norm(html or "")
    achadas = []
    for k in keys:
        kk = _norm(k)
        if kk and kk in t:
            achadas.append(k)
    return achadas
    
def scan_scripts_for_keywords(soup, keys, base_url):
    hits = []
    for sc in soup.find_all("script"):
        raw = (sc.string or sc.get_text() or "")
        if not raw:
            continue
        raw_n = _norm(raw)
        for k in keys:
            kk = _norm(k)
            if kk and kk in raw_n:
                hits.append({
                    "site": "FPF",
                    "palavra": k,
                    "origem": "script",
                    "url": base_url,
                    "snippet": f"...{k}..."
                })
                break
    return hits

def _normalize_text(s: str) -> str:
    if not s:
        return ""
    # NFKC para compatibilidade, remove NBSP e invisíveis (inclui soft-hyphen),
    # colapsa espaços e faz casefold (mais robusto que lower)
    s = unicodedata.normalize("NFKC", s)
    s = s.replace("\xa0", " ")
    s = INVISIBLES_RE.sub("", s)
    s = re.sub(r"\s+", " ", s)
    return s.strip().casefold()

_norm = _normalize_text

def match_key(texto: str, keys: list[str]):
    """Devolve (palavra, 'text') se encontrar; senão None."""
    t = _norm(texto)
    for k in keys:
        kk = _norm(k)
        if kk and kk in t:
            return k, "text"
    return None

def match_key_attrs(tag, keys: list[str], attrs=("aria-label","title","data-ga-label","class","alt","data-label","data-title")):
    joined = _norm(" ".join([str(tag.get(a, "")) for a in attrs]))
    for k in keys:
        kk = _norm(k)
        if kk and kk in joined:
            return k, f"attrs[{','.join(attrs)}]"
    return None

def snippet(s: str, n=80) -> str:
    s = _norm(s or "")
    return (s[:n] + "…") if len(s) > n else s


    
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
            # FPF
            if 'bilheteira.fpf.pt' in url:
                scraper = cloudscraper.create_scraper(
                    browser={'custom': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/124 Safari/537.36'}
                )
                headers = {
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win32; x64) Chrome/124 Safari/537.36",
                    "Accept-Language": "pt-PT,pt;q=0.9,en;q=0.8"
                }
                resp = scraper.get(url, headers=headers, timeout=20, allow_redirects=True)
                if resp.status_code != 200:
                    print(f"⚠️ FPF respondeu com status {resp.status_code}, ignorado.", flush=True)
                    continue
            
                # 👉 SIMPLIFICADO: procura diretamente no HTML bruto (apanha texto, alt e JSON em <script>)
                encontrados = encontrar_palavras_em_html(resp.text, PALAVRAS_CHAVE_FPF)
            
                if encontrados:
                    print(f"✅ FPF match: {', '.join(encontrados)} | url={url}", flush=True)
                    links_encontrados.append(url)  # mantém o teu comportamento de acrescentar o URL
                else:
                    print("✅ FPF verificado, nenhum match nas palavras-chave agora.", flush=True)
            
                # passa ao próximo URL (não precisa de BeautifulSoup/candidatos/deduplicação aqui)
                continue



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
