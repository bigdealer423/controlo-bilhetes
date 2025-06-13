from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, Column, Integer, String, Float, Boolean, ForeignKey
from sqlalchemy.orm import declarative_base, sessionmaker, relationship, Session
from pydantic import BaseModel
from typing import List
import os

# CORS
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Base de Dados
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./teste.db")  # fallback para testes locais
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Modelos ORM
class Evento(Base):
    __tablename__ = "eventos"
    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String)
    data = Column(String)
    local = Column(String)
    gasto = Column(Float)
    ganho = Column(Float)
    pago = Column(Boolean)
    bilhetes = relationship("Bilhete", back_populates="evento")

class Bilhete(Base):
    __tablename__ = "bilhetes"
    id = Column(String, primary_key=True)
    setor = Column(String)
    lugar = Column(String)
    estado = Column(String)
    evento_id = Column(Integer, ForeignKey("eventos.id"))
    evento = relationship("Evento", back_populates="bilhetes")

# Criar tabelas
Base.metadata.create_all(bind=engine)

# Pydantic schemas
class BilheteSchema(BaseModel):
    id: str
    setor: str
    lugar: str
    estado: str

    class Config:
        orm_mode = True

class EventoSchema(BaseModel):
    id: int
    nome: str
    data: str
    local: str
    gasto: float
    ganho: float
    pago: bool
    bilhetes: List[BilheteSchema] = []

    class Config:
        orm_mode = True

# Dependência
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Endpoints
@app.get("/")
def root():
    return {"status": "API online"}

@app.get("/eventos", response_model=List[EventoSchema])
def listar_eventos(db: Session = Depends(get_db)):
    return db.query(Evento).all()

@app.post("/eventos", response_model=EventoSchema)
def criar_evento(evento: EventoSchema, db: Session = Depends(get_db)):
    novo_evento = Evento(**evento.dict(exclude={"bilhetes"}))
    db.add(novo_evento)
    db.commit()
    db.refresh(novo_evento)

    for bilhete in evento.bilhetes:
        novo_bilhete = Bilhete(**bilhete.dict(), evento_id=novo_evento.id)
        db.add(novo_bilhete)
    db.commit()
    db.refresh(novo_evento)

    return novo_evento

@app.get("/eventos/{evento_id}", response_model=EventoSchema)
def obter_evento(evento_id: int, db: Session = Depends(get_db)):
    evento = db.query(Evento).filter(Evento.id == evento_id).first()
    if not evento:
        raise HTTPException(status_code=404, detail="Evento não encontrado")
    return evento

@app.put("/eventos/{evento_id}", response_model=EventoSchema)
def atualizar_evento(evento_id: int, dados: EventoSchema, db: Session = Depends(get_db)):
    evento = db.query(Evento).filter(Evento.id == evento_id).first()
    if not evento:
        raise HTTPException(status_code=404, detail="Evento não encontrado")

    for key, value in dados.dict(exclude={"bilhetes"}).items():
        setattr(evento, key, value)

    db.query(Bilhete).filter(Bilhete.evento_id == evento_id).delete()
    for bilhete in dados.bilhetes:
        db.add(Bilhete(**bilhete.dict(), evento_id=evento_id))

    db.commit()
    db.refresh(evento)
    return evento

@app.delete("/eventos/{evento_id}")
def eliminar_evento(evento_id: int, db: Session = Depends(get_db)):
    evento = db.query(Evento).filter(Evento.id == evento_id).first()
    if not evento:
        raise HTTPException(status_code=404, detail="Evento não encontrado")

    db.delete(evento)
    db.commit()
    return {"detail": "Evento eliminado com sucesso"}
