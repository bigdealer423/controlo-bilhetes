from sqlalchemy import extract
from fastapi import File, UploadFile
import os
import requests
from fastapi import FastAPI, Form, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, date
from sqlalchemy import func
from io import BytesIO
from database import engine, get_db
from models import (
    Base,
    ListagemVendas,
    ListagemVendasCreate,
    ListagemVendasUpdate,
    ListagemVendasOut,
    EventoDropdown,
    EventoDropdownCreate,
    EventoCompleto as EventoCompletoModel,
    EventoCompletoCreate,
    EventoCompletoOut,
    Compra,
    CompraCreate,
    CompraOut,
    ListagemVendasBase,
    Disputa
)
resumo_mais_recente = {}
Base.metadata.create_all(bind=engine)

app = FastAPI()
# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://controlo-bilhetes.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


    
@app.get("/")
def root():
    return {"status": "API online"}




# ---------------- LISTAGEM DE VENDAS ----------------
@app.get("/listagem_vendas", response_model=List[ListagemVendasOut])
def obter_vendas(db: Session = Depends(get_db)):
    return db.query(ListagemVendas).all()


@app.get("/listagem_vendas/por_id_venda/{id_venda}")
def get_venda_por_id_venda(id_venda: int, db: Session = Depends(get_db)):
    venda = db.query(ListagemVendas).filter(ListagemVendas.id_venda == id_venda).first()
    if not venda:
        raise HTTPException(status_code=404, detail="Venda não encontrada")
    return venda

@app.get("/listagem_vendas/{venda_id}", response_model=ListagemVendasOut)
def obter_venda_por_id(venda_id: int, db: Session = Depends(get_db)):
    venda = db.query(ListagemVendas).filter(ListagemVendas.id == venda_id).first()
    if not venda:
        raise HTTPException(status_code=404, detail="Venda não encontrada")
    return venda

    
@app.post("/listagem_vendas")
def criar_venda(venda: ListagemVendasCreate, db: Session = Depends(get_db)):
    try:
        existente = db.query(ListagemVendas).filter_by(id_venda=venda.id_venda).first()
        if existente:
            raise HTTPException(status_code=409, detail="ID de venda já existe.")
        
        nova_venda = ListagemVendas(**venda.dict())
        db.add(nova_venda)
        db.commit()
        db.refresh(nova_venda)
        atualizar_ganhos_gastos_eventos(db)
        return nova_venda
    
    except HTTPException:
        raise  # ❗Deixe a exceção passar, sem embrulhar
    except Exception as e:
        print(f"Erro inesperado ao criar venda: {e}")
        raise HTTPException(status_code=500, detail="Erro inesperado ao criar venda")

@app.delete("/listagem_vendas/{venda_id}")
def eliminar_venda(venda_id: int, db: Session = Depends(get_db)):
    venda = db.query(ListagemVendas).filter(ListagemVendas.id == venda_id).first()
    if not venda:
        raise HTTPException(status_code=404, detail="Venda não encontrada")
    db.delete(venda)
    db.commit()
    atualizar_ganhos_gastos_eventos(db)
    return {"detail": "Venda eliminada com sucesso"}

@app.put("/listagem_vendas/{venda_id}")
def atualizar_venda(venda_id: int, venda: ListagemVendasUpdate, db: Session = Depends(get_db)):
    existente = db.query(ListagemVendas).filter(ListagemVendas.id == venda_id).first()
    if not existente:
        raise HTTPException(status_code=404, detail="Venda não encontrada")
    for key, value in venda.dict().items():
        setattr(existente, key, value)
    db.commit()
    db.refresh(existente)
    atualizar_ganhos_gastos_eventos(db)
    return existente

# ---------------- EVENTOS DROPDOWN ----------------
@app.get("/eventos_dropdown")
def listar_eventos_dropdown(db: Session = Depends(get_db)):
    return db.query(EventoDropdown).all()

@app.post("/eventos_dropdown")
def adicionar_evento_dropdown(evento: EventoDropdownCreate, db: Session = Depends(get_db)):
    evento_existente = db.query(EventoDropdown).filter_by(nome=evento.nome).first()
    if evento_existente:
        raise HTTPException(status_code=400, detail="Evento já existe.")
    novo_evento = EventoDropdown(**evento.dict())
    db.add(novo_evento)
    db.commit()
    db.refresh(novo_evento)
    return novo_evento

