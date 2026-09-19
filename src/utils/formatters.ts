import { QualityGrade, ContaminationSeverity, MaterialCategory } from '../types/recyclens.types.ts';

export function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatWeight(kg: number): string {
  if (kg >= 1000) {
    return `${(kg / 1000).toFixed(2)} MT (Metric Ton)`;
  }
  return `${kg.toFixed(1)} kg`;
}

export function getGradeBadge(grade: QualityGrade): { label: string; color: string; bg: string; border: string } {
  switch (grade) {
    case 'GRADE_A':
      return { label: 'Grade A (High Purity)', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' };
    case 'GRADE_B':
      return { label: 'Grade B (Standard Commercial)', color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/30' };
    case 'GRADE_C':
      return { label: 'Grade C (Heavily Degraded)', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30' };
    case 'REJECT':
      return { label: 'Non-Recyclable / Mixed', color: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/30' };
  }
}

export function getContaminationBadge(severity: ContaminationSeverity): { label: string; color: string; bg: string } {
  switch (severity) {
    case 'CLEAN':
      return { label: 'Pristine Clean (<5%)', color: 'text-emerald-400', bg: 'bg-emerald-500/15' };
    case 'LOW':
      return { label: 'Low Contamination (5-15%)', color: 'text-cyan-400', bg: 'bg-cyan-500/15' };
    case 'MODERATE':
      return { label: 'Moderate Residue (15-30%)', color: 'text-amber-400', bg: 'bg-amber-500/15' };
    case 'HIGH':
      return { label: 'High Contamination (30-50%)', color: 'text-orange-400', bg: 'bg-orange-500/15' };
    case 'CRITICAL':
      return { label: 'Critical Contamination (>50%)', color: 'text-rose-400', bg: 'bg-rose-500/15' };
  }
}

export function getCategoryBadge(category: MaterialCategory): { label: string; iconColor: string; badgeBg: string } {
  switch (category) {
    case 'PLASTIC':
      return { label: 'Polymer / Plastic', iconColor: 'text-cyan-400', badgeBg: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20' };
    case 'PAPER':
      return { label: 'Cellulose / Fiber', iconColor: 'text-amber-400', badgeBg: 'bg-amber-500/10 text-amber-300 border-amber-500/20' };
    case 'METAL':
      return { label: 'Non-Ferrous / Ferrous Metal', iconColor: 'text-emerald-400', badgeBg: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20' };
    case 'EWASTE':
      return { label: 'Electronic Scrap / PCB', iconColor: 'text-purple-400', badgeBg: 'bg-purple-500/10 text-purple-300 border-purple-500/20' };
    case 'GLASS':
      return { label: 'Container Glass / Cullet', iconColor: 'text-teal-400', badgeBg: 'bg-teal-500/10 text-teal-300 border-teal-500/20' };
    case 'TEXTILE':
      return { label: 'Post-Consumer Textile', iconColor: 'text-pink-400', badgeBg: 'bg-pink-500/10 text-pink-300 border-pink-500/20' };
    default:
      return { label: 'General Scrap', iconColor: 'text-slate-400', badgeBg: 'bg-slate-500/10 text-slate-300 border-slate-500/20' };
  }
}
