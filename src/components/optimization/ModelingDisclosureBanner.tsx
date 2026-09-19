import React from 'react';
import { Info, ShieldAlert } from 'lucide-react';

interface ModelingDisclosureBannerProps {
  customText?: string;
  isFallback?: boolean;
}

export const ModelingDisclosureBanner: React.FC<ModelingDisclosureBannerProps> = ({ customText, isFallback }) => {
  return (
    <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-slate-900/80 to-slate-950 border border-amber-500/30 text-xs text-amber-200/90 leading-relaxed space-y-1.5 shadow-lg">
      <div className="flex items-center space-x-2 font-mono font-bold uppercase tracking-wider text-amber-300">
        {isFallback ? <ShieldAlert className="w-4 h-4 text-amber-400" /> : <Info className="w-4 h-4 text-cyan-400" />}
        <span>{isFallback ? 'DEMONSTRATION SCENARIO PROJECTION NOTICE' : 'NON-NEGOTIABLE MODELING DISCLOSURE'}</span>
      </div>
      <p className="text-[11px] text-slate-300 font-sans">
        {customText ||
          'Scenario projections are illustrative calculations based on configurable assumptions and existing visual-share estimates. They are not measured post-preparation results, guaranteed market prices, or guaranteed recycler acceptance.'}
      </p>
      <div className="text-[10px] font-mono text-slate-400 pt-1 border-t border-amber-500/10">
        True post-preparation physical quality, density, moisture, and settlement price require operator sorting, operator scale weighment, and buyer intake grading.
      </div>
    </div>
  );
};
