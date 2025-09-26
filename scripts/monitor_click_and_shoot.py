import os, re, sys, asyncio, time
from pathlib import Path
from playwright.async_api import async_playwright, TimeoutError as PWTimeoutError

# ---------------- CONFIG ----------------
URL = os.getenv("MON_URL", "https://exemplo.com")
OUT_DIR = Path(os.getenv("MON_OUT_DIR", "./out"))
SHOT_FILENAME = os.getenv("MON_SHOT_FILE", "screenshot.png")
SHOT_FULLPAGE = os.getenv("MON_FULLPAGE", "1") == "1"
TIMEOUT_MS = int(os.getenv("MON_TIMEOUT_MS", "15000"))

# Texto alvo (podes alterar conforme o jogo)
TARGET_H2 = os.getenv("MON_TARGET_H2", "Bancada Emirates")
TARGET_EXTRA = os.getenv("MON_TARGET_EXTRA", "Piso 0 Inf")

def log(msg: str):
    print(f"[{time.strftime('%H:%M:%S')}] {msg}", flush=True)

async def accept_cookies(page):
    # tentativa simples
    try:
        btns = page.locator("button, .btn")
        for i in range(await btns.count()):
            txt = (await btns.nth(i).inner_text()).strip().lower()
            if "aceitar" in txt or "accept" in txt:
                await btns.nth(i).click(timeout=1000)
                log("Cookies aceites.")
                return
    except Exception:
        pass

async def click_target_bancada(page):
    divs = page.locator("div")
    count = await divs.count()
    for i in range(count):
        el = divs.nth(i)
        try:
            txt = (await el.inner_text()).strip()
        except Exception:
            continue
        if TARGET_H2 in txt and TARGET_EXTRA in txt:
            log(f"✅ Encontrado bloco com '{TARGET_H2}' + '{TARGET_EXTRA}'")
            link = await el.evaluate_handle("el => el.closest('a')")
            if link:
                try:
                    await el.click(timeout=TIMEOUT_MS)  # clique no div
                except Exception:
                    await page.evaluate("(el)=>el.click()", link)
            else:
                await el.click(timeout=TIMEOUT_MS)
            return True
    return False

async def main():
    async with async_playwright() as pw:
        browser = await pw.chromium.launch(headless=True)
        context = await browser.new_context(viewport={"width": 1280, "height": 2000})
        page = await context.new_page()

        log(f"A abrir: {URL}")
        await page.goto(URL, timeout=TIMEOUT_MS, wait_until="domcontentloaded")

        await accept_cookies(page)

        clicked = await click_target_bancada(page)
        if not clicked:
            log("⚠️ Não encontrei a bancada alvo.")
        else:
            await page.wait_for_timeout(1500)  # espera carregar pós-clique

        OUT_DIR.mkdir(parents=True, exist_ok=True)
        shot_path = OUT_DIR / SHOT_FILENAME
        await page.screenshot(path=str(shot_path), full_page=SHOT_FULLPAGE)
        log(f"Screenshot guardado em: {shot_path.resolve()}")

        await context.close()
        await browser.close()

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except PWTimeoutError:
        log("⏱️ Timeout atingido.")
        sys.exit(2)
    except Exception as e:
        log(f"❌ Erro: {e}")
        sys.exit(1)
