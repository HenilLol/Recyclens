import React, { useRef, useState } from 'react';
import { useRecyclensStore } from '../../store/useRecyclensStore.ts';
import { UploadCloud, Camera, Image as ImageIcon, X, AlertCircle } from 'lucide-react';

interface ImageDropzoneProps {
  onOpenLiveCamera: () => void;
}

export const ImageDropzone: React.FC<ImageDropzoneProps> = ({ onOpenLiveCamera }) => {
  const { currentImage, setImage, selectedPreset } = useRecyclensStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);

  const processFile = (file: File) => {
    setFileError(null);

    // Validate type
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setFileError('Please upload a valid JPEG, PNG, or WebP image.');
      return;
    }

    // Validate size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      setFileError('Image file is too large (max 10MB).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      if (typeof e.target?.result === 'string') {
        setImage(e.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  return (
    <div className="w-full">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
      />

      {fileError && (
        <div className="mb-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{fileError}</span>
        </div>
      )}

      {currentImage ? (
        <div className="relative group w-full h-80 rounded-2xl overflow-hidden border border-emerald-500/40 bg-slate-900/90 shadow-xl">
          <img
            src={currentImage}
            alt="Waste batch preview"
            className="w-full h-full object-cover filter brightness-95"
          />

          {/* Preset Overlay Tag if using a preset */}
          {selectedPreset && (
            <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-slate-900/80 backdrop-blur-md border border-cyan-500/40 text-xs font-medium text-cyan-300 flex items-center space-x-1.5 shadow-lg">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <span>Preset: {selectedPreset.title}</span>
            </div>
          )}

          {/* Remove / Replace Overlay Actions */}
          <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-4 backdrop-blur-xs">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-100 text-xs font-semibold border border-slate-600 flex items-center space-x-1.5 transition-transform hover:scale-105"
            >
              <ImageIcon className="w-4 h-4 text-cyan-400" />
              <span>Change Image</span>
            </button>
            <button
              type="button"
              onClick={() => setImage(null)}
              className="px-4 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-xs font-semibold border border-rose-500/40 flex items-center space-x-1.5 transition-transform hover:scale-105"
            >
              <X className="w-4 h-4" />
              <span>Remove</span>
            </button>
          </div>
        </div>
      ) : (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          className={`w-full h-80 rounded-2xl border-2 border-dashed transition-all flex flex-col items-center justify-center p-6 text-center cursor-pointer ${
            isDragOver
              ? 'border-emerald-400 bg-emerald-500/10 scale-[1.01]'
              : 'border-slate-700 hover:border-emerald-500/50 bg-hud-surface/40 hover:bg-hud-surface/70'
          }`}
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-4 group-hover:scale-110 transition-transform">
            <UploadCloud className="w-8 h-8" />
          </div>

          <h4 className="text-base font-semibold text-slate-200 mb-1 font-['Outfit']">
            Drop your waste batch photograph here
          </h4>
          <p className="text-xs text-slate-400 max-w-sm mb-4">
            Supports JPEG, PNG, or WebP. Take or upload a clear photo of bottles, cardboard, metal cans, or scrap.
          </p>

          <div className="flex items-center space-x-3" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs transition-all shadow-md shadow-emerald-500/20"
            >
              Browse Files
            </button>
            <span className="text-xs text-slate-500">or</span>
            <button
              type="button"
              onClick={onOpenLiveCamera}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs flex items-center space-x-1.5 transition-all"
            >
              <Camera className="w-3.5 h-3.5 text-cyan-400" />
              <span>Use Camera</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
