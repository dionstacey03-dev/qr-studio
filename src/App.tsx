/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { QRProvider, useQR } from './context/QRContext';
import { DesktopSidebar, MobileTopBar, MobileFloatingNav } from './components/layout/Navbar';
import { DashboardHome } from './components/dashboard/DashboardHome';
import { QRGenerator } from './components/generator/QRGenerator';
import { BulkQRGenerator } from './components/bulk/BulkQRGenerator';
import { QRScanner } from './components/scanner/QRScanner';
import { TemplateLibrary } from './components/templates/TemplateLibrary';
import { QRHistory } from './components/history/QRHistory';
import { SettingsView } from './components/settings/SettingsView';
import { QRClicksAnalytics } from './components/analytics/QRClicksAnalytics';
import { ShortcutsModal } from './components/common/ShortcutsModal';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { Command, ExternalLink, Loader2 } from 'lucide-react';

const ProxyRedirectHandler: React.FC = () => {
  const { trackedLinks, recordClick } = useQR();
  const [redirectInfo, setRedirectInfo] = useState<{
    targetUrl: string;
    title: string;
    linkId: string;
  } | null>(null);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const urlParams = new URLSearchParams(window.location.search);
    const proxyId = urlParams.get('qr_proxy');

    if (proxyId) {
      // Find matching tracked link or fallback
      const found = trackedLinks.find((l) => l.id === proxyId);
      const targetUrl = found ? found.targetUrl : 'https://apple.com';
      const title = found ? found.title : 'QR Destination';

      // Record click telemetry
      recordClick(proxyId);

      setRedirectInfo({ targetUrl, title, linkId: proxyId });

      // Clean browser history URL and redirect after 1.5s splash
      const timer = setTimeout(() => {
        window.location.replace(targetUrl);
      }, 1400);

      return () => clearTimeout(timer);
    }
  }, [trackedLinks, recordClick]);

  if (!redirectInfo) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xl animate-fade-in text-center">
      <div className="glass-surface p-8 rounded-3xl max-w-md w-full border border-blue-500/30 shadow-2xl space-y-5 animate-scale-in">
        <div className="w-16 h-16 rounded-3xl bg-blue-600/20 text-blue-500 mx-auto flex items-center justify-center shadow-lg shadow-blue-500/10">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
        <div>
          <span className="text-[10px] font-mono uppercase tracking-widest px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
            QR Studio Proxy Gateway
          </span>
          <h2 className="text-xl font-bold text-white mt-3">
            Redirecting to {redirectInfo.title}
          </h2>
          <p className="text-xs text-slate-400 mt-1 font-mono truncate max-w-xs mx-auto">
            {redirectInfo.targetUrl}
          </p>
        </div>
        <div className="pt-2">
          <a
            href={redirectInfo.targetUrl}
            className="inline-flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 font-semibold underline"
          >
            <span>Tap here if not redirected automatically</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
};

const MainContent: React.FC = () => {
  const { activeTab } = useQR();

  return (
    <main className="flex-1 w-full pb-28 lg:pb-12 pt-2 sm:pt-4 overflow-y-auto">
      {activeTab === 'home' && <DashboardHome />}
      {activeTab === 'generator' && <QRGenerator />}
      {activeTab === 'analytics' && <QRClicksAnalytics />}
      {activeTab === 'bulk' && <BulkQRGenerator />}
      {activeTab === 'scanner' && <QRScanner />}
      {activeTab === 'templates' && <TemplateLibrary />}
      {activeTab === 'history' && <QRHistory />}
      {activeTab === 'settings' && <SettingsView />}
    </main>
  );
};

const AppShell: React.FC = () => {
  const { activeTab, setActiveTab } = useQR();
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  useKeyboardShortcuts({
    activeTab,
    setActiveTab,
    toggleShortcutsModal: () => setShowShortcutsModal((prev) => !prev),
    closeAllModals: () => setShowShortcutsModal(false),
    showToast,
  });

  return (
    <div className="min-h-screen w-full bg-slate-50 dark:bg-[#070b12] text-slate-900 dark:text-slate-100 flex flex-col lg:flex-row relative liquid-mesh-bg selection:bg-blue-500/20 selection:text-blue-600 dark:selection:text-blue-300">
      {/* Desktop Navigation Sidebar with shortcuts trigger */}
      <DesktopSidebar onOpenShortcuts={() => setShowShortcutsModal(true)} />

      {/* Main Body Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        {/* Mobile Top App Bar */}
        <MobileTopBar />

        {/* Dynamic View Content */}
        <MainContent />
      </div>

      {/* Mobile Bottom Floating Liquid Glass Bar */}
      <MobileFloatingNav />

      {/* Keyboard Shortcuts Guide Modal */}
      <ShortcutsModal
        isOpen={showShortcutsModal}
        onClose={() => setShowShortcutsModal(false)}
      />

      {/* Live Proxy Redirect Handler if ?qr_proxy= present */}
      <ProxyRedirectHandler />

      {/* Floating Shortcut Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 glass-floating-nav px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-semibold text-slate-900 dark:text-white border border-slate-200/80 dark:border-white/20 animate-fade-in pointer-events-none">
          <Command className="w-3.5 h-3.5 text-blue-500" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <QRProvider>
        <AppShell />
      </QRProvider>
    </ThemeProvider>
  );
}
