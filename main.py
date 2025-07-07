from sqlalchemy import extract
from fastapi import File, UploadFile
from fastapi.staticfiles import StaticFiles
import os
import requests
from fastapi import FastAPI, Form, HTTPException, Depends, status, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, date, timedelta
from sqlalchemy import func, desc
from io import BytesIO
from database import engine, get_db
from models import (
    Base,
    ListagemVendas,
    ListagemVendasCreate,
    ListagemVendasUpdate,
    ListagemVendasOut,
    EventoDropdown,
    EventoDropdownCreate,
    EventoCompleto as EventoCompletoModel,
    EventoCompletoCreate,
    EventoCompletoOut,
    Compra,
    CompraCreate,
    CompraOut,
    ListagemVendasBase,
    ClubesInfo,
    ClubesInfoCreate,
    ClubesInfoOut,
    Disputa
)
resumo_mais_recente = {}
Base.metadata.create_all(bind=engine)

app = FastAPI()
# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://controlo-bilhetes.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


    
@app.get("/")
def root():
    return {"status": "API online"}




# ---------------- LISTAGEM DE VENDAS ----------------
@app.get("/listagem_vendas", response_model=List[ListagemVendasOut])
def obter_vendas(db: Session = Depends(get_db)):
    return db.query(ListagemVendas).all()


@app.get("/listagem_vendas/por_id_venda/{id_venda}")
def get_venda_por_id_venda(id_venda: int, db: Session = Depends(get_db)):
    venda = db.query(ListagemVendas).filter(ListagemVendas.id_venda == id_venda).first()
    if not venda:
        raise HTTPException(status_code=404, detail="Venda não encontrada")
    return venda

@app.get("/listagem_vendas/{venda_id}", response_model=ListagemVendasOut)
def obter_venda_por_id(venda_id: int, db: Session = Depends(get_db)):
    venda = db.query(ListagemVendas).filter(ListagemVendas.id == venda_id).first()
    if not venda:
        raise HTTPException(status_code=404, detail="Venda não encontrada")
    return venda

    
@app.post("/listagem_vendas")
def criar_venda(venda: ListagemVendasCreate, db: Session = Depends(get_db)):
    try:
        existente = db.query(ListagemVendas).filter_by(id_venda=venda.id_venda).first()
        if existente:
            raise HTTPException(status_code=409, detail="ID de venda já existe.")
        
        nova_venda = ListagemVendas(**venda.dict())
        db.add(nova_venda)
        db.commit()
        db.refresh(nova_venda)
        atualizar_ganhos_gastos_eventos(db)
        return nova_venda
    
    except HTTPException:
        raise  # ❗Deixe a exceção passar, sem embrulhar
    except Exception as e:
        print(f"Erro inesperado ao criar venda: {e}")
        raise HTTPException(status_code=500, detail="Erro inesperado ao criar venda")

@app.delete("/listagem_vendas/{venda_id}")
def eliminar_venda(venda_id: int, db: Session = Depends(get_db)):
    venda = db.query(ListagemVendas).filter(ListagemVendas.id == venda_id).first()
    if not venda:
        raise HTTPException(status_code=404, detail="Venda não encontrada")
    db.delete(venda)
    db.commit()
    atualizar_ganhos_gastos_eventos(db)
    return {"detail": "Venda eliminada com sucesso"}

@app.put("/listagem_vendas/{venda_id}")
def atualizar_venda(venda_id: int, venda: ListagemVendasUpdate, db: Session = Depends(get_db)):
    existente = db.query(ListagemVendas).filter(ListagemVendas.id == venda_id).first()
    if not existente:
        raise HTTPException(status_code=404, detail="Venda não encontrada")
    for key, value in venda.dict().items():
        setattr(existente, key, value)
    db.commit()
    db.refresh(existente)
    atualizar_ganhos_gastos_eventos(db)
    return existente
    
