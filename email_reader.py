import imaplib
import email
from email.header import decode_header
import re
import requests
from email.utils import parsedate_tz, mktime_tz
from datetime import datetime
from bs4 import BeautifulSoup

def enviar_para_fastapi(id_venda, evento, ganho, data_venda, data_evento, bilhetes):
    url = "https://controlo-bilhetes.onrender.com/listagem_vendas"
    payload = {
        "id_venda": int(id_venda),
        "evento": evento,
        "ganho": round(float(ganho)),
        "data_venda": data_venda.strftime("%Y-%m-%d"),
        "data_evento": data_evento.strftime("%Y-%m-%d"),
        "estadio": bilhetes,
        "estado": "Por entregar"
    }
    try:
        resp = requests.post(url, json=payload)
        if resp.status_code == 200:
            print(f"✅ Registo {id_venda} inserido com sucesso.")
        elif resp.status_code == 409:
            print(f"⚠️ Registo {id_venda} já existe.")
        else:
            print(f"❌ Erro ao inserir registo {id_venda}: {resp.status_code} - {resp.text}")
    except Exception as e:
        print(f"⚠️ Erro de ligação à API: {e}")


def connect_email(username, password):
    mail = imaplib.IMAP4_SSL("imap.gmail.com")
    mail.login(username, password)
    return mail

def search_emails(mail, subject="Os seus bilhetes foram vendidos", sender="viagogo", date_from="01-May-2025"):
    mail.select("inbox")
    date_str = datetime.strptime(date_from, "%d-%b-%Y").strftime("%d-%b-%Y")
    status, messages = mail.search(None, f'(SUBJECT "{subject}" FROM "{sender}" SINCE {date_str})')
    return messages[0].split()

def extract_email_content_and_date(mail, email_id):
    _, msg = mail.fetch(email_id, "(RFC822)")
    for response_part in msg:
        if isinstance(response_part, tuple):
            msg = email.message_from_bytes(response_part[1])
            raw_date = msg["Date"]
            data_venda = datetime.fromtimestamp(mktime_tz(parsedate_tz(raw_date)))

            for part in msg.walk():
                if part.get_content_type() == "text/html":
                    html = part.get_payload(decode=True).decode(errors='ignore')
                    content = BeautifulSoup(html, "html.parser").get_text()
                    return content, data_venda
                elif part.get_content_type() == "text/plain":
                    text = part.get_payload(decode=True).decode(errors='ignore')
                    return text, data_venda
    return "", datetime.now()

def extrair_data_evento(texto):
    match_data = re.search(r'Data\s*[:\-]?\s*(\d{2}/\d{2}/\d{4})', texto, re.IGNORECASE)
    if match_data:
        try:
            return datetime.strptime(match_data.group(1), "%d/%m/%Y")
        except:
            return datetime.now()
    return datetime.now()

def processar_email(content, data_venda):
    if not content:
        print("⚠️ Conteúdo vazio.")
        return

    match_id = re.search(r'ID\s*da\s*Encomenda\s*[:\-]?\s*(\d{9})', content, re.IGNORECASE)
    if not match_id:
        match_id = re.search(r'(\d{9})', content)
    if not match_id:
        print("❌ ID da encomenda não encontrado.")
        return
    id_encomenda = match_id.group(1)
    texto_pos_id = content.split(id_encomenda, 1)[-1]

    match_ganho = re.search(r'Ganhos\s*Totais\s*[:\-]?\s*([0-9\.,]+)\s*€', texto_pos_id, re.IGNORECASE)
    if not match_ganho:
        print("❌ Ganhos não encontrados.")
        return
    ganho_total = float(match_ganho.group(1).replace(",", "."))

    match_bilhetes = re.search(r'Evento\s*[:\-]?\s*(.+)', texto_pos_id, re.IGNORECASE)
    bilhetes = match_bilhetes.group(1).strip() if match_bilhetes else ""

    match_evento = re.search(r'(.+?)\s*ID\s*da\s*Encomenda', content, re.IGNORECASE)
    evento = match_evento.group(1).strip() if match_evento else "Desconhecido"

    match_data = re.search(r'Data\s*[:\-]?\s*(\d{2}/\d{2}/\d{4})', texto_pos_id, re.IGNORECASE)
    if match_data:
        try:
            data_evento = datetime.strptime(match_data.group(1), "%d/%m/%Y")
        except:
            data_evento = datetime.now()
    else:
        print("⚠️ Data do evento não encontrada. Usando hoje.")
        data_evento = datetime.now()

    enviar_para_fastapi(id_encomenda, evento, ganho_total, data_venda, data_evento, bilhetes)

def auto_update_email_data(username, password, date_from="01-May-2025"):
    mail = connect_email(username, password)
    mensagens = search_emails(mail, date_from=date_from)
    print(f"📬 Emails encontrados: {len(mensagens)}")

    for msg_id in mensagens:
        conteudo, data_venda = extract_email_content_and_date(mail, msg_id)
        processar_email(conteudo, data_venda)

# ========================
# Executar
# ========================
username = "miguelitocosta423@gmail.com"
password = "jtjoqyssexqtvwae"
auto_update_email_data(username, password)

