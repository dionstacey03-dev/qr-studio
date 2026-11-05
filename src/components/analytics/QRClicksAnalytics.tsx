import React, { useState, useMemo } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Smartphone, 
  Globe2, 
  ExternalLink, 
  Copy, 
  Check, 
  Trash2, 
  Plus, 
  Sparkles, 
  MousePointerClick,
  Compass,
  Laptop,
  Play,
  RotateCcw,
  ArrowUpRight,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { useQR } from '../../context/QRContext';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie,
} from 'recharts';

export const QRClicksAnalytics: React.FC = () => {
  const { 
    trackedLinks, 
    clickEvents, 
    createTrackedLink, 
    recordClick, 
    deleteTrackedLink, 
    clearTrackingData,
    setActiveTab,
    updateConfig 
  } = useQR();

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedTimeframe, setSelectedTimeframe] = useState<'7d' | '30d' | 'all'>('7d');
  const [newUrlInput, setNewUrlInput] = useState('');
  const [newTitleInput, setNewTitleInput] = useState('');
  const [isCreatingLink, setIsCreatingLink] = useState(false);
  const [simulatingId, setSimulatingId] = useState<string | null>(null);

  // Calculate totals
  const totalScans = useMemo(() => {
    return trackedLinks.reduce((acc, l) => acc + l.totalClicks, 0);
  }, [trackedLinks]);

  const topLink = useMemo(() => {
    if (trackedLinks.length === 0) return null;
    return [...trackedLinks].sort((a, b) => b.totalClicks - a.totalClicks)[0];
  }, [trackedLinks]);

  const todayScans = useMemo(() => {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const startMs = startOfToday.getTime();
    return clickEvents.filter(e => e.timestamp >= startMs).length;
  }, [clickEvents]);

  // Scans timeline data for AreaChart (past 7 days)
  const timelineData = useMemo(() => {
    const days = 7;
    const now = new Date();
    const result: { date: string; scans: number; dayLabel: string }[] = [];

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0).getTime();
      const dayEnd = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59).getTime();

      const count = clickEvents.filter(e => e.timestamp >= dayStart && e.timestamp <= dayEnd).length;
      const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short' });
      const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      result.push({
        date: dateStr,
        dayLabel,
        scans: count,
      });
    }

    return result;
  }, [clickEvents]);

  // Device Breakdown data for Bar/Pie Chart
  const deviceData = useMemo(() => {
    const counts: Record<string, number> = {};
    clickEvents.forEach(e => {
      const key = e.device || 'Other';
      counts[key] = (counts[key] || 0) + 1;
    });

    const entries = Object.entries(counts).map(([name, count]) => ({
      name,
      value: count,
    }));

    return entries.length > 0
      ? entries
      : [
          { name: 'iPhone (iOS)', value: 1 },
          { name: 'Android', value: 1 },
          { name: 'Mac (Safari)', value: 1 },
        ];
  }, [clickEvents]);

  // Browser Breakdown
  const browserData = useMemo(() => {
    const counts: Record<string, number> = {};
    clickEvents.forEach(e => {
      const key = e.browser || 'Other';
      counts[key] = (counts[key] || 0) + 1;
    });

    return Object.entries(counts)
      .map(([name, count]) => ({ name, value: count }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 4);
  }, [clickEvents]);

  const DEVICE_COLORS = ['#3b82f6', '#6366f1', '#06b6d4', '#8b5cf6', '#ec4899'];

  const getProxyUrl = (linkId: string) => {
    if (typeof window !== 'undefined') {
      return `${window.location.origin}${window.location.pathname}?qr_proxy=${linkId}`;
    }
    return `https://qrstudio.app?qr_proxy=${linkId}`;
  };

  const handleCopyLink = async (linkId: string) => {
    const url = getProxyUrl(linkId);
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(linkId);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // fallback
    }
  };

  const handleSimulateScan = (linkId: string) => {
    setSimulatingId(linkId);
    recordClick(linkId);
    setTimeout(() => setSimulatingId(null), 600);
  };

  const handleCreateAndOpenGenerator = (linkId: string) => {
    const link = trackedLinks.find(l => l.id === linkId);
    if (!link) return;
    updateConfig({
      type: 'url',
      url: link.targetUrl,
      trackingEnabled: true,
      trackingId: link.id,
    });
    setActiveTab('generator');
  };

  const handleQuickAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUrlInput.trim()) return;
    const newLink = createTrackedLink(newUrlInput.trim(), newTitleInput.trim());
    setNewUrlInput('');
    setNewTitleInput('');
    setIsCreatingLink(false);

    // Optionally load straight into generator
    updateConfig({
      type: 'url',
      url: newLink.targetUrl,
      trackingEnabled: true,
      trackingId: newLink.id,
    });
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              QR Clicks & Scan Analytics
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold border border-blue-500/20">
              Live Proxy
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time scan counter and telemetry for trackable QR codes, visualized with Apple Liquid Glass.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsCreatingLink(prev => !prev)}
            className="min-h-[44px] px-4 py-2 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-blue-500/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Tracked QR</span>
          </button>
        </div>
      </div>

      {/* Creation Drawer / Form */}
      {isCreatingLink && (
        <form 
          onSubmit={handleQuickAdd}
          className="glass-surface p-6 rounded-3xl border border-blue-500/30 shadow-xl space-y-4 animate-scale-in"
        >
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" />
              <span>Create Trackable QR Target</span>
            </h3>
            <button
              type="button"
              onClick={() => setIsCreatingLink(false)}
              className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Target Destination URL *
              </label>
              <input
                type="url"
                required
                value={newUrlInput}
                onChange={e => setNewUrlInput(e.target.value)}
                placeholder="https://example.com/product-launch"
                className="w-full min-h-[44px] px-3.5 rounded-xl text-sm bg-white/70 dark:bg-slate-950/60 border border-slate-200/80 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Campaign Label / Title (Optional)
              </label>
              <input
                type="text"
                value={newTitleInput}
                onChange={e => setNewTitleInput(e.target.value)}
                placeholder="Summer Menu Promo"
                className="w-full min-h-[44px] px-3.5 rounded-xl text-sm bg-white/70 dark:bg-slate-950/60 border border-slate-200/80 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="submit"
              className="min-h-[40px] px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md transition-all cursor-pointer"
            >
              Create Tracked Link
            </button>
          </div>
        </form>
      )}

      {/* KPI Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Scans */}
        <div className="glass-surface p-5 rounded-3xl relative overflow-hidden group">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
            <span>Total Scans Logged</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <MousePointerClick className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight tabular-nums">
            {totalScans}
          </div>
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1.5 flex items-center gap-1 font-semibold">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Active proxy routing</span>
          </p>
        </div>

        {/* Active QR Links */}
        <div className="glass-surface p-5 rounded-3xl relative overflow-hidden group">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
            <span>Tracked Campaigns</span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <Globe2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight tabular-nums">
            {trackedLinks.length}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5">
            Active smart redirect nodes
          </p>
        </div>

        {/* Today's Scans */}
        <div className="glass-surface p-5 rounded-3xl relative overflow-hidden group">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
            <span>Scans Today</span>
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight tabular-nums">
            {todayScans}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5">
            Past 24 hours activity
          </p>
        </div>

        {/* Top Link */}
        <div className="glass-surface p-5 rounded-3xl relative overflow-hidden group">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
            <span>Top Performing QR</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg font-bold text-slate-900 dark:text-white tracking-tight truncate">
            {topLink ? topLink.title : 'None yet'}
          </div>
          <p className="text-[11px] text-blue-600 dark:text-blue-400 mt-1 font-semibold tabular-nums">
            {topLink ? `${topLink.totalClicks} scans total` : 'Create your first QR'}
          </p>
        </div>
      </div>

      {/* Main Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Scans Timeline AreaChart */}
        <div className="lg:col-span-8 glass-surface p-6 rounded-3xl shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-blue-500" />
                <span>Scan Velocity & Timeline</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Aggregate scan events recorded across all proxy endpoints over the past 7 days.
              </p>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-100/80 dark:bg-slate-900/80 p-1 rounded-xl border border-slate-200/50 dark:border-white/5 self-start">
              <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 shadow-xs">
                7 Days
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="scanGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="dayLabel" 
                  stroke="#94a3b8" 
                  fontSize={11} 
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  stroke="#94a3b8" 
                  fontSize={11} 
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const dataPoint = payload[0].payload;
                      return (
                        <div className="glass-floating-nav px-3.5 py-2 rounded-xl shadow-xl border border-white/20 dark:border-white/10 text-xs">
                          <p className="font-semibold text-slate-900 dark:text-white">{dataPoint.date} ({label})</p>
                          <p className="text-blue-600 dark:text-blue-400 font-bold mt-0.5">
                            {payload[0].value} scans recorded
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="scans" 
                  stroke="#3b82f6" 
                  strokeWidth={3} 
                  fillOpacity={1} 
                  fill="url(#scanGradient)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Device & Platform Breakdown */}
        <div className="lg:col-span-4 glass-surface p-6 rounded-3xl shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-1">
              <Smartphone className="w-4 h-4 text-indigo-500" />
              <span>Device Scanner Share</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Scanners identified by user agent during redirection.
            </p>

            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={deviceData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={65}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {deviceData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={DEVICE_COLORS[index % DEVICE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="glass-floating-nav px-3 py-1.5 rounded-xl shadow-xl border border-white/20 dark:border-white/10 text-xs">
                            <span className="font-semibold text-slate-900 dark:text-white">{payload[0].name}: </span>
                            <span className="font-bold text-blue-500">{payload[0].value}</span>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Legend */}
          <div className="space-y-1.5 pt-3 border-t border-slate-200/50 dark:border-white/10">
            {deviceData.slice(0, 4).map((d, i) => (
              <div key={d.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span 
                    className="w-2.5 h-2.5 rounded-full shrink-0" 
                    style={{ backgroundColor: DEVICE_COLORS[i % DEVICE_COLORS.length] }} 
                  />
                  <span className="text-slate-600 dark:text-slate-300 truncate max-w-[150px]">{d.name}</span>
                </div>
                <span className="font-mono font-bold text-slate-900 dark:text-white">{d.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tracked QR Codes List Table */}
      <div className="glass-surface p-6 rounded-3xl shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>Tracked QR Campaigns</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Each campaign has a proxy URL embedded inside the QR code. Clicking 'Simulate Scan' will instantly register an event and test the pipeline.
            </p>
          </div>

          {trackedLinks.length > 0 && (
            <button
              onClick={() => {
                if (window.confirm('Reset all tracked campaigns and click history?')) {
                  clearTrackingData();
                }
              }}
              className="text-xs text-rose-500 hover:text-rose-600 flex items-center gap-1 font-medium self-start cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Data</span>
            </button>
          )}
        </div>

        {trackedLinks.length === 0 ? (
          <div className="py-12 text-center">
            <Globe2 className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              No tracked QR codes yet
            </p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Create a tracked URL campaign above or toggle 'Track QR Clicks' in the Generator.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-200/60 dark:divide-white/10 overflow-x-auto">
            {trackedLinks.map((link) => {
              const proxyUrl = getProxyUrl(link.id);
              const isSimulating = simulatingId === link.id;

              return (
                <div
                  key={link.id}
                  className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 group"
                >
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                        {link.title}
                      </h4>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                        ID: {link.id}
                      </span>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <div className="flex items-center gap-1 truncate max-w-md">
                        <span className="font-medium text-slate-700 dark:text-slate-300">Target:</span>
                        <a 
                          href={link.targetUrl} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="text-blue-600 dark:text-blue-400 hover:underline truncate"
                        >
                          {link.targetUrl}
                        </a>
                      </div>

                      <span className="hidden sm:inline text-slate-300 dark:text-slate-600">•</span>

                      <div className="flex items-center gap-1 font-mono text-[11px] truncate max-w-xs">
                        <span className="text-slate-400">Proxy:</span>
                        <span className="truncate">{proxyUrl}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions & Metrics */}
                  <div className="flex items-center gap-2.5 shrink-0">
                    {/* Total Click Badge */}
                    <div className="px-3.5 py-1.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 text-center border border-blue-500/20">
                      <div className="text-sm font-extrabold font-mono tabular-nums">
                        {link.totalClicks}
                      </div>
                      <div className="text-[9px] uppercase tracking-wider font-semibold opacity-75">
                        Scans
                      </div>
                    </div>

                    {/* Simulate Scan Button */}
                    <button
                      onClick={() => handleSimulateScan(link.id)}
                      disabled={isSimulating}
                      className={`min-h-[40px] px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                        isSimulating
                          ? 'bg-emerald-500 text-white scale-105'
                          : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                      }`}
                      title="Test scan event (+1 scan count live)"
                    >
                      <Play className="w-3.5 h-3.5" />
                      <span>{isSimulating ? '+1 Added!' : 'Test Scan'}</span>
                    </button>

                    {/* Copy Proxy Link */}
                    <button
                      onClick={() => handleCopyLink(link.id)}
                      className="min-h-[40px] px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/15 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                      title="Copy Proxy Redirect URL"
                    >
                      {copiedId === link.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                          <span className="text-emerald-500">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>

                    {/* Generate / Edit QR */}
                    <button
                      onClick={() => handleCreateAndOpenGenerator(link.id)}
                      className="min-h-[40px] px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                      title="Open in QR Generator"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Make QR</span>
                    </button>

                    {/* Delete Link */}
                    <button
                      onClick={() => deleteTrackedLink(link.id)}
                      className="min-h-[40px] w-9 flex items-center justify-center rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                      title="Delete Campaign"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
