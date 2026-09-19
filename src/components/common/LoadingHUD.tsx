import React from 'react';
import { useRecyclensStore } from '../../store/useRecyclensStore.ts';
import { Cpu, Eye, Radio, Sparkles } from 'lucide-react';

export const LoadingHUD: React.FC = () => {
  const { isAnalyzing, analysisStage, currentImage } = useRecyclensStore();

  if (!isAnalyzing) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 animate-fade-in">
      <div className="relative w-full max-w-lg p-6 rounded-2xl hud-glass border border-emerald-500/40 shadow-2xl shadow-emerald-500/20 flex flex-col items-center text-center overflow-hidden">
        {/* Ambient Top Glow */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 via-cyan-400 to-emerald-400 animate-pulse" />

        {/* Visual Scanner Frame */}
        <div className="relative w-48 h-48 rounded-xl overflow-hidden border-2 border-cyan-500/40 bg-slate-900 mb-6 shadow-inner flex items-center justify-center">
          {currentImage ? (
            <img src={currentImage} alt="Scanning target" className="w-full h-full object-cover opacity-60 filter brightness-90 contrast-125" />
          ) : (
            <Radio className="w-16 h-16 text-cyan-400/40 animate-pulse" />
          )}

          {/* Holographic Laser Scan Line */}
          <div className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_15px_#10b981] animate-scan-line" />

          {/* Corner HUD reticles */}
          <div className="absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 border-emerald-400" />
          <div className="absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 border-emerald-400" />
          <div className="absolute bottom-2 left-2 w-3 h-3 border-b-2 border-l-2 border-emerald-400" />
          <div className="absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 border-emerald-400" />

          {/* Central Target Glyph */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-16 h-16 rounded-full border border-cyan-400/30 animate-spin border-dashed" />
          </div>
        </div>

        {/* Telemetry Stage Readout */}
        <div className="flex items-center space-x-2 text-xs font-mono text-emerald-400 uppercase tracking-wider mb-2">
          <Sparkles className="w-4 h-4 animate-spin text-emerald-400" />
          <span>RECYCLENS NEURAL ENGINE ACTIVE</span>
        </div>

        <h3 className="text-lg font-bold text-slate-100 mb-2 font-['Outfit']">
          Generating Material Recovery Profile
        </h3>

        <p className="text-sm text-cyan-300/90 font-mono min-h-[1.5rem] animate-pulse">
          {analysisStage || 'Analyzing material spectrum and surface contamination...'}
        </p>

        {/* Progress Dots */}
        <div className="mt-6 flex space-x-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>

        {/* Footer Sub-indicator */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 w-full flex items-center justify-between text-[11px] font-mono text-slate-500">
          <span className="flex items-center space-x-1">
            <Cpu className="w-3 h-3 text-slate-400" />
            <span>Multi-Factor Yield Pipeline</span>
          </span>
          <span>MMR_VLM_NODE_01</span>
        </div>
      </div>
    </div>
  );
};
