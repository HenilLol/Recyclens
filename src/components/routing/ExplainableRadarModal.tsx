import React from 'react';
import { useRecyclensStore } from '../../store/useRecyclensStore.ts';
import { X, Radar, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';

export const ExplainableRadarModal: React.FC = () => {
  const { selectedRecyclerForRadar, closeRadarModal } = useRecyclensStore();

  if (!selectedRecyclerForRadar) return null;

  const { recycler, is_eligible, total_score, scorecard, match_reasons, warnings } = selectedRecyclerForRadar;

  const dimensions = [
    { label: 'Material Compatibility', weight: '35%', score: scorecard.material_compatibility, desc: is_eligible ? 'Intake specification match for primary polymer/material' : 'Facility does NOT accept this material as intake' },
    { label: 'Quantity Threshold Fit', weight: '20%', score: scorecard.quantity_compatibility, desc: `Evaluated against facility minimum requirement of ${recycler.min_batch_weight_kg}kg` },
    { label: 'Contamination Tolerance', weight: '15%', score: scorecard.contamination_tolerance, desc: `Evaluated against facility limit of ${recycler.max_contamination_tolerance}%` },
    { label: 'Proximity & Logistics', weight: '15%', score: scorecard.distance_score, desc: `Distance efficiency within regional service radius` },
    { label: 'Pickup Availability', weight: '10%', score: scorecard.pickup_availability, desc: `Doorstep on-demand collection availability` },
    { label: 'Archetype Readiness', weight: '5%', score: scorecard.verification_score, desc: `Standard simulation archetype verification status` },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fade-in">
      <div className="relative w-full max-w-xl rounded-3xl hud-glass border border-cyan-500/40 bg-hud-card p-6 shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Radar className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100 font-['Outfit']">
                Explainable Match Compatibility Radar
              </h3>
              <p className="text-[11px] text-slate-400">
                Transparent multi-factor scoring for {recycler.name}
              </p>
            </div>
          </div>
          <button
            onClick={closeRadarModal}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Overall Score Badge */}
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center justify-between mb-5">
          <div>
            <div className="text-xs font-mono text-slate-400 uppercase">Composite Weighted Match Fit</div>
            <div className={`text-2xl font-black font-mono ${is_eligible ? 'text-emerald-400' : 'text-slate-400'}`}>
              {total_score}% Score {is_eligible ? '(Eligible)' : '(Incompatible)'}
            </div>
          </div>
          <div className="text-right text-xs font-mono text-slate-400">
            <div>Algorithm: RecycLens 6-Factor Radar</div>
            <div className="text-cyan-400 font-semibold">Explainable Heuristics</div>
          </div>
        </div>

        {/* 6 Dimension Scorecards */}
        <div className="space-y-3 mb-6">
          {dimensions.map((dim, idx) => (
            <div key={idx} className="p-3 rounded-xl bg-slate-900/50 border border-slate-800/80">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-semibold text-slate-200">{dim.label}</span>
                <span className="font-mono text-slate-400">
                  Weight: <strong className="text-cyan-400">{dim.weight}</strong> | Score: <strong className="text-slate-100">{dim.score}%</strong>
                </span>
              </div>

              {/* Mini Bar */}
              <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden mb-1">
                <div
                  className={`h-full rounded-full ${
                    dim.score >= 80 ? 'bg-emerald-400' : dim.score >= 50 ? 'bg-cyan-400' : 'bg-amber-400'
                  }`}
                  style={{ width: `${dim.score}%` }}
                />
              </div>

              <div className="text-[11px] text-slate-400">{dim.desc}</div>
            </div>
          ))}
        </div>

        {/* Match Reasons */}
        {match_reasons && match_reasons.length > 0 && (
          <div className="mb-4">
            <div className="text-xs font-mono text-emerald-400 uppercase mb-2 flex items-center space-x-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Positive Match Factors:</span>
            </div>
            <ul className="space-y-1 pl-4 text-xs text-slate-300 list-disc">
              {match_reasons.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Warnings */}
        {warnings && warnings.length > 0 && (
          <div className="mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <div className="text-xs font-mono text-amber-400 uppercase mb-1 flex items-center space-x-1">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Potential Operational Constraints:</span>
            </div>
            <ul className="space-y-1 pl-4 text-xs text-amber-200 list-disc">
              {warnings.map((w, i) => (
                <li key={i}>{w}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="pt-4 border-t border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={closeRadarModal}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 font-semibold"
          >
            Close Breakdown
          </button>
        </div>
      </div>
    </div>
  );
};
