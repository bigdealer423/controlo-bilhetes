from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse
import re
import cloudscraper
from bs4 import BeautifulSoup
import difflib  # 🚀 para matching tolerante

comparar_router = APIRouter()

def obter_preco_viagogo(evento_nome: str, setor: str, quantidade: int):
    url_base = "https://www.viagogo.pt/Bilhetes-Desporto/Futebol/Primeira-Liga"
    scraper = cloudscraper.create_scraper()
    response = scraper.get(url_base)

    if response.status_code != 200:
        print("❌ Erro ao carregar página Viagogo:", response.status_code)
        return None

    soup = BeautifulSoup(response.text, "html.parser")

    # Lista de títulos e links
    eventos = []
    for a in soup.find_all("a", href=True):
        texto = a.get_text(strip=True)
        if "vs" in texto:
            eventos.append((texto, a["href"]))

    # Procurar o mais semelhante
    nomes = [e[0] for e in eventos]
    semelhantes = difflib.get_close_matches(evento_nome, nomes, n=1, cutoff=0.6)

    if not semelhantes:
        print("❌ Evento não encontrado:", evento_nome)
        return None

    nome_encontrado = semelhantes[0]
    evento_href = next(link for nome, link in eventos if nome == nome_encontrado)
    evento_link = "https://www.viagogo.pt" + evento_href
    print(f"✅ Match encontrado: '{nome_encontrado}' → {evento_link}")

    # Visitar a página do evento
    response_evento = scraper.get(evento_link)
    if response_evento.status_code != 200:
        print("❌ Erro ao carregar evento:", response_evento.status_code)
        return None

    soup_evento = BeautifulSoup(response_evento.text, "html.parser")
    listagens = soup_evento.select(".ticket-listing")
    menor_preco = None

    for item in listagens:
        texto = item.get_text()
        if setor.lower() not in texto.lower():
            continue

        match_qtd = re.search(r"(\d+)\s*Bilhete", texto)
        if match_qtd:
            qtd = int(match_qtd.group(1))
            if qtd != quantidade:
                continue
        else:
            continue

        match_preco = re.search(r"€\s*(\d+(?:,\d{2})?)", texto)
        if match_preco:
            preco = float(match_preco.group(1).replace(",", "."))
            if menor_preco is None or preco < menor_preco:
                menor_preco = preco

    return menor_preco

@comparar_router.post("/comparar_listagens")
async def comparar_listagens(request: Request):
    try:
        body = await request.json()
        listagens = body.get("listagens", [])
        resultados = []

        for linha in listagens:
            evento = linha.get("EventName", "").strip()
            setor = linha.get("Section", "").strip()
            teu_preco = float(linha.get("PricePerTicketAmount", 0))
            quantidade = int(linha.get("Quantity", 1))

            preco_viagogo = obter_preco_viagogo(evento, setor, quantidade)

            if preco_viagogo is None:
                sugestao = "Sem dados"
            elif teu_preco <= preco_viagogo:
                sugestao = "Manter"
            else:
                sugestao = "Reduzir preço"

            resultados.append({
                "evento": evento,
                "setor": setor,
                "teu_preco": teu_preco,
                "concorrente_preco": p_
