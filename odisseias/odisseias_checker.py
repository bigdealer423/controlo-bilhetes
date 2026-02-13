from playwright.sync_api import sync_playwright
import smtplib
from email.message import EmailMessage
import os
import subprocess
import re

STORAGE_STATE = "/opt/render/project/src/odisseias/storage_state.json"

# ✅ Garante que o Chromium está instalado no ambiente Render
subprocess.run(["playwright", "install", "chromium"], check=True)

PALAVRAS_CHAVE = ["liga dos campões","liga dos campeões","Real Madrid","champions","Madrid", "sporting", "porto"]

AREA_CLIENTE_URL = "https://www.odisseias.com/Account/Packs"
PRODUTOS_URL = "https://www.odisseias.com/Book/ProductList"

EMAIL_FROM = os.getenv("EMAIL_USERNAME")
EMAIL_TO = os.getenv("EMAIL_USERNAME")
EMAIL_PASS = os.getenv("EMAIL_PASSWORD")
SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 587

DEBUG_1 = "debug_1_packs.png"
DEBUG_2 = "debug_2_productlist.png"
DEBUG_3 = "debug_3_productlist_full.png"

def norm(s: str) -> str:
    return re.sub(r"\s+", " ", (s or "")).strip().lower()

def enviar_email_alerta(palavra, url, extra=None):
    if not EMAIL_FROM or not EMAIL_PASS:
        print("⚠️ EMAIL_USERNAME/EMAIL_PASSWORD não definidos. Não consigo enviar email.")
        return

    msg = EmailMessage()
    msg["Subject"] = f"⚽ Alerta: '{palavra}' encontrado na Odisseias"
    msg["From"] = EMAIL_FROM
    msg["To"] = EMAIL_TO

    body = f"Encontrado: {palavra}\nURL: {url}\n"
    if extra:
        body += f"\n---\n{extra}\n"
    msg.set_content(body)

    for fn in [DEBUG_1, DEBUG_2, DEBUG_3]:
        if os.path.exists(fn):
            with open(fn, "rb") as f:
                msg.add_attachment(f.read(), maintype="image", subtype="png", filename=fn)

    with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as smtp:
        smtp.starttls()
        smtp.login(EMAIL_FROM, EMAIL_PASS)
        smtp.send_message(msg)
        print("✅ Email enviado com screenshots!")

def verificar_eventos():
    with sync_playwright() as p:
        print("🚀 A iniciar browser com sessão guardada...")

        browser = p.chromium.launch(
            headless=True,
            args=["--disable-dev-shm-usage", "--no-sandbox"],
        )

        context = browser.new_context(
            storage_state=STORAGE_STATE,
            locale="pt-PT",
            timezone_id="Europe/Lisbon",
            user_agent=(
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/122.0.0.0 Safari/537.36"
            ),
            viewport={"width": 1366, "height": 768},
        )

        page = context.new_page()

        try:
            # 1) Abrir Packs (onde está o botão Reservar)
            print("🌐 Abrir área de cliente (Packs)...")
            page.goto(AREA_CLIENTE_URL, timeout=60000, wait_until="domcontentloaded")
            print("🔎 URL atual:", page.url)
            page.screenshot(path=DEBUG_1, full_page=True)

            # 2) Clicar Reservar (vai navegar para /Book/ProductList)
            print("⏳ A procurar botão 'Reservar'...")
            page.wait_for_selector("button.button-book:has-text('Reservar')", timeout=60000)

            reservar_btn = page.locator("button.button-book:has-text('Reservar')").first
            data_id = reservar_btn.get_attribute("data-id")
            print(f"🟠 A clicar em 'Reservar' (data-id={data_id})...")

            with page.expect_navigation(timeout=60000, wait_until="domcontentloaded"):
                reservar_btn.click()

            print("✅ Navegou. URL atual:", page.url)

            # 3) Confirmar que chegou ao ProductList (ou esperar por ele)
            if "/Book/ProductList" not in page.url:
                print("⚠️ Não aterrou diretamente em /Book/ProductList. Vou forçar goto para PRODUTOS_URL...")
                page.goto(PRODUTOS_URL, timeout=60000, wait_until="domcontentloaded")

            # esperar carregar conteúdo dinâmico
            try:
                page.wait_for_load_state("networkidle", timeout=60000)
            except Exception:
                pass

            page.screenshot(path=DEBUG_2, full_page=True)

            # 4) Procurar palavras (robusto: headings + texto total)
            texto_total = norm(page.inner_text("body"))
            headings = " | ".join([norm(x) for x in page.locator("h1,h2,h3").all_text_contents() if norm(x)])

            page.screenshot(path=DEBUG_3, full_page=True)

            for palavra in PALAVRAS_CHAVE:
                pnorm = norm(palavra)
                if pnorm and (pnorm in texto_total or pnorm in headings):
                    print(f"✅ Encontrado '{palavra}' em ProductList (URL={page.url})")
                    enviar_email_alerta(palavra, page.url, extra=f"Reservar data-id: {data_id}")
                    return

            print("❌ Nenhuma palavra encontrada em ProductList.")

        except Exception as e:
            print("❌ Erro:", str(e))
            try:
                page.screenshot(path="debug_erro.png", full_page=True)
            except Exception:
                pass

        finally:
            browser.close()

if __name__ == "__main__":
    verificar_eventos()
