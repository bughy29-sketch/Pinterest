import os
import xml.etree.ElementTree as ET
import requests
from bs4 import BeautifulSoup

# Configurare Credențiale din Variabile de Mediu
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
PINTEREST_ACCESS_TOKEN = os.getenv("PINTEREST_ACCESS_TOKEN")
PINTEREST_BOARD_ID = os.getenv("PINTEREST_BOARD_ID")
AMAZON_AFFILIATE_TAG = os.getenv("AMAZON_AFFILIATE_TAG", "bughy29-20")

# Feed RSS public de oferte Amazon (Slickdeals)
RSS_FEED_URL = "https://slickdeals.net/newsearch.php?mode=popdeals&searchtypedsc=new&q=amazon&searchin=first&rss=1"

def fetch_rss_deals():
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
    }
    try:
        response = requests.get(RSS_FEED_URL, headers=headers, timeout=10)
        root = ET.fromstring(response.content)
        
        items = []
        for item in root.findall("./channel/item"):
            title = item.find("title").text if item.find("title") is not None else ""
            description = item.find("description").text if item.find("description") is not None else ""
            link = item.find("link").text if item.find("link") is not None else ""
            
            img_url = ""
            if description:
                soup = BeautifulSoup(description, "html.parser")
                img_tag = soup.find("img")
                if img_tag and img_tag.get("src"):
                    img_url = img_tag["src"]
            
            if not img_url or not img_url.startswith("http"):
                img_url = "https://m.media-amazon.com/images/G/01/social/api-share/amazon_logo_500x500._CB485935080_.png"
                
            items.append({
                "title": title,
                "link": link,
                "image_url": img_url
            })
            
            if len(items) >= 5:
                break
                
        return items
    except Exception as e:
        print(f"Eroare la citirea RSS Feed: {e}")
        return []

def generate_pin_details(product_title):
    """Generează titlul și descrierea prin cerere HTTP directă către Gemini API (rapid și fără blocaje)"""
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={GEMINI_API_KEY}"
    
    prompt = f"""
    Create an engaging, viral Pinterest Pin title and description in English for this deal: "{product_title}".
    Highlight that it's a great offer.
    Format output exactly like this:
    TITLE: <catchy title under 100 chars>
    DESCRIPTION: <SEO-optimized description under 500 chars with relevant hashtags>
    """
    
    payload = {
        "contents": [{
            "parts": [{"text": prompt}]
        }]
    }
    
    headers = {"Content-Type": "application/json"}
    
    try:
        response = requests.post(url, json=payload, headers=headers, timeout=10)
        data = response.json()
        
        # Extragem textul generat din răspunsul JSON
        text = data["candidates"][0]["content"]["parts"][0]["text"]
        
        title = text.split("TITLE:")[1].split("DESCRIPTION:")[0].strip()
        description = text.split("DESCRIPTION:")[1].strip()
        
        return title, description
    except Exception as e:
        print(f"Eroare la Gemini API, folosesc titlul original: {e}")
        return product_title[:99], f"Check out this amazing deal on Amazon! 🔥 #AmazonDeals #Shopping #MustHave"

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
    res = requests.post(url, json=payload, headers=headers, timeout=10)
    return res.json()

def main():
    print("Se extrag ofertele din Feed-ul RSS...")
    deals = fetch_rss_deals()
    
    if not deals:
        print("Nu s-au găsit oferte în RSS Feed.")
        return

    for item in deals:
        try:
            raw_link = item["link"]
            affiliate_link = f"{raw_link}&tag={AMAZON_AFFILIATE_TAG}" if "?" in raw_link else f"{raw_link}?tag={AMAZON_AFFILIATE_TAG}"
            
            title, description = generate_pin_details(item["title"])
            
            res = create_pinterest_pin(title, description, affiliate_link, item["image_url"])
            print(f"Răspuns Pinterest pentru '{title}': {res}")
            
        except Exception as e:
            print(f"Eroare la procesarea ofertei: {e}")

if __name__ == "__main__":
    main()
