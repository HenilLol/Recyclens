import React, { useState } from 'react';
import { useRecyclensStore } from '../../store/useRecyclensStore.ts';
import { X, Truck, Copy, Check, Send } from 'lucide-react';

export const DispatchModal: React.FC = () => {
  const { selectedRecyclerForDispatch, closeDispatchModal, analysisResult, weightKg, userLocation } = useRecyclensStore();
  const [copied, setCopied] = useState(false);
  const [dispatched, setDispatched] = useState(false);

  if (!selectedRecyclerForDispatch || !analysisResult) return null;

  const { recycler, estimated_payout_range } = selectedRecyclerForDispatch;
  const { recovery_profile } = analysisResult;

  const manifestText = `RECYCLENS SIMULATED DISPATCH INQUIRY
----------------------------------------
Facility Archetype: ${recycler.name}
Material: ${recovery_profile.primary_material.name} (${recovery_profile.primary_material.code})
Quality Grade: ${recovery_profile.recoverability.grade}
Contamination: ${recovery_profile.contamination.percentage}% (${recovery_profile.contamination.type})
Batch Weight: ${weightKg.toFixed(1)} kg
Indicative Payout Range: ₹${estimated_payout_range.min} - ₹${estimated_payout_range.max}
Pickup Address: ${userLocation.label} (${userLocation.lat.toFixed(4)}, ${userLocation.lng.toFixed(4)})
Scan Reference: ${analysisResult.scan_id}
Status: Demonstration Simulation Mode
Generated via RecycLens Material Recovery Intelligence`;

  const handleCopyManifest = () => {
    navigator.clipboard.writeText(manifestText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendInquiry = () => {
    setDispatched(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fade-in">
      <div className="relative w-full max-w-lg rounded-3xl hud-glass border border-emerald-500/40 bg-hud-card p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Truck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100 font-['Outfit']">
                Simulated Dispatch Manifest
              </h3>
              <p className="text-[11px] text-slate-400">
                Demonstration inquiry for {recycler.name}
              </p>
            </div>
          </div>
          <button
            onClick={closeDispatchModal}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {dispatched ? (
          <div className="py-8 flex flex-col items-center justify-center text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/40 animate-bounce">
              <Check className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-100">Simulated Inquiry Transmitted!</h4>
            <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
              Manifest generated for <strong>{recycler.name}</strong>. In production deployment, this triggers automated dispatch API / webhook integration with the facility's weighbridge system.
            </p>
            <div className="text-xs font-mono text-cyan-400 pt-2">
              Dispatch Ref: SIM-DSP-{Date.now().toString().substring(6)}
            </div>
            <button
              onClick={closeDispatchModal}
              className="mt-4 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 font-semibold"
            >
              Done
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Manifest Summary Box */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 font-mono text-xs space-y-1.5 text-slate-300">
              <div className="flex justify-between text-slate-400">
                <span>Material:</span>
                <span className="text-slate-100 font-bold">{recovery_profile.primary_material.name}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Estimated Batch:</span>
                <span className="text-cyan-400 font-bold">{weightKg.toFixed(1)} kg</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Indicative Payout:</span>
                <span className="text-emerald-400 font-bold">₹{estimated_payout_range.min} – ₹{estimated_payout_range.max}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Pickup Location:</span>
                <span className="text-slate-300">{userLocation.label}</span>
              </div>
            </div>

            {/* Recycler Contact Direct */}
            <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs">
              <div>
                <div className="text-slate-400 text-[11px] font-mono">SIMULATION INTAKE DESK</div>
                <div className="text-slate-200 font-bold">{recycler.contact_phone}</div>
              </div>
              <div className="text-right">
                <div className="text-slate-400 text-[11px] font-mono">STATUS</div>
                <div className="text-emerald-400 text-[11px] font-semibold">Demo Ready</div>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={handleCopyManifest}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 font-semibold border border-slate-700 flex items-center space-x-1.5 transition-all"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied Manifest' : 'Copy Manifest'}</span>
              </button>

              <button
                type="button"
                onClick={handleSendInquiry}
                className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 flex items-center space-x-1.5 transition-transform hover:scale-105"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Simulate Dispatch</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
