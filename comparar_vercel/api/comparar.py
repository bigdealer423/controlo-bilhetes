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

    if response.status_code != 200:
        return f"Erro Oxylabs: {response.status_code} - {response.text}"

    html = response.json().get("results", [{}])[0].get("content", "")
    soup = BeautifulSoup(html, "html.parser")

    resultados = []
    for item in soup.select(".ticket-listing"):
        texto = item.get_text(separator=" ", strip=True)
        match_setor = re.search(r"Setor\s*:\s*(.*?)\s", texto)
        match_preco = re.search(r"€\s*(\d+(?:,\d{2})?)", texto)

        if match_setor and match_preco:
            setor = match_setor.group(1)
            preco = float(match_preco.group(1).replace(",", "."))
            resultados.append({"setor": setor, "preco": preco})

    return resultados if resultados else "Nenhuma listagem encontrada"


@app.route("/api/comparar_listagens", methods=["POST"])
def comparar_listagens():
    data = request.get_json()
    url = data.get("url")
    if not url:
        return jsonify({"erro": "Falta o campo 'url'"}), 400
    resultado = obter_preco_com_oxylabs(url)
    return jsonify({"preview": resultado})

# GET para a homepage (evita erro 404 no browser)
@app.route("/api/testar_viagogo")
def testar_viagogo():
    url = "https://www.viagogo.pt/Bilhetes-Desporto/Futebol/Primeira-Liga/SL-Benfica-Bilhetes/E-158801955?quantity=1"
    resultado = obter_preco_com_oxylabs(url)
    return jsonify({"preview": resultado})
