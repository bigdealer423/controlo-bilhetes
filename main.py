from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from database import engine, Base, get_db
from models import ListagemVenda, ListagemVendaCreate

app = FastAPI()

# Permitir pedidos do frontend no Vercel
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://controlo-bilhetes.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Criar as tabelas na base de dados (se não existirem)
Base.metadata.create_all(bind=engine)

@app.get("/")
def root():
    return {"status": "API online"}

@app.get("/listagem_vendas")
def listar_vendas(db: Session = Depends(get_db)):
    return db.query(ListagemVenda).all()

@app.post("/listagem_vendas")
def criar_venda(venda: ListagemVendaCreate, db: Session = Depends(get_db)):
    nova_venda = ListagemVenda(**venda.dict())
    db.add(nova_venda)
    db.commit()
    db.refresh(nova_venda)
    return nova_venda

@app.delete("/listagem_vendas/{venda_id}")
def eliminar_venda(venda_id: int, db: Session = Depends(get_db)):
    venda = db.query(ListagemVenda).filter(ListagemVenda.id == venda_id).first()
    if not venda:
        raise HTTPException(status_code=404, detail="Venda não encontrada")
    db.delete(venda)
    db.commit()
    return {"detail": "Venda eliminada com sucesso"}
