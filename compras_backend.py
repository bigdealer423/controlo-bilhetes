
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from database import get_db
from models import Compra, CompraCreate

router = APIRouter()

@router.get("/compras")
def listar_compras(db: Session = Depends(get_db)):
    return db.query(Compra).all()

@router.post("/compras")
def criar_compra(compra: CompraCreate, db: Session = Depends(get_db)):
    nova_compra = Compra(**compra.dict())
    db.add(nova_compra)
    db.commit()
    db.refresh(nova_compra)
    return nova_compra

@router.delete("/compras/{compra_id}")
def eliminar_compra(compra_id: int, db: Session = Depends(get_db)):
    compra = db.query(Compra).filter(Compra.id == compra_id).first()
    if not compra:
        raise HTTPException(status_code=404, detail="Compra não encontrada")
    db.delete(compra)
    db.commit()
    return {"detail": "Compra eliminada com sucesso"}
