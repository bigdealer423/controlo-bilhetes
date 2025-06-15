import imaplib
import email
from email.header import decode_header
import re
import requests
from email.utils import parsedate_tz, mktime_tz
from datetime import datetime
from bs4 import BeautifulSoup

# ========================
# Função para enviar dados para a sua API
# ========================
def enviar_para_fastapi(id_venda, evento, ganho):
    url_base = "https://controlo-bilhetes.onrender.com/listagem_vendas"
    
    # 1. Verificar se já existe este ID na base de dados
    try:
        resposta = requests.get(url_base)
        if resposta.status_code == 200:
            dados = resposta.json()
            if any(int(reg['id_venda']) == int(id_venda) for reg in dados):
                print(f"⚠️ ID {id_venda} já existe. Ignorado.")
                return
        else:
            print(f"⚠️ Erro ao verificar duplicado: {resposta.status_code}")
            return
    except Exception as e:
        print(f"⚠️ Erro ao consultar registos existentes: {e}")
        return

    # 2. Se não existir, inserir novo registo
    payload = {
        "id_venda": int(id_venda),
        "evento": evento,
        "ganho": float(ganho),
        "data_evento": datetime.now().strftime("%Y-%m-%d"),
        "estadio": "",
        "estado": "Por entregar"
    }
    try:
        resp = requests.post(url_base, json=payload)
        if resp.status_code == 200:
            print(f"✅ Registo {id_venda} inserido com sucesso.")
        else:
            print(f"❌ Erro ao inserir registo {id_venda}: {resp.status_code} - {resp.text}")
    except Exception as e:
        print(f"⚠️ Erro de ligação à API: {e}")


# ========================
# Ligação ao Email
# ========================
def connect_email(username, password):
    mail = imaplib.IMAP4_SSL("imap.gmail.com")
    mail.login(username, password)
    return mail

def search_emails(mail, subject="Os seus bilhetes foram vendidos", sender="viagogo", date_from="01-May-2025"):
    mail.select("inbox")
    date_str = datetime.strptime(date_from, "%d-%b-%Y").strftime("%d-%b-%Y")
    status, messages = mail.search(None, f'(SUBJECT "{subject}" FROM "{sender}" SINCE {date_str})')
    message_ids = messages[0].split()
    email_infos = []

    for msg_id in message_ids:
        _, msg_data = mail.fetch(msg_id, "(RFC822)")
        for response_part in msg_data:
            if isinstance(response_part, tuple):
                msg = email.message_from_bytes(response_part[1])
                raw_date = msg["Date"]
                parsed = parsedate_tz(raw_date)
                dt = datetime.fromtimestamp(mktime_tz(parsed))
                data_venda = dt.strftime("%Y-%m-%d")
                email_infos.append((msg_id, data_venda))

    return email_infos

def extract_email_content(mail, email_id):
    _, msg = mail.fetch(email_id, "(RFC822)")
    for response_part in msg:
        if isinstance(response_part, tuple):
            msg = email.message_from_bytes(response_part[1])
            for part in msg.walk():
                if part.get_content_type() == "text/html":
                    html = part.get_payload(decode=True).decode(errors='ignore')
                    return BeautifulSoup(html, "html.parser").get_text()
                elif part.get_content_type() == "text/plain":
                    return part.get_payload(decode=True).decode(errors='ignore')
    return ""

# ========================
# Processamento dos emails
# ========================
def processar_email(content):
    if not content:
        print("⚠️ Conteúdo vazio. Ignorado.")
        return

    match_id = re.search(r'ID\s*da\s*Encomenda\s*[:\-]?\s*(\d{9})', content, re.IGNORECASE)
    if not match_id:
        match_id = re.search(r'(\d{9})', content)
    if not match_id:
        print("❌ ID da encomenda não encontrado.")
        return
    id_encomenda = match_id.group(1)

    match_ganho = re.search(r'Ganhos\s*Totais\s*[:\-]?\s*([0-9\.,]+)\s*€', content, re.IGNORECASE)
    if not match_ganho:
        print("❌ Ganhos não encontrados.")
        return
    ganho_total = float(match_ganho.group(1).replace(",", "."))

    evento_pos_id = content.split(id_encomenda, 1)[-1]
    match_evento = re.search(r'Evento\s*[:\-]?\s*([A-Za-z\s]+)', evento_pos_id, re.IGNORECASE)
    if not match_evento:
        print("❌ Evento não encontrado.")
        return
    evento = match_evento.group(1).strip()

    if "Notas do vendedor" in evento:
        evento = evento.split("Notas do vendedor")[0].strip()

    # Enviar à API
    enviar_para_fastapi(id_encomenda, evento, ganho_total)

# ========================
# Execução principal
# ========================
def auto_update_email_data(username, password, date_from="01-May-2025"):
    mail = connect_email(username, password)
    mensagens = search_emails(mail, date_from=date_from)
    print(f"📬 Emails encontrados: {len(mensagens)}")

    for msg_id in mensagens:
        conteudo = extract_email_content(mail, msg_id)
        processar_email(conteudo)

# ========================
# Configurações do utilizador
# ========================
username = "miguelitocosta423@gmail.com"
password = "jtjoqyssexqtvwae"
auto_update_email_data(username, password)
