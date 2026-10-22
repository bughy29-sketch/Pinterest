import React, { useState } from 'react';
import { DealItem } from '../types';
import { Search, ExternalLink, Copy, Check, Send, CheckCircle2, ShoppingBag, Eye, Tag } from 'lucide-react';

interface DealsFeedProps {
  deals: DealItem[];
  selectedDealIds: string[];
  onToggleSelect: (id: string) => void;
  onSelectAll: () => void;
  onClearSelection: () => void;
  onOpenPinModal: (deal: DealItem) => void;
  onQuickPublish: (deal: DealItem) => void;
  isPublishingId: string | null;
  amazonAffiliateTag: string;
}

export const DealsFeed: React.FC<DealsFeedProps> = ({
  deals,
  selectedDealIds,
  onToggleSelect,
  onSelectAll,
  onClearSelection,
  onOpenPinModal,
  onQuickPublish,
  isPublishingId,
  amazonAffiliateTag,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredDeals = deals.filter((deal) =>
    deal.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    deal.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCopyLink = (deal: DealItem, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(deal.affiliateLink);
    setCopiedId(deal.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Search & Bulk Action Bar */}
      <div className="bg-white rounded-2xl p-4 border border-stone-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <input
            type="text"
            placeholder="Search deals, products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end text-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={onSelectAll}
              className="px-3 py-1.5 font-medium text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-stone-200/70 rounded-lg transition-colors"
            >
              Select All ({deals.length})
            </button>
            {selectedDealIds.length > 0 && (
              <button
                onClick={onClearSelection}
                className="px-3 py-1.5 font-medium text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100/70 rounded-lg transition-colors"
              >
                Clear ({selectedDealIds.length})
              </button>
            )}
          </div>
          <span className="text-stone-400">|</span>
          <span className="text-stone-500 font-medium">
            Affiliate Tag: <strong className="text-stone-700 font-mono">{amazonAffiliateTag}</strong>
          </span>
        </div>
      </div>

      {/* Grid of Deal Cards (Pinterest Inspired Masonry Feel) */}
      {filteredDeals.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-stone-200">
          <ShoppingBag className="w-12 h-12 text-stone-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-stone-800">No deals found</h3>
          <p className="text-sm text-stone-500 mt-1">Try another search term or click the refresh button.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDeals.map((deal) => {
            const isSelected = selectedDealIds.includes(deal.id);
            const isPublishing = isPublishingId === deal.id;

            return (
              <div
                key={deal.id}
                className={`group relative bg-white rounded-2xl border transition-all duration-200 overflow-hidden flex flex-col justify-between ${
                  isSelected
                    ? 'border-red-400 ring-2 ring-red-400/20 shadow-md'
                    : 'border-stone-200/80 hover:border-stone-300 hover:shadow-md'
                }`}
              >
                {/* Checkbox overlay */}
                <div className="absolute top-3 left-3 z-10">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => onToggleSelect(deal.id)}
                    className="w-4 h-4 rounded text-red-600 border-stone-300 focus:ring-red-500 cursor-pointer accent-red-600"
                  />
                </div>

                {/* Published Badge if applicable */}
                {deal.status === 'published' && (
                  <div className="absolute top-3 right-3 z-10 flex items-center gap-1 px-2.5 py-1 bg-emerald-600 text-white text-xs font-semibold rounded-full shadow-sm">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Pinned
                  </div>
                )}

                {/* Deal Image container */}
                <div className="relative aspect-4/3 w-full bg-stone-100 overflow-hidden cursor-pointer" onClick={() => onOpenPinModal(deal)}>
                  <img
                    src={deal.imageUrl}
                    alt={deal.title}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        "https://m.media-amazon.com/images/G/01/social/api-share/amazon_logo_500x500._CB485935080_.png";
                    }}
                    className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <span className="px-3 py-1.5 bg-white/90 backdrop-blur-xs text-xs font-semibold text-stone-800 rounded-full shadow-sm flex items-center gap-1.5">
                      <Eye className="w-3.5 h-3.5 text-red-600" />
                      Preview Pin
                    </span>
                  </div>
                </div>

                {/* Deal Content */}
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <h3
                      className="text-sm font-semibold text-stone-900 line-clamp-2 leading-snug hover:text-red-600 cursor-pointer transition-colors"
                      onClick={() => onOpenPinModal(deal)}
                      title={deal.title}
                    >
                      {deal.title}
                    </h3>
                    <p className="text-xs text-stone-500 mt-2 line-clamp-3 leading-relaxed">
                      {deal.description}
                    </p>
                  </div>

                  {/* Affiliate Link display & Copy */}
                  <div className="mt-4 pt-3 border-t border-stone-100 space-y-3">
                    <div className="flex items-center justify-between text-xs text-stone-500 bg-stone-50 px-2.5 py-1.5 rounded-lg border border-stone-200/60 font-mono">
                      <span className="truncate pr-2 select-all max-w-[200px]" title={deal.affiliateLink}>
                        {deal.affiliateLink}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => handleCopyLink(deal, e)}
                          title="Copy Affiliate Link"
                          className="p-1 hover:text-stone-900 transition-colors"
                        >
                          {copiedId === deal.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <a
                          href={deal.affiliateLink}
                          target="_blank"
                          rel="noreferrer noopener"
                          title="Open Affiliate Link"
                          className="p-1 hover:text-stone-900 transition-colors"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <ExternalLink className="w-3.5 h-3.5 text-stone-400 hover:text-stone-700" />
                        </a>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onOpenPinModal(deal)}
                        className="flex-1 px-3 py-2 text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-xl transition-colors flex items-center justify-center gap-1.5"
                      >
                        <Tag className="w-3.5 h-3.5 text-stone-500" />
                        Customize Pin
                      </button>
                      <button
                        onClick={() => onQuickPublish(deal)}
                        disabled={isPublishing}
                        className="px-3 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-xs disabled:opacity-50"
                        title="Publish immediately to Pinterest"
                      >
                        <Send className={`w-3.5 h-3.5 ${isPublishing ? 'animate-spin' : ''}`} />
                        {isPublishing ? 'Posting...' : 'Pin'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
