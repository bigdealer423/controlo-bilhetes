
from sqlalchemy import Column, Integer, String, Float
from sqlalchemy.ext.declarative import declarative_base
from pydantic import BaseModel

Base = declarative_base()

class Compra(Base):
    __tablename__ = "compras"
    id = Column(Integer, primary_key=True, index=True)
    local_compras = Column(String, nullable=False)
    bancada = Column(String, nullable=False)
    setor = Column(String, nullable=False)
    fila = Column(String, nullable=True)
    quantidade = Column(Integer, nullable=False)
    gasto = Column(Float, nullable=False)

class CompraCreate(BaseModel):
    local_compras: str
    bancada: str
    setor: str
    fila: str
    quantidade: int
    gasto: float

    class Config:
        from_attributes = True
