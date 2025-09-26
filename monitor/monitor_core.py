# -*- coding: utf-8 -*-
import hashlib, os, re, json, time
from pathlib import Path
from typing import Tuple, Optional

import numpy as np
from PIL import Image, ImageChops
from playwright.async_api import async_playwright

UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36")
TIMEOUT = 35_000
DEFAULT_SELECTOR = "svg, canvas, [data-testid='seatmap'] svg"

def hash_key(s: str) -> str:
    return hashlib.sha1(s.encode("utf-8")).hexdigest()[:10]

async def screenshot_element(
    url: str,
    selector: str = DEFAULT_SELECTOR,
    out_path: Path = Path("out.jpg"),
    quantity: Optional[int] = None,
    extra_wait_ms: int = 800
) -> Tuple[str, str]:
    """
    Abre a página, aceita cookies (best effort), espera pelo elemento e faz screenshot JPEG.
    Devolve (caminho_do_ficheiro, url_final_utilizado)
    """
    target = url
    if quantity is not None and "quantity=" not in url:
        sep = "&" if "?" in url else "?"
        q = min(max(int(quantity), 1), 6)
        target = f"{url}{sep}quantity={q}"

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True, args=[
            "--no-sandbox", "--disable-blink-features=AutomationControlled",
            "--disable-dev-shm-usage"
        ])
        context = await browser.new_context(user_agent=UA, viewport={"width":1280,"height":900})
        page = await context.new_page()

        await page.goto(target, timeout=TIMEOUT, wait_until="networkidle")
        # aceita cookies (se existir)
        try:
            await page.locator("button:has-text('Aceitar'), button:has-text('Accept')").first.click(timeout=4000)
        except:
            pass

        await page.wait_for_selector(selector, timeout=TIMEOUT)
        await page.wait_for_timeout(extra_wait_ms)
        out_path.parent.mkdir(parents=True, exist_ok=True)
        await page.locator(selector).screenshot(path=str(out_path), type="jpeg", quality=70)

        await context.close()
        await browser.close()

    return str(out_path), target

def percent_diff(img_a: Path, img_b: Path) -> float:
    """Diferença percentual (pixels alterados) entre duas imagens."""
    A = Image.open(img_a).convert("RGB")
    B = Image.open(img_b).convert("RGB")
    if A.size != B.size:
        B = B.resize(A.size)
    diff = ImageChops.difference(A, B)
    arr = np.asarray(diff, dtype=np.uint16)
    changed = np.count_nonzero(arr.sum(axis=2))
    total = arr.shape[0] * arr.shape[1]
    return 100.0 * changed / max(total, 1)

def detect_non_red_seats(img_path: Path) -> Tuple[float, Path]:
    """
    Aproximação: identifica pixels 'vivos' não-vermelhos nas filas onde há muitos vermelhos.
    Devolve (percentagem_em_bancada, caminho_overlay)
    """
    img = Image.open(img_path).convert("RGB")
    arr = np.array(img, dtype=np.uint8)
    rgb = arr.astype(np.float32) / 255.0
    r,g,b = rgb[...,0], rgb[...,1], rgb[...,2]
    cmax = np.max(rgb, axis=-1); cmin = np.min(rgb, axis=-1); delta = cmax - cmin

    h = np.zeros_like(cmax)
    mask = delta != 0
    idx = (cmax == r) & mask; h[idx] = ((g[idx]-b[idx]) / delta[idx]) % 6.0
    idx = (cmax == g) & mask; h[idx] = ((b[idx]-r[idx]) / delta[idx]) + 2.0
    idx = (cmax == b) & mask; h[idx] = ((r[idx]-g[idx]) / delta[idx]) + 4.0
    h *= 60.0
    s = np.zeros_like(cmax); nz = cmax != 0; s[nz] = delta[nz] / cmax[nz]
    v = cmax

    red_mask = (((h <= 18) | (h >= 342)) & (s >= 0.35) & (v >= 0.25))
    row_red_ratio = red_mask.mean(axis=1)
    seat_rows = row_red_ratio > 0.10
    seat_rows_mask = np.repeat(seat_rows[:, None], red_mask.shape[1], axis=1)

    non_red_vivid = (~red_mask) & (s >= 0.35) & (v >= 0.25)
    candidates = non_red_vivid & seat_rows_mask

    area = int(seat_rows_mask.sum())
    count = int(candidates.sum())
    pct = 100.0 * count / max(area, 1)

    overlay = arr.copy()
    overlay[candidates] = np.array([255, 255, 0], dtype=np.uint8)  # amarelo
    alpha = 0.35
    blended = (arr*(1-alpha) + overlay*alpha).astype(np.uint8)
    out = Path(img_path).with_name(Path(img_path).stem + "_overlay.jpg")
    Image.fromarray(blended).save(out, "JPEG", quality=82)
    return pct, out
