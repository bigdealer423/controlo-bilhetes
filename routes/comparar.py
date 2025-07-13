import os
os.environ["PLAYWRIGHT_BROWSERS_PATH"] = "/opt/render/project/.playwright"
from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse
import re
import asyncio
from playwright.async_api import async_playwright

comparar_router = APIRouter()

# Função para obter preços do Viagogo
async def obter_preco_viagogo(evento_nome: str, setor: str, quantidade: int):
    url_base = "https://www.viagogo.pt/Bilhetes-Desporto/Futebol/Primeira-Liga"

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        await page.goto(url_base, timeout=60000)

        # Clicar no evento se existir
        try:
            evento_link = await page.locator(f"text={evento_nome}").first
            await evento_link.click()
            await page.wait_for_load_state("domcontentloaded")
        except Exception:
            await browser.close()
            return None  # Evento não encontrado

        # Esperar por ofertas carregadas
        await page.wait_for_timeout(3000)

        # Procurar preços por setor e quantidade
        listagens = await page.locator(".ticket-listing").all()
        menor_preco = None

        for item in listagens:
            texto = await item.inner_text()
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

        await browser.close()
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

            preco_viagogo = await obter_preco_viagogo(evento, setor, quantidade)

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
        print("❌ Erro na comparação:", e)  # <-- LOG PARA DEBUG
        return JSONResponse(status_code=500, content={"erro": str(e)})

