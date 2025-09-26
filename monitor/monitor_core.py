# monitor/monitor_core.py
from playwright.async_api import async_playwright

DEFAULT_SELECTOR = "main"  # mantém o teu
DEFAULT_WAIT_MS = 800

async def _click_bancada(page, target_h2: str, target_extra: str):
    # Procura <div> que tenha <h2> com target_h2 E também target_extra no bloco
    divs = page.locator("div")
    n = await divs.count()
    for i in range(n):
        el = divs.nth(i)
        try:
            txt = (await el.inner_text()).strip()
        except Exception:
            continue
        if target_h2 in txt and target_extra in txt:
            link = await el.evaluate_handle("el => el.closest('a')")
            try:
                if link:
                    # clicar no <a> (preferível)
                    await el.click(timeout=8000)
                else:
                    await el.click(timeout=8000)
            except Exception:
                # fallback via JS
                await page.evaluate("(el)=>el.click()", el)
            return True
    return False

async def screenshot_element(
    url: str,
    selector: str = DEFAULT_SELECTOR,
    out_path=None,
    quantity: int = 2,
    extra_wait_ms: int = DEFAULT_WAIT_MS,
    # --- NOVO: clique prévio configurável ---
    target_h2: str | None = None,
    target_extra: str | None = None,
    wait_selector: str | None = None,
):
    """
    Abre URL (opcionalmente ajusta ?quantity=), clica num alvo (se pedido) e tira screenshot do 'selector'.
    Devolve (caminho_screenshot, final_url).
    """
    # prepara URL final com quantity (mantém a tua lógica se já existia)
    final_url = url
    # exemplo: acrescentar ?quantity=X se precisares (mantém como já tinhas)
    # ...

    async with async_playwright() as pw:
        browser = await pw.chromium.launch(headless=True)
        context = await browser.new_context(viewport={"width": 1280, "height": 2000})
        page = await context.new_page()

        await page.goto(final_url, wait_until="domcontentloaded", timeout=20000)

        # Aceitar cookies (best-effort)
        try:
            for sel in ["#onetrust-accept-btn-handler", "button:has-text('Aceitar')", "button:has-text('Accept')"]:
                btn = page.locator(sel)
                if await btn.count():
                    await btn.first.click(timeout=1500)
                    break
        except Exception:
            pass

        # --- NOVO: clique prévio, se configurado ---
        if target_h2 and target_extra:
            clicked = await _click_bancada(page, target_h2, target_extra)
            # pequenas esperas pós-clique
            if wait_selector:
                try:
                    await page.locator(wait_selector).first.wait_for(state="visible", timeout=12000)
                except Exception:
                    pass
            if extra_wait_ms and extra_wait_ms > 0:
                await page.wait_for_timeout(extra_wait_ms)

        # Espera final curta antes do screenshot (caso sem clique)
        if extra_wait_ms and extra_wait_ms > 0 and not (target_h2 and target_extra):
            await page.wait_for_timeout(extra_wait_ms)

        # Screenshot do elemento
        locator = page.locator(selector).first if selector else page.locator("body")
        await locator.wait_for(state="visible", timeout=15000)
        if out_path is None:
            out_path = "out/screenshot.png"
        out_path = str(out_path)
        await locator.screenshot(path=out_path)
        await context.close()
        await browser.close()

    return out_path, final_url
