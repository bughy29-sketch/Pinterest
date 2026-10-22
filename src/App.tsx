import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { DealsFeed } from './components/DealsFeed';
import { AutomationRunner } from './components/AutomationRunner';
import { HistoryView } from './components/HistoryView';
import { SettingsModal } from './components/SettingsModal';
import { PinModal } from './components/PinModal';
import { DealItem, PinLog, AppConfig } from './types';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'deals' | 'automation' | 'history' | 'settings'>('deals');
  const [deals, setDeals] = useState<DealItem[]>([]);
  const [history, setHistory] = useState<PinLog[]>([]);
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [selectedDealIds, setSelectedDealIds] = useState<string[]>([]);
  const [selectedPinDeal, setSelectedPinDeal] = useState<DealItem | null>(null);
  
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isBatchRunning, setIsBatchRunning] = useState(false);
  const [isPublishingId, setIsPublishingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ text, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/status');
      if (res.ok) {
        const data = await res.json();
        setConfig(data);
      }
    } catch (e) {
      console.error("Failed to load server status", e);
    }
  };

  const fetchDeals = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch('/api/deals');
      const data = await res.json();
      if (data.deals) {
        setDeals(data.deals);
      }
    } catch (e: any) {
      showToast(`Failed to load deals: ${e.message}`, 'error');
    } finally {
      setIsRefreshing(false);
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await fetch('/api/history');
      if (res.ok) {
        const data = await res.json();
        setHistory(data.history || []);
      }
    } catch (e) {
      console.error("Failed to load history", e);
    }
  };

  useEffect(() => {
    fetchStatus();
    fetchDeals();
    fetchHistory();
  }, []);

  const handleToggleSelect = (id: string) => {
    setSelectedDealIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    setSelectedDealIds(deals.map(d => d.id));
  };

  const handleClearSelection = () => {
    setSelectedDealIds([]);
  };

  const handleQuickPublish = async (deal: DealItem) => {
    setIsPublishingId(deal.id);
    try {
      const res = await fetch('/api/pinterest/create-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: deal.title,
          description: `🔥 Best Amazon Deal! Check it out now. #Amazon #Deals #Shopping`,
          link: deal.affiliateLink,
          imageUrl: deal.imageUrl,
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast(
          data.mode === 'live'
            ? `Pin successfully posted to Pinterest: "${deal.title.slice(0, 30)}..."`
            : `Pin simulated successfully: "${deal.title.slice(0, 30)}..."`,
          'success'
        );
        setDeals(prev =>
          prev.map(d => (d.id === deal.id ? { ...d, status: 'published' } : d))
        );
        fetchHistory();
        fetchStatus();
      } else {
        showToast(`Failed to publish pin: ${data.error}`, 'error');
      }
    } catch (err: any) {
      showToast(`Error publishing pin: ${err.message}`, 'error');
    } finally {
      setIsPublishingId(null);
    }
  };

  const handleRunBatch = async () => {
    setIsBatchRunning(true);
    const targetDeals = selectedDealIds.length > 0
      ? deals.filter(d => selectedDealIds.includes(d.id))
      : deals.slice(0, 5);

    try {
      const res = await fetch('/api/deals/publish-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deals: targetDeals,
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Batch execution completed! Processed ${data.totalProcessed} pins.`, 'success');
        const publishedIds = new Set(targetDeals.map(d => d.id));
        setDeals(prev =>
          prev.map(d => (publishedIds.has(d.id) ? { ...d, status: 'published' } : d))
        );
        setSelectedDealIds([]);
        fetchHistory();
        fetchStatus();
      } else {
        showToast(`Batch publish error: ${data.error}`, 'error');
      }
    } catch (err: any) {
      showToast(`Batch execution failed: ${err.message}`, 'error');
    } finally {
      setIsBatchRunning(false);
    }
  };

  const handleUpdateSettings = async (newConfig: {
    amazonAffiliateTag?: string;
    rssFeedUrl?: string;
    pinterestAccessToken?: string;
    pinterestBoardId?: string;
  }) => {
    const res = await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newConfig)
    });
    if (res.ok) {
      await fetchStatus();
      await fetchDeals();
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col">
      <Header
        config={config}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onRefreshDeals={fetchDeals}
        onRunBatch={handleRunBatch}
        isRefreshing={isRefreshing}
        isBatchRunning={isBatchRunning}
        selectedCount={selectedDealIds.length}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Toast Notification */}
        {toast && (
          <div
            className={`mb-6 p-4 rounded-2xl flex items-center justify-between text-xs font-medium shadow-md transition-all ${
              toast.type === 'success'
                ? 'bg-emerald-600 text-white'
                : toast.type === 'error'
                ? 'bg-red-600 text-white'
                : 'bg-stone-900 text-white'
            }`}
          >
            <div className="flex items-center gap-2">
              {toast.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : toast.type === 'error' ? (
                <AlertCircle className="w-4 h-4 shrink-0" />
              ) : (
                <Info className="w-4 h-4 shrink-0" />
              )}
              <span>{toast.text}</span>
            </div>
            <button onClick={() => setToast(null)} className="text-white/80 hover:text-white p-1">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Tab View Routing */}
        {activeTab === 'deals' && (
          <DealsFeed
            deals={deals}
            selectedDealIds={selectedDealIds}
            onToggleSelect={handleToggleSelect}
            onSelectAll={handleSelectAll}
            onClearSelection={handleClearSelection}
            onOpenPinModal={(deal) => setSelectedPinDeal(deal)}
            onQuickPublish={handleQuickPublish}
            isPublishingId={isPublishingId}
            amazonAffiliateTag={config?.amazonAffiliateTag || 'bughy29-20'}
          />
        )}

        {activeTab === 'automation' && (
          <AutomationRunner
            deals={deals}
            amazonAffiliateTag={config?.amazonAffiliateTag || 'bughy29-20'}
            hasPinterestToken={Boolean(config?.hasPinterestToken)}
            hasBoardId={Boolean(config?.hasBoardId)}
            onRefreshData={() => {
              fetchHistory();
              fetchStatus();
            }}
          />
        )}

        {activeTab === 'history' && (
          <HistoryView
            history={history}
            onRefreshHistory={fetchHistory}
            isLoading={isRefreshing}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsModal
            config={config}
            onUpdateSettings={handleUpdateSettings}
          />
        )}
      </main>

      {/* Pin Customizer Modal */}
      {selectedPinDeal && (
        <PinModal
          deal={selectedPinDeal}
          boardId={config?.boardIdMasked ? '' : 'deals-board'}
          onClose={() => setSelectedPinDeal(null)}
          onSuccess={(pin) => {
            showToast(`Pin published: "${pin.title.slice(0, 30)}..."`, 'success');
            setDeals(prev =>
              prev.map(d => (d.id === selectedPinDeal.id ? { ...d, status: 'published' } : d))
            );
            fetchHistory();
            fetchStatus();
          }}
        />
      )}

      {/* Footer */}
      <footer className="mt-auto border-t border-stone-200 bg-white py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-500">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-stone-700">Pinterest Amazon Automator</span>
            <span>•</span>
            <span>Ported from Python script &amp; GitHub Actions cron</span>
          </div>
          <div className="flex items-center gap-4">
            <span>Slickdeals RSS Ingestion</span>
            <span>•</span>
            <span>Pinterest API v5</span>
            <span>•</span>
            <span className="font-mono text-stone-600">Amazon Tag: {config?.amazonAffiliateTag || 'bughy29-20'}</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
