import { test, describe } from 'node:test';
import assert from 'node:assert';
import { reconciliationService } from '../services/reconciliation.service.ts';
import { passportService } from '../services/passport.service.ts';
import {
  BatchRecoveryPassport,
  CreatePassportInput,
  DockIntakeRecord,
  OptimizationScenario,
  RecoveryProfile,
} from '../../src/types/recyclens.types.ts';

function createMockRecoveryProfile(): RecoveryProfile {
  return {
    id: 'rec-profile-rec',
    scan_id: 'scan-rec-202',
    primary_material: {
      code: 'PLASTIC_PET',
      name: 'Polyethylene Terephthalate Bottles',
      category: 'PLASTIC',
      confidence: 93.0,
      polymer_subtype: 'PET #1',
    },
    secondary_materials: [],
    composition: [
      {
        material: 'Clear PET Bottles',
        material_code: 'PLASTIC_PET',
        category: 'PLASTIC',
        estimated_share_percent: 85.0,
        confidence: 93.0,
        visual_evidence: ['Clear bottles'],
        contamination_percent: 10.0,
        recoverability_score: 90.0,
        recoverability_grade: 'GRADE_A',
        is_separable: false,
        preparation_actions: ['Drain liquid'],
        uncertainty: [],
      },
      {
        material: 'Caps',
        material_code: 'PLASTIC_PP',
        category: 'PLASTIC',
        estimated_share_percent: 15.0,
        confidence: 88.0,
        visual_evidence: ['Colored caps'],
        contamination_percent: 5.0,
        recoverability_score: 85.0,
        recoverability_grade: 'GRADE_A',
        is_separable: true,
        preparation_actions: ['Unscrew caps'],
        uncertainty: [],
      },
    ],
    contamination: {
      percentage: 10.0,
      type: 'SWEET_BEVERAGE_RESIDUE',
      severity: 'LOW',
      explanation: 'Liquid droplets inside bottles.',
      visual_indicators: ['Droplets on wall'],
    },
    recoverability: {
      score: 90.0,
      grade: 'GRADE_A',
      is_commercially_viable: true,
      actionable_advice: 'Rinse and de-cap.',
      potential_applications: ['Food grade rPET'],
    },
    visual_explanation: 'Clean post-consumer bottles.',
    visual_evidence: ['Transparent bottle bodies'],
    contamination_evidence: ['Droplets'],
    uncertainty: ['Closure resin unverified'],
    recommended_preparation: ['Manual de-capping'],
    recovery_decision: {
      batch_archetype: 'Post-Consumer PET Bottles',
      condition_summary: 'Clean bottle lot',
      recommended_action: 'Segregate caps',
      economic_effect: 'High flake yield',
      routing_strategy: 'SINGLE_FACILITY',
      routing_rationale: 'Apex Polymer Recyclers operates dedicated PET line.',
    },
    model_name: 'gemini-1.5-flash',
    is_fallback_inference: false,
    timestamp: '2026-09-19T20:00:00.000Z',
  };
}

function createMockScenario(): OptimizationScenario {
  return {
    scenario_id: 'scenario-rec-prep',
    scenario_type: 'RECOMMENDED_PREPARATION',
    title: 'Decontaminate & Segregate Closures',
    description: 'Manual cap removal and drainage of sweet liquid.',
    effort_level: 'MEDIUM',
    actions: [
      {
        action_id: 'action-drain',
        title: 'Drain Residual Liquid',
        observed_basis: 'Liquid droplets in bottles',
        rationale: 'Reduces moisture penalty',
        scenario_assumption: 'Complete drainage',
        modeled_effect: 'Reduces contamination by 60%',
        uncertainty: 'Hidden residue',
        affected_material_codes: ['PLASTIC_PET'],
      },
    ],
    affected_material_codes: ['PLASTIC_PET'],
    modeling_coefficients: {
      contamination_reduction_coefficient: 0.60,
      recoverability_headroom_coefficient: 0.50,
      coefficient_basis: 'ILLUSTRATIVE_SCENARIO_ASSUMPTION',
      contamination_floor: 2.0,
      recoverability_ceiling: 98.0,
      action_suppression_heuristic: 5.0,
    },
    current_state_reference: {
      data_origin: 'MODEL_ESTIMATED',
      contamination_percentage: 10.0,
      recoverability_score: 90.0,
      recoverability_grade: 'GRADE_A',
      indicative_net_range: { min: 380, max: 450 },
      weight_kg: 15.0,
      weight_basis: 'ILLUSTRATIVE_VISUAL_PROJECTION',
    },
    modeled_state: {
      data_origin: 'SCENARIO_PROJECTED',
      projected_contamination_percentage: 4.0,
      projected_recoverability_score: 95.0,
      projected_recoverability_grade: 'GRADE_A',
      projected_clean_benchmark: 520,
      projected_contamination_penalty: 30,
      projected_indicative_net_range: { min: 460, max: 520 },
    },
    assumptions: ['Illustrative model assumption: 60% contamination reduction.'],
    uncertainties: ['Does not guarantee reprocessor acceptance.'],
    evidence_basis: ['Visible droplets.'],
    economic_effect: 'Projected net uplift of ~₹70.',
    routing_effect: {
      strategy: 'SINGLE_FACILITY_PREFERRED',
      rationale: 'Tier 1 PET reprocessor intake.',
    },
    is_scenario_projection: true,
    is_fallback_demo: false,
  };
}

