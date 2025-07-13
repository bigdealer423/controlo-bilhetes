from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse
import re
import cloudscraper
from bs4 import BeautifulSoup
import difflib

comparar_router = APIRouter()

# URLs base por clube
URLS_CLUBES = {
    "Benfica": [
        "https://www.viagogo.pt/Bilhetes-Desporto/Futebol/Primeira-Liga/SL-Benfica-Bilhetes?agqi=d9562cbe-6999-4d04-b1f0-41d502921594&agi=stubhub&agut=d64b382fb2a16382094a062ed70c7e7db59e751f",
        "https://www.viagogo.pt/Bilhetes-Desporto/Futebol/Primeira-Liga/SL-Benfica-Bilhetes?agqi=d9562cbe-6999-4d04-b1f0-41d502921594&agi=stubhub&agut=d64b382fb2a16382094a062ed70c7e7db59e751f&primaryPage=2",
        "https://www.viagogo.pt/Bilhetes-Desporto/Futebol/Primeira-Liga/SL-Benfica-Bilhetes?agqi=d9562cbe-6999-4d04-b1f0-41d502921594&agi=stubhub&agut=d64b382fb2a16382094a062ed70c7e7db59e751f&primaryPage=3",
    ],
    "Sporting": [
        "https://www.viagogo.pt/Bilhetes-Desporto/Futebol/Sporting-CP-Bilhetes?agqi=7dff2e2f-b24d-437e-ae24-ec374e5f57a0&agi=stubhub&agut=d64b382fb2a16382094a062ed70c7e7db59e751f",
        "https://www.viagogo.pt/Bilhetes-Desporto/Futebol/Sporting-CP-Bilhetes?agqi=7dff2e2f-b24d-437e-ae24-ec374e5f57a0&agi=stubhub&agut=d64b382fb2a16382094a062ed70c7e7db59e751f&restPage=2",
        "https://www.viagogo.pt/Bilhetes-Desporto/Futebol/Sporting-CP-Bilhetes?agqi=7dff2e2f-b24d-437e-ae24-ec374e5f57a0&agi=stubhub&agut=d64b382fb2a16382094a062ed70c7e7db59e751f&restPage=3",
    ],
    "Porto": [
        "https://www.viagogo.pt/Bilhetes-Desporto/Futebol/FC-Porto-Bilhetes?agqi=3db8b97b-79ed-4241-bcf3-fe360b9e9cb8&agi=stubhub&agut=d64b382fb2a16382094a062ed70c7e7db59e751f",
        "https://www.viagogo.pt/Bilhetes-Desporto/Futebol/FC-Porto-Bilhetes?agqi=3db8b97b-79ed-4241-bcf3-fe360b9e9cb8&agi=stubhub&agut=d64b382fb2a16382094a062ed70c7e7db59e751f&restPage=2",
        "https://www.viagogo.pt/Bilhetes-Desporto/Futebol/FC-Porto-Bilhetes?agqi=3db8b97b-79ed-4241-bcf3-fe360b9e9cb8&agi=stubhub&agut=d64b382fb2a16382094a062ed70c7e7db59e751f&restPage=3",
    ]
}

def obter_preco_viagogo(evento_nome: str, setor: str, quantidade: int):
    scraper = cloudscraper.create_scraper()

    for clube, urls in URLS_CLUBES.items():
        for url in urls:
            response = scraper.get(url)
            if response.status_code != 200:
                continue

            soup = BeautifulSoup(response.text, "html.parser")
            eventos = []
            for a in soup.find_all("a", href=True):
                texto = a.get_text(strip=True)
                if "vs" in texto or " - " in texto:
                    eventos.append((texto, a["href"]))

            nomes = [e[0] for e in eventos]
            semelhantes = difflib.get_close_matches(evento_nome, nomes, n=1, cutoff=0.6)
            if not semelhantes:
                continue

            nome_encontrado = semelhantes[0]
            href = next(link for nome, link in eventos if nome == nome_encontrado)
            evento_link = "https://www.viagogo.pt" + href
            print(f"✅ Match encontrado: '{evento_nome}' → {evento_link}")

            # Scraping da página do evento
            response_evento = scraper.get(evento_link)
            if response_evento.status_code != 200:
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

    print("❌ Evento não encontrado:", evento_nome)
    return None


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
