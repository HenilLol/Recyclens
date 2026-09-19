import React from 'react';
import { useRecyclensStore } from '../../store/useRecyclensStore.ts';
import { Recycle, Sparkles, RefreshCw, Cpu, Activity } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { currentStep, analysisResult, resetToScan, serverHealth } = useRecyclensStore();

  return (
    <header className="sticky top-0 z-40 w-full hud-glass border-b border-hud-border/80 bg-[#080C14]/90">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo & Tagline */}
        <div className="flex items-center space-x-3 cursor-pointer" onClick={resetToScan}>
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border border-emerald-500/40 hud-glow-emerald">
            <Recycle className="w-6 h-6 text-emerald-400 animate-pulse-slow" />
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent font-['Outfit']">
                RecycLens
              </span>
              <span className="px-1.5 py-0.5 text-[10px] font-mono font-semibold uppercase tracking-wider rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                v1.0 MVP
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium hidden sm:block">
              Material Recovery Intelligence Platform
            </p>
          </div>
        </div>

        {/* Telemetry Status Badge */}
        <div className="hidden md:flex items-center space-x-4">
          <div className="flex items-center space-x-2 px-3 py-1 rounded-full bg-slate-900/80 border border-slate-800 text-xs font-mono">
            <Activity className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span className="text-slate-400">STATUS:</span>
            <span className="text-emerald-400 font-semibold">
              {serverHealth?.ai_vision_configured ? 'GEMINI VLM ONLINE' : 'DEMO FALLBACK READY'}
            </span>
          </div>

          <div className="flex items-center space-x-2 px-3 py-1 rounded-full bg-slate-900/80 border border-slate-800 text-xs font-mono">
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-slate-400">CLUSTER:</span>
            <span className="text-cyan-400 font-semibold">MUMBAI_MMR</span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-3">
          {analysisResult && (
            <button
              onClick={resetToScan}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium text-slate-300 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 hover:text-white transition-all shadow-sm"
              title="Start a new waste batch scan"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>New Scan</span>
            </button>
          )}

          <div className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center space-x-1.5 text-xs text-emerald-300 font-medium">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">24H Hackathon Demo</span>
            <span className="sm:hidden">Demo</span>
          </div>
        </div>
      </div>
    </header>
  );
};
