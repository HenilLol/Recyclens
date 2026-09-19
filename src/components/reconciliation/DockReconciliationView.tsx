import React, { useState } from 'react';
import { useRecyclensStore } from '../../store/useRecyclensStore.ts';
import {
  Scale,
  CheckCircle2,
  AlertTriangle,
  Info,
  Download,
  Copy,
  Check,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  PackageX,
  FileCheck,
  ShieldCheck,
  Printer,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { FractionDisposition } from '../../types/recyclens.types.ts';

export const DockReconciliationView: React.FC = () => {
  const {
    currentPassport,
    currentDispatchManifest,
    currentReconciliationReport,
    submitDockIntakeReconciliation,
    isReconciling,
    resetToScan,
    setStep,
  } = useRecyclensStore();

  const [copied, setCopied] = useState(false);
  const [showForm, setShowForm] = useState(!currentReconciliationReport);

  // Form states initialized from passport/manifest if available
  const defaultWeight = currentDispatchManifest?.batch_weight_kg ||
    currentPassport?.evidence_snapshot.batch_weight_kg ||
    10.0;
  const defaultContam = currentDispatchManifest?.modeled_expectations.projected_contamination_percent ??
    currentPassport?.evidence_snapshot.contamination.percentage ??
    5.0;

  const [grossWeight, setGrossWeight] = useState<number>(defaultWeight);
  const [observedContam, setObservedContam] = useState<number>(defaultContam);
  const [prepStatus, setPrepStatus] = useState<
    'NOT_PREPARED' | 'PARTIALLY_PREPARED' | 'FULLY_PREPARED'
  >('FULLY_PREPARED');
  const [operatorNotes, setOperatorNotes] = useState<string>('');
  const [unexpectedMaterials, setUnexpectedMaterials] = useState<string>('');

  // Initial fraction dispositions based on passport composition
  const initialFractions: FractionDisposition[] = currentPassport?.evidence_snapshot.composition.map((c) => ({
    material_code: c.material_code,
    material_name: c.material,
    weighed_weight_kg: Number(((c.estimated_share_percent / 100) * defaultWeight).toFixed(2)),
    disposition_status: 'ACCEPTED' as const,
    rejection_reason: '',
  })) || [];

  const [fractionDispositions, setFractionDispositions] = useState<FractionDisposition[]>(initialFractions);

  if (!currentPassport && !currentReconciliationReport) {
    return (
      <div className="p-8 rounded-3xl hud-glass border border-slate-800 text-center space-y-4">
        <Scale className="w-12 h-12 text-slate-500 mx-auto" />
        <h3 className="text-base font-bold text-slate-200">No Active Batch For Reconciliation</h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          Please scan and generate a Recovery Passport before proceeding to physical intake reconciliation.
        </p>
        <button
          onClick={() => setStep(1)}
          className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold"
        >
          Begin New Recovery Scan
        </button>
      </div>
    );
  }

  const handleSubmitReconciliation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassport) return;

    await submitDockIntakeReconciliation({
      recorded_at: new Date().toISOString(),
      actual_intake_weight_kg: Number(grossWeight),
      weight_provenance: 'USER_CONFIRMED_SCALE_WEIGHMENT',
      operator_observed_contamination_percent: Number(observedContam),
      preparation_completion_status: prepStatus,
      fraction_dispositions: fractionDispositions,
      unexpected_materials: unexpectedMaterials
        ? unexpectedMaterials.split(',').map((s) => s.trim()).filter(Boolean)
        : undefined,
      operator_notes: operatorNotes || undefined,
    });
    setShowForm(false);
  };

  const handleCopyReport = () => {
    if (!currentReconciliationReport) return;
    navigator.clipboard.writeText(JSON.stringify(currentReconciliationReport, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadReport = () => {
    if (!currentReconciliationReport) return;
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(currentReconciliationReport, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${currentReconciliationReport.reconciliation_id}_reconciliation_report.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Banner / Intake Controller Toggle */}
      <div className="p-6 rounded-3xl hud-glass border border-purple-500/40 bg-hud-card relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <span className="px-2.5 py-1 rounded-md bg-purple-500/10 border border-purple-500/30 text-purple-400 text-[11px] font-mono font-bold uppercase tracking-wider">
                Phase 5.3 Dock Intake Reconciliation
              </span>
              {currentPassport && (
                <span className="px-2.5 py-1 rounded-md bg-slate-800 border border-slate-700 text-slate-300 text-[11px] font-mono">
                  Passport: {currentPassport.passport_id}
                </span>
              )}
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-100 font-['Outfit'] flex items-center space-x-2">
              <Scale className="w-6 h-6 text-purple-400" />
              <span>
                {currentReconciliationReport
                  ? currentReconciliationReport.reconciliation_id
                  : 'Physical Intake Weighment & Triage'}
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-1 font-mono">
              Compare AI/modeled recovery expectations against physical receiving dock observations
            </p>
          </div>

          {currentReconciliationReport && (
            <button
              onClick={() => setShowForm(!showForm)}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 flex items-center space-x-2 self-start sm:self-auto"
            >
              <span>{showForm ? 'Hide Intake Form' : 'Adjust Intake Entry'}</span>
              {showForm ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          )}
        </div>

        {/* Physical Intake Form */}
        {showForm && (
          <form onSubmit={handleSubmitReconciliation} className="pt-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Actual Gross Weight */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-mono text-slate-300 uppercase">
                  Actual Gross Intake Weight (kg) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={grossWeight}
                  onChange={(e) => setGrossWeight(parseFloat(e.target.value) || 0)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-700 text-slate-100 font-mono text-sm focus:outline-none focus:border-purple-500"
                />
              </div>

              {/* Observed Contamination */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-mono text-slate-300 uppercase">
                  Observed Contamination (%) *
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  required
                  value={observedContam}
                  onChange={(e) => setObservedContam(parseFloat(e.target.value) || 0)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-700 text-slate-100 font-mono text-sm focus:outline-none focus:border-purple-500"
                />
              </div>

              {/* Preparation Status */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-mono text-slate-300 uppercase">
                  Preparation Completion Status
                </label>
                <select
                  value={prepStatus}
                  onChange={(e) => setPrepStatus(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-purple-500"
                >
                  <option value="FULLY_PREPARED">Fully Prepared</option>
                  <option value="PARTIALLY_PREPARED">Partially Prepared</option>
                  <option value="NOT_PREPARED">Not Prepared</option>
                </select>
              </div>
            </div>

            {/* Fraction Dispositions */}
            {fractionDispositions.length > 0 && (
              <div className="space-y-3">
                <label className="text-[11px] font-mono text-slate-300 uppercase block">
                  Per-Fraction Intake Dispositions
                </label>
                <div className="space-y-2">
                  {fractionDispositions.map((frac, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs"
                    >
                      <div className="w-full md:w-1/3">
                        <span className="font-bold text-slate-200">{frac.material_name || frac.material_code}</span>
                        <span className="text-[10px] text-slate-500 font-mono block">{frac.material_code}</span>
                      </div>

                      <div className="flex items-center space-x-2 w-full md:w-1/3">
                        <label className="text-[10px] text-slate-400 font-mono">Weighed kg:</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={frac.weighed_weight_kg || 0}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            setFractionDispositions((prev) =>
                              prev.map((f, i) => (i === idx ? { ...f, weighed_weight_kg: val } : f))
                            );
                          }}
                          className="w-24 px-2 py-1 rounded bg-slate-900 border border-slate-700 text-slate-200 font-mono text-xs"
                        />
                      </div>

                      <div className="w-full md:w-1/3 flex items-center space-x-2">
                        <select
                          value={frac.disposition_status}
                          onChange={(e) => {
                            const val = e.target.value as any;
                            setFractionDispositions((prev) =>
                              prev.map((f, i) => (i === idx ? { ...f, disposition_status: val } : f))
                            );
                          }}
                          className="px-2 py-1 rounded bg-slate-900 border border-slate-700 text-slate-200 text-xs w-full"
                        >
                          <option value="ACCEPTED">Accepted</option>
                          <option value="DOWNGRADED">Downgraded</option>
                          <option value="REJECTED">Rejected</option>
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Notes & Unexpected Materials */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-mono text-slate-300 uppercase">
                  Unexpected Foreign Materials (Comma-separated)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Broken Glass, Industrial Batteries, Slag"
                  value={unexpectedMaterials}
                  onChange={(e) => setUnexpectedMaterials(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-mono text-slate-300 uppercase">
                  Dock Operator Observations
                </label>
                <input
                  type="text"
                  placeholder="e.g. Moisture detected in lower layer; closures separated on-site"
                  value={operatorNotes}
                  onChange={(e) => setOperatorNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={isReconciling}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-400 hover:to-indigo-400 text-slate-950 text-xs sm:text-sm font-extrabold shadow-lg shadow-purple-500/20 flex items-center space-x-2 transition-transform hover:scale-105"
              >
                <FileCheck className="w-4 h-4" />
                <span>{isReconciling ? 'Calculating Reconciliation...' : 'Execute Intake Reconciliation'}</span>
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Reconciliation Report Cards */}
      {currentReconciliationReport && (
        <div className="space-y-6">
          {/* Integrity status badge */}
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <span className="text-xs font-mono text-slate-300">
                PASSPORT INTEGRITY CHECK AT INTAKE:
              </span>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                  currentReconciliationReport.passport_integrity_status.is_valid
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                }`}
              >
                {currentReconciliationReport.passport_integrity_status.is_valid ? 'VERIFIED MATCH' : 'HASH MISMATCH'}
              </span>
            </div>
            <span className="text-[11px] font-mono text-slate-500">
              {new Date(currentReconciliationReport.reconciled_at).toLocaleString()}
            </span>
          </div>

          {/* 3 Reconciliation Domain Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Domain 1: Weight Variance */}
            <div className="p-5 rounded-2xl hud-glass border border-slate-800 bg-slate-950/60 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                <span className="text-xs font-bold text-slate-200 font-mono uppercase flex items-center space-x-2">
                  <Scale className="w-4 h-4 text-cyan-400" />
                  <span>Weight Variance</span>
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold flex items-center space-x-1 ${
                    currentReconciliationReport.weight_reconciliation.variance_kg >= 0
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : 'bg-amber-500/20 text-amber-300'
                  }`}
                >
                  {currentReconciliationReport.weight_reconciliation.variance_kg >= 0 ? (
                    <TrendingUp className="w-3 h-3" />
                  ) : (
                    <TrendingDown className="w-3 h-3" />
                  )}
                  <span>
                    {currentReconciliationReport.weight_reconciliation.variance_kg > 0 ? '+' : ''}
                    {currentReconciliationReport.weight_reconciliation.variance_kg.toFixed(2)} kg (
                    {currentReconciliationReport.weight_reconciliation.variance_percent > 0 ? '+' : ''}
                    {currentReconciliationReport.weight_reconciliation.variance_percent.toFixed(1)}%)
                  </span>
                </span>
              </div>

              <div className="space-y-2 text-xs font-mono">
                <div className="flex justify-between py-1 border-b border-slate-900">
                  <span className="text-slate-400">Pre-Dispatch Projected:</span>
                  <span className="text-slate-200 font-bold">
                    {currentReconciliationReport.weight_reconciliation.projected_weight_kg.toFixed(2)} kg
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-900">
                  <span className="text-slate-400">Actual Dock Intake:</span>
                  <span className="text-emerald-400 font-bold">
                    {currentReconciliationReport.weight_reconciliation.actual_intake_weight_kg.toFixed(2)} kg
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-900">
                  <span className="text-slate-400">Variance Category:</span>
                  <span className="text-cyan-400 font-bold">
                    {currentReconciliationReport.weight_reconciliation.variance_category}
                  </span>
                </div>
              </div>

              {/* Explanations */}
              <div className="space-y-1.5 pt-2">
                <span className="text-[10px] font-mono text-slate-500 uppercase block">
                  Variance Explanations
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {currentReconciliationReport.weight_reconciliation.uncertainty_explanations.map((exp, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-[10px] font-mono text-slate-300"
                    >
                      {exp.replace(/_/g, ' ')}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Domain 2: Quality Reconciliation */}
            <div className="p-5 rounded-2xl hud-glass border border-slate-800 bg-slate-950/60 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                <span className="text-xs font-bold text-slate-200 font-mono uppercase flex items-center space-x-2">
                  <FileCheck className="w-4 h-4 text-purple-400" />
                  <span>Quality Reconciliation</span>
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-500/20 text-purple-300">
                  {currentReconciliationReport.quality_reconciliation.preparation_observed}
                </span>
              </div>

              <div className="space-y-2 text-xs font-mono">
                <div className="flex justify-between py-1 border-b border-slate-900">
                  <span className="text-slate-400">Projected Contamination:</span>
                  <span className="text-slate-200">
                    {currentReconciliationReport.quality_reconciliation.projected_contamination_percent}%
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-900">
                  <span className="text-slate-400">Actual Contamination:</span>
                  <span className="text-amber-400 font-bold">
                    {currentReconciliationReport.quality_reconciliation.actual_contamination_percent}%
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-900">
                  <span className="text-slate-400">Contamination Delta:</span>
                  <span className="text-cyan-400 font-bold">
                    {currentReconciliationReport.quality_reconciliation.contamination_variance_points > 0 ? '+' : ''}
                    {currentReconciliationReport.quality_reconciliation.contamination_variance_points.toFixed(1)} pp
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-900">
                  <span className="text-slate-400">Fractions Count:</span>
                  <span className="text-slate-200 font-bold">
                    {currentReconciliationReport.quality_reconciliation.accepted_fractions_count} Accepted /{' '}
                    <span className="text-rose-400">
                      {currentReconciliationReport.quality_reconciliation.rejected_fractions_count} Rejected
                    </span>
                  </span>
                </div>
              </div>

              {currentReconciliationReport.quality_reconciliation.unexpected_materials_flagged.length > 0 && (
                <div className="p-2.5 rounded-xl bg-rose-950/20 border border-rose-500/20 text-xs">
                  <span className="text-[10px] font-mono text-rose-400 uppercase block mb-1">
                    Unexpected Contaminants
                  </span>
                  <p className="text-slate-300 text-[11px]">
                    {currentReconciliationReport.quality_reconciliation.unexpected_materials_flagged.join(', ')}
                  </p>
                </div>
              )}
            </div>

            {/* Domain 3: Economic Reconciliation */}
            <div className="p-5 rounded-2xl hud-glass border border-slate-800 bg-slate-950/60 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                <span className="text-xs font-bold text-slate-200 font-mono uppercase flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Economic Variance</span>
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300">
                  Indicative
                </span>
              </div>

              <div className="space-y-2 text-xs font-mono">
                <div className="flex justify-between py-1 border-b border-slate-900">
                  <span className="text-slate-400">Pre-Dispatch Payout:</span>
                  <span className="text-slate-300">
                    ₹{currentReconciliationReport.economic_reconciliation.projected_indicative_net_range.min} - ₹
                    {currentReconciliationReport.economic_reconciliation.projected_indicative_net_range.max}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-900">
                  <span className="text-slate-400">Intake Realized Payout:</span>
                  <span className="text-emerald-400 font-bold">
                    ₹{currentReconciliationReport.economic_reconciliation.realized_indicative_net_range.min} - ₹
                    {currentReconciliationReport.economic_reconciliation.realized_indicative_net_range.max}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-900">
                  <span className="text-slate-400">Variance Midpoint:</span>
                  <span
                    className={`font-bold ${
                      currentReconciliationReport.economic_reconciliation.variance_indicative_midpoint >= 0
                        ? 'text-emerald-400'
                        : 'text-amber-400'
                    }`}
                  >
                    {currentReconciliationReport.economic_reconciliation.variance_indicative_midpoint >= 0 ? '+' : ''}₹
                    {currentReconciliationReport.economic_reconciliation.variance_indicative_midpoint.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-[10px] text-slate-400 leading-relaxed">
                {currentReconciliationReport.economic_reconciliation.economic_note}
              </div>
            </div>
          </div>

          {/* Disclosures banner */}
          <div className="p-3.5 rounded-2xl bg-slate-950/90 border border-slate-800 text-[11px] text-slate-400 leading-relaxed flex items-start space-x-2.5">
            <Info className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
            <span>{currentReconciliationReport.reconciliation_disclosure}</span>
          </div>

          {/* Bottom Actions */}
          <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={handleCopyReport}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 flex items-center space-x-1.5 transition-all"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied Report' : 'Copy Report JSON'}</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadReport}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 flex items-center space-x-1.5 transition-all"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Report</span>
              </button>

              <button
                type="button"
                onClick={handlePrint}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 flex items-center space-x-1.5 transition-all"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Report</span>
              </button>
            </div>

            <button
              type="button"
              onClick={resetToScan}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 text-xs sm:text-sm font-extrabold shadow-lg shadow-emerald-500/20 flex items-center space-x-2 transition-transform hover:scale-105"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Start New Recovery Batch</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
