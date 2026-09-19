import React from 'react';
import { TrendingUp, ShieldCheck, Zap } from 'lucide-react';

export const TopbarHUD: React.FC = () => {
  return (
    <div className="w-full bg-[#060910] border-b border-hud-border/40 py-1.5 px-4 overflow-x-auto text-[11px] font-mono text-slate-400">
      <div className="max-w-7xl mx-auto flex items-center justify-between space-x-6 min-w-max">
        {/* Left: Operational Paradigm */}
        <div className="flex items-center space-x-2">
          <Zap className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-slate-300 font-semibold">PARADIGM:</span>
          <span className="text-emerald-400 font-medium">SCAN</span>
          <span className="text-slate-600">→</span>
          <span className="text-cyan-400 font-medium">UNDERSTAND</span>
          <span className="text-slate-600">→</span>
          <span className="text-amber-400 font-medium">VALUE</span>
          <span className="text-slate-600">→</span>
          <span className="text-purple-400 font-medium">RECOVER</span>
        </div>

        {/* Center: Scrap Market Ticker */}
        <div className="flex items-center space-x-4">
          <span className="flex items-center space-x-1">
            <TrendingUp className="w-3 h-3 text-emerald-400" />
            <span className="text-slate-400">PET:</span>
            <span className="text-slate-200">₹32-38.5/kg</span>
          </span>
          <span className="text-slate-700">|</span>
          <span>
            <span className="text-slate-400">HDPE:</span>
            <span className="text-slate-200">₹42-49/kg</span>
          </span>
          <span className="text-slate-700">|</span>
          <span>
            <span className="text-slate-400">OCC:</span>
            <span className="text-slate-200">₹11.5-15/kg</span>
          </span>
          <span className="text-slate-700">|</span>
          <span>
            <span className="text-slate-400">ALU UBC:</span>
            <span className="text-emerald-300 font-semibold">₹115-135/kg</span>
          </span>
          <span className="text-slate-700">|</span>
          <span>
            <span className="text-slate-400">E-WASTE PCB:</span>
            <span className="text-purple-300 font-semibold">₹180-260/kg</span>
          </span>
        </div>

        {/* Right: Security & Network Guarantee */}
        <div className="flex items-center space-x-1.5 text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>6 Demo Archetypes Configured • Indicative Benchmarks</span>
        </div>
      </div>
    </div>
  );
};
