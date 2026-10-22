import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { XMLParser } from 'fast-xml-parser';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

// In-memory runtime state preserving settings and pin history
interface DealItem {
  id: string;
  title: string;
  description: string;
  rawLink: string;
  affiliateLink: string;
  imageUrl: string;
  pubDate?: string;
  status?: 'pending' | 'published' | 'failed';
  publishedAt?: string;
  pinterestPinId?: string;
}

interface PinLog {
  id: string;
  dealId?: string;
  title: string;
  description: string;
  link: string;
  imageUrl: string;
  boardId: string;
  status: 'success' | 'simulated' | 'error';
  responseDetails?: any;
  timestamp: string;
}

const pinLogs: PinLog[] = [];

// Defaults matching main.py
let runtimeConfig = {
  pinterestAccessToken: process.env.PINTEREST_ACCESS_TOKEN || '',
  pinterestBoardId: process.env.PINTEREST_BOARD_ID || '',
  amazonAffiliateTag: process.env.AMAZON_AFFILIATE_TAG || 'bughy29-20',
  rssFeedUrl: "https://slickdeals.net/newsearch.php?mode=popdeals&searchtypedsc=new&q=amazon&searchin=first&rss=1",
};

// Fallback curated deals if external RSS is temporarily unreachable
const FALLBACK_DEALS: DealItem[] = [
  {
    id: "deal-1",
    title: "Apple AirPods Pro 2 Wireless Earbuds with USB-C Charging Case",
    description: "Active Noise Cancellation reduces unwanted background noise. Adaptive Audio dynamically blends Transparency and Active Noise Cancellation.",
    rawLink: "https://www.amazon.com/dp/B0CHWRXH8B",
    affiliateLink: `https://www.amazon.com/dp/B0CHWRXH8B?tag=${runtimeConfig.amazonAffiliateTag}`,
    imageUrl: "https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?auto=format&fit=crop&w=600&q=80",
    pubDate: new Date().toUTCString(),
    status: 'pending'
  },
  {
    id: "deal-2",
    title: "Kindle Paperwhite 16 GB – Now with 6.8\" display and adjustable warm light",
    description: "Purpose-built for reading with a flush-front design and 300 ppi glare-free display that reads like real paper, even in bright sunlight.",
    rawLink: "https://www.amazon.com/dp/B08KTZ8249",
    affiliateLink: `https://www.amazon.com/dp/B08KTZ8249?tag=${runtimeConfig.amazonAffiliateTag}`,
    imageUrl: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80",
    pubDate: new Date().toUTCString(),
    status: 'pending'
  },
  {
    id: "deal-3",
    title: "Sony WH-1000XM5 Wireless Industry Leading Noise Canceling Headphones",
    description: "Two processors and 8 microphones for unprecedented noise cancellation and exceptional call quality with Precise Voice Pickup.",
    rawLink: "https://www.amazon.com/dp/B09XS7JWHH",
    affiliateLink: `https://www.amazon.com/dp/B09XS7JWHH?tag=${runtimeConfig.amazonAffiliateTag}`,
    imageUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80",
    pubDate: new Date().toUTCString(),
    status: 'pending'
  },
  {
    id: "deal-4",
    title: "Ninja Foodi 6-in-1 8-qt. 2-Basket Air Fryer with DualZone Technology",
    description: "2 independent baskets let you cook 2 foods, 2 ways, at the same time, not back-to-back like a traditional single-basket air fryer.",
    rawLink: "https://www.amazon.com/dp/B089TQWJKK",
    affiliateLink: `https://www.amazon.com/dp/B089TQWJKK?tag=${runtimeConfig.amazonAffiliateTag}`,
    imageUrl: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=600&q=80",
    pubDate: new Date().toUTCString(),
    status: 'pending'
  },
  {
    id: "deal-5",
    title: "Anker 737 Power Bank (PowerCore 24K), 24,000mAh 3-Port Portable Charger",
    description: "Equipped with the latest Power Delivery 3.1 and bi-directional technology to quickly recharge the portable charger or get a 140W ultra-powerful charge.",
    rawLink: "https://www.amazon.com/dp/B09VPHVT2Z",
    affiliateLink: `https://www.amazon.com/dp/B09VPHVT2Z?tag=${runtimeConfig.amazonAffiliateTag}`,
    imageUrl: "https://images.unsplash.com/photo-1609592424364-7757976e10a2?auto=format&fit=crop&w=600&q=80",
    pubDate: new Date().toUTCString(),
    status: 'pending'
  }
];

