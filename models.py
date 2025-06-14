from sqlalchemy import Column, Integer, String, Float, Date, Enum, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from pydantic import BaseModel
from datetime import date
import enum

Base = declarative_base()

class EstadoVenda(str, enum.Enum):
    Entregue = "Entregue"
    Por_entregar = "Por entregar"
    Disputa = "Disputa"
    Pago = "Pago"

class ListagemVendas(Base):
    __tablename__ = "listagem_vendas"

    id = Column(Integer, primary_key=True, index=True)
    id_venda = Column(Integer, nullable=False)
    data_evento = Column(Date, nullable=False)
    evento = Column(String, nullable=False)
    estadio = Column(String, nullable=False)
    ganho = Column(Float, nullable=False)
    estado = Column(Enum(EstadoVenda), nullable=False)

class Evento(Base):
    __tablename__ = "eventos"

    id = Column(Integer, primary_key=True, index=True)
    data_evento = Column(Date, nullable=False)
    evento = Column(String, nullable=False)
    estadio = Column(String, nullable=False)
    gasto = Column(Float, default=0.0)
    ganho = Column(Float, default=0.0)
    estado = Column(Enum(EstadoVenda), default=EstadoVenda.Por_entregar)

# Pydantic schemas

class ListagemVendasCreate(BaseModel):
    id_venda: int
    data_evento: date
    evento: str
    estadio: str
    ganho: float
    estado: EstadoVenda

    class Config:
        orm_mode = True

class EventoCreate(BaseModel):
    data_evento: date
    evento: str
    estadio: str
    gasto: float
    ganho: float
    estado: EstadoVenda

    class Config:
        orm_mode = True

class EventoRead(BaseModel):
    id: int
    data_evento: date
    evento: str
    estadio: str
    gasto: float
    ganho: float
    estado: EstadoVenda
    lucro: float  # calculado como ganho - gasto

    class Config:
        orm_mode = True
