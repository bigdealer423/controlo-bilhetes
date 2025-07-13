from playwright.sync_api import sync_playwright

def obter_com_playwright(url):
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        print("🔗 A carregar:", url)
        page.goto(url, timeout=60000)
        page.wait_for_timeout(5000)  # Espera 5 segundos para carregar JS

        html = page.content()
        with open("debug.html", "w", encoding="utf-8") as f:
            f.write(html)

        listagens = page.query_selector_all(".ticket-listing")
        print("🎫 Listagens encontradas:", len(listagens))
        for item in listagens:
            print(item.inner_text())

        browser.close()

if __name__ == "__main__":
    url = "https://www.viagogo.pt/Bilhetes-Desporto/Futebol/Primeira-Liga/SL-Benfica-Bilhetes/E-158801955?quantity=1"
    obter_com_playwright(url)
