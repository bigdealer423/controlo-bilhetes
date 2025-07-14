from flask import Flask, request, jsonify
import requests
from bs4 import BeautifulSoup
import re

app = Flask(__name__)

USERNAME = "bigdealer.QM6VP"
PASSWORD = "Pedrosara18="
OXYLABS_URL = "https://scraper-api.oxylabs.io/v1"

def obter_preco_com_oxylabs(url: str):
    payload = {
        "url": url,
        "geo_location": "Portugal"
    }

    try:
        response = requests.post(
            OXYLABS_URL,
            auth=(USERNAME, PASSWORD),
            json=payload,
            timeout=60
        )

        if response.status_code != 200:
            return {
                "erro": f"Erro Oxylabs: {response.status_code}",
                "detalhe": response.text
            }

        # Tenta extrair HTML renderizado
        json_result = response.json()
        if not json_result.get("results"):
            return {"erro": "Resposta da Oxylabs sem resultados"}

        html = json_result["results"][0].get("content", "")
        if not html:
            return {"erro": "HTML vazio"}

        soup = BeautifulSoup(html, "html.parser")
        primeiros_500 = soup.get_text(separator="\n")[:500]

        return {"html_preview": primeiros_500}

    except Exception as e:
        return {"erro": "Exceção ao contactar Oxylabs", "detalhe": str(e)}


@app.route("/")
def home():
    return "✅ API Comparador ativa. Usa POST em /api/comparar_listagens ou GET em /api/testar_viagogo"

@app.route("/api/comparar_listagens", methods=["POST"])
def comparar_listagens():
    data = request.get_json()
    url = data.get("url")
    if not url:
        return jsonify({"erro": "Falta o campo 'url'"}), 400
    resultado = obter_preco_com_oxylabs(url)
    return jsonify({"preview": resultado})

@app.route("/api/testar_viagogo", methods=["GET"])
def testar_viagogo():
    url = "https://www.viagogo.pt/Bilhetes-Desporto/Futebol/Primeira-Liga/SL-Benfica-Bilhetes/E-158801955?quantity=1"
    return jsonify(obter_preco_com_oxylabs(url))

