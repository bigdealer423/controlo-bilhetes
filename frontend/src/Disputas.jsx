from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from models import ListagemVendas  # Importe o modelo adequado
from database import get_db

app = FastAPI()

@app.get("/disputas", response_model=List[ListagemVendas])
def get_disputas(db: Session = Depends(get_db)):
    # Consulta para pegar apenas as vendas com estado 'Disputa'
    disputas = db.query(ListagemVendas).filter(ListagemVendas.estado == 'Disputa').all()
    if not disputas:
        raise HTTPException(status_code=404, detail="Nenhuma disputa encontrada")
    return disputas
