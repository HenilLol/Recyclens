import React from 'react';
import { useRecyclensStore } from '../../store/useRecyclensStore.ts';
import { PresetScenario } from '../../types/recyclens.types.ts';
import { Sparkles, ArrowRight } from 'lucide-react';
import { getCategoryBadge } from '../../utils/formatters.ts';

export const PresetSelector: React.FC = () => {
  const { presets, selectedPreset, selectPreset, runAnalysis, isAnalyzing } = useRecyclensStore();

  if (!presets || presets.length === 0) return null;

  const handleInstantDemo = (preset: PresetScenario, e: React.MouseEvent) => {
    e.stopPropagation();
    selectPreset(preset);
    runAnalysis(preset.image_url, preset.id);
  };

  return (
    <div className="w-full mt-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono">
            Hackathon Live Demo Presets (1-Click Test Suite)
          </h3>
        </div>
        <span className="text-[11px] font-mono text-slate-500">
          5 Curated Demonstration Archetypes
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {presets.map((preset) => {
          const isSelected = selectedPreset?.id === preset.id;
          const badge = getCategoryBadge(preset.category);

          return (
            <div
              key={preset.id}
              onClick={() => selectPreset(preset)}
              className={`group relative p-3 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                isSelected
                  ? 'bg-hud-card border-emerald-500/80 shadow-lg shadow-emerald-500/20 ring-1 ring-emerald-500'
                  : 'hud-glass border-slate-800/80 hover:border-slate-700 hover:bg-hud-card/70'
              }`}
            >
              <div>
                {/* Thumbnail */}
                <div className="relative w-full h-24 rounded-xl overflow-hidden mb-2.5 bg-slate-950">
                  <img
                    src={preset.image_url}
                    alt={preset.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase backdrop-blur-md bg-slate-900/80 border border-slate-700 text-slate-200">
                    {preset.category}
                  </div>
                </div>

                <h4 className="text-xs font-bold text-slate-100 group-hover:text-emerald-300 transition-colors line-clamp-1">
                  {preset.title}
                </h4>
                <p className="text-[10px] text-slate-400 mt-1 line-clamp-2">
                  {preset.subtitle}
                </p>
              </div>

              {/* Instant Scan Button */}
              <button
                type="button"
                disabled={isAnalyzing}
                onClick={(e) => handleInstantDemo(preset, e)}
                className="mt-3 w-full py-1.5 px-2 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-[11px] font-semibold flex items-center justify-center space-x-1 transition-all group-hover:border-emerald-400"
              >
                <span>Instant Run</span>
                <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
