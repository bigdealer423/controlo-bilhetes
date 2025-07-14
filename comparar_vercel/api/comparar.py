from flask import Flask, request, jsonify
import requests
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

    # Verifica se a resposta está OK
    if response.status_code != 200:
        return f"Erro Oxylabs: {response.status_code} - {response.text}"

    html = response.json().get("results", [{}])[0].get("content", "")
    soup = BeautifulSoup(html, "html.parser")

    return soup.prettify()[:1000]  # devolve os primeiros 1000 chars para debug

@app.route("/api/comparar_listagens", methods=["POST"])
def comparar_listagens():
    data = request.get_json()
    url = data.get("url")
    if not url:
        return jsonify({"erro": "Falta o campo 'url'"}), 400
    resultado = obter_preco_com_oxylabs(url)
    return jsonify({"preview": resultado})

# GET para a homepage (evita erro 404 no browser)
@app.route("/", methods=["GET"])
def home():
    return "✅ API Comparador ativa. Usa POST para /api/comparar_listagens"
