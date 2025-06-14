from sqlalchemy import Column, Integer, String, Float, Date, Enum
from sqlalchemy.ext.declarative import declarative_base
import enum
from pydantic import BaseModel
from datetime import date

Base = declarative_base()

# Enum do estado da venda
class EstadoVenda(str, enum.Enum):
    entregue = "Entregue"
    por_entregar = "Por entregar"
    disputa = "Disputa"
    pago = "Pago"

# Tabela principal de vendas
class ListagemVendas(Base):
    __tablename__ = "listagem_vendas"

    id = Column(Integer, primary_key=True, index=True)
    id_venda = Column(Integer, nullable=False)
    data_evento = Column(Date, nullable=False)
    evento = Column(String, nullable=False)
    estadio = Column(String, nullable=False)
    ganho = Column(Float, nullable=False)
    estado = Column(Enum(EstadoVenda), nullable=False)

# Tabela com eventos disponíveis para dropdown
class EventoDropdown(Base):
    __tablename__ = "eventos_dropdown"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String, nullable=False, unique=True)

# Esquemas Pydantic para validação

class ListagemVendasCreate(BaseModel):
    id_venda: int
    data_evento: date
    evento: str
    estadio: str
    ganho: float
    estado: str

    class Config:
        orm_mode = True

class EventoDropdownCreate(BaseModel):
    nome: str

    class Config:
        orm_mode = True

