import React, { useState } from 'react';
import { PreparationActionEvidence } from '../../types/recyclens.types.ts';
import { Eye, HelpCircle, ChevronDown, ChevronUp, Sparkles, CheckCircle, AlertCircle } from 'lucide-react';

interface ActionEvidenceChainCardProps {
  action: PreparationActionEvidence;
  index: number;
}

export const ActionEvidenceChainCard: React.FC<ActionEvidenceChainCardProps> = ({ action, index }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-cyan-500/40 transition-all duration-200 shadow-md flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center space-x-2">
            <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono text-xs flex items-center justify-center font-bold">
              {index + 1}
            </span>
            <h4 className="text-xs font-bold text-slate-100 font-sans tracking-tight">
              {action.title}
            </h4>
          </div>

          <div className="flex items-center space-x-1 flex-shrink-0">
            {action.affected_material_codes.map((code) => (
              <span
                key={code}
                className="text-[9px] font-mono uppercase bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded border border-slate-700"
              >
                {code.replace('PLASTIC_', '').replace('_', ' ')}
              </span>
            ))}
          </div>
        </div>

        {/* Core Rationale & Modeled Effect Summary */}
        <p className="text-[11px] text-slate-300 leading-relaxed font-sans mb-3">
          {action.rationale}
        </p>

        {/* Quick Modeled Effect Callout */}
        <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-300 flex items-start space-x-2 mb-2">
          <Sparkles className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
          <div className="font-sans leading-relaxed">
            <strong className="font-mono uppercase text-[10px] text-emerald-400 block">Projected Effect:</strong>
            {action.modeled_effect}
          </div>
        </div>
      </div>

      {/* Expandable 5-Point Evidence Chain Drawer */}
      <div className="pt-2 border-t border-slate-800/80">
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between text-[10px] font-mono text-cyan-400 hover:text-cyan-300 py-1 transition-colors"
        >
          <span>{isExpanded ? 'Hide Evidence & Assumption Chain' : 'View Complete Evidence & Assumption Chain (5 Points)'}</span>
          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        {isExpanded && (
          <div className="mt-3 space-y-2 text-[11px] font-sans animate-fade-in pt-2 border-t border-slate-800/50">
            {/* 1. Observed Basis */}
            <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
              <div className="text-[10px] font-mono uppercase font-semibold text-cyan-400 flex items-center space-x-1 mb-1">
                <Eye className="w-3 h-3" />
                <span>1. Observed Visual Basis</span>
              </div>
              <div className="text-slate-300 leading-relaxed">{action.observed_basis}</div>
            </div>

            {/* 2. Rationale */}
            <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
              <div className="text-[10px] font-mono uppercase font-semibold text-emerald-400 flex items-center space-x-1 mb-1">
                <CheckCircle className="w-3 h-3" />
                <span>2. Technical Rationale</span>
              </div>
              <div className="text-slate-300 leading-relaxed">{action.rationale}</div>
            </div>

            {/* 3. Scenario Assumption */}
            <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
              <div className="text-[10px] font-mono uppercase font-semibold text-purple-400 flex items-center space-x-1 mb-1">
                <HelpCircle className="w-3 h-3" />
                <span>3. Scenario Assumption (Illustrative Condition)</span>
              </div>
              <div className="text-slate-300 leading-relaxed">{action.scenario_assumption}</div>
            </div>

            {/* 4. Modeled Effect */}
            <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
              <div className="text-[10px] font-mono uppercase font-semibold text-teal-400 flex items-center space-x-1 mb-1">
                <Sparkles className="w-3 h-3" />
                <span>4. Modeled Effect (Projected Benchmark)</span>
              </div>
              <div className="text-slate-300 leading-relaxed">{action.modeled_effect}</div>
            </div>

            {/* 5. Uncertainty & Limitations */}
            <div className="p-2.5 rounded-xl bg-amber-500/5 border border-amber-500/20">
              <div className="text-[10px] font-mono uppercase font-semibold text-amber-400 flex items-center space-x-1 mb-1">
                <AlertCircle className="w-3 h-3" />
                <span>5. Unconfirmed Variables & Limitations</span>
              </div>
              <div className="text-amber-200/80 leading-relaxed">{action.uncertainty}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