@app.get("/entregas_pendentes_proximos_15_dias")
def entregas_pendentes_proximos_15_dias(db: Session = Depends(get_db)):
    hoje = date.today()
    daqui_15 = hoje + timedelta(days=15)
    pendentes = (
        db.query(
            ListagemVendas.evento,
            ListagemVendas.data_evento,
            func.count(ListagemVendas.id).label("total_bilhetes")
        )
        .filter(ListagemVendas.estado == "Por entregar")
        .filter(ListagemVendas.data_evento >= hoje)
        .filter(ListagemVendas.data_evento <= daqui_15)
        .group_by(ListagemVendas.evento, ListagemVendas.data_evento)
        .order_by(ListagemVendas.data_evento.asc())
        .all()
    )

    return [
        {
            "evento": p.evento,
            "data_evento": p.data_evento.isoformat() if p.data_evento else None,
            "bilhetes": int(p.total_bilhetes or 0)
        }
        for p in pendentes
    ]


# ---------------- EVENTOS DROPDOWN ----------------
@app.get("/eventos_dropdown")
def listar_eventos_dropdown(db: Session = Depends(get_db)):
    return db.query(EventoDropdown).all()

@app.post("/eventos_dropdown")
def adicionar_evento_dropdown(evento: EventoDropdownCreate, db: Session = Depends(get_db)):
    evento_existente = db.query(EventoDropdown).filter_by(nome=evento.nome).first()
    if evento_existente:
        raise HTTPException(status_code=400, detail="Evento já existe.")
    novo_evento = EventoDropdown(**evento.dict())
    db.add(novo_evento)
    db.commit()
    db.refresh(novo_evento)
    return novo_evento

@app.delete("/eventos_dropdown/{evento_id}")
def eliminar_evento_dropdown(evento_id: int, db: Session = Depends(get_db)):
    evento = db.query(EventoDropdown).filter(EventoDropdown.id == evento_id).first()
    if not evento:
        raise HTTPException(status_code=404, detail="Evento não encontrado")
    db.delete(evento)
    db.commit()
    return {"detail": "Evento eliminado com sucesso"}

@app.put("/eventos_dropdown/{evento_id}")
def editar_evento_dropdown(evento_id: int, evento: EventoDropdownCreate, db: Session = Depends(get_db)):
    evento_existente = db.query(EventoDropdown).filter(EventoDropdown.id == evento_id).first()
    if not evento_existente:
        raise HTTPException(status_code=404, detail="Evento não encontrado")
    
    nome_antigo = evento_existente.nome
    nome_novo = evento.nome

    evento_existente.nome = nome_novo
    db.commit()

    # Atualizar nas tabelas relacionadas
    db.query(EventoCompletoModel).filter(EventoCompletoModel.evento == nome_antigo).update({"evento": nome_novo})
    db.query(ListagemVendas).filter(ListagemVendas.evento == nome_antigo).update({"evento": nome_novo})
    db.query(Compra).filter(Compra.evento == nome_antigo).update({"evento": nome_novo})
    db.commit()

    return {"detail": "Evento atualizado e propagado com sucesso"}


# ---------------- EVENTOS COMPLETOS ----------------
# ✅ Função auxiliar para recalcular e guardar valores corretos
def atualizar_ganhos_gastos_eventos(db: Session):
    eventos = db.query(EventoCompletoModel).all()
    compras = db.query(Compra).all()
    vendas = db.query(ListagemVendas).all()

    def normalizar(texto):
        return texto.strip().lower() if texto else ""

    for evento in eventos:
        evento_nome = normalizar(evento.evento)
        total_gasto = sum(c.gasto for c in compras if normalizar(c.evento) == evento_nome)
        total_ganho = sum(v.ganho for v in vendas if normalizar(v.evento) == evento_nome)

        evento.gasto = total_gasto
        evento.ganho = total_ganho

    db.commit()


# ✅ Endpoint para listar eventos já atualizados
@app.get("/eventos_completos2", response_model=List[EventoCompletoOut])
def listar_eventos_completos2(
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1),
    db: Session = Depends(get_db)
):
    atualizar_ganhos_gastos_eventos(db)
    eventos = (
        db.query(EventoCompletoModel)
        .order_by(EventoCompletoModel.data_evento, EventoCompletoModel.id)  # <- adiciona o .id
        .offset(skip)
        .limit(limit)
        .all()
    )

    return eventos

