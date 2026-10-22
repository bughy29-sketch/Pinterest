import React, { useState } from 'react';
import { DealItem, PinLog } from '../types';
import { X, Send, Sparkles, Check, ExternalLink, Image as ImageIcon, AlertCircle } from 'lucide-react';

interface PinModalProps {
  deal: DealItem;
  boardId: string;
  onClose: () => void;
  onSuccess: (pin: PinLog) => void;
}

const DEFAULT_HASHTAGS = ["#Amazon", "#Deals", "#Shopping", "#AmazonFinds", "#Discounts", "#PrimeDeal"];

export const PinModal: React.FC<PinModalProps> = ({ deal, boardId, onClose, onSuccess }) => {
  const [title, setTitle] = useState(deal.title.slice(0, 99));
  const [description, setDescription] = useState(
    deal.description
      ? `${deal.description.slice(0, 420)} #Amazon #Deals #Shopping`.slice(0, 499)
      : "🔥 Best Amazon Deal! Check it out now. #Amazon #Deals #Shopping"
  );
  const [imageUrl, setImageUrl] = useState(deal.imageUrl);
  const [link, setLink] = useState(deal.affiliateLink);
  const [targetBoard, setTargetBoard] = useState(boardId || 'deals-board');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddHashtag = (tag: string) => {
    if (!description.includes(tag)) {
      const updated = `${description} ${tag}`.slice(0, 499);
      setDescription(updated);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/pinterest/create-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.slice(0, 99),
          description: description.slice(0, 499),
          link,
          imageUrl,
          boardId: targetBoard
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to publish pin');
      }

      onSuccess(data.pin);
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 bg-stone-50">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-red-600 flex items-center justify-center text-white text-sm font-serif font-black italic">
              P
            </div>
            <div>
              <h2 className="text-sm font-bold text-stone-900">Pinterest Pin Studio</h2>
              <p className="text-xs text-stone-500">Customize title, description, and target board</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-700">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 grid grid-cols-1 md:grid-cols-12 gap-8">
          {/* Left Column: Visual Pin Preview */}
          <div className="md:col-span-5 flex flex-col items-center">
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2 self-start">
              Live Pin Mockup
            </span>
            <div className="w-full max-w-[280px] bg-white rounded-2xl border border-stone-200 shadow-lg overflow-hidden flex flex-col group">
              <div className="relative aspect-3/4 bg-stone-100 flex items-center justify-center overflow-hidden">
                <img
                  src={imageUrl}
                  alt={title}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      "https://m.media-amazon.com/images/G/01/social/api-share/amazon_logo_500x500._CB485935080_.png";
                  }}
                  className="w-full h-full object-contain p-2"
                />
                <div className="absolute top-3 right-3 bg-red-600 text-white font-bold text-xs px-3 py-1.5 rounded-full shadow-md">
                  Save
                </div>
              </div>
              <div className="p-3.5 space-y-1.5 bg-stone-50/50">
                <h4 className="text-xs font-bold text-stone-900 line-clamp-2 leading-tight">
                  {title || 'Your Pin Title'}
                </h4>
                <p className="text-[11px] text-stone-600 line-clamp-3 leading-snug">
                  {description || 'Your pin description and hashtags...'}
                </p>
                <div className="pt-2 flex items-center justify-between text-[10px] text-stone-500">
                  <span className="truncate max-w-[150px] font-mono text-stone-600">
                    amazon.com
                  </span>
                  <ExternalLink className="w-3 h-3 text-stone-400" />
                </div>
              </div>
            </div>
            <p className="text-[11px] text-stone-400 mt-3 text-center">
              Pins with high-resolution product imagery and clear deal pricing achieve 3x more engagement.
            </p>
          </div>

          {/* Right Column: Form Inputs */}
          <div className="md:col-span-7 space-y-4">
            {/* Title (max 99) */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-bold text-stone-700">Pin Title</label>
                <span className={`text-[11px] font-mono ${title.length > 99 ? 'text-red-500' : 'text-stone-400'}`}>
                  {title.length}/99
                </span>
              </div>
              <input
                type="text"
                value={title}
                maxLength={99}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full px-3.5 py-2 text-sm bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 font-medium"
                placeholder="Product deal title"
              />
            </div>

            {/* Description (max 499) */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-bold text-stone-700">Pin Description</label>
                <span className={`text-[11px] font-mono ${description.length > 499 ? 'text-red-500' : 'text-stone-400'}`}>
                  {description.length}/499
                </span>
              </div>
              <textarea
                rows={3}
                value={description}
                maxLength={499}
                onChange={(e) => setDescription(e.target.value)}
                required
                className="w-full px-3.5 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 leading-relaxed"
                placeholder="Write an enticing description and tags..."
              />
              {/* Quick Hashtags */}
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {DEFAULT_HASHTAGS.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleAddHashtag(tag)}
                    className="text-[11px] px-2 py-0.5 bg-stone-100 hover:bg-red-50 hover:text-red-600 rounded-md text-stone-600 transition-colors"
                  >
                    + {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Destination Link */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Destination Link (with Amazon Tag)
              </label>
              <input
                type="url"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                required
                className="w-full px-3.5 py-2 text-xs font-mono bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
              />
            </div>

            {/* Image URL & Board ID Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Image Source URL
                </label>
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  required
                  className="w-full px-3 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 truncate"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Target Board ID
                </label>
                <input
                  type="text"
                  value={targetBoard}
                  onChange={(e) => setTargetBoard(e.target.value)}
                  placeholder="e.g. 112233445566"
                  className="w-full px-3 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                />
              </div>
            </div>

            {/* Buttons */}
            <div className="pt-4 flex items-center justify-end gap-3 border-t border-stone-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
              >
                <Send className={`w-3.5 h-3.5 ${isSubmitting ? 'animate-spin' : ''}`} />
                {isSubmitting ? 'Posting Pin...' : 'Publish Pin to Pinterest'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
