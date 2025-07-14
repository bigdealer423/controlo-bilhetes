from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse
import requests
from requests.auth import HTTPBasicAuth
import re
from bs4 import BeautifulSoup

comparar_router = APIRouter()

BASE_LINK = "https://www.viagogo.pt/Bilhetes-Desporto/Futebol/Primeira-Liga/SL-Benfica-Bilhetes/E-158801955"

USERNAME = "bigdealer_QM6VP"
PASSWORD = "Pedrosara18="  # <- Substituir

def obter_preco_com_oxylabs(base_url: str, setor: str, quantidade: int):
    if quantidade == 1:
        url = base_url + "?quantity=1"
    elif 2 <= quantidade < 6:
        url = base_url + "?quantity=2"
    else:
        url = base_url + "?quantity=6"

    print("🔎 URL usado:", url)

    try:
        response = requests.post(
            "https://realtime.oxylabs.io/v1/queries",
            auth=HTTPBasicAuth(USERNAME, PASSWORD),
            headers={"Content-Type": "application/json"},
            json={"source": "universal", "url": url},
            timeout=60
        )

        print(f"🌐 Código de estado Oxylabs: {response.status_code}")
        if response.status_code != 200:
            print("❌ Conteúdo de erro:", response.text)
            return None

        result = response.json()
        html = result.get("results", [{}])[0].get("content", "")
        print("📄 Primeiros 500 caracteres de HTML:")
        print(html[:500])

        soup = BeautifulSoup(html, "html.parser")
        listagens = soup.select(".ticket-listing")
        print("🎫 Listagens encontradas:", len(listagens))

        menor_preco = None
        listagens_validas = 0

        for item in listagens:
            texto = item.get_text(separator=" ").strip()
            print("🔍 Texto da listagem:", texto[:200])

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
                listagens_validas += 1
                if menor_preco is None or preco < menor_preco:
                    menor_preco = preco

        if listagens_validas == 0:
            print("⚠️ Nenhuma listagem válida encontrada para este setor e quantidade.")

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
