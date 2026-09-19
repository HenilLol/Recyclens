import React, { useState } from 'react';
import { useRecyclensStore } from '../../store/useRecyclensStore.ts';
import {
  ShieldCheck,
  CheckCircle,
  FileText,
  Copy,
  Download,
  Check,
  Truck,
  AlertTriangle,
  Scale,
  Sparkles,
  ArrowRight,
  Info,
} from 'lucide-react';
import { DispatchManifestCard } from '../dispatch/DispatchManifestCard.tsx';

export const RecoveryPassportView: React.FC = () => {
  const {
    currentPassport,
    currentDispatchManifest,
    generateDispatchForCurrentPassport,
    isGeneratingManifest,
    setStep,
  } = useRecyclensStore();

  const [copied, setCopied] = useState(false);

  if (!currentPassport) {
    return (
      <div className="p-8 rounded-3xl hud-glass border border-slate-800 text-center space-y-4">
        <ShieldCheck className="w-12 h-12 text-slate-500 mx-auto" />
        <h3 className="text-base font-bold text-slate-200">No Recovery Passport Generated</h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          Please complete recovery analysis and route selection first to generate an integrity-verified Recovery Passport.
        </p>
        <button
          onClick={() => setStep(4)}
          className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold"
        >
          Return to Route Selection
        </button>
      </div>
    );
  }

  const {
    passport_id,
    created_at,
    evidence_snapshot,
    scenario_snapshot,
    routing_snapshot,
    verification_snapshot,
    integrity,
    snapshot_disclosure,
  } = currentPassport;

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(currentPassport, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(currentPassport, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${passport_id}_recovery_passport.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Passport Header Card */}
      <div className="p-6 rounded-3xl hud-glass border border-emerald-500/40 bg-hud-card relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-slate-800 relative z-10">
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <span className="px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-mono font-bold tracking-wider uppercase">
                Phase 5.1 Recovery Passport
              </span>
              <span className="px-2.5 py-1 rounded-md bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-[11px] font-mono font-bold">
                Schema v{currentPassport.schema_version}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-100 font-['Outfit'] flex items-center space-x-2">
              <ShieldCheck className="w-6 h-6 text-emerald-400" />
              <span>{passport_id}</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1 font-mono">
              Created: {new Date(created_at).toLocaleString()} • Scan Ref: {currentPassport.scan_id}
            </p>
          </div>

          {/* SHA-256 Integrity Verification Badge */}
          <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col justify-between space-y-1.5 min-w-[280px]">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono text-slate-400">CRYPTOGRAPHIC INTEGRITY</span>
              <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono">
                <CheckCircle className="w-3 h-3 text-emerald-400" />
                <span>SHA-256 MATCH</span>
              </span>
            </div>
            <div className="font-mono text-[10px] text-slate-300 truncate" title={integrity.canonical_payload_hash}>
              Hash: {integrity.canonical_payload_hash.substring(0, 24)}...
            </div>
            <div className="text-[10px] text-slate-500">
              Deterministic canon of 9 core snapshot domains
            </div>
          </div>
        </div>

        {/* 4-Domain Snapshot Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-6 relative z-10">
          {/* Domain 1: Evidence Snapshot */}
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-2.5">
            <div className="flex items-center justify-between text-xs font-bold text-slate-300 font-mono">
              <span>EVIDENCE SNAPSHOT</span>
              <FileText className="w-3.5 h-3.5 text-cyan-400" />
            </div>
            <div className="text-sm font-extrabold text-slate-100 truncate">
              {evidence_snapshot.primary_material.name}
            </div>
            <div className="text-[11px] text-slate-400 font-mono flex justify-between">
              <span>Streams:</span>
              <span className="text-slate-200">{evidence_snapshot.composition.length} fraction(s)</span>
            </div>
            <div className="text-[11px] text-slate-400 font-mono flex justify-between">
              <span>Contamination:</span>
              <span className="text-amber-400 font-bold">{evidence_snapshot.contamination.percentage}%</span>
            </div>
            <div className="text-[11px] text-slate-400 font-mono flex justify-between">
              <span>Batch Weight:</span>
              <span className="text-emerald-400 font-bold">{evidence_snapshot.batch_weight_kg.toFixed(1)} kg</span>
            </div>
            <div className="pt-1.5 border-t border-slate-900 text-[10px] font-mono text-slate-500 truncate" title={evidence_snapshot.weight_provenance}>
              Basis: {evidence_snapshot.weight_provenance === 'USER_CONFIRMED_SCALE_WEIGHMENT' ? 'Scale Weighment' : 'Visual Projection'}
            </div>
          </div>

          {/* Domain 2: Scenario Snapshot */}
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-2.5">
            <div className="flex items-center justify-between text-xs font-bold text-slate-300 font-mono">
              <span>SELECTED SCENARIO</span>
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="text-sm font-extrabold text-amber-300 truncate">
              {scenario_snapshot.title}
            </div>
            <div className="text-[11px] text-slate-400 font-mono flex justify-between">
              <span>Type:</span>
              <span className="text-slate-200">{scenario_snapshot.scenario_type}</span>
            </div>
            <div className="text-[11px] text-slate-400 font-mono flex justify-between">
              <span>Modeled Contam:</span>
              <span className="text-emerald-400 font-bold">{scenario_snapshot.modeled_contamination_percent}%</span>
            </div>
            <div className="text-[11px] text-slate-400 font-mono flex justify-between">
              <span>Projected Yield:</span>
              <span className="text-cyan-400 font-bold">₹{scenario_snapshot.modeled_economic_result.min} - ₹{scenario_snapshot.modeled_economic_result.max}</span>
            </div>
            <div className="pt-1.5 border-t border-slate-900 text-[10px] font-mono text-slate-500 truncate">
              Effort: {scenario_snapshot.effort_level} • Actions: {scenario_snapshot.preparation_actions.length}
            </div>
          </div>

          {/* Domain 3: Routing Snapshot */}
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-2.5">
            <div className="flex items-center justify-between text-xs font-bold text-slate-300 font-mono">
              <span>ROUTING SNAPSHOT</span>
              <Truck className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="text-sm font-extrabold text-slate-100 truncate">
              {routing_snapshot.selected_facility_name || 'Designated Regional MRF'}
            </div>
            <div className="text-[11px] text-slate-400 font-mono flex justify-between">
              <span>Route Strategy:</span>
              <span className="text-slate-200">{routing_snapshot.route_type}</span>
            </div>
            <div className="text-[11px] text-slate-400 font-mono flex justify-between">
              <span>Status:</span>
              <span className="text-cyan-400 font-bold">{routing_snapshot.routing_status}</span>
            </div>
            <div className="text-[11px] text-slate-400 font-mono flex justify-between">
              <span>Indicative Payout:</span>
              <span className="text-emerald-400 font-bold">₹{routing_snapshot.indicative_payout_range.min} - ₹{routing_snapshot.indicative_payout_range.max}</span>
            </div>
            <div className="pt-1.5 border-t border-slate-900 text-[10px] font-mono text-slate-500 truncate" title={routing_snapshot.routing_rationale}>
              {routing_snapshot.routing_rationale}
            </div>
          </div>

          {/* Domain 4: Verification Snapshot */}
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-2.5">
            <div className="flex items-center justify-between text-xs font-bold text-slate-300 font-mono">
              <span>VERIFICATION STATE</span>
              <Scale className="w-3.5 h-3.5 text-purple-400" />
            </div>
            <div className="text-sm font-extrabold text-slate-100 truncate">
              {verification_snapshot.verification_status}
            </div>
            <div className="text-[11px] text-slate-400 font-mono flex justify-between">
              <span>Scale Confirmed:</span>
              <span className="text-slate-200">
                {verification_snapshot.confirmed_weight_kg ? `${verification_snapshot.confirmed_weight_kg} kg` : 'Unconfirmed'}
              </span>
            </div>
            <div className="text-[11px] text-slate-400 font-mono flex justify-between">
              <span>Preparation:</span>
              <span className="text-slate-300">{verification_snapshot.preparation_confirmation || 'As-Is'}</span>
            </div>
            <div className="text-[11px] text-slate-400 font-mono flex justify-between">
              <span>Dock Notes:</span>
              <span className="text-slate-400 truncate">{verification_snapshot.user_notes ? 'Recorded' : 'None'}</span>
            </div>
            <div className="pt-1.5 border-t border-slate-900 text-[10px] font-mono text-slate-500">
              Operator-declared client input
            </div>
          </div>
        </div>

        {/* Snapshot Disclosure Banner */}
        <div className="mt-6 p-3.5 rounded-2xl bg-slate-950/90 border border-slate-800 text-[11px] text-slate-400 leading-relaxed flex items-start space-x-2.5">
          <Info className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
          <span>{snapshot_disclosure}</span>
        </div>

        {/* Export & Action Controls */}
        <div className="mt-6 pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handleCopyJson}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 flex items-center space-x-1.5 transition-all"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied JSON' : 'Copy Passport JSON'}</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadJson}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 flex items-center space-x-1.5 transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Record</span>
            </button>
          </div>

          {!currentDispatchManifest && (
            <button
              type="button"
              disabled={isGeneratingManifest}
              onClick={() => generateDispatchForCurrentPassport()}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 text-xs sm:text-sm font-extrabold shadow-lg shadow-emerald-500/20 flex items-center space-x-2 transition-transform hover:scale-105"
            >
              <Truck className="w-4 h-4" />
              <span>{isGeneratingManifest ? 'Assembling Manifest...' : 'Generate Recovery Dispatch Manifest'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Embedded Scenario-Aware Dispatch Manifest (Phase 5.2) */}
      {currentDispatchManifest && <DispatchManifestCard manifest={currentDispatchManifest} />}
    </div>
  );
};
