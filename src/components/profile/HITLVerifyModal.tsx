import React, { useState } from 'react';
import { useRecyclensStore } from '../../store/useRecyclensStore.ts';
import { X, Check, Edit3, Scale, DollarSign, MessageSquare } from 'lucide-react';

const MATERIAL_OPTIONS = [
  { code: 'PLASTIC_PET', label: 'PET (Type 1 Plastic - Bottles)' },
  { code: 'PLASTIC_HDPE', label: 'HDPE (Type 2 Plastic - Rigid Cans/Jugs)' },
  { code: 'PLASTIC_LDPE', label: 'LDPE (Type 4 Plastic - Films/Bags)' },
  { code: 'PAPER_CARDBOARD', label: 'Corrugated Cardboard (OCC Boxes)' },
  { code: 'PAPER_MIXED', label: 'Mixed Paper & Newspapers' },
  { code: 'METAL_ALUMINIUM', label: 'Aluminium Beverage Cans (UBC)' },
  { code: 'METAL_STEEL', label: 'Steel Scrap & Tin Cans' },
  { code: 'GLASS_CULLET', label: 'Glass Bottles & Cullet' },
  { code: 'EWASTE_PCB', label: 'Electronic Scrap & Circuit Boards' },
  { code: 'TEXTILE_COTTON', label: 'Post-Consumer Cotton Scrap' },
];

export const HITLVerifyModal: React.FC = () => {
  const { isHITLModalOpen, closeHITLModal, analysisResult, submitFeedback } = useRecyclensStore();

  const [selectedMaterial, setSelectedMaterial] = useState<string>(
    analysisResult?.recovery_profile.primary_material.code || 'PLASTIC_PET'
  );
  const [measuredWeight, setMeasuredWeight] = useState<string>(
    analysisResult?.valuation.batch_weight_kg.toString() || '15.0'
  );
  const [realizedRate, setRealizedRate] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!isHITLModalOpen || !analysisResult) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await submitFeedback({
        corrected_material_code: selectedMaterial,
        actual_measured_weight_kg: measuredWeight ? parseFloat(measuredWeight) : undefined,
        actual_realized_rate: realizedRate ? parseFloat(realizedRate) : undefined,
        user_notes: notes,
      });

      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        closeHITLModal();
      }, 1200);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fade-in">
      <div className="relative w-full max-w-lg rounded-3xl hud-glass border border-emerald-500/40 bg-hud-card p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Edit3 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100 font-['Outfit']">
                Human-in-the-Loop Material Verification
              </h3>
              <p className="text-[11px] text-slate-400">
                Manual verification feedback to log ground-truth batch corrections
              </p>
            </div>
          </div>
          <button
            onClick={closeHITLModal}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {submitted ? (
          <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/40 animate-bounce">
              <Check className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-100">Feedback Logged Successfully!</h4>
            <p className="text-xs text-slate-400 max-w-xs">
              Batch correction logged for auditing and valuation recalculation.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Field 1: Material Correction */}
            <div>
              <label className="block text-xs font-mono font-semibold text-slate-300 mb-1">
                Verified Material Classification
              </label>
              <select
                value={selectedMaterial}
                onChange={(e) => setSelectedMaterial(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200 focus:border-emerald-500 focus:outline-none"
              >
                {MATERIAL_OPTIONS.map((opt) => (
                  <option key={opt.code} value={opt.code}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Field 2: Actual Scale Weighment */}
            <div>
              <label className="block text-xs font-mono font-semibold text-slate-300 mb-1 flex items-center space-x-1.5">
                <Scale className="w-3.5 h-3.5 text-cyan-400" />
                <span>Actual Measured Weight (kg) [Optional]</span>
              </label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                value={measuredWeight}
                onChange={(e) => setMeasuredWeight(e.target.value)}
                placeholder="e.g. 14.8"
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200 focus:border-cyan-500 focus:outline-none"
              />
            </div>

            {/* Field 3: Actual Realized Rate */}
            <div>
              <label className="block text-xs font-mono font-semibold text-slate-300 mb-1 flex items-center space-x-1.5">
                <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                <span>Actual Realized Scrap Rate (₹/kg) [Optional]</span>
              </label>
              <input
                type="number"
                step="0.5"
                min="1"
                value={realizedRate}
                onChange={(e) => setRealizedRate(e.target.value)}
                placeholder="e.g. 36.00"
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200 focus:border-emerald-500 focus:outline-none"
              />
            </div>

            {/* Field 4: Sorter / Recycler Notes */}
            <div>
              <label className="block text-xs font-mono font-semibold text-slate-300 mb-1 flex items-center space-x-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
                <span>Condition / Contamination Notes [Optional]</span>
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. High dirt on lower flutes, caps were manually removed before baling..."
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200 focus:border-amber-500 focus:outline-none"
              />
            </div>

            {/* Action Buttons */}
            <div className="pt-3 border-t border-slate-800 flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={closeHITLModal}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-xs text-slate-950 font-bold shadow-md shadow-emerald-500/20 flex items-center space-x-1.5 transition-all"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{isSubmitting ? 'Updating...' : 'Save & Recalculate'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
