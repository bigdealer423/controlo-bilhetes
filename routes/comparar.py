from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse
import requests
import re
from bs4 import BeautifulSoup

comparar_router = APIRouter()

# URL base para o jogo
BASE_LINK = "https://www.viagogo.pt/Bilhetes-Desporto/Futebol/Primeira-Liga/SL-Benfica-Bilhetes/E-158801955"

# Autenticação Web Scraper API
OXYLABS_USERNAME = "bigdealer.QM6VP"
OXYLABS_PASSWORD = "Pedrosara18="
OXYLABS_URL = "https://scraper-api.oxylabs.io/v1"

def obter_preco_com_oxylabs(base_url: str, setor: str, quantidade: int):
    # Monta URL com quantidade
    if quantidade == 1:
        url = base_url + "?quantity=1"
    elif 2 <= quantidade < 6:
        url = base_url + "?quantity=2"
    else:
        url = base_url + "?quantity=6"

    print("🔎 URL usado:", url)

    payload = {
        "url": url,
        "geo_location": "Portugal",
        "render": True,  # 🚀 Ativa JS rendering
    }

    try:
        response = requests.post(
            OXYLABS_URL,
            auth=(OXYLABS_USERNAME, OXYLABS_PASSWORD),
            json=payload,
            timeout=60
        )

        print(f"🌐 Código de estado Oxylabs: {response.status_code}")

        if response.status_code != 200:
            print("❌ Conteúdo de erro:", response.text)
            return None

        html = response.json().get("results", [{}])[0].get("content", "")
        print("📄 Primeiros 500 caracteres de HTML:\n", html[:500])

        soup = BeautifulSoup(html, "html.parser")
        listagens = soup.select(".ticket-listing")
        print("🎫 Listagens encontradas:", len(listagens))

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
                preco_str = match_preco.group(1).replace(",", ".")
                preco = float(preco_str)
                if menor_preco is None or preco < menor_preco:
                    menor_preco = preco

        if menor_preco is None:
            print("⚠️ Nenhuma listagem válida encontrada.")
        else:
            print(f"✅ Menor preço final encontrado: {menor_preco}€")

        return menor_preco

    except Exception as e:
        print("❌ Erro Oxylabs:", e)
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

            print(f"\n🧪 Comparando evento: {evento} | Setor: {setor} | Qtd: {quantidade} | Teu preço: {teu_preco}")

            preco_viagogo = obter_preco_com_oxylabs(BASE_LINK, setor, quantidade)

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
