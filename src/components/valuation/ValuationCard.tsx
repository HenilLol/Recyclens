import React from 'react';
import { useRecyclensStore } from '../../store/useRecyclensStore.ts';
import { formatINR } from '../../utils/formatters.ts';
import { DollarSign, TrendingDown, Scale, Info, ArrowRight, Layers } from 'lucide-react';
import { ContaminationPenaltyBar } from './ContaminationPenaltyBar.tsx';
import { PriceSourceDisclaimer } from './PriceSourceDisclaimer.tsx';

export const ValuationCard: React.FC = () => {
  const { analysisResult, weightKg, setWeightKg, setStep } = useRecyclensStore();

  if (!analysisResult) return null;

  const { valuation, recovery_profile } = analysisResult;
  const { clean_batch_benchmark, contamination_penalty_amount, indicative_net_range, base_rate_range } = valuation;

  return (
    <div className="space-y-6">
      {/* Primary Value Card */}
      <div className="p-6 sm:p-8 rounded-3xl hud-glass border border-emerald-500/40 bg-hud-card/90 shadow-2xl relative overflow-hidden">
        {/* Ambient Top Glow */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400" />

        {/* Header Label */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-6 border-b border-slate-800">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                INDICATIVE SCRAP VALUATION
              </span>
              <span className="text-xs font-mono text-slate-400">
                {recovery_profile.primary_material.name}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-100 mt-1 font-['Outfit']">
              Net Recovery Value Range
            </h2>
          </div>

          <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300 flex items-center space-x-1.5">
            <span className="text-slate-400">Benchmark Rate:</span>
            <strong className="text-emerald-400">₹{base_rate_range.min} – ₹{base_rate_range.max} / kg</strong>
          </div>
        </div>

        {/* Big Monetary Range Readout */}
        <div className="my-8 py-6 px-4 sm:px-8 rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950/90 border border-emerald-500/30 text-center relative">
          <div className="text-xs font-mono text-emerald-400 uppercase tracking-widest mb-1 flex items-center justify-center space-x-1">
            <DollarSign className="w-4 h-4" />
            <span>Estimated Batch Recovery Payout</span>
          </div>

          <div className="text-4xl sm:text-6xl font-black font-mono tracking-tight bg-gradient-to-r from-emerald-300 via-teal-200 to-cyan-300 bg-clip-text text-transparent my-2">
            ₹{indicative_net_range.min} – ₹{indicative_net_range.max}
          </div>

          <div className="text-xs text-slate-400 font-mono">
            For estimated batch of <span className="text-slate-200 font-bold">{weightKg.toFixed(1)} kg</span> • Benchmark model for regional MRF facilities
          </div>
        </div>

        {/* Waterfall Comparison Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {/* Gross Benchmark */}
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
            <div className="text-[11px] font-mono text-slate-400 mb-1">100% CLEAN BENCHMARK</div>
            <div className="text-xl font-bold font-mono text-slate-200">
              {formatINR(clean_batch_benchmark)}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">Gross potential value if 0% contamination</div>
          </div>

          {/* Contamination Penalty */}
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-amber-500/20 bg-amber-500/5">
            <div className="text-[11px] font-mono text-amber-400 mb-1 flex items-center space-x-1">
              <TrendingDown className="w-3.5 h-3.5" />
              <span>CONTAMINATION PENALTY</span>
            </div>
            <div className="text-xl font-bold font-mono text-amber-400">
              -{formatINR(contamination_penalty_amount)}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              -{recovery_profile.contamination.percentage.toFixed(0)}% yield deduction applied
            </div>
          </div>

          {/* Net Indicative Mid */}
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-emerald-500/20 bg-emerald-500/5">
            <div className="text-[11px] font-mono text-emerald-400 mb-1">REALIZABLE SCRAP RANGE</div>
            <div className="text-xl font-bold font-mono text-emerald-400">
              ₹{indicative_net_range.min} – ₹{indicative_net_range.max}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Ready for direct recycler dispatch</div>
          </div>
        </div>

        {/* Visual Waterfall Bar */}
        <ContaminationPenaltyBar
          cleanBenchmark={clean_batch_benchmark}
          penaltyAmount={contamination_penalty_amount}
          netMin={indicative_net_range.min}
          netMax={indicative_net_range.max}
        />

        {/* Multi-Material Component Allocation Breakdown */}
        {valuation.component_valuations && valuation.component_valuations.length > 0 && (
          <div className="mt-6 p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
            <div className="flex items-center space-x-2 text-xs font-mono font-bold uppercase tracking-wider text-slate-400 mb-3">
              <Layers className="w-4 h-4 text-cyan-400" />
              <span>ILLUSTRATIVE COMPONENT ALLOCATION & BENCHMARK CONTRIBUTION</span>
            </div>

            <div className="space-y-2.5">
              {valuation.component_valuations.map((cVal, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-slate-100">{cVal.material_name}</span>
                      <span className="text-[10px] font-mono text-cyan-300 bg-cyan-500/10 px-1.5 py-0.2 rounded border border-cyan-500/20">
                        ~{cVal.estimated_share_percent}% visual share
                      </span>
                    </div>
                    <div className="text-[11px] font-mono text-slate-400 mt-1">
                      Illustrative Allocation: <strong className="text-slate-200">~{cVal.allocated_weight_kg} kg</strong> • Benchmark Rate: ₹{cVal.base_rate_range.min}–₹{cVal.base_rate_range.max}/kg
                    </div>
                  </div>

                  <div className="flex items-center space-x-4 font-mono text-right flex-shrink-0">
                    <div>
                      <div className="text-[10px] text-slate-500 uppercase">Gross Clean</div>
                      <div className="text-slate-300 font-semibold">{formatINR(cVal.clean_benchmark)}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-amber-500 uppercase">Deduction</div>
                      <div className="text-amber-400">-{formatINR(cVal.contamination_penalty)}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-emerald-400 uppercase">Realizable</div>
                      <div className="text-emerald-400 font-bold">
                        ₹{cVal.indicative_net_range.min} – ₹{cVal.indicative_net_range.max}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Scientific Honesty Methodology Notice */}
            <div className="mt-3 p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] text-slate-400 font-mono leading-relaxed">
              <strong className="text-slate-300">Methodology Notice:</strong> Component weight allocations are illustrative model projections derived by applying 2D visual surface shares to the total batch weighment. Because material bulk densities differ significantly (e.g. metals vs. thin films), physical dock sorting and scale weighment are required for commercial confirmation.
            </div>

            {/* Unresolved Economic Impact Disclosure */}
            {valuation.unresolved_economic_impact && (
              <div className="mt-3 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-300/90 font-mono flex items-start space-x-2">
                <Info className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <span>{valuation.unresolved_economic_impact}</span>
              </div>
            )}
          </div>
        )}

        {/* Dynamic Weight Adjuster inside Value Screen */}
        <div className="mt-6 p-4 rounded-2xl bg-slate-900/40 border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 flex-shrink-0">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-200">Adjust Batch Weight Simulator</div>
              <div className="text-[11px] text-slate-400">Dynamically update valuation and matching requirements</div>
            </div>
          </div>

          <div className="flex items-center space-x-3 flex-shrink-0">
            <input
              type="range"
              min="1"
              max="100"
              step="0.5"
              value={weightKg}
              onChange={(e) => setWeightKg(parseFloat(e.target.value))}
              className="w-32 sm:w-44 h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
            <span className="w-16 text-right text-xs font-mono font-bold text-emerald-400">
              {weightKg.toFixed(1)} kg
            </span>
          </div>
        </div>

        {/* Data Source & Disclaimer */}
        <div className="mt-6">
          <PriceSourceDisclaimer sourceLabel={valuation.data_source_label} disclaimer={valuation.price_disclaimer} />
        </div>

        {/* Screen 4 Progression Button */}
        <div className="mt-8 pt-6 border-t border-slate-800 flex items-center justify-between">
          <div className="text-xs text-slate-400">
            Next: Match with compatible recovery routes and regional archetypes.
          </div>
          <button
            type="button"
            onClick={() => setStep(4)}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 text-xs font-bold shadow-lg shadow-emerald-500/20 flex items-center space-x-2 transition-transform hover:scale-105"
          >
            <span>View Best Recovery Routes</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
