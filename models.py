from sqlalchemy import Column, Integer, String, Float, Date, Enum
from sqlalchemy.ext.declarative import declarative_base
from pydantic import BaseModel
from datetime import date
import enum

Base = declarative_base()

# -------------------- ENUM --------------------

class EstadoVenda(str, enum.Enum):
    entregue = "Entregue"
    por_entregar = "Por entregar"
    disputa = "Disputa"
    pago = "Pago"

# -------------------- MODELOS SQLAlchemy --------------------

class ListagemVendas(Base):
    __tablename__ = "listagem_vendas"

    id = Column(Integer, primary_key=True, index=True)
    id_venda = Column(Integer, unique=True, index=True)
    data_venda = Column(Date)
    data_evento = Column(Date, nullable=False)
    evento = Column(String, nullable=False)
    estadio = Column(String, nullable=False)
    ganho = Column(Float, nullable=False)
    estado = Column(Enum(EstadoVenda), nullable=False)

    # Novos campos
    circulo_estado_venda = Column(String, default="cinzento")  # "vermelho", "verde", "cinzento"
    nota_estado_venda = Column(String, default="")

class EventoDropdown(Base):
    __tablename__ = "eventos_dropdown"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String, nullable=False, unique=True)

class EventoCompleto(Base):
    __tablename__ = "eventos_completos2"

    id = Column(Integer, primary_key=True, index=True)
    data_evento = Column(Date, nullable=False)
    evento = Column(String, nullable=False)
    estadio = Column(String, nullable=False)
    gasto = Column(Float, nullable=False)
    ganho = Column(Float, nullable=False)
    estado = Column(String, nullable=False)

class Compra(Base):
    __tablename__ = "compras"

    id = Column(Integer, primary_key=True, index=True)
    local_compras = Column(String, nullable=False)
    evento = Column(String, nullable=False)
    bancada = Column(String, nullable=False)
    setor = Column(String, nullable=False)
    fila = Column(String, nullable=True)
    quantidade = Column(Integer, nullable=False)
    gasto = Column(Float, nullable=False)

    # Novos campos
    circulo_estado_compra = Column(String, default="cinzento")
    nota_estado_compra = Column(String, default="")

# -------------------- SCHEMAS Pydantic --------------------

class ListagemVendasBase(BaseModel):
    id_venda: int
    data_venda: date
    data_evento: date
    evento: str
    estadio: str
    ganho: float
    estado: EstadoVenda
    circulo_estado_venda: str = "cinzento"
    nota_estado_venda: str = ""

    class Config:
        orm_mode = True

class ListagemVendasCreate(ListagemVendasBase):
    pass

class ListagemVendasUpdate(ListagemVendasBase):
    pass

class ListagemVendasOut(ListagemVendasBase):
    id: int

    class Config:
        from_attributes = True

class EventoDropdownCreate(BaseModel):
    nome: str

    class Config:
        from_attributes = True

class EventoCompletoBase(BaseModel):
    data_evento: date
    evento: str
    estadio: str
    gasto: float
    ganho: float
    estado: str

class EventoCompletoCreate(EventoCompletoBase):
    pass

class EventoCompletoOut(EventoCompletoBase):
    id: int

    class Config:
        from_attributes = True

class CompraCreate(BaseModel):
    local_compras: str
    evento: str
    bancada: str
    setor: str
    fila: str
    quantidade: int
    gasto: float
    circulo_estado_compra: str = "cinzento"
    nota_estado_compra: str = ""

    class Config:
        from_attributes = True

class CompraOut(CompraCreate):
    id: int

    class Config:
        from_attributes = True

class Disputa(BaseModel):
    data_disputa: date
    cobranca: float
    texto_adicional: str

    class Config:
        orm_mode = True
        from_attributes = True

# Criação automática das tabelas
from database import engine
Base.metadata.create_all(bind=engine)
