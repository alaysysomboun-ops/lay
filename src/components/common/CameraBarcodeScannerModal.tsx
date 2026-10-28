import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, CameraDevice } from 'html5-qrcode';
import {
  Camera,
  X,
  RefreshCw,
  Zap,
  ZapOff,
  Upload,
  CheckCircle2,
  AlertCircle,
  Volume2,
  VolumeX,
  Repeat,
  Package
} from 'lucide-react';
import { Product } from '../../types';

interface CameraBarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (barcode: string) => void;
  products?: Product[];
  title?: string;
  subtitle?: string;
}

export const CameraBarcodeScannerModal: React.FC<CameraBarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  onScan,
  products = [],
  title = 'ສະແກນບາໂຄ້ດດ້ວຍກ້ອງ',
  subtitle = 'ວາງບາໂຄ້ດ ຫຼື QR Code ໃຫ້ຢູ່ໃນກອບສີ່ຫຼ່ຽມ',
}) => {
  const [cameras, setCameras] = useState<CameraDevice[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [isScanning, setIsScanning] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isContinuous, setIsContinuous] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [hasTorch, setHasTorch] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [scannedHistory, setScannedHistory] = useState<Array<{ code: string; product?: Product; time: string }>>([]);
  const [lastScannedFeedback, setLastScannedFeedback] = useState<{ code: string; product?: Product } | null>(null);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const readerElementId = 'camera-barcode-reader-view';
  const lastScannedTimeRef = useRef<{ [code: string]: number }>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Play audio beep
  const playBeep = () => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1050, ctx.currentTime);
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.14);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.14);
    } catch {
      // AudioContext could be blocked if not triggered
    }
  };

  // Vibration
  const vibrate = () => {
    try {
      if ('vibrate' in navigator) {
        navigator.vibrate(90);
      }
    } catch {
      // Ignore vibration error
    }
  };

  // Handle successful barcode recognition
  const handleBarcodeDetected = (decodedText: string) => {
    const cleanCode = decodedText.trim();
    if (!cleanCode) return;

    // Check debounce for the exact same code (1.5 seconds)
    const now = Date.now();
    const lastScanTime = lastScannedTimeRef.current[cleanCode] || 0;
    if (now - lastScanTime < 1600) {
      return;
    }
    lastScannedTimeRef.current[cleanCode] = now;

    // Provide feedback
    playBeep();
    vibrate();

    // Match product if list provided
    const matched = products.find(
      (p) =>
        p.status === 'ACTIVE' &&
        (p.barcode.toLowerCase() === cleanCode.toLowerCase() ||
          p.sku.toLowerCase() === cleanCode.toLowerCase() ||
          p.units?.some((u) => u.barcode?.toLowerCase() === cleanCode.toLowerCase()))
    );

    setLastScannedFeedback({ code: cleanCode, product: matched });
    setScannedHistory((prev) => [
      {
        code: cleanCode,
        product: matched,
        time: new Date().toLocaleTimeString('lo-LA', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      },
      ...prev.slice(0, 9),
    ]);

    // Dispatch scan callback
    onScan(cleanCode);

    // If not continuous, stop and close
    if (!isContinuous) {
      setTimeout(() => {
        handleClose();
      }, 350);
    }
  };

  // Start the scanner
  const startCamera = async (cameraId?: string) => {
    setErrorMsg(null);
    try {
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode(readerElementId);
      }

      const scanner = scannerRef.current;

      if (scanner.isScanning) {
        await scanner.stop();
      }

      // Check available cameras
      let currentCams = cameras;
      if (currentCams.length === 0) {
        try {
          currentCams = await Html5Qrcode.getCameras();
          setCameras(currentCams);
        } catch {
          // Camera permission or detection error
        }
      }

      const targetCamera =
        cameraId ||
        (currentCams.length > 0
          ? currentCams.find((c) => c.label.toLowerCase().includes('back') || c.label.toLowerCase().includes('rear'))?.id ||
            currentCams[0].id
          : { facingMode: 'environment' });

      setSelectedCameraId(typeof targetCamera === 'string' ? targetCamera : '');

      const config = {
        fps: 20,
        qrbox: { width: 280, height: 160 },
        aspectRatio: 1.333333,
      };

      await scanner.start(
        targetCamera,
        config,
        (decodedText) => {
          handleBarcodeDetected(decodedText);
        },
        () => {
          // Frame error (no barcode in frame) - ignore
        }
      );

      setIsScanning(true);

      // Check if torch is supported
      try {
        const capabilities = (scanner as any).getRunningTrackCapabilities?.();
        if (capabilities && capabilities.torch) {
          setHasTorch(true);
        }
      } catch {
        setHasTorch(false);
      }
    } catch (err: any) {
      console.error('Camera Scanner Error:', err);
      setIsScanning(false);
      let userFriendly = 'ບໍ່ສາມາດເປີດກ້ອງຖ່າຍຮູບໄດ້';
      if (err?.name === 'NotAllowedError' || err?.message?.includes('Permission')) {
        userFriendly = 'ກະລຸນາອະນຸຍາດການເຂົ້າເຖິງກ້ອງຖ່າຍຮູບໃນບຣາວເຊີ (Camera Permission Denied)';
      } else if (err?.name === 'NotFoundError' || err?.name === 'DevicesNotFoundError') {
        userFriendly = 'ບໍ່ພົບອຸປະກອນກ້ອງຖ່າຍຮູບໃນເຄື່ອງຂອງທ່ານ';
      } else if (err?.message) {
        userFriendly = `ຂໍ້ຜິດພາດ: ${err.message}`;
      }
      setErrorMsg(userFriendly);
    }
  };

  // Stop scanner
  const stopCamera = async () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch (err) {
        console.warn('Error stopping scanner:', err);
      }
    }
    setIsScanning(false);
    setTorchOn(false);
  };

  // Toggle Torch/Flashlight
  const toggleTorch = async () => {
    if (!scannerRef.current || !hasTorch) return;
    try {
      const nextTorch = !torchOn;
      await (scannerRef.current as any).applyVideoConstraints({
        advanced: [{ torch: nextTorch }],
      });
      setTorchOn(nextTorch);
    } catch (err) {
      console.warn('Failed to toggle torch:', err);
    }
  };

  // Switch between available cameras
  const switchCamera = async () => {
    if (cameras.length <= 1) return;
    const currentIndex = cameras.findIndex((c) => c.id === selectedCameraId);
    const nextIndex = (currentIndex + 1) % cameras.length;
    const nextCamId = cameras[nextIndex].id;
    setSelectedCameraId(nextCamId);
    await startCamera(nextCamId);
  };

  // Handle Photo/Image file scan fallback
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode(readerElementId);
      }
      const scanner = scannerRef.current;
      if (scanner.isScanning) {
        await scanner.stop();
        setIsScanning(false);
      }

      const decodedText = await scanner.scanFile(file, true);
      if (decodedText) {
        handleBarcodeDetected(decodedText);
      }
    } catch (err: any) {
      setErrorMsg('ບໍ່ສາມາດອ່ານບາໂຄ້ດຈາກຮູບພາບນີ້ໄດ້ ກະລຸນາລອງຖ່າຍຮູບທີ່ແຈ້ງຂຶ້ນ');
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleClose = async () => {
    await stopCamera();
    onClose();
  };

  useEffect(() => {
    if (isOpen) {
      setLastScannedFeedback(null);
      // Short delay for DOM render before starting camera
      const timer = setTimeout(() => {
        startCamera();
      }, 250);
      return () => {
        clearTimeout(timer);
        stopCamera();
      };
    } else {
      stopCamera();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 text-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-700/80 overflow-hidden flex flex-col max-h-[95vh]">
        {/* Header */}
        <div className="p-4 bg-slate-800/90 border-b border-slate-700/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-600/30 border border-blue-500/30 text-blue-400">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-white">{title}</h3>
              <p className="text-[11px] text-slate-400">{subtitle}</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Sound toggle */}
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? 'ປິດສຽງເຕືອນ' : 'ເປີດສຽງເຕືອນ'}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-700/60 transition-colors cursor-pointer"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Continuous scan toggle */}
            <button
              onClick={() => setIsContinuous(!isContinuous)}
              title={isContinuous ? 'ໂໝດສະແກນຕໍ່ເນື່ອງ (ເປີດຢູ່)' : 'ໂໝດສະແກນ 1 ຄັ້ງ'}
              className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1 border transition-all cursor-pointer ${
                isContinuous
                  ? 'bg-blue-600/30 border-blue-500 text-blue-300'
                  : 'bg-slate-800 border-slate-700 text-slate-400'
              }`}
            >
              <Repeat className="w-3 h-3" />
              <span className="hidden sm:inline">ຕໍ່ເນື່ອງ</span>
            </button>

            <button
              onClick={handleClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Camera Viewport Area */}
        <div className="relative bg-black flex-1 min-h-[300px] flex items-center justify-center overflow-hidden">
          {/* Scanner Container Element */}
          <div id={readerElementId} className="w-full h-full max-h-[380px] object-cover" />

          {/* Overlay Viewfinder Guide when scanning */}
          {isScanning && (
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center p-6">
              {/* Target box */}
              <div className="relative w-72 h-44 border-2 border-blue-400/80 rounded-2xl shadow-[0_0_0_9999px_rgba(0,0,0,0.5)] overflow-hidden">
                {/* 4 Corner Markers */}
                <div className="absolute top-0 left-0 w-5 h-5 border-t-4 border-l-4 border-blue-400 -translate-x-0.5 -translate-y-0.5 rounded-tl-sm" />
                <div className="absolute top-0 right-0 w-5 h-5 border-t-4 border-r-4 border-blue-400 translate-x-0.5 -translate-y-0.5 rounded-tr-sm" />
                <div className="absolute bottom-0 left-0 w-5 h-5 border-b-4 border-l-4 border-blue-400 -translate-x-0.5 translate-y-0.5 rounded-bl-sm" />
                <div className="absolute bottom-0 right-0 w-5 h-5 border-b-4 border-r-4 border-blue-400 translate-x-0.5 translate-y-0.5 rounded-br-sm" />

                {/* Laser animation */}
                <div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-red-500 to-transparent shadow-[0_0_8px_#ef4444] animate-pulse top-1/2 -translate-y-1/2" />
              </div>
              <p className="mt-4 text-xs font-semibold text-slate-300 bg-black/60 px-3 py-1 rounded-full backdrop-blur-xs">
                ວາງບາໂຄ້ດໃຫ້ຢູ່ກາງເສັ້ນແດງ
              </p>
            </div>
          )}

          {/* Error / Permission Blocked Message */}
          {errorMsg && (
            <div className="absolute inset-0 bg-slate-900/95 p-6 flex flex-col items-center justify-center text-center">
              <AlertCircle className="w-12 h-12 text-rose-500 mb-3" />
              <h4 className="text-base font-bold text-white mb-1.5">ບໍ່ສາມາດເປີດກ້ອງໄດ້</h4>
              <p className="text-xs text-slate-300 max-w-sm mb-5 leading-relaxed">{errorMsg}</p>
              <div className="flex flex-wrap items-center justify-center gap-2.5">
                <button
                  onClick={() => startCamera()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  ລອງໃໝ່ອີກຄັ້ງ
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer border border-slate-700"
                >
                  <Upload className="w-3.5 h-3.5" />
                  ເລືອກຮູບຈາກເຄື່ອງ
                </button>
              </div>
            </div>
          )}

          {/* Floating Controls over camera */}
          {isScanning && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-700/60 shadow-lg">
              {cameras.length > 1 && (
                <button
                  onClick={switchCamera}
                  className="p-2 rounded-full hover:bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
                  title="ປ່ຽນກ້ອງໜ້າ/ຫຼັງ"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              )}

              {hasTorch && (
                <button
                  onClick={toggleTorch}
                  className={`p-2 rounded-full transition-colors cursor-pointer ${
                    torchOn ? 'bg-amber-500 text-black' : 'hover:bg-slate-800 text-slate-300'
                  }`}
                  title="ເປີດ/ປິດ ໄຟແຟລັດ"
                >
                  {torchOn ? <Zap className="w-4 h-4 fill-current" /> : <ZapOff className="w-4 h-4" />}
                </button>
              )}

              {/* Upload image fallback */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-2 rounded-full hover:bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
                title="ອັບໂຫຼດຮູບພາບທີ່ມີບາໂຄ້ດ"
              >
                <Upload className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Hidden file input for photo upload */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>

        {/* Real-time Match Feedback Banner */}
        {lastScannedFeedback && (
          <div className="p-3 bg-slate-800 border-t border-slate-700/80 flex items-center justify-between animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className={`p-2 rounded-xl shrink-0 ${
                  lastScannedFeedback.product ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                }`}
              >
                {lastScannedFeedback.product ? <CheckCircle2 className="w-5 h-5" /> : <Package className="w-5 h-5" />}
              </div>
              <div className="min-w-0">
                <div className="font-bold text-xs truncate">
                  {lastScannedFeedback.product ? lastScannedFeedback.product.name : 'ພົບບາໂຄ້ດ (ບໍ່ມີໃນລະບົບ)'}
                </div>
                <div className="text-[11px] font-mono text-slate-400 truncate">
                  ລະຫັດ: <span className="text-white font-bold">{lastScannedFeedback.code}</span>
                  {lastScannedFeedback.product && (
                    <span className="text-emerald-400 ml-2 font-bold">
                      {lastScannedFeedback.product.retailPrice.toLocaleString()} ₭
                    </span>
                  )}
                </div>
              </div>
            </div>

            <span className="text-[10px] bg-emerald-600 text-white font-bold px-2 py-0.5 rounded-full shrink-0">
              ສະແກນແລ້ວ ✓
            </span>
          </div>
        )}

        {/* Footer with Scanned History */}
        <div className="p-3.5 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-xs">
          <div className="text-slate-400 text-[11px]">
            ສະແກນແລ້ວ: <strong className="text-white font-mono">{scannedHistory.length}</strong> ລາຍການ
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs cursor-pointer border border-slate-700"
            >
              ສຳເລັດ / ປິດກ້ອງ
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
