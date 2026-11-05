import { useEffect } from 'react';
import { ActiveTab } from '../types';

interface KeyboardShortcutsOptions {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  toggleShortcutsModal: () => void;
  closeAllModals: () => void;
  showToast?: (message: string) => void;
}

export function useKeyboardShortcuts({
  setActiveTab,
  toggleShortcutsModal,
  closeAllModals,
  showToast,
}: KeyboardShortcutsOptions) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isInput =
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target as HTMLElement)?.isContentEditable;

      // Handle Escape anytime to dismiss modals
      if (e.key === 'Escape') {
        closeAllModals();
        return;
      }

      // Handle '?' to toggle shortcuts cheat sheet when not typing inside an input
      if (e.key === '?' && !isInput && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        toggleShortcutsModal();
        return;
      }

      // Check modifier keys (Cmd on Mac, Ctrl on Windows/Linux)
      const hasModifier = e.metaKey || e.ctrlKey;
      if (!hasModifier) return;

      const key = e.key.toLowerCase();

      switch (key) {
        // Cmd/Ctrl + G: Generator
        case 'g': {
          e.preventDefault();
          setActiveTab('generator');
          showToast?.('Switched to Generator (⌘G)');
          break;
        }

        // Cmd/Ctrl + A: QR Clicks Analytics
        case 'a': {
          e.preventDefault();
          setActiveTab('analytics');
          showToast?.('Switched to QR Clicks (⌘A)');
          break;
        }

        // Cmd/Ctrl + S: Scanner
        case 's': {
          e.preventDefault();
          setActiveTab('scanner');
          showToast?.('Switched to Scanner (⌘S)');
          break;
        }

        // Cmd/Ctrl + H: History
        case 'h': {
          e.preventDefault();
          setActiveTab('history');
          showToast?.('Switched to History (⌘H)');
          break;
        }

        // Cmd/Ctrl + B: Bulk CSV
        case 'b': {
          e.preventDefault();
          setActiveTab('bulk');
          showToast?.('Switched to Bulk CSV (⌘B)');
          break;
        }

        // Cmd/Ctrl + T: Templates
        case 't': {
          e.preventDefault();
          setActiveTab('templates');
          showToast?.('Switched to Templates (⌘T)');
          break;
        }

        // Cmd/Ctrl + 0: Home
        case '0': {
          e.preventDefault();
          setActiveTab('home');
          showToast?.('Switched to Home (⌘0)');
          break;
        }

        // Cmd/Ctrl + ,: Settings
        case ',': {
          e.preventDefault();
          setActiveTab('settings');
          showToast?.('Switched to Settings (⌘,)');
          break;
        }

        // Cmd/Ctrl + /: Shortcuts Help
        case '/': {
          e.preventDefault();
          toggleShortcutsModal();
          break;
        }

        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setActiveTab, toggleShortcutsModal, closeAllModals, showToast]);
}
