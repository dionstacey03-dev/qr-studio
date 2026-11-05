import React from 'react';
import { 
  QrCode, 
  Scan, 
  Palette, 
  History, 
  ArrowRight, 
  Sparkles, 
  Zap, 
  CheckCircle2, 
  ShieldCheck, 
  Layers,
  ArrowUpRight,
  FileSpreadsheet
} from 'lucide-react';
import { useQR } from '../../context/QRContext';
import { DEFAULT_TEMPLATES } from '../../utils/templates';

export const DashboardHome: React.FC = () => {
  const { setActiveTab, totalGeneratedCount, history, applyTemplate, loadHistoryItem } = useQR();

  const featuredTemplates = DEFAULT_TEMPLATES.slice(0, 4);
  const recentHistory = history.slice(0, 3);

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-10">
      {/* Liquid Glass Hero Showcase */}
      <div className="relative rounded-3xl p-6 sm:p-10 glass-surface shadow-2xl overflow-hidden border border-slate-200/60 dark:border-white/10">
        {/* Soft atmospheric ambient light glows */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-500/15 via-indigo-500/15 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-10 w-80 h-80 bg-cyan-400/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass-pill text-xs font-semibold text-blue-600 dark:text-blue-400 mb-4 border border-blue-500/20 shadow-sm">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Apple Liquid Glass Design System</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-[1.15]">
            Engineered for Precision. <br />
            <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 bg-clip-text text-transparent">
              Liquid Glass QR Codes.
            </span>
          </h1>

          <p className="mt-4 text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
            Generate high-resolution scannable barcodes with custom center logos, multi-format payloads, real-time camera scanning, and vector SVG exports.
          </p>

          {/* Quick Access CTA Buttons */}
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <button
              onClick={() => setActiveTab('generator')}
              className="min-h-[48px] px-6 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold tracking-tight shadow-xl shadow-blue-500/30 flex items-center gap-2.5 active:scale-95 transition-all cursor-pointer"
            >
              <QrCode className="w-4 h-4" />
              <span>Launch QR Generator</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => setActiveTab('bulk')}
              className="min-h-[48px] px-5 rounded-2xl glass-surface hover:bg-white dark:hover:bg-slate-800 text-slate-900 dark:text-white text-sm font-semibold flex items-center gap-2 border border-slate-200/80 dark:border-white/10 active:scale-95 transition-all cursor-pointer shadow-sm"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
              <span>Bulk CSV Studio</span>
            </button>

            <button
              onClick={() => setActiveTab('scanner')}
              className="min-h-[48px] px-5 rounded-2xl glass-surface hover:bg-white dark:hover:bg-slate-800 text-slate-900 dark:text-white text-sm font-semibold flex items-center gap-2 border border-slate-200/80 dark:border-white/10 active:scale-95 transition-all cursor-pointer shadow-sm"
            >
              <Scan className="w-4 h-4 text-cyan-500" />
              <span>Open Scanner</span>
            </button>
          </div>
        </div>

        {/* Hero Features Bar */}
        <div className="mt-10 pt-6 border-t border-slate-200/60 dark:border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>100% Scannable Standard</span>
          </div>
          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
            <ShieldCheck className="w-4 h-4 text-blue-500 shrink-0" />
            <span>High Error Correction H</span>
          </div>
          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
            <Zap className="w-4 h-4 text-amber-500 shrink-0" />
            <span>Vector SVG & 4K PNG</span>
          </div>
          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
            <Layers className="w-4 h-4 text-indigo-500 shrink-0" />
            <span>Custom Center Logos</span>
          </div>
        </div>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="glass-surface rounded-3xl p-5 shadow-sm border border-slate-200/60 dark:border-white/10 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Generated</span>
            <p className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1 font-mono tabular-nums">
              {totalGeneratedCount}
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <QrCode className="w-6 h-6" />
          </div>
        </div>

        <div className="glass-surface rounded-3xl p-5 shadow-sm border border-slate-200/60 dark:border-white/10 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Archived in History</span>
            <p className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1 font-mono tabular-nums">
              {history.length}
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <History className="w-6 h-6" />
          </div>
        </div>

        <div className="glass-surface rounded-3xl p-5 shadow-sm border border-slate-200/60 dark:border-white/10 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Design Templates</span>
            <p className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1 font-mono tabular-nums">
              8+ Styles
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
            <Palette className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Featured Templates Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
              Featured Templates
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Apply designer colorways with one tap.
            </p>
          </div>
          <button
            onClick={() => setActiveTab('templates')}
            className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>Browse All (8+)</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {featuredTemplates.map((template) => (
            <div
              key={template.id}
              onClick={() => {
                applyTemplate(template);
                setActiveTab('generator');
              }}
              className="glass-surface rounded-2xl p-4 shadow-sm hover:shadow-xl hover:scale-[1.02] transition-all duration-300 cursor-pointer group"
            >
              <div
                className="w-full aspect-square rounded-xl p-3 flex items-center justify-center mb-3 shadow-inner"
                style={{ backgroundColor: template.bgColor }}
              >
                <div
                  className="w-12 h-12 rounded-lg border-2 flex items-center justify-center"
                  style={{ borderColor: template.fgColor }}
                >
                  <QrCode className="w-7 h-7" style={{ color: template.fgColor }} />
                </div>
              </div>
              <h3 className="font-bold text-xs text-slate-900 dark:text-white truncate">
                {template.name}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                {template.badgeLabel}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Recently Generated QR Codes */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
              Recently Created
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Quick access to your latest generated barcodes.
            </p>
          </div>
          {history.length > 0 && (
            <button
              onClick={() => setActiveTab('history')}
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>View Full History ({history.length})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {recentHistory.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {recentHistory.map((item) => (
              <div
                key={item.id}
                onClick={() => loadHistoryItem(item)}
                className="glass-surface rounded-2xl p-4 shadow-sm hover:shadow-md transition-all cursor-pointer flex items-center justify-between group"
              >
                <div className="truncate mr-3">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                    {item.type}
                  </span>
                  <h3 className="font-bold text-xs text-slate-900 dark:text-white truncate mt-0.5">
                    {item.title}
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    {item.summary}
                  </p>
                </div>
                <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-white/10 flex items-center justify-center text-slate-600 dark:text-slate-300 group-hover:bg-blue-600 group-hover:text-white transition-colors shrink-0">
                  <ArrowUpRight className="w-4 h-4" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="glass-surface rounded-2xl p-8 text-center border border-dashed border-slate-300 dark:border-white/10">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              No QR codes generated yet. Head over to the Generator to make your first one!
            </p>
            <button
              onClick={() => setActiveTab('generator')}
              className="mt-3 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
            >
              Create QR Code Now →
            </button>
          </div>
        )}
      </section>
    </div>
  );
};
