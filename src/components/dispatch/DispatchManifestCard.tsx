import React, { useState } from 'react';
import { RecoveryDispatchManifest, DispatchChecklistItem } from '../../types/recyclens.types.ts';
import { useRecyclensStore } from '../../store/useRecyclensStore.ts';
import {
  Truck,
  CheckSquare,
  Square,
  AlertTriangle,
  Info,
  Download,
  Copy,
  Check,
  ArrowRight,
  Printer,
  PackageCheck,
  Scale,
} from 'lucide-react';

interface DispatchManifestCardProps {
  manifest: RecoveryDispatchManifest;
}

export const DispatchManifestCard: React.FC<DispatchManifestCardProps> = ({ manifest }) => {
  const { setStep } = useRecyclensStore();
  const [copied, setCopied] = useState(false);
  const [checklist, setChecklist] = useState<DispatchChecklistItem[]>(manifest.preparation_checklist || []);

  const toggleChecklistItem = (actionId: string) => {
    setChecklist((prev) =>
      prev.map((item) => (item.action_id === actionId ? { ...item, completed: !item.completed } : item))
    );
  };

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(manifest, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(manifest, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${manifest.manifest_id}_dispatch_manifest.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handlePrint = () => {
    window.print();
  };

  const completedCount = checklist.filter((i) => i.completed).length;

  return (
    <div className="p-6 rounded-3xl hud-glass border border-cyan-500/40 bg-hud-card relative overflow-hidden shadow-2xl space-y-6 animate-fade-in">
      {/* Ambient background glow */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-slate-800 relative z-10">
        <div>
          <div className="flex items-center space-x-2 mb-2">
            <span className="px-2.5 py-1 rounded-md bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-[11px] font-mono font-bold uppercase tracking-wider">
              Phase 5.2 Recovery Dispatch Manifest
            </span>
            <span className="px-2.5 py-1 rounded-md bg-slate-800 border border-slate-700 text-slate-300 text-[11px] font-mono">
              Passport Ref: {manifest.passport_id}
            </span>
          </div>
          <h3 className="text-xl sm:text-2xl font-extrabold text-slate-100 font-['Outfit'] flex items-center space-x-2">
            <Truck className="w-6 h-6 text-cyan-400" />
            <span>{manifest.manifest_id}</span>
          </h3>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            Generated: {new Date(manifest.created_at).toLocaleString()} • Batch Weight: {manifest.batch_weight_kg.toFixed(1)} kg ({manifest.weight_provenance === 'USER_CONFIRMED_SCALE_WEIGHMENT' ? 'Physical Scale' : 'Visual Projection'})
          </p>
        </div>

        {/* Target Facility Capsule */}
        <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col justify-between space-y-1.5 min-w-[280px]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-slate-400">TARGET RECOVERY FACILITY</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-mono">
              {manifest.target_facility.route_type}
            </span>
          </div>
          <div className="text-sm font-bold text-slate-200">
            {manifest.target_facility.facility_name}
          </div>
          <div className="text-[11px] text-slate-500 truncate">
            {manifest.target_facility.address || 'Configured Regional Facility Archetype'}
          </div>
        </div>
      </div>

      {/* Modeled Scenario Context Bar */}
      <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">MODELED OPERATIONAL SCENARIO</span>
          <span className="text-sm font-bold text-amber-300">{manifest.scenario_title}</span>
          <span className="text-xs text-slate-400 ml-2 font-mono">({manifest.selected_scenario_type})</span>
        </div>
        <div className="flex items-center space-x-6 text-xs font-mono">
          <div>
            <span className="text-slate-500 block text-[10px]">PROJECTED CONTAM</span>
            <span className="text-emerald-400 font-bold">{manifest.modeled_expectations.projected_contamination_percent}%</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px]">PROJECTED GRADE</span>
            <span className="text-cyan-400 font-bold">Grade {manifest.modeled_expectations.projected_recoverability_grade}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px]">INDICATIVE PAYOUT</span>
            <span className="text-emerald-400 font-bold">₹{manifest.modeled_expectations.projected_indicative_net_range.min} - ₹{manifest.modeled_expectations.projected_indicative_net_range.max}</span>
          </div>
        </div>
      </div>

      {/* Material Streams Table */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono flex items-center space-x-2">
          <PackageCheck className="w-4 h-4 text-cyan-400" />
          <span>Material Stream Breakdown ({manifest.material_breakdown.length} Streams)</span>
        </h4>
        <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950/60">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 text-slate-400 font-mono text-[11px] border-b border-slate-800">
              <tr>
                <th className="p-3">Stream / Material</th>
                <th className="p-3">Category</th>
                <th className="p-3 text-right">Share (%)</th>
                <th className="p-3 text-right">Estimated Weight</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-200 font-mono">
              {manifest.material_breakdown.map((stream, idx) => (
                <tr key={idx} className="hover:bg-slate-900/40">
                  <td className="p-3">
                    <div className="font-bold text-slate-100">{stream.name}</div>
                    <div className="text-[10px] text-slate-500">{stream.material_code}</div>
                  </td>
                  <td className="p-3 text-slate-300">
                    <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px]">
                      {stream.category}
                    </span>
                  </td>
                  <td className="p-3 text-right text-slate-300">
                    {stream.estimated_share_percent.toFixed(1)}%
                  </td>
                  <td className="p-3 text-right font-bold text-emerald-400">
                    {stream.estimated_weight_kg.toFixed(2)} kg
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Preparation Checklist & Handling Precautions Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Checklist */}
        <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-200 uppercase font-mono flex items-center space-x-2">
              <CheckSquare className="w-4 h-4 text-emerald-400" />
              <span>Preparation Checklist</span>
            </h4>
            <span className="text-[11px] font-mono text-slate-400">
              {completedCount} / {checklist.length} Completed
            </span>
          </div>

          <div className="space-y-2">
            {checklist.map((item) => (
              <div
                key={item.action_id}
                onClick={() => toggleChecklistItem(item.action_id)}
                className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start space-x-3 ${
                  item.completed
                    ? 'bg-emerald-950/20 border-emerald-500/40 text-slate-200'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="mt-0.5 flex-shrink-0">
                  {item.completed ? (
                    <CheckSquare className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-600" />
                  )}
                </div>
                <div className="flex-1 text-xs">
                  <div className={item.completed ? 'line-through text-slate-400' : 'text-slate-200 font-medium'}>
                    {item.title}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">
                    {item.rationale}
                  </p>
                  {item.observed_basis && (
                    <div className="text-[9px] font-mono text-cyan-400 mt-1">
                      Basis: {item.observed_basis}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Handling Precautions */}
        <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
          <h4 className="text-xs font-bold text-slate-200 uppercase font-mono flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span>Handling Precautions</span>
          </h4>

          <div className="space-y-2">
            {manifest.handling_precautions.map((precaution, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-amber-950/10 border border-amber-500/20 text-xs space-y-1"
              >
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  {precaution}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Manifest Disclosures */}
      <div className="p-3.5 rounded-2xl bg-slate-950/90 border border-slate-800 text-[11px] text-slate-400 leading-relaxed flex items-start space-x-2.5">
        <Info className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
        <span>{manifest.dispatch_disclosure}</span>
      </div>

      {/* Bottom Actions */}
      <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={handleCopyJson}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 flex items-center space-x-1.5 transition-all"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy Manifest JSON'}</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadJson}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 flex items-center space-x-1.5 transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Manifest</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 flex items-center space-x-1.5 transition-all"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Manifest</span>
          </button>
        </div>

        <button
          type="button"
          onClick={() => setStep(6)}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-slate-950 text-xs sm:text-sm font-extrabold shadow-lg shadow-cyan-500/20 flex items-center space-x-2 transition-transform hover:scale-105"
        >
          <Scale className="w-4 h-4" />
          <span>Proceed to Dock Intake Reconciliation</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
