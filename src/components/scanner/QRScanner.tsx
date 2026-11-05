import React, { useEffect, useRef, useState, useCallback } from 'react';
import { 
  Camera, 
  FlipHorizontal, 
  Upload, 
  ExternalLink, 
  Copy, 
  Check, 
  AlertCircle, 
  Zap, 
  ZapOff, 
  Wifi, 
  Mail, 
  Phone, 
  UserSquare, 
  Globe, 
  FileText, 
  RefreshCw,
  QrCode,
  ArrowRight,
  MessageSquare
} from 'lucide-react';
import jsQR from 'jsqr';
import { parseScannedContent } from '../../utils/qrHelper';
import { ScannedQRResult } from '../../types';
import { useQR } from '../../context/QRContext';
import { haptic } from '../../utils/haptics';

export const QRScanner: React.FC = () => {
  const { setActiveTab, updateConfig } = useQR();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const animFrameId = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [isScanning, setIsScanning] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<'environment' | 'user'>('environment');
  const [torchOn, setTorchOn] = useState(false);
  const [hasTorch, setHasTorch] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [scannedResult, setScannedResult] = useState<ScannedQRResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [isProcessingImage, setIsProcessingImage] = useState(false);

  // Stop camera stream cleanly
  const stopCamera = useCallback(() => {
    if (animFrameId.current) {
      cancelAnimationFrame(animFrameId.current);
      animFrameId.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsScanning(false);
    setTorchOn(false);
  }, []);

  // Start camera scanning loop
  const startCamera = async (facing: 'environment' | 'user' = cameraFacing) => {
    stopCamera();
    setErrorMessage(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access not supported on this device/browser');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facing },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true'); // essential for iOS Safari
        await videoRef.current.play();
        setIsScanning(true);
      }

      // Check for torch capability
      const track = stream.getVideoTracks()[0];
      const capabilities = track.getCapabilities ? (track.getCapabilities() as any) : {};
      setHasTorch(!!capabilities?.torch);

      // Start scanning loop
      scanVideoFrame();
    } catch (err: any) {
      console.error('Camera error:', err);
      let msg = 'Unable to access camera. Please grant camera permission.';
      if (err.name === 'NotAllowedError') {
        msg = 'Camera permission was denied. Please allow camera access in your browser settings.';
      } else if (err.name === 'NotFoundError') {
        msg = 'No camera found on this device.';
      }
      setErrorMessage(msg);
      setIsScanning(false);
    }
  };

  // Continuous frame scanning
  const scanVideoFrame = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    if (video.readyState === video.HAVE_ENOUGH_DATA && ctx) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'dontInvert',
      });

      if (code && code.data) {
        const parsed = parseScannedContent(code.data);
        setScannedResult(parsed);
        // Apple Taptic Engine success vibration on scan detection
        haptic.trigger('success');
        stopCamera();
        return;
      }
    }

    animFrameId.current = requestAnimationFrame(scanVideoFrame);
  };

  // Switch front/back camera
  const toggleCameraFacing = () => {
    const nextFacing = cameraFacing === 'environment' ? 'user' : 'environment';
    setCameraFacing(nextFacing);
    if (isScanning) {
      startCamera(nextFacing);
    }
  };

  // Toggle torch / flashlight
  const toggleTorch = async () => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    try {
      const nextTorch = !torchOn;
      await (track as any).applyConstraints({
        advanced: [{ torch: nextTorch }],
      });
      setTorchOn(nextTorch);
    } catch (e) {
      console.warn('Torch failed', e);
    }
  };

  // Scan from uploaded file / photo
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingImage(true);
    setErrorMessage(null);

    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const offscreen = document.createElement('canvas');
        offscreen.width = img.width;
        offscreen.height = img.height;
        const ctx = offscreen.getContext('2d', { willReadFrequently: true });
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const imgData = ctx.getImageData(0, 0, offscreen.width, offscreen.height);
          const code = jsQR(imgData.data, imgData.width, imgData.height);
          if (code && code.data) {
            setScannedResult(parseScannedContent(code.data));
            stopCamera();
          } else {
            setErrorMessage('No valid QR code could be detected in this photo. Please try a clearer image.');
          }
        }
        setIsProcessingImage(false);
      };
      img.onerror = () => {
        setErrorMessage('Failed to decode image file.');
        setIsProcessingImage(false);
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Clean up stream on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getResultIcon = (type: string) => {
    switch (type) {
      case 'url': return Globe;
      case 'wifi': return Wifi;
      case 'email': return Mail;
      case 'phone': return Phone;
      case 'sms': return MessageSquare;
      case 'vcard': return UserSquare;
      default: return FileText;
    }
  };

  const ResultIcon = scannedResult ? getResultIcon(scannedResult.type) : FileText;

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-6">
      {/* Page Title */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Live QR Scanner
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Scan QR codes with your device camera or upload any screenshot or photo.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        {/* Viewfinder Column */}
        <div className="md:col-span-7 flex flex-col items-center">
          <div className="relative w-full aspect-square max-w-md rounded-3xl overflow-hidden glass-surface shadow-2xl flex items-center justify-center bg-slate-950">
            {/* Hidden Offscreen Canvas for jsQR extraction */}
            <canvas ref={canvasRef} className="hidden" />

            {/* Video stream */}
            <video
              ref={videoRef}
              className={`w-full h-full object-cover ${cameraFacing === 'user' ? 'scale-x-[-1]' : ''} ${
                !isScanning ? 'hidden' : 'block'
              }`}
            />

            {/* Idle Overlay when camera is off */}
            {!isScanning && (
              <div className="flex flex-col items-center justify-center p-6 text-center z-10">
                <div className="w-16 h-16 rounded-3xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-4 text-blue-400">
                  <Camera className="w-8 h-8" />
                </div>
                <h3 className="text-base font-bold text-white mb-1">Camera Ready</h3>
                <p className="text-xs text-slate-400 max-w-xs mb-6">
                  Tap below to start your device camera or choose a saved screenshot from your photo library.
                </p>
                <button
                  onClick={() => startCamera()}
                  className="min-h-[44px] px-6 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold tracking-wide shadow-lg shadow-blue-500/30 flex items-center gap-2 cursor-pointer active:scale-95 transition-all"
                >
                  <Camera className="w-4 h-4" />
                  <span>Activate Camera</span>
                </button>
              </div>
            )}

            {/* Viewfinder Reticle & HUD when scanning */}
            {isScanning && (
              <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-8">
                {/* Targeting Reticle */}
                <div className="relative w-64 h-64 border-2 border-white/20 rounded-3xl overflow-hidden">
                  {/* Apple-style Corner Accents */}
                  <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-blue-500 rounded-tl-xl" />
                  <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-blue-500 rounded-tr-xl" />
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-blue-500 rounded-bl-xl" />
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-blue-500 rounded-br-xl" />

                  {/* Laser Scan Line */}
                  <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_12px_#06b6d4] animate-pulse absolute top-1/2 -translate-y-1/2" />
                </div>

                <p className="text-xs text-white/80 font-medium mt-4 bg-black/50 backdrop-blur-md px-3 py-1 rounded-full">
                  Align QR code inside box
                </p>
              </div>
            )}

            {/* Scanner Control Bar */}
            {isScanning && (
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between z-20">
                <button
                  onClick={toggleCameraFacing}
                  className="min-h-[44px] min-w-[44px] rounded-2xl bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/10 text-white flex items-center justify-center active:scale-95 transition-transform cursor-pointer"
                  title="Switch camera"
                >
                  <FlipHorizontal className="w-5 h-5" />
                </button>

                {hasTorch && (
                  <button
                    onClick={toggleTorch}
                    className={`min-h-[44px] min-w-[44px] rounded-2xl backdrop-blur-md border border-white/10 flex items-center justify-center active:scale-95 transition-transform cursor-pointer ${
                      torchOn ? 'bg-amber-500 text-black' : 'bg-black/60 text-white'
                    }`}
                    title="Flashlight"
                  >
                    {torchOn ? <Zap className="w-5 h-5" /> : <ZapOff className="w-5 h-5" />}
                  </button>
                )}

                <button
                  onClick={stopCamera}
                  className="min-h-[44px] px-4 rounded-2xl bg-rose-600/80 hover:bg-rose-700 backdrop-blur-md text-white text-xs font-semibold flex items-center gap-1.5 active:scale-95 transition-transform cursor-pointer"
                >
                  <span>Stop</span>
                </button>
              </div>
            )}
          </div>

          {/* Alternative Upload Picture Button */}
          <div className="w-full max-w-md mt-4">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessingImage}
              className="w-full min-h-[46px] rounded-2xl glass-surface hover:bg-white dark:hover:bg-slate-800 border border-slate-200/60 dark:border-white/10 text-slate-800 dark:text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-98 transition-all"
            >
              <Upload className="w-4 h-4 text-blue-500" />
              <span>{isProcessingImage ? 'Analyzing Image...' : 'Scan from Photo Library / File'}</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>

          {/* Error Message Display */}
          {errorMessage && (
            <div className="w-full max-w-md mt-4 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Notice</p>
                <p className="mt-0.5">{errorMessage}</p>
              </div>
            </div>
          )}
        </div>

        {/* Results & Action Column */}
        <div className="md:col-span-5 space-y-4">
          <div className="glass-surface rounded-3xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <QrCode className="w-4 h-4 text-blue-500" />
                Decoded Scan Result
              </h2>
              {scannedResult && (
                <button
                  onClick={() => setScannedResult(null)}
                  className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Clear</span>
                </button>
              )}
            </div>

            {scannedResult ? (
              <div className="space-y-4">
                {/* Type Badge */}
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
                    <ResultIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs uppercase font-bold text-slate-900 dark:text-white tracking-wider">
                      {scannedResult.type} Detected
                    </span>
                    <p className="text-[11px] text-slate-400">
                      Scanned at {new Date(scannedResult.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </div>

                {/* Structured Details if Wi-Fi or vCard */}
                {scannedResult.type === 'wifi' && (
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200/60 dark:border-white/10 space-y-2 text-xs">
                    <div>
                      <span className="text-slate-400 font-medium">Network SSID:</span>
                      <p className="font-bold text-slate-900 dark:text-white text-sm">
                        {scannedResult.parsed.ssid || '(Unnamed)'}
                      </p>
                    </div>
                    {scannedResult.parsed.password && (
                      <div>
                        <span className="text-slate-400 font-medium">Password:</span>
                        <p className="font-mono font-bold text-slate-900 dark:text-white">
                          {scannedResult.parsed.password}
                        </p>
                      </div>
                    )}
                    <div className="text-[11px] text-slate-500">
                      Security: {scannedResult.parsed.encryption} · Hidden: {scannedResult.parsed.hidden}
                    </div>
                  </div>
                )}

                {scannedResult.type === 'vcard' && (
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200/60 dark:border-white/10 space-y-2 text-xs">
                    {scannedResult.parsed.name && (
                      <div>
                        <span className="text-slate-400 font-medium">Name:</span>
                        <p className="font-bold text-slate-900 dark:text-white text-sm">
                          {scannedResult.parsed.name}
                        </p>
                      </div>
                    )}
                    {scannedResult.parsed.phone && (
                      <div>
                        <span className="text-slate-400 font-medium">Phone:</span>
                        <p className="font-semibold text-slate-900 dark:text-white">
                          {scannedResult.parsed.phone}
                        </p>
                      </div>
                    )}
                    {scannedResult.parsed.email && (
                      <div>
                        <span className="text-slate-400 font-medium">Email:</span>
                        <p className="font-semibold text-slate-900 dark:text-white">
                          {scannedResult.parsed.email}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Raw decoded content preview box */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                    Payload Text
                  </label>
                  <div className="p-3.5 rounded-2xl bg-slate-100/70 dark:bg-slate-950/70 border border-slate-200/60 dark:border-white/10 font-mono text-xs text-slate-800 dark:text-slate-200 break-all max-h-48 overflow-y-auto">
                    {scannedResult.raw}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-2 pt-2">
                  {/* Open URL Button if link */}
                  {scannedResult.type === 'url' && (
                    <a
                      href={scannedResult.parsed.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full min-h-[46px] rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 active:scale-98 transition-all"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span>Open Website in Safari / Browser</span>
                    </a>
                  )}

                  {/* Dial Phone Button if phone */}
                  {scannedResult.type === 'phone' && (
                    <a
                      href={`tel:${scannedResult.parsed.number}`}
                      className="w-full min-h-[46px] rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-98 transition-all"
                    >
                      <Phone className="w-4 h-4" />
                      <span>Call {scannedResult.parsed.number}</span>
                    </a>
                  )}

                  {/* Copy Payload Button */}
                  <button
                    onClick={() => copyToClipboard(scannedResult.raw)}
                    className="w-full min-h-[44px] rounded-2xl glass-surface hover:bg-white dark:hover:bg-slate-800 border border-slate-200/60 dark:border-white/10 text-slate-800 dark:text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 active:scale-98 transition-all cursor-pointer"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-500" />
                        <span className="text-emerald-600 dark:text-emerald-400">Copied to Clipboard</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 text-blue-500" />
                        <span>Copy Decoded Text</span>
                      </>
                    )}
                  </button>

                  {/* Transfer to Generator Button */}
                  <button
                    onClick={() => {
                      if (scannedResult.type === 'url') {
                        updateConfig({ type: 'url', url: scannedResult.parsed.url });
                      } else {
                        updateConfig({ type: 'text', text: scannedResult.raw });
                      }
                      setActiveTab('generator');
                    }}
                    className="w-full min-h-[44px] rounded-2xl glass-surface hover:bg-white dark:hover:bg-slate-800 border border-slate-200/60 dark:border-white/10 text-slate-800 dark:text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 active:scale-98 transition-all cursor-pointer"
                  >
                    <ArrowRight className="w-4 h-4 text-indigo-500" />
                    <span>Open in QR Generator Studio</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-slate-400">
                <QrCode className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-xs font-medium">No QR code scanned yet</p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Point the camera at any QR code or upload an image to inspect.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