function extractImageFromHtml(html: string): string {
  if (!html) return '';
  const match = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  return match ? match[1] : '';
}

function attachAffiliateTag(rawLink: string, tag: string): string {
  if (!rawLink) return '';
  const cleanTag = tag.trim() || 'bughy29-20';
  if (rawLink.includes('tag=')) {
    return rawLink.replace(/tag=[^&]+/, `tag=${cleanTag}`);
  }
  return rawLink.includes('?') ? `${rawLink}&tag=${cleanTag}` : `${rawLink}?tag=${cleanTag}`;
}

// 1. API: Get configuration status
app.get('/api/status', (req, res) => {
  res.json({
    hasPinterestToken: Boolean(runtimeConfig.pinterestAccessToken),
    hasBoardId: Boolean(runtimeConfig.pinterestBoardId),
    boardIdMasked: runtimeConfig.pinterestBoardId ? `${runtimeConfig.pinterestBoardId.slice(0, 4)}...${runtimeConfig.pinterestBoardId.slice(-4)}` : null,
    amazonAffiliateTag: runtimeConfig.amazonAffiliateTag,
    rssFeedUrl: runtimeConfig.rssFeedUrl,
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY),
    totalPinsPublished: pinLogs.length
  });
});

// 2. API: Update runtime configuration
app.post('/api/settings', (req, res) => {
  const { amazonAffiliateTag, rssFeedUrl, pinterestAccessToken, pinterestBoardId } = req.body;
  if (amazonAffiliateTag !== undefined) runtimeConfig.amazonAffiliateTag = amazonAffiliateTag;
  if (rssFeedUrl !== undefined) runtimeConfig.rssFeedUrl = rssFeedUrl;
  if (pinterestAccessToken !== undefined) runtimeConfig.pinterestAccessToken = pinterestAccessToken;
  if (pinterestBoardId !== undefined) runtimeConfig.pinterestBoardId = pinterestBoardId;

  res.json({
    success: true,
    message: "Settings updated successfully",
    config: {
      amazonAffiliateTag: runtimeConfig.amazonAffiliateTag,
      rssFeedUrl: runtimeConfig.rssFeedUrl,
      hasPinterestToken: Boolean(runtimeConfig.pinterestAccessToken),
      hasBoardId: Boolean(runtimeConfig.pinterestBoardId),
    }
  });
});

