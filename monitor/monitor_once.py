# -*- coding: utf-8 -*-
import argparse, asyncio, json, time
from pathlib import Path
from monitor_core import (
    screenshot_element, percent_diff, detect_non_red_seats, hash_key
)

def parse_args():
    ap = argparse.ArgumentParser("Executa UMA verificação (screenshot + comparação opcional).")
    ap.add_argument("--url", required=True, help="URL do jogo (podes trocar sempre que quiseres).")
    ap.add_argument("--selector", default=None, help="CSS do elemento do mapa (por omissão tenta svg/canvas).")
    ap.add_argument("--quantity", type=int, default=None, help="Adiciona ?quantity= (1..6) se não existir no URL.")
    ap.add_argument("--outdir", default="out", help="Diretório de saída.")
    ap.add_argument("--diff-threshold", type=float, default=0.10, help="Limiar para considerar mudança (em %).")
    ap.add_argument("--non-red", action="store_true", help="Ativar cálculo de % não-vermelho em bancada.")
    ap.add_argument("--wait", type=int, default=800, help="ms extra de espera após o mapa aparecer.")
    ap.add_argument("--rotate", action="store_true",
                    help="No fim, renomeia a imagem atual para *_prev.jpg (para usar na próxima execução).")
    return ap.parse_args()

async def main():
    args = parse_args()
    outdir = Path(args.outdir); outdir.mkdir(parents=True, exist_ok=True)
    key = hash_key(args.url)
    curr = outdir / f"{key}_curr.jpg"
    prev = outdir / f"{key}_prev.jpg"

    selector = args.selector or "svg, canvas, [data-testid='seatmap'] svg"
    curr_path, final_url = await screenshot_element(
        args.url, selector, curr, quantity=args.quantity, extra_wait_ms=args.wait
    )

    # comparação com 'prev' (se existir)
    diff_pct = None
    if prev.exists():
        diff_pct = round(percent_diff(prev, curr), 5)

    non_red_pct = None
    overlay = None
    if args.non_red:
        non_red_pct, overlay = detect_non_red_seats(curr)

    changed = (
        (diff_pct is not None and diff_pct >= args.diff_threshold) or
        (non_red_pct is not None and non_red_pct > 0)  # informativo (não alerta)
    )

    result = {
        "url": final_url,
        "screenshot": str(curr),
        "diff_pct": diff_pct,
        "non_red_pct": non_red_pct,
        "overlay": str(overlay) if overlay else None,
        "changed_over_threshold": bool(diff_pct is not None and diff_pct >= args.diff_threshold),
        "ts": int(time.time())
    }
    print(json.dumps(result, ensure_ascii=False, indent=2))

    # prepara próxima corrida
    if args.rotate:
        if prev.exists():
            try: prev.unlink()
            except: pass
        Path(curr_path).rename(prev)

if __name__ == "__main__":
    asyncio.run(main())