function createMockPassport(): BatchRecoveryPassport {
  const input: CreatePassportInput = {
    scan_id: 'scan-rec-202',
    recovery_profile: createMockRecoveryProfile(),
    weight_kg: 15.0,
    weight_provenance: 'ILLUSTRATIVE_VISUAL_PROJECTION',
    selected_scenario: createMockScenario(),
  };
  return passportService.createPassport(input);
}

function createMockIntake(overrides: Partial<DockIntakeRecord> = {}): DockIntakeRecord {
  return {
    passport_id: 'RCP-2026-TEST',
    recorded_at: '2026-09-19T22:30:00.000Z',
    actual_intake_weight_kg: 14.8,
    weight_provenance: 'USER_CONFIRMED_SCALE_WEIGHMENT',
    operator_observed_contamination_percent: 4.5,
    preparation_completion_status: 'FULLY_PREPARED',
    fraction_dispositions: [
      {
        material_code: 'PLASTIC_PET',
        material_name: 'Clear PET Bottles',
        disposition_status: 'ACCEPTED',
        weighed_weight_kg: 12.5,
      },
      {
        material_code: 'PLASTIC_PP',
        material_name: 'Caps',
        disposition_status: 'ACCEPTED',
        weighed_weight_kg: 2.3,
      },
    ],
    unexpected_materials: [],
    operator_notes: 'Bottles drained and caps segregated in designated bin.',
    ...overrides,
  };
}

