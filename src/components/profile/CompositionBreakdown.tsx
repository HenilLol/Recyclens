import React from 'react';
import { SecondaryMaterial } from '../../types/recyclens.types.ts';
import { Layers, Scissors, AlertCircle } from 'lucide-react';

interface CompositionBreakdownProps {
  secondaryMaterials: SecondaryMaterial[];
}

export const CompositionBreakdown: React.FC<CompositionBreakdownProps> = ({ secondaryMaterials }) => {
  return (
    <div className="p-6 rounded-3xl hud-glass border border-slate-700/60 bg-hud-card/70 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2 text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
            <Layers className="w-4 h-4 text-cyan-400" />
            <span>SUB-COMPONENT BREAKDOWN</span>
          </div>
          <span className="text-xs font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
            {secondaryMaterials.length} Sub-Components
          </span>
        </div>

        {secondaryMaterials.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500">
            No separable secondary attachments detected. Monomaterial composition.
          </div>
        ) : (
          <div className="space-y-3 mt-4">
            {secondaryMaterials.map((mat, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-200">{mat.name}</span>
                  <span className="text-xs font-mono font-bold text-cyan-300">
                    ~{mat.percentage}%
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400 flex items-center space-x-1">
                    {mat.separable ? (
                      <>
                        <Scissors className="w-3 h-3 text-emerald-400" />
                        <span className="text-emerald-400 font-medium">Manually Separable</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-3 h-3 text-amber-400" />
                        <span className="text-amber-400 font-medium">Fused / Non-Separable</span>
                      </>
                    )}
                  </span>
                  {mat.notes && <span className="text-slate-400 italic">{mat.notes}</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-slate-800/60 text-[11px] text-slate-400 leading-relaxed">
        💡 <strong>Yield Tip:</strong> Removing separable attachments prior to dispatch increases the batch acceptance rate and eliminates MRF dock rejection penalties.
      </div>
    </div>
  );
};
