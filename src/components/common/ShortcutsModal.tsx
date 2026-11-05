import React from 'react';
import { Command, X, Keyboard, Sparkles } from 'lucide-react';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ShortcutEntry {
  keys: string[];
  action: string;
  category: string;
}

const SHORTCUTS: ShortcutEntry[] = [
  { keys: ['⌘', 'G'], action: 'Open QR Generator Studio', category: 'Navigation' },
  { keys: ['⌘', 'A'], action: 'Open QR Clicks & Scan Analytics', category: 'Navigation' },
  { keys: ['⌘', 'S'], action: 'Open Live QR Scanner', category: 'Navigation' },
  { keys: ['⌘', 'H'], action: 'Open Generated History', category: 'Navigation' },
  { keys: ['⌘', 'B'], action: 'Open Bulk CSV Generator', category: 'Navigation' },
  { keys: ['⌘', 'T'], action: 'Open Style Templates', category: 'Navigation' },
  { keys: ['⌘', '0'], action: 'Return to Dashboard Home', category: 'Navigation' },
  { keys: ['⌘', ','], action: 'Open Settings & Preferences', category: 'Navigation' },
  { keys: ['⌘', '/'], action: 'Toggle this Shortcuts Guide', category: 'General' },
  { keys: ['?'], action: 'Toggle this Shortcuts Guide', category: 'General' },
  { keys: ['Esc'], action: 'Dismiss Open Modals & Sheets', category: 'General' },
];

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad|iPod/.test(navigator.platform || '');
  const modKey = isMac ? '⌘' : 'Ctrl';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-lg glass-surface rounded-3xl p-6 sm:p-8 shadow-2xl border border-white/20 dark:border-white/10 relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer"
          title="Close (Esc)"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
            <Keyboard className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <span>Keyboard Shortcuts</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                {modKey} Keys
              </span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Speed up your workflow with high-efficiency keystrokes.
            </p>
          </div>
        </div>

        {/* Shortcuts List */}
        <div className="space-y-2.5 max-h-[60vh] overflow-y-auto pr-1">
          {SHORTCUTS.map((sc, i) => {
            const formattedKeys = sc.keys.map(k => k === '⌘' ? modKey : k);
            return (
              <div
                key={i}
                className="flex items-center justify-between p-3 rounded-2xl bg-white/60 dark:bg-slate-900/60 border border-slate-200/60 dark:border-white/5 text-xs"
              >
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  {sc.action}
                </span>

                <div className="flex items-center gap-1.5 shrink-0">
                  {formattedKeys.map((k, kidx) => (
                    <kbd
                      key={kidx}
                      className="min-w-[26px] h-6 px-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-white/10 font-mono text-[11px] font-bold flex items-center justify-center shadow-xs"
                    >
                      {k}
                    </kbd>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer tip */}
        <div className="mt-6 pt-4 border-t border-slate-200/50 dark:border-white/10 flex items-center justify-between text-xs text-slate-400">
          <span>Press <kbd className="font-mono text-[11px] font-bold text-slate-600 dark:text-slate-300">Esc</kbd> or <kbd className="font-mono text-[11px] font-bold text-slate-600 dark:text-slate-300">?</kbd> to dismiss</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors cursor-pointer"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
