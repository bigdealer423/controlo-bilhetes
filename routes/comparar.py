from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse
import re
import cloudscraper
from bs4 import BeautifulSoup

comparar_router = APIRouter()

# Função para obter preços do Viagogo (sem playwright)
def obter_preco_viagogo(evento_nome: str, setor: str, quantidade: int):
    url_base = "https://www.viagogo.pt/Bilhetes-Desporto/Futebol/Primeira-Liga"

    scraper = cloudscraper.create_scraper()
    response = scraper.get(url_base)

    if response.status_code != 200:
        print("❌ Erro ao carregar página Viagogo:", response.status_code)
        return None

    soup = BeautifulSoup(response.text, "html.parser")

    # Procurar o link do evento
    evento_link = None
    for a in soup.find_all("a", href=True):
        if evento_nome.lower() in a.text.lower():
            evento_link = "https://www.viagogo.pt" + a["href"]
            break

    if not evento_link:
        print("❌ Evento não encontrado:", evento_nome)
        return None

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

        # Verifica a quantidade
        match_qtd = re.search(r"(\d+)\s*Bilhete", texto)
        if match_qtd:
            qtd = int(match_qtd.group(1))
            if qtd != quantidade:
                continue
        else:
            continue

        # Verifica o preço
        match_preco = re.search(r"€\s*(\d+(?:,\d{2})?)", texto)
        if match_preco:
            preco_str = match_preco.group(1).replace(",", ".")
            preco = float(preco_str)
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
                "concorrente_preco": preco_viagogo if preco_viagogo is not None else "-",
                "sugestao": sugestao,
            })

        return JSONResponse(content=resultados)

    except Exception as e:
        print("❌ Erro na comparação:", e)
        return JSONResponse(status_code=500, content={"erro": str(e)})
