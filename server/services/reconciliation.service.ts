import crypto from 'crypto';
import { z } from 'zod';
import {
  BatchRecoveryPassport,
  DockIntakeRecord,
  EconomicReconciliationResult,
  IntakeReconciliationReport,
  QualityReconciliationResult,
  ReconcileIntakeInput,
  WeightReconciliationResult,
} from '../../src/types/recyclens.types.ts';
import { passportService } from './passport.service.ts';
import { valuationService } from './valuation.service.ts';

export const RECONCILIATION_DISCLOSURE_STATEMENT =
  'This Intake Reconciliation Report is an operational comparison of pre-dispatch modeled expectations and dock intake observations. It reflects mathematical variances and operator-declared dock observations, but does not constitute a financial settlement certificate, commercial audit certification, or legal custody transfer.';

const fractionDispositionSchema = z.object({
  material_code: z.string().min(1).max(50),
  material_name: z.string().max(100).optional(),
  disposition_status: z.enum(['ACCEPTED', 'REJECTED', 'DOWNGRADED']),
  weighed_weight_kg: z.number().finite().nonnegative().max(100000).optional(),
  rejection_reason: z.string().max(500).optional(),
});

export const dockIntakeSchema = z.object({
  passport_id: z.string().min(1).max(100),
  manifest_id: z.string().max(100).optional(),
  recorded_at: z.string(),
  actual_intake_weight_kg: z.number().finite().positive().max(100000),
  weight_provenance: z.literal('USER_CONFIRMED_SCALE_WEIGHMENT'),
  operator_observed_contamination_percent: z.number().finite().min(0).max(100),
  preparation_completion_status: z.enum(['NOT_PREPARED', 'PARTIALLY_PREPARED', 'FULLY_PREPARED']),
  fraction_dispositions: z.array(fractionDispositionSchema).max(30).default([]),
  unexpected_materials: z.array(z.string().max(200)).max(20).optional(),
  operator_notes: z.string().max(2000).optional(),
});

export const reconcileIntakeInputSchema = z.object({
  passport: z.custom<BatchRecoveryPassport>((val) => {
    return val && typeof val === 'object' && 'passport_id' in val && 'integrity' in val;
  }, 'Valid BatchRecoveryPassport object is required.'),
  manifest: z.any().optional(),
  intake: dockIntakeSchema,
});

export class ReconciliationService {
  /**
   * Generates a unique reconciliation identifier in the format REC-YYYY-<16 HEX CHARS>.
   */
  private generateReconciliationId(createdAt: string): string {
    const year = new Date(createdAt).getUTCFullYear();
    const randomEntropy = crypto.randomBytes(8).toString('hex').toUpperCase();
    return `REC-${year}-${randomEntropy}`;
  }

