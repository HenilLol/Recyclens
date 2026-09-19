import ratesData from '../data/seed-rates.json';
import { MaterialRate, ValuationBreakdown, QualityGrade, BatchComponent, ComponentValuation } from '../../src/types/recyclens.types.ts';

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
    composition?: BatchComponent[];
    unresolvedSharePercent?: number;
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
      data_source_type: 'CONFIGURED_DEMO' as const,
      source_label: 'Configured demo rate baseline (Mumbai / MMR Cluster)',
      last_updated: new Date().toISOString(),
    };

    // Sanitize weight: must be positive number
    const safeWeight = isNaN(params.weightKg) || params.weightKg <= 0 ? 10.0 : Math.min(10000, params.weightKg);

    // Grade factor
    let gradeFactor = 1.0;
    if (params.qualityGrade === 'GRADE_B') gradeFactor = 0.95;
    else if (params.qualityGrade === 'GRADE_C') gradeFactor = 0.85;
    else if (params.qualityGrade === 'REJECT') gradeFactor = 0.40;

    // Multi-Material Composition Valuation Branch
    if (params.composition && params.composition.length > 0) {
      const compValuations: ComponentValuation[] = [];
      let totalCleanBenchmark = 0;
      let totalContamPenalty = 0;
      let totalNetMin = 0;
      let totalNetMax = 0;

      for (const comp of params.composition) {
        const cRate = this.getRateByCode(comp.material_code) || {
          id: 'default',
          material_code: comp.material_code || 'OTHER',
          display_name: comp.material || 'Mixed Recyclables',
          category: comp.category || 'OTHER',
          rate_min: 10.0,
          rate_max: 15.0,
          unit: 'kg',
          contamination_penalty_factor: 0.85,
          region: 'IN_WEST_MUMBAI',
          data_source_type: 'CONFIGURED_DEMO' as const,
          source_label: 'Configured demo rate baseline (Mumbai / MMR Cluster)',
          last_updated: new Date().toISOString(),
        };

        const shareFraction = comp.estimated_share_percent / 100;
        const allocatedWeight = Math.round(safeWeight * shareFraction * 100) / 100;
        const cMidRate = (cRate.rate_min + cRate.rate_max) / 2;
        const cCleanBenchmark = Math.round(allocatedWeight * cMidRate * 100) / 100;

        let cGradeFactor = 1.0;
        if (comp.recoverability_grade === 'GRADE_B') cGradeFactor = 0.95;
        else if (comp.recoverability_grade === 'GRADE_C') cGradeFactor = 0.85;
        else if (comp.recoverability_grade === 'REJECT') cGradeFactor = 0.40;

        const cContam = Math.min(100, Math.max(0, comp.contamination_percent));
        const cEffectiveDiscount = (cContam / 100) * cRate.contamination_penalty_factor;
        const cPenaltyAmount = Math.round(cCleanBenchmark * cEffectiveDiscount * 100) / 100;

        const cNetMultiplier = Math.max(0.05, (1 - cEffectiveDiscount) * cGradeFactor);
        const cNetMin = Math.round(allocatedWeight * cRate.rate_min * cNetMultiplier);
        const cNetMax = Math.round(allocatedWeight * cRate.rate_max * cNetMultiplier);

        compValuations.push({
          material_code: comp.material_code,
          material_name: comp.material,
          estimated_share_percent: comp.estimated_share_percent,
          allocated_weight_kg: allocatedWeight,
          illustrative_weight_kg: allocatedWeight,
          weight_allocation_basis: 'ILLUSTRATIVE_VISUAL_PROJECTION',
          allocation_disclosure:
            'Illustrative weight allocation projected from estimated visual share; true physical mass requires physical segregation and scale weighment for commercial confirmation.',
          base_rate_range: {
            min: cRate.rate_min,
            max: cRate.rate_max,
          },
          clean_benchmark: cCleanBenchmark,
          contamination_penalty: cPenaltyAmount,
          indicative_net_range: {
            min: cNetMin,
            max: Math.max(cNetMin + 5, cNetMax),
          },
          notes: `${comp.material}: ~${comp.estimated_share_percent}% visual share (~${allocatedWeight}kg illustrative allocation). Configured benchmark ₹${cRate.rate_min}–₹${cRate.rate_max}/kg.`,
        });

        totalCleanBenchmark += cCleanBenchmark;
        totalContamPenalty += cPenaltyAmount;
        totalNetMin += cNetMin;
        totalNetMax += cNetMax;
      }

      let unresolvedEconomicImpact: string | undefined = undefined;
      if (params.unresolvedSharePercent && params.unresolvedSharePercent > 0) {
        const unresolvedKg = Math.round(safeWeight * (params.unresolvedSharePercent / 100) * 10) / 10;
        unresolvedEconomicImpact = `Approx. ${params.unresolvedSharePercent}% (~${unresolvedKg}kg illustrative allocation) is visually unresolved/ambiguous and carries ₹0 baseline valuation until manual weighment and sorting.`;
      }

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
        clean_batch_benchmark: Math.round(totalCleanBenchmark * 100) / 100,
        contamination_penalty_amount: Math.round(totalContamPenalty * 100) / 100,
        quality_grade_adjustment: gradeFactor,
        indicative_net_range: {
          min: totalNetMin,
          max: Math.max(totalNetMin + 10, totalNetMax),
        },
        component_valuations: compValuations,
        unresolved_economic_impact: unresolvedEconomicImpact,
        valuation_methodology:
          'Indicative benchmark model projecting user-specified or preset batch weight across visual surface share percentages. Does not measure true physical density or mass fractions.',
        price_disclaimer:
          'Indicative configured benchmark — demonstration data, not a binding market quote. Final settlement subject to physical weighment and facility grading.',
        data_source_label: rate.source_label,
        is_estimate: true,
      };
    }

    // Single-material baseline flow (backward compatible)
    const midRate = (rate.rate_min + rate.rate_max) / 2;
    const cleanBatchBenchmark = Math.round(safeWeight * midRate * 100) / 100;

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
