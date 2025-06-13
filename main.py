from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class Bilhete(BaseModel):
    id: str
    setor: str
    lugar: str
    estado: str

class Evento(BaseModel):
    id: int
    nome: str
    data: str
    local: str
    gasto: float
    ganho: float
    pago: bool
    bilhetes: List[Bilhete] = []

eventos_db: List[Evento] = []

@app.get("/eventos", response_model=List[Evento])
def listar_eventos():
    return eventos_db

@app.post("/eventos", response_model=Evento)
def criar_evento(evento: Evento):
    eventos_db.append(evento)
    return evento

@app.get("/eventos/{evento_id}", response_model=Evento)
def obter_evento(evento_id: int):
    for evento in eventos_db:
        if evento.id == evento_id:
            return evento
    raise HTTPException(status_code=404, detail="Evento não encontrado")

@app.put("/eventos/{evento_id}", response_model=Evento)
def atualizar_evento(evento_id: int, evento_atualizado: Evento):
    for i, evento in enumerate(eventos_db):
        if evento.id == evento_id:
            eventos_db[i] = evento_atualizado
            return evento_atualizado
    raise HTTPException(status_code=404, detail="Evento não encontrado")

@app.delete("/eventos/{evento_id}")
def eliminar_evento(evento_id: int):
    global eventos_db
    eventos_db = [e for e in eventos_db if e.id != evento_id]
    return {"detail": "Evento eliminado com sucesso"}
@app.get("/")
def root():
    return {"status": "API online"}