# ✅ Criação de novo evento
@app.post("/eventos_completos2", response_model=EventoCompletoOut)
def criar_evento_completo(evento: EventoCompletoCreate, db: Session = Depends(get_db)):
    novo_evento = EventoCompletoModel(**evento.dict())
    db.add(novo_evento)
    db.commit()
    db.refresh(novo_evento)
    atualizar_ganhos_gastos_eventos(db)
    return novo_evento

# ✅ Eliminação de evento
@app.delete("/eventos_completos2/{evento_id}")
def eliminar_evento_completo(evento_id: int, db: Session = Depends(get_db)):
    evento = db.query(EventoCompletoModel).filter(EventoCompletoModel.id == evento_id).first()
    if not evento:
        raise HTTPException(status_code=404, detail="Evento não encontrado")
    db.delete(evento)
    db.commit()
    atualizar_ganhos_gastos_eventos(db)
    return {"detail": "Evento completo eliminado com sucesso"}

# ✅ Atualização de evento
@app.put("/eventos_completos2/{evento_id}", response_model=EventoCompletoOut)
def atualizar_evento_completo(evento_id: int, evento: EventoCompletoCreate, db: Session = Depends(get_db)):
    evento_existente = db.query(EventoCompletoModel).filter(EventoCompletoModel.id == evento_id).first()
    if not evento_existente:
        raise HTTPException(status_code=404, detail="Evento não encontrado")
    
    for key, value in evento.dict().items():
        setattr(evento_existente, key, value)

    db.commit()
    db.refresh(evento_existente)
    atualizar_ganhos_gastos_eventos(db)
    return evento_existente



# ---------------- COMPRAS ----------------
@app.get("/compras", response_model=List[CompraOut])
def listar_compras(db: Session = Depends(get_db)):
    return db.query(Compra).all()

@app.get("/compras/{compra_id}", response_model=CompraOut)
def obter_compra_por_id(compra_id: int, db: Session = Depends(get_db)):
    compra = db.query(Compra).filter(Compra.id == compra_id).first()
    if not compra:
        raise HTTPException(status_code=404, detail="Compra não encontrada")
    return compra


@app.post("/compras", response_model=CompraOut)
def criar_compra(compra: CompraCreate, db: Session = Depends(get_db)):
    nova_compra = Compra(**compra.dict())
    db.add(nova_compra)
    db.commit()
    db.refresh(nova_compra)
    atualizar_ganhos_gastos_eventos(db)
    return nova_compra

@app.delete("/compras/{compra_id}")
def eliminar_compra(compra_id: int, db: Session = Depends(get_db)):
    compra = db.query(Compra).filter(Compra.id == compra_id).first()
    if not compra:
        raise HTTPException(status_code=404, detail="Compra não encontrada")
    db.delete(compra)
    db.commit()
    atualizar_ganhos_gastos_eventos(db)
    return {"detail": "Compra eliminada com sucesso"}

@app.put("/compras/{compra_id}", response_model=CompraOut)
def atualizar_compra(compra_id: int, compra: CompraCreate, db: Session = Depends(get_db)):
    compra_existente = db.query(Compra).filter(Compra.id == compra_id).first()
    if not compra_existente:
        raise HTTPException(status_code=404, detail="Compra não encontrada")

    for key, value in compra.dict().items():
        setattr(compra_existente, key, value)

    db.commit()
    db.refresh(compra_existente)
    atualizar_ganhos_gastos_eventos(db)
    return compra_existente

# ---------------- HEALTH CHECK ----------------
@app.get("/ping")
def ping():
    return {"status": "ativo"}


from datetime import datetime, date
from sqlalchemy import func
# ---------------- RESUMO DIÁRIO VENDAS ----------------
@app.get("/resumo_diario")
def resumo_diario(db: Session = Depends(get_db)):
    hoje = date.today()

    total_vendas = db.query(func.count()).filter(func.date(ListagemVendas.data_venda) == hoje).scalar()
    ganho_total = db.query(func.sum(ListagemVendas.ganho)).filter(func.date(ListagemVendas.data_venda) == hoje).scalar() or 0

    return {"total": total_vendas, "ganho": ganho_total}


