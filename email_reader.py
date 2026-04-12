
PERIODO_DIAS = 2

from dateutil.parser import parse
from dotenv import load_dotenv
import os
import smtplib
import time
import json


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
from datetime import datetime, timedelta
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
            return {
                "estado": "inserido",
                "registo": {
                    "evento": evento,
                    "estadio": bilhetes,
                    "ganho": round(float(ganho))
                }
            }
        elif resp.status_code == 409:
            print(f"⚠️ Registo {id_venda} já existia.")
            return {"estado": "existente"}
        else:
            print(f"❌ Erro ao inserir registo {id_venda}: {resp.status_code} - {resp.text}")
            return {"estado": "erro"}
    except Exception as e:
        print(f"⚠️ Erro de ligação à API: {e}")
        return {"estado": "erro"}

def connect_email(username, password):
    mail = imaplib.IMAP4_SSL("imap.gmail.com")
    mail.login(username, password)
    return mail

def search_emails(mail, subject="Os seus bilhetes foram vendidos", sender="viagogo", date_from=None):
    mail.select("inbox")
    if date_from is None:
        date_from = (datetime.today() - timedelta(days=PERIODO_DIAS)).strftime("%d-%b-%Y")
    else:
        date_from = datetime.strptime(date_from, "%d-%b-%Y").strftime("%d-%b-%Y")
        
    status, messages = mail.search(None, f'(SUBJECT "{subject}" FROM "{sender}" SINCE {date_from})')
    return messages[0].split()


def extract_email_content_and_date(mail, email_id):
    _, msg = mail.fetch(email_id, "(RFC822)")
    for response_part in msg:
        if isinstance(response_part, tuple):
            msg = email.message_from_bytes(response_part[1])
            raw_date = msg["Date"]
            data_venda = datetime.fromtimestamp(mktime_tz(parsedate_tz(raw_date)))

            # ⚠️ Nova lógica: concatenar todo o conteúdo visível
            full_content = ""
            
            for part in msg.walk():
                if part.get_content_type() == "text/html":
                    html = part.get_payload(decode=True).decode(errors='ignore')
                    content = BeautifulSoup(html, "html.parser").get_text()
                    return content, data_venda
                elif part.get_content_type() == "text/plain":
                    text = part.get_payload(decode=True).decode(errors='ignore')
                    return text, data_venda

            # Prioridade ao texto completo (html com fallback)
            content = BeautifulSoup(full_content, "html.parser").get_text()
            return content, data_venda
            
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

def extract_stubhub_email_content_and_date(mail, email_id):
    _, msg = mail.fetch(email_id, "(RFC822)")
    for response_part in msg:
        if isinstance(response_part, tuple):
            msg = email.message_from_bytes(response_part[1])
            raw_date = msg["Date"]
            data_venda = datetime.fromtimestamp(mktime_tz(parsedate_tz(raw_date)))

            # Forçar a usar HTML e limpar com BeautifulSoup
            for part in msg.walk():
                if part.get_content_type() == "text/html":
                    try:
                        html = part.get_payload(decode=True).decode(errors='ignore')
                        soup = BeautifulSoup(html, "html.parser")
                        texto = soup.get_text(separator="\n")
                        print("\n🧾 Conteúdo completo extraído do email StubHub:\n")
                        print(texto[:3000])  # Mostra os primeiros 3000 caracteres
                        return texto, data_venda
                    except Exception as e:
                        print("Erro ao processar HTML StubHub:", e)
                        continue

    return "", datetime.now()

def search_emails_stubhub(mail, date_from=None):
    mail.select("inbox")
    if date_from is None:
        date_from = (datetime.today() - timedelta(days=PERIODO_DIAS)).strftime("%d-%b-%Y")
    else:
        date_from = datetime.strptime(date_from, "%d-%b-%Y").strftime("%d-%b-%Y")

    # ⚠️ Não usamos aspas no SUBJECT para permitir parcial match
    status, messages = mail.search(None, f'(FROM "order-update@orders.stubhubinternational.com" SUBJECT "Vendeu o seu ticket" SINCE {date_from})')
    return messages[0].split()

