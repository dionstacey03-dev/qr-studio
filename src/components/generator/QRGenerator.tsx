import React, { useState } from 'react';
import { 
  Globe, 
  FileText, 
  Mail, 
  Phone, 
  MessageSquare, 
  Wifi, 
  UserSquare, 
  Upload, 
  Trash2, 
  Sliders, 
  Palette, 
  Image as ImageIcon, 
  Check, 
  ArrowLeftRight,
  Info
} from 'lucide-react';
import { useQR } from '../../context/QRContext';
import { QRContentType, ErrorCorrectionLevel } from '../../types';
import { QRPreview } from './QRPreview';

const CONTENT_TYPES: { id: QRContentType; label: string; icon: React.ElementType }[] = [
  { id: 'url', label: 'Website', icon: Globe },
  { id: 'text', label: 'Text', icon: FileText },
  { id: 'email', label: 'Email', icon: Mail },
  { id: 'phone', label: 'Phone', icon: Phone },
  { id: 'sms', label: 'SMS', icon: MessageSquare },
  { id: 'wifi', label: 'Wi-Fi', icon: Wifi },
  { id: 'vcard', label: 'vCard', icon: UserSquare },
];

const QUICK_COLORS = [
  '#09090b', '#0071e3', '#0284c7', '#059669', '#7c3aed', '#db2777', '#e11d48', '#d97706', '#475569', '#ffffff'
];

const PRESET_LOGOS = [
  {
    name: 'Link',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#0071e3" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>`,
  },
  {
    name: 'Wi-Fi',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 13a10 10 0 0 1 14 0"/><path d="M8.5 16.5a5 5 0 0 1 7 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></svg>`,
  },
  {
    name: 'Mail',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>`,
  },
  {
    name: 'Phone',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#e11d48" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>`,
  },
  {
    name: 'Star',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#f59e0b" stroke="#d97706" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
  },
];

