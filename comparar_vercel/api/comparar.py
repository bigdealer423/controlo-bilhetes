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
            return f"Erro Oxylabs: {response.status_code} - {response.text}"

        html = response.json().get("results", [{}])[0].get("content", "")
        soup = BeautifulSoup(html, "html.parser")

        # Extrair setores e preços (exemplo simples)
        resultados = []
        for item in soup.select(".ticket-listing"):
            texto = item.get_text(separator=" ", strip=True)
            match_preco = re.search(r"€\s*(\d+(?:,\d{2})?)", texto)
            if match_preco:
                preco = float(match_preco.group(1).replace(",", "."))
                resultados.append(preco)

        return resultados if resultados else "Nenhuma listagem com preço encontrada."

    except Exception as e:
        return f"Erro na extração: {str(e)}"

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
    resultado = obter_preco_com_oxylabs(url)
    return jsonify({"preview": resultado})
