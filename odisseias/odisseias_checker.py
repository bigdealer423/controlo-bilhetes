from playwright.sync_api import sync_playwright
import smtplib
from email.message import EmailMessage
import os
import subprocess
import re

STORAGE_STATE = "/opt/render/project/src/odisseias/storage_state.json"

# ✅ Garante que o Chromium está instalado no ambiente Render
subprocess.run(["playwright", "install", "chromium"], check=True)

# ---- CONFIGURAÇÕES ----
PALAVRAS_CHAVE = ["AFS", "benfica", "sporting", "porto"]
PRODUTOS_URL = "https://www.odisseias.com/Book/ProductList"

# Email de alerta
EMAIL_FROM = os.getenv("EMAIL_USERNAME")
EMAIL_TO = os.getenv("EMAIL_USERNAME")
EMAIL_PASS = os.getenv("EMAIL_PASSWORD")
SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 587

DEBUG_AFTER_GOTO = "debug_apos_goto.png"
DEBUG_SCREENSHOT = "debug_produtos.png"

def enviar_email_alerta(palavra_encontrada, url, extra_msg=None):
    if not EMAIL_FROM or not EMAIL_PASS:
        print("⚠️ EMAIL_USERNAME/EMAIL_PASSWORD não definidos. Não consigo enviar email.")
        return

    msg = EmailMessage()
    msg["Subject"] = f"⚽ Alerta: '{palavra_encontrada}' encontrado na Odisseias"
    msg["From"] = EMAIL_FROM
    msg["To"] = EMAIL_TO

    body = f"Foi encontrada a palavra '{palavra_encontrada}' em:\n{url}\n"
    if extra_msg:
        body += f"\n---\n{extra_msg}\n"
    msg.set_content(body)

    for screenshot in [DEBUG_AFTER_GOTO, DEBUG_SCREENSHOT]:
        if os.path.exists(screenshot):
            with open(screenshot, "rb") as f:
                msg.add_attachment(f.read(), maintype="image", subtype="png", filename=screenshot)

    with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as smtp:
        smtp.starttls()
        smtp.login(EMAIL_FROM, EMAIL_PASS)
        smtp.send_message(msg)
        print("✅ Email enviado com screenshot!")

def normalizar(txt: str) -> str:
    return re.sub(r"\s+", " ", (txt or "")).strip().lower()

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
            print("🌐 Aceder à página de produtos...")
            page.goto(PRODUTOS_URL, timeout=60000, wait_until="domcontentloaded")

            print("🔎 URL final:", page.url)
            page.screenshot(path=DEBUG_AFTER_GOTO, full_page=True)

            # ✅ esperar carregamentos dinâmicos (sem depender de selectors frágeis)
            try:
                page.wait_for_load_state("networkidle", timeout=60000)
            except Exception:
                pass

            # ✅ Screenshot “final”
            page.screenshot(path=DEBUG_SCREENSHOT, full_page=True)

            # ✅ Procurar texto visível total (mais robusto do que CSS específico)
            texto_pagina = normalizar(page.inner_text("body"))

            # ✅ Extra: headings (às vezes são mais limpos)
            headings = page.locator("h1, h2, h3").all_text_contents()
            headings_norm = " | ".join([normalizar(h) for h in headings if normalizar(h)])

            # Debug curto
            print(f"🧾 Tamanho texto body: {len(texto_pagina)} chars")
            print(f"🧷 Headings: {headings_norm[:200]}{'...' if len(headings_norm) > 200 else ''}")

            for palavra in PALAVRAS_CHAVE:
                pnorm = normalizar(palavra)
                if not pnorm:
                    continue

                if pnorm in texto_pagina or pnorm in headings_norm:
                    print(f"✅ Palavra '{palavra}' encontrada (URL: {page.url})")
                    enviar_email_alerta(
                        palavra,
                        page.url,
                        extra_msg=f"URL original pedida: {PRODUTOS_URL}\nURL final: {page.url}",
                    )
                    return

            print("❌ Nenhuma palavra encontrada no texto visível da página.")

        except Exception as e:
            print("❌ Erro:", str(e))

        finally:
            browser.close()

if __name__ == "__main__":
    verificar_eventos()
