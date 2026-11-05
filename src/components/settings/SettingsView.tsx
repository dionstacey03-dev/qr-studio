import React, { useRef, useState } from 'react';
import { 
  Settings, 
  Sun, 
  Moon, 
  Laptop, 
  Trash2, 
  Download, 
  Upload, 
  ShieldCheck, 
  Check, 
  Info, 
  Sparkles,
  Smartphone
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useQR } from '../../context/QRContext';
import { ThemeMode } from '../../types';

export const SettingsView: React.FC = () => {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const { 
    clearHistory, 
    restoreDefaultTemplates, 
    history, 
    totalGeneratedCount 
  } = useQR();

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [backupSuccess, setBackupSuccess] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setBackupSuccess(msg);
    setTimeout(() => setBackupSuccess(null), 3000);
  };

  // Export full backup of history & custom templates
  const handleExportBackup = () => {
    try {
      const data = {
        app: 'QR Studio',
        version: '1.0.0',
        exportedAt: new Date().toISOString(),
        history: localStorage.getItem('qr_studio_history') || '[]',
        customTemplates: localStorage.getItem('qr_studio_custom_templates') || '[]',
        totalCount: localStorage.getItem('qr_studio_total_count') || '0',
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = `qrstudio-backup-${Date.now()}.json`;
      link.href = url;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showNotification('Backup file successfully exported');
    } catch (e) {
      console.error(e);
      showNotification('Failed to generate backup');
    }
  };

  // Import backup JSON
  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result as string);
        if (parsed.app === 'QR Studio' || Array.isArray(parsed) || parsed.history) {
          if (parsed.history) {
            const histVal = typeof parsed.history === 'string' ? parsed.history : JSON.stringify(parsed.history);
            localStorage.setItem('qr_studio_history', histVal);
          } else if (Array.isArray(parsed)) {
            localStorage.setItem('qr_studio_history', JSON.stringify(parsed));
          }
          if (parsed.customTemplates) {
            const tplVal = typeof parsed.customTemplates === 'string' ? parsed.customTemplates : JSON.stringify(parsed.customTemplates);
            localStorage.setItem('qr_studio_custom_templates', tplVal);
          }
          if (parsed.totalCount) {
            localStorage.setItem('qr_studio_total_count', parsed.totalCount.toString());
          }
          showNotification('Backup successfully restored! Reloading...');
          setTimeout(() => window.location.reload(), 1000);
        } else {
          showNotification('Invalid backup file format');
        }
      } catch (err) {
        showNotification('Failed to parse backup JSON');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Studio Settings
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Customize themes, view storage parameters, and manage local backups.
        </p>
      </div>

      {backupSuccess && (
        <div className="p-3.5 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-semibold flex items-center gap-2">
          <Check className="w-4 h-4" />
          <span>{backupSuccess}</span>
        </div>
      )}

      {/* Theme Section */}
      <div className="glass-surface rounded-3xl p-6 shadow-sm border border-slate-200/60 dark:border-white/10 space-y-4">
        <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-blue-500" />
          Appearance & Liquid Glass Theme
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Select your preferred display theme. Liquid Glass reflections and frosted panels are calibrated for high contrast in both themes.
        </p>

        <div className="grid grid-cols-3 gap-3">
          {[
            { id: 'light', label: 'Light', icon: Sun, desc: 'Crisp porcelain glass' },
            { id: 'dark', label: 'Dark', icon: Moon, desc: 'Deep obsidian glass' },
            { id: 'system', label: 'System', icon: Laptop, desc: 'Follow device settings' },
          ].map((item) => {
            const Icon = item.icon;
            const isSelected = theme === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setTheme(item.id as ThemeMode)}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20'
                    : 'bg-white/60 dark:bg-slate-900/60 border-slate-200/70 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:border-blue-400'
                }`}
              >
                <Icon className={`w-5 h-5 mb-2 ${isSelected ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`} />
                <div className="text-xs font-bold">{item.label}</div>
                <div className="text-[10px] opacity-80 mt-0.5">{item.desc}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* iPhone & Mobile Optimization Notice */}
      <div className="glass-surface rounded-3xl p-6 shadow-sm border border-slate-200/60 dark:border-white/10 space-y-3">
        <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Smartphone className="w-4 h-4 text-indigo-500" />
          Mobile Ergonomics & Apple iOS
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          QR Studio is built with modern Apple Human Interface Guidelines: safe-area padding for notch/Dynamic Island devices, responsive touch targets (44px or larger), hardware-accelerated backdrop blur, and camera scanner support on iOS Safari and modern mobile browsers.
        </p>
      </div>

      {/* Data Management & Storage */}
      <div className="glass-surface rounded-3xl p-6 shadow-sm border border-slate-200/60 dark:border-white/10 space-y-4">
        <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          Data & Local Storage
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          All your QR payload configurations, custom templates, and generation logs remain strictly private on this device using Browser Local Storage.
        </p>

        <div className="pt-2 flex flex-wrap items-center gap-3">
          <button
            onClick={handleExportBackup}
            className="min-h-[44px] px-4 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4 text-blue-500" />
            <span>Export Backup (JSON)</span>
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="min-h-[44px] px-4 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Upload className="w-4 h-4 text-indigo-500" />
            <span>Restore Backup</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImportBackup}
            className="hidden"
          />

          <button
            onClick={() => {
              if (window.confirm('Erase all saved history?')) {
                clearHistory();
                showNotification('History cleared');
              }
            }}
            className="min-h-[44px] px-4 rounded-xl text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer ml-auto"
          >
            <Trash2 className="w-4 h-4" />
            <span>Clear History</span>
          </button>
        </div>
      </div>
    </div>
  );
};
