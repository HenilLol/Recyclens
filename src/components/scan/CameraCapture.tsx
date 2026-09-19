import React, { useRef, useState, useEffect } from 'react';
import { Camera, X, RefreshCw, AlertCircle } from 'lucide-react';

interface CameraCaptureProps {
  onCapture: (dataUrl: string) => void;
  onClose: () => void;
}

export const CameraCapture: React.FC<CameraCaptureProps> = ({ onCapture, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');

  useEffect(() => {
    let currentStream: MediaStream | null = null;

    async function startCamera() {
      try {
        setCameraError(null);
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: facingMode,
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });
        currentStream = mediaStream;
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (err: any) {
        console.error('Camera access error:', err);
        setCameraError('Unable to access webcam. Please verify browser camera permissions.');
      }
    }

    startCamera();

    return () => {
      if (currentStream) {
        currentStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [facingMode]);

  const handleSnap = () => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      onCapture(dataUrl);
      onClose();
    }
  };

  const toggleCamera = () => {
    setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
      <div className="relative w-full max-w-xl rounded-2xl hud-glass border border-cyan-500/40 p-4 shadow-2xl flex flex-col items-center">
        {/* Header */}
        <div className="w-full flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
          <div className="flex items-center space-x-2 text-sm font-semibold text-slate-200">
            <Camera className="w-4 h-4 text-cyan-400" />
            <span>Waste Batch Live Camera Viewport</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {cameraError ? (
          <div className="w-full py-12 px-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex flex-col items-center text-center space-y-3">
            <AlertCircle className="w-8 h-8 text-rose-400" />
            <span>{cameraError}</span>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 font-semibold"
            >
              Close & Use File Upload
            </button>
          </div>
        ) : (
          <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-slate-950 border border-slate-700">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />

            {/* Target Reticle Overlay */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="w-44 h-44 rounded-xl border border-cyan-400/40 border-dashed" />
            </div>

            {/* Controls Bar */}
            <div className="absolute bottom-4 left-0 right-0 flex items-center justify-center space-x-4">
              <button
                type="button"
                onClick={toggleCamera}
                className="p-3 rounded-full bg-slate-900/80 hover:bg-slate-800 text-slate-200 border border-slate-700 backdrop-blur-md transition-transform active:scale-95"
                title="Flip Camera"
              >
                <RefreshCw className="w-5 h-5 text-cyan-400" />
              </button>

              <button
                type="button"
                onClick={handleSnap}
                className="w-16 h-16 rounded-full bg-emerald-500 hover:bg-emerald-400 border-4 border-slate-950 shadow-lg shadow-emerald-500/40 flex items-center justify-center text-slate-950 transition-transform active:scale-90"
                title="Capture Photo"
              >
                <Camera className="w-7 h-7" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
