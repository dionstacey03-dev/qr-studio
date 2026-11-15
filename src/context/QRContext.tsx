import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  ActiveTab, 
  QRConfig, 
  QRContentType, 
  QRHistoryItem, 
  QRTemplate,
  TrackedLink,
  ClickEvent
} from '../types';
import { DEFAULT_TEMPLATES } from '../utils/templates';
import { getQRSummary, formatQRContent } from '../utils/qrHelper';
import { haptic } from '../utils/haptics';

interface QRContextType {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  config: QRConfig;
  updateConfig: (patch: Partial<QRConfig>) => void;
  updateContentType: (type: QRContentType) => void;
  resetConfig: () => void;
  history: QRHistoryItem[];
  addToHistory: (previewDataUrl?: string) => void;
  deleteHistoryItem: (id: string) => void;
  batchDeleteHistory: (ids: string[]) => void;
  batchUpdateHistory: (updates: { id: string; title?: string; tags?: string[] }[]) => void;
  clearHistory: () => void;
  loadHistoryItem: (item: QRHistoryItem) => void;
  exportHistoryJSON: () => void;
  importHistoryJSON: (jsonString: string, mode?: 'merge' | 'replace') => { success: boolean; count: number; error?: string };
  trackedLinks: TrackedLink[];
  clickEvents: ClickEvent[];
  createTrackedLink: (targetUrl: string, title?: string) => TrackedLink;
  recordClick: (linkId: string, device?: string, browser?: string) => void;
  deleteTrackedLink: (id: string) => void;
  clearTrackingData: () => void;
  templates: QRTemplate[];
  applyTemplate: (template: QRTemplate) => void;
  saveCustomTemplate: (name: string, description?: string) => void;
  deleteCustomTemplate: (id: string) => void;
  renameCustomTemplate: (id: string, newName: string) => void;
  restoreDefaultTemplates: () => void;
  totalGeneratedCount: number;
}

const DEFAULT_CONFIG: QRConfig = {
  type: 'url',
  url: 'https://apple.com',
  text: 'Hello from QR Studio!',
  email: {
    address: 'contact@example.com',
    subject: 'Project Inquiry',
    body: 'Hi there, I would love to connect with your team.',
  },
  phone: {
    number: '+1 (555) 019-2834',
  },
  sms: {
    number: '+1 (555) 019-2834',
    message: 'Hello, checking in regarding the announcement!',
  },
  wifi: {
    ssid: 'Studio_Guest_5G',
    password: 'AppleLiquidGlass2026',
    encryption: 'WPA',
    hidden: false,
  },
  vcard: {
    firstName: 'Alex',
    lastName: 'Rivera',
    organization: 'Design Systems Inc.',
    title: 'Product Architect',
    phone: '+1 (555) 890-1234',
    email: 'alex.rivera@example.com',
    url: 'https://alexrivera.design',
    street: '1 Infinite Loop',
    city: 'Cupertino',
    country: 'United States',
  },
  fgColor: '#09090b',
  bgColor: '#ffffff',
  size: 360,
  errorCorrection: 'M',
  margin: 2,
  logoUrl: null,
  logoSize: 22,
  logoPadding: 6,
  logoShape: 'rounded',
};

const QRContext = createContext<QRContextType | undefined>(undefined);

