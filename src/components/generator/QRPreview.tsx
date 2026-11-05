import React, { useEffect, useRef, useState } from 'react';
import { 
  Download, 
  Copy, 
  Share2, 
  Check, 
  Sparkles, 
  FileCode, 
  Maximize2,
  Mail,
  MessageCircle,
  ExternalLink,
  X,
  Share,
  Layers,
  Printer
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useQR } from '../../context/QRContext';
import { renderQRToCanvas, generateQRSVG, getQRSummary, formatQRContent } from '../../utils/qrHelper';
import { haptic } from '../../utils/haptics';

export const QRPreview: React.FC = () => {
  const { config, addToHistory } = useQR();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [exportRes, setExportRes] = useState<number>(1024);
  const [showResMenu, setShowResMenu] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [canShareFiles, setCanShareFiles] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Check Web Share API capability
  useEffect(() => {
    try {
      if (typeof navigator !== 'undefined' && !!navigator.share) {
        if (typeof navigator.canShare === 'function') {
          const testFile = new File([''], 'test.png', { type: 'image/png' });
          const supportsFiles = navigator.canShare({ files: [testFile] });
          setCanShareFiles(supportsFiles);
        } else {
          setCanShareFiles(true);
        }
      }
    } catch {
      setCanShareFiles(false);
    }
  }, []);

  const [isRendering, setIsRendering] = useState(true);

  // Render QR to canvas whenever config changes with subtle skeleton transition
  useEffect(() => {
    setIsRendering(true);
    let isCancelled = false;

    const render = async () => {
      try {
        if (canvasRef.current) {
          await renderQRToCanvas(canvasRef.current, config, 360);
        }
      } catch (err) {
        console.error('Error rendering QR canvas:', err);
      } finally {
        if (!isCancelled) {
          setTimeout(() => {
            if (!isCancelled) setIsRendering(false);
          }, 120);
        }
      }
    };

    render();

    return () => {
      isCancelled = true;
    };
  }, [config]);

  // Helper: Create a high-res image File object from QR
  const createQRImageFile = async (resolution = 1024): Promise<File> => {
    const offscreenCanvas = document.createElement('canvas');
    await renderQRToCanvas(offscreenCanvas, config, resolution);

    const blob = await new Promise<Blob>((resolve, reject) => {
      offscreenCanvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error('Failed to generate image blob'))),
        'image/png'
      );
    });

    const filename = `qrstudio-${config.type}.png`;
    return new File([blob], filename, { type: 'image/png' });
  };

  // Download standard or high-res PNG
  const handleDownloadPNG = async (resolution: number) => {
    haptic.trigger('medium');
    setDownloading(true);
    try {
      const offscreenCanvas = document.createElement('canvas');
      await renderQRToCanvas(offscreenCanvas, config, resolution);
      
      const dataUrl = offscreenCanvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `qrstudio-${config.type}-${resolution}px.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Save to history with thumbnail and success haptic
      addToHistory(dataUrl);
      haptic.trigger('success');

      // Celebrate
      confetti({
        particleCount: 35,
        spread: 60,
        origin: { y: 0.8 },
      });

      showToast(`Downloaded PNG (${resolution}×${resolution})`);
    } catch (e) {
      console.error('Download error:', e);
      haptic.trigger('error');
      showToast('Download failed. Try SVG export.');
    } finally {
      setDownloading(false);
      setShowResMenu(false);
    }
  };

  // Export SVG
  const handleExportSVG = async () => {
    haptic.trigger('medium');
    try {
      const svgString = await generateQRSVG(config);
      const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = `qrstudio-${config.type}.svg`;
      link.href = url;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      if (canvasRef.current) {
        addToHistory(canvasRef.current.toDataURL('image/png'));
      }
      haptic.trigger('success');

      showToast('Vector SVG exported successfully');
    } catch (e) {
      console.error('SVG export error:', e);
      haptic.trigger('error');
      showToast('Failed to export SVG.');
    }
  };

  // Copy to clipboard
  const handleCopyClipboard = async () => {
    haptic.trigger('medium');
    try {
      if (!canvasRef.current) return;
      const offscreenCanvas = document.createElement('canvas');
      await renderQRToCanvas(offscreenCanvas, config, 1024);

      offscreenCanvas.toBlob(async (blob) => {
        if (!blob) {
          haptic.trigger('error');
          showToast('Failed to generate image blob');
          return;
        }
        try {
          const item = new ClipboardItem({ 'image/png': blob });
          await navigator.clipboard.write([item]);
          setCopied(true);
          haptic.trigger('success');
          showToast('QR code copied to clipboard!');
          setTimeout(() => setCopied(false), 2000);
          
          if (canvasRef.current) {
            addToHistory(canvasRef.current.toDataURL('image/png'));
          }
        } catch (err) {
          console.warn('Clipboard write failed, trying text fallback', err);
          showToast('Clipboard copy not supported in this browser mode');
        }
      }, 'image/png');
    } catch (e) {
      haptic.trigger('error');
      showToast('Could not copy image to clipboard');
    }
  };

  // Native Web Share API with image file
  const handleNativeShare = async () => {
    haptic.trigger('medium');
    setIsSharing(true);
    const summary = getQRSummary(config);
    const shareTitle = `QR Studio - ${summary.title}`;
    const shareText = `Here is a scannable QR code for ${summary.title}`;

    try {
      // 1. Check if navigator.share exists
      if (typeof navigator !== 'undefined' && navigator.share) {
        const file = await createQRImageFile(1024);

        // Check if files can be shared directly
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: shareTitle,
            text: shareText,
            files: [file],
          });
          haptic.trigger('success');
          showToast('Shared successfully!');
          if (canvasRef.current) {
            addToHistory(canvasRef.current.toDataURL('image/png'));
          }
          setIsSharing(false);
          return;
        }

        // If file sharing is not supported by device, share URL / text payload
        const rawContent = formatQRContent(config);
        await navigator.share({
          title: shareTitle,
          text: `${shareText}\n${rawContent}`,
          url: config.type === 'url' ? config.url : window.location.href,
        });
        haptic.trigger('success');
        showToast('Shared via device sheet!');
        setIsSharing(false);
        return;
      }

      // If navigator.share is completely unsupported, open the Liquid Glass Share Sheet
      setShowShareModal(true);
    } catch (err: any) {
      // AbortError is triggered when user dismisses the native share dialog - do not show error
      if (err?.name !== 'AbortError') {
        console.warn('Native share error, opening fallback sheet:', err);
        setShowShareModal(true);
      }
    } finally {
      setIsSharing(false);
    }
  };

  // Share directly to WhatsApp Web / App
  const handleShareWhatsApp = async () => {
    const summary = getQRSummary(config);
    const rawContent = formatQRContent(config);
    const text = encodeURIComponent(
      `*${summary.title}*\n${summary.summary}\n\nContent:\n${rawContent}\n\nGenerated with QR Studio`
    );

    // Auto copy image so user can paste it right into WhatsApp
    await handleCopyClipboard();
    showToast('Image copied! Opening WhatsApp to paste...');

    const whatsappUrl = `https://api.whatsapp.com/send?text=${text}`;
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    setShowShareModal(false);
  };

  // Share directly via Mail Client
  const handleShareMail = async () => {
    const summary = getQRSummary(config);
    const rawContent = formatQRContent(config);
    const subject = encodeURIComponent(`QR Code: ${summary.title}`);
    const body = encodeURIComponent(
      `Hi,\n\nHere is the QR code for ${summary.title}.\n\nDetails:\n${summary.summary}\nPayload: ${rawContent}\n\n(Generated via QR Studio)`
    );

    // Also copy image to clipboard for easy pasting into mail body
    await handleCopyClipboard();
    showToast('Image copied! Opening Mail client...');

    window.location.href = `mailto:?subject=${subject}&body=${body}`;
    setShowShareModal(false);
  };

  // Handle browser print dialogue
  const handlePrint = () => {
    haptic.trigger('medium');
    // If canvas is ready, also log to history
    if (canvasRef.current) {
      addToHistory(canvasRef.current.toDataURL('image/png'));
    }
    window.print();
  };

  const summary = getQRSummary(config);

  return (
    <div className="flex flex-col items-center w-full">
      {/* Liquid Glass Showcase Card (turns into clean paper sheet in print mode) */}
      <div className="relative w-full max-w-sm rounded-3xl p-6 glass-surface shadow-2xl overflow-hidden group printable-qr-sheet">
        {/* Specular ambient glass reflection */}
        <div className="no-print absolute -top-24 -left-24 w-48 h-48 bg-white/20 dark:bg-white/5 rounded-full blur-2xl pointer-events-none" />
        <div className="no-print absolute -bottom-24 -right-24 w-48 h-48 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Print-Only Sheet Header */}
        <div className="print-only text-center mb-6 w-full">
          <div className="text-xl font-bold tracking-tight text-slate-900">
            {summary.title || 'QR Code'}
          </div>
          <div className="text-sm text-slate-600 mt-1 max-w-md mx-auto break-all font-mono">
            {summary.summary}
          </div>
        </div>

        {/* Top Header pill (screen only) */}
        <div className="no-print flex items-center justify-between mb-4">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
            <Sparkles className="w-3.5 h-3.5 text-blue-500" />
            <span>Live Liquid Preview</span>
          </div>
          <span className="text-[11px] font-mono text-slate-600 dark:text-slate-400 font-medium">
            Level {config.logoUrl ? 'H (30%)' : config.errorCorrection}
          </span>
        </div>

        {/* Canvas Display Area */}
        <div className="flex items-center justify-center p-4 rounded-2xl bg-slate-100/70 dark:bg-slate-950/60 border border-slate-200/50 dark:border-white/5 shadow-inner">
          <div className="relative rounded-2xl overflow-hidden shadow-lg transition-transform duration-300 group-hover:scale-[1.01] w-64 aspect-square flex items-center justify-center">
            {/* Live QR Canvas */}
            <canvas
              ref={canvasRef}
              className={`max-w-full h-auto w-64 aspect-square block rounded-xl transition-opacity duration-200 ${
                isRendering ? 'opacity-30 scale-[0.98]' : 'opacity-100 scale-100'
              }`}
              style={{
                backgroundColor: config.bgColor,
              }}
            />

            {/* Subtle Liquid Glass Skeleton Shimmer Overlay */}
            {isRendering && (
              <div className="no-print absolute inset-0 z-10 rounded-xl skeleton-glass skeleton-shimmer flex flex-col justify-between p-5 pointer-events-none transition-opacity duration-300 shadow-inner">
                {/* Simulated Finder Patterns */}
                <div className="flex justify-between w-full">
                  <div className="w-12 h-12 rounded-lg border-2 border-slate-400/30 dark:border-white/20 p-1 flex items-center justify-center">
                    <div className="w-5 h-5 rounded-md bg-slate-400/40 dark:bg-white/30" />
                  </div>
                  <div className="w-12 h-12 rounded-lg border-2 border-slate-400/30 dark:border-white/20 p-1 flex items-center justify-center">
                    <div className="w-5 h-5 rounded-md bg-slate-400/40 dark:bg-white/30" />
                  </div>
                </div>

                {/* Simulated Center Area */}
                <div className="w-10 h-10 rounded-xl bg-slate-400/30 dark:bg-white/20 mx-auto" />

                {/* Simulated Bottom Left Finder Pattern */}
                <div className="flex justify-between items-end w-full">
                  <div className="w-12 h-12 rounded-lg border-2 border-slate-400/30 dark:border-white/20 p-1 flex items-center justify-center">
                    <div className="w-5 h-5 rounded-md bg-slate-400/40 dark:bg-white/30" />
                  </div>
                  <div className="w-16 h-3 rounded-full bg-slate-400/30 dark:bg-white/20" />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Live specs footer (screen only) */}
        <div className="no-print mt-4 pt-3 border-t border-slate-200/50 dark:border-white/10 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span className="truncate max-w-[180px] font-medium">
            {config.type.toUpperCase()} · Margin {config.margin}
          </span>
          <div className="flex items-center gap-2">
            <span
              className="w-3 h-3 rounded-full border border-black/10 dark:border-white/20"
              style={{ backgroundColor: config.fgColor }}
              title="Foreground Color"
            />
            <span
              className="w-3 h-3 rounded-full border border-black/10 dark:border-white/20"
              style={{ backgroundColor: config.bgColor }}
              title="Background Color"
            />
          </div>
        </div>

        {/* Print-Only Document Footer */}
        <div className="print-only text-center mt-6 pt-4 border-t border-slate-200 text-xs text-slate-500 w-full flex items-center justify-between">
          <span>Point device camera to scan</span>
          <span className="font-semibold">Generated with QR Studio</span>
        </div>
      </div>

      {/* Export & Share Action Controls (Hidden during print) */}
      <div className="no-print w-full max-w-sm mt-5 space-y-2.5">
        {/* Prominent Native Share & Print Row */}
        <div className="grid grid-cols-2 gap-2">
          {/* Print on Paper Button */}
          <button
            onClick={handlePrint}
            className="min-h-[48px] px-4 py-2.5 rounded-2xl glass-surface hover:bg-white dark:hover:bg-slate-800 text-slate-800 dark:text-white font-bold text-xs flex items-center justify-center gap-2 border border-slate-200/80 dark:border-white/10 shadow-sm active:scale-[0.99] transition-all cursor-pointer group"
            title="Print paper-ready QR sheet (Cmd+P)"
          >
            <Printer className="w-4 h-4 text-blue-500 transition-transform group-hover:scale-110" />
            <span>Print Sheet</span>
          </button>

          {/* Native Share API Trigger */}
          <button
            onClick={handleNativeShare}
            disabled={isSharing}
            className="min-h-[48px] px-4 py-2.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 active:scale-[0.99] transition-all cursor-pointer group"
          >
            <Share2 className="w-4 h-4 transition-transform group-hover:scale-110" />
            <span>{isSharing ? 'Sharing...' : 'Share'}</span>
          </button>
        </div>

        {/* Primary Download Button & High-Res Popover */}
        <div className="relative">
          <div className="flex rounded-2xl overflow-hidden shadow-md shadow-slate-900/10 dark:shadow-none bg-slate-900 dark:bg-white text-white dark:text-slate-900">
            <button
              onClick={() => handleDownloadPNG(exportRes)}
              disabled={downloading}
              className="flex-1 min-h-[46px] px-4 py-2.5 flex items-center justify-center gap-2 text-xs font-bold hover:bg-slate-800 dark:hover:bg-slate-100 active:scale-[0.99] transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Download PNG ({exportRes}px)</span>
            </button>
            <button
              onClick={() => setShowResMenu(!showResMenu)}
              className="px-3 border-l border-white/20 dark:border-slate-300 hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors flex items-center justify-center"
              title="Change Resolution"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>

          {/* Resolution Picker Menu */}
          {showResMenu && (
            <div className="absolute right-0 bottom-full mb-2 w-48 glass-surface rounded-2xl p-2 shadow-2xl border border-slate-200/60 dark:border-white/10 z-30">
              <p className="text-[11px] font-semibold text-slate-400 px-2 py-1 uppercase tracking-wider">
                Export Resolution
              </p>
              {[
                { label: 'Standard (512px)', value: 512 },
                { label: 'HD Crisp (1024px)', value: 1024 },
                { label: 'Print 2K (2048px)', value: 2048 },
                { label: 'Ultra 4K (4096px)', value: 4096 },
              ].map((res) => (
                <button
                  key={res.value}
                  onClick={() => {
                    setExportRes(res.value);
                    setShowResMenu(false);
                    handleDownloadPNG(res.value);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition-colors ${
                    exportRes === res.value
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10'
                  }`}
                >
                  <span>{res.label}</span>
                  {exportRes === res.value && <Check className="w-3.5 h-3.5" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Secondary Buttons Grid: SVG, Copy, Share Options */}
        <div className="grid grid-cols-3 gap-2">
          {/* SVG Export */}
          <button
            onClick={handleExportSVG}
            className="min-h-[44px] flex items-center justify-center gap-1.5 px-3 py-2 rounded-2xl text-xs font-semibold glass-surface text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-800 transition-all border border-slate-200/60 dark:border-white/10 shadow-sm active:scale-95 cursor-pointer"
          >
            <FileCode className="w-4 h-4 text-indigo-500" />
            <span>SVG</span>
          </button>

          {/* Copy to Clipboard */}
          <button
            onClick={handleCopyClipboard}
            className="min-h-[44px] flex items-center justify-center gap-1.5 px-3 py-2 rounded-2xl text-xs font-semibold glass-surface text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-800 transition-all border border-slate-200/60 dark:border-white/10 shadow-sm active:scale-95 cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-500" />
                <span className="text-emerald-600 dark:text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-blue-500" />
                <span>Copy</span>
              </>
            )}
          </button>

          {/* Share Channels Menu */}
          <button
            onClick={() => setShowShareModal(true)}
            className="min-h-[44px] flex items-center justify-center gap-1.5 px-3 py-2 rounded-2xl text-xs font-semibold glass-surface text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-800 transition-all border border-slate-200/60 dark:border-white/10 shadow-sm active:scale-95 cursor-pointer"
            title="Open Share Options"
          >
            <Share className="w-4 h-4 text-emerald-500" />
            <span>Apps...</span>
          </button>
        </div>
      </div>

      {/* Liquid Glass Share Sheet Modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-sm glass-surface rounded-3xl p-6 shadow-2xl border border-white/20 dark:border-white/10 relative">
            {/* Close Button */}
            <button
              onClick={() => setShowShareModal(false)}
              className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header */}
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <Share2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white tracking-tight">
                  Share QR Code
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Send image directly to WhatsApp, Mail, and apps
                </p>
              </div>
            </div>

            {/* Share Targets List */}
            <div className="space-y-2.5">
              {/* Native Device Share Sheet (iOS / Android / Safari / macOS) */}
              <button
                onClick={() => {
                  setShowShareModal(false);
                  handleNativeShare();
                }}
                className="w-full min-h-[48px] px-4 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center justify-between shadow-lg shadow-blue-500/20 active:scale-98 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <Share2 className="w-4 h-4" />
                  <span>Open System Share Sheet</span>
                </div>
                <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-medium">
                  Native
                </span>
              </button>

              {/* WhatsApp Direct */}
              <button
                onClick={handleShareWhatsApp}
                className="w-full min-h-[48px] px-4 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center justify-between shadow-lg shadow-emerald-500/20 active:scale-98 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <MessageCircle className="w-4 h-4" />
                  <span>Send to WhatsApp</span>
                </div>
                <ExternalLink className="w-3.5 h-3.5 opacity-80" />
              </button>

              {/* Mail Direct */}
              <button
                onClick={handleShareMail}
                className="w-full min-h-[48px] px-4 py-3 rounded-2xl glass-surface hover:bg-white dark:hover:bg-slate-800 text-slate-800 dark:text-white font-semibold text-xs flex items-center justify-between border border-slate-200/80 dark:border-white/10 active:scale-98 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-indigo-500" />
                  <span>Compose in Mail App</span>
                </div>
                <ExternalLink className="w-3.5 h-3.5 opacity-60" />
              </button>

              {/* Copy QR Image to Clipboard */}
              <button
                onClick={() => {
                  handleCopyClipboard();
                  setShowShareModal(false);
                }}
                className="w-full min-h-[48px] px-4 py-3 rounded-2xl glass-surface hover:bg-white dark:hover:bg-slate-800 text-slate-800 dark:text-white font-semibold text-xs flex items-center justify-between border border-slate-200/80 dark:border-white/10 active:scale-98 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <Copy className="w-4 h-4 text-blue-500" />
                  <span>Copy Image (Paste Anywhere)</span>
                </div>
                <span className="text-[10px] text-slate-400">PNG</span>
              </button>
            </div>

            <p className="mt-4 text-[11px] text-slate-400 text-center">
              Sharing via native sheet allows selecting installed apps, contacts, and AirDrop on supported devices.
            </p>
          </div>
        </div>
      )}

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
