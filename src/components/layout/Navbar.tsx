import React from 'react';
import { 
  QrCode, 
  Scan, 
  Palette, 
  History, 
  Settings, 
  Home, 
  Sun, 
  Moon, 
  Sparkles,
  Layers,
  FileSpreadsheet,
  Keyboard,
  BarChart3
} from 'lucide-react';
import { useQR } from '../../context/QRContext';
import { useTheme } from '../../context/ThemeContext';
import { ActiveTab } from '../../types';

interface NavItem {
  id: ActiveTab;
  label: string;
  icon: React.ElementType;
  shortcut: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'home', label: 'Home', icon: Home, shortcut: '⌘0' },
  { id: 'generator', label: 'Generator', icon: QrCode, shortcut: '⌘G' },
  { id: 'analytics', label: 'QR Clicks', icon: BarChart3, shortcut: '⌘A' },
  { id: 'scanner', label: 'Scanner', icon: Scan, shortcut: '⌘S' },
  { id: 'bulk', label: 'Bulk CSV', icon: FileSpreadsheet, shortcut: '⌘B' },
  { id: 'templates', label: 'Templates', icon: Palette, shortcut: '⌘T' },
  { id: 'history', label: 'History', icon: History, shortcut: '⌘H' },
  { id: 'settings', label: 'Settings', icon: Settings, shortcut: '⌘,' },
];

export const DesktopSidebar: React.FC<{ onOpenShortcuts?: () => void }> = ({ onOpenShortcuts }) => {
  const { activeTab, setActiveTab, history, totalGeneratedCount } = useQR();
  const { theme, resolvedTheme, toggleTheme } = useTheme();

  return (
    <aside className="hidden lg:flex flex-col w-72 h-screen sticky top-0 border-r border-slate-200/60 dark:border-white/10 glass-surface p-6 z-30">
      {/* Brand Header */}
      <div className="flex items-center gap-3 pb-6 border-b border-slate-200/60 dark:border-white/10">
        <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 p-[1px] shadow-lg shadow-blue-500/20 flex items-center justify-center">
          <div className="w-full h-full rounded-[15px] bg-white/95 dark:bg-slate-950/95 flex items-center justify-center backdrop-blur-sm">
            <QrCode className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-lg tracking-tight text-slate-900 dark:text-white">QR Studio</span>
            <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
              PRO
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Liquid Glass Engine</p>
        </div>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 py-6 space-y-1.5 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl text-sm font-semibold transition-all duration-200 group relative ${
                isActive
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25 dark:shadow-blue-500/20'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/60 dark:hover:bg-white/[0.06]'
              }`}
            >
              <Icon className={`w-5 h-5 transition-transform group-hover:scale-110 ${isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`} />
              <span>{item.label}</span>

              <div className="ml-auto flex items-center gap-1.5">
                {item.id === 'history' && history.length > 0 && (
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-mono tabular-nums ${
                      isActive ? 'bg-white/20 text-white' : 'bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {history.length}
                  </span>
                )}
                <kbd
                  className={`text-[10px] font-mono px-1.5 py-0.5 rounded-md transition-all ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-black/5 dark:bg-white/10 text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200'
                  }`}
                >
                  {item.shortcut}
                </kbd>
              </div>
            </button>
          );
        })}
      </nav>

      {/* Stats pill & Theme Switcher & Shortcuts Button */}
      <div className="pt-4 border-t border-slate-200/60 dark:border-white/10 space-y-2.5">
        <div className="p-3 rounded-2xl bg-slate-50/80 dark:bg-white/[0.04] border border-slate-200/50 dark:border-white/[0.06]">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
            <span className="flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-blue-500" />
              Generated QRs
            </span>
            <span className="font-mono tabular-nums font-bold text-slate-900 dark:text-white">{totalGeneratedCount}</span>
          </div>
          <div className="w-full bg-slate-200/60 dark:bg-white/10 h-1.5 rounded-full overflow-hidden">
            <div 
              className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(15, totalGeneratedCount * 10))}%` }}
            />
          </div>
        </div>

        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className="w-full flex items-center justify-between px-3.5 py-2 rounded-2xl text-xs font-semibold text-slate-600 dark:text-slate-300 bg-white/70 dark:bg-slate-800/60 border border-slate-200/60 dark:border-white/10 hover:border-blue-400/50 transition-all cursor-pointer shadow-sm"
        >
          <span className="flex items-center gap-2">
            {resolvedTheme === 'dark' ? (
              <Moon className="w-4 h-4 text-indigo-400" />
            ) : (
              <Sun className="w-4 h-4 text-amber-500" />
            )}
            <span>{resolvedTheme === 'dark' ? 'Dark Mode' : 'Light Mode'}</span>
          </span>
          <span className="text-[10px] text-slate-400 capitalize">{theme}</span>
        </button>

        {/* Shortcuts Cheat Sheet Trigger */}
        <button
          onClick={onOpenShortcuts}
          className="w-full flex items-center justify-between px-3.5 py-1.5 rounded-xl text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/60 dark:hover:bg-white/5 transition-colors cursor-pointer"
        >
          <span className="flex items-center gap-2">
            <Keyboard className="w-3.5 h-3.5 text-blue-500" />
            <span>Hotkeys</span>
          </span>
          <kbd className="font-mono text-[10px] bg-slate-200/70 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-300">
            ?
          </kbd>
        </button>
      </div>
    </aside>
  );
};

export const MobileTopBar: React.FC = () => {
  const { activeTab, setActiveTab } = useQR();
  const { resolvedTheme, toggleTheme } = useTheme();

  const getTitle = () => {
    switch (activeTab) {
      case 'home': return 'QR Studio';
      case 'generator': return 'Studio Generator';
      case 'analytics': return 'QR Clicks Analytics';
      case 'bulk': return 'Bulk Generator';
      case 'scanner': return 'QR Scanner';
      case 'templates': return 'Style Templates';
      case 'history': return 'QR History';
      case 'settings': return 'Settings';
    }
  };

  return (
    <header className="lg:hidden sticky top-0 z-40 w-full glass-surface border-b border-slate-200/60 dark:border-white/10 px-4 py-3 flex items-center justify-between">
      <div 
        onClick={() => setActiveTab('home')}
        className="flex items-center gap-2.5 cursor-pointer"
      >
        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 p-[1px] shadow-sm flex items-center justify-center">
          <div className="w-full h-full rounded-[11px] bg-white dark:bg-slate-900 flex items-center justify-center">
            <QrCode className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
        </div>
        <span className="font-bold text-base tracking-tight text-slate-900 dark:text-white">
          {getTitle()}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={toggleTheme}
          aria-label="Toggle theme"
          className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
        >
          {resolvedTheme === 'dark' ? (
            <Moon className="w-5 h-5 text-indigo-400" />
          ) : (
            <Sun className="w-5 h-5 text-amber-500" />
          )}
        </button>
      </div>
    </header>
  );
};

export const MobileFloatingNav: React.FC = () => {
  const { activeTab, setActiveTab } = useQR();

  return (
    <nav className="lg:hidden fixed bottom-3 left-2 right-2 z-50 glass-floating-nav rounded-2xl p-1 max-w-lg mx-auto shadow-2xl">
      <div className="grid grid-cols-7 items-center gap-0.5">
        {NAV_ITEMS.filter(item => item.id !== 'settings').map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`min-h-[44px] flex flex-col items-center justify-center rounded-xl transition-all duration-200 relative px-0.5 ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-white scale-105' : 'text-slate-600 dark:text-slate-400'} transition-transform`} />
              <span className="text-[9px] mt-0.5 tracking-tight font-medium truncate max-w-full">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
