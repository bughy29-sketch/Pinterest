export interface DealItem {
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

export interface PinLog {
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

export interface AppConfig {
  hasPinterestToken: boolean;
  hasBoardId: boolean;
  boardIdMasked: string | null;
  amazonAffiliateTag: string;
  rssFeedUrl: string;
  hasGeminiKey: boolean;
  totalPinsPublished: number;
}
