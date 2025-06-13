from fastapi import FastAPI
from pydantic import BaseModel
from typing import List

app = FastAPI()

@app.get("/")
def root():
    return {"status": "API online"}

# MODELOS
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

# BASE SIMULADA
eventos_db: List[Evento] = [
    Evento(
        id=1, nome="Benfica vs Porto", data="2025-06-15", local="Estádio da Luz",
        gasto=300.0, ganho=500.0, pago=True,
        bilhetes=[Bilhete(id="A1", setor="A", lugar="12", estado="Entregue")]
    ),
    Evento(
        id=2, nome="Sporting vs Braga", data="2025-06-18", local="Alvalade",
        gasto=250.0, ganho=430.0, pago=False,
        bilhetes=[Bilhete(id="B3", setor="B", lugar="24", estado="Entregue")]
    ),
    Evento(id=3, nome="Porto vs Guimarães", data="2025-06-20", local="Dragão", gasto=150, ganho=300, pago=True, bilhetes=[]),
    Evento(id=4, nome="Braga vs Estoril", data="2025-06-22", local="Braga", gasto=120, ganho=250, pago=True, bilhetes=[]),
    Evento(id=5, nome="Marítimo vs Rio Ave", data="2025-06-23", local="Madeira", gasto=80, ganho=190, pago=False, bilhetes=[]),
    Evento(id=6, nome="Boavista vs Famalicão", data="2025-06-24", local="Bessa", gasto=100, ganho=220, pago=True, bilhetes=[]),
    Evento(id=7, nome="Gil Vicente vs Vizela", data="2025-06-25", local="Barcelos", gasto=90, ganho=200, pago=True, bilhetes=[]),
    Evento(id=8, nome="Casa Pia vs Arouca", data="2025-06-26", local="Leiria", gasto=70, ganho=160, pago=True, bilhetes=[]),
    Evento(id=9, nome="Chaves vs Farense", data="2025-06-27", local="Chaves", gasto=60, ganho=140, pago=False, bilhetes=[]),
    Evento(id=10, nome="Portimonense vs Moreirense", data="2025-06-28", local="Portimão", gasto=110, ganho=230, pago=True, bilhetes=[]),
]

@app.get("/eventos", response_model=List[Evento])
def listar_eventos():
    return eventos_db
