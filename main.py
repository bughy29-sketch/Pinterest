import os
import xml.etree.ElementTree as ET
import requests
from bs4 import BeautifulSoup

# Configurare Credențiale din Variabile de Mediu
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

def create_pinterest_pin(title, description, link, image_url):
    url = "https://api.pinterest.com/v5/pins"
    headers = {
        "Authorization": f"Bearer {PINTEREST_ACCESS_TOKEN}",
        "Content-Type": "application/json"
    }
    payload = {
        "board_id": PINTEREST_BOARD_ID,
        "title": title[:99], # Limită Pinterest pentru titlu
        "description": description[:499], # Limită Pinterest pentru descriere
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
            
            title = item["title"]
            description = f"🔥 Best Amazon Deal! Check it out now. #Amazon #Deals #Shopping"
            
            res = create_pinterest_pin(title, description, affiliate_link, item["image_url"])
            print(f"Răspuns Pinterest pentru '{title}': {res}")
            
        except Exception as e:
            print(f"Eroare la procesarea ofertei: {e}")

if __name__ == "__main__":
    main()