def processar_email_stubhub(content, data_venda):
    try:
        # Garantir que data_venda é datetime
        if isinstance(data_venda, str):
            try:
                data_venda = parse(data_venda)
            except:
                data_venda = datetime.now()

        print("\n🔍 [DEBUG] A processar email StubHub...")

        # ID da venda
        match_id = re.search(r'ID do pedido\s*(?:n[º°.]*)?\s*(\d{6,12})', content, re.IGNORECASE)
        if not match_id:
            print("❌ ID do pedido não encontrado.")
            return "erro"
        id_venda = match_id.group(1).strip()
        print(f"🆔 ID da Venda: {id_venda}")

        # Evento
        match_evento = re.search(r'Informações sobre a venda\s*(.*?)\s*Tickets', content, re.DOTALL)
        evento = match_evento.group(1).strip() if match_evento else "Desconhecido"
        print(f"🎫 Evento: {evento}")

        # Data do evento
        match_data = re.search(r'(?:SEG|TER|QUA|QUI|SEX|SÁB|DOM),\s*(\d{2}/\d{2}/\d{4})', content)
        if match_data:
            data_str = match_data.group(1)
            data_evento_formatada = datetime.strptime(data_str, "%d/%m/%Y")
            print(f"📅 Data do Evento: {data_evento_formatada.strftime('%Y-%m-%d')}")
        else:
            data_evento_formatada = data_venda + timedelta(days=10)
            print(f"⚠️ Data do Evento não encontrada, usada estimativa: {data_evento_formatada.strftime('%Y-%m-%d')}")

        # Setor + Quantidade
        match_bilhetes = re.search(r'(\d+)\s+bilhete\(s\)\s*[\r\n]+(.*?)\s*[\r\n]+Fila', content, re.DOTALL)
        if match_bilhetes:
            qtd = match_bilhetes.group(1).strip()
            setor = match_bilhetes.group(2).strip()
            bilhetes = f"{setor} ({qtd} bilhetes)"
        else:
            bilhetes = "Desconhecido"
        print(f"🎟️ Bilhetes: {bilhetes}")

        # Ganho
        match_valor = re.search(r'Total de pagamento\s*€?\s*([\d\.,]+)', content)
        if match_valor:
            valor_str = match_valor.group(1)
            ganho = float(valor_str.replace(".", "").replace(",", "."))
        else:
            ganho = 0.0
        print(f"💶 Ganho: {ganho:.2f}€")

        print(f"🗓️ Data da Venda (email): {data_venda.strftime('%Y-%m-%d')}")

        return enviar_para_fastapi(
            id_venda=id_venda,
            evento=evento,
            ganho=ganho,
            data_venda=data_venda,  # ainda como datetime
            data_evento=data_evento_formatada,  # ainda como datetime
            bilhetes=bilhetes
        )

    except Exception as e:
        print(f"❌ Erro no processamento StubHub: {e}")
        return "erro"

from email.header import decode_header

def auto_update_email_data(username, password, date_from=None):
    mail = connect_email(username, password)
    mensagens = search_emails(mail, date_from=date_from)
    print(f"📬 Emails encontrados: {len(mensagens)}")

    sucesso = 0
    falha = 0
    ja_existiam = 0
    ids_erro = []
    novos_registos = []

    for msg_id in mensagens:
    conteudo, data_venda = extract_email_content_and_date(mail, msg_id)
    resultado = processar_email(conteudo, data_venda)

    estado_resultado = resultado.get("estado") if isinstance(resultado, dict) else resultado

    if estado_resultado == "inserido":
        sucesso += 1
        if isinstance(resultado, dict) and resultado.get("registo"):
            novos_registos.append(resultado["registo"])
    elif estado_resultado == "existente":
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
        "ids_falhados": ids_erro,
        "novos_registos": novos_registos[:5]
    }

    with open("resumo_leitura.json", "w") as f:
        json.dump(resumo, f, indent=2)

   

    try:
        requests.post("https://controlo-bilhetes.onrender.com/guardar_resumo", json=resumo)
        print("📡 Resumo enviado para a API FastAPI com sucesso.")
    except Exception as e:
        print(f"❌ Falha ao enviar resumo para API: {e}")