// 3. API: Fetch RSS deals (mirrors main.py fetch_rss_deals)
app.get('/api/deals', async (req, res) => {
  const feedUrl = (req.query.feedUrl as string) || runtimeConfig.rssFeedUrl;
  const tag = (req.query.tag as string) || runtimeConfig.amazonAffiliateTag;
  const limit = parseInt(req.query.limit as string) || 12;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(feedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/rss+xml, application/xml, text/xml, */*'
      },
      signal: controller.signal
    });

    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`Feed HTTP ${response.status} ${response.statusText}`);
    }

    const xmlText = await response.text();
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "@_"
    });

    const parsed = parser.parse(xmlText);
    const rawItems = parsed?.rss?.channel?.item || parsed?.feed?.entry || [];
    const itemsArray = Array.isArray(rawItems) ? rawItems : [rawItems];

    if (!itemsArray.length || !itemsArray[0]) {
      throw new Error("No items found in RSS feed");
    }

    const deals: DealItem[] = itemsArray.slice(0, limit).map((item: any, idx: number) => {
      const title = String(item.title || `Amazon Deal #${idx + 1}`).trim();
      const rawDescription = String(item.description || item.summary || item['content:encoded'] || '').trim();
      
      // Clean up HTML tags for plain text description
      const plainDescription = rawDescription
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      let link = String(item.link || item.guid || '');
      if (typeof link === 'object' && link['@_href']) {
        link = link['@_href'];
      }

      let imgUrl = extractImageFromHtml(rawDescription);
      if (!imgUrl && item.enclosure && item.enclosure['@_url']) {
        imgUrl = item.enclosure['@_url'];
      }
      if (!imgUrl || !imgUrl.startsWith('http')) {
        imgUrl = "https://m.media-amazon.com/images/G/01/social/api-share/amazon_logo_500x500._CB485935080_.png";
      }

      return {
        id: `deal-${idx}-${Date.now()}`,
        title,
        description: plainDescription || "🔥 Best Amazon Deal! Check it out now. #Amazon #Deals #Shopping",
        rawLink: link,
        affiliateLink: attachAffiliateTag(link, tag),
        imageUrl: imgUrl,
        pubDate: item.pubDate || new Date().toISOString(),
        status: 'pending'
      };
    });

    res.json({
      success: true,
      source: 'live-feed',
      count: deals.length,
      deals
    });
  } catch (error: any) {
    console.warn("Could not fetch remote RSS feed (using fallback verified deals):", error.message);
    const taggedFallbacks = FALLBACK_DEALS.map(d => ({
      ...d,
      affiliateLink: attachAffiliateTag(d.rawLink, tag)
    }));
    res.json({
      success: true,
      source: 'fallback-cache',
      notice: `Fetched cached curated deals (Live feed response: ${error.message})`,
      count: taggedFallbacks.length,
      deals: taggedFallbacks
    });
  }
});

// 4. API: Create Pinterest Pin (mirrors main.py create_pinterest_pin)
app.post('/api/pinterest/create-pin', async (req, res) => {
  const { title, description, link, imageUrl, boardId, accessToken } = req.body;

  const targetBoardId = boardId || runtimeConfig.pinterestBoardId;
  const targetToken = accessToken || runtimeConfig.pinterestAccessToken;

  const cleanTitle = (title || "Amazon Deal").slice(0, 99); // Limită Pinterest 99 chars
  const cleanDescription = (description || "🔥 Best Amazon Deal! Check it out now. #Amazon #Deals #Shopping").slice(0, 499); // Limită Pinterest 499 chars
  const pinLink = link || "https://amazon.com";
  const pinImage = imageUrl || "https://m.media-amazon.com/images/G/01/social/api-share/amazon_logo_500x500._CB485935080_.png";

  const payload = {
    board_id: targetBoardId,
    title: cleanTitle,
    description: cleanDescription,
    link: pinLink,
    media_source: {
      source_type: "image_url",
      url: pinImage
    }
  };

  // If token is missing or boardId is missing, provide a realistic simulated response
  if (!targetToken || !targetBoardId) {
    const simulatedPin: PinLog = {
      id: `sim-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      title: cleanTitle,
      description: cleanDescription,
      link: pinLink,
      imageUrl: pinImage,
      boardId: targetBoardId || 'demo-board',
      status: 'simulated',
      responseDetails: {
        id: `pin_mock_${Date.now()}`,
        created_at: new Date().toISOString(),
        board_id: targetBoardId || 'demo-board',
        note: "Simulated pin (Configure PINTEREST_ACCESS_TOKEN and PINTEREST_BOARD_ID to push live to Pinterest)",
        payload
      },
      timestamp: new Date().toISOString()
    };
    pinLogs.unshift(simulatedPin);

    return res.json({
      success: true,
      mode: 'simulated',
      message: 'Pin created in preview/simulation mode. To push directly to your live Pinterest account, configure your Pinterest Token and Board ID in Settings.',
      pin: simulatedPin
    });
  }

  try {
    const pinterestRes = await fetch("https://api.pinterest.com/v5/pins", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${targetToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const data = await pinterestRes.json();

    const logEntry: PinLog = {
      id: `live-${Date.now()}`,
      title: cleanTitle,
      description: cleanDescription,
      link: pinLink,
      imageUrl: pinImage,
      boardId: targetBoardId,
      status: pinterestRes.ok ? 'success' : 'error',
      responseDetails: data,
      timestamp: new Date().toISOString()
    };
    pinLogs.unshift(logEntry);

    if (!pinterestRes.ok) {
      return res.status(pinterestRes.status).json({
        success: false,
        error: data.message || "Failed to create pin on Pinterest",
        details: data,
        payload
      });
    }

    res.json({
      success: true,
      mode: 'live',
      pinterestResponse: data,
      pin: logEntry
    });
  } catch (err: any) {
    const errorEntry: PinLog = {
      id: `err-${Date.now()}`,
      title: cleanTitle,
      description: cleanDescription,
      link: pinLink,
      imageUrl: pinImage,
      boardId: targetBoardId,
      status: 'error',
      responseDetails: { message: err.message },
      timestamp: new Date().toISOString()
    };
    pinLogs.unshift(errorEntry);

    res.status(500).json({
      success: false,
      error: `Network error connecting to Pinterest API: ${err.message}`
    });
  }
});

// 5. API: Batch publish (mirrors main.py execution loop)
app.post('/api/deals/publish-batch', async (req, res) => {
  const { deals, customDescription } = req.body;
  if (!Array.isArray(deals) || deals.length === 0) {
    return res.status(400).json({ error: "No deals provided to publish" });
  }

  const results: any[] = [];
  const tag = runtimeConfig.amazonAffiliateTag;

  for (const item of deals) {
    const rawLink = item.rawLink || item.link;
    const affiliateLink = attachAffiliateTag(rawLink, tag);
    const title = (item.title || "Amazon Deal").slice(0, 99);
    const description = (customDescription || item.description || "🔥 Best Amazon Deal! Check it out now. #Amazon #Deals #Shopping").slice(0, 499);
    const imageUrl = item.imageUrl || "https://m.media-amazon.com/images/G/01/social/api-share/amazon_logo_500x500._CB485935080_.png";

    if (!runtimeConfig.pinterestAccessToken || !runtimeConfig.pinterestBoardId) {
      const simPin: PinLog = {
        id: `batch-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        title,
        description,
        link: affiliateLink,
        imageUrl,
        boardId: runtimeConfig.pinterestBoardId || 'demo-board',
        status: 'simulated',
        responseDetails: { simulated: true },
        timestamp: new Date().toISOString()
      };
      pinLogs.unshift(simPin);
      results.push({ itemTitle: title, success: true, mode: 'simulated', pin: simPin });
    } else {
      try {
        const pinRes = await fetch("https://api.pinterest.com/v5/pins", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${runtimeConfig.pinterestAccessToken}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            board_id: runtimeConfig.pinterestBoardId,
            title,
            description,
            link: affiliateLink,
            media_source: { source_type: "image_url", url: imageUrl }
          })
        });
        const pData = await pinRes.json();
        const pinEntry: PinLog = {
          id: `batch-${Date.now()}`,
          title,
          description,
          link: affiliateLink,
          imageUrl,
          boardId: runtimeConfig.pinterestBoardId,
          status: pinRes.ok ? 'success' : 'error',
          responseDetails: pData,
          timestamp: new Date().toISOString()
        };
        pinLogs.unshift(pinEntry);
        results.push({ itemTitle: title, success: pinRes.ok, pin: pinEntry, error: !pinRes.ok ? pData : undefined });
      } catch (err: any) {
        results.push({ itemTitle: title, success: false, error: err.message });
      }
    }
  }

  res.json({
    success: true,
    totalProcessed: deals.length,
    results
  });
});

// 6. API: Get pin publishing history
app.get('/api/history', (req, res) => {
  res.json({
    history: pinLogs.slice(0, 50)
  });
});

// Mount Vite or serve static files
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