export const QRGenerator: React.FC = () => {
  const { config, updateConfig, updateContentType, createTrackedLink } = useQR();
  const [activeAccordion, setActiveAccordion] = useState<'content' | 'colors' | 'logo' | 'specs'>('content');

  // Handle image logo upload
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        updateConfig({
          logoUrl: reader.result as string,
          errorCorrection: 'H', // auto boost to H for scan safety
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleApplyPresetLogo = (svgStr: string) => {
    const dataUrl = `data:image/svg+xml;utf8,${encodeURIComponent(svgStr)}`;
    updateConfig({
      logoUrl: dataUrl,
      errorCorrection: 'H',
    });
  };

  const handleSwapColors = () => {
    updateConfig({
      fgColor: config.bgColor,
      bgColor: config.fgColor,
    });
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          QR Studio Generator
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Craft scannable, Apple-inspired Liquid Glass QR codes with live custom branding.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left column: Configuration Workspace */}
        <div className="lg:col-span-7 space-y-6 generator-config-column">
          {/* Content Type Selector Bar */}
          <div className="glass-surface p-1.5 rounded-2xl flex items-center gap-1 overflow-x-auto no-scrollbar">
            {CONTENT_TYPES.map((type) => {
              const Icon = type.icon;
              const isSelected = config.type === type.id;
              return (
                <button
                  key={type.id}
                  onClick={() => updateContentType(type.id)}
                  className={`min-h-[42px] px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 whitespace-nowrap transition-all duration-200 cursor-pointer ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/60 dark:hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{type.label}</span>
                </button>
              );
            })}
          </div>

          {/* Section 1: Content Form Card */}
          <div className="glass-surface rounded-3xl p-6 shadow-sm">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              Content Details ({config.type.toUpperCase()})
            </h2>

            {/* URL Form */}
            {config.type === 'url' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Target Website URL
                  </label>
                  <div className="relative">
                    <Globe className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="url"
                      value={config.url}
                      onChange={(e) => updateConfig({ url: e.target.value })}
                      placeholder="https://yourwebsite.com"
                      className="w-full min-h-[46px] pl-11 pr-4 rounded-xl text-sm bg-white/70 dark:bg-slate-950/60 border border-slate-200/80 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    />
                  </div>
                </div>

                {/* QR Click Tracking Toggle */}
                <div className="p-3.5 rounded-2xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-500/20 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-blue-600 text-white">
                        <Sliders className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <span>Enable QR Clicks Analytics</span>
                          <span className="text-[9px] uppercase tracking-wider font-extrabold px-1.5 py-0.2 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400">
                            Telemetry
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          Proxies this URL to count scans and record device models in your dashboard.
                        </p>
                      </div>
                    </div>

                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!config.trackingEnabled}
                        onChange={(e) => {
                          const enabled = e.target.checked;
                          if (enabled) {
                            let tid = config.trackingId;
                            if (!tid) {
                              const created = createTrackedLink(config.url);
                              tid = created.id;
                            }
                            updateConfig({ trackingEnabled: true, trackingId: tid });
                          } else {
                            updateConfig({ trackingEnabled: false });
                          }
                        }}
                        className="sr-only peer"
                      />
                      <div className="w-10 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  {config.trackingEnabled && (
                    <div className="pt-2 border-t border-blue-200/50 dark:border-blue-500/20 flex items-center justify-between text-[11px]">
                      <span className="text-slate-600 dark:text-slate-300 font-mono truncate max-w-xs">
                        Proxy ID: {config.trackingId || 'Auto-generated'}
                      </span>
                      <span className="text-blue-600 dark:text-blue-400 font-semibold">
                        Ready to scan & track
                      </span>
                    </div>
                  )}
                </div>

                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  When scanned with iPhone Camera, an Apple Safari Banner will promptly appear.
                </p>
              </div>
            )}

            {/* Plain Text Form */}
            {config.type === 'text' && (
              <div className="space-y-3">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Plain Text Content
                </label>
                <textarea
                  rows={4}
                  value={config.text}
                  onChange={(e) => updateConfig({ text: e.target.value })}
                  placeholder="Enter any text, instructions, or notes to encode..."
                  className="w-full p-3.5 rounded-xl text-sm bg-white/70 dark:bg-slate-950/60 border border-slate-200/80 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>
            )}

            {/* Email Form */}
            {config.type === 'email' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Recipient Email Address
                  </label>
                  <input
                    type="email"
                    value={config.email.address}
                    onChange={(e) =>
                      updateConfig({ email: { ...config.email, address: e.target.value } })
                    }
                    placeholder="alex@apple.com"
                    className="w-full min-h-[46px] px-3.5 rounded-xl text-sm bg-white/70 dark:bg-slate-950/60 border border-slate-200/80 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Subject Line (Optional)
                  </label>
                  <input
                    type="text"
                    value={config.email.subject}
                    onChange={(e) =>
                      updateConfig({ email: { ...config.email, subject: e.target.value } })
                    }
                    placeholder="Studio Consultation"
                    className="w-full min-h-[46px] px-3.5 rounded-xl text-sm bg-white/70 dark:bg-slate-950/60 border border-slate-200/80 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Pre-filled Body (Optional)
                  </label>
                  <textarea
                    rows={3}
                    value={config.email.body}
                    onChange={(e) =>
                      updateConfig({ email: { ...config.email, body: e.target.value } })
                    }
                    placeholder="Hi there, I am interested in..."
                    className="w-full p-3 rounded-xl text-sm bg-white/70 dark:bg-slate-950/60 border border-slate-200/80 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>
              </div>
            )}

            {/* Phone Form */}
            {config.type === 'phone' && (
              <div className="space-y-3">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Telephone Number
                </label>
                <div className="relative">
                  <Phone className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    value={config.phone.number}
                    onChange={(e) =>
                      updateConfig({ phone: { number: e.target.value } })
                    }
                    placeholder="+1 (555) 234-5678"
                    className="w-full min-h-[46px] pl-11 pr-4 rounded-xl text-sm bg-white/70 dark:bg-slate-950/60 border border-slate-200/80 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Immediately launches phone dialer when scanned.
                </p>
              </div>
            )}

            {/* SMS Form */}
            {config.type === 'sms' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={config.sms.number}
                    onChange={(e) =>
                      updateConfig({ sms: { ...config.sms, number: e.target.value } })
                    }
                    placeholder="+1 (555) 345-6789"
                    className="w-full min-h-[46px] px-3.5 rounded-xl text-sm bg-white/70 dark:bg-slate-950/60 border border-slate-200/80 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Pre-filled SMS Message
                  </label>
                  <textarea
                    rows={3}
                    value={config.sms.message}
                    onChange={(e) =>
                      updateConfig({ sms: { ...config.sms, message: e.target.value } })
                    }
                    placeholder="Hello, I would like to confirm my appointment..."
                    className="w-full p-3 rounded-xl text-sm bg-white/70 dark:bg-slate-950/60 border border-slate-200/80 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>
              </div>
            )}

            {/* Wi-Fi Form */}
            {config.type === 'wifi' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Network Name (SSID)
                  </label>
                  <input
                    type="text"
                    value={config.wifi.ssid}
                    onChange={(e) =>
                      updateConfig({ wifi: { ...config.wifi, ssid: e.target.value } })
                    }
                    placeholder="Guest_WiFi_5G"
                    className="w-full min-h-[46px] px-3.5 rounded-xl text-sm bg-white/70 dark:bg-slate-950/60 border border-slate-200/80 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Network Password
                  </label>
                  <input
                    type="text"
                    value={config.wifi.password}
                    onChange={(e) =>
                      updateConfig({ wifi: { ...config.wifi, password: e.target.value } })
                    }
                    placeholder="Password123"
                    className="w-full min-h-[46px] px-3.5 rounded-xl text-sm bg-white/70 dark:bg-slate-950/60 border border-slate-200/80 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Security Type
                    </label>
                    <select
                      value={config.wifi.encryption}
                      onChange={(e) =>
                        updateConfig({
                          wifi: {
                            ...config.wifi,
                            encryption: e.target.value as 'WPA' | 'WEP' | 'nopass',
                          },
                        })
                      }
                      className="w-full min-h-[46px] px-3 rounded-xl text-sm bg-white/70 dark:bg-slate-950/60 border border-slate-200/80 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    >
                      <option value="WPA">WPA / WPA2 / WPA3</option>
                      <option value="WEP">WEP</option>
                      <option value="nopass">No Password (Open)</option>
                    </select>
                  </div>
                  <div className="flex items-center pt-6">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 dark:text-slate-300">
                      <input
                        type="checkbox"
                        checked={config.wifi.hidden}
                        onChange={(e) =>
                          updateConfig({ wifi: { ...config.wifi, hidden: e.target.checked } })
                        }
                        className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                      />
                      <span>Hidden Network</span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* vCard Form */}
            {config.type === 'vcard' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      First Name
                    </label>
                    <input
                      type="text"
                      value={config.vcard.firstName}
                      onChange={(e) =>
                        updateConfig({ vcard: { ...config.vcard, firstName: e.target.value } })
                      }
                      placeholder="Alex"
                      className="w-full min-h-[44px] px-3.5 rounded-xl text-sm bg-white/70 dark:bg-slate-950/60 border border-slate-200/80 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={config.vcard.lastName}
                      onChange={(e) =>
                        updateConfig({ vcard: { ...config.vcard, lastName: e.target.value } })
                      }
                      placeholder="Rivera"
                      className="w-full min-h-[44px] px-3.5 rounded-xl text-sm bg-white/70 dark:bg-slate-950/60 border border-slate-200/80 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Organization / Company
                    </label>
                    <input
                      type="text"
                      value={config.vcard.organization}
                      onChange={(e) =>
                        updateConfig({ vcard: { ...config.vcard, organization: e.target.value } })
                      }
                      placeholder="Apple Inc."
                      className="w-full min-h-[44px] px-3.5 rounded-xl text-sm bg-white/70 dark:bg-slate-950/60 border border-slate-200/80 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Job Title
                    </label>
                    <input
                      type="text"
                      value={config.vcard.title}
                      onChange={(e) =>
                        updateConfig({ vcard: { ...config.vcard, title: e.target.value } })
                      }
                      placeholder="Principal Designer"
                      className="w-full min-h-[44px] px-3.5 rounded-xl text-sm bg-white/70 dark:bg-slate-950/60 border border-slate-200/80 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={config.vcard.phone}
                      onChange={(e) =>
                        updateConfig({ vcard: { ...config.vcard, phone: e.target.value } })
                      }
                      placeholder="+1 (555) 019-2834"
                      className="w-full min-h-[44px] px-3.5 rounded-xl text-sm bg-white/70 dark:bg-slate-950/60 border border-slate-200/80 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={config.vcard.email}
                      onChange={(e) =>
                        updateConfig({ vcard: { ...config.vcard, email: e.target.value } })
                      }
                      placeholder="alex@apple.com"
                      className="w-full min-h-[44px] px-3.5 rounded-xl text-sm bg-white/70 dark:bg-slate-950/60 border border-slate-200/80 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Portfolio / Website URL
                  </label>
                  <input
                    type="url"
                    value={config.vcard.url}
                    onChange={(e) =>
                      updateConfig({ vcard: { ...config.vcard, url: e.target.value } })
                    }
                    placeholder="https://alexrivera.design"
                    className="w-full min-h-[44px] px-3.5 rounded-xl text-sm bg-white/70 dark:bg-slate-950/60 border border-slate-200/80 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Colors & Theme Card */}
          <div className="glass-surface rounded-3xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Palette className="w-4 h-4 text-indigo-500" />
                Color Palette & Contrast
              </h2>
              <button
                onClick={handleSwapColors}
                className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <ArrowLeftRight className="w-3.5 h-3.5" />
                <span>Invert Colors</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Foreground Color Picker */}
              <div className="p-3.5 rounded-2xl bg-slate-50/70 dark:bg-white/[0.04] border border-slate-200/60 dark:border-white/10">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Pattern / Foreground Color
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={config.fgColor}
                    onChange={(e) => updateConfig({ fgColor: e.target.value })}
                    className="w-10 h-10 rounded-xl cursor-pointer border-0 p-0 bg-transparent"
                  />
                  <input
                    type="text"
                    value={config.fgColor}
                    onChange={(e) => updateConfig({ fgColor: e.target.value })}
                    className="flex-1 min-h-[38px] px-3 rounded-lg text-xs font-mono uppercase bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white"
                  />
                </div>

                {/* Quick Swatches */}
                <div className="flex items-center gap-1.5 mt-3 flex-wrap">
                  {QUICK_COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => updateConfig({ fgColor: c })}
                      className="w-5 h-5 rounded-full border border-black/10 dark:border-white/20 transition-transform hover:scale-125"
                      style={{ backgroundColor: c }}
                      title={c}
                    />
                  ))}
                </div>
              </div>

              {/* Background Color Picker */}
              <div className="p-3.5 rounded-2xl bg-slate-50/70 dark:bg-white/[0.04] border border-slate-200/60 dark:border-white/10">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Background Color
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={config.bgColor}
                    onChange={(e) => updateConfig({ bgColor: e.target.value })}
                    className="w-10 h-10 rounded-xl cursor-pointer border-0 p-0 bg-transparent"
                  />
                  <input
                    type="text"
                    value={config.bgColor}
                    onChange={(e) => updateConfig({ bgColor: e.target.value })}
                    className="flex-1 min-h-[38px] px-3 rounded-lg text-xs font-mono uppercase bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white"
                  />
                </div>

                {/* Quick Swatches */}
                <div className="flex items-center gap-1.5 mt-3 flex-wrap">
                  {['#ffffff', '#f8fafc', '#f1f5f9', '#fef3c7', '#ecfdf5', '#fae8ff', '#0f172a', '#09090b'].map((c) => (
                    <button
                      key={c}
                      onClick={() => updateConfig({ bgColor: c })}
                      className="w-5 h-5 rounded-full border border-black/10 dark:border-white/20 transition-transform hover:scale-125"
                      style={{ backgroundColor: c }}
                      title={c}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Custom Logo & Center Icon */}
          <div className="glass-surface rounded-3xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-emerald-500" />
                Center Logo & Badge
              </h2>
              {config.logoUrl && (
                <button
                  onClick={() => updateConfig({ logoUrl: null })}
                  className="text-xs font-semibold text-rose-500 hover:text-rose-600 flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove Logo</span>
                </button>
              )}
            </div>

            <div className="space-y-4">
              {/* Upload Input */}
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <label className="w-full sm:w-auto min-h-[44px] px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-blue-500/20">
                  <Upload className="w-4 h-4" />
                  <span>Upload Logo (PNG, SVG, JPG)</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                </label>
                <span className="text-xs text-slate-400">or pick an icon preset:</span>
              </div>

              {/* Preset Icon Badges */}
              <div className="flex items-center gap-2 flex-wrap">
                {PRESET_LOGOS.map((preset) => (
                  <button
                    key={preset.name}
                    onClick={() => handleApplyPresetLogo(preset.svg)}
                    className="px-3 py-1.5 rounded-xl glass-pill text-xs font-medium text-slate-700 dark:text-slate-300 hover:border-blue-500/50 flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <span
                      className="w-4 h-4 inline-block"
                      dangerouslySetInnerHTML={{ __html: preset.svg }}
                    />
                    <span>{preset.name}</span>
                  </button>
                ))}
              </div>

              {/* Logo customization options if logo is active */}
              {config.logoUrl && (
                <div className="pt-3 border-t border-slate-200/60 dark:border-white/10 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Logo Size: {config.logoSize}%
                    </label>
                    <input
                      type="range"
                      min="15"
                      max="32"
                      value={config.logoSize}
                      onChange={(e) => updateConfig({ logoSize: parseInt(e.target.value, 10) })}
                      className="w-full accent-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Badge Shape
                    </label>
                    <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-white/5">
                      {(['circle', 'rounded', 'square'] as const).map((shape) => (
                        <button
                          key={shape}
                          onClick={() => updateConfig({ logoShape: shape })}
                          className={`py-1 text-xs font-semibold rounded-lg capitalize transition-colors ${
                            config.logoShape === shape
                              ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                              : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                          }`}
                        >
                          {shape}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Section 4: Geometry & Error Correction */}
          <div className="glass-surface rounded-3xl p-6 shadow-sm">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-cyan-500" />
              Scan Precision & Quiet Zone
            </h2>

            <div className="space-y-4">
              {/* Error correction levels */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Error Correction Level
                  </label>
                  <span className="text-[11px] text-slate-400">
                    {config.logoUrl ? 'Locked to Level H for logo scan reliability' : 'Recommended: M or Q'}
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  {[
                    { id: 'L', label: 'L · 7%', desc: 'Lowest density' },
                    { id: 'M', label: 'M · 15%', desc: 'Standard' },
                    { id: 'Q', label: 'Q · 25%', desc: 'High recovery' },
                    { id: 'H', label: 'H · 30%', desc: 'Best for logos' },
                  ].map((level) => {
                    const isSelected = (config.logoUrl ? 'H' : config.errorCorrection) === level.id;
                    return (
                      <button
                        key={level.id}
                        disabled={!!config.logoUrl && level.id !== 'H'}
                        onClick={() =>
                          updateConfig({ errorCorrection: level.id as ErrorCorrectionLevel })
                        }
                        className={`p-2.5 rounded-xl text-center border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                            : 'bg-white/60 dark:bg-slate-900/60 border-slate-200/60 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:border-blue-400'
                        } ${config.logoUrl && level.id !== 'H' ? 'opacity-40 cursor-not-allowed' : ''}`}
                      >
                        <div className="text-xs font-bold">{level.label}</div>
                        <div className="text-[10px] opacity-80 mt-0.5">{level.desc}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Margin / Quiet Zone Slider */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Quiet Zone Margin: {config.margin} blocks
                  </label>
                  <span className="text-[11px] text-slate-400">Default: 2</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="6"
                  value={config.margin}
                  onChange={(e) => updateConfig({ margin: parseInt(e.target.value, 10) })}
                  className="w-full accent-blue-600"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right column: Sticky Live Preview */}
        <div className="lg:col-span-5 lg:sticky lg:top-6 space-y-4">
          <QRPreview />
        </div>
      </div>
    </div>
  );
};
