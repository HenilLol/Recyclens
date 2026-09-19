import React from 'react';
import { SecondaryMaterial, BatchComponent, UnresolvedFraction } from '../../types/recyclens.types.ts';
import { Layers, Scissors, AlertCircle, HelpCircle, ShieldCheck } from 'lucide-react';

interface CompositionBreakdownProps {
  composition?: BatchComponent[];
  unresolvedFraction?: UnresolvedFraction;
  secondaryMaterials?: SecondaryMaterial[];
  isFallback?: boolean;
}

const PALETTE_COLORS = [
  { bg: 'bg-emerald-500', text: 'text-emerald-400', border: 'border-emerald-500/30', lightBg: 'bg-emerald-500/10' },
  { bg: 'bg-cyan-500', text: 'text-cyan-400', border: 'border-cyan-500/30', lightBg: 'bg-cyan-500/10' },
  { bg: 'bg-indigo-500', text: 'text-indigo-400', border: 'border-indigo-500/30', lightBg: 'bg-indigo-500/10' },
  { bg: 'bg-purple-500', text: 'text-purple-400', border: 'border-purple-500/30', lightBg: 'bg-purple-500/10' },
  { bg: 'bg-amber-500', text: 'text-amber-400', border: 'border-amber-500/30', lightBg: 'bg-amber-500/10' },
];

