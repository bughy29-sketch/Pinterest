import React from 'react';
import { Sparkles, RefreshCw, Play, Settings, ExternalLink, Layers, History, Radio } from 'lucide-react';
import { AppConfig } from '../types';

interface HeaderProps {
  config: AppConfig | null;
  activeTab: 'deals' | 'automation' | 'history' | 'settings';
  setActiveTab: (tab: 'deals' | 'automation' | 'history' | 'settings') => void;
  onRefreshDeals: () => void;
  onRunBatch: () => void;
  isRefreshing: boolean;
  isBatchRunning: boolean;
  selectedCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  config,
  activeTab,
  setActiveTab,
  onRefreshDeals,
  onRunBatch,
  isRefreshing,
  isBatchRunning,
  selectedCount,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Identity */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center text-white font-bold text-xl shadow-sm shadow-red-200">
              <span className="font-serif italic font-black">P</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold tracking-tight text-stone-900 leading-none">
                  Pinterest Amazon Automator
                </h1>
                <span className="px-2 py-0.5 text-xs font-medium bg-red-50 text-red-700 rounded-full border border-red-100">
                  Affiliate v5
                </span>
              </div>
              <p className="text-xs text-stone-500 mt-0.5">
                Tag: <code className="font-mono font-semibold text-stone-700 bg-stone-100 px-1 rounded">{config?.amazonAffiliateTag || 'bughy29-20'}</code>
                {config?.hasPinterestToken ? (
                  <span className="ml-2 inline-flex items-center text-emerald-600 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1 animate-pulse"></span> Pinterest Live
                  </span>
                ) : (
                  <span className="ml-2 inline-flex items-center text-amber-600 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mr-1"></span> Preview Mode
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex items-center space-x-1 bg-stone-100 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('deals')}
              className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                activeTab === 'deals'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/60'
              }`}
            >
              <Layers className="w-4 h-4 text-red-600" />
              RSS Deals
            </button>
            <button
              onClick={() => setActiveTab('automation')}
              className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                activeTab === 'automation'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/60'
              }`}
            >
              <Radio className="w-4 h-4 text-amber-600" />
              main.py Runner
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                activeTab === 'history'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/60'
              }`}
            >
              <History className="w-4 h-4 text-blue-600" />
              Pin History
              {config?.totalPinsPublished ? (
                <span className="ml-1 px-1.5 py-0.2 bg-stone-200 text-stone-700 text-xs rounded-full">
                  {config.totalPinsPublished}
                </span>
              ) : null}
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                activeTab === 'settings'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/60'
              }`}
            >
              <Settings className="w-4 h-4 text-stone-600" />
              Settings
            </button>
          </nav>

          {/* Quick Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={onRefreshDeals}
              disabled={isRefreshing}
              title="Refresh RSS Deals"
              className="p-2 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-red-600' : ''}`} />
            </button>

            <button
              onClick={onRunBatch}
              disabled={isBatchRunning}
              className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-xs transition-colors disabled:opacity-50"
            >
              <Play className={`w-3.5 h-3.5 fill-current ${isBatchRunning ? 'animate-pulse' : ''}`} />
              {isBatchRunning ? 'Publishing...' : selectedCount > 0 ? `Publish (${selectedCount})` : 'Run Top 5'}
            </button>
          </div>
        </div>

        {/* Mobile Tab Bar */}
        <div className="flex md:hidden border-t border-stone-200 py-2 gap-1 overflow-x-auto">
          <button
            onClick={() => setActiveTab('deals')}
            className={`px-3 py-1 text-xs font-medium rounded-md whitespace-nowrap ${
              activeTab === 'deals' ? 'bg-red-50 text-red-700 font-semibold' : 'text-stone-600'
            }`}
          >
            RSS Deals
          </button>
          <button
            onClick={() => setActiveTab('automation')}
            className={`px-3 py-1 text-xs font-medium rounded-md whitespace-nowrap ${
              activeTab === 'automation' ? 'bg-red-50 text-red-700 font-semibold' : 'text-stone-600'
            }`}
          >
            main.py Runner
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-3 py-1 text-xs font-medium rounded-md whitespace-nowrap ${
              activeTab === 'history' ? 'bg-red-50 text-red-700 font-semibold' : 'text-stone-600'
            }`}
          >
            Pin History ({config?.totalPinsPublished || 0})
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-3 py-1 text-xs font-medium rounded-md whitespace-nowrap ${
              activeTab === 'settings' ? 'bg-red-50 text-red-700 font-semibold' : 'text-stone-600'
            }`}
          >
            Settings
          </button>
        </div>
      </div>
    </header>
  );
};
