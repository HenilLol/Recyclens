import React from 'react';
import { RecoverabilityInfo } from '../../types/recyclens.types.ts';
import { Sparkles, ArrowUpRight, Lightbulb, Wrench, CheckCircle2 } from 'lucide-react';

interface VisualReasoningBoxProps {
  recoverability: RecoverabilityInfo;
  recommendedPreparation?: string[];
}

export const VisualReasoningBox: React.FC<VisualReasoningBoxProps> = ({ recoverability, recommendedPreparation }) => {
  return (
    <div className="p-6 rounded-3xl hud-glass border border-slate-700/60 bg-hud-card/70 flex flex-col justify-between">
      <div>
        <div className="flex items-center space-x-2 text-xs font-mono font-bold uppercase tracking-wider text-slate-400 mb-3">
          <Lightbulb className="w-4 h-4 text-emerald-400" />
          <span>RECOVERY OPTIMIZATION & CIRCULAR PATHWAYS</span>
        </div>

        {/* Actionable Preparation Steps */}
        {recommendedPreparation && recommendedPreparation.length > 0 ? (
          <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-transparent border border-emerald-500/20 mb-4 space-y-2">
            <div className="text-[11px] font-mono font-semibold text-emerald-400 uppercase tracking-wider flex items-center space-x-1.5">
              <Wrench className="w-3.5 h-3.5" />
              <span>Recommended Pre-Dispatch Preparation</span>
            </div>
            <ul className="space-y-1.5 text-xs text-slate-200 font-medium">
              {recommendedPreparation.map((step, idx) => (
                <li key={idx} className="flex items-start space-x-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{step}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          /* Actionable Advice Box Fallback */
          <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-transparent border border-emerald-500/20 mb-4">
            <div className="text-[11px] font-mono font-semibold text-emerald-400 uppercase tracking-wider mb-1 flex items-center space-x-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Value-Maximizing Action</span>
            </div>
            <p className="text-xs text-slate-200 leading-relaxed font-medium">
              {recoverability.actionable_advice}
            </p>
          </div>
        )}

        {/* Downstream Applications */}
        {recoverability.potential_applications && recoverability.potential_applications.length > 0 && (
          <div>
            <div className="text-[11px] font-mono text-slate-400 mb-2 uppercase">
              Target Circular Manufacturing Applications:
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {recoverability.potential_applications.map((app, idx) => (
                <div
                  key={idx}
                  className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 flex items-center justify-between"
                >
                  <span>{app}</span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-cyan-400" />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-slate-800/60 text-[11px] font-mono text-slate-500 flex items-center justify-between">
        <span>Circularity Index: {recoverability.score}%</span>
        <span>RecycLens AI Intelligence</span>
      </div>
    </div>
  );
};
