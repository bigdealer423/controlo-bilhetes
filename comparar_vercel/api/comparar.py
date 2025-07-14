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
    html = response.json().get("results", [{}])[0].get("content", "")
    soup = BeautifulSoup(html, "html.parser")
    return html[:500]  # Só para teste

@app.route("/api/comparar_listagens", methods=["POST"])
def comparar_listagens():
    data = request.get_json()
    url = data.get("url")
    if not url:
        return jsonify({"erro": "Falta URL"}), 400
    resultado = obter_preco_com_oxylabs(url)
    return jsonify({"preview": resultado})
