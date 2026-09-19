import ratesData from '../data/seed-rates.json';
import { MaterialRate, ValuationBreakdown, QualityGrade } from '../../src/types/recyclens.types.ts';

export class ValuationService {
  private rates: MaterialRate[] = ratesData as MaterialRate[];

  public getAllRates(): MaterialRate[] {
    return this.rates;
  }

  public getRateByCode(materialCode: string): MaterialRate | undefined {
    return this.rates.find((r) => r.material_code === materialCode) || this.rates[0];
  }

  public calculateValuation(params: {
    materialCode: string;
    weightKg: number;
    contaminationPercentage: number;
    qualityGrade: QualityGrade;
    isUserSpecifiedWeight: boolean;
  }): ValuationBreakdown {
    const rate = this.getRateByCode(params.materialCode) || {
      id: 'default',
      material_code: params.materialCode || 'OTHER',
      display_name: 'Mixed Recyclables',
      category: 'OTHER',
      rate_min: 10.0,
      rate_max: 15.0,
      unit: 'kg',
      contamination_penalty_factor: 0.85,
      region: 'IN_WEST_MUMBAI',
      data_source_type: 'CONFIGURED_DEMO',
      source_label: 'Configured demo rate baseline (Mumbai / MMR Cluster)',
      last_updated: new Date().toISOString(),
    };

    // Sanitize weight: must be positive number
    const safeWeight = isNaN(params.weightKg) || params.weightKg <= 0 ? 10.0 : Math.min(10000, params.weightKg);
    const midRate = (rate.rate_min + rate.rate_max) / 2;
    const cleanBatchBenchmark = Math.round(safeWeight * midRate * 100) / 100;

    // Grade factor
    let gradeFactor = 1.0;
    if (params.qualityGrade === 'GRADE_B') gradeFactor = 0.95;
    else if (params.qualityGrade === 'GRADE_C') gradeFactor = 0.85;
    else if (params.qualityGrade === 'REJECT') gradeFactor = 0.40;

    // Contamination penalty
    const safeContam = isNaN(params.contaminationPercentage) ? 10 : Math.min(100, Math.max(0, params.contaminationPercentage));
    const contamFraction = safeContam / 100;
    const effectiveDiscount = contamFraction * rate.contamination_penalty_factor;
    const contaminationPenaltyAmount = Math.round(cleanBatchBenchmark * effectiveDiscount * 100) / 100;

    // Indicative Net Range
    const netYieldMultiplier = Math.max(0.05, (1 - effectiveDiscount) * gradeFactor);
    const netMin = Math.round(safeWeight * rate.rate_min * netYieldMultiplier);
    const netMax = Math.round(safeWeight * rate.rate_max * netYieldMultiplier);

    return {
      currency: 'INR',
      currency_symbol: '₹',
      batch_weight_kg: Math.round(safeWeight * 10) / 10,
      is_user_specified_weight: params.isUserSpecifiedWeight,
      base_rate_range: {
        min: rate.rate_min,
        max: rate.rate_max,
        unit: rate.unit,
      },
      clean_batch_benchmark: cleanBatchBenchmark,
      contamination_penalty_amount: contaminationPenaltyAmount,
      quality_grade_adjustment: gradeFactor,
      indicative_net_range: {
        min: netMin,
        max: Math.max(netMin + 10, netMax),
      },
      price_disclaimer:
        'Indicative configured benchmark — demonstration data, not a binding market quote. Final settlement subject to physical weighment and facility grading.',
      data_source_label: rate.source_label,
      is_estimate: true,
    };
  }
}

export const valuationService = new ValuationService();
