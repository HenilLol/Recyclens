import React from 'react';
import { useRecyclensStore } from '../../store/useRecyclensStore.ts';
import { CheckCircle2, AlertTriangle, ShieldCheck, Sparkles, Edit3, Cpu, Info } from 'lucide-react';
import { getGradeBadge } from '../../utils/formatters.ts';

export const RecoveryProfileCard: React.FC = () => {
  const { analysisResult, openHITLModal } = useRecyclensStore();

  if (!analysisResult) return null;

  const { recovery_profile, telemetry } = analysisResult;
  const { primary_material, recoverability, is_fallback_inference } = recovery_profile;
  const grade = getGradeBadge(recoverability.grade);

  return (
    <div className="p-6 rounded-3xl hud-glass border border-emerald-500/30 bg-hud-card/90 shadow-2xl relative overflow-hidden">
      {/* Ambient Top Glow */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500" />

      {/* Fallback Mode Banner if Active */}
      {is_fallback_inference && (
        <div className="mb-4 py-2 px-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-mono flex items-center justify-between">
          <span className="flex items-center space-x-1.5">
            <Info className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
            <span>Demo fallback mode active — Visual AI unavailable / using preset baseline profile</span>
          </span>
          <span className="text-[10px] uppercase px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300">
            Demo Fallback
          </span>
        </div>
      )}

      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              PRIMARY MATERIAL DETECTED
            </span>
            <span className="text-xs font-mono text-slate-500">
              ID: {recovery_profile.id.substring(0, 12)}
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-100 mt-1 font-['Outfit']">
            {primary_material.name}
          </h2>

          {primary_material.polymer_subtype && (
            <p className="text-xs font-mono text-cyan-400 mt-0.5">
              Polymer Specification: {primary_material.polymer_subtype}
            </p>
          )}
        </div>

        {/* Confidence Gauge Box with Honest Label */}
        <div className="flex items-center space-x-3 bg-slate-900/80 p-3 rounded-2xl border border-slate-800 flex-shrink-0">
          <div className="text-right">
            <div className="text-[10px] font-mono uppercase text-slate-400">Model-Estimated Visual Confidence</div>
            <div className="text-2xl font-black font-mono text-emerald-400 flex items-center justify-end space-x-1">
              <span>{primary_material.confidence.toFixed(1)}%</span>
            </div>
            <div className="text-[9px] font-mono text-slate-500 max-w-[160px] text-right">
              Qualitative visual estimate, not calibrated probability
            </div>
          </div>
          <div className="w-12 h-12 rounded-full border-4 border-emerald-500/20 border-t-emerald-400 flex items-center justify-center font-mono text-xs font-bold text-emerald-300">
            {primary_material.confidence >= 80 ? (
              <ShieldCheck className="w-6 h-6 text-emerald-400" />
            ) : (
              <AlertTriangle className="w-6 h-6 text-amber-400" />
            )}
          </div>
        </div>
      </div>

      {/* Main Grid: Recoverability & Commercial Viability */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-5">
        {/* Metric 1: Quality Grade */}
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80">
          <div className="text-[11px] font-mono text-slate-400 mb-1">RECOVERABILITY GRADE</div>
          <div className="flex items-center space-x-2">
            <span className={`px-2.5 py-1 rounded-lg text-xs font-bold font-mono border ${grade.bg} ${grade.color} ${grade.border}`}>
              {grade.label}
            </span>
          </div>
          <div className="mt-2 text-xs text-slate-400">
            Yield Rating: <strong className="text-slate-200 font-mono">{recoverability.score}/100</strong>
          </div>
        </div>

        {/* Metric 2: Commercial Viability */}
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80">
          <div className="text-[11px] font-mono text-slate-400 mb-1">MARKET RECOVERY STATUS</div>
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            <span className="text-sm font-bold text-slate-200 font-['Outfit']">
              {recoverability.is_commercially_viable ? 'Commercially Viable' : 'Specialized Route Required'}
            </span>
          </div>
          <div className="mt-2 text-xs text-slate-400">
            Intake accepted across regional remanufacturing archetypes.
          </div>
        </div>

        {/* Metric 3: AI Engine & Model Attribution */}
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex flex-col justify-between">
          <div>
            <div className="text-[11px] font-mono text-slate-400 mb-1">INFERENCE PIPELINE</div>
            <div className="flex items-center space-x-1.5 text-xs font-mono font-semibold text-cyan-300">
              <Cpu className="w-3.5 h-3.5 text-cyan-400" />
              <span>{telemetry.ai_engine}</span>
            </div>
          </div>
          <div className="text-[10px] font-mono text-slate-500 mt-2">
            Latency: {telemetry.processing_time_ms}ms • Schema Enforced
          </div>
        </div>
      </div>

      {/* Visual Explanation Summary */}
      <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800/60 text-xs text-slate-300 flex items-start space-x-3 mb-5">
        <Sparkles className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong className="text-slate-100">Visual Synthesis: </strong>
          {recovery_profile.visual_explanation}
        </p>
      </div>

      {/* Recovery Evidence Chain: Observed vs Unknown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
        {/* 1. Observed Visual Evidence */}
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-emerald-500/20 bg-emerald-500/5">
          <div className="flex items-center space-x-2 text-[11px] font-mono font-bold uppercase tracking-wider text-emerald-400 mb-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Observed Visual Evidence</span>
          </div>
          {recovery_profile.visual_evidence && recovery_profile.visual_evidence.length > 0 ? (
            <ul className="space-y-1.5 text-xs text-slate-300">
              {recovery_profile.visual_evidence.map((ev, idx) => (
                <li key={idx} className="flex items-start space-x-2">
                  <span className="text-emerald-400 font-bold mt-0.5">•</span>
                  <span className="leading-relaxed">{ev}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-slate-400">Direct visual inspection completed.</p>
          )}
        </div>

        {/* 2. Uncertainty & Visual Limits */}
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-amber-500/20 bg-amber-500/5">
          <div className="flex items-center space-x-2 text-[11px] font-mono font-bold uppercase tracking-wider text-amber-400 mb-2">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span>Uncertainty & Boundaries</span>
          </div>
          {recovery_profile.uncertainty && recovery_profile.uncertainty.length > 0 ? (
            <ul className="space-y-1.5 text-xs text-amber-200/90">
              {recovery_profile.uncertainty.map((unc, idx) => (
                <li key={idx} className="flex items-start space-x-2">
                  <span className="text-amber-400 font-bold mt-0.5">•</span>
                  <span className="leading-relaxed">{unc}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-slate-400">Standard photographic inspection boundaries apply.</p>
          )}
        </div>
      </div>

      {/* Human-in-the-Loop Verification Action */}
      <div className="mt-5 pt-4 border-t border-slate-800 flex items-center justify-between">
        <div className="text-xs text-slate-400">
          Notice a discrepancy? Provide feedback to log manual batch corrections.
        </div>
        <button
          type="button"
          onClick={openHITLModal}
          className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 hover:border-slate-600 flex items-center space-x-1.5 transition-all"
        >
          <Edit3 className="w-3.5 h-3.5 text-emerald-400" />
          <span>Verify / Correct Material</span>
        </button>
      </div>
    </div>
  );
};
