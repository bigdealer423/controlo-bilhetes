
from sqlalchemy import Column, Integer, String, Float, Date, Enum
from sqlalchemy.ext.declarative import declarative_base
import enum

Base = declarative_base()

class EstadoVenda(str, enum.Enum):
    entregue = "Entregue"
    por_entregar = "Por entregar"
    disputa = "Disputa"
    pago = "Pago"

class ListagemVendas(Base):
    __tablename__ = "listagem_vendas"

    id = Column(Integer, primary_key=True, index=True)
    id_venda = Column(Integer, nullable=False)
    data_evento = Column(Date, nullable=False)
    evento = Column(String, nullable=False)
    estadio = Column(String, nullable=False)
    ganho = Column(Float, nullable=False)
    estado = Column(Enum(EstadoVenda), nullable=False)
    
from pydantic import BaseModel
from datetime import date

class ListagemVendasCreate(BaseModel):
    id_venda: int
    data_evento: date
    evento: str
    estadio: str
    ganho: float
    estado: str  # pode usar o enum EstadoVenda se preferir validação

class Config:
        orm_mode = True

