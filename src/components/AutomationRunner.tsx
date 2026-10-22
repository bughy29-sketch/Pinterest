import React, { useState } from 'react';
import { DealItem } from '../types';
import { Terminal, Play, CheckCircle, Clock, Calendar, AlertTriangle, ShieldCheck, RefreshCw } from 'lucide-react';

interface AutomationRunnerProps {
  deals: DealItem[];
  amazonAffiliateTag: string;
  hasPinterestToken: boolean;
  hasBoardId: boolean;
  onRefreshData: () => void;
}

interface LogLine {
  id: string;
  time: string;
  text: string;
  type: 'info' | 'success' | 'warn' | 'error';
}

export const AutomationRunner: React.FC<AutomationRunnerProps> = ({
  deals,
  amazonAffiliateTag,
  hasPinterestToken,
  hasBoardId,
  onRefreshData,
}) => {
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState<LogLine[]>([
    {
      id: 'init-1',
      time: new Date().toLocaleTimeString(),
      text: '🤖 Pinterest Automation System Ready. Cron schedule: 0 10 * * * (Daily at 10:00 UTC)',
      type: 'info',
    },
    {
      id: 'init-2',
      time: new Date().toLocaleTimeString(),
      text: `🏷️ Active Amazon Affiliate Tag: ${amazonAffiliateTag}`,
      type: 'info',
    },
  ]);
  const [processedCount, setProcessedCount] = useState(0);

  const addLog = (text: string, type: 'info' | 'success' | 'warn' | 'error' = 'info') => {
    setLogs((prev) => [
      ...prev,
      {
        id: Math.random().toString(),
        time: new Date().toLocaleTimeString(),
        text,
        type,
      },
    ]);
  };

  const handleRunWorkflow = async () => {
    setIsRunning(true);
    setProcessedCount(0);
    const topDeals = deals.slice(0, 5);

    addLog('▶ Executare GitHub Action / main.py demarată...', 'info');
    addLog('Se extrag ofertele din Feed-ul RSS...', 'info');

    if (topDeals.length === 0) {
      addLog('Nu s-au găsit oferte în RSS Feed.', 'warn');
      setIsRunning(false);
      return;
    }

    addLog(`Găsit ${topDeals.length} oferte valide pentru prelucrare.`, 'info');

    // Simulate batch execution through server endpoint
    try {
      const res = await fetch('/api/deals/publish-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deals: topDeals,
          customDescription: "🔥 Best Amazon Deal! Check it out now. #Amazon #Deals #Shopping"
        })
      });

      const data = await res.json();

      if (data.results) {
        for (let i = 0; i < data.results.length; i++) {
          const item = data.results[i];
          setProcessedCount(i + 1);
          if (item.success) {
            addLog(
              `Răspuns Pinterest pentru '${item.itemTitle.slice(0, 45)}...': HTTP 201 Created [${item.mode === 'simulated' ? 'Simulated' : 'Live'}]`,
              'success'
            );
          } else {
            addLog(`Eroare la procesarea ofertei '${item.itemTitle.slice(0, 30)}': ${JSON.stringify(item.error)}`, 'error');
          }
        }
      }

      addLog(`✅ Execuția scriptului s-a finalizat cu succes! (${topDeals.length} pini procesați)`, 'success');
      onRefreshData();
    } catch (err: any) {
      addLog(`❌ Eroare critică de conexiune: ${err.message}`, 'error');
    } finally {
      setIsRunning(false);
    }
  };

  const clearLogs = () => {
    setLogs([
      {
        id: 'reset',
        time: new Date().toLocaleTimeString(),
        text: 'Terminal logs cleared.',
        type: 'info',
      },
    ]);
  };

  return (
    <div className="space-y-6">
      {/* Top Workflow Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Scheduled Automation Card */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-xs flex items-start gap-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
              Cron Schedule
            </span>
            <h4 className="text-sm font-bold text-stone-900 mt-0.5">Daily at 10:00 UTC</h4>
            <p className="text-xs text-stone-500 mt-1 font-mono">0 10 * * *</p>
          </div>
        </div>

        {/* Pinterest API Status */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-xs flex items-start gap-4">
          <div className={`p-3 rounded-xl ${hasPinterestToken && hasBoardId ? 'bg-emerald-50 text-emerald-600' : 'bg-stone-100 text-stone-600'}`}>
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
              Pinterest API v5
            </span>
            <h4 className="text-sm font-bold text-stone-900 mt-0.5">
              {hasPinterestToken && hasBoardId ? 'Credentials Active' : 'Simulation Mode'}
            </h4>
            <p className="text-xs text-stone-500 mt-1">
              {hasPinterestToken ? 'Direct OAuth Bearer' : 'Safe preview testing'}
            </p>
          </div>
        </div>

        {/* Amazon Affiliate Status */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-xs flex items-start gap-4">
          <div className="p-3 bg-red-50 text-red-600 rounded-xl">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
              Affiliate Tracking
            </span>
            <h4 className="text-sm font-bold text-stone-900 mt-0.5">Tag: {amazonAffiliateTag}</h4>
            <p className="text-xs text-stone-500 mt-1">Appended to all outgoing pin URLs</p>
          </div>
        </div>
      </div>

      {/* Control Banner */}
      <div className="bg-stone-900 text-white rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <h3 className="text-base font-bold">Python main.py Execution Engine</h3>
          </div>
          <p className="text-xs text-stone-400 mt-1">
            Fetches top 5 deals from RSS feed, attaches affiliate tag <code className="text-amber-300 font-mono">bughy29-20</code>, and sends pins to Pinterest v5 Pins API.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={clearLogs}
            className="px-3.5 py-2 text-xs font-medium text-stone-300 hover:text-white bg-stone-800 hover:bg-stone-700 rounded-xl transition-colors"
          >
            Clear Console
          </button>
          <button
            onClick={handleRunWorkflow}
            disabled={isRunning}
            className="px-5 py-2.5 text-xs font-bold bg-red-600 hover:bg-red-500 text-white rounded-xl shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
          >
            <Play className={`w-4 h-4 fill-current ${isRunning ? 'animate-spin' : ''}`} />
            {isRunning ? `Running (${processedCount}/5)...` : 'Execute Workflow Now'}
          </button>
        </div>
      </div>

      {/* Terminal Output */}
      <div className="bg-stone-950 rounded-2xl border border-stone-800 shadow-xl overflow-hidden font-mono text-xs">
        {/* Terminal Header */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-stone-900 border-b border-stone-800">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-red-500/80"></span>
              <span className="w-3 h-3 rounded-full bg-amber-500/80"></span>
              <span className="w-3 h-3 rounded-full bg-emerald-500/80"></span>
            </div>
            <span className="text-stone-400 font-semibold ml-2 flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-stone-500" />
              main.py execution output
            </span>
          </div>
          <span className="text-[11px] text-stone-500">Python 3.10 Runtime</span>
        </div>

        {/* Terminal Content */}
        <div className="p-4 space-y-2 max-h-96 overflow-y-auto">
          {logs.map((log) => (
            <div key={log.id} className="flex items-start gap-3 leading-relaxed">
              <span className="text-stone-600 shrink-0 select-none">{log.time}</span>
              <span
                className={`break-all ${
                  log.type === 'success'
                    ? 'text-emerald-400'
                    : log.type === 'error'
                    ? 'text-red-400 font-bold'
                    : log.type === 'warn'
                    ? 'text-amber-400'
                    : 'text-stone-300'
                }`}
              >
                {log.text}
              </span>
            </div>
          ))}
          {isRunning && (
            <div className="flex items-center gap-2 text-red-400 animate-pulse pt-2">
              <span className="w-2 h-2 rounded-full bg-red-500"></span>
              <span>Processing queue item {processedCount + 1}...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
