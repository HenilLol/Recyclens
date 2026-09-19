import React from 'react';
import { useRecyclensStore } from '../../store/useRecyclensStore.ts';
import { Scale, MapPin, Info } from 'lucide-react';

const REGION_PRESETS = [
  { label: 'Mumbai Metro (MMR Cluster)', lat: 19.076, lng: 72.8777 },
  { label: 'Navi Mumbai Industrial Belt', lat: 19.0833, lng: 73.0112 },
  { label: 'Thane / Balkum Scrap Zone', lat: 19.2274, lng: 72.9839 },
  { label: 'Andheri / SEEPZ Industrial', lat: 19.1238, lng: 72.8762 },
];

export const WeightLocationInputs: React.FC = () => {
  const { weightKg, setWeightKg, userLocation, setUserLocation } = useRecyclensStore();

  const handleQuickWeight = (val: number) => {
    setWeightKg(val);
  };

  return (
    <div className="w-full space-y-4">
      {/* Weight Input Box */}
      <div className="p-4 rounded-2xl hud-glass border border-slate-700/60 bg-hud-surface/50">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2 text-xs font-semibold text-slate-300">
            <Scale className="w-4 h-4 text-emerald-400" />
            <span>Batch Weight Estimate</span>
          </div>
          <div className="flex items-center space-x-1.5 px-2.5 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-xs font-bold">
            <span>{weightKg.toFixed(1)} kg</span>
          </div>
        </div>

        {/* Range Slider */}
        <input
          type="range"
          min="1"
          max="100"
          step="0.5"
          value={weightKg}
          onChange={(e) => setWeightKg(parseFloat(e.target.value))}
          className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500 focus:outline-none"
        />

        {/* Quick Weight Chips */}
        <div className="mt-3 flex items-center justify-between text-xs">
          <span className="text-slate-500 font-mono text-[11px]">Quick batch:</span>
          <div className="flex space-x-1.5">
            {[5, 12.5, 25, 50, 100].map((w) => (
              <button
                key={w}
                type="button"
                onClick={() => handleQuickWeight(w)}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all ${
                  weightKg === w
                    ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                    : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 border border-slate-700'
                }`}
              >
                {w}kg
              </button>
            ))}
          </div>
        </div>

        {/* Honest Disclosure Note */}
        <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-start space-x-1.5 text-[11px] text-slate-400">
          <Info className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0 mt-0.5" />
          <span>
            <strong>AI Honesty:</strong> Waste weight cannot be accurately measured from a photo. Weight is user-specified or estimated and combined with visual AI for recovery valuation.
          </span>
        </div>
      </div>

      {/* Location Input Box */}
      <div className="p-4 rounded-2xl hud-glass border border-slate-700/60 bg-hud-surface/50">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2 text-xs font-semibold text-slate-300">
            <MapPin className="w-4 h-4 text-cyan-400" />
            <span>Generation Location</span>
          </div>
          <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/30">
            {userLocation.lat.toFixed(3)}°N, {userLocation.lng.toFixed(3)}°E
          </span>
        </div>

        <select
          value={userLocation.label}
          onChange={(e) => {
            const found = REGION_PRESETS.find((r) => r.label === e.target.value);
            if (found) {
              setUserLocation({ lat: found.lat, lng: found.lng, label: found.label });
            }
          }}
          className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200 focus:border-cyan-500 focus:outline-none"
        >
          {REGION_PRESETS.map((p) => (
            <option key={p.label} value={p.label}>
              {p.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};
