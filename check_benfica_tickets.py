from playwright.sync_api import sync_playwright
import os
import smtplib
from email.message import EmailMessage

def enviar_alerta(mensagem, assunto="🎟️ Alerta de Bilhetes"):
    EMAIL = os.environ.get("ALERT_EMAIL")
    PWD = os.environ.get("ALERT_PWD")
    DEST = os.environ.get("ALERT_DEST")

    if not EMAIL or not PWD or not DEST:
        print("⚠️ Variáveis de ambiente de email não configuradas.")
        return

    msg = EmailMessage()
    msg["Subject"] = assunto
    msg["From"] = EMAIL
    msg["To"] = DEST
    msg.set_content(mensagem)

    try:
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as smtp:
            smtp.login(EMAIL, PWD)
            smtp.send_message(msg)
            print(f"📧 Email enviado com sucesso: {assunto}")
    except Exception as e:
        print(f"❌ Erro ao enviar email: {e}")

def verificar_bilhetes():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        print("🌐 A aceder ao site do Benfica...")
        page.goto("https://www.slbenfica.pt/bilhetes", timeout=30000)
        page.wait_for_timeout(7000)  # espera 7 segundos para JS carregar

        # Conteúdo da página (HTML em texto)
        texto_site = page.content().lower()

        # Verificações
        encontrou_botao_comprar = page.locator("button:has-text('Comprar')").count() > 0
        encontrou_mercado_secundario = "mercado secundário" in texto_site or "mercado secundario" in texto_site

        # Ações
        if encontrou_botao_comprar:
            mensagem = (
                "✅ Venda de bilhetes aberta no Benfica!\n"
                "Vai a: https://www.slbenfica.pt/bilhetes"
            )
            print(mensagem)
            enviar_alerta(mensagem, assunto="🎟️ Venda Benfica Aberta")

        if encontrou_mercado_secundario:
            mensagem = (
                "🔁 Mencionado 'mercado secundário' no site do Benfica.\n"
                "Verifica: https://www.slbenfica.pt/bilhetes"
            )
            print(mensagem)
            enviar_alerta(mensagem, assunto="🔁 Mercado Secundário Detetado")

        if not encontrou_botao_comprar and not encontrou_mercado_secundario:
            print("❌ Ainda não há vendas nem referência ao mercado secundário.")

        browser.close()

if __name__ == "__main__":
    verificar_bilhetes()
