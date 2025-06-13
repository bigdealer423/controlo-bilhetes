from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from models import Base, ListagemVendas
from pydantic import BaseModel
from typing import List
import os

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./test.db")

engine = create_engine(DATABASE_URL)  # Sem connect_args
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base.metadata.create_all(bind=engine)

app = FastAPI()

class ListagemVendasCreate(BaseModel):
    id_venda: int
    data_evento: str
    evento: str
    estadio: str
    ganho: float
    estado: str

    class Config:
        orm_mode = True

@app.post("/vendas", response_model=ListagemVendasCreate)
def criar_venda(venda: ListagemVendasCreate, db: Session = Depends(lambda: SessionLocal())):
    db_venda = ListagemVendas(**venda.dict())
    db.add(db_venda)
    db.commit()
    db.refresh(db_venda)
    return db_venda

@app.get("/vendas", response_model=List[ListagemVendasCreate])
def listar_vendas(db: Session = Depends(lambda: SessionLocal())):
    return db.query(ListagemVendas).all()

@app.delete("/vendas/{venda_id}")
def eliminar_venda(venda_id: int, db: Session = Depends(lambda: SessionLocal())):
    venda = db.query(ListagemVendas).filter(ListagemVendas.id_venda == venda_id).first()
    if venda is None:
        raise HTTPException(status_code=404, detail="Venda não encontrada")
    db.delete(venda)
    db.commit()
    return {"detail": "Venda eliminada com sucesso"}
