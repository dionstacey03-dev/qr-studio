export type QRContentType = 'url' | 'text' | 'email' | 'phone' | 'sms' | 'wifi' | 'vcard';

export type ErrorCorrectionLevel = 'L' | 'M' | 'Q' | 'H';

export interface QRConfig {
  type: QRContentType;
  // Content values
  url: string;
  text: string;
  email: {
    address: string;
    subject: string;
    body: string;
  };
  phone: {
    number: string;
  };
  sms: {
    number: string;
    message: string;
  };
  wifi: {
    ssid: string;
    password: string;
    encryption: 'WPA' | 'WEP' | 'nopass';
    hidden: boolean;
  };
  vcard: {
    firstName: string;
    lastName: string;
    organization: string;
    title: string;
    phone: string;
    email: string;
    url: string;
    street: string;
    city: string;
    country: string;
  };
  // Customization
  fgColor: string;
  bgColor: string;
  size: number;
  errorCorrection: ErrorCorrectionLevel;
  margin: number;
  // Logo
  logoUrl: string | null;
  logoSize: number; // percentage, e.g., 20
  logoPadding: number; // border padding around logo in px
  logoShape?: 'circle' | 'square' | 'rounded';
  // Click Tracking
  trackingEnabled?: boolean;
  trackingId?: string;
}

export interface QRTemplate {
  id: string;
  name: string;
  description: string;
  fgColor: string;
  bgColor: string;
  errorCorrection: ErrorCorrectionLevel;
  margin: number;
  logoShape?: 'circle' | 'square' | 'rounded';
  badgeLabel?: string;
  isCustom?: boolean;
}

export interface QRHistoryItem {
  id: string;
  createdAt: number;
  type: QRContentType;
  title: string;
  summary: string;
  rawContent: string;
  config: QRConfig;
  previewDataUrl?: string;
  tags?: string[];
}

export type ThemeMode = 'light' | 'dark' | 'system';

export type ActiveTab = 'home' | 'generator' | 'analytics' | 'bulk' | 'scanner' | 'templates' | 'history' | 'settings';

export interface BulkQRItem {
  id: string;
  url: string;
  label: string;
  status: 'pending' | 'generating' | 'ready' | 'error';
  dataUrl?: string;
  errorMessage?: string;
}

export interface ScannedQRResult {
  raw: string;
  type: 'url' | 'wifi' | 'email' | 'phone' | 'sms' | 'vcard' | 'text';
  parsed: Record<string, string>;
  timestamp: number;
}

export interface TrackedLink {
  id: string;
  targetUrl: string;
  title: string;
  createdAt: number;
  totalClicks: number;
  lastClickedAt?: number;
}

export interface ClickEvent {
  id: string;
  linkId: string;
  timestamp: number;
  device: string;
  browser: string;
}
