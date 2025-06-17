from dotenv import load_dotenv
import os
import smtplib

load_dotenv()  # Carrega as variáveis do ficheiro .env

username = os.getenv("EMAIL_USERNAME")
password = os.getenv("EMAIL_PASSWORD")

# DEBUG: Verificar se as variáveis de ambiente estão corretamente carregadas
print("🔍 [DEBUG] Variáveis de ambiente carregadas:")
print(f"EMAIL_USERNAME: {username}")
print(f"EMAIL_PASSWORD: {'****' if password else 'NÃO DEFINIDA'}")
print(f"SMTP_EMAIL: {os.getenv('SMTP_EMAIL')}")
print(f"SMTP_PASS: {'****' if os.getenv('SMTP_PASS') else 'NÃO DEFINIDA'}")
print(f"SMTP_DEST: {os.getenv('SMTP_DEST')}")

import imaplib
import email
from email.header import decode_header
import requests
import re
import unicodedata
from email.utils import parsedate_tz, mktime_tz
from bs4 import BeautifulSoup
from datetime import datetime
import traceback
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart


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
            return "inserido"
        elif resp.status_code == 409:
            print(f"⚠️ Registo {id_venda} já existia.")
            return "existente"
        else:
            print(f"❌ Erro ao inserir registo {id_venda}: {resp.status_code} - {resp.text}")
            return "erro"
    except Exception as e:
        print(f"⚠️ Erro de ligação à API: {e}")
        return "erro"

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

def processar_email(content, data_venda):
    if not content:
        print("⚠️ Conteúdo vazio.")
        return "erro"

    match_id = re.search(r'ID\s*da\s*Encomenda\s*[:\-]?\s*(\d{9})', content, re.IGNORECASE)
    if not match_id:
        match_id = re.search(r'(\d{9})', content)
    if not match_id:
        print("❌ ID da encomenda não encontrado.")
        return "erro"
    id_encomenda = match_id.group(1)
    texto_pos_id = content.split(id_encomenda, 1)[-1]

    match_ganho = re.search(r'Ganhos\s*Totais\s*[:\-]?\s*([\d\s\.,]+)\s*€', texto_pos_id, re.IGNORECASE)
    if not match_ganho:
        print(f"❌ Ganhos não encontrados no ID {id_encomenda}.")
        return "erro"
    valor_str = match_ganho.group(1)
    valor_str = unicodedata.normalize("NFKD", valor_str)
    valor_str = valor_str.replace("\xa0", "").replace(" ", "").replace(",", ".")
    ganho_total = float(valor_str)

    match_evento = re.search(r'Evento\s*[:\-]?\s*(.+)', texto_pos_id, re.IGNORECASE)
    evento = match_evento.group(1).strip() if match_evento else "Desconhecido"

    match_bilhetes = re.search(r'Bilhetes\s*[:\-]?\s*(.+)', texto_pos_id, re.IGNORECASE)
    bilhetes = match_bilhetes.group(1).strip() if match_bilhetes else ""
    bilhetes = re.sub(r'Fila\s*,(?=\s|\()', '', bilhetes, flags=re.IGNORECASE)

    data_evento = None
    data_str = None
    padrao_data_evento = re.compile(r'\w+,\s+\w+\s+\d{2},\s+\d{4}\s+\|\s+\d{2}:\d{2}')

    for linha in texto_pos_id.splitlines():
        if padrao_data_evento.search(linha.strip()):
            data_str = linha.strip()
            break

    if not data_str:
        print(f"⚠️ Linha com data do evento não encontrada no ID {id_encomenda}.")
        return "erro"

    try:
        partes = data_str.split(",")
        if len(partes) < 3:
            raise ValueError("Formato inesperado na data do evento.")

        dia_mes = partes[1].strip()
        ano_hora = partes[2].strip()
        ano = ano_hora.split("|")[0].strip()

        data_formatada = f"{dia_mes} {ano}"
        print(f"🕵️ Data extraída bruta no ID {id_encomenda}: '{data_formatada}'")

        partes_data = data_formatada.strip().split()
        if len(partes_data) != 3:
            print(f"⚠️ Formato inesperado na data do evento: '{data_formatada}'")
            return "erro"

        mes_nome, dia, ano = partes_data
        meses_pt = {
            "janeiro": "01", "fevereiro": "02", "março": "03", "abril": "04",
            "maio": "05", "junho": "06", "julho": "07", "agosto": "08",
            "setembro": "09", "outubro": "10", "novembro": "11", "dezembro": "12"
        }
        mes_num = meses_pt.get(mes_nome.lower(), "01")
        data_evento = datetime.strptime(f"{dia}/{mes_num}/{ano}", "%d/%m/%Y")
    except Exception as e:
        print(f"⚠️ Erro ao interpretar a data do evento no ID {id_encomenda}: {e}")
        return "erro"

    return enviar_para_fastapi(id_encomenda, evento, ganho_total, data_venda, data_evento, bilhetes)