@app.delete("/eventos_dropdown/{evento_id}")
def eliminar_evento_dropdown(evento_id: int, db: Session = Depends(get_db)):
    evento = db.query(EventoDropdown).filter(EventoDropdown.id == evento_id).first()
    if not evento:
        raise HTTPException(status_code=404, detail="Evento não encontrado")
    db.delete(evento)
    db.commit()
    return {"detail": "Evento eliminado com sucesso"}

@app.put("/eventos_dropdown/{evento_id}")
def editar_evento_dropdown(evento_id: int, evento: EventoDropdownCreate, db: Session = Depends(get_db)):
    evento_existente = db.query(EventoDropdown).filter(EventoDropdown.id == evento_id).first()
    if not evento_existente:
        raise HTTPException(status_code=404, detail="Evento não encontrado")
    
    nome_antigo = evento_existente.nome
    nome_novo = evento.nome

    evento_existente.nome = nome_novo
    db.commit()

    # Atualizar nas tabelas relacionadas
    db.query(EventoCompletoModel).filter(EventoCompletoModel.evento == nome_antigo).update({"evento": nome_novo})
    db.query(ListagemVendas).filter(ListagemVendas.evento == nome_antigo).update({"evento": nome_novo})
    db.query(Compra).filter(Compra.evento == nome_antigo).update({"evento": nome_novo})
    db.commit()

    return {"detail": "Evento atualizado e propagado com sucesso"}


# ---------------- EVENTOS COMPLETOS ----------------
# ✅ Função auxiliar para recalcular e guardar valores corretos
def atualizar_ganhos_gastos_eventos(db: Session):
    eventos = db.query(EventoCompletoModel).all()
    compras = db.query(Compra).all()
    vendas = db.query(ListagemVendas).all()

    for evento in eventos:
        total_gasto = sum(c.gasto for c in compras if c.evento == evento.evento)
        total_ganho = sum(v.ganho for v in vendas if v.evento == evento.evento)

        evento.gasto = total_gasto
        evento.ganho = total_ganho

    db.commit()

# ✅ Endpoint para listar eventos já atualizados
@app.get("/eventos_completos2", response_model=List[EventoCompletoOut])
def listar_eventos_completos2(db: Session = Depends(get_db)):
    atualizar_ganhos_gastos_eventos(db)
    return db.query(EventoCompletoModel).order_by(EventoCompletoModel.data_evento).all()

# ✅ Criação de novo evento
@app.post("/eventos_completos2", response_model=EventoCompletoOut)
def criar_evento_completo(evento: EventoCompletoCreate, db: Session = Depends(get_db)):
    novo_evento = EventoCompletoModel(**evento.dict())
    db.add(novo_evento)
    db.commit()
    db.refresh(novo_evento)
    atualizar_ganhos_gastos_eventos(db)
    return novo_evento

# ✅ Eliminação de evento
@app.delete("/eventos_completos2/{evento_id}")
def eliminar_evento_completo(evento_id: int, db: Session = Depends(get_db)):
    evento = db.query(EventoCompletoModel).filter(EventoCompletoModel.id == evento_id).first()
    if not evento:
        raise HTTPException(status_code=404, detail="Evento não encontrado")
    db.delete(evento)
    db.commit()
    atualizar_ganhos_gastos_eventos(db)
    return {"detail": "Evento completo eliminado com sucesso"}

# ✅ Atualização de evento
@app.put("/eventos_completos2/{evento_id}", response_model=EventoCompletoOut)
def atualizar_evento_completo(evento_id: int, evento: EventoCompletoCreate, db: Session = Depends(get_db)):
    evento_existente = db.query(EventoCompletoModel).filter(EventoCompletoModel.id == evento_id).first()
    if not evento_existente:
        raise HTTPException(status_code=404, detail="Evento não encontrado")
    
    for key, value in evento.dict().items():
        setattr(evento_existente, key, value)

    db.commit()
    db.refresh(evento_existente)
    atualizar_ganhos_gastos_eventos(db)
    return evento_existente



# ---------------- COMPRAS ----------------
@app.get("/compras", response_model=List[CompraOut])
def listar_compras(db: Session = Depends(get_db)):
    return db.query(Compra).all()

@app.get("/compras/{compra_id}", response_model=CompraOut)
def obter_compra_por_id(compra_id: int, db: Session = Depends(get_db)):
    compra = db.query(Compra).filter(Compra.id == compra_id).first()
    if not compra:
        raise HTTPException(status_code=404, detail="Compra não encontrada")
    return compra


@app.post("/compras", response_model=CompraOut)
def criar_compra(compra: CompraCreate, db: Session = Depends(get_db)):
    nova_compra = Compra(**compra.dict())
    db.add(nova_compra)
    db.commit()
    db.refresh(nova_compra)
    atualizar_ganhos_gastos_eventos(db)
    return nova_compra

