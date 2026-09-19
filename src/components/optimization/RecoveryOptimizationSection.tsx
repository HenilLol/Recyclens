import React, { useState } from 'react';
import { useRecyclensStore } from '../../store/useRecyclensStore.ts';
import { ActionEvidenceChainCard } from './ActionEvidenceChainCard.tsx';
import { ScenarioComparisonTable } from './ScenarioComparisonTable.tsx';
import { ModelingDisclosureBanner } from './ModelingDisclosureBanner.tsx';
import {
  Sparkles,
  Layers,
  Wrench,
  TrendingUp,
  ArrowRight,
  ShieldAlert,
  Sliders,
  CheckCircle2,
} from 'lucide-react';

export const RecoveryOptimizationSection: React.FC = () => {
  const { analysisResult, selectedScenarioId, setSelectedScenarioId, openHITLModal } = useRecyclensStore();

  if (!analysisResult || !analysisResult.optimization_scenarios || analysisResult.optimization_scenarios.length === 0) {
    return null;
  }

  const { recovery_profile, valuation, optimization_scenarios, optimization_comparison } = analysisResult;

  // Default to RECOMMENDED_PREPARATION if no scenario is explicitly selected
  const activeScenarioId =
    selectedScenarioId ||
    optimization_scenarios.find((s) => s.scenario_type === 'RECOMMENDED_PREPARATION')?.scenario_id ||
    optimization_scenarios[0].scenario_id;

  const activeScenario =
    optimization_scenarios.find((s) => s.scenario_id === activeScenarioId) || optimization_scenarios[0];

  return (
    <section className="space-y-6 pt-2">
      {/* Section Header */}
      <div className="p-6 rounded-3xl hud-glass border border-cyan-500/30 bg-gradient-to-r from-slate-950 via-slate-900 to-[#0B132B] shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center space-x-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-cyan-300">
                PHASE 4 • RECOVERY OPTIMIZATION & WHAT-IF INTELLIGENCE
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-100 font-['Outfit'] tracking-tight">
              Pre-Treatment What-If Scenario Modeling
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
              Explore how targeted pre-dispatch interventions (drainage, decontamination, or stream segregation) model indicative improvements in net realization, recoverability grade, and facility routing compatibility.
            </p>
          </div>

          <button
            type="button"
            onClick={openHITLModal}
            className="px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-xs font-mono font-semibold text-slate-200 flex items-center space-x-2 transition-all flex-shrink-0 self-start sm:self-center hover:border-cyan-500/50"
          >
            <Sliders className="w-4 h-4 text-cyan-400" />
            <span>Verify / Apply Preparation (HITL)</span>
          </button>
        </div>

        {/* Current Batch State Summary Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 text-xs font-mono">
          <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase block mb-0.5">Observed Contamination</span>
            <span className="text-sm font-bold text-amber-300">
              {recovery_profile.contamination.percentage}%
            </span>
            <span className="text-[10px] text-slate-500 block">({recovery_profile.contamination.severity})</span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase block mb-0.5">Recoverability Baseline</span>
            <span className="text-sm font-bold text-cyan-300">
              {recovery_profile.recoverability.score}/100
            </span>
            <span className="text-[10px] text-slate-500 block">({recovery_profile.recoverability.grade})</span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase block mb-0.5">Indicative Benchmark Yield</span>
            <span className="text-sm font-bold text-emerald-400">
              ₹{valuation.indicative_net_range.min} – ₹{valuation.indicative_net_range.max}
            </span>
            <span className="text-[10px] text-slate-500 block">
              (~{valuation.batch_weight_kg}kg {valuation.is_user_specified_weight ? 'scale weight' : 'illustrative'})
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase block mb-0.5">Stream Complexity</span>
            <span className="text-sm font-bold text-purple-300">
              {recovery_profile.composition?.length || 1} Stream{((recovery_profile.composition?.length || 1) > 1) ? 's' : ''}
            </span>
            <span className="text-[10px] text-slate-500 block">
              {recovery_profile.recovery_decision?.routing_strategy.replace('_', ' ') || 'SINGLE FACILITY'}
            </span>
          </div>
        </div>
      </div>

      {/* Scenario Selector Tabs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {optimization_scenarios.map((scen) => {
          const isSelected = scen.scenario_id === activeScenario.scenario_id;
          const isRecommended = scen.scenario_type === 'RECOMMENDED_PREPARATION';
          const isMax = scen.scenario_type === 'MAXIMUM_SEPARATION';

          return (
            <button
              key={scen.scenario_id}
              type="button"
              onClick={() => setSelectedScenarioId(scen.scenario_id)}
              className={`p-4 rounded-2xl border text-left transition-all duration-200 flex flex-col justify-between ${
                isSelected
                  ? isRecommended
                    ? 'bg-emerald-500/10 border-emerald-500/60 shadow-lg shadow-emerald-500/10'
                    : isMax
                    ? 'bg-purple-500/10 border-purple-500/60 shadow-lg shadow-purple-500/10'
                    : 'bg-cyan-500/10 border-cyan-500/60 shadow-lg shadow-cyan-500/10'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 opacity-80 hover:opacity-100'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span
                    className={`text-[9px] font-mono uppercase px-2 py-0.5 rounded font-bold ${
                      scen.effort_level === 'LOW'
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                        : scen.effort_level === 'MEDIUM'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                    }`}
                  >
                    {scen.effort_level === 'LOW'
                      ? 'LOW EFFORT'
                      : scen.effort_level === 'MEDIUM'
                      ? 'MODERATE EFFORT'
                      : 'HIGH EFFORT'}
                  </span>

                  {isRecommended && (
                    <span className="text-[9px] font-mono text-emerald-400 font-bold flex items-center space-x-1">
                      <Sparkles className="w-3 h-3" />
                      <span>BEST VALUE</span>
                    </span>
                  )}
                </div>

                <h3 className="text-sm font-bold text-slate-100 font-sans tracking-tight mb-1">
                  {scen.title}
                </h3>
                <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed font-sans mb-3">
                  {scen.description}
                </p>
              </div>

              {/* Projected Outcome Key Metric */}
              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono">
                <span className="text-slate-400">Projected Yield:</span>
                <span className="font-bold text-emerald-400">
                  ~₹{scen.modeled_state.projected_indicative_net_range.min} – ₹{scen.modeled_state.projected_indicative_net_range.max}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Scenario Active Detail Panel */}
      <div className="p-6 rounded-3xl hud-glass border border-slate-800 bg-slate-900/40 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center space-x-2">
              <Wrench className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-slate-200">
                ACTIVE SCENARIO: {activeScenario.title}
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-1 font-sans">{activeScenario.description}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center space-x-1.5 text-[10px] font-mono text-slate-400 bg-slate-950 px-2.5 py-1 rounded-xl border border-slate-800">
              <span>Origin:</span>
              <span className="font-bold text-cyan-300">SCENARIO_PROJECTED</span>
            </div>
            <div className="flex items-center space-x-1.5 text-[10px] font-mono text-slate-400 bg-slate-950 px-2.5 py-1 rounded-xl border border-slate-800">
              <span>Basis:</span>
              <span className="font-bold text-purple-300">ILLUSTRATIVE_ASSUMPTION</span>
            </div>
          </div>
        </div>

        {/* Modeled Metric Callouts Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col justify-between">
            <span className="text-[10px] font-mono text-slate-400 uppercase">Projected Contamination</span>
            <div className="my-1 flex items-baseline space-x-2">
              <span className="text-lg font-mono font-bold text-emerald-400">
                ~{activeScenario.modeled_state.projected_contamination_percentage}%
              </span>
              <span className="text-xs font-mono text-slate-500 line-through">
                {activeScenario.current_state_reference.contamination_percentage}%
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-sans">
              Modeled reduction of ~{Math.round(activeScenario.current_state_reference.contamination_percentage - activeScenario.modeled_state.projected_contamination_percentage)}%
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col justify-between">
            <span className="text-[10px] font-mono text-slate-400 uppercase">Projected Recoverability</span>
            <div className="my-1 flex items-baseline space-x-2">
              <span className="text-lg font-mono font-bold text-cyan-400">
                ~{activeScenario.modeled_state.projected_recoverability_score}
              </span>
              <span className="text-xs font-mono text-cyan-300 font-bold">
                ({activeScenario.modeled_state.projected_recoverability_grade})
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-sans">
              Baseline: {activeScenario.current_state_reference.recoverability_score} ({activeScenario.current_state_reference.recoverability_grade})
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col justify-between">
            <span className="text-[10px] font-mono text-slate-400 uppercase">Projected Benchmark Yield</span>
            <div className="my-1 text-lg font-mono font-bold text-emerald-400">
              ~₹{activeScenario.modeled_state.projected_indicative_net_range.min} – ₹{activeScenario.modeled_state.projected_indicative_net_range.max}
            </div>
            <span className="text-[10px] text-slate-400 font-sans">
              Penalty deduction: -₹{activeScenario.modeled_state.projected_contamination_penalty}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col justify-between">
            <span className="text-[10px] font-mono text-slate-400 uppercase">Projected Routing Strategy</span>
            <div className="my-1 text-xs font-mono font-bold text-purple-300 uppercase">
              {activeScenario.routing_effect.strategy.replace('_', ' ')}
            </div>
            <span className="text-[10px] text-slate-400 font-sans leading-tight">
              {activeScenario.routing_effect.rationale}
            </span>
          </div>
        </div>

        {/* Economic Effect Statement */}
        <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs font-sans text-emerald-300 flex items-start space-x-2">
          <TrendingUp className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong className="font-mono uppercase text-[10px] block text-emerald-400">Modeled Economic Impact:</strong>
            {activeScenario.economic_effect}
          </div>
        </div>

        {/* Action Evidence Chains */}
        <div>
          <div className="flex items-center space-x-2 mb-3">
            <CheckCircle2 className="w-4 h-4 text-cyan-400" />
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
              RECOMMENDED PREPARATION ACTIONS & EVIDENCE CHAINS ({activeScenario.actions.length})
            </h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {activeScenario.actions.map((act, idx) => (
              <ActionEvidenceChainCard key={act.action_id || idx} action={act} index={idx} />
            ))}
          </div>
        </div>

        {/* Explicit Assumptions & Uncertainties Drawer */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 text-xs space-y-2">
            <span className="text-[10px] font-mono uppercase font-bold text-purple-300 block">
              Explicit Scenario Assumptions
            </span>
            <ul className="space-y-1.5 text-[11px] text-slate-300 list-disc list-inside font-sans leading-relaxed">
              {activeScenario.assumptions.map((ass, i) => (
                <li key={i}>{ass}</li>
              ))}
            </ul>
            {activeScenario.modeling_coefficients && (
              <div className="mt-2 pt-2 border-t border-slate-800/80 text-[10px] font-mono text-slate-400">
                <span className="text-cyan-400 font-bold">Model Coefficients: </span>
                {Math.round(activeScenario.modeling_coefficients.contamination_reduction_coefficient * 100)}% relative reduction assumption • {Math.round(activeScenario.modeling_coefficients.recoverability_headroom_coefficient * 100)}% headroom capture • {activeScenario.modeling_coefficients.contamination_floor}% floor limit
              </div>
            )}
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 text-xs space-y-2">
            <span className="text-[10px] font-mono uppercase font-bold text-amber-300 block">
              Unconfirmed Variables & Uncertainties
            </span>
            <ul className="space-y-1.5 text-[11px] text-slate-300 list-disc list-inside font-sans leading-relaxed">
              {activeScenario.uncertainties.map((unc, i) => (
                <li key={i}>{unc}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Side-by-Side Comparison Table */}
      {optimization_comparison && (
        <ScenarioComparisonTable
          comparison={optimization_comparison}
          scenarios={optimization_scenarios}
          selectedScenarioId={activeScenario.scenario_id}
          onSelectScenario={(id) => setSelectedScenarioId(id)}
        />
      )}

      {/* Modeling Disclosure Banner */}
      <ModelingDisclosureBanner
        isFallback={activeScenario.is_fallback_demo}
        customText={optimization_comparison?.modeling_disclosure}
      />
    </section>
  );
};