  /**
   * Reconciles dock intake weighment and quality observations against pre-dispatch Recovery Passport expectations.
   */
  public reconcileIntake(input: ReconcileIntakeInput): IntakeReconciliationReport {
    // 1. Validate Input Schemas
    const validated = reconcileIntakeInputSchema.parse(input);
    const passport = structuredClone(validated.passport) as BatchRecoveryPassport;
    const intake = structuredClone(validated.intake) as DockIntakeRecord;

    const reconciledAt = new Date().toISOString();
    const reconciliationId = this.generateReconciliationId(reconciledAt);

    // 2. Cryptographic Integrity Verification
    const integrityResult = passportService.verifyPassportIntegrity(passport);
    const integrityStatus = {
      is_valid: integrityResult.isValid,
      details: integrityResult.isValid
        ? 'Passport passed SHA-256 canonical payload verification.'
        : `Integrity check failed: ${integrityResult.details || 'Payload hash mismatch'}.`,
    };

    // 3. Weight Reconciliation
    const projectedWeight = passport.evidence_snapshot.batch_weight_kg;
    const actualWeight = intake.actual_intake_weight_kg;
    const weightDelta = Math.round((actualWeight - projectedWeight) * 100) / 100;
    const variancePercent = projectedWeight > 0
      ? Math.round(((actualWeight - projectedWeight) / projectedWeight) * 1000) / 10
      : 0;

    let varianceCategory: 'MATCH' | 'SURPLUS' | 'DEFICIT' = 'MATCH';
    if (Math.abs(weightDelta) >= 0.05) {
      varianceCategory = weightDelta > 0 ? 'SURPLUS' : 'DEFICIT';
    }

    const uncertaintyExplanations: string[] = [];
    if (Math.abs(variancePercent) <= 8.0) {
      uncertaintyExplanations.push(
        'Weight variance is within normal visual volume-to-mass projection tolerance (±8%).'
      );
    } else if (variancePercent < -8.0) {
      uncertaintyExplanations.push(
        'Physical intake weight deficit observed; consistent with liquid drainage, moisture loss, tare weight deductions, or pre-dispatch sorting.'
      );
    } else {
      uncertaintyExplanations.push(
        'Physical intake weight surplus observed; consistent with higher material density, packaging tare retention, or moisture absorption during transit.'
      );
    }

    if (intake.operator_notes) {
      uncertaintyExplanations.push(`Operator Dock Note: ${intake.operator_notes}`);
    }

    const weightReconciliation: WeightReconciliationResult = {
      projected_weight_kg: projectedWeight,
      projected_provenance: passport.evidence_snapshot.weight_provenance,
      actual_intake_weight_kg: actualWeight,
      actual_provenance: 'USER_CONFIRMED_SCALE_WEIGHMENT',
      variance_kg: weightDelta,
      variance_percent: variancePercent,
      variance_category: varianceCategory,
      uncertainty_explanations: uncertaintyExplanations,
    };

    // 4. Quality & Fraction Reconciliation
    const projectedContam = passport.scenario_snapshot.modeled_contamination_percent;
    const actualContam = intake.operator_observed_contamination_percent;
    const contamDelta = Math.round((actualContam - projectedContam) * 10) / 10;

    let acceptedCount = 0;
    let rejectedCount = 0;
    for (const f of intake.fraction_dispositions) {
      if (f.disposition_status === 'ACCEPTED') acceptedCount++;
      if (f.disposition_status === 'REJECTED') rejectedCount++;
    }

    const qualityReconciliation: QualityReconciliationResult = {
      projected_contamination_percent: projectedContam,
      actual_contamination_percent: actualContam,
      contamination_variance_points: contamDelta,
      preparation_expected: passport.scenario_snapshot.title,
      preparation_observed: intake.preparation_completion_status,
      accepted_fractions_count: acceptedCount,
      rejected_fractions_count: rejectedCount,
      unexpected_materials_flagged: intake.unexpected_materials || [],
    };

    // 5. Indicative Economic Reconciliation
    const projectedEconomicRange = {
      min: passport.scenario_snapshot.modeled_economic_result.min,
      max: passport.scenario_snapshot.modeled_economic_result.max,
    };

    // Recalculate realized indicative valuation based on dock-confirmed weight and observed contamination
    const realizedValuation = valuationService.calculateValuation({
      materialCode: passport.evidence_snapshot.primary_material.code,
      weightKg: actualWeight,
      contaminationPercentage: actualContam,
      qualityGrade: passport.scenario_snapshot.modeled_recoverability_grade,
      isUserSpecifiedWeight: true,
      composition: passport.evidence_snapshot.composition,
    });

    const realizedEconomicRange = realizedValuation.indicative_net_range;
    const projMid = (projectedEconomicRange.min + projectedEconomicRange.max) / 2;
    const realMid = (realizedEconomicRange.min + realizedEconomicRange.max) / 2;
    const economicMidpointVariance = Math.round((realMid - projMid) * 100) / 100;

    let economicNote = 'Realized indicative net value aligns with pre-dispatch expectations.';
    if (economicMidpointVariance > 0) {
      economicNote = `Positive variance (+₹${economicMidpointVariance}) realized from favorable scale weight or lower observed contamination.`;
    } else if (economicMidpointVariance < 0) {
      economicNote = `Indicative deduction (-₹${Math.abs(economicMidpointVariance)}) due to scale weight variance or contamination penalty at intake.`;
    }

    const economicReconciliation: EconomicReconciliationResult = {
      projected_indicative_net_range: projectedEconomicRange,
      realized_indicative_net_range: realizedEconomicRange,
      variance_indicative_midpoint: economicMidpointVariance,
      currency: 'INR',
      economic_note: economicNote,
    };

    // 6. Return Complete Structured Reconciliation Report
    const report: IntakeReconciliationReport = {
      reconciliation_id: reconciliationId,
      passport_id: passport.passport_id,
      manifest_id: intake.manifest_id || validated.manifest?.manifest_id,
      reconciled_at: reconciledAt,
      passport_integrity_status: integrityStatus,
      weight_reconciliation: weightReconciliation,
      quality_reconciliation: qualityReconciliation,
      economic_reconciliation: economicReconciliation,
      reconciliation_disclosure: RECONCILIATION_DISCLOSURE_STATEMENT,
    };

    return report;
  }
}

export const reconciliationService = new ReconciliationService();