describe('Phase 5.3 Dock Intake Reconciliation Tests', () => {
  // 1. Exact or near match reconciliation
  test('1. should reconcile dock intake against pre-dispatch passport with minor normal variance', () => {
    const passport = createMockPassport();
    const intake = createMockIntake({
      passport_id: passport.passport_id,
      actual_intake_weight_kg: 14.8, // Projected was 15.0 kg -> -0.2 kg (-1.3%)
    });

    const report = reconciliationService.reconcileIntake({ passport, intake });

    assert.ok(report);
    assert.ok(report.reconciliation_id);
    assert.strictEqual(report.passport_id, passport.passport_id);
    assert.strictEqual(report.passport_integrity_status.is_valid, true);

    // Weight reconciliation
    assert.strictEqual(report.weight_reconciliation.projected_weight_kg, 15.0);
    assert.strictEqual(report.weight_reconciliation.actual_intake_weight_kg, 14.8);
    assert.strictEqual(report.weight_reconciliation.variance_kg, -0.2);
    assert.strictEqual(report.weight_reconciliation.variance_percent, -1.3);
    assert.strictEqual(report.weight_reconciliation.variance_category, 'DEFICIT');
    assert.ok(report.weight_reconciliation.uncertainty_explanations.some((e) => e.includes('±8%')));
  });

  // 2. Weight surplus reconciliation
  test('2. should reconcile dock intake with weight surplus and categorize variance accurately', () => {
    const passport = createMockPassport();
    const intake = createMockIntake({
      passport_id: passport.passport_id,
      actual_intake_weight_kg: 18.0, // +3.0 kg (+20%)
    });

    const report = reconciliationService.reconcileIntake({ passport, intake });

    assert.strictEqual(report.weight_reconciliation.variance_kg, 3.0);
    assert.strictEqual(report.weight_reconciliation.variance_percent, 20.0);
    assert.strictEqual(report.weight_reconciliation.variance_category, 'SURPLUS');
    assert.ok(report.weight_reconciliation.uncertainty_explanations.some((e) => e.includes('surplus observed')));
  });

  // 3. Weight deficit reconciliation (> 10%)
  test('3. should reconcile dock intake with significant weight deficit and explain drainage/sorting', () => {
    const passport = createMockPassport();
    const intake = createMockIntake({
      passport_id: passport.passport_id,
      actual_intake_weight_kg: 12.0, // -3.0 kg (-20%)
    });

    const report = reconciliationService.reconcileIntake({ passport, intake });

    assert.strictEqual(report.weight_reconciliation.variance_kg, -3.0);
    assert.strictEqual(report.weight_reconciliation.variance_percent, -20.0);
    assert.strictEqual(report.weight_reconciliation.variance_category, 'DEFICIT');
    assert.ok(report.weight_reconciliation.uncertainty_explanations.some((e) => e.includes('deficit observed')));
  });

  // 4. Quality & contamination variance calculation
  test('4. should calculate contamination variance points and verify preparation status', () => {
    const passport = createMockPassport(); // Modeled contam: 4.0%
    const intake = createMockIntake({
      passport_id: passport.passport_id,
      operator_observed_contamination_percent: 6.5, // 6.5% vs 4.0% -> +2.5 points
      preparation_completion_status: 'PARTIALLY_PREPARED',
    });

    const report = reconciliationService.reconcileIntake({ passport, intake });

    assert.strictEqual(report.quality_reconciliation.projected_contamination_percent, 4.0);
    assert.strictEqual(report.quality_reconciliation.actual_contamination_percent, 6.5);
    assert.strictEqual(report.quality_reconciliation.contamination_variance_points, 2.5);
    assert.strictEqual(report.quality_reconciliation.preparation_observed, 'PARTIALLY_PREPARED');
  });

  // 5. Fraction dispositions tracking
  test('5. should track accepted, rejected, and unexpected fractions accurately', () => {
    const passport = createMockPassport();
    const intake = createMockIntake({
      passport_id: passport.passport_id,
      fraction_dispositions: [
        { material_code: 'PLASTIC_PET', disposition_status: 'ACCEPTED', weighed_weight_kg: 12.0 },
        { material_code: 'PLASTIC_PP', disposition_status: 'REJECTED', rejection_reason: 'Severely charred closure lot' },
      ],
      unexpected_materials: ['Metal Wire Fasteners (Non-polymeric contaminant)'],
    });

    const report = reconciliationService.reconcileIntake({ passport, intake });

    assert.strictEqual(report.quality_reconciliation.accepted_fractions_count, 1);
    assert.strictEqual(report.quality_reconciliation.rejected_fractions_count, 1);
    assert.deepStrictEqual(report.quality_reconciliation.unexpected_materials_flagged, [
      'Metal Wire Fasteners (Non-polymeric contaminant)',
    ]);
  });

  // 6. Indicative economic reconciliation
  test('6. should recalculate realized indicative economic valuation and calculate variance midpoint', () => {
    const passport = createMockPassport(); // Projected: 460 - 520 (mid: 490)
    const intake = createMockIntake({
      passport_id: passport.passport_id,
      actual_intake_weight_kg: 14.8,
      operator_observed_contamination_percent: 4.0,
    });

    const report = reconciliationService.reconcileIntake({ passport, intake });

    assert.ok(report.economic_reconciliation.projected_indicative_net_range);
    assert.ok(report.economic_reconciliation.realized_indicative_net_range);
    assert.strictEqual(typeof report.economic_reconciliation.variance_indicative_midpoint, 'number');
    assert.strictEqual(report.economic_reconciliation.currency, 'INR');
    assert.ok(report.economic_reconciliation.economic_note);
  });

  // 7. Tampered passport detection during reconciliation
  test('7. should flag passport integrity failure in reconciliation report when passport was modified', () => {
    const passport = createMockPassport();
    // Tamper with contamination in evidence snapshot without updating hash
    passport.evidence_snapshot.contamination.percentage = 99.0;

    const intake = createMockIntake({ passport_id: passport.passport_id });
    const report = reconciliationService.reconcileIntake({ passport, intake });

    assert.strictEqual(report.passport_integrity_status.is_valid, false);
    assert.ok(report.passport_integrity_status.details.includes('Integrity check failed'));
  });

  // 8. Unique CSPRNG reconciliation ID format REC-YYYY-<16 HEX>
  test('8. should generate unique CSPRNG reconciliation ID format REC-YYYY-<16 HEX CHARS>', () => {
    const passport = createMockPassport();
    const intake = createMockIntake({ passport_id: passport.passport_id });
    const report = reconciliationService.reconcileIntake({ passport, intake });

    const regex = /^REC-\d{4}-[A-F0-9]{16}$/;
    assert.match(report.reconciliation_id, regex);
    const currentYear = new Date().getUTCFullYear().toString();
    assert.ok(report.reconciliation_id.startsWith(`REC-${currentYear}-`));
  });

  // 9. Mandatory disclosure statement
  test('9. should ensure reconciliation disclosure disclaims financial settlement and legal custody', () => {
    const passport = createMockPassport();
    const intake = createMockIntake({ passport_id: passport.passport_id });
    const report = reconciliationService.reconcileIntake({ passport, intake });

    assert.ok(report.reconciliation_disclosure.includes('operational comparison'));
    assert.ok(report.reconciliation_disclosure.includes('does not constitute a financial settlement certificate'));
    assert.ok(report.reconciliation_disclosure.includes('legal custody transfer'));
  });

  // 10. Rejection of negative weights or invalid numbers
  test('10. should reject negative intake weights or NaN/Infinity in schema validation', () => {
    const passport = createMockPassport();

    assert.throws(() => {
      reconciliationService.reconcileIntake({
        passport,
        intake: createMockIntake({ actual_intake_weight_kg: -5.0 }),
      });
    });

    assert.throws(() => {
      reconciliationService.reconcileIntake({
        passport,
        intake: createMockIntake({ actual_intake_weight_kg: NaN }),
      });
    });
  });
});
