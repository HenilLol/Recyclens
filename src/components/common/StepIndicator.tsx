import React from 'react';
import { useRecyclensStore } from '../../store/useRecyclensStore.ts';
import { Camera, Eye, DollarSign, Truck, ShieldCheck, Scale, Check } from 'lucide-react';
import clsx from 'clsx';

export const StepIndicator: React.FC = () => {
  const { currentStep, setStep, analysisResult, currentPassport, currentReconciliationReport } = useRecyclensStore();

  const steps = [
    { number: 1, title: 'Scan Batch', icon: Camera, desc: 'Image & Input' },
    { number: 2, title: 'AI Profile', icon: Eye, desc: 'Material & Evidence' },
    { number: 3, title: 'Optimize', icon: DollarSign, desc: 'What-If Scenarios' },
    { number: 4, title: 'Route', icon: Truck, desc: 'Recycler Matching' },
    { number: 5, title: 'Passport', icon: ShieldCheck, desc: 'Integrity & Dispatch' },
    { number: 6, title: 'Reconcile', icon: Scale, desc: 'Dock Intake & Variance' },
  ];

  return (
    <div className="w-full py-4">
      <div className="max-w-6xl mx-auto grid grid-cols-3 md:grid-cols-6 gap-2 sm:gap-3">
        {steps.map((step) => {
          const Icon = step.icon;
          const isActive = currentStep === step.number;
          const isCompleted =
            currentStep > step.number ||
            (step.number === 5 && currentPassport !== null && currentStep > 5) ||
            (step.number === 6 && currentReconciliationReport !== null);
          const isClickable =
            step.number === 1 ||
            (analysisResult !== null && step.number <= 4) ||
            (currentPassport !== null && step.number === 5) ||
            (currentPassport !== null && step.number === 6);

          return (
            <button
              key={step.number}
              disabled={!isClickable}
              onClick={() => isClickable && setStep(step.number as 1 | 2 | 3 | 4 | 5 | 6)}
              className={clsx(
                'relative flex flex-col p-3 rounded-xl border text-left transition-all duration-200',
                isActive
                  ? 'bg-hud-card border-emerald-500/60 shadow-lg shadow-emerald-500/10'
                  : isCompleted
                  ? 'bg-hud-surface/60 border-slate-700/60 hover:border-slate-600'
                  : 'bg-hud-surface/30 border-slate-800/40 opacity-50 cursor-not-allowed'
              )}
            >
              {/* Active Glow Accent Bar */}
              {isActive && (
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 rounded-t-xl" />
              )}

              <div className="flex items-center justify-between mb-1.5">
                <span
                  className={clsx(
                    'w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono font-bold',
                    isActive
                      ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/30'
                      : isCompleted
                      ? 'bg-slate-700 text-emerald-400'
                      : 'bg-slate-800 text-slate-500'
                  )}
                >
                  {isCompleted && currentStep !== step.number ? <Check className="w-3.5 h-3.5" /> : step.number}
                </span>

                <Icon
                  className={clsx(
                    'w-4 h-4',
                    isActive ? 'text-emerald-400' : isCompleted ? 'text-cyan-400' : 'text-slate-600'
                  )}
                />
              </div>

              <div className="font-semibold text-xs sm:text-sm text-slate-100 truncate">
                {step.title}
              </div>
              <div className="text-[11px] text-slate-400 truncate hidden sm:block">
                {step.desc}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
