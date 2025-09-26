# routers/monitor_router.py
import asyncio, time, argparse, json
from typing import Optional
from fastapi import APIRouter, Body
from pathlib import Path

# importa utilitários do módulo que já criámos
from monitor.monitor_core import (
    screenshot_element, percent_diff, detect_non_red_seats, hash_key, DEFAULT_SELECTOR
)

router = APIRouter(prefix="/api/monitor", tags=["monitor"])

# --- estado em memória ---
state = {
    "running": False,
    "task": None,
    "url": None,
    "quantity": 2,
    "selector": DEFAULT_SELECTOR,
    "diff_threshold": 0.10,
    "non_red": True,
    "non_red_threshold": 0.50,
    "interval_s": 60,
    "outdir": "out",
    "last_result": None,
    "last_run_ts": None,
}

async def run_once_internal():
    """Executa UM ciclo: screenshot -> comparação -> (opcional) overlay."""
    outdir = Path(state["outdir"]); outdir.mkdir(parents=True, exist_ok=True)
    key = hash_key(state["url"])
    curr = outdir / f"{key}_curr.jpg"
    prev = outdir / f"{key}_prev.jpg"

    # screenshot do elemento
    curr_path, final_url = await screenshot_element(
        state["url"],
        selector=state["selector"],
        out_path=curr,
        quantity=state["quantity"],
        extra_wait_ms=800
    )

    diff_pct = None
    if prev.exists():
        diff_pct = round(percent_diff(prev, curr), 5)

    non_red_pct = None
    overlay = None
    if state["non_red"]:
        non_red_pct, overlay = detect_non_red_seats(curr)

    changed_over_threshold = (
        diff_pct is not None and diff_pct >= state["diff_threshold"]
    )
    # rodar prev/curr para a próxima comparação
    try:
        if prev.exists():
            prev.unlink(missing_ok=True)
    except:
        pass
    Path(curr_path).rename(prev)

    result = {
        "url": final_url,
        "screenshot": str(prev),        # último print “estável”
        "diff_pct": diff_pct,
        "non_red_pct": non_red_pct,
        "overlay": str(overlay) if overlay else None,
        "changed_over_threshold": bool(changed_over_threshold),
        "ts": int(time.time())
    }
    state["last_result"] = result
    state["last_run_ts"] = result["ts"]
    return result

async def loop_monitor():
    """Loop enquanto running=True (um ciclo por intervalo)."""
    try:
        while state["running"]:
            try:
                await run_once_internal()
            except Exception as e:
                state["last_result"] = {"error": str(e), "ts": int(time.time())}
            # espera
            for _ in range(state["interval_s"]):
                if not state["running"]:
                    break
                await asyncio.sleep(1)
    finally:
        state["task"] = None

@router.post("/start")
async def start_monitor(
    url: str = Body(..., embed=True),
    quantity: int = Body(2, embed=True),
    interval_s: int = Body(60, embed=True),
    selector: Optional[str] = Body(None, embed=True),
    diff_threshold: float = Body(0.10, embed=True),
    non_red: bool = Body(True, embed=True),
    non_red_threshold: float = Body(0.50, embed=True)
):
    if state["running"]:
        # se já estiver a correr, apenas atualiza parâmetros e URL
        state.update({
            "url": url,
            "quantity": max(1, min(int(quantity), 6)),
            "interval_s": max(15, int(interval_s)),  # pouco abaixo de 15s não é saudável
            "diff_threshold": float(diff_threshold),
            "non_red": bool(non_red),
            "non_red_threshold": float(non_red_threshold),
        })
        if selector:
            state["selector"] = selector
        return {"msg": "Monitor já estava ativo; parâmetros atualizados.", "state": state}

    # iniciar
    state["running"] = True
    state["url"] = url
    state["quantity"] = max(1, min(int(quantity), 6))
    state["interval_s"] = max(15, int(interval_s))
    if selector:
        state["selector"] = selector
    state["diff_threshold"] = float(diff_threshold)
    state["non_red"] = bool(non_red)
    state["non_red_threshold"] = float(non_red_threshold)

    state["task"] = asyncio.create_task(loop_monitor())
    return {"msg": "Monitor iniciado.", "state": state}

@router.post("/stop")
async def stop_monitor():
    state["running"] = False
    task = state.get("task")
    if task:
        task.cancel()
    state["task"] = None
    return {"msg": "Monitor parado.", "running": state["running"]}

@router.get("/status")
async def status_monitor():
    # não devolvemos o binário da imagem; devolvemos caminhos (para debug/logs)
    return {
        "running": state["running"],
        "url": state["url"],
        "quantity": state["quantity"],
        "interval_s": state["interval_s"],
        "diff_threshold": state["diff_threshold"],
        "non_red": state["non_red"],
        "non_red_threshold": state["non_red_threshold"],
        "last_run_ts": state["last_run_ts"],
        "last_result": state["last_result"],
    }
