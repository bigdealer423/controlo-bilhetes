from playwright.sync_api import sync_playwright
import smtplib
from email.message import EmailMessage
import os
import subprocess
import time
import re

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
STORAGE_STATE = "/opt/render/project/src/odisseias/storage_state.json"

# ✅ Garante que o Chromium está instalado no ambiente Render
subprocess.run(["playwright", "install", "chromium"], check=True)

# ---- CONFIGURAÇÕES ----
PALAVRAS_CHAVE = ["AFS", "benfica", "sporting", "porto"]
PRODUTOS_URL = "https://www.odisseias.com/Book/ProductList"

# Email de alerta (Gmail apenas para enviar alerta)
EMAIL_FROM = os.getenv("EMAIL_USERNAME")
EMAIL_TO = os.getenv("EMAIL_USERNAME")
EMAIL_PASS = os.getenv("EMAIL_PASSWORD")
SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 587

# Debug files
DEBUG_SCREENSHOT = "debug_produtos.png"
DEBUG_AFTER_GOTO = "debug_apos_goto.png"
DEBUG_NOT_AUTH = "debug_nao_autenticado.png"
DEBUG_RECAPTCHA = "debug_recaptcha.png"
DEBUG_HTML = "debug_page.html"

def enviar_email_alerta(palavra_encontrada, url_produto, extra_msg=None):
    if not EMAIL_FROM or not EMAIL_PASS:
        print("⚠️ EMAIL_USERNAME/EMAIL_PASSWORD não definidos. Não consigo enviar email.")
        return

    msg = EmailMessage()
    msg["Subject"] = f"⚽ Alerta: '{palavra_encontrada}' encontrado na Odisseias"
    msg["From"] = EMAIL_FROM
    msg["To"] = EMAIL_TO

    body = f"Foi encontrada a palavra '{palavra_encontrada}' em:\n{url_produto}\n"
    if extra_msg:
        body += f"\n---\n{extra_msg}\n"
    msg.set_content(body)

    # Anexar screenshots existentes (se houver)
    for screenshot in [DEBUG_SCREENSHOT, DEBUG_AFTER_GOTO, DEBUG_NOT_AUTH, DEBUG_RECAPTCHA]:
        if os.path.exists(screenshot):
            with open(screenshot, "rb") as f:
                msg.add_attachment(f.read(), maintype="image", subtype="png", filename=screenshot)

    with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as smtp:
        smtp.starttls()
        smtp.login(EMAIL_FROM, EMAIL_PASS)
        smtp.send_message(msg)
        print("✅ Email enviado com screenshot!")

def _guardar_html(page):
    try:
        html = page.content()
        with open(DEBUG_HTML, "w", encoding="utf-8") as f:
            f.write(html)
        return html
    except Exception as e:
        print("⚠️ Não consegui guardar HTML:", str(e))
        return ""

def _tem_recaptcha(html: str) -> bool:
    h = (html or "").lower()
    return ("recaptcha" in h) or ("g-recaptcha" in h) or ("grecaptcha" in h)

def _normalizar(s: str) -> str:
    return re.sub(r"\s+", " ", (s or "")).strip().lower()

def verificar_eventos():
    with sync_playwright() as p:
        print("🚀 A iniciar browser com sessão guardada...")

        browser = p.chromium.launch(
            headless=True,
            args=[
                "--disable-dev-shm-usage",
                "--no-sandbox",
            ],
        )

        # 🔧 Tornar mais “normal” (menos flags de bot) + timezone/locale PT
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

            # ✅ Debug imediato (para perceber login/recaptcha/redirecionamento)
            print("🔎 URL final:", page.url)
            page.screenshot(path=DEBUG_AFTER_GOTO, full_page=True)
            html = _guardar_html(page)

            # ✅ Se redirecionou para login → sessão inválida/expirada
            if "Account/Login" in page.url or "/Login" in page.url:
                print("⚠️ Redirecionado para LOGIN. Sessão expirada/invalidada.")
                page.screenshot(path=DEBUG_NOT_AUTH, full_page=True)
                enviar_email_alerta(
                    palavra_encontrada="SESSÃO EXPIRADA",
                    url_produto=page.url,
                    extra_msg="O Render foi parar ao Login. Tem de regenerar o storage_state.json com sessão válida.",
                )
                return

            # ✅ Se houver recaptcha/anti-bot
            if _tem_recaptcha(html):
                print("🛑 Detetado reCAPTCHA/anti-bot. Lista pode não carregar no Render.")
                page.screenshot(path=DEBUG_RECAPTCHA, full_page=True)
                enviar_email_alerta(
                    palavra_encontrada="BLOQUEIO (reCAPTCHA)",
                    url_produto=page.url,
                    extra_msg="Foi detetado reCAPTCHA/anti-bot no HTML. Considere regenerar sessão fora do Render (PC/VPS) ou mudar estratégia.",
                )
                return

            # ✅ Espera mais robusta: tentar vários seletores + networkidle
            print("⏳ A aguardar carregamento da lista (até 90s)...")
            try:
                page.wait_for_load_state("networkidle", timeout=90000)
            except Exception:
                # networkidle nem sempre acontece; não é fatal
                pass

            # Primeiro tenta o seletor atual
            try:
                page.wait_for_selector(".ProductSummaryDetailsWrapper h2", timeout=45000)
                titulos = page.locator(".ProductSummaryDetailsWrapper h2").all_text_contents()
            except Exception:
                # Fallback: procurar texto dos “cards” completos
                print("⚠️ Selector h2 não apareceu. Vou tentar fallback por wrapper...")
                page.wait_for_selector(".ProductSummaryDetailsWrapper", timeout=45000)
                titulos = page.locator(".ProductSummaryDetailsWrapper").all_text_contents()

            print("📦 Página de produtos carregada.")
            page.screenshot(path=DEBUG_SCREENSHOT, full_page=True)

            # Normalizar e procurar
            titulos_norm = [_normalizar(t) for t in titulos if _normalizar(t)]
            print(f"🔍 {len(titulos_norm)} blocos/títulos encontrados:")
            for t in titulos_norm[:30]:
                print("-", t)
            if len(titulos_norm) > 30:
                print(f"... (+{len(titulos_norm)-30} linhas)")

            texto_total = " ".join(titulos_norm)

            for palavra in PALAVRAS_CHAVE:
                pnorm = _normalizar(palavra)
                if pnorm and pnorm in texto_total:
                    # tentar descobrir a linha “mais próxima” para log
                    exemplo = next((t for t in titulos_norm if pnorm in t), "(linha não encontrada)")
                    print(f"✅ Palavra '{palavra}' encontrada em: {exemplo}")
                    enviar_email_alerta(palavra, PRODUTOS_URL, extra_msg=f"Exemplo encontrado: {exemplo}")
                    return

            print("❌ Nenhuma palavra encontrada (nem em h2 nem no wrapper).")

        except Exception as e:
            print("❌ Erro:", str(e))
            # tenta guardar debug no erro
            try:
                page.screenshot(path="debug_erro.png", full_page=True)
            except Exception:
                pass

        finally:
            browser.close()

if __name__ == "__main__":
    verificar_eventos()