def enviar_resumo_email(total_emails, sucesso, falha, ja_existentes, ids_erro=None, entregues=0, ids_entregues=None, pagos=0, disputas=None):


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
📦 Alterados para 'Entregue': {entregues}
💰 Pagamentos confirmados: {pagos}
"""

    if ids_erro:
        corpo += "\n🔝 IDs com erro:\n" + "\n".join(ids_erro)
    if ids_entregues:
        corpo += "\n📬 IDs entregues:\n" + "\n".join(ids_entregues)
    if disputas:
        corpo += "\n⚠️ IDs com disputa:\n" + "\n".join(disputas)


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


def verificar_emails_entregues(username, password, dias=PERIODO_DIAS):

    mail = connect_email(username, password)
    mail.select("inbox")

    data_limite = (datetime.today() - timedelta(days=PERIODO_DIAS)).strftime("%d-%b-%Y")
    status, mensagens = mail.search(None, f'(FROM "viagogo" SINCE {data_limite})')
    ids = mensagens[0].split()
    print(f"📩 Emails a verificar para entregas: {len(ids)}")

    ids_atualizados = []

    for msg_id in ids:
        conteudo, _ = extract_email_content_and_date(mail, msg_id)
        print(f"🔍 Conteúdo do email:\n{conteudo}\n")

        if not conteudo:
            continue

        # Normalizar acentuação
        conteudo_normalizado = unicodedata.normalize('NFD', conteudo).encode('ascii', 'ignore').decode('utf-8')

        # Frases alvo
        frases_chave = [
            "Agradecemos por confirmar a transferencia do pedido",
            "Obrigado por entregar os ingressos para o pedido"
        ]

        # Verifica se contém alguma das frases
        for frase in frases_chave:
            if frase in conteudo_normalizado:
                match = re.search(rf"{re.escape(frase)}[^\d]*(\d+)", conteudo_normalizado)
                if match:
                    id_venda = match.group(1).strip().strip(".")
                    print(f"🔎 Pedido confirmado: {id_venda}")

                    # Atualiza o estado via API se existir
                    url = f"https://controlo-bilhetes.onrender.com/listagem_vendas/{id_venda}"
                    url = f"https://controlo-bilhetes.onrender.com/listagem_vendas/por_id_venda/{id_venda}"
                    try:
                        res = requests.get(url)
                        if res.status_code == 200:
                            dados = res.json()
                            if dados["estado"] != "Entregue":
                                dados["estado"] = "Entregue"
                                update = requests.put(f"https://controlo-bilhetes.onrender.com/listagem_vendas/{dados['id']}", json=dados)
                                if update.status_code == 200:
                                    print(f"✅ Estado atualizado para 'Entregue' no ID {id_venda}")
                                    ids_atualizados.append(id_venda)
                                else:
                                    print(f"❌ Falha ao atualizar ID {id_venda}: {update.status_code}")
                            else:
                                print(f"ℹ️ ID {id_venda} já está como 'Entregue'.")
                        else:
                            print(f"⚠️ ID {id_venda} não existe na base de dados.")
                    except Exception as e:
                        print(f"Erro na comunicação com API para ID {id_venda}: {e}")
                break  # Se encontrar uma frase válida, não precisa verificar a segunda

    return {
        "total_verificados": len(ids),
        "alterados_para_entregue": len(ids_atualizados),
        "ids_entregues": ids_atualizados
    }


def get_email_body_stubhub(msg):
    for part in msg.walk():
        content_type = part.get_content_type()
        content_disposition = str(part.get("Content-Disposition"))

        if "attachment" in content_disposition:
            continue

        if content_type == "text/html":
            try:
                html = part.get_payload(decode=True).decode(errors="ignore")
                soup = BeautifulSoup(html, "html.parser")
                return soup.get_text(separator=" ")  # <--- Junta com espaços
            except:
                continue
        elif content_type == "text/plain":
            try:
                return part.get_payload(decode=True).decode(errors="ignore")
            except:
                continue
    return ""



def verificar_emails_entregues_stubhub(username, password, dias=PERIODO_DIAS):
    import unicodedata

    mail = connect_email(username, password)
    mail.select("inbox")

    data_limite = (datetime.today() - timedelta(days=dias)).strftime("%d-%b-%Y")
    status, mensagens = mail.search(
        None,
        f'(FROM "order-update@orders.stubhubinternational.com" SINCE {data_limite})'
    )
    ids = mensagens[0].split()
    print(f"📩 Emails StubHub a verificar para entregas: {len(ids)}")

    ids_entregues = []

    for msg_id in ids:
        _, msg_data = mail.fetch(msg_id, "(RFC822)")
        for response_part in msg_data:
            if isinstance(response_part, tuple):
                msg = email.message_from_bytes(response_part[1])
                subject = msg["Subject"]
                print(f"📧 Assunto do email: {subject}")

                corpo = get_email_body_stubhub(msg)
                print("🔍 Conteúdo do email:\n", corpo[:1000])

                # Normalizar corpo
                corpo_normalizado = unicodedata.normalize("NFKD", corpo).encode("ASCII", "ignore").decode("utf-8")
                corpo_normalizado = re.sub(r'\s+', ' ', corpo_normalizado)

                # Expressão flexível
                frase_pattern = re.compile(
                    r"obrigado\s*por\s*entregar\s+os\s+(?:bilhetes|ingressos)\s+para\s+o\s+pedido\s+(\d{6,12})",
                    re.IGNORECASE
                )

                match = frase_pattern.search(corpo_normalizado)
                if match:
                    id_venda = match.group(1)
                    print(f"🔄 Atualizar ID {id_venda} para 'Entregue'")

                    try:
                        url = f"https://controlo-bilhetes.onrender.com/listagem_vendas/por_id_venda/{id_venda}"
                        res = requests.get(url)
                        if res.status_code == 200:
                            dados = res.json()
                            if dados["estado"] != "Entregue":
                                dados["estado"] = "Entregue"
                                update = requests.put(
                                    f"https://controlo-bilhetes.onrender.com/listagem_vendas/{dados['id']}",
                                    json=dados
                                )
                                if update.status_code == 200:
                                    print(f"✅ Estado do ID {id_venda} atualizado para 'Entregue'")
                                    ids_entregues.append(id_venda)
                                else:
                                    print(f"❌ Erro ao atualizar ID {id_venda}: {update.status_code}")
                            else:
                                print(f"ℹ️ ID {id_venda} já estava como 'Entregue'.")
                        else:
                            print(f"⚠️ ID {id_venda} não encontrado na base de dados.")
                    except Exception as e:
                        print(f"❌ Erro na comunicação com API para ID {id_venda}: {e}")
                else:
                    print("❌ Frase de entrega não encontrada neste email.")

    return {
        "total_verificados": len(ids),
        "alterados_para_entregue": len(ids_entregues),
        "ids_entregues": ids_entregues
    }



def get_email_body_stubhub_pagamento_simples(msg):
    html_parts = []

    for part in msg.walk():
        content_type = part.get_content_type()
        content_disposition = str(part.get("Content-Disposition") or "")

        if "attachment" in content_disposition.lower():
            continue

        if content_type == "text/html":
            try:
                html = part.get_payload(decode=True).decode("utf-8", errors="ignore")
                html_parts.append(html)
            except Exception as e:
                print(f"❌ Erro ao decodificar HTML: {e}")
                continue

    if not html_parts:
        print("⚠️ Nenhuma parte HTML encontrada no email.")
        return ""

    # Junta todas as partes HTML
    html_final = "\n".join(html_parts)
    soup = BeautifulSoup(html_final, "html.parser")

    # Remove lixo visual
    for tag in soup(["script", "style", "head", "meta", "title", "link"]):
        tag.decompose()

    texto = soup.get_text(separator="\n")
    linhas_limpas = [linha.strip() for linha in texto.splitlines() if linha.strip()]
    texto_final = "\n".join(linhas_limpas)

    # ✅ MOSTRAR preview do conteúdo útil extraído
    print("📨 Corpo REAL processado (preview):\n")
    print(texto_final[:2000])
    print("-" * 80)
    return texto_final


def parse_money_to_float(valor_str: str):
    """
    Converte:
      "-133.45", "-133,45", "1.234,56", "1234.56", "€ -133,45"
    para float.
    """
    if not valor_str:
        return None

    s = valor_str.strip().replace("€", "").replace(" ", "").replace("\xa0", "")

    # Se tiver vírgula e ponto, assume PT: ponto milhares e vírgula decimal
    if "," in s and "." in s:
        s = s.replace(".", "").replace(",", ".")
    else:
        s = s.replace(",", ".")

    try:
        return float(s)
    except:
        return None



def verificar_emails_pagamento(username, password, dias=PERIODO_DIAS):
    mail = connect_email(username, password)
    mail.select("inbox")

    data_limite = (datetime.today() - timedelta(days=dias)).strftime("%d-%b-%Y")
    status, mensagens = mail.search(None, f'(SUBJECT "viagogo Pagamento" FROM "viagogo" SINCE {data_limite})')
    ids = mensagens[0].split()
    print(f"📩 Emails a verificar para pagamentos: {len(ids)}")

    ids_pagamento_confirmado = []
    ids_disputa = []

    for msg_id in ids:
        conteudo, _ = extract_email_content_and_date(mail, msg_id)
        if not conteudo:
            print("⚠️ Email sem conteúdo útil. Ignorado.")
            continue

        conteudo_normalizado = unicodedata.normalize('NFD', conteudo).encode('ascii', 'ignore').decode('utf-8')
        print("🔍 Conteúdo normalizado:")
        print(conteudo_normalizado[:2000])  # Mostra só os primeiros 2000 caracteres

        # 1. Extrair referência de pagamento
        match_ref = re.search(r'Referencia de pagamento n\.?\s*(\d+)', conteudo_normalizado)
        if not match_ref:
            print("❌ Referência de pagamento não encontrada.")
            continue

        ref_pagamento = match_ref.group(1)
        print(f"🔑 Referência de pagamento encontrada: {ref_pagamento}")

        # 2. Procurar IDs e valores associados
        pattern = rf'({ref_pagamento}\d{{9}}).*?(-?\d{{1,5}}[.,]\d{{2}})\s*€?'
        blocos = re.findall(pattern, conteudo_normalizado)
        print("🧪 Blocos encontrados no conteúdo:")
        print(blocos)

        if not blocos:
            print("⚠️ Nenhum bloco de ID + valor encontrado neste email.")

        for id_completo, valor_str in blocos:
            id_venda = id_completo[-9:]
            try:
                valor_pagamento = parse_money_to_float(valor_str)
                if valor_pagamento is None:
                    print(f"❌ Erro ao converter valor: '{valor_str}'")
                    continue
                
                # ✅ REGRA: se negativo, não faz nada
                if valor_pagamento < 0:
                    print(f"⛔ Valor negativo ({valor_pagamento:.2f}€). Ignorado (não alterar estado).")
                    continue
            except Exception as e:
                print(f"❌ Erro ao converter valor: '{valor_str}' - {e}")
                continue

            print(f"🔍 ID Venda: {id_venda} | Valor: {valor_pagamento:.2f}€")

            url = f"https://controlo-bilhetes.onrender.com/listagem_vendas/por_id_venda/{id_venda}"
            try:
                res = requests.get(url)
                if res.status_code == 200:
                    dados = res.json()
                    valor_esperado = float(dados.get("ganho", 0))
                    diferenca = abs(valor_pagamento - valor_esperado)

                    print(f"🔎 Valor esperado no sistema: {valor_esperado:.2f}€ | Diferença: {diferenca:.2f}€")
                    if str(dados.get("estado", "")).lower() == "disputa":
                        print("⛔ Já está em Disputa. Não altero estado.")
                        continue    
                    if diferenca <= 1:
                        novo_estado = "Pago"
                        ids_pagamento_confirmado.append(id_venda)
                        print(f"✅ Estado atribuído: {novo_estado}")
                    else:
                        print("ℹ️ Diferença moderada. Nenhuma alteração de estado aplicada.")
                        continue

                    if dados["estado"] != novo_estado:
                        dados["estado"] = novo_estado
                        update = requests.put(f"https://controlo-bilhetes.onrender.com/listagem_vendas/{dados['id']}", json=dados)
                        if update.status_code == 200:
                            print(f"📤 Estado atualizado com sucesso no sistema.")
                        else:
                            print(f"❌ Falha ao atualizar estado na API: {update.status_code}")
                    else:
                        print("ℹ️ Estado já estava correto. Nenhuma alteração feita.")
                else:
                    print(f"⚠️ ID {id_venda} não encontrado na base de dados.")
            except Exception as e:
                print(f"❌ Erro na verificação do ID {id_venda}: {e}")

        print("------------------------------------------------------------")

    print(f"\n✅ Total confirmados como pagos: {len(ids_pagamento_confirmado)}")
    print(f"⚠️ Total com disputa: {len(ids_disputa)}")

    return {
        "total_verificados": len(ids),
        "pagos": len(ids_pagamento_confirmado),
        "disputas": ids_disputa
    }


def verificar_emails_pagamento_stubhub(username, password, dias=PERIODO_DIAS):
    mail = connect_email(username, password)
    mail.select("inbox")

    data_limite = (datetime.today() - timedelta(days=dias)).strftime("%d-%b-%Y")
    status, mensagens = mail.search(
        None,
        f'(FROM "order-update@orders.stubhubinternational.com" SINCE {data_limite})'
    )
    ids = mensagens[0].split()
    print(f"📩 Emails StubHub a verificar para pagamentos: {len(ids)}")

    ids_pagamento_confirmado = []
    ids_disputa = []

    for msg_id in ids:
        _, msg_data = mail.fetch(msg_id, "(RFC822)")
        for response_part in msg_data:
            if isinstance(response_part, tuple):
                msg = email.message_from_bytes(response_part[1])
                corpo = get_email_body_stubhub_pagamento_simples(msg)

                if not corpo:
                    print("⚠️ Corpo vazio.")
                    continue

                print("📨 Corpo do email analisado (1000 caracteres):")
                print(corpo[:1000])
                print("-" * 80)

                ## 🔍 Novo método para encontrar blocos com ID do pedido e pagamento
                blocos = []
                
                # Divide o corpo em possíveis secções de pagamento
                secções = corpo.split("N.º pedido")
                for sec in secções[1:]:  # Ignora a primeira parte (antes do 1º pedido)
                    try:
                        id_match = re.search(r'[:\s]+(\d{6,12})', sec)
                        valor_match = re.search(r'O\s+seu\s+pagamento\s*€\s*(-?[\d\.,]+)', sec, re.IGNORECASE)

                
                        if id_match and valor_match:
                            id_venda = id_match.group(1)
                            valor_str = valor_match.group(1)
                            blocos.append((id_venda, valor_str))
                    except Exception as e:
                        print(f"❌ Erro ao extrair bloco: {e}")





                print(f"🔍 Blocos encontrados: {blocos}")

                for id_venda, valor_str in blocos:
                    try:
                        valor_pagamento = parse_money_to_float(valor_str)
                        if valor_pagamento is None:
                            print(f"❌ Erro ao converter valor: {valor_str}")
                            continue
                        
                        # ✅ REGRA: se negativo, não faz nada
                        if valor_pagamento < 0:
                            print(f"⛔ Valor negativo ({valor_pagamento:.2f}€). Ignorado (não alterar estado).")
                            continue

                    except:
                        print(f"❌ Erro ao converter valor: {valor_str}")
                        continue

                    print(f"💳 ID: {id_venda} | Valor pago: {valor_pagamento:.2f}€")

                    try:
                        url = f"https://controlo-bilhetes.onrender.com/listagem_vendas/por_id_venda/{id_venda}"
                        res = requests.get(url)
                        if res.status_code == 200:
                            dados = res.json()
                            valor_esperado = float(dados.get("ganho", 0))
                            diferenca = abs(valor_pagamento - valor_esperado)
                            if str(dados.get("estado", "")).lower() == "disputa":
                                print("⛔ Já está em Disputa. Não altero estado.")
                                continue
                            if diferenca <= 1:
                                novo_estado = "Pago"
                                ids_pagamento_confirmado.append(id_venda)
                            else:
                                continue

                            if dados["estado"] != novo_estado:
                                dados["estado"] = novo_estado
                                update = requests.put(
                                    f"https://controlo-bilhetes.onrender.com/listagem_vendas/{dados['id']}",
                                    json=dados
                                )
                                if update.status_code == 200:
                                    print(f"📤 Estado atualizado: {novo_estado}")
                                else:
                                    print(f"❌ Erro ao atualizar estado: {update.status_code}")
                            else:
                                print("ℹ️ Estado já estava correto.")
                        else:
                            print(f"⚠️ ID {id_venda} não encontrado na base de dados.")
                    except Exception as e:
                        print(f"❌ Erro ao verificar ID {id_venda}: {e}")

    print(f"✅ Pagos: {len(ids_pagamento_confirmado)} | ⚠️ Disputas: {len(ids_disputa)}")
    return {
        "pagos": len(ids_pagamento_confirmado),
        "disputas": ids_disputa
    }




# =============================
# Execução principal do script
# =============================
if __name__ == "__main__":
    auto_update_email_data(username, password, date_from=(datetime.today() - timedelta(days=PERIODO_DIAS)).strftime("%d-%b-%Y"))

      # === Processar emails da StubHub (mesma conta que Viagogo)
    print("\n📥 A processar StubHub...")
    
    mail = connect_email(username, password)
    mensagens = search_emails_stubhub(mail)
    print(f"📬 Emails encontrados StubHub: {len(mensagens)}")
    
    sucesso_stubhub = 0
    falha_stubhub = 0
    novos_registos_stubhub = []
    
    for msg_id in mensagens:
        conteudo, data_venda = extract_stubhub_email_content_and_date(mail, msg_id)
        resultado = processar_email_stubhub(conteudo, data_venda)
    
        estado_resultado = resultado.get("estado") if isinstance(resultado, dict) else resultado
    
        if estado_resultado == "inserido":
            sucesso_stubhub += 1
            if isinstance(resultado, dict) and resultado.get("registo"):
                novos_registos_stubhub.append(resultado["registo"])
        elif estado_resultado == "erro":
            falha_stubhub += 1
    
    print(f"✅ StubHub inseridos com sucesso: {sucesso_stubhub}")
    print(f"❌ StubHub com erro: {falha_stubhub}")

    entregues_stubhub = verificar_emails_entregues_stubhub(username, password, dias=PERIODO_DIAS)
    entregues_viagogo = verificar_emails_entregues(username, password, dias=PERIODO_DIAS)
    
    # Espera 5 segundos para garantir que os registos anteriores foram guardados
    time.sleep(5)
    
    # Combinar entregas
    entregues_resumo = {
        "alterados_para_entregue": entregues_stubhub.get("alterados_para_entregue", 0) + entregues_viagogo.get("alterados_para_entregue", 0),
        "ids_entregues": list(set(entregues_stubhub.get("ids_entregues", []) + entregues_viagogo.get("ids_entregues", [])))
    }

    # ✅ Verificações de pagamento
    resultado_pagamentos = verificar_emails_pagamento(username, password, dias=PERIODO_DIAS)
    resultado_pagamentos_stubhub = verificar_emails_pagamento_stubhub(username, password, dias=PERIODO_DIAS)

    # ✅ Carregar resumo e atualizar
    try:
        with open("resumo_leitura.json", "r+") as f:
            resumo = json.load(f)
            resumo["sucesso"] += sucesso_stubhub
            resumo["total_lidos"] += sucesso_stubhub + falha_stubhub
            resumo["entregues"] = entregues_resumo["alterados_para_entregue"]
            resumo["ids_entregues"] = entregues_resumo["ids_entregues"]
            resumo["pagos"] = resultado_pagamentos.get("pagos", 0) + resultado_pagamentos_stubhub.get("pagos", 0)
            resumo["disputas"] = resultado_pagamentos.get("disputas", []) + resultado_pagamentos_stubhub.get("disputas", [])
            resumo["novos_registos"] = (resumo.get("novos_registos", []) + novos_registos_stubhub)[:5]
            f.seek(0)
            json.dump(resumo, f, indent=2)
            f.truncate()
    except Exception as e:
        print(f"❌ Erro ao atualizar resumo com entregues: {e}")
        resumo = {
            "total_lidos": sucesso_stubhub + falha_stubhub,
            "sucesso": sucesso_stubhub,
            "falhas": falha_stubhub,
            "existentes": 0,
            "entregues": entregues_resumo.get("alterados_para_entregue", 0),
            "ids_entregues": entregues_resumo.get("ids_entregues", []),
            "pagos": resultado_pagamentos.get("pagos", 0) + resultado_pagamentos_stubhub.get("pagos", 0),
            "disputas": resultado_pagamentos.get("disputas", []) + resultado_pagamentos_stubhub.get("disputas", [])
            "novos_registos": (novos_registos + novos_registos_stubhub)[:5]
        }
    
    # ✅ Atualiza API
    try:
        requests.post("https://controlo-bilhetes.onrender.com/guardar_resumo", json=resumo)
        print("📡 Resumo enviado para a API FastAPI com sucesso.")
    except Exception as e:
        print(f"❌ Falha ao enviar resumo para API: {e}")
    
    # ✅ Enviar email (sempre, independentemente do try anterior)
    print("📨 A enviar resumo por email...")
    enviar_resumo_email(
        total_emails=resumo["total_lidos"],
        sucesso=resumo["sucesso"],
        falha=resumo.get("falhas", 0),
        ja_existentes=resumo.get("existentes", 0),
        ids_erro=resumo.get("ids_falhados", []),
        entregues=resumo.get("entregues", 0),
        ids_entregues=resumo.get("ids_entregues", []),
        pagos=resumo.get("pagos", 0),
        disputas=resumo.get("disputas", [])
    )