@app.post("/forcar_leitura_email")
def forcar_execucao_workflow():
    token = os.getenv("GH_WEBHOOK_TOKEN")
    owner = "bigdealer423"
    repo = "controlo-bilhetes"
    workflow = "email_reader.yml"
    url = f"https://api.github.com/repos/{owner}/{repo}/actions/workflows/{workflow}/dispatches"

    headers = {
        "Authorization": f"token {token}",
        "Accept": "application/vnd.github.v3+json"
    }
    payload = {"ref": "main"}

    response = requests.post(url, headers=headers, json=payload)

    if response.status_code == 204:
        return {
            "mensagem": "🔁 Atualização iniciada",
            "detalhe": "O sistema está a verificar os e-mails. Aguarde 30 segundos e recarregue a tabela de vendas."
        }
    else:
        raise HTTPException(status_code=500, detail=f"Erro ao disparar workflow: {response.status_code}, {response.text}")

import json
import os
from fastapi.responses import JSONResponse



# ---------------- RESUMO DA LEITURA ----------------
resumo_mais_recente = {}

@app.post("/guardar_resumo")
def guardar_resumo(dados: dict):
    global resumo_mais_recente
    resumo_mais_recente = dados
    return {"status": "Resumo guardado com sucesso"}

@app.get("/resultado_leitura_email")
def obter_resumo():
    return resumo_mais_recente or {"mensagem": "Sem resumo disponível ainda."}

# ---------------- RESUMO MENSAL EVENTOS ----------------
@app.get("/resumo_mensal_eventos")
def resumo_mensal_eventos(db: Session = Depends(get_db)):
    hoje = datetime.now()
    mes = hoje.month
    ano = hoje.year

    # Eventos do mês atual
    eventos_mes = db.query(EventoCompletoModel).filter(
        extract("month", EventoCompletoModel.data_evento) == mes,
        extract("year", EventoCompletoModel.data_evento) == ano
    ).all()

    # Todos os eventos (para pagamento)
    todos_eventos = db.query(EventoCompletoModel).all()

    lucro = 0
    pagamento = 0

    # ✅ LUCRO: eventos do mês atual, estado="Pago" ou ganho>0
    for evento in eventos_mes:
        ganho = evento.ganho or 0
        gasto = evento.gasto or 0
        estado = (evento.estado or "").strip().lower()

        if estado == "pago" or ganho > 0:
            lucro += ganho - gasto

    # ✅ PAGAMENTO: eventos com estado ≠ "Pago" e ganho > 0
    for evento in todos_eventos:
        ganho = evento.ganho or 0
        estado = (evento.estado or "").strip().lower()

        if estado != "pago" and ganho > 0:
            pagamento += ganho

    return {
        "lucro": round(lucro),
        "pagamento": round(pagamento)
    }
    
# 🔹 Criar as tabelas no arranque
ClubesInfo.__table__.create(bind=engine, checkfirst=True)

# 🔹 GET todos os clubes
@app.get("/clubes", response_model=List[ClubesInfoOut])
def get_clubes(db: Session = Depends(get_db)):
    return db.query(ClubesInfo).all()

# 🔹 POST novo clube
@app.post("/clubes", response_model=ClubesInfoOut)
def add_clube(clube: ClubesInfoCreate, db: Session = Depends(get_db)):
    novo_clube = ClubesInfo(**clube.dict())
    db.add(novo_clube)
    db.commit()
    db.refresh(novo_clube)
    return novo_clube

# 🔹 PUT editar clube
@app.put("/clubes/{clube_id}", response_model=ClubesInfoOut)
def edit_clube(clube_id: int, clube: ClubesInfoCreate, db: Session = Depends(get_db)):
    clube_db = db.query(ClubesInfo).filter(ClubesInfo.id == clube_id).first()
    if not clube_db:
        raise HTTPException(status_code=404, detail="Clube não encontrado")
    for key, value in clube.dict().items():
        setattr(clube_db, key, value)
    db.commit()
    db.refresh(clube_db)
    return clube_db

