# routers/monitor_router.py
import asyncio, time
from typing import Optional
from fastapi import APIRouter, Body, HTTPException
from fastapi.responses import FileResponse
from pathlib import Path

from monitor.monitor_core import (
    screenshot_element, percent_diff, detect_non_red_seats, hash_key, DEFAULT_SELECTOR
)

router = APIRouter(prefix="/api/monitor", tags=["monitor"])

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
    # --- NOVOS CAMPOS ---
    "target_h2": None,
    "target_extra": None,
    "wait_selector": None,
    "extra_wait_ms": 800,
}

def _latest_file(path: Path, pattern: str = "*.png") -> Optional[Path]:
    files = sorted(path.glob(pattern), key=lambda p: p.stat().st_mtime, reverse=True)
    return files[0] if files else None

async def run_once_internal():
    outdir = Path(state["outdir"]); outdir.mkdir(parents=True, exist_ok=True)
    key = hash_key(state["url"])
    curr = outdir / f"{key}_curr.png"   # usa PNG aqui
    prev = outdir / f"{key}_prev.png"

    # screenshot do elemento (AGORA COM CLIQUE OPCIONAL)
    curr_path, final_url = await screenshot_element(
        state["url"],
        selector=state["selector"],
        out_path=curr,
        quantity=state["quantity"],
        extra_wait_ms=state["extra_wait_ms"],
        target_h2=state["target_h2"],
        target_extra=state["target_extra"],
        wait_selector=state["wait_selector"],
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
    try:
        if prev.exists():
            prev.unlink(missing_ok=True)
    except:
        pass
    Path(curr_path).rename(prev)

    result = {
        "url": final_url,
        "screenshot": str(prev),
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
    try:
        while state["running"]:
            try:
                await run_once_internal()
            except Exception as e:
                state["last_result"] = {"error": str(e), "ts": int(time.time())}
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
    non_red_threshold: float = Body(0.50, embed=True),
    # --- NOVOS PARÂMETROS ---
    target_h2: Optional[str] = Body(None, embed=True),
    target_extra: Optional[str] = Body(None, embed=True),
    wait_selector: Optional[str] = Body(None, embed=True),
    extra_wait_ms: int = Body(800, embed=True),
):
    # atualizar estado (se já estiver a correr, só atualiza)
    state.update({
        "url": url,
        "quantity": max(1, min(int(quantity), 6)),
        "interval_s": max(15, int(interval_s)),
        "diff_threshold": float(diff_threshold),
        "non_red": bool(non_red),
        "non_red_threshold": float(non_red_threshold),
        "extra_wait_ms": int(extra_wait_ms),
        "target_h2": target_h2,
        "target_extra": target_extra,
        "wait_selector": wait_selector,
    })
    if selector:
        state["selector"] = selector

    if state["running"]:
        return {"msg": "Monitor já estava ativo; parâmetros atualizados.", "state": state}

    state["running"] = True
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
        # novos campos expostos
        "target_h2": state["target_h2"],
        "target_extra": state["target_extra"],
        "wait_selector": state["wait_selector"],
        "extra_wait_ms": state["extra_wait_ms"],
        "selector": state["selector"],
    }

# (Opcional) servir o último screenshot diretamente:
@router.get("/screenshot/latest")
async def screenshot_latest():
    outdir = Path(state["outdir"])
    last = None
    # se já correu pelo menos 1x, usa o caminho guardado
    if state["last_result"] and state["last_result"].get("screenshot"):
        p = Path(state["last_result"]["screenshot"])
        if p.exists():
            last = p
    # fallback: procura o mais recente *.png
    if not last:
        last = _latest_file(outdir, "*.png")
    if not last or not last.exists():
        raise HTTPException(status_code=404, detail="Nenhum screenshot disponível.")
    return FileResponse(str(last), media_type="image/png", filename=last.name, headers={
        "Cache-Control": "no-store, max-age=0",
        "Pragma": "no-cache",
        "Expires": "0",
    })
