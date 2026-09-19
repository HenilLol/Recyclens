import React from 'react';
import { ShieldCheck, Info } from 'lucide-react';

interface PriceSourceDisclaimerProps {
  sourceLabel: string;
  disclaimer: string;
}

export const PriceSourceDisclaimer: React.FC<PriceSourceDisclaimerProps> = ({ sourceLabel, disclaimer }) => {
  return (
    <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800 text-xs space-y-2">
      <div className="flex items-center space-x-2 text-slate-300 font-mono text-[11px]">
        <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
        <span className="font-semibold text-slate-200">Pricing Data Attribution:</span>
        <span className="text-slate-400">{sourceLabel}</span>
      </div>

      <div className="flex items-start space-x-2 text-[11px] text-slate-400 leading-relaxed pl-6">
        <Info className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0 mt-0.5" />
        <span>
          <strong>Honest Benchmark Disclosure:</strong> {disclaimer}
        </span>
      </div>
    </div>
  );
};
