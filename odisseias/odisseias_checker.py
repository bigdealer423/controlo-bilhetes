from playwright.sync_api import sync_playwright
import smtplib
from email.message import EmailMessage
import os
import subprocess
import re

STORAGE_STATE = "/opt/render/project/src/odisseias/storage_state.json"
subprocess.run(["playwright", "install", "chromium"], check=True)

PALAVRAS_CHAVE = ["FC PORTO"]

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


def norm(s: str) -> str:
    return re.sub(r"\s+", " ", (s or "")).strip().lower()


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


def clicar_reservar_packs(page) -> str:
    """
    Na página /Account/Packs, clicar no primeiro 'Reservar' (qualquer voucher),
    que nos leva ao /Book/ProductList.
    """
    # 1) O selector que já tinha funcionado antes
    loc1 = page.locator("button.button-book:has-text('Reservar')")
    if loc1.count() > 0:
        with page.expect_navigation(timeout=60000, wait_until="domcontentloaded"):
            loc1.first.click()
        return "button.button-book"

    # 2) Às vezes é <a>
    loc2 = page.locator("a:has-text('Reservar')")
    if loc2.count() > 0:
        with page.expect_navigation(timeout=60000, wait_until="domcontentloaded"):
            loc2.first.click()
        return "a:has-text"

    # 3) Span com texto "Reservar" (e clicar em ancestral clicável)
    loc3 = page.locator("span:has-text('Reservar')")
    if loc3.count() > 0:
        span = loc3.first

        # tenta primeiro button/a
        parent = span.locator("xpath=ancestor-or-self::*[self::button or self::a][1]")
        if parent.count() > 0:
            with page.expect_navigation(timeout=60000, wait_until="domcontentloaded"):
                parent.click()
            return "span->parent(button/a)"

        # fallback extra: algo com role button / onclick
        parent2 = span.locator("xpath=ancestor-or-self::*[@role='button' or @onclick][1]")
        if parent2.count() > 0:
            with page.expect_navigation(timeout=60000, wait_until="domcontentloaded"):
                parent2.click()
            return "span->parent(role/onclick)"

    return ""


def clicar_reservar_do_card_correto(page) -> str:
    """
    Clica no 'Reservar' (span) do card que melhor corresponde às PALAVRAS_CHAVE.
    Prioridade 100% definida por PALAVRAS_CHAVE (ordem + quantidade de matches).
    """
    page.wait_for_selector("span.button.button-orange:has-text('Reservar')", timeout=60000)

    spans = page.locator("span.button.button-orange:has-text('Reservar')")
    n = spans.count()
    print(f"🔎 Encontrei {n} spans 'Reservar' nesta página.")

    candidatos = []

    # Normalizar as keywords uma vez
    kws = [norm(k) for k in PALAVRAS_CHAVE if norm(k)]

    for i in range(n):
        sp = spans.nth(i)

        # apanhar texto do "card" (vários níveis)
        cards = [
            sp.locator("xpath=ancestor::div[2]"),
            sp.locator("xpath=ancestor::div[3]"),
            sp.locator("xpath=ancestor::div[4]"),
            sp.locator("xpath=ancestor::div[5]"),
        ]

        textos = []
        for c in cards:
            try:
                if c.count() > 0:
                    t = norm(c.inner_text())
                    if t:
                        textos.append(t)
            except Exception:
                pass

        texto_card = max(textos, key=len) if textos else ""
        if not texto_card:
            continue

        # ✅ hits = keywords presentes no card (só as que você definiu)
        hits = [k for k in kws if k in texto_card]
        if not hits:
            continue

        # ✅ score principal = quantidade de hits
        hit_count = len(hits)

        # ✅ tie-breaker = qual o hit mais prioritário (menor índice na lista)
        best_rank = min(kws.index(h) for h in hits)

        candidatos.append({
            "idx": i,
            "hit_count": hit_count,
            "best_rank": best_rank,
            "hits": hits,
        })

    if not candidatos:
        print("❌ Nenhum card contém PALAVRAS_CHAVE.")
        return ""

    # Ordenar:
    # 1) mais hits
    # 2) contém keyword mais prioritária (rank menor)
    # 3) aparece primeiro na página
    candidatos.sort(key=lambda x: (-x["hit_count"], x["best_rank"], x["idx"]))

    escolhido = candidatos[0]
    i = escolhido["idx"]

    match_info = f"Span#{i+1} hits={escolhido['hits']} count={escolhido['hit_count']} best_rank={escolhido['best_rank']}"
    print("✅ Card escolhido:", match_info)

    with page.expect_navigation(timeout=60000, wait_until="domcontentloaded"):
        spans.nth(i).click()

    return match_info


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
            # 1) Packs
            print("🌐 Packs...")
            page.goto(AREA_CLIENTE_URL, timeout=60000, wait_until="domcontentloaded")
            page.screenshot(path=DEBUG_1, full_page=True)

            # 2) clicar Reservar (packs) -> ProductList
            print("⏳ A procurar 'Reservar' no Packs...")
            page.wait_for_timeout(1500)

            selector_usado = clicar_reservar_packs(page)
            if not selector_usado:
                print("❌ Não encontrei 'Reservar' no Packs com nenhum fallback.")
                enviar_email(
                    "❌ Odisseias: Falha a encontrar 'Reservar' no Packs",
                    f"Não encontrei o botão/link 'Reservar' em {page.url}\n",
                    anexos=[DEBUG_1],
                )
                return

            print(f"✅ Cliquei 'Reservar' no Packs (selector={selector_usado}). URL:", page.url)

            # 3) garantir ProductList
            if "/Book/ProductList" not in page.url:
                page.goto(PRODUTOS_URL, timeout=60000, wait_until="domcontentloaded")

            try:
                page.wait_for_load_state("networkidle", timeout=60000)
            except Exception:
                pass

            page.screenshot(path=DEBUG_2, full_page=True)

            # 4) Lista com 2+ opções -> clicar Reservar do card correto
            page.screenshot(path=DEBUG_3, full_page=True)
            match_info = clicar_reservar_do_card_correto(page)

            if not match_info:
                enviar_email(
                    "ℹ️ Odisseias: Não encontrei o card correto",
                    f"Cheguei à lista mas não consegui identificar o card pelas palavras-chave.\nURL: {page.url}\n",
                    anexos=[DEBUG_2, DEBUG_3],
                )
                return

            # 5) Dentro do evento: enviar sempre email com print e estado
            try:
                page.wait_for_load_state("networkidle", timeout=30000)
            except Exception:
                pass

            page.screenshot(path=DEBUG_4, full_page=True)

            texto_evento = norm(page.inner_text("body"))
            sem_disp = FRASE_SEM_DISP in texto_evento
            estado = "SEM DISPONIBILIDADE" if sem_disp else "COM DISPONIBILIDADE"

            enviar_email(
                f"📌 Odisseias: Dentro do evento ({estado})",
                (
                    f"Entrei no evento.\n"
                    f"Match: {match_info}\n"
                    f"URL: {page.url}\n"
                    f"Estado: {estado}\n"
                    f"Frase '{FRASE_SEM_DISP}': {'ENCONTRADA' if sem_disp else 'NÃO ENCONTRADA'}\n"
                ),
                anexos=[DEBUG_4, DEBUG_3],
            )

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
