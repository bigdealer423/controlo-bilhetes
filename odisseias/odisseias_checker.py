from playwright.sync_api import sync_playwright
import smtplib
from email.message import EmailMessage
import os
import subprocess
import re
import json

STORAGE_STATE = "/opt/render/project/src/odisseias/storage_state.json"
subprocess.run(["playwright", "install", "chromium"], check=True)

# Palavras para identificar o CARD correto (na página com vários "Reservar")
PALAVRAS_CHAVE = [
    "liga dos campeões", "liga dos campões", "real madrid",
    "champions", "madrid", "sporting", "porto", "afs"
]

AREA_CLIENTE_URL = "https://www.odisseias.com/Account/Packs"
PRODUTOS_URL = "https://www.odisseias.com/Book/ProductList"

FRASE_SEM_DISP = "lamentamos mas não existe disponibilidade"

EMAIL_FROM = os.getenv("EMAIL_USERNAME")
EMAIL_TO = os.getenv("EMAIL_USERNAME")
EMAIL_PASS = os.getenv("EMAIL_PASSWORD")
SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 587

DEBUG_1 = "debug_1_packs.png"
DEBUG_2 = "debug_2_productlist.png"
DEBUG_3 = "debug_3_lista_eventos.png"
DEBUG_4 = "debug_4_evento.png"

STATE_FILE = "odisseias_state.json"


def norm(s: str) -> str:
    return re.sub(r"\s+", " ", (s or "")).strip().lower()


def load_state():
    default = {"status": "NO_EVENT", "last_url": "", "match": ""}
    try:
        if os.path.exists(STATE_FILE):
            with open(STATE_FILE, "r", encoding="utf-8") as f:
                d = json.load(f)
                if isinstance(d, dict):
                    default.update(d)
    except Exception:
        pass
    return default


def save_state(state: dict):
    try:
        with open(STATE_FILE, "w", encoding="utf-8") as f:
            json.dump(state, f, ensure_ascii=False)
    except Exception as e:
        print("⚠️ Falha a guardar estado:", str(e))


def enviar_email(assunto: str, corpo: str, anexos=None):
    if not EMAIL_FROM or not EMAIL_PASS:
        print("⚠️ EMAIL_USERNAME/EMAIL_PASSWORD não definidos. Não consigo enviar email.")
        return

    msg = EmailMessage()
    msg["Subject"] = assunto
    msg["From"] = EMAIL_FROM
    msg["To"] = EMAIL_TO
    msg.set_content(corpo)

    anexos = anexos or []
    for fn in anexos:
        if fn and os.path.exists(fn):
            with open(fn, "rb") as f:
                msg.add_attachment(f.read(), maintype="image", subtype="png", filename=fn)

    with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as smtp:
        smtp.starttls()
        smtp.login(EMAIL_FROM, EMAIL_PASS)
        smtp.send_message(msg)
        print("✅ Email enviado!")


def clicar_reservar_do_card_correto(page) -> str:
    """
    Na página com vários cards e vários botões "Reservar",
    clica no botão Reservar do CARD que contém as palavras-chave.
    """
    page.wait_for_selector("button:has-text('Reservar')", timeout=60000)

    botoes = page.locator("button:has-text('Reservar')")
    n = botoes.count()
    print(f"🔎 Encontrei {n} botões 'Reservar' nesta página.")

    for i in range(n):
        btn = botoes.nth(i)

        # tentar apanhar um container "card" suficientemente grande
        card2 = btn.locator("xpath=ancestor::div[2]")
        card3 = btn.locator("xpath=ancestor::div[3]")

        texto2 = norm(card2.inner_text()) if card2.count() else ""
        texto3 = norm(card3.inner_text()) if card3.count() else ""

        texto_card = texto3 if len(texto3) > len(texto2) else texto2
        if not texto_card:
            continue

        hits = [p for p in PALAVRAS_CHAVE if norm(p) and norm(p) in texto_card]
        if hits:
            match_info = f"Card#{i+1} hits={hits[:4]}"
            print("✅ Card correto detetado:", match_info)

            with page.expect_navigation(timeout=60000, wait_until="domcontentloaded"):
                btn.click()

            return match_info

    print("❌ Não consegui associar nenhum 'Reservar' às palavras-chave.")
    return ""


def verificar_eventos():
    st = load_state()
    print("🧠 Estado anterior:", st)

    with sync_playwright() as p:
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
            # 1) Packs
            print("🌐 Packs...")
            page.goto(AREA_CLIENTE_URL, timeout=60000, wait_until="domcontentloaded")
            page.screenshot(path=DEBUG_1, full_page=True)

            # 2) clicar Reservar -> ProductList
            page.wait_for_selector("button.button-book:has-text('Reservar')", timeout=60000)
            reservar_btn = page.locator("button.button-book:has-text('Reservar')").first

            with page.expect_navigation(timeout=60000, wait_until="domcontentloaded"):
                reservar_btn.click()

            # 3) garantir ProductList
            if "/Book/ProductList" not in page.url:
                page.goto(PRODUTOS_URL, timeout=60000, wait_until="domcontentloaded")

            try:
                page.wait_for_load_state("networkidle", timeout=60000)
            except Exception:
                pass

            page.screenshot(path=DEBUG_2, full_page=True)

            # 4) clicar no "Reservar" do card correto (na lista com 2+ opções)
            page.screenshot(path=DEBUG_3, full_page=True)
            match_info = clicar_reservar_do_card_correto(page)

            if not match_info:
                # evento não apareceu (ou não foi possível identificar)
                if st["status"] != "NO_EVENT":
                    st["status"] = "NO_EVENT"
                    st["last_url"] = page.url
                    st["match"] = ""
                    save_state(st)
                print("ℹ️ Evento não detetado nesta execução.")
                return

            # ✅ aqui já estamos "dentro do evento"
            # tirar print SEMPRE e enviar email SEMPRE (por agora), com estado disponibilidade
            try:
                page.wait_for_load_state("networkidle", timeout=30000)
            except Exception:
                pass

            page.screenshot(path=DEBUG_4, full_page=True)

            texto_evento = norm(page.inner_text("body"))
            sem_disp = FRASE_SEM_DISP in texto_evento
            estado_disp = "SEM DISPONIBILIDADE" if sem_disp else "COM DISPONIBILIDADE"

            assunto = f"📌 Odisseias: Dentro do evento ({estado_disp})"
            corpo = (
                f"Entrei no evento com sucesso.\n"
                f"Match: {match_info}\n"
                f"URL: {page.url}\n"
                f"Estado: {estado_disp}\n"
                f"Frase '{FRASE_SEM_DISP}': {'ENCONTRADA' if sem_disp else 'NÃO ENCONTRADA'}\n"
            )
            enviar_email(assunto, corpo, anexos=[DEBUG_4, DEBUG_3])

            # Guardar estado (para futuro, quando voltar a controlar spam)
            st["status"] = "UNAVAILABLE" if sem_disp else "AVAILABLE"
            st["match"] = match_info
            st["last_url"] = page.url
            save_state(st)

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
