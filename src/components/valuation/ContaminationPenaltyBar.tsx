import React from 'react';
import { formatINR } from '../../utils/formatters.ts';

interface ContaminationPenaltyBarProps {
  cleanBenchmark: number;
  penaltyAmount: number;
  netMin: number;
  netMax: number;
}

export const ContaminationPenaltyBar: React.FC<ContaminationPenaltyBarProps> = ({
  cleanBenchmark,
  penaltyAmount,
  netMin,
  netMax,
}) => {
  const netPortion = Math.max(0, cleanBenchmark - penaltyAmount);
  const netPercentage = cleanBenchmark > 0 ? (netPortion / cleanBenchmark) * 100 : 80;
  const penaltyPercentage = Math.min(100, 100 - netPercentage);

  return (
    <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800">
      <div className="flex items-center justify-between text-xs font-mono mb-2">
        <span className="text-slate-300 font-semibold">Yield & Deduction Waterfall</span>
        <div className="flex items-center space-x-3 text-[11px]">
          <span className="flex items-center space-x-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <span className="text-slate-400">Net Realized ({netPercentage.toFixed(0)}%)</span>
          </span>
          <span className="flex items-center space-x-1">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            <span className="text-slate-400">Contamination Loss ({penaltyPercentage.toFixed(0)}%)</span>
          </span>
        </div>
      </div>

      {/* Segmented Waterfall Bar */}
      <div className="w-full h-4 rounded-full bg-slate-950 overflow-hidden flex p-0.5 border border-slate-800">
        <div
          className="h-full rounded-l-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-700"
          style={{ width: `${netPercentage}%` }}
          title={`Net Realized Yield: ${formatINR(netMin)} - ${formatINR(netMax)}`}
        />
        <div
          className="h-full rounded-r-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-700"
          style={{ width: `${penaltyPercentage}%` }}
          title={`Contamination Deduction: -${formatINR(penaltyAmount)}`}
        />
      </div>

      <div className="flex justify-between items-center text-[10px] font-mono text-slate-500 mt-2">
        <span>Clean Batch: {formatINR(cleanBenchmark)}</span>
        <span className="text-amber-400">Yield Deduction: -{formatINR(penaltyAmount)}</span>
        <span className="text-emerald-400 font-bold">Net Payout: ₹{netMin}–₹{netMax}</span>
      </div>
    </div>
  );
};
