# routes/comparar.py
from fastapi import APIRouter, Request

comparar_router = APIRouter()

@comparar_router.post("/comparar_listagens")
async def comparar_listagens(request: Request):
    data = await request.json()
    listagens = data.get("listagens", [])

    # Lógica fictícia: devolve os primeiros 3 itens para teste
    resultado = []
    for item in listagens[:3]:
        resultado.append({
            "evento": item.get("EventName", ""),
            "setor": item.get("Section", ""),
            "teu_preco": item.get("PricePerTicketAmount", ""),
            "concorrente_preco": "Exemplo",
            "sugestao": "Reduzir preço" if item.get("PricePerTicketAmount") else "OK"
        })

    return resultado
