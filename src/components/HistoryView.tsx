import React from 'react';
import { PinLog } from '../types';
import { CheckCircle2, AlertCircle, ExternalLink, RefreshCw, Calendar, Tag, ShieldCheck } from 'lucide-react';

interface HistoryViewProps {
  history: PinLog[];
  onRefreshHistory: () => void;
  isLoading: boolean;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  history,
  onRefreshHistory,
  isLoading,
}) => {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-4 border border-stone-200/80 shadow-xs flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-stone-900">Pinterest Pin Activity Log</h2>
          <p className="text-xs text-stone-500">
            Real-time record of all pins pushed through Pinterest API v5
          </p>
        </div>
        <button
          onClick={onRefreshHistory}
          disabled={isLoading}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-xl transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {history.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-stone-200">
          <Calendar className="w-12 h-12 text-stone-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-stone-800">No pins published yet</h3>
          <p className="text-sm text-stone-500 mt-1">
            Head to the RSS Deals feed to pin products or run the automated batch script.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-stone-200/80 shadow-xs overflow-hidden">
          <div className="divide-y divide-stone-100">
            {history.map((pin) => (
              <div key={pin.id} className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-stone-50/70 transition-colors">
                <div className="flex items-start gap-4 min-w-0">
                  <div className="w-16 h-16 rounded-xl bg-stone-100 border border-stone-200 overflow-hidden shrink-0 flex items-center justify-center">
                    <img
                      src={pin.imageUrl}
                      alt={pin.title}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          "https://m.media-amazon.com/images/G/01/social/api-share/amazon_logo_500x500._CB485935080_.png";
                      }}
                      className="w-full h-full object-contain p-1"
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-stone-900 truncate">
                        {pin.title}
                      </h4>
                      {pin.status === 'success' ? (
                        <span className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" /> Live
                        </span>
                      ) : pin.status === 'simulated' ? (
                        <span className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          <ShieldCheck className="w-3 h-3" /> Preview
                        </span>
                      ) : (
                        <span className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-700 border border-red-200">
                          <AlertCircle className="w-3 h-3" /> Error
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-stone-500 mt-0.5 line-clamp-1">
                      {pin.description}
                    </p>
                    <div className="flex items-center gap-3 mt-1.5 text-[11px] text-stone-400">
                      <span>Board: <strong className="text-stone-600 font-mono">{pin.boardId}</strong></span>
                      <span>•</span>
                      <span>{new Date(pin.timestamp).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  <a
                    href={pin.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-xl transition-colors"
                  >
                    <span>Affiliate Link</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
