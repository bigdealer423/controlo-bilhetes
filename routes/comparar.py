from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse
import re
import cloudscraper
from bs4 import BeautifulSoup

comparar_router = APIRouter()

# Link fixo para o Benfica vs Rio Ave (exemplo)
BASE_LINK = "https://www.viagogo.pt/Bilhetes-Desporto/Futebol/Primeira-Liga/SL-Benfica-Bilhetes/E-158801955"

def obter_preco_com_quantidade(base_url: str, setor: str, quantidade: int):
    if quantidade == 1:
        url = base_url + "?quantity=1"
    elif 2 <= quantidade < 6:
        url = base_url + "?quantity=2"
    else:
        url = base_url + "?quantity=6"

    print("🔎 URL usado:", url)

    scraper = cloudscraper.create_scraper()
    response = scraper.get(url)
    if response.status_code != 200:
        print("❌ Erro ao carregar a página do evento:", response.status_code)
        return None

    soup = BeautifulSoup(response.text, "html.parser")
    listagens = soup.select(".ticket-listing")
    menor_preco = None

    print(f"🧾 Listagens encontradas: {len(listagens)}")

    for idx, item in enumerate(listagens):
        texto = item.get_text()
        print(f"\n📄 Listagem #{idx+1}:\n{texto[:300]}")

        if setor.lower() not in texto.lower():
            print("❌ Setor não corresponde:", setor)
            continue

        match_qtd = re.search(r"(\d+)\s*Bilhete", texto)
        if match_qtd:
            qtd = int(match_qtd.group(1))
            print(f"🔢 Quantidade detectada: {qtd}")
            if qtd != quantidade:
                print("❌ Quantidade não corresponde:", quantidade)
                continue
        else:
            print("❌ Quantidade não identificada.")
            continue

        match_preco = re.search(r"€\s*(\d+(?:,\d{2})?)", texto)
        if match_preco:
            preco_str = match_preco.group(1).replace(",", ".")
            preco = float(preco_str)
            print(f"💶 Preço encontrado: {preco}€")
            if menor_preco is None or preco < menor_preco:
                menor_preco = preco
        else:
            print("❌ Preço não identificado.")

    print(f"\n✅ Menor preço final encontrado: {menor_preco}€")
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

            print("\n===============================")
            print(f"🧪 Comparando evento: {evento} | Setor: {setor} | Qtd: {quantidade} | Teu preço: {teu_preco}")

            preco_viagogo = obter_preco_com_quantidade(BASE_LINK, setor, quantidade)

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
