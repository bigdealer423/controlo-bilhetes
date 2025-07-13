from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse
import re
from bs4 import BeautifulSoup
from playwright.async_api import async_playwright
import tempfile

comparar_router = APIRouter()

# Link fixo para o jogo SL Benfica vs Rio Ave FC
BASE_LINK = "https://www.viagogo.pt/Bilhetes-Desporto/Futebol/Primeira-Liga/SL-Benfica-Bilhetes/E-158801955"

async def obter_preco_com_playwright(base_url: str, setor: str, quantidade: int):
    # Determina a URL correta consoante a quantidade
    if quantidade == 1:
        url = base_url + "?quantity=1"
    elif 2 <= quantidade < 6:
        url = base_url + "?quantity=2"
    else:
        url = base_url + "?quantity=6"

    print("🔎 URL usado:", url)

    try:
        async with async_playwright() as p:
            browser = await p.firefox.launch(headless=True)
            page = await browser.new_page(user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36")
            print("🔗 A carregar:", url)
            await page.goto(url, wait_until="domcontentloaded", timeout=60000)
            await page.wait_for_timeout(5000)


            html = await page.content()
            print("📄 HTML tem", len(html), "caracteres")

            # Grava HTML para debug
            with tempfile.NamedTemporaryFile(delete=False, suffix=".html", mode="w", encoding="utf-8") as f:
                f.write(html)
                print(f"💾 HTML gravado em {f.name}")

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

            await browser.close()
            print(f"✅ Menor preço final encontrado: {menor_preco}€")
            return menor_preco

    except Exception as e:
        print("❌ Erro Playwright:", e)
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

            preco_viagogo = await obter_preco_com_playwright(BASE_LINK, setor, quantidade)

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
