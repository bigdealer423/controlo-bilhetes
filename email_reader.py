import requests

def enviar_para_fastapi(id_venda, evento, ganho):
    url = "http://localhost:8000/listagem_vendas"  # ou o domínio do Render se estiver em produção
    payload = {
        "id_venda": int(id_venda),
        "evento": evento,
        "ganho": float(ganho),
        "data_evento": datetime.now().strftime("%Y-%m-%d"),
        "estadio": "",
        "estado": "Por entregar"
    }
    try:
        resp = requests.post(url, json=payload)
        if resp.status_code == 200:
            print(f"Registo {id_venda} inserido com sucesso.")
        else:
            print(f"Erro ao inserir registo {id_venda}: {resp.status_code} - {resp.text}")
    except Exception as e:
        print(f"Erro de ligação à API: {e}")

  enviar_para_fastapi(id_encomenda, evento, ganho_total)
