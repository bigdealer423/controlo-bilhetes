from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse

comparar_router = APIRouter()

@comparar_router.post("/comparar_listagens")
async def comparar_listagens(request: Request):
    try:
        body = await request.json()
        listagens = body.get("listagens", [])

        resultados = []
        for linha in listagens:
            evento = linha.get("EventName", "Desconhecido")
            setor = linha.get("Section", "N/A")
            teu_preco = float(linha.get("PricePerTicketAmount", 0))

            concorrente_preco = round(teu_preco * 0.95, 2)
            sugestao = "Manter" if teu_preco <= concorrente_preco else "Reduzir preço"

            resultados.append({
                "evento": evento,
                "setor": setor,
                "teu_preco": teu_preco,
                "concorrente_preco": concorrente_preco,
                "sugestao": sugestao,
            })

        return JSONResponse(content=resultados)

    except Exception as e:
        return JSONResponse(status_code=500, content={"erro": str(e)})