export const QRProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('home');
  const [config, setConfig] = useState<QRConfig>(DEFAULT_CONFIG);

  // Load history from localStorage
  const [history, setHistory] = useState<QRHistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('qr_studio_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Load custom templates from localStorage
  const [customTemplates, setCustomTemplates] = useState<QRTemplate[]>(() => {
    try {
      const saved = localStorage.getItem('qr_studio_custom_templates');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Total generated counter
  const [totalGeneratedCount, setTotalGeneratedCount] = useState<number>(() => {
    const saved = localStorage.getItem('qr_studio_total_count');
    return saved ? parseInt(saved, 10) : 0;
  });

  // Sync history to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('qr_studio_history', JSON.stringify(history));
    } catch (e) {
      console.warn('Failed to persist history to localStorage', e);
    }
  }, [history]);

  // Sync custom templates to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('qr_studio_custom_templates', JSON.stringify(customTemplates));
    } catch (e) {
      console.warn('Failed to persist custom templates to localStorage', e);
    }
  }, [customTemplates]);

  const handleSetActiveTab = (tab: ActiveTab) => {
    haptic.trigger('selection');
    setActiveTab(tab);
  };

  const updateConfig = (patch: Partial<QRConfig>) => {
    setConfig(prev => ({ ...prev, ...patch }));
  };

  const updateContentType = (type: QRContentType) => {
    haptic.trigger('selection');
    setConfig(prev => ({ ...prev, type }));
  };

  const resetConfig = () => {
    haptic.trigger('medium');
    setConfig(DEFAULT_CONFIG);
  };

  const addToHistory = (previewDataUrl?: string) => {
    haptic.trigger('success');
    const summaryInfo = getQRSummary(config);
    const rawContent = formatQRContent(config);

    const newItem: QRHistoryItem = {
      id: 'qr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      createdAt: Date.now(),
      type: config.type,
      title: summaryInfo.title,
      summary: summaryInfo.summary,
      rawContent,
      config: JSON.parse(JSON.stringify(config)),
      previewDataUrl,
    };

    setHistory(prev => [newItem, ...prev.slice(0, 49)]); // keep up to 50 items
    setTotalGeneratedCount(prev => {
      const updated = prev + 1;
      localStorage.setItem('qr_studio_total_count', updated.toString());
      return updated;
    });
  };

  const deleteHistoryItem = (id: string) => {
    haptic.trigger('heavy');
    setHistory(prev => prev.filter(item => item.id !== id));
  };

  const batchDeleteHistory = (ids: string[]) => {
    haptic.trigger('heavy');
    const idSet = new Set(ids);
    setHistory(prev => prev.filter(item => !idSet.has(item.id)));
  };

  const batchUpdateHistory = (updates: { id: string; title?: string; tags?: string[] }[]) => {
    haptic.trigger('medium');
    const updateMap = new Map(updates.map(u => [u.id, u]));
    setHistory(prev =>
      prev.map(item => {
        const update = updateMap.get(item.id);
        if (!update) return item;
        return {
          ...item,
          title: update.title !== undefined ? update.title : item.title,
          tags: update.tags !== undefined ? update.tags : item.tags,
        };
      })
    );
  };

  const clearHistory = () => {
    haptic.trigger('heavy');
    setHistory([]);
  };

  const loadHistoryItem = (item: QRHistoryItem) => {
    haptic.trigger('medium');
    setConfig(JSON.parse(JSON.stringify(item.config)));
    setActiveTab('generator');
  };

  // Combine default templates and custom templates
  const templates: QRTemplate[] = [...DEFAULT_TEMPLATES, ...customTemplates];

  const applyTemplate = (template: QRTemplate) => {
    haptic.trigger('medium');
    setConfig(prev => ({
      ...prev,
      fgColor: template.fgColor,
      bgColor: template.bgColor,
      errorCorrection: template.errorCorrection,
      margin: template.margin,
      logoShape: template.logoShape || prev.logoShape,
    }));
  };

  const saveCustomTemplate = (name: string, description?: string) => {
    const newTemplate: QRTemplate = {
      id: 'custom_' + Date.now(),
      name: name.trim() || 'Custom Style',
      description: description?.trim() || 'Custom colorway saved from Studio',
      fgColor: config.fgColor,
      bgColor: config.bgColor,
      errorCorrection: config.errorCorrection,
      margin: config.margin,
      logoShape: config.logoShape,
      badgeLabel: 'Custom',
      isCustom: true,
    };

    setCustomTemplates(prev => [newTemplate, ...prev]);
  };

  const deleteCustomTemplate = (id: string) => {
    setCustomTemplates(prev => prev.filter(t => t.id !== id));
  };

  const renameCustomTemplate = (id: string, newName: string) => {
    setCustomTemplates(prev =>
      prev.map(t => (t.id === id ? { ...t, name: newName.trim() || t.name } : t))
    );
  };

  const restoreDefaultTemplates = () => {
    setCustomTemplates([]);
  };

  const exportHistoryJSON = () => {
    const data = {
      app: 'QR Studio',
      version: '1.0.0',
      type: 'qr_history_export',
      exportedAt: new Date().toISOString(),
      count: history.length,
      history,
    };
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const dateStr = new Date().toISOString().slice(0, 10);
    link.download = `qrstudio-history-${dateStr}.json`;
    link.href = url;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const importHistoryJSON = (
    jsonString: string,
    mode: 'merge' | 'replace' = 'merge'
  ): { success: boolean; count: number; error?: string } => {
    try {
      if (jsonString.length > 5 * 1024 * 1024) {
        return { success: false, count: 0, error: 'Import file exceeds the 5 MB limit.' };
      }
      const parsed = JSON.parse(jsonString);
      let itemsToImport: any[] = [];

      if (Array.isArray(parsed)) {
        itemsToImport = parsed;
      } else if (parsed && Array.isArray(parsed.history)) {
        itemsToImport = parsed.history;
      } else if (parsed && typeof parsed.history === 'string') {
        itemsToImport = JSON.parse(parsed.history);
      } else {
        return { success: false, count: 0, error: 'Invalid JSON format. Expected history array or export object.' };
      }

      const isRecord = (value: unknown): value is Record<string, any> =>
        typeof value === 'object' && value !== null && !Array.isArray(value);
      const isString = (value: unknown, maxLength = 5000) =>
        typeof value === 'string' && value.length <= maxLength;
      const validTypes: QRContentType[] = ['url', 'text', 'email', 'phone', 'sms', 'wifi', 'vcard'];
      const isValidConfig = (value: unknown): value is QRConfig => {
        if (!isRecord(value) || !validTypes.includes(value.type)) return false;
        const c = value;
        const emailOk = isRecord(c.email) && ['address', 'subject', 'body'].every((key) => isString(c.email[key]));
        const phoneOk = isRecord(c.phone) && isString(c.phone.number, 100);
        const smsOk = isRecord(c.sms) && isString(c.sms.number, 100) && isString(c.sms.message);
        const wifiOk = isRecord(c.wifi) && isString(c.wifi.ssid, 256) &&
          isString(c.wifi.password, 256) && ['WPA', 'WEP', 'nopass'].includes(c.wifi.encryption) &&
          typeof c.wifi.hidden === 'boolean';
        const vcardKeys = ['firstName', 'lastName', 'organization', 'title', 'phone', 'email', 'url', 'street', 'city', 'country'];
        const vcardOk = isRecord(c.vcard) && vcardKeys.every((key) => isString(c.vcard[key], 500));
        return isString(c.url) && isString(c.text) && emailOk && phoneOk && smsOk && wifiOk && vcardOk &&
          /^#[0-9a-f]{6}$/i.test(c.fgColor) && /^#[0-9a-f]{6}$/i.test(c.bgColor) &&
          Number.isInteger(c.size) && c.size >= 128 && c.size <= 2048 &&
          ['L', 'M', 'Q', 'H'].includes(c.errorCorrection) &&
          Number.isInteger(c.margin) && c.margin >= 0 && c.margin <= 16 &&
          (c.logoShape === undefined || ['circle', 'square', 'rounded'].includes(c.logoShape)) &&
          (c.logoUrl === null || c.logoUrl === undefined || isString(c.logoUrl, 4 * 1024 * 1024));
      };

      const validItems: QRHistoryItem[] = itemsToImport
        .slice(0, 100)
        .filter((item: unknown) =>
          isRecord(item) && validTypes.includes(item.type) && item.type === item.config?.type &&
          isValidConfig(item.config) && isString(item.rawContent) &&
          isString(item.title, 120) && isString(item.summary, 1000)
        )
        .map((item: any) => {
          const safeLogo = typeof item.config.logoUrl === 'string' &&
            /^data:image\/(png|jpeg|webp);base64,/i.test(item.config.logoUrl)
            ? item.config.logoUrl
            : null;
          const safePreview = typeof item.previewDataUrl === 'string' &&
            item.previewDataUrl.length <= 5 * 1024 * 1024 &&
            /^data:image\/(png|jpeg|webp);base64,/i.test(item.previewDataUrl)
            ? item.previewDataUrl
            : undefined;
          return {
            id: isString(item.id, 100) ? item.id : 'qr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
            createdAt: typeof item.createdAt === 'number' && Number.isFinite(item.createdAt) ? item.createdAt : Date.now(),
            type: item.type,
            title: item.title || 'Imported QR',
            summary: item.summary || item.rawContent || 'Imported configuration',
            rawContent: item.rawContent,
            config: { ...item.config, logoUrl: safeLogo },
            previewDataUrl: safePreview,
            tags: Array.isArray(item.tags) ? item.tags.filter((tag: unknown) => isString(tag, 40)).slice(0, 20) : undefined,
          };
        });

      if (validItems.length === 0) {
        return { success: false, count: 0, error: 'No valid QR history entries found in the file.' };
      }

      if (mode === 'replace') {
        setHistory(validItems);
      } else {
        setHistory((prev) => {
          const existingIds = new Set(prev.map((i) => i.id));
          const existingPayloads = new Set(prev.map((i) => i.rawContent + '_' + i.createdAt));
          const newUnique = validItems.filter(
            (i) => !existingIds.has(i.id) && !existingPayloads.has(i.rawContent + '_' + i.createdAt)
          );
          return [...newUnique, ...prev].slice(0, 100);
        });
      }

      return { success: true, count: validItems.length };
    } catch (err: any) {
      console.error('Import error:', err);
      return { success: false, count: 0, error: err?.message || 'Failed to parse JSON file.' };
    }
  };

  // Analytics starts empty: never present fabricated demo activity as real scans.
  const [trackedLinks, setTrackedLinks] = useState<TrackedLink[]>(() => {
    try {
      const saved = localStorage.getItem('qr_studio_tracked_links');
      const parsed: unknown = saved ? JSON.parse(saved) : [];
      return Array.isArray(parsed) ? parsed as TrackedLink[] : [];
    } catch {
      return [];
    }
  });

  const [clickEvents, setClickEvents] = useState<ClickEvent[]>(() => {
    try {
      const saved = localStorage.getItem('qr_studio_click_events');
      const parsed: unknown = saved ? JSON.parse(saved) : [];
      return Array.isArray(parsed) ? parsed as ClickEvent[] : [];
    } catch {
      return [];
    }
  });

  // Sync tracked links to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('qr_studio_tracked_links', JSON.stringify(trackedLinks));
    } catch (e) {
      console.warn('Failed to persist tracked links', e);
    }
  }, [trackedLinks]);

  // Sync click events to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('qr_studio_click_events', JSON.stringify(clickEvents));
    } catch (e) {
      console.warn('Failed to persist click events', e);
    }
  }, [clickEvents]);

  const createTrackedLink = (targetUrl: string, title?: string): TrackedLink => {
    const cleanUrl = targetUrl.trim() || 'https://qrstudio.app';
    const id = 'trk_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 6);
    let derivedTitle = title?.trim();
    if (!derivedTitle) {
      try {
        const parsed = new URL(cleanUrl.startsWith('http') ? cleanUrl : `https://${cleanUrl}`);
        derivedTitle = parsed.hostname.replace(/^www\./, '');
      } catch {
        derivedTitle = 'Campaign Link';
      }
    }

    const newLink: TrackedLink = {
      id,
      targetUrl: cleanUrl.startsWith('http') ? cleanUrl : `https://${cleanUrl}`,
      title: derivedTitle,
      createdAt: Date.now(),
      totalClicks: 0,
    };

    setTrackedLinks(prev => [newLink, ...prev]);
    return newLink;
  };

  const recordClick = (linkId: string, device?: string, browser?: string) => {
    const now = Date.now();
    let detectedDevice = device;
    let detectedBrowser = browser;

    if (!detectedDevice && typeof navigator !== 'undefined') {
      const ua = navigator.userAgent;
      if (/iPhone|iPad|iPod/.test(ua)) detectedDevice = 'iPhone (iOS)';
      else if (/Android/.test(ua)) detectedDevice = 'Android';
      else if (/Macintosh|Mac OS/.test(ua)) detectedDevice = 'Mac (Desktop)';
      else if (/Windows/.test(ua)) detectedDevice = 'Windows (Desktop)';
      else detectedDevice = 'Other Device';
    } else if (!detectedDevice) {
      detectedDevice = 'Mobile Device';
    }

    if (!detectedBrowser && typeof navigator !== 'undefined') {
      const ua = navigator.userAgent;
      if (/CriOS|Chrome/.test(ua) && !/Edg/.test(ua)) detectedBrowser = /Mobile/.test(ua) ? 'Chrome Mobile' : 'Chrome Desktop';
      else if (/Safari/.test(ua) && !/Chrome/.test(ua)) detectedBrowser = /Mobile/.test(ua) ? 'Mobile Safari' : 'Desktop Safari';
      else if (/Firefox/.test(ua)) detectedBrowser = 'Firefox';
      else if (/Edg/.test(ua)) detectedBrowser = 'Edge';
      else detectedBrowser = 'Standard Browser';
    } else if (!detectedBrowser) {
      detectedBrowser = 'Mobile Safari';
    }

    const newEvent: ClickEvent = {
      id: 'clk_' + now + '_' + Math.random().toString(36).substring(2, 6),
      linkId,
      timestamp: now,
      device: detectedDevice,
      browser: detectedBrowser,
    };

    setClickEvents(prev => [newEvent, ...prev].slice(0, 500)); // retain last 500 events
    setTrackedLinks(prev =>
      prev.map(item =>
        item.id === linkId
          ? {
              ...item,
              totalClicks: item.totalClicks + 1,
              lastClickedAt: now,
            }
          : item
      )
    );
  };

  const deleteTrackedLink = (id: string) => {
    setTrackedLinks(prev => prev.filter(item => item.id !== id));
    setClickEvents(prev => prev.filter(evt => evt.linkId !== id));
  };

  const clearTrackingData = () => {
    setTrackedLinks([]);
    setClickEvents([]);
  };

  return (
    <QRContext.Provider
      value={{
        activeTab,
        setActiveTab: handleSetActiveTab,
        config,
        updateConfig,
        updateContentType,
        resetConfig,
        history,
        addToHistory,
        deleteHistoryItem,
        batchDeleteHistory,
        batchUpdateHistory,
        clearHistory,
        loadHistoryItem,
        exportHistoryJSON,
        importHistoryJSON,
        trackedLinks,
        clickEvents,
        createTrackedLink,
        recordClick,
        deleteTrackedLink,
        clearTrackingData,
        templates,
        applyTemplate,
        saveCustomTemplate,
        deleteCustomTemplate,
        renameCustomTemplate,
        restoreDefaultTemplates,
        totalGeneratedCount,
      }}
    >
      {children}
    </QRContext.Provider>
  );
};

export const useQR = () => {
  const context = useContext(QRContext);
  if (!context) {
    throw new Error('useQR must be used within a QRProvider');
  }
  return context;
};
