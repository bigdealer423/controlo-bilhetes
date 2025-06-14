from sqlalchemy import Column, Integer, String, Float, Date, Enum
from sqlalchemy.ext.declarative import declarative_base
from pydantic import BaseModel
from datetime import date
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

class EventoDropdown(Base):
    __tablename__ = "eventos_dropdown"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String, nullable=False, unique=True)

# NOVO: EventoCompleto (tabela nova para aba "Eventos")
class EventoCompleto(Base):
    __tablename__ = "eventos_completos"

    id = Column(Integer, primary_key=True, index=True)
    data_evento = Column(Date, nullable=False)
    evento = Column(String, nullable=False)
    estadio = Column(String, nullable=False)
    gasto = Column(Float, nullable=False)
    ganho = Column(Float, nullable=False)
    estado = Column(String, nullable=False)
# Garante que todas as tabelas estão incluídas antes da criação
from database import engine
Base.metadata.create_all(bind=engine)
# -------------------- SCHEMAS Pydantic --------------------

class ListagemVendasCreate(BaseModel):
    id_venda: int
    data_evento: date
    evento: str
    estadio: str
    ganho: float
    estado: str

    class Config:
        from_attributes = True

class EventoDropdownCreate(BaseModel):
    nome: str

    class Config:
        from_attributes = True

# NOVOS SCHEMAS
class EventoCompletoCreate(BaseModel):
    data_evento: date
    evento: str
    estadio: str
    gasto: float
    ganho: float
    estado: str

class EventoCompleto(EventoCompletoCreate):
    id: int

    class Config:
        from_attributes = True
from database import engine
Base.metadata.create_all(bind=engine)