# 🔹 DELETE clube
@app.delete("/clubes/{clube_id}")
def delete_clube(clube_id: int, db: Session = Depends(get_db)):
    clube_db = db.query(ClubesInfo).filter(ClubesInfo.id == clube_id).first()
    if not clube_db:
        raise HTTPException(status_code=404, detail="Clube não encontrado")
    db.delete(clube_db)
    db.commit()
    return {"detail": "Clube eliminado com sucesso"}

#---------------------------------------------Guardar ficheiros do InfoClubes------------------

UPLOAD_FOLDER = "uploads/clubes"

# ✅ Garante que a pasta 'uploads/clubes' existe ao iniciar
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

@app.post("/clubes/{clube_id}/upload")
async def upload_ficheiros_clube(clube_id: int, files: list[UploadFile] = File(...)):
    pasta_clube = os.path.join(UPLOAD_FOLDER, str(clube_id))
    os.makedirs(pasta_clube, exist_ok=True)

    saved_files = []

    for file in files:
        file_path = os.path.join(pasta_clube, file.filename)
        with open(file_path, "wb") as f:
            f.write(await file.read())
        saved_files.append(file.filename)

    return {"uploaded_files": saved_files}

# ✅ Garante a montagem apenas após criar a pasta
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

@app.get("/clubes/{clube_id}/ficheiros")
def listar_ficheiros_clube(clube_id: int):
    pasta_clube = os.path.join(UPLOAD_FOLDER, str(clube_id))
    if not os.path.exists(pasta_clube):
        return []
    return os.listdir(pasta_clube)

@app.delete("/clubes/{clube_id}/ficheiros")
def eliminar_ficheiro_clube(clube_id: int, filename: str = Query(...)):
    pasta_clube = os.path.join("uploads/clubes", str(clube_id))
    file_path = os.path.join(pasta_clube, filename)

    if os.path.exists(file_path):
        os.remove(file_path)
        return {"detail": "Ficheiro eliminado com sucesso"}
    else:
        raise HTTPException(status_code=404, detail="Ficheiro não encontrado")


# Dashboardprincipal

@app.get("/eventos_calendario")
def eventos_calendario(db: Session = Depends(get_db)):
    eventos = db.query(EventoCompletoModel).all()
    eventos_lista = [
        {
            "id": evento.id,
            "nome_evento": evento.evento,   # <-- aqui corrigir de `evento.nome` para `evento.evento`
            "data_evento": evento.data_evento.strftime("%d/%m/%Y") if isinstance(evento.data_evento, date) else str(evento.data_evento)
        }
        for evento in eventos
    ]
    return eventos_lista



@app.get("/resumo_dashboard")
def resumo_dashboard(db: Session = Depends(get_db)):
    # Calcular ganhos
    ganhos = db.query(func.sum(ListagemVendas.ganho)).scalar() or 0

    # Calcular gastos
    gastos = db.query(func.sum(Compra.gasto)).scalar() or 0

    # Calcular lucro líquido
    lucro = ganhos - gastos

    # Contar entregas pendentes
    entregas_pendentes = db.query(ListagemVendas).filter(ListagemVendas.estado == "Por entregar").count()

    # Obter últimos 5 eventos/vendas únicos por evento e data
    ultimos_eventos_query = (
        db.query(
            ListagemVendas.evento.label("nome_evento"),
            ListagemVendas.data_evento,
            func.max(ListagemVendas.estado).label("estado")
        )
        .group_by(ListagemVendas.evento, ListagemVendas.data_evento)
        .order_by(desc(ListagemVendas.data_evento))
        .limit(5)
        .all()
    )

    ultimos_eventos = [
        {
            "nome_evento": e.nome_evento,
            "data_evento": e.data_evento.strftime("%d/%m/%Y") if isinstance(e.data_evento, date) else str(e.data_evento),
            "estado": e.estado,
        }
        for e in ultimos_eventos_query
    ]

    return {
        "ganhos": ganhos,
        "gastos": gastos,
        "lucro": lucro,
        "entregasPendentes": entregas_pendentes,
        "ultimos_eventos": ultimos_eventos
    }



