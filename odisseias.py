from playwright.sync_api import sync_playwright
import time

# ---- CONFIGURAÇÕES ----
EMAIL = "teu_email@exemplo.com"       # <-- coloca aqui o teu email
PASSWORD = "tua_password_segura"      # <-- coloca aqui a tua password
LOGIN_URL = "https://www.odisseias.com/Account/Login"
PRODUTOS_URL = "https://www.odisseias.com/Book/ProductList"
PALAVRA_CHAVE = "sporting"            # <-- palavra a procurar

def verificar_sporting():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)  # headless=False se quiseres ver o browser
        page = browser.new_page()

        print("🚀 A aceder à página de login...")
        page.goto(LOGIN_URL)

        # Preencher email e password
        page.fill('input[name="Email"]', EMAIL)
        page.fill('input[name="Password"]', PASSWORD)
        page.click('button[type="submit"]')

        # Esperar navegação pós-login
        page.wait_for_load_state("networkidle")
        time.sleep(2)  # opcional, para garantir que a sessão ficou estável

        print("🔐 Login concluído. A aceder à lista de produtos...")
        page.goto(PRODUTOS_URL)
        page.wait_for_load_state("networkidle")

        conteudo = page.content().lower()

        if PALAVRA_CHAVE.lower() in conteudo:
            print(f"✅ Palavra '{PALAVRA_CHAVE}' encontrada na página de produtos!")
        else:
            print(f"❌ Palavra '{PALAVRA_CHAVE}' NÃO encontrada.")

        browser.close()

if __name__ == "__main__":
    verificar_sporting()