export const CompositionBreakdown: React.FC<CompositionBreakdownProps> = ({
  composition,
  unresolvedFraction,
  secondaryMaterials = [],
  isFallback = false,
}) => {
  const hasComposition = composition && composition.length > 0;

  return (
    <div className="p-6 rounded-3xl hud-glass border border-slate-700/60 bg-hud-card/70 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2 text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
            <Layers className="w-4 h-4 text-cyan-400" />
            <span>{isFallback ? 'DEMONSTRATION COMPOSITION BASELINE' : 'ESTIMATED VISUAL COMPOSITION'}</span>
          </div>
          <span className="text-xs font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
            {isFallback
              ? 'Demo Archetype'
              : hasComposition
              ? `${composition.length} Material Stream${composition.length === 1 ? '' : 's'}`
              : `${secondaryMaterials.length} Sub-Components`}
          </span>
        </div>

        {isFallback && (
          <div className="mb-3 text-[11px] font-mono text-amber-400/90 bg-amber-500/10 p-2 rounded-xl border border-amber-500/20">
            Deterministic reference composition for demonstration archetype — not extracted from live visual inference.
          </div>
        )}

        {/* Proportional Visual Composition Bar */}
        {hasComposition && (
          <div className="my-4">
            <div className="text-[10px] font-mono text-slate-400 uppercase mb-1.5 flex items-center justify-between">
              <span>{isFallback ? 'Demonstration Share Distribution' : 'Visual Surface Area Share'}</span>
              <span className="text-slate-500">{isFallback ? 'Preset benchmark' : 'Photographic 2D estimate'}</span>
            </div>
            <div className="h-3.5 w-full rounded-full bg-slate-900 border border-slate-800 flex overflow-hidden p-0.5 space-x-0.5">
              {composition.map((comp, idx) => {
                const color = PALETTE_COLORS[idx % PALETTE_COLORS.length];
                return (
                  <div
                    key={idx}
                    style={{ width: `${comp.estimated_share_percent}%` }}
                    className={`h-full ${color.bg} rounded-sm transition-all relative group`}
                    title={`${comp.material}: ~${comp.estimated_share_percent}%`}
                  />
                );
              })}
              {unresolvedFraction && unresolvedFraction.estimated_share_percent > 0 && (
                <div
                  style={{ width: `${unresolvedFraction.estimated_share_percent}%` }}
                  className="h-full bg-slate-700 repeating-linear-stripes rounded-sm"
                  title={`Unresolved: ~${unresolvedFraction.estimated_share_percent}%`}
                />
              )}
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-[10px] font-mono">
              {composition.map((comp, idx) => {
                const color = PALETTE_COLORS[idx % PALETTE_COLORS.length];
                return (
                  <div key={idx} className="flex items-center space-x-1">
                    <span className={`w-2 h-2 rounded-full ${color.bg}`} />
                    <span className="text-slate-300 font-semibold">{comp.material}</span>
                    <span className={color.text}>~{comp.estimated_share_percent}%</span>
                  </div>
                );
              })}
              {unresolvedFraction && unresolvedFraction.estimated_share_percent > 0 && (
                <div className="flex items-center space-x-1">
                  <span className="w-2 h-2 rounded-full bg-slate-600" />
                  <span className="text-slate-400">Unresolved</span>
                  <span className="text-slate-400">~{unresolvedFraction.estimated_share_percent}%</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Multi-Material Component Cards */}
        {hasComposition ? (
          <div className="space-y-3 mt-3">
            {composition.map((comp, idx) => {
              const color = PALETTE_COLORS[idx % PALETTE_COLORS.length];
              return (
                <div
                  key={idx}
                  className={`p-3.5 rounded-2xl bg-slate-900/80 border ${color.border} flex flex-col space-y-2`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-slate-100">{comp.material}</span>
                        {comp.polymer_subtype && (
                          <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-1.5 py-0.5 rounded">
                            {comp.polymer_subtype}
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] font-mono text-slate-400 mt-0.5 flex items-center space-x-2">
                        <span>Confidence: {comp.confidence.toFixed(0)}%</span>
                        <span>•</span>
                        <span>Contam: {comp.contamination_percent.toFixed(0)}%</span>
                        <span>•</span>
                        <span>Yield: {comp.recoverability_score.toFixed(0)}/100</span>
                      </div>
                    </div>
                    <span className={`text-xs font-mono font-bold ${color.text} px-2 py-0.5 rounded-md ${color.lightBg} border ${color.border} flex-shrink-0`}>
                      ~{comp.estimated_share_percent}%
                    </span>
                  </div>

                  {/* Evidence & Separability */}
                  <div className="pt-2 border-t border-slate-800/80 space-y-1.5 text-[11px]">
                    {comp.visual_evidence && comp.visual_evidence.length > 0 && (
                      <div className="text-slate-300 flex items-start space-x-1.5">
                        <span className="text-emerald-400 font-bold flex-shrink-0">•</span>
                        <span className="text-slate-300 leading-snug">{comp.visual_evidence[0]}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-[10px] pt-1">
                      <span className="flex items-center space-x-1">
                        {comp.is_separable ? (
                          <>
                            <Scissors className="w-3 h-3 text-emerald-400" />
                            <span className="text-emerald-400 font-medium">Manually Separable</span>
                          </>
                        ) : (
                          <>
                            <ShieldCheck className="w-3 h-3 text-cyan-400" />
                            <span className="text-cyan-400 font-medium">Primary Stream / Matrix</span>
                          </>
                        )}
                      </span>

                      {comp.preparation_actions && comp.preparation_actions.length > 0 && (
                        <span className="text-slate-400 italic truncate max-w-[200px]">
                          Action: {comp.preparation_actions[0]}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Unresolved Fraction Card */}
            {unresolvedFraction && unresolvedFraction.estimated_share_percent > 0 && (
              <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1.5">
                    <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-xs font-semibold text-slate-300">Visually Unresolved Remainder</span>
                  </div>
                  <span className="text-xs font-mono font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                    ~{unresolvedFraction.estimated_share_percent}%
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  {unresolvedFraction.visual_reason}
                </p>
                <div className="text-[10px] font-mono text-slate-500">
                  Carries ₹0 baseline value until manual physical sortation at intake dock.
                </div>
              </div>
            )}
          </div>
        ) : secondaryMaterials.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500">
            No separable secondary attachments detected. Monomaterial composition.
          </div>
        ) : (
          /* Fallback for legacy secondary materials */
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
        💡 <strong>Yield Tip:</strong> Segregating separable sub-components prior to dispatch eliminates dock rejection penalties and maximizes realization per stream.
      </div>
    </div>
  );
};
