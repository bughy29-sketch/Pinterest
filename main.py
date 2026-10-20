import os
import requests
from bs4 import BeautifulSoup
import google.generativeai as genai

# Configurare Chei și Credențiale din Variabile de Mediu
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
PINTEREST_ACCESS_TOKEN = os.getenv("PINTEREST_ACCESS_TOKEN")
PINTEREST_BOARD_ID = os.getenv("PINTEREST_BOARD_ID")
AMAZON_AFFILIATE_TAG = os.getenv("AMAZON_AFFILIATE_TAG")

genai.configure(api_key=GEMINI_API_KEY)

def get_best_deals():
    """Extrage automat primele link-uri de produse din pagina de Deals Amazon"""
    deals_url = "https://www.amazon.com/gp/goldbox"
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9"
    }
    
    try:
        response = requests.get(deals_url, headers=headers)
        soup = BeautifulSoup(response.content, "html.parser")
        
        links = []
        # Căutăm toate link-urile de produse (/dp/) din pagina de oferte
        for a in soup.find_all("a", href=True):
            href = a["href"]
            if "/dp/" in href:
                # Curățăm link-ul pentru a păstra doar structura de bază
                clean_url = "https://www.amazon.com" + href.split("?")[0]
                if clean_url not in links:
                    links.append(clean_url)
                if len(links) >= 5:
                    break
        return links
    except Exception as e:
        print(f"Eroare la preluarea ofertelor: {e}")
        return []

def scrape_amazon_product(url):
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9"
    }
    response = requests.get(url, headers=headers)
    soup = BeautifulSoup(response.content, "html.parser")
    
    title_elem = soup.find(id="productTitle")
    title = title_elem.get_text().strip() if title_elem else "Great Amazon Deal"
    
    img_elem = soup.find(id="landingImage")
    img_url = img_elem["src"] if img_elem else ""
    
    affiliate_url = f"{url}?tag={AMAZON_AFFILIATE_TAG}" if AMAZON_AFFILIATE_TAG else url
    
    return {"title": title, "image_url": img_url, "link": affiliate_url}

def generate_pin_details(product_title):
    model = genai.GenerativeModel("gemini-1.5-flash")
    prompt = f"""
    Create an engaging Pinterest Pin title and description in English for this discounted product: "{product_title}".
    Highlight that it's a great deal or offer.
    Format output exactly like this:
    TITLE: <catchy title under 100 chars>
    DESCRIPTION: <SEO-optimized description under 500 chars with relevant hashtags>
    """
    response = model.generate_content(prompt)
    text = response.text
    
    title = text.split("TITLE:")[1].split("DESCRIPTION:")[0].strip()
    description = text.split("DESCRIPTION:")[1].strip()
    
    return title, description

def create_pinterest_pin(title, description, link, image_url):
    url = "https://api.pinterest.com/v5/pins"
    headers = {
        "Authorization": f"Bearer {PINTEREST_ACCESS_TOKEN}",
        "Content-Type": "application/json"
    }
    payload = {
        "board_id": PINTEREST_BOARD_ID,
        "title": title,
        "description": description,
        "link": link,
        "media_source": {
            "source_type": "image_url",
            "url": image_url
        }
    }
    res = requests.post(url, json=payload, headers=headers)
    return res.json()

def main():
    print("Se caută ultimele Best Deals pe Amazon...")
    deal_urls = get_best_deals()
    
    if not deal_urls:
        print("Nu s-au putut extrage ofertele automate, se oprește executarea.")
        return

    for url in deal_urls:
        try:
            product = scrape_amazon_product(url)
            title, description = generate_pin_details(product["title"])
            res = create_pinterest_pin(title, description, product["link"], product["image_url"])
            print(f"Pin creat cu succes pentru oferta: {title}")
        except Exception as e:
            print(f"Eroare la procesarea produsului {url}: {e}")

if __name__ == "__main__":
    main()
