import React, { useState } from 'react';
import { useRecyclensStore } from '../../store/useRecyclensStore.ts';
import { RecyclerCard } from './RecyclerCard.tsx';
import { Truck, Filter, Shield, AlertTriangle, CheckCircle2, Split, ArrowUpRight } from 'lucide-react';
import { RecyclerMatch } from '../../types/recyclens.types.ts';

export const RecyclerList: React.FC = () => {
  const { analysisResult } = useRecyclensStore();
  const [filterPickupOnly, setFilterPickupOnly] = useState(false);
  const [sortBy, setSortBy] = useState<'score' | 'distance' | 'payout'>('score');

  if (!analysisResult) return null;

  const splitRoutes = analysisResult.split_routes;

  // Use separated eligible vs incompatible matches if available, or compute on the fly
  let eligibleMatches = (analysisResult.eligible_matches || analysisResult.matches.filter((m) => m.is_eligible));
  let incompatibleMatches = (analysisResult.incompatible_matches || analysisResult.matches.filter((m) => !m.is_eligible));

  // Filter Pickup
  if (filterPickupOnly) {
    eligibleMatches = eligibleMatches.filter((m) => m.pickup_offered);
    incompatibleMatches = incompatibleMatches.filter((m) => m.pickup_offered);
  }

  // Sort function
  const sortFn = (a: RecyclerMatch, b: RecyclerMatch) => {
    if (sortBy === 'score') return b.total_score - a.total_score;
    if (sortBy === 'distance') return a.distance_km - b.distance_km;
    if (sortBy === 'payout') return b.estimated_payout_range.max - a.estimated_payout_range.max;
    return 0;
  };

  eligibleMatches.sort(sortFn);
  incompatibleMatches.sort(sortFn);

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="p-6 rounded-3xl hud-glass border border-slate-700/60 bg-hud-card/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider bg-purple-500/15 text-purple-400 border border-purple-500/30">
              RECOVERY ROUTE OPTIMIZATION
            </span>
            <span className="text-xs font-mono text-slate-400">
              {eligibleMatches.length} Eligible Route{eligibleMatches.length === 1 ? '' : 's'}
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-100 mt-1 font-['Outfit']">
            Recovery Destination Compatibility
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Simulated regional facility archetypes evaluated via 6-factor heuristic scoring
          </p>
        </div>

        {/* Filter & Sort Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Pickup Filter Chip */}
          <button
            type="button"
            onClick={() => setFilterPickupOnly(!filterPickupOnly)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border flex items-center space-x-1.5 transition-all ${
              filterPickupOnly
                ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Truck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Doorstep Pickup</span>
          </button>

          {/* Sort Dropdown */}
          <div className="flex items-center space-x-1.5 bg-slate-900 border border-slate-700 px-3 py-1.5 rounded-xl text-xs text-slate-300">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent text-xs text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="score" className="bg-slate-900">Highest Match Score</option>
              <option value="distance" className="bg-slate-900">Nearest Proximity</option>
              <option value="payout" className="bg-slate-900">Max Indicative Payout</option>
            </select>
          </div>
        </div>
      </div>

      {/* MULTI-MATERIAL SPLIT ROUTE DISPATCH PLAN */}
      {splitRoutes && splitRoutes.length > 0 && (
        <div className="p-6 rounded-3xl hud-glass border border-purple-500/40 bg-purple-500/5 shadow-xl">
          <div className="flex items-center space-x-2 pb-3 border-b border-purple-500/20 mb-4">
            <Split className="w-4 h-4 text-purple-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-purple-300 font-mono">
              PROVISIONAL SPLIT ROUTE DISPATCH STRATEGY
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/20 text-purple-300">
              {splitRoutes.length} Material Channels (Provisional)
            </span>
          </div>

          <p className="text-xs text-slate-300 mb-4 leading-relaxed">
            Because this batch contains distinct material categories with separable sub-streams, provisional routing channels to specialized regional facilities indicate higher net recovery than a single mixed intake. Quantities represent illustrative projections:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {splitRoutes.map((sr, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-slate-900/80 border border-purple-500/20 flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-bold text-slate-100">{sr.material_name}</span>
                    <span className="text-[11px] font-mono font-bold text-purple-300 bg-purple-500/10 px-2 py-0.5 rounded">
                      ~{sr.allocated_weight_kg} kg (Projected)
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1 flex items-center space-x-1.5">
                    <ArrowUpRight className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                    <span>Target: <strong className="text-slate-200">{sr.suggested_recycler_name}</strong></span>
                  </div>
                  <div className="text-[10px] font-mono text-slate-500 mt-0.5">
                    {sr.target_facility_type}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Indicative Stream Value:</span>
                  <strong className="font-mono text-emerald-400">
                    ₹{sr.estimated_payout_range.min} – ₹{sr.estimated_payout_range.max}
                  </strong>
                </div>

                {sr.preparation_required && sr.preparation_required.length > 0 && (
                  <div className="text-[10px] text-slate-400 italic bg-slate-950/60 p-2 rounded-lg border border-slate-800">
                    Prep: {sr.preparation_required[0]}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 1: ELIGIBLE RECOVERY ROUTES */}
      <div>
        <div className="flex items-center space-x-2 mb-3">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 font-mono">
            Direct Single-Facility Routes ({eligibleMatches.length})
          </h3>
        </div>

        {eligibleMatches.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            {eligibleMatches.map((match, idx) => (
              <RecyclerCard key={match.recycler.id} match={match} rank={idx + 1} />
            ))}
          </div>
        ) : (
          <div className="p-8 rounded-3xl hud-glass border border-amber-500/40 bg-amber-500/5 text-center space-y-3">
            <AlertTriangle className="w-10 h-10 text-amber-400 mx-auto" />
            <h4 className="text-base font-bold text-slate-100 font-['Outfit']">
              No Eligible Recovery Route Found
            </h4>
            <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
              None of the configured regional facility archetypes currently accept this specific material (
              <strong className="text-amber-300">{analysisResult.recovery_profile.primary_material.name}</strong>) or the batch contamination level exceeds processing tolerances.
            </p>
            <div className="text-[11px] font-mono text-slate-400 pt-2">
              Action: Check the alternative facilities below or adjust preparation to reduce contamination.
            </div>
          </div>
        )}
      </div>

      {/* SECTION 2: INCOMPATIBLE / ALTERNATIVE FACILITIES */}
      {incompatibleMatches.length > 0 && (
        <div className="pt-6 border-t border-slate-800">
          <div className="flex items-center space-x-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-slate-500" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
              Incompatible / Secondary Alternatives ({incompatibleMatches.length})
            </h3>
          </div>

          <div className="grid grid-cols-1 gap-3 opacity-70 hover:opacity-100 transition-opacity">
            {incompatibleMatches.map((match, idx) => (
              <RecyclerCard key={match.recycler.id} match={match} rank={eligibleMatches.length + idx + 1} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
