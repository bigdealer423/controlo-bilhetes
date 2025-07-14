from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
import requests
import re
from bs4 import BeautifulSoup

app = Flask(__name__)

USERNAME = "bigdealer.QM6VP"
PASSWORD = "Pedrosara18="
OXYLABS_URL = "https://scraper-api.oxylabs.io/v1"

def obter_preco_com_oxylabs(url: str):
    payload = {
        "url": url,
        "geo_location": "Portugal"
    }
    response = requests.post(
        OXYLABS_URL,
        auth=(USERNAME, PASSWORD),
        json=payload,
        timeout=60
    )
    html = response.json().get("results", [{}])[0].get("content", "")
    soup = BeautifulSoup(html, "html.parser")
    # Aqui podes pôr a lógica de parsing
    return html[:500]  # Só para exemplo

@app.post("/api/comparar_listagens")
async def comparar_listagens(request: Request):
    body = await request.json()
    url = body.get("url")
    if not url:
        return JSONResponse(status_code=400, content={"erro": "Falta URL"})
    resultado = obter_preco_com_oxylabs(url)
    return {"preview": resultado}
