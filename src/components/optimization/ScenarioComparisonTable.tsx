import React from 'react';
import { OptimizationComparison, OptimizationScenario } from '../../types/recyclens.types.ts';
import { Layers, ArrowUpRight, TrendingUp } from 'lucide-react';

interface ScenarioComparisonTableProps {
  comparison: OptimizationComparison;
  scenarios: OptimizationScenario[];
  selectedScenarioId?: string | null;
  onSelectScenario?: (id: string) => void;
}

export const ScenarioComparisonTable: React.FC<ScenarioComparisonTableProps> = ({
  comparison,
  scenarios,
  selectedScenarioId,
  onSelectScenario,
}) => {
  const minimal = scenarios.find((s) => s.scenario_type === 'MINIMAL_PREPARATION');
  const recommended = scenarios.find((s) => s.scenario_type === 'RECOMMENDED_PREPARATION');
  const maximum = scenarios.find((s) => s.scenario_type === 'MAXIMUM_SEPARATION');

  return (
    <div className="p-4 sm:p-6 rounded-3xl hud-glass border border-slate-800 shadow-xl overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-800 mb-4">
        <div className="flex items-center space-x-2">
          <Layers className="w-4 h-4 text-cyan-400" />
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
            SCENARIO PROJECTION COMPARISON MATRIX
          </h3>
        </div>
        <div className="text-[10px] font-mono text-slate-400">
          Click scenario column header to view detailed intervention plan
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-800 text-[10px] font-mono uppercase tracking-wider text-slate-400">
              <th className="py-3 px-3">Recovery Metric</th>
              <th className="py-3 px-3 bg-slate-900/40">
                <div className="flex items-center space-x-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                  <span className="font-bold text-slate-200">Current State</span>
                </div>
                <div className="text-[9px] text-slate-500 font-normal">
                  Origin: {comparison.current_state_summary.data_origin}
                </div>
              </th>

              {minimal && (
                <th
                  onClick={() => onSelectScenario && onSelectScenario(minimal.scenario_id)}
                  className={`py-3 px-3 cursor-pointer transition-colors ${
                    selectedScenarioId === minimal.scenario_id ? 'bg-cyan-500/10 border-t-2 border-cyan-400' : 'hover:bg-slate-900/40'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-cyan-300">Minimal Prep</span>
                    <span className="text-[8px] bg-slate-800 text-slate-300 px-1 rounded">LOW EFFORT</span>
                  </div>
                  <div className="text-[9px] text-slate-500 font-normal">
                    SCENARIO_PROJECTED • Assumption
                  </div>
                </th>
              )}

              {recommended && (
                <th
                  onClick={() => onSelectScenario && onSelectScenario(recommended.scenario_id)}
                  className={`py-3 px-3 cursor-pointer transition-colors ${
                    selectedScenarioId === recommended.scenario_id
                      ? 'bg-emerald-500/15 border-t-2 border-emerald-400'
                      : 'bg-emerald-500/5 hover:bg-emerald-500/10'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-300">Recommended</span>
                    <span className="text-[8px] bg-emerald-500/20 text-emerald-300 px-1 rounded">MODERATE EFFORT</span>
                  </div>
                  <div className="text-[9px] text-slate-500 font-normal">
                    SCENARIO_PROJECTED • Assumption
                  </div>
                </th>
              )}

              {maximum && (
                <th
                  onClick={() => onSelectScenario && onSelectScenario(maximum.scenario_id)}
                  className={`py-3 px-3 cursor-pointer transition-colors ${
                    selectedScenarioId === maximum.scenario_id
                      ? 'bg-purple-500/15 border-t-2 border-purple-400'
                      : 'hover:bg-slate-900/40'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-purple-300">Max Separation</span>
                    <span className="text-[8px] bg-purple-500/20 text-purple-300 px-1 rounded">HIGH EFFORT</span>
                  </div>
                  <div className="text-[9px] text-slate-500 font-normal">
                    SCENARIO_PROJECTED • Assumption
                  </div>
                </th>
              )}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-800/60 font-sans">
            {comparison.comparisons.map((row, idx) => (
              <tr key={idx} className="hover:bg-slate-900/30 transition-colors">
                <td className="py-3 px-3">
                  <div className="font-medium text-slate-200">{row.metric}</div>
                  <div className="text-[10px] text-slate-500 leading-tight mt-0.5">{row.interpretation}</div>
                </td>

                {/* Current Value */}
                <td className="py-3 px-3 font-mono text-slate-300 bg-slate-900/40">
                  {row.current_value_label}
                </td>

                {/* Minimal Value */}
                {minimal && (
                  <td
                    className={`py-3 px-3 font-mono text-slate-200 ${
                      selectedScenarioId === minimal.scenario_id ? 'bg-cyan-500/5 font-bold' : ''
                    }`}
                  >
                    {row.minimal_value_label || '—'}
                  </td>
                )}

                {/* Recommended Value */}
                {recommended && (
                  <td
                    className={`py-3 px-3 font-mono text-emerald-300 ${
                      selectedScenarioId === recommended.scenario_id ? 'bg-emerald-500/10 font-bold' : 'bg-emerald-500/5'
                    }`}
                  >
                    <div className="flex items-center space-x-1">
                      <span>{row.recommended_value_label || '—'}</span>
                      {row.recommended_value_label && (
                        <TrendingUp className="w-3 h-3 text-emerald-400 inline flex-shrink-0" />
                      )}
                    </div>
                  </td>
                )}

                {/* Maximum Value */}
                {maximum && (
                  <td
                    className={`py-3 px-3 font-mono text-purple-300 ${
                      selectedScenarioId === maximum.scenario_id ? 'bg-purple-500/10 font-bold' : ''
                    }`}
                  >
                    <div className="flex items-center space-x-1">
                      <span>{row.maximum_value_label || '—'}</span>
                      {row.maximum_value_label && (
                        <ArrowUpRight className="w-3 h-3 text-purple-400 inline flex-shrink-0" />
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