def auto_update_email_data(username, password, date_from="01-May-2025"):
    mail = connect_email(username, password)
    mensagens = search_emails(mail, date_from=date_from)
    print(f"📬 Emails encontrados: {len(mensagens)}")

    sucesso = 0
    falha = 0
    ja_existiam = 0
    ids_erro = []

    for msg_id in mensagens:
        conteudo, data_venda = extract_email_content_and_date(mail, msg_id)
        resultado = processar_email(conteudo, data_venda)

        if resultado == "inserido":
            sucesso += 1
        elif resultado == "existente":
            ja_existiam += 1
        else:
            falha += 1
            match = re.search(r'(\d{9})', conteudo)
            if match:
                ids_erro.append(match.group(1))

  print("\n📊 Resumo:")
    print(f"   Total de e-mails lidos: {len(mensagens)}")
    print(f"   ✅ Registos inseridos com sucesso: {sucesso}")
    print(f"   ⚠️ Registos que já existiam: {ja_existiam}")
    print(f"   ❌ Registos com erro ou incompletos: {falha}")

    resumo = {
        "total_lidos": sucesso + falha + ja_existiam,
        "sucesso": sucesso,
        "existentes": ja_existiam,
        "falhas": falha,
        "ids_falhados": ids_erro
    }

    with open("resumo_leitura.json", "w") as f:
        json.dump(resumo, f, indent=2)

    enviar_resumo_email(
        total_emails=resumo["total_lidos"],
        sucesso=resumo["sucesso"],
        falha=resumo["falhas"],
        ja_existentes=resumo["existentes"],
        ids_erro=ids_erro
    )

def enviar_resumo_email(total_emails, sucesso, falha, ja_existentes, ids_erro=None):
    remetente = os.getenv("SMTP_EMAIL")
    destinatario = os.getenv("SMTP_DEST")
    password = os.getenv("SMTP_PASS")

    ids_erro = ids_erro or []

    print("🔍 [DEBUG] A preparar envio de resumo por e-mail")
    print(f"Remetente: {remetente}")
    print(f"Destinatário: {destinatario}")
    print(f"📊 Emails: total={total_emails}, sucesso={sucesso}, erro={falha}, existentes={ja_existentes}")
    if ids_erro:
        print(f"🔝 IDs com erro: {', '.join(ids_erro)}")

    corpo = f"""
📬 Emails processados: {total_emails}
✅ Inseridos com sucesso: {sucesso}
⚠️ Já existiam: {ja_existentes}
❌ Com erro: {falha}
"""
    if ids_erro:
        corpo += "\n🔝 IDs com erro:\n" + "\n".join(ids_erro)

    msg = MIMEMultipart()
    msg['From'] = remetente
    msg['To'] = destinatario
    msg['Subject'] = "Resumo Diário de Processamento de Emails"
    msg.attach(MIMEText(corpo, 'plain'))

    try:
        print("📡 Ligando ao servidor SMTP...")
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as servidor:
            servidor.login(remetente, password)
            servidor.send_message(msg)
        print("📧 Resumo enviado com sucesso.")
    except Exception as e:
        print(f"❌ Erro ao enviar email de resumo: {e}")
        traceback.print_exc()
import json



if __name__ == "__main__":
    auto_update_email_data(username, password)
