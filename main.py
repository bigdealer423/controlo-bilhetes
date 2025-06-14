
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List
from database import engine, get_db
from models import ListagemVendas, ListagemVendasCreate, EventoDropdown, EventoDropdownCreate, Base
Base.metadata.create_all(bind=engine)

app = FastAPI()

# Permitir pedidos do frontend no Vercel
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://controlo-bilhetes.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Criar as tabelas na base de dados (se não existirem)
Base.metadata.create_all(bind=engine)

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
