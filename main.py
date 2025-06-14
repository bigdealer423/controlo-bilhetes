
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List
from database import engine, get_db
from models import (
    Base,
    ListagemVendas,
    ListagemVendasCreate,
    EventoDropdown,
    EventoDropdownCreate,
    EventoCompleto,
    EventoCompletoCreate
)

Base.metadata.create_all(bind=engine)

app = FastAPI()

# Permitir pedidos do frontend no Vercel
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Pode testar com "*" para garantir funcionamento
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"status": "API online"}

# ---------------- LISTAGEM DE VENDAS ----------------
@app.get("/listagem_vendas")
def listar_vendas(db: Session = Depends(get_db)):
    return db.query(ListagemVendas).all()

@app.post("/listagem_vendas")
def criar_venda(venda: ListagemVendasCreate, db: Session = Depends(get_db)):
    nova_venda = ListagemVendas(**venda.dict())
    db.add(nova_venda)
    db.commit()
    db.refresh(nova_venda)
    return nova_venda

@app.delete("/listagem_vendas/{venda_id}")
def eliminar_venda(venda_id: int, db: Session = Depends(get_db)):
    venda = db.query(ListagemVendas).filter(ListagemVendas.id == venda_id).first()
    if not venda:
        raise HTTPException(status_code=404, detail="Venda não encontrada")
    db.delete(venda)
    db.commit()
    return {"detail": "Venda eliminada com sucesso"}

# ---------------- EVENTOS DROPDOWN ----------------
@app.get("/eventos_dropdown")
def listar_eventos_dropdown(db: Session = Depends(get_db)):
    try:
        return db.query(EventoDropdown).all()
    except Exception as e:
        print(f"Erro ao buscar eventos: {e}")
        raise HTTPException(status_code=500, detail="Erro interno ao listar eventos")

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

# ---------------- EVENTOS COMPLETOS ----------------
@app.get("/eventos_completos2")
def listar_eventos_completos2(db: Session = Depends(get_db)):
    return db.query(EventoCompleto).order_by(EventoCompleto.data_evento).all()

@app.post("/eventos_completos2")
def criar_evento_completo(evento: EventoCompletoCreate, db: Session = Depends(get_db)):
    novo_evento = EventoCompleto(**evento.dict())
    db.add(novo_evento)
    db.commit()
    db.refresh(novo_evento)
    return novo_evento

@app.delete("/eventos_completos2/{evento_id}")
def eliminar_evento_completo(evento_id: int, db: Session = Depends(get_db)):
    evento = db.query(EventoCompleto).filter(EventoCompleto.id == evento_id).first()
    if not evento:
        raise HTTPException(status_code=404, detail="Evento não encontrado")
    db.delete(evento)
    db.commit()
    return {"detail": "Evento completo eliminado com sucesso"}