@app.delete("/compras/{compra_id}")
def eliminar_compra(compra_id: int, db: Session = Depends(get_db)):
    compra = db.query(Compra).filter(Compra.id == compra_id).first()
    if not compra:
        raise HTTPException(status_code=404, detail="Compra não encontrada")
    db.delete(compra)
    db.commit()
    atualizar_ganhos_gastos_eventos(db)
    return {"detail": "Compra eliminada com sucesso"}

@app.put("/compras/{compra_id}", response_model=CompraOut)
def atualizar_compra(compra_id: int, compra: CompraCreate, db: Session = Depends(get_db)):
    compra_existente = db.query(Compra).filter(Compra.id == compra_id).first()
    if not compra_existente:
        raise HTTPException(status_code=404, detail="Compra não encontrada")

    for key, value in compra.dict().items():
        setattr(compra_existente, key, value)

    db.commit()
    db.refresh(compra_existente)
    atualizar_ganhos_gastos_eventos(db)
    return compra_existente

# ---------------- HEALTH CHECK ----------------
@app.get("/ping")
def ping():
    return {"status": "ativo"}


from datetime import datetime, date
from sqlalchemy import func
# ---------------- RESUMO DIÁRIO VENDAS ----------------
@app.get("/resumo_diario")
def resumo_diario(db: Session = Depends(get_db)):
    hoje = date.today()

    total_vendas = db.query(func.count()).filter(func.date(ListagemVendas.data_venda) == hoje).scalar()
    ganho_total = db.query(func.sum(ListagemVendas.ganho)).filter(func.date(ListagemVendas.data_venda) == hoje).scalar() or 0

    return {"total": total_vendas, "ganho": ganho_total}


@app.post("/forcar_leitura_email")
def forcar_execucao_workflow():
    token = os.getenv("GH_WEBHOOK_TOKEN")
    owner = "bigdealer423"
    repo = "controlo-bilhetes"
    workflow = "email_reader.yml"
    url = f"https://api.github.com/repos/{owner}/{repo}/actions/workflows/{workflow}/dispatches"

    headers = {
        "Authorization": f"token {token}",
        "Accept": "application/vnd.github.v3+json"
    }
    payload = {"ref": "main"}

    response = requests.post(url, headers=headers, json=payload)

    if response.status_code == 204:
        return {
            "mensagem": "🔁 Atualização iniciada",
            "detalhe": "O sistema está a verificar os e-mails. Aguarde 30 segundos e recarregue a tabela de vendas."
        }
    else:
        raise HTTPException(status_code=500, detail=f"Erro ao disparar workflow: {response.status_code}, {response.text}")

import json
import os
from fastapi.responses import JSONResponse



# ---------------- RESUMO DA LEITURA ----------------
resumo_mais_recente = {}

@app.post("/guardar_resumo")
def guardar_resumo(dados: dict):
    global resumo_mais_recente
    resumo_mais_recente = dados
    return {"status": "Resumo guardado com sucesso"}

@app.get("/resultado_leitura_email")
def obter_resumo():
    return resumo_mais_recente or {"mensagem": "Sem resumo disponível ainda."}

# ---------------- RESUMO MENSAL EVENTOS ----------------
@app.get("/resumo_mensal_eventos")
def resumo_mensal_eventos(db: Session = Depends(get_db)):
    hoje = datetime.now()
    mes = hoje.month
    ano = hoje.year

    # Eventos do mês atual
    eventos_mes = db.query(EventoCompletoModel).filter(
        extract("month", EventoCompletoModel.data_evento) == mes,
        extract("year", EventoCompletoModel.data_evento) == ano
    ).all()

    # Todos os eventos (para pagamento)
    todos_eventos = db.query(EventoCompletoModel).all()

    lucro = 0
    pagamento = 0

    # ✅ LUCRO: eventos do mês atual, estado="Pago" ou ganho>0
    for evento in eventos_mes:
        ganho = evento.ganho or 0
        gasto = evento.gasto or 0
        estado = (evento.estado or "").strip().lower()

        if estado == "pago" or ganho > 0:
            lucro += ganho - gasto

    # ✅ PAGAMENTO: eventos com estado ≠ "Pago" e ganho > 0
    for evento in todos_eventos:
        ganho = evento.ganho or 0
        estado = (evento.estado or "").strip().lower()

        if estado != "pago" and ganho > 0:
            pagamento += ganho

    return {
        "lucro": round(lucro),
        "pagamento": round(pagamento)
    }
    




