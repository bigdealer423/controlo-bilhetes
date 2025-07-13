from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse
import re
from playwright.sync_api import sync_playwright

comparar_router = APIRouter()

# Link fixo para o Benfica vs Rio Ave (exemplo)
BASE_LINK = "https://www.viagogo.pt/Bilhetes-Desporto/Futebol/Primeira-Liga/SL-Benfica-Bilhetes/E-158801955"

def obter_com_playwright(url, setor, quantidade):
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        print("\n🔗 A carregar:", url)

        try:
            page.goto(url, timeout=60000)
            page.wait_for_timeout(5000)
        except Exception as e:
            print("❌ Erro ao carregar a página:", e)
            browser.close()
            return None

        html = page.content()
        with open("debug.html", "w", encoding="utf-8") as f:
            f.write(html)

        listagens = page.query_selector_all(".ticket-listing")
        print(f"🎫 Listagens encontradas: {len(listagens)}")

        menor_preco = None

        for item in listagens:
            texto = item.inner_text()
            print("---\n", texto)

            if setor.lower() not in texto.lower():
                continue

            match_qtd = re.search(r"(\d+)\s*Bilhete", texto)
            if match_qtd:
                qtd = int(match_qtd.group(1))
                if qtd != quantidade:
                    continue
            else:
                continue

            match_preco = re.search(r"\u20ac\s*(\d+(?:,\d{2})?)", texto)
            if match_preco:
                preco_str = match_preco.group(1).replace(",", ".")
                preco = float(preco_str)
                if menor_preco is None or preco < menor_preco:
                    menor_preco = preco

        browser.close()
        return menor_preco


def gerar_url(base_url: str, quantidade: int):
    if quantidade == 1:
        return base_url + "?quantity=1"
    elif 2 <= quantidade < 6:
        return base_url + "?quantity=2"
    else:
        return base_url + "?quantity=6"


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
            print(f"\U0001f9ea Comparando evento: {evento} | Setor: {setor} | Qtd: {quantidade} | Teu preço: {teu_preco}")

            url = gerar_url(BASE_LINK, quantidade)
            print("\U0001f50e URL usado:", url)

            preco_viagogo = obter_com_playwright(url, setor, quantidade)
            print("✅ Menor preço final encontrado:", f"{preco_viagogo}€" if preco_viagogo else "None")

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
