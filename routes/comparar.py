from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse
import re
import cloudscraper
from bs4 import BeautifulSoup
import difflib

comparar_router = APIRouter()

def obter_preco_viagogo(evento_nome: str, setor: str, quantidade: int):
    scraper = cloudscraper.create_scraper()

    def procurar_evento_viagogo():
        homepage = "https://www.viagogo.pt/"
        response = scraper.get(homepage)
        if response.status_code != 200:
            print("❌ Erro ao carregar homepage Viagogo:", response.status_code)
            return None

        html = response.text

        # Extrair todos os pares "name":"...", "url":"..."
        matches = re.findall(r'"name"\s*:\s*"([^"]+?)"\s*,\s*"url"\s*:\s*"([^"]+?)"', html)
        nomes = [nome for nome, _ in matches]
        semelhantes = difflib.get_close_matches(evento_nome, nomes, n=1, cutoff=0.6)

        if not semelhantes:
            return None

        nome_encontrado = semelhantes[0]
        url_encontrado = next(url for nome, url in matches if nome == nome_encontrado)
        print(f"✅ Match encontrado via homepage: '{nome_encontrado}' → {url_encontrado}")
        return url_encontrado

    # Tenta na homepage
    evento_link = procurar_evento_viagogo()

    # Fallback: Primeira Liga
    if not evento_link:
        print("⚠️ Tentar fallback: Primeira Liga...")
        url_base = "https://www.viagogo.pt/Bilhetes-Desporto/Futebol/Primeira-Liga"
        response = scraper.get(url_base)
        if response.status_code != 200:
            print("❌ Erro ao carregar Primeira Liga:", response.status_code)
            return None

        soup = BeautifulSoup(response.text, "html.parser")
        eventos = []
        for a in soup.find_all("a", href=True):
            texto = a.get_text(strip=True)
            if "vs" in texto:
                eventos.append((texto, a["href"]))

        nomes = [e[0] for e in eventos]
        semelhantes = difflib.get_close_matches(evento_nome, nomes, n=1, cutoff=0.6)

        if not semelhantes:
            print("❌ Evento não encontrado:", evento_nome)
            return None

        nome_encontrado = semelhantes[0]
        href = next(link for nome, link in eventos if nome == nome_encontrado)
        evento_link = "https://www.viagogo.pt" + href
        print(f"✅ Match encontrado via fallback: '{nome_encontrado}' → {evento_link}")

    # Scraping de preços
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
                "concorrente_preco": preco_viagogo if preco_viagogo is not None else "-",
                "sugestao": sugestao,
            })

        return JSONResponse(content=resultados)

    except Exception as e:
        print("❌ Erro na comparação:", e)
        return JSONResponse(status_code=500, content={"erro": str(e)})
