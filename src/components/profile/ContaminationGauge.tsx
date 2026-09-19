import React from 'react';
import { ContaminationInfo } from '../../types/recyclens.types.ts';
import { getContaminationBadge } from '../../utils/formatters.ts';
import { AlertCircle, CheckCircle } from 'lucide-react';

interface ContaminationGaugeProps {
  contamination: ContaminationInfo;
  contaminationEvidence?: string[];
}

export const ContaminationGauge: React.FC<ContaminationGaugeProps> = ({ contamination, contaminationEvidence }) => {
  const badge = getContaminationBadge(contamination.severity);
  const percentage = Math.min(100, Math.max(0, contamination.percentage));

  return (
    <div className="p-6 rounded-3xl hud-glass border border-slate-700/60 bg-hud-card/70 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
              CONTAMINATION AUDIT
            </span>
          </div>
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold font-mono ${badge.bg} ${badge.color}`}>
            {badge.label}
          </span>
        </div>

        {/* Meter Gauge */}
        <div className="my-4">
          <div className="flex justify-between text-xs font-mono mb-1">
            <span className="text-slate-400">Contamination Ratio</span>
            <span className="text-amber-400 font-bold">{percentage.toFixed(1)}%</span>
          </div>

          <div className="w-full h-3 rounded-full bg-slate-900 border border-slate-800 overflow-hidden p-0.5">
            <div
              className={`h-full rounded-full transition-all duration-1000 ${
                percentage <= 10
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                  : percentage <= 30
                  ? 'bg-gradient-to-r from-emerald-500 via-amber-400 to-amber-500'
                  : 'bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500'
              }`}
              style={{ width: `${percentage}%` }}
            />
          </div>

          <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-1">
            <span>0% (Clean)</span>
            <span>25% (Moderate)</span>
            <span>50%+ (Heavy)</span>
          </div>
        </div>

        {/* Explanation text */}
        <p className="text-xs text-slate-300 leading-relaxed mt-3">
          {contamination.explanation}
        </p>

        {/* Contamination Evidence List */}
        {contaminationEvidence && contaminationEvidence.length > 0 && (
          <div className="mt-4 pt-3 border-t border-slate-800/80">
            <div className="text-[11px] font-mono text-amber-400 mb-2 font-semibold">
              CONTAMINATION EVIDENCE:
            </div>
            <ul className="space-y-1 text-xs text-slate-300">
              {contaminationEvidence.map((ev, idx) => (
                <li key={idx} className="flex items-start space-x-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
                  <span>{ev}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Visual Cue Indicators fallback if no evidence */}
        {(!contaminationEvidence || contaminationEvidence.length === 0) &&
          contamination.visual_indicators &&
          contamination.visual_indicators.length > 0 && (
            <div className="mt-4 pt-3 border-t border-slate-800/80">
              <div className="text-[11px] font-mono text-slate-400 mb-2">IDENTIFIED VISUAL CUES:</div>
              <div className="flex flex-wrap gap-1.5">
                {contamination.visual_indicators.map((cue, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-slate-300 flex items-center space-x-1"
                  >
                    <AlertCircle className="w-3 h-3 text-amber-400 flex-shrink-0" />
                    <span>{cue}</span>
                  </span>
                ))}
              </div>
            </div>
          )}
      </div>

      <div className="mt-4 pt-3 border-t border-slate-800/60 text-[11px] font-mono text-slate-400 flex items-center space-x-1.5">
        <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
        <span>Contamination penalty factor applied directly to valuation engine.</span>
      </div>
    </div>
  );
};
