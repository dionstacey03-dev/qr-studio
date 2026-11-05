import React, { useRef, useState } from 'react';
import { 
  FileSpreadsheet, 
  Upload, 
  Download, 
  Sparkles, 
  Check, 
  AlertCircle, 
  Archive, 
  Layers, 
  Palette, 
  ExternalLink, 
  Trash2, 
  RefreshCw,
  Sliders,
  FileDown,
  CheckCircle2,
  FolderArchive
} from 'lucide-react';
import JSZip from 'jszip';
import confetti from 'canvas-confetti';
import { useQR } from '../../context/QRContext';
import { BulkQRItem, ErrorCorrectionLevel, QRTemplate } from '../../types';
import { renderQRToCanvas } from '../../utils/qrHelper';
import { DEFAULT_TEMPLATES } from '../../utils/templates';

const SAMPLE_CSV = `url,label
https://apple.com,Apple Official
https://github.com,GitHub Developer Portal
https://google.com,Google Search
https://stripe.com,Stripe Checkout
https://youtube.com,YouTube Media`;

export const BulkQRGenerator: React.FC = () => {
  const { config, templates, history } = useQR();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [rawText, setRawText] = useState('');
  const [items, setItems] = useState<BulkQRItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isZipping, setIsZipping] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Batch styling options
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('minimal-black');
  const [errorCorrection, setErrorCorrection] = useState<ErrorCorrectionLevel>('M');
  const [exportRes, setExportRes] = useState<number>(1024);
  const [activeTabMode, setActiveTabMode] = useState<'upload' | 'paste'>('upload');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const getActiveStyle = () => {
    const tpl = templates.find((t) => t.id === selectedTemplateId) || DEFAULT_TEMPLATES[0];
    return {
      fgColor: tpl.fgColor,
      bgColor: tpl.bgColor,
      errorCorrection,
      margin: tpl.margin || 2,
    };
  };

  // Download Sample CSV template
  const handleDownloadSampleCSV = () => {
    const blob = new Blob([SAMPLE_CSV], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = 'qrstudio-sample-template.csv';
    link.href = url;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('Sample CSV downloaded');
  };

  // Robust CSV Parser
  const parseCSVText = (text: string): { url: string; label: string }[] => {
    const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length === 0) return [];

    let urlColIndex = -1;
    let labelColIndex = -1;
    const results: { url: string; label: string }[] = [];

    // Check first line for headers
    const firstLineCols = lines[0].split(',').map((c) => c.trim().toLowerCase().replace(/['"]/g, ''));
    const hasHeader = firstLineCols.some((c) => c.includes('url') || c.includes('link') || c.includes('website'));

    let startIndex = 0;
    if (hasHeader) {
      startIndex = 1;
      urlColIndex = firstLineCols.findIndex((c) => c.includes('url') || c.includes('link') || c.includes('website') || c.includes('address'));
      labelColIndex = firstLineCols.findIndex((c) => c.includes('label') || c.includes('name') || c.includes('title') || c.includes('id'));
    }

    if (urlColIndex === -1) urlColIndex = 0;
    if (labelColIndex === -1) labelColIndex = urlColIndex === 0 ? 1 : 0;

    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i];
      // Basic CSV split respecting simple quotes
      const cols = line.split(',').map((c) => c.trim().replace(/^["']|["']$/g, ''));
      if (cols.length === 0 || !cols[urlColIndex]) continue;

      let rawUrl = cols[urlColIndex].trim();
      if (!rawUrl) continue;
      if (!/^[a-zA-Z]+:\/\//i.test(rawUrl)) {
        rawUrl = `https://${rawUrl}`;
      }

      const label = (cols[labelColIndex] && cols[labelColIndex].trim()) || rawUrl.replace(/^https?:\/\//i, '').split('/')[0];
      results.push({ url: rawUrl, label });
    }

    return results;
  };

  // Handle CSV file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result as string;
      const parsed = parseCSVText(text);
      if (parsed.length === 0) {
        showToast('No valid URLs found in CSV.');
        return;
      }
      processBatch(parsed);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Handle direct paste
  const handlePasteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rawText.trim()) return;
    const parsed = parseCSVText(rawText);
    if (parsed.length === 0) {
      showToast('No valid URLs detected in pasted text.');
      return;
    }
    processBatch(parsed);
  };

  // Run batch generation engine
  const processBatch = async (entries: { url: string; label: string }[]) => {
    setIsProcessing(true);
    const style = getActiveStyle();

    const initialItems: BulkQRItem[] = entries.map((entry, index) => ({
      id: `bulk_${Date.now()}_${index}`,
      url: entry.url,
      label: entry.label,
      status: 'pending',
    }));

    setItems(initialItems);
    setProgress({ current: 0, total: initialItems.length });

    const updatedItems = [...initialItems];

    for (let i = 0; i < updatedItems.length; i++) {
      const item = updatedItems[i];
      item.status = 'generating';
      setItems([...updatedItems]);

      try {
        const offscreenCanvas = document.createElement('canvas');
        await renderQRToCanvas(
          offscreenCanvas,
          {
            type: 'url',
            url: item.url,
            text: '',
            email: { address: '', subject: '', body: '' },
            phone: { number: '' },
            sms: { number: '', message: '' },
            wifi: { ssid: '', password: '', encryption: 'WPA', hidden: false },
            vcard: { firstName: '', lastName: '', organization: '', title: '', phone: '', email: '', url: '', street: '', city: '', country: '' },
            fgColor: style.fgColor,
            bgColor: style.bgColor,
            size: exportRes,
            errorCorrection: style.errorCorrection,
            margin: style.margin,
            logoUrl: null,
            logoSize: 20,
            logoPadding: 4,
            logoShape: 'rounded',
          },
          exportRes
        );

        item.dataUrl = offscreenCanvas.toDataURL('image/png');
        item.status = 'ready';
      } catch (err: any) {
        item.status = 'error';
        item.errorMessage = err?.message || 'Generation failed';
      }

      setProgress({ current: i + 1, total: updatedItems.length });
      setItems([...updatedItems]);
      // Small tick for smooth UI rendering
      await new Promise((r) => setTimeout(r, 10));
    }

    setIsProcessing(false);
    confetti({
      particleCount: 45,
      spread: 70,
      origin: { y: 0.7 },
    });
    showToast(`Generated all ${updatedItems.length} QR codes!`);
  };

  // Download all as ZIP
  const handleDownloadZip = async () => {
    if (items.length === 0) return;
    setIsZipping(true);

    try {
      const zip = new JSZip();
      const folder = zip.folder('qrstudio-batch');

      let manifestCsv = 'id,filename,label,url\n';

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.dataUrl && item.status === 'ready') {
          // Clean slug for filename
          const cleanLabel = (item.label || 'qr')
            .toLowerCase()
            .replace(/[^a-z0-9_-]/g, '_')
            .slice(0, 30);
          const filename = `${String(i + 1).padStart(2, '0')}_${cleanLabel}.png`;
          const base64Data = item.dataUrl.replace(/^data:image\/png;base64,/, '');

          folder?.file(filename, base64Data, { base64: true });
          manifestCsv += `"${item.id}","${filename}","${item.label.replace(/"/g, '""')}","${item.url}"\n`;
        }
      }

      // Add manifest CSV
      folder?.file('manifest.csv', manifestCsv);

      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const link = document.createElement('a');
      link.download = `qrstudio-batch-${items.length}-codes.zip`;
      link.href = url;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showToast(`ZIP package with ${items.length} QR codes downloaded!`);
    } catch (e) {
      console.error('ZIP failed:', e);
      showToast('Failed to create ZIP package.');
    } finally {
      setIsZipping(false);
    }
  };

  // Download single item PNG
  const handleDownloadSingle = (item: BulkQRItem) => {
    if (!item.dataUrl) return;
    const link = document.createElement('a');
    const cleanLabel = (item.label || 'qr').toLowerCase().replace(/[^a-z0-9_-]/g, '_');
    link.download = `qr_${cleanLabel}.png`;
    link.href = item.dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Bulk QR Code Studio
          </h1>
          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
            BATCH ENGINE
          </span>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Upload a CSV spreadsheet with multiple URLs to batch-generate and download all QR codes as a ZIP archive.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Upload & Style Options */}
        <div className="lg:col-span-5 space-y-6">
          {/* Input Method Switcher Card */}
          <div className="glass-surface rounded-3xl p-6 shadow-sm border border-slate-200/60 dark:border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-blue-500" />
                Upload or Paste URLs
              </h2>
              <button
                type="button"
                onClick={handleDownloadSampleCSV}
                className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <FileDown className="w-3.5 h-3.5" />
                <span>Sample CSV</span>
              </button>
            </div>

            {/* Mode Tabs */}
            <div className="grid grid-cols-2 p-1 rounded-xl bg-slate-100 dark:bg-white/5">
              <button
                type="button"
                onClick={() => setActiveTabMode('upload')}
                className={`py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                  activeTabMode === 'upload'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Upload CSV File
              </button>
              <button
                type="button"
                onClick={() => setActiveTabMode('paste')}
                className={`py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                  activeTabMode === 'paste'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Paste CSV / URLs
              </button>
            </div>

            {/* Mode 1: File Upload Dropzone */}
            {activeTabMode === 'upload' && (
              <div>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 dark:border-white/20 hover:border-blue-500 dark:hover:border-blue-400 rounded-2xl p-8 text-center cursor-pointer transition-colors bg-white/40 dark:bg-slate-950/40"
                >
                  <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 mx-auto flex items-center justify-center mb-3">
                    <Upload className="w-6 h-6" />
                  </div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">
                    Drop CSV file here or click to browse
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Columns: <code className="font-mono">url, label</code> (or 1 URL per row)
                  </p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.txt"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
            )}

            {/* Mode 2: Paste Area */}
            {activeTabMode === 'paste' && (
              <form onSubmit={handlePasteSubmit} className="space-y-3">
                <textarea
                  rows={6}
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  placeholder={`https://apple.com, Apple Homepage\nhttps://google.com, Google Search\nhttps://github.com, GitHub`}
                  className="w-full p-3 rounded-xl text-xs font-mono bg-white/70 dark:bg-slate-950/60 border border-slate-200/80 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  disabled={!rawText.trim() || isProcessing}
                  className="w-full min-h-[44px] rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 active:scale-98 transition-all disabled:opacity-50 cursor-pointer"
                >
                  Parse & Generate Codes
                </button>
              </form>
            )}
          </div>

          {/* Style & Batch Customization Card */}
          <div className="glass-surface rounded-3xl p-6 shadow-sm border border-slate-200/60 dark:border-white/10 space-y-4">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Palette className="w-4 h-4 text-indigo-500" />
              Batch Style Palette
            </h2>

            {/* Template Swatches */}
            <div className="grid grid-cols-2 gap-2">
              {DEFAULT_TEMPLATES.map((tpl) => (
                <button
                  key={tpl.id}
                  onClick={() => setSelectedTemplateId(tpl.id)}
                  className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition-colors cursor-pointer ${
                    selectedTemplateId === tpl.id
                      ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/30'
                      : 'border-slate-200/60 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5'
                  }`}
                >
                  <div className="truncate">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {tpl.name}
                    </p>
                    <p className="text-[10px] text-slate-400 truncate">{tpl.badgeLabel}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0 ml-2">
                    <span
                      className="w-3 h-3 rounded-full border border-black/10"
                      style={{ backgroundColor: tpl.fgColor }}
                    />
                    <span
                      className="w-3 h-3 rounded-full border border-black/10"
                      style={{ backgroundColor: tpl.bgColor }}
                    />
                  </div>
                </button>
              ))}
            </div>

            {/* Resolution Selector */}
            <div className="pt-2 border-t border-slate-200/50 dark:border-white/10 flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                Export Resolution:
              </span>
              <select
                value={exportRes}
                onChange={(e) => setExportRes(parseInt(e.target.value, 10))}
                className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white font-medium"
              >
                <option value={512}>512 × 512 px (Standard)</option>
                <option value={1024}>1024 × 1024 px (HD Crisp)</option>
                <option value={2048}>2048 × 2048 px (Print 2K)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Right Column: Generation Progress & Results Grid */}
        <div className="lg:col-span-7 space-y-6">
          {/* Batch Status & Action Bar */}
          <div className="glass-surface rounded-3xl p-6 shadow-sm border border-slate-200/60 dark:border-white/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                  Generated Output
                </h2>
                {items.length > 0 && (
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 tabular-nums">
                    {items.filter((i) => i.status === 'ready').length} / {items.length} Ready
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {items.length > 0
                  ? 'All codes generated client-side and ready for batch download.'
                  : 'Awaiting CSV file or URL list to begin batch rendering.'}
              </p>
            </div>

            {items.length > 0 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDownloadZip}
                  disabled={isZipping || isProcessing}
                  className="min-h-[44px] px-5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold tracking-wide shadow-lg shadow-blue-500/25 flex items-center gap-2 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                >
                  <FolderArchive className="w-4 h-4" />
                  <span>{isZipping ? 'Packaging ZIP...' : `Download All (${items.length} as ZIP)`}</span>
                </button>

                <button
                  onClick={() => setItems([])}
                  className="p-2.5 rounded-2xl glass-surface text-slate-400 hover:text-rose-500 transition-colors"
                  title="Clear batch"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Progress Bar when processing */}
          {isProcessing && (
            <div className="glass-surface rounded-2xl p-4 shadow-sm space-y-2 animate-pulse">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                <span>Generating barcodes in memory...</span>
                <span className="font-mono tabular-nums">
                  {progress.current} of {progress.total}
                </span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-white/10 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-blue-500 to-indigo-600 h-full rounded-full transition-all duration-200"
                  style={{
                    width: `${progress.total > 0 ? (progress.current / progress.total) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
          )}

          {/* Items Grid */}
          {items.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {items.map((item, idx) => (
                <div
                  key={item.id}
                  className="glass-surface rounded-2xl p-4 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
                >
                  <div>
                    {/* Thumbnail canvas or placeholder */}
                    <div className="w-full aspect-square rounded-xl bg-slate-100 dark:bg-slate-950 p-2 flex items-center justify-center mb-3 overflow-hidden shadow-inner">
                      {item.status === 'ready' && item.dataUrl ? (
                        <img
                          src={item.dataUrl}
                          alt={item.label}
                          className="w-full h-full object-contain rounded-lg shadow-sm"
                        />
                      ) : item.status === 'generating' ? (
                        <RefreshCw className="w-6 h-6 text-blue-500 animate-spin" />
                      ) : item.status === 'error' ? (
                        <AlertCircle className="w-6 h-6 text-rose-500" />
                      ) : (
                        <span className="text-xs text-slate-400">Queued</span>
                      )}
                    </div>

                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-[10px] font-mono text-slate-400">
                        #{String(idx + 1).padStart(2, '0')}
                      </span>
                      {item.status === 'ready' && (
                        <span className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                          <Check className="w-3 h-3" /> Ready
                        </span>
                      )}
                    </div>

                    <h4 className="font-bold text-xs text-slate-900 dark:text-white truncate">
                      {item.label}
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5 font-mono">
                      {item.url}
                    </p>
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-200/50 dark:border-white/10 flex items-center justify-between">
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5"
                    >
                      <span>Visit</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>

                    {item.status === 'ready' && (
                      <button
                        onClick={() => handleDownloadSingle(item)}
                        className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
                        title="Download PNG"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="glass-surface rounded-3xl p-12 text-center border border-dashed border-slate-300 dark:border-white/10">
              <FileSpreadsheet className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
                No Batch Data Loaded
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-4">
                Upload your CSV file on the left or paste a list of URLs to generate dozens of scannable QR codes simultaneously.
              </p>
              <button
                type="button"
                onClick={handleDownloadSampleCSV}
                className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1.5"
              >
                <FileDown className="w-3.5 h-3.5" />
                <span>Download Sample CSV Template</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Floating Notification Toast */}
      {toastMessage && (
        <div className="fixed bottom-24 lg:bottom-10 right-6 z-50 glass-floating-nav px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-semibold text-slate-900 dark:text-white border border-slate-200/80 dark:border-white/20 animate-fade-in">
          <Check className="w-4 h-4 text-blue-500" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
