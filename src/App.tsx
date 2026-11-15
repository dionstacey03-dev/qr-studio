/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { lazy, Suspense, useState } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { QRProvider, useQR } from './context/QRContext';
import { DesktopSidebar, MobileTopBar, MobileFloatingNav } from './components/layout/Navbar';
const DashboardHome = lazy(() => import('./components/dashboard/DashboardHome').then((m) => ({ default: m.DashboardHome })));
const QRGenerator = lazy(() => import('./components/generator/QRGenerator').then((m) => ({ default: m.QRGenerator })));
const BulkQRGenerator = lazy(() => import('./components/bulk/BulkQRGenerator').then((m) => ({ default: m.BulkQRGenerator })));
const QRScanner = lazy(() => import('./components/scanner/QRScanner').then((m) => ({ default: m.QRScanner })));
const TemplateLibrary = lazy(() => import('./components/templates/TemplateLibrary').then((m) => ({ default: m.TemplateLibrary })));
const QRHistory = lazy(() => import('./components/history/QRHistory').then((m) => ({ default: m.QRHistory })));
const SettingsView = lazy(() => import('./components/settings/SettingsView').then((m) => ({ default: m.SettingsView })));
const QRClicksAnalytics = lazy(() => import('./components/analytics/QRClicksAnalytics').then((m) => ({ default: m.QRClicksAnalytics })));
const ShortcutsModal = lazy(() => import('./components/common/ShortcutsModal').then((m) => ({ default: m.ShortcutsModal })));
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
      // A dynamic link must exist in the current redirect store.
      // Never send unknown IDs to an unrelated fallback destination.
      const found = trackedLinks.find((link) => link.id === proxyId);
      if (!found) {
        setRedirectInfo({ targetUrl: '', title: 'Link unavailable', linkId: proxyId });
        return;
      }

      let destination: URL;
      try {
        destination = new URL(found.targetUrl);
      } catch {
        setRedirectInfo({ targetUrl: '', title: 'Invalid destination', linkId: proxyId });
        return;
      }

      // Only web destinations are eligible for automatic redirects.
      if (destination.protocol !== 'https:' && destination.protocol !== 'http:') {
        setRedirectInfo({ targetUrl: '', title: 'Unsupported destination', linkId: proxyId });
        return;
      }

      recordClick(proxyId);
      setRedirectInfo({ targetUrl: destination.href, title: found.title, linkId: proxyId });

      const timer = window.setTimeout(() => {
        window.location.replace(destination.href);
      }, 1400);

      return () => window.clearTimeout(timer);
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
            {redirectInfo.targetUrl ? `Redirecting to ${redirectInfo.title}` : redirectInfo.title}
          </h2>
          {redirectInfo.targetUrl ? (
            <p className="text-xs text-slate-400 mt-1 font-mono truncate max-w-xs mx-auto">
              {redirectInfo.targetUrl}
            </p>
          ) : (
            <p className="text-xs text-slate-400 mt-1">
              This QR link could not be resolved. Ask the creator for a current link.
            </p>
          )}
        </div>
        <div className="pt-2">
          {redirectInfo.targetUrl && (
            <a
              href={redirectInfo.targetUrl}
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 font-semibold underline"
            >
              <span>Tap here if not redirected automatically</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

const MainContent: React.FC = () => {
  const { activeTab } = useQR();

  return (
    <main className="flex-1 w-full pb-28 lg:pb-12 pt-2 sm:pt-4 overflow-y-auto">
      <Suspense
        fallback={
          <div className="w-full min-h-[40vh] flex items-center justify-center text-sm text-slate-500 dark:text-slate-400">
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
            Loading workspace…
          </div>
        }
      >
        {activeTab === 'home' && <DashboardHome />}
        {activeTab === 'generator' && <QRGenerator />}
        {activeTab === 'analytics' && <QRClicksAnalytics />}
        {activeTab === 'bulk' && <BulkQRGenerator />}
        {activeTab === 'scanner' && <QRScanner />}
        {activeTab === 'templates' && <TemplateLibrary />}
        {activeTab === 'history' && <QRHistory />}
        {activeTab === 'settings' && <SettingsView />}
      </Suspense>
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
      <Suspense fallback={null}>
        <ShortcutsModal
          isOpen={showShortcutsModal}
          onClose={() => setShowShortcutsModal(false)}
        />
      </Suspense>

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
