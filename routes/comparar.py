from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse
import re
import cloudscraper
from bs4 import BeautifulSoup
import difflib

comparar_router = APIRouter()

CLUBES_URLS = {
    "SL Benfica": "https://www.viagogo.pt/Bilhetes-Desporto/Futebol/Primeira-Liga/SL-Benfica-Bilhetes",
    "Sporting CP": "https://www.viagogo.pt/Bilhetes-Desporto/Futebol/Sporting-CP-Bilhetes",
    "FC Porto": "https://www.viagogo.pt/Bilhetes-Desporto/Futebol/FC-Porto-Bilhetes",
}

def obter_clube_url(evento_nome: str) -> str:
    evento_lower = evento_nome.lower()
    if "benfica" in evento_lower:
        return CLUBES_URLS["SL Benfica"]
    elif "sporting" in evento_lower:
        return CLUBES_URLS["Sporting CP"]
    elif "porto" in evento_lower:
        return CLUBES_URLS["FC Porto"]
    return None

def obter_preco_viagogo(evento_nome: str, setor: str, quantidade: int):
    scraper = cloudscraper.create_scraper()
    url_base = obter_clube_url(evento_nome)

    if not url_base:
        print(f"❌ Clube não reconhecido no evento: {evento_nome}")
        return None

    # Verifica até 3 páginas por clube
    for pagina in range(1, 4):
        if pagina == 1:
            url = url_base
        else:
            sufixo = "&restPage=" + str(pagina) if "Sporting" in url_base or "Porto" in url_base else "&primaryPage=" + str(pagina)
            url = url_base + sufixo

        print(f"🔍 A procurar em: {url}")
        response = scraper.get(url)
        if response.status_code != 200:
            print("❌ Erro ao carregar página:", response.status_code)
            continue

        soup = BeautifulSoup(response.text, "html.parser")
        eventos = []
        for a in soup.find_all("a", href=True):
            texto = a.get_text(strip=True)
            if "vs" in texto:
                eventos.append((texto, a["href"]))

        nomes = [e[0] for e in eventos]
        semelhantes = difflib.get_close_matches(evento_nome, nomes, n=1, cutoff=0.6)

        if not semelhantes:
            continue

        nome_encontrado = semelhantes[0]
        href = next(link for nome, link in eventos if nome == nome_encontrado)
        evento_link = "https://www.viagogo.pt" + href
        print(f"✅ Match encontrado: '{nome_encontrado}' → {evento_link}")

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

    print("❌ Evento não encontrado após todas as páginas:", evento_nome)
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
