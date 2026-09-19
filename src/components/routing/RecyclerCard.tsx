import React from 'react';
import { RecyclerMatch } from '../../types/recyclens.types.ts';
import { useRecyclensStore } from '../../store/useRecyclensStore.ts';
import { MapPin, Truck, ShieldCheck, Star, ArrowRight, Radar, CheckCircle, AlertTriangle } from 'lucide-react';

interface RecyclerCardProps {
  match: RecyclerMatch;
  rank: number;
}

export const RecyclerCard: React.FC<RecyclerCardProps> = ({ match, rank }) => {
  const { openRadarModal, openDispatchModal, generatePassportForCurrentBatch, isGeneratingPassport } = useRecyclensStore();
  const { recycler, is_eligible, total_score, distance_km, estimated_payout_range, pickup_offered, match_reasons, warnings } = match;

  const isTopMatch = rank === 1 && total_score >= 80 && is_eligible;

  return (
    <div
      className={`p-6 rounded-3xl border transition-all duration-200 relative overflow-hidden ${
        isTopMatch
          ? 'hud-glass border-emerald-500/60 bg-hud-card/95 shadow-xl shadow-emerald-500/10 ring-1 ring-emerald-500/40'
          : is_eligible
          ? 'hud-glass border-slate-800/80 bg-hud-card/70 hover:border-slate-700 hover:bg-hud-card/90'
          : 'hud-glass border-slate-800/40 bg-slate-900/40 opacity-75 hover:opacity-100'
      }`}
    >
      {/* Top Banner if Top Recommendation */}
      {isTopMatch && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400" />
      )}

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        {/* Left Info Column */}
        <div className="space-y-2 max-w-xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center text-xs font-mono font-bold">
              #{rank}
            </span>

            <span className="text-base sm:text-lg font-bold text-slate-100 font-['Outfit']">
              {recycler.name}
            </span>

            {is_eligible ? (
              <span className="px-2 py-0.5 rounded-md bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 text-[10px] font-mono font-bold uppercase flex items-center space-x-1">
                <ShieldCheck className="w-3 h-3" />
                <span>Demo Archetype</span>
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-md bg-rose-500/15 border border-rose-500/30 text-rose-400 text-[10px] font-mono font-bold uppercase flex items-center space-x-1">
                <AlertTriangle className="w-3 h-3" />
                <span>Incompatible Route</span>
              </span>
            )}

            <div className="flex items-center space-x-1 text-xs text-amber-400 font-mono">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span>{recycler.rating.toFixed(1)}</span>
            </div>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            {recycler.tagline}
          </p>

          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 font-mono pt-1">
            <span className="flex items-center space-x-1">
              <MapPin className="w-3.5 h-3.5 text-cyan-400" />
              <span>{recycler.location.city} ({distance_km} km)</span>
            </span>

            <span className="flex items-center space-x-1">
              <Truck className="w-3.5 h-3.5 text-emerald-400" />
              <span className={pickup_offered ? 'text-emerald-400' : 'text-slate-500'}>
                {pickup_offered ? 'Doorstep Pickup Active' : 'Self Drop-off Required'}
              </span>
            </span>
          </div>

          {/* Match Reasons / Warnings Chips */}
          <div className="flex flex-wrap gap-1.5 pt-2">
            {is_eligible && match_reasons && match_reasons.slice(0, 2).map((reason, idx) => (
              <span
                key={idx}
                className="px-2.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-[11px] flex items-center space-x-1"
              >
                <CheckCircle className="w-3 h-3 text-emerald-400" />
                <span>{reason}</span>
              </span>
            ))}

            {warnings && warnings.slice(0, 2).map((warn, idx) => (
              <span
                key={idx}
                className="px-2.5 py-0.5 rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/20 text-[11px] flex items-center space-x-1"
              >
                <AlertTriangle className="w-3 h-3 text-amber-400" />
                <span>{warn}</span>
              </span>
            ))}
          </div>
        </div>

        {/* Right Action & Payout Column */}
        <div className="flex flex-row lg:flex-col items-center lg:items-end justify-between lg:justify-center gap-3 pt-4 lg:pt-0 border-t lg:border-t-0 border-slate-800">
          {/* Match Score & Payout */}
          <div className="text-left lg:text-right">
            <div className="flex items-center lg:justify-end space-x-2">
              <span className="text-[11px] font-mono uppercase text-slate-400">Match Fit:</span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold ${
                  !is_eligible
                    ? 'bg-slate-800 text-slate-400 border border-slate-700'
                    : total_score >= 85
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : total_score >= 70
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                }`}
              >
                {total_score}% Fit
              </span>
            </div>

            <div className="text-lg sm:text-xl font-bold font-mono text-slate-100 mt-1">
              ₹{estimated_payout_range.min} – ₹{estimated_payout_range.max}
            </div>
            <div className="text-[10px] text-slate-500 font-mono">
              Indicative Simulated Net Payout
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => openRadarModal(match)}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-all"
              title="Explain Match Score"
            >
              <Radar className="w-4 h-4 text-cyan-400" />
            </button>

            {is_eligible && (
              <>
                <button
                  type="button"
                  onClick={() => openDispatchModal(match)}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs border border-slate-700 flex items-center space-x-1.5 transition-all"
                  title="Simulate Dispatch Estimate"
                >
                  <Truck className="w-3.5 h-3.5 text-slate-400" />
                  <span>Simulate</span>
                </button>

                <button
                  type="button"
                  disabled={isGeneratingPassport}
                  onClick={() => generatePassportForCurrentBatch(match)}
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 flex items-center space-x-1.5 transition-transform active:scale-95"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>{isGeneratingPassport ? 'Issuing...' : 'Issue Passport'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
