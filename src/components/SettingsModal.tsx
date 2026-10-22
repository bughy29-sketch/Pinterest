import React, { useState } from 'react';
import { AppConfig } from '../types';
import { Settings, Save, Check, RefreshCw, Key, Tag, Rss, Layers } from 'lucide-react';

interface SettingsModalProps {
  config: AppConfig | null;
  onUpdateSettings: (newConfig: {
    amazonAffiliateTag?: string;
    rssFeedUrl?: string;
    pinterestAccessToken?: string;
    pinterestBoardId?: string;
  }) => Promise<void>;
}

const PRESET_FEEDS = [
  {
    name: 'Slickdeals Amazon (Default)',
    url: 'https://slickdeals.net/newsearch.php?mode=popdeals&searchtypedsc=new&q=amazon&searchin=first&rss=1'
  },
  {
    name: 'Slickdeals Electronics',
    url: 'https://slickdeals.net/newsearch.php?mode=popdeals&searchtypedsc=new&q=electronics+amazon&searchin=first&rss=1'
  },
  {
    name: 'Slickdeals Home & Kitchen',
    url: 'https://slickdeals.net/newsearch.php?mode=popdeals&searchtypedsc=new&q=kitchen+amazon&searchin=first&rss=1'
  }
];

export const SettingsModal: React.FC<SettingsModalProps> = ({ config, onUpdateSettings }) => {
  const [affiliateTag, setAffiliateTag] = useState(config?.amazonAffiliateTag || 'bughy29-20');
  const [rssUrl, setRssUrl] = useState(
    config?.rssFeedUrl ||
      'https://slickdeals.net/newsearch.php?mode=popdeals&searchtypedsc=new&q=amazon&searchin=first&rss=1'
  );
  const [boardId, setBoardId] = useState('');
  const [token, setToken] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSavedSuccess(false);

    try {
      await onUpdateSettings({
        amazonAffiliateTag: affiliateTag,
        rssFeedUrl: rssUrl,
        ...(boardId ? { pinterestBoardId: boardId } : {}),
        ...(token ? { pinterestAccessToken: token } : {}),
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-white rounded-2xl p-6 border border-stone-200/80 shadow-xs">
        <div className="flex items-center gap-3 pb-4 border-b border-stone-100">
          <div className="p-2.5 bg-stone-100 text-stone-700 rounded-xl">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-stone-900">Automation Configuration</h2>
            <p className="text-xs text-stone-500">
              Manage Amazon Affiliate tag, Pinterest API credentials, and deal feeds
            </p>
          </div>
        </div>

        {savedSuccess && (
          <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>Settings saved successfully! New deals will use the updated credentials.</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          {/* Amazon Affiliate Tag */}
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <Tag className="w-3.5 h-3.5 text-stone-500" />
              <label className="text-xs font-bold text-stone-800">
                Amazon Affiliate Tracking Tag
              </label>
            </div>
            <input
              type="text"
              value={affiliateTag}
              onChange={(e) => setAffiliateTag(e.target.value)}
              placeholder="e.g. bughy29-20"
              required
              className="w-full px-3.5 py-2 text-sm bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 font-mono"
            />
            <p className="text-[11px] text-stone-500 mt-1">
              Appended to deal URLs as <code className="font-mono text-stone-700 bg-stone-100 px-1 rounded">&tag={affiliateTag}</code>. Default: <span className="font-mono">bughy29-20</span>.
            </p>
          </div>

          {/* RSS Feed URL */}
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <Rss className="w-3.5 h-3.5 text-stone-500" />
              <label className="text-xs font-bold text-stone-800">
                Deals RSS Feed Source
              </label>
            </div>
            <input
              type="url"
              value={rssUrl}
              onChange={(e) => setRssUrl(e.target.value)}
              required
              className="w-full px-3.5 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 font-mono"
            />
            {/* Presets */}
            <div className="flex flex-wrap gap-2 mt-2">
              <span className="text-[11px] text-stone-400 self-center">Presets:</span>
              {PRESET_FEEDS.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => setRssUrl(preset.url)}
                  className={`text-[11px] px-2.5 py-1 rounded-lg border transition-colors ${
                    rssUrl === preset.url
                      ? 'bg-red-50 border-red-200 text-red-700 font-medium'
                      : 'bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100'
                  }`}
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </div>

          {/* Pinterest Credentials Section */}
          <div className="pt-4 border-t border-stone-100 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Key className="w-3.5 h-3.5 text-stone-500" />
                <label className="text-xs font-bold text-stone-800">
                  Pinterest API v5 Credentials
                </label>
              </div>
              <span className="text-[11px] text-stone-400">
                (Optional: leave blank to use environment variables or test mode)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-stone-600 mb-1">
                  Pinterest Board ID
                </label>
                <input
                  type="text"
                  value={boardId}
                  onChange={(e) => setBoardId(e.target.value)}
                  placeholder={config?.boardIdMasked || 'Enter board ID'}
                  className="w-full px-3.5 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-600 mb-1">
                  Pinterest Access Token
                </label>
                <input
                  type="password"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder={config?.hasPinterestToken ? '••••••••••••••••' : 'Enter access token'}
                  className="w-full px-3.5 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                />
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 px-5 py-2.5 text-xs font-semibold bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-xs transition-colors disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              {isSaving ? 'Saving...' : 'Save Configuration'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
