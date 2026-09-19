import { test, describe } from 'node:test';
import assert from 'node:assert';
import {
  optimizationService,
  OPTIMIZATION_CONFIG,
  ILLUSTRATIVE_SCENARIO_COEFFICIENTS,
  MATERIAL_ACTION_COMPATIBILITY_MATRIX,
  getActionCompatibility,
} from '../services/optimization.service.ts';
import { valuationService } from '../services/valuation.service.ts';
import { fallbackService } from '../services/fallback.service.ts';
import { RecoveryProfile, ValuationBreakdown } from '../../src/types/recyclens.types.ts';

describe('Phase 4 Recovery Optimization & What-If Intelligence Tests', () => {
  const baseProfile: RecoveryProfile = {
    id: 'rec-test-01',
    scan_id: 'scan-test-01',
    primary_material: {
      code: 'PLASTIC_PET',
      name: 'Polyethylene Terephthalate',
      category: 'PLASTIC',
      confidence: 92.0,
      polymer_subtype: 'PET Rigid Bottle Grade (Type 1)',
    },
    secondary_materials: [],
    composition: [
      {
        material: 'Transparent PET Bottle Bodies',
        material_code: 'PLASTIC_PET',
        category: 'PLASTIC',
        estimated_share_percent: 85.0,
        confidence: 94.0,
        polymer_subtype: 'PET Rigid Bottle Grade (Type 1)',
        visual_evidence: ['Clear optical transparency', 'Petaloid base geometry'],
        contamination_percent: 18.0,
        recoverability_score: 82.0,
        recoverability_grade: 'GRADE_B',
        is_separable: false,
        preparation_actions: ['Flatten bottles'],
        uncertainty: ['Viscosity unconfirmed'],
      },
      {
        material: 'Colored Polypropylene Caps',
        material_code: 'PLASTIC_PP',
        category: 'PLASTIC',
        estimated_share_percent: 15.0,
        confidence: 90.0,
        polymer_subtype: 'PP Injection Molded (Type 5)',
        visual_evidence: ['Opaque blue threaded closures'],
        contamination_percent: 5.0,
        recoverability_score: 88.0,
        recoverability_grade: 'GRADE_A',
        is_separable: true,
        preparation_actions: ['Unscrew and segregate colored caps'],
        uncertainty: ['Liner seal composition unconfirmed'],
      },
    ],
    contamination: {
      percentage: 16.0,
      type: 'BEVERAGE_RESIDUE',
      severity: 'LOW',
      explanation: 'Droplet condensation and residual sweet beverage pooling in base flutes.',
      visual_indicators: ['Droplet traces', 'Liquid pooling'],
    },
    contamination_evidence: ['Visible liquid pooling in interior base flutes'],
    recoverability: {
      score: 83.0,
      grade: 'GRADE_B',
      is_commercially_viable: true,
      actionable_advice: 'Invert and drain bottles, remove closures.',
      potential_applications: ['rPET Flake', 'Bottle-to-bottle preforms'],
    },
    visual_explanation: 'Post-consumer beverage bottles with attached closures.',
    visual_evidence: ['Clear transparency', 'Petaloid base geometry'],
    uncertainty: ['Moisture content requires intake weighment'],
    recommended_preparation: ['Drain residual liquids', 'Segregate caps'],
    model_name: 'gemini-2.5-flash',
    is_fallback_inference: false,
    timestamp: '2026-09-19T10:00:00.000Z',
    recovery_decision: {
      batch_archetype: 'Post-Consumer PET Packaging with Closures',
      condition_summary: 'Low beverage residue (~16%). High clarity.',
      recommended_action: 'Drain liquids and segregate colored closures before baling.',
      economic_effect: 'Deduction of ~16% applied to indicative benchmark yield.',
      routing_strategy: 'SINGLE_FACILITY',
      routing_rationale: 'Single reclaimer processes PET bodies with float-sink cap separation.',
    },
  };

  const baseValuation: ValuationBreakdown = valuationService.calculateValuation({
    materialCode: baseProfile.primary_material.code,
    weightKg: 15.0,
    contaminationPercentage: baseProfile.contamination.percentage,
    qualityGrade: baseProfile.recoverability.grade,
    isUserSpecifiedWeight: false,
    composition: baseProfile.composition,
  });

  // 1. Homogeneous Clean Material (No irrelevant actions generated)
  test('1. should not invent irrelevant decontamination actions for homogeneous clean material', () => {
    const cleanProfile: RecoveryProfile = {
      ...baseProfile,
      composition: [
        {
          ...baseProfile.composition[0],
          estimated_share_percent: 100.0,
          contamination_percent: 2.0,
          recoverability_score: 95.0,
          recoverability_grade: 'GRADE_A',
          is_separable: false,
        },
      ],
      contamination: {
        percentage: 2.0,
        type: 'CLEAN',
        severity: 'CLEAN',
        explanation: 'Clean clean-room preforms with no visible contamination.',
        visual_indicators: [],
      },
      contamination_evidence: [],
      recoverability: {
        ...baseProfile.recoverability,
        score: 95.0,
        grade: 'GRADE_A',
      },
    };

    const cleanValuation = valuationService.calculateValuation({
      materialCode: cleanProfile.primary_material.code,
      weightKg: 15.0,
      contaminationPercentage: 2.0,
      qualityGrade: 'GRADE_A',
      isUserSpecifiedWeight: false,
      composition: cleanProfile.composition,
    });

    const result = optimizationService.generateOptimizationIntelligence({
      profile: cleanProfile,
      valuation: cleanValuation,
      effectiveWeightKg: 15.0,
      isUserSpecifiedWeight: false,
    });

    assert.ok(result.scenarios.length >= 1, 'Should generate at least 1 scenario');
    for (const scen of result.scenarios) {
      assert.ok(
        !scen.actions.some((a) => a.action_id === 'action-drain-residuals'),
        'Must not generate drain residuals action for clean material'
      );
      assert.ok(
        !scen.actions.some((a) => a.action_id.startsWith('action-segregate-')),
        'Must not generate stream segregation for monomaterial batch'
      );
    }
  });

  // 2. Contaminated Homogeneous Material
  test('2. should generate targeted decontamination actions for contaminated homogeneous material', () => {
    const soiledProfile: RecoveryProfile = {
      ...baseProfile,
      composition: [
        {
          ...baseProfile.composition[0],
          estimated_share_percent: 100.0,
          contamination_percent: 32.0,
          recoverability_score: 68.0,
          recoverability_grade: 'GRADE_C',
        },
      ],
      contamination: {
        percentage: 32.0,
        type: 'BEVERAGE_RESIDUE',
        severity: 'HIGH',
        explanation: 'Heavy syrupy liquid pooling across bottom fluting.',
        visual_indicators: ['Liquid pooling', 'Sticky residue'],
      },
      contamination_evidence: ['Dark pooling liquid inside 60% of bottles'],
      recoverability: {
        ...baseProfile.recoverability,
        score: 68.0,
        grade: 'GRADE_C',
      },
    };

    const soiledValuation = valuationService.calculateValuation({
      materialCode: soiledProfile.primary_material.code,
      weightKg: 20.0,
      contaminationPercentage: 32.0,
      qualityGrade: 'GRADE_C',
      isUserSpecifiedWeight: false,
      composition: soiledProfile.composition,
    });

    const result = optimizationService.generateOptimizationIntelligence({
      profile: soiledProfile,
      valuation: soiledValuation,
      effectiveWeightKg: 20.0,
      isUserSpecifiedWeight: false,
    });

    const recommended = result.scenarios.find((s) => s.scenario_type === 'RECOMMENDED_PREPARATION');
    assert.ok(recommended, 'Recommended scenario must exist');
    assert.ok(
      recommended.actions.some((a) => a.action_id === 'action-drain-residuals'),
      'Must recommend liquid drainage for beverage residue contamination'
    );
    assert.ok(
      recommended.modeled_state.projected_contamination_percentage < 32.0,
      'Projected contamination must be strictly lower than baseline'
    );
    assert.ok(
      recommended.modeled_state.projected_recoverability_score > 68.0,
      'Projected recoverability must improve'
    );
  });

  // 3. Mixed-Material Batch
  test('3. should generate component segregation actions for mixed-material batches', () => {
    const result = optimizationService.generateOptimizationIntelligence({
      profile: baseProfile,
      valuation: baseValuation,
      effectiveWeightKg: 15.0,
      isUserSpecifiedWeight: false,
    });

    const maxSep = result.scenarios.find((s) => s.scenario_type === 'MAXIMUM_SEPARATION');
    assert.ok(maxSep, 'Maximum separation scenario must exist for separable multi-material batch');
    const segAction = maxSep.actions.find((a) => a.action_id.includes('segregate-plastic_pp'));
    assert.ok(segAction, 'Must include action to segregate PP closures');
    assert.strictEqual(segAction?.affected_material_codes.includes('PLASTIC_PP'), true);
  });

  // 4. E-Waste / Specialized Stream
  test('4. should correctly model e-waste circuit board stream segregation', () => {
    const ewasteProfile: RecoveryProfile = {
      ...baseProfile,
      primary_material: {
        code: 'EWASTE_PCB',
        name: 'Printed Circuit Board Assemblies',
        category: 'EWASTE',
        confidence: 94.0,
      },
      composition: [
        {
          material: 'Populated FR4 Circuit Boards',
          material_code: 'EWASTE_PCB',
          category: 'EWASTE',
          estimated_share_percent: 70.0,
          confidence: 92.0,
          visual_evidence: ['Green solder mask PCB substrate'],
          contamination_percent: 10.0,
          recoverability_score: 90.0,
          recoverability_grade: 'GRADE_A',
          is_separable: false,
          preparation_actions: ['Protect IC chips from mechanical damage'],
          uncertainty: ['Gold plating thickness unverified'],
        },
        {
          material: 'Aluminium Heat Sinks',
          material_code: 'METAL_ALUMINIUM',
          category: 'METAL',
          estimated_share_percent: 30.0,
          confidence: 95.0,
          visual_evidence: ['Extruded aluminium fin blocks mounted to board'],
          contamination_percent: 5.0,
          recoverability_score: 95.0,
          recoverability_grade: 'GRADE_A',
          is_separable: true,
          preparation_actions: ['Unscrew heat sink retention clips'],
          uncertainty: ['Thermal grease residue present'],
        },
      ],
      contamination: {
        percentage: 12.0,
        type: 'THERMAL_GREASE_DUST',
        severity: 'LOW',
        explanation: 'Thermal paste residue and minor enclosure dust.',
        visual_indicators: ['Dust coating', 'Silicone grease'],
      },
      contamination_evidence: ['Grey silicone grease traces beneath aluminium sinks'],
    };

    const ewasteVal = valuationService.calculateValuation({
      materialCode: 'EWASTE_PCB',
      weightKg: 10.0,
      contaminationPercentage: 12.0,
      qualityGrade: 'GRADE_A',
      isUserSpecifiedWeight: false,
      composition: ewasteProfile.composition,
    });

    const result = optimizationService.generateOptimizationIntelligence({
      profile: ewasteProfile,
      valuation: ewasteVal,
      effectiveWeightKg: 10.0,
      isUserSpecifiedWeight: false,
    });

    const maxSep = result.scenarios.find((s) => s.scenario_type === 'MAXIMUM_SEPARATION');
    assert.ok(maxSep, 'Should generate maximum separation scenario for e-waste + metal assembly');
    assert.strictEqual(
      maxSep.routing_effect.strategy,
      'SPLIT_ROUTING_RECOMMENDED',
      'Must recommend split routing when metals are segregated from electronics'
    );
    assert.ok(
      maxSep.actions.some((a) => a.action_id === 'action-ewaste-dusting'),
      'Must recommend dry dusting rather than liquid washing for e-waste'
    );
    assert.ok(
      !maxSep.actions.some((a) => a.action_id === 'action-surface-clean'),
      'Must NOT recommend aqueous surface wash on delicate electronic assemblies'
    );
    assert.ok(
      maxSep.actions.some((a) => a.action_id === 'action-ewaste-consolidation'),
      'Must recommend protective palletizing for e-waste rather than hydraulic baling'
    );
    assert.ok(
      !maxSep.actions.some((a) => a.action_id === 'action-bale-compact'),
      'Must NOT recommend hydraulic compaction/baling for e-waste'
    );
  });

  // 5. Zero / Low Contamination Handling
  test('5. should handle batches with near-zero contamination without over-promising', () => {
    const zeroContamProfile: RecoveryProfile = {
      ...baseProfile,
      contamination: {
        percentage: 0.0,
        type: 'CLEAN',
        severity: 'CLEAN',
        explanation: 'Pristine post-industrial scrap.',
        visual_indicators: [],
      },
      contamination_evidence: [],
    };

    const result = optimizationService.generateOptimizationIntelligence({
      profile: zeroContamProfile,
      valuation: baseValuation,
      effectiveWeightKg: 10.0,
      isUserSpecifiedWeight: false,
    });

    for (const scen of result.scenarios) {
      assert.ok(
        scen.modeled_state.projected_contamination_percentage >= 0,
        'Projected contamination must never be negative'
      );
    }
  });

  // 6. High Contamination Batch (> 50%)
  test('6. should model substantial recovery elevation for highly contaminated batch', () => {
    const highContamProfile: RecoveryProfile = {
      ...baseProfile,
      contamination: {
        percentage: 65.0,
        severity: 'CRITICAL',
        type: 'SOIL_MUD_CONTAMINATION',
        explanation: 'Caked mud and biological sludge coating 70% of batch.',
        visual_indicators: ['Thick mud encrustation'],
      },
      contamination_evidence: ['Opaque brown clay adhering to sidewalls'],
      recoverability: {
        score: 42.0,
        grade: 'REJECT',
        is_commercially_viable: false,
        actionable_advice: 'Intensive high-pressure water wash required.',
        potential_applications: [],
      },
    };

    const highContamVal = valuationService.calculateValuation({
      materialCode: 'PLASTIC_PET',
      weightKg: 50.0,
      contaminationPercentage: 65.0,
      qualityGrade: 'REJECT',
      isUserSpecifiedWeight: false,
      composition: highContamProfile.composition,
    });

    const result = optimizationService.generateOptimizationIntelligence({
      profile: highContamProfile,
      valuation: highContamVal,
      effectiveWeightKg: 50.0,
      isUserSpecifiedWeight: false,
    });

    const recommended = result.scenarios.find((s) => s.scenario_type === 'RECOMMENDED_PREPARATION');
    assert.ok(recommended, 'Recommended scenario must be present');
    assert.ok(
      recommended.modeled_state.projected_contamination_percentage <= 25.0,
      'Recommended protocol must project significant contamination reduction'
    );
    assert.notStrictEqual(
      recommended.modeled_state.projected_recoverability_grade,
      'REJECT',
      'Intervention should elevate batch grade from REJECT to commercial viability'
    );
  });

  // 7. Scenario Clamping Bounds
  test('7. should enforce physical honesty bounds (min residual contam >= 2%, max recoverability <= 98%)', () => {
    const result = optimizationService.generateOptimizationIntelligence({
      profile: baseProfile,
      valuation: baseValuation,
      effectiveWeightKg: 15.0,
      isUserSpecifiedWeight: false,
    });

    for (const scen of result.scenarios) {
      assert.ok(
        scen.modeled_state.projected_contamination_percentage >= OPTIMIZATION_CONFIG.MIN_RESIDUAL_CONTAMINATION_PERCENT,
        `Contamination must never drop below honesty bound of ${OPTIMIZATION_CONFIG.MIN_RESIDUAL_CONTAMINATION_PERCENT}%`
      );
      assert.ok(
        scen.modeled_state.projected_recoverability_score <= OPTIMIZATION_CONFIG.MAX_RECOVERABILITY_SCORE,
        `Recoverability score must never exceed honesty cap of ${OPTIMIZATION_CONFIG.MAX_RECOVERABILITY_SCORE}`
      );
    }
  });

  // 8. Scenario Ordering
  test('8. should order scenarios logically from lowest effort to highest effort', () => {
    const result = optimizationService.generateOptimizationIntelligence({
      profile: baseProfile,
      valuation: baseValuation,
      effectiveWeightKg: 15.0,
      isUserSpecifiedWeight: false,
    });

    assert.strictEqual(result.scenarios[0].scenario_type, 'MINIMAL_PREPARATION');
    assert.strictEqual(result.scenarios[1].scenario_type, 'RECOMMENDED_PREPARATION');
    if (result.scenarios[2]) {
      assert.strictEqual(result.scenarios[2].scenario_type, 'MAXIMUM_SEPARATION');
    }
  });

  // 9. No Irrelevant Actions
  test('9. should not fabricate unrelated actions (e.g. no metal sorting on pure plastic)', () => {
    const plasticProfile: RecoveryProfile = {
      ...baseProfile,
      composition: [
        {
          ...baseProfile.composition[0],
          estimated_share_percent: 100.0,
          material: 'Clear PET Flakes',
          material_code: 'PLASTIC_PET',
          is_separable: false,
        },
      ],
    };

    const plasticVal = valuationService.calculateValuation({
      materialCode: 'PLASTIC_PET',
      weightKg: 10.0,
      contaminationPercentage: 10.0,
      qualityGrade: 'GRADE_B',
      isUserSpecifiedWeight: false,
      composition: plasticProfile.composition,
    });

    const result = optimizationService.generateOptimizationIntelligence({
      profile: plasticProfile,
      valuation: plasticVal,
      effectiveWeightKg: 10.0,
      isUserSpecifiedWeight: false,
    });

    for (const scen of result.scenarios) {
      for (const act of scen.actions) {
        assert.ok(
          !act.title.toLowerCase().includes('metal') && !act.title.toLowerCase().includes('circuit'),
          'Must not fabricate metal/circuit actions on plastic batch'
        );
      }
    }
  });

  // 10. No Fabricated Physical Mass
  test('10. should preserve illustrative visual projection basis when weight is not user confirmed', () => {
    const result = optimizationService.generateOptimizationIntelligence({
      profile: baseProfile,
      valuation: baseValuation,
      effectiveWeightKg: 15.0,
      isUserSpecifiedWeight: false,
    });

    for (const scen of result.scenarios) {
      assert.strictEqual(
        scen.current_state_reference.weight_basis,
        'ILLUSTRATIVE_VISUAL_PROJECTION',
        'Must tag weight basis as illustrative visual projection'
      );
      assert.strictEqual(
        scen.is_scenario_projection,
        true,
        'Must flag is_scenario_projection: true'
      );
    }
  });

  // 11. Visual-Share Valuation Methodology Disclosure Preserved
  test('11. should preserve valuation methodology disclosure in modeled scenarios', () => {
    const result = optimizationService.generateOptimizationIntelligence({
      profile: baseProfile,
      valuation: baseValuation,
      effectiveWeightKg: 15.0,
      isUserSpecifiedWeight: false,
    });

    assert.ok(
      result.comparison.modeling_disclosure.includes('illustrative calculations'),
      'Modeling disclosure must be present in comparison matrix'
    );
  });

  // 12. User-Confirmed Physical Weight
  test('12. should label weight basis as USER_CONFIRMED_SCALE_WEIGHMENT when provided by operator', () => {
    const userVal = valuationService.calculateValuation({
      materialCode: baseProfile.primary_material.code,
      weightKg: 42.5,
      contaminationPercentage: baseProfile.contamination.percentage,
      qualityGrade: baseProfile.recoverability.grade,
      isUserSpecifiedWeight: true,
      composition: baseProfile.composition,
    });

    const result = optimizationService.generateOptimizationIntelligence({
      profile: baseProfile,
      valuation: userVal,
      effectiveWeightKg: 42.5,
      isUserSpecifiedWeight: true,
    });

    for (const scen of result.scenarios) {
      assert.strictEqual(
        scen.current_state_reference.weight_basis,
        'USER_CONFIRMED_SCALE_WEIGHMENT',
        'Must mark weight as user-confirmed scale weighment'
      );
      assert.strictEqual(scen.current_state_reference.weight_kg, 42.5);
    }
  });

  // 13. Fallback Scenario Marking
  test('13. should mark fallback scenarios with is_fallback_demo: true', () => {
    const fallbackData = fallbackService.generateFallbackProfile(undefined, 'preset-pet-bottles');
    const fallbackProfile: RecoveryProfile = {
      ...fallbackData,
      id: 'rec-fallback-01',
      scan_id: 'scan-fallback-01',
      timestamp: new Date().toISOString(),
    };
    const fallbackVal = valuationService.calculateValuation({
      materialCode: fallbackProfile.primary_material.code,
      weightKg: 15.0,
      contaminationPercentage: fallbackProfile.contamination.percentage,
      qualityGrade: fallbackProfile.recoverability.grade,
      isUserSpecifiedWeight: false,
      composition: fallbackProfile.composition,
    });

    const result = optimizationService.generateOptimizationIntelligence({
      profile: fallbackProfile,
      valuation: fallbackVal,
      effectiveWeightKg: 15.0,
      isUserSpecifiedWeight: false,
    });

    assert.ok(result.scenarios.length >= 1);
    for (const scen of result.scenarios) {
      assert.strictEqual(scen.is_fallback_demo, true, 'Fallback scenario must be marked is_fallback_demo: true');
    }
  });

  // 14. Routing Effect Logic
  test('14. should accurately determine routing strategy changes in scenarios', () => {
    const result = optimizationService.generateOptimizationIntelligence({
      profile: baseProfile,
      valuation: baseValuation,
      effectiveWeightKg: 15.0,
      isUserSpecifiedWeight: false,
    });

    const minimal = result.scenarios.find((s) => s.scenario_type === 'MINIMAL_PREPARATION');
    assert.strictEqual(
      minimal?.routing_effect.strategy,
      'NO_ROUTE_CHANGE',
      'Minimal intervention on homogeneous stream should preserve routing'
    );
  });

  // 15. Economic Calculation Consistency
  test('15. should produce consistent economic figures across scenarios using ValuationService', () => {
    const result = optimizationService.generateOptimizationIntelligence({
      profile: baseProfile,
      valuation: baseValuation,
      effectiveWeightKg: 15.0,
      isUserSpecifiedWeight: false,
    });

    const min = result.scenarios.find((s) => s.scenario_type === 'MINIMAL_PREPARATION');
    const rec = result.scenarios.find((s) => s.scenario_type === 'RECOMMENDED_PREPARATION');

    assert.ok(min && rec);
    assert.ok(
      rec.modeled_state.projected_indicative_net_range.min >= min.modeled_state.projected_indicative_net_range.min,
      'Recommended protocol net payout should be greater than or equal to minimal protocol'
    );
    assert.ok(
      rec.modeled_state.projected_clean_benchmark > 0,
      'Gross benchmark must be strictly positive'
    );
  });

  // 16. Malformed Input Rejection & Graceful Clamping
  test('16. should gracefully clamp malformed negative or excessive contamination percentages', () => {
    const malformedProfile: RecoveryProfile = {
      ...baseProfile,
      contamination: {
        ...baseProfile.contamination,
        percentage: 150.0, // Out of bounds
      },
    };

    const result = optimizationService.generateOptimizationIntelligence({
      profile: malformedProfile,
      valuation: baseValuation,
      effectiveWeightKg: 15.0,
      isUserSpecifiedWeight: false,
      userConfirmedContamination: -20.0, // Negative input
    });

    for (const scen of result.scenarios) {
      assert.ok(
        scen.modeled_state.projected_contamination_percentage >= 0,
        'Projected contam must be >= 0'
      );
      assert.ok(
        scen.modeled_state.projected_contamination_percentage <= 100,
        'Projected contam must be <= 100'
      );
    }
  });

  // 17. Maximum Scenario Count (<= 3)
  test('17. should generate at most 3 scenarios under any circumstances', () => {
    const result = optimizationService.generateOptimizationIntelligence({
      profile: baseProfile,
      valuation: baseValuation,
      effectiveWeightKg: 15.0,
      isUserSpecifiedWeight: false,
    });

    assert.ok(
      result.scenarios.length <= 3,
      `Scenario count must be <= 3, got ${result.scenarios.length}`
    );
  });

  // 18. Impossible Scenario Prevention (Cannot promise 0% contam or 100% yield)
  test('18. should strictly prevent impossible physical claims (0% contamination or 100% recoverability)', () => {
    const ultraSoiledProfile: RecoveryProfile = {
      ...baseProfile,
      contamination: {
        percentage: 95.0,
        type: 'HEAVY_SLUDGE',
        severity: 'CRITICAL',
        explanation: 'Extreme biological contamination.',
        visual_indicators: ['Mud and oil sludge'],
      },
      contamination_evidence: ['Heavy viscous oil sludge'],
      recoverability: {
        score: 15.0,
        grade: 'REJECT',
        is_commercially_viable: false,
        actionable_advice: 'Specialized chemical wash.',
        potential_applications: [],
      },
    };

    const result = optimizationService.generateOptimizationIntelligence({
      profile: ultraSoiledProfile,
      valuation: baseValuation,
      effectiveWeightKg: 15.0,
      isUserSpecifiedWeight: false,
    });

    for (const scen of result.scenarios) {
      assert.notStrictEqual(
        scen.modeled_state.projected_contamination_percentage,
        0,
        'Must never project 0% sterile contamination'
      );
      assert.notStrictEqual(
        scen.modeled_state.projected_recoverability_score,
        100,
        'Must never project 100% theoretical yield'
      );
    }
  });

  // 19. Transparent Modeling Coefficients & Basis
  test('19. should explicitly expose scenario coefficients as illustrative assumptions', () => {
    const result = optimizationService.generateOptimizationIntelligence({
      profile: baseProfile,
      valuation: baseValuation,
      effectiveWeightKg: 15.0,
      isUserSpecifiedWeight: false,
    });

    for (const scen of result.scenarios) {
      assert.ok(scen.modeling_coefficients, 'Each scenario must expose modeling_coefficients');
      assert.strictEqual(
        scen.modeling_coefficients.coefficient_basis,
        'ILLUSTRATIVE_SCENARIO_ASSUMPTION',
        'Coefficient basis must be strictly labeled as ILLUSTRATIVE_SCENARIO_ASSUMPTION'
      );
      assert.strictEqual(
        scen.modeling_coefficients.contamination_floor,
        OPTIMIZATION_CONFIG.SCENARIO_MIN_CONTAMINATION_FLOOR
      );
      assert.strictEqual(
        scen.modeling_coefficients.recoverability_ceiling,
        OPTIMIZATION_CONFIG.SCENARIO_MAX_RECOVERABILITY_CEILING
      );
    }
  });

  // 20. No Unsupported Commercial Cleanliness or Yield Claims
  test('20. should not describe 2% as commercial clean threshold or 98% as industry maximum', () => {
    const result = optimizationService.generateOptimizationIntelligence({
      profile: baseProfile,
      valuation: baseValuation,
      effectiveWeightKg: 15.0,
      isUserSpecifiedWeight: false,
    });

    for (const scen of result.scenarios) {
      const allText = (
        scen.title +
        ' ' +
        scen.description +
        ' ' +
        scen.assumptions.join(' ') +
        ' ' +
        scen.uncertainties.join(' ') +
        ' ' +
        scen.economic_effect
      ).toLowerCase();

      assert.ok(
        !allText.includes('commercial clean threshold'),
        'Must not claim 2% is a commercial clean threshold'
      );
      assert.ok(
        !allText.includes('commercial clean limit'),
        'Must not claim 2% is a commercial clean limit'
      );
      assert.ok(
        !allText.includes('industry maximum'),
        'Must not claim 98% is an industry maximum'
      );
      assert.ok(
        !allText.includes('empirically validated'),
        'Must not claim empirical validation without authoritative basis'
      );
    }
  });

  // 21. No Unsupported Preparation Duration Claims (<5 minutes)
  test('21. should not claim specific preparation durations (< 5 minutes) as factual', () => {
    const result = optimizationService.generateOptimizationIntelligence({
      profile: baseProfile,
      valuation: baseValuation,
      effectiveWeightKg: 15.0,
      isUserSpecifiedWeight: false,
    });

    for (const scen of result.scenarios) {
      for (const ass of scen.assumptions) {
        assert.ok(
          !ass.includes('< 5 minutes') && !ass.includes('<5 minutes'),
          'Must not assert < 5 minutes preparation duration'
        );
      }
      assert.ok(
        ['LOW', 'MEDIUM', 'HIGH'].includes(scen.effort_level),
        'Must use qualitative effort levels'
      );
    }
  });

  // 22. No Reprocessor Acceptance Guarantees
  test('22. should not imply that modeled grade guarantees reprocessor acceptance', () => {
    const result = optimizationService.generateOptimizationIntelligence({
      profile: baseProfile,
      valuation: baseValuation,
      effectiveWeightKg: 15.0,
      isUserSpecifiedWeight: false,
    });

    const recommended = result.scenarios.find((s) => s.scenario_type === 'RECOMMENDED_PREPARATION');
    assert.ok(recommended);
    const hasHonestAcceptanceLanguage = recommended.assumptions.some((a) =>
      a.includes('actual facility acceptance depends on physical inspection')
    );
    assert.ok(
      hasHonestAcceptanceLanguage,
      'Must explicitly state that actual facility acceptance depends on physical inspection'
    );
  });

  // 23. Material Honesty: Paper / Cardboard does NOT receive water wash
  test('23. should not recommend aqueous surface wash for contaminated paper and cardboard', () => {
    const cardboardProfile: RecoveryProfile = {
      ...baseProfile,
      primary_material: {
        code: 'PAPER_CARDBOARD',
        name: 'Corrugated Cardboard',
        category: 'PAPER',
        confidence: 91.0,
      },
      composition: [
        {
          material: 'Corrugated Cardboard Sheets',
          material_code: 'PAPER_CARDBOARD',
          category: 'PAPER',
          estimated_share_percent: 100.0,
          confidence: 91.0,
          visual_evidence: ['Fluted corrugated kraft linerboard'],
          contamination_percent: 25.0,
          recoverability_score: 72.0,
          recoverability_grade: 'GRADE_B',
          is_separable: false,
          preparation_actions: ['Manual trimming of greasy sections'],
          uncertainty: ['Fiber length degradation unverified'],
        },
      ],
      contamination: {
        percentage: 25.0,
        type: 'GREASE_FOOD_RESIDUE',
        severity: 'MODERATE',
        explanation: 'Surface food grease stains on top liner.',
        visual_indicators: ['Translucent grease spot'],
      },
      contamination_evidence: ['Grease stains across outer kraft layer'],
    };

    const cardVal = valuationService.calculateValuation({
      materialCode: 'PAPER_CARDBOARD',
      weightKg: 20.0,
      contaminationPercentage: 25.0,
      qualityGrade: 'GRADE_B',
      isUserSpecifiedWeight: false,
      composition: cardboardProfile.composition,
    });

    const result = optimizationService.generateOptimizationIntelligence({
      profile: cardboardProfile,
      valuation: cardVal,
      effectiveWeightKg: 20.0,
      isUserSpecifiedWeight: false,
    });

    const recommended = result.scenarios.find((s) => s.scenario_type === 'RECOMMENDED_PREPARATION');
    assert.ok(recommended);
    assert.ok(
      !recommended.actions.some((a) => a.action_id === 'action-surface-clean'),
      'Must NOT recommend water wash on paper/cardboard'
    );
    assert.ok(
      recommended.actions.some((a) => a.action_id === 'action-paper-trimming'),
      'Must recommend dry shaking or trimming for soiled paper/cardboard'
    );
  });

  // 24. Economic Honesty: Modeled Benchmark Effect vs Guaranteed Profit
  test('24. should label economic outcomes as modeled benchmark effects rather than guaranteed profit', () => {
    const result = optimizationService.generateOptimizationIntelligence({
      profile: baseProfile,
      valuation: baseValuation,
      effectiveWeightKg: 15.0,
      isUserSpecifiedWeight: false,
    });

    for (const scen of result.scenarios) {
      assert.ok(
        scen.economic_effect.includes('Modeled illustrative benchmark effect') ||
          scen.economic_effect.includes('illustrative scenario floor'),
        'Economic effect statement must be explicitly labeled as modeled illustrative benchmark effect'
      );
      assert.ok(
        scen.economic_effect.includes('This is not a guaranteed price') ||
          scen.economic_effect.includes('illustrative scenario floor'),
        'Economic effect must clarify that outcomes are not guaranteed prices or realized profits'
      );
    }
  });

  // 25. Issue 9.1: 5% threshold is an action-suppression heuristic, not a physical clean limit
  test('25. should treat 5% threshold strictly as an action-suppression heuristic rather than a physical clean limit', () => {
    assert.strictEqual(OPTIMIZATION_CONFIG.ACTION_SUPPRESSION_THRESHOLD_PERCENT, 5.0);
    assert.strictEqual(OPTIMIZATION_CONFIG.ILLUSTRATIVE_ACTION_SUPPRESSION_HEURISTIC, 5.0);
    assert.strictEqual(ILLUSTRATIVE_SCENARIO_COEFFICIENTS.ACTION_SUPPRESSION_THRESHOLD_PERCENT, 5.0);

    const subThresholdProfile: RecoveryProfile = {
      ...baseProfile,
      contamination: {
        percentage: 4.5,
        type: 'LIGHT_DUST',
        severity: 'LOW',
        explanation: 'Minor packaging surface dust.',
        visual_indicators: ['Fine dust layer'],
      },
      contamination_evidence: ['Minor fine dust layer'],
    };

    const subVal = valuationService.calculateValuation({
      materialCode: 'PLASTIC_PET',
      weightKg: 10.0,
      contaminationPercentage: 4.5,
      qualityGrade: 'GRADE_A',
      isUserSpecifiedWeight: false,
      composition: subThresholdProfile.composition,
    });

    const result = optimizationService.generateOptimizationIntelligence({
      profile: subThresholdProfile,
      valuation: subVal,
      effectiveWeightKg: 10.0,
      isUserSpecifiedWeight: false,
    });

    for (const scen of result.scenarios) {
      assert.strictEqual(
        scen.modeling_coefficients.action_suppression_heuristic,
        5.0,
        'Must expose action_suppression_heuristic in modeling_coefficients'
      );
      assert.ok(
        !scen.actions.some((a) => a.action_id === 'action-surface-clean'),
        'Must suppress generic wash decontamination recommendations below 5% heuristic threshold'
      );
      // Modeled contamination should remain currentContam (4.5%), NOT zero or forced to 2.0%
      assert.strictEqual(
        scen.modeled_state.projected_contamination_percentage,
        4.5,
        'Modeled contamination must not be forced to sterile or floor when below suppression threshold'
      );
      // Must not claim 4.5% or 5% is scientifically clean or acceptable contamination limit
      const fullText = (
        scen.description +
        ' ' +
        scen.assumptions.join(' ') +
        ' ' +
        scen.economic_effect
      ).toLowerCase();
      assert.ok(!fullText.includes('acceptable contamination limit'));
      assert.ok(!fullText.includes('scientifically clean'));
      assert.ok(!fullText.includes('commercial clean threshold'));
      assert.ok(!fullText.includes('industry clean threshold'));
    }
  });

  // 26. Issue 9.2: High contamination alone does not generate washing
  test('26. should NOT generate aqueous washing solely due to high contamination percentage', () => {
    const highContamDryProfile: RecoveryProfile = {
      ...baseProfile,
      contamination: {
        percentage: 48.0,
        type: 'DRY_SAND_AND_DUST',
        severity: 'HIGH',
        explanation: 'Dry sand and inert mineral dust from outdoor construction storage.',
        visual_indicators: ['Dry particulate', 'Dust film'],
      },
      contamination_evidence: ['Dry fine sand deposits on external surface'],
    };

    const dryVal = valuationService.calculateValuation({
      materialCode: 'PLASTIC_PET',
      weightKg: 15.0,
      contaminationPercentage: 48.0,
      qualityGrade: 'GRADE_C',
      isUserSpecifiedWeight: false,
      composition: highContamDryProfile.composition,
    });

    const result = optimizationService.generateOptimizationIntelligence({
      profile: highContamDryProfile,
      valuation: dryVal,
      effectiveWeightKg: 15.0,
      isUserSpecifiedWeight: false,
    });

    for (const scen of result.scenarios) {
      assert.ok(
        !scen.actions.some((a) => a.action_id === 'action-surface-clean'),
        'High contamination (48%) with only dry sand/dust must NOT trigger aqueous surface wash'
      );
    }
  });

  // 27. Issue 9.3: Washing requires appropriate material/evidence context
  test('27. should generate washing ONLY when soluble evidence exists AND material allows it', () => {
    const solublePetProfile: RecoveryProfile = {
      ...baseProfile,
      primary_material: {
        code: 'PLASTIC_PET',
        name: 'Polyethylene Terephthalate',
        category: 'PLASTIC',
        confidence: 95.0,
      },
      composition: [
        {
          material: 'PET Bottles',
          material_code: 'PLASTIC_PET',
          category: 'PLASTIC',
          estimated_share_percent: 100.0,
          confidence: 95.0,
          visual_evidence: ['Transparent bottle walls'],
          contamination_percent: 22.0,
          recoverability_score: 75.0,
          recoverability_grade: 'GRADE_B',
          is_separable: false,
          preparation_actions: ['Wash'],
          uncertainty: [],
        },
      ],
      contamination: {
        percentage: 22.0,
        type: 'MUD_SLUDGE',
        severity: 'MODERATE',
        explanation: 'Caked mud and sticky syrup adhering to exterior.',
        visual_indicators: ['Caked mud', 'Sticky residue'],
      },
      contamination_evidence: ['Adhered mud and sticky syrup layer'],
    };

    const petVal = valuationService.calculateValuation({
      materialCode: 'PLASTIC_PET',
      weightKg: 10.0,
      contaminationPercentage: 22.0,
      qualityGrade: 'GRADE_B',
      isUserSpecifiedWeight: false,
      composition: solublePetProfile.composition,
    });

    const result = optimizationService.generateOptimizationIntelligence({
      profile: solublePetProfile,
      valuation: petVal,
      effectiveWeightKg: 10.0,
      isUserSpecifiedWeight: false,
    });

    const recommended = result.scenarios.find((s) => s.scenario_type === 'RECOMMENDED_PREPARATION');
    assert.ok(recommended);
    const washAction = recommended.actions.find((a) => a.action_id === 'action-surface-clean');
    assert.ok(washAction, 'Must generate surface wash when explicit soluble mud/syrup evidence exists on PET');
    assert.ok(
      washAction.observed_basis.toLowerCase().includes('mud') ||
        washAction.observed_basis.toLowerCase().includes('syrup'),
      'Observed basis must reference observed soluble mud/syrup evidence'
    );
  });

  // 28. Issue 9.4: Mixed batch does not receive blanket washing
  test('28. should NOT generate blanket surface wash for heterogeneous mixed batches', () => {
    const marineMixedProfile: RecoveryProfile = {
      ...baseProfile,
      primary_material: {
        code: 'OTHER',
        name: 'Mixed Marine Shoreline Debris',
        category: 'OTHER',
        confidence: 92.0,
      },
      composition: [
        {
          material: 'PET Beverage Bottles',
          material_code: 'PLASTIC_PET',
          category: 'PLASTIC',
          estimated_share_percent: 45.0,
          confidence: 90.0,
          visual_evidence: ['Clear transparent bottle bodies'],
          contamination_percent: 30.0,
          recoverability_score: 45.0,
          recoverability_grade: 'GRADE_C',
          is_separable: true,
          preparation_actions: ['Segregate'],
          uncertainty: [],
        },
        {
          material: 'Glass Containers',
          material_code: 'GLASS_CULLET',
          category: 'GLASS',
          estimated_share_percent: 25.0,
          confidence: 88.0,
          visual_evidence: ['Amber and green bottle silhouettes'],
          contamination_percent: 20.0,
          recoverability_score: 55.0,
          recoverability_grade: 'GRADE_B',
          is_separable: true,
          preparation_actions: ['Segregate'],
          uncertainty: [],
        },
        {
          material: 'Synthetic Fishing Netting',
          material_code: 'OTHER',
          category: 'OTHER',
          estimated_share_percent: 30.0,
          confidence: 85.0,
          visual_evidence: ['Green braided polypropylene ropes and netting'],
          contamination_percent: 60.0,
          recoverability_score: 15.0,
          recoverability_grade: 'REJECT',
          is_separable: true,
          preparation_actions: ['Extract manually'],
          uncertainty: [],
        },
      ],
      contamination: {
        percentage: 42.0,
        type: 'SAND_AND_ORGANIC_MATTER',
        severity: 'HIGH',
        explanation: 'Batch coated in beach sand, marine silt, and dried seaweed.',
        visual_indicators: ['Sand coating', 'Organic matter'],
      },
      contamination_evidence: ['Beach sand coating across entangled netting and bottles'],
    };

    const mixedVal = valuationService.calculateValuation({
      materialCode: 'OTHER',
      weightKg: 30.0,
      contaminationPercentage: 42.0,
      qualityGrade: 'REJECT',
      isUserSpecifiedWeight: false,
      composition: marineMixedProfile.composition,
    });

    const result = optimizationService.generateOptimizationIntelligence({
      profile: marineMixedProfile,
      valuation: mixedVal,
      effectiveWeightKg: 30.0,
      isUserSpecifiedWeight: false,
    });

    for (const scen of result.scenarios) {
      assert.ok(
        !scen.actions.some((a) => a.action_id === 'action-surface-clean'),
        'Mixed batch must NEVER receive generic blanket action-surface-clean'
      );
      assert.ok(
        !scen.actions.some((a) => a.title.toLowerCase() === 'surface wash'),
        'Must never prescribe generic "Surface Wash" to an entire heterogeneous batch'
      );
      assert.ok(
        !scen.actions.some((a) => a.title === 'Flatten, Bale & Compact Batch'),
        'Mixed batch with unsegregated glass must NEVER receive generic batch compaction'
      );
    }

    // Segregation must be strongly represented in recommended and maximum scenarios
    const recommended = result.scenarios.find((s) => s.scenario_type === 'RECOMMENDED_PREPARATION');
    const maxSep = result.scenarios.find((s) => s.scenario_type === 'MAXIMUM_SEPARATION');
    assert.ok(
      recommended?.actions.some((a) => a.action_id.startsWith('action-segregate-')),
      'Recommended scenario must prioritize segregation for mixed batch'
    );
    assert.ok(
      maxSep?.actions.some((a) => a.action_id.startsWith('action-segregate-')),
      'Maximum separation scenario must prioritize segregation for mixed batch'
    );
  });

  // 29. Issue 9.5: E-waste remains protected from aqueous washing
  test('29. should verify e-waste is strictly blocked from aqueous washing and hydraulic compaction in compatibility matrix', () => {
    assert.strictEqual(getActionCompatibility('EWASTE_PCB', 'AQUEOUS_WASHING'), 'BLOCKED');
    assert.strictEqual(getActionCompatibility('EWASTE_PCB', 'COMPACTION_BALING'), 'BLOCKED');
    assert.strictEqual(getActionCompatibility('EWASTE_PCB', 'LIQUID_DRAINAGE'), 'BLOCKED');
    assert.strictEqual(getActionCompatibility('EWASTE_PCB', 'DRY_CLEANING'), 'ALLOWED');
    assert.strictEqual(getActionCompatibility('EWASTE_PCB', 'SPECIALIZED_HANDLING'), 'ALLOWED');
    assert.strictEqual(MATERIAL_ACTION_COMPATIBILITY_MATRIX.EWASTE_PCB.AQUEOUS_WASHING, 'BLOCKED');
    assert.strictEqual(MATERIAL_ACTION_COMPATIBILITY_MATRIX.EWASTE_PCB.COMPACTION_BALING, 'BLOCKED');
  });

  // 30. Issue 9.6: Paper/cardboard remains protected from unsupported aqueous washing
  test('30. should verify paper and cardboard are strictly blocked from aqueous washing and liquid drainage in compatibility matrix', () => {
    assert.strictEqual(getActionCompatibility('PAPER_CARDBOARD', 'AQUEOUS_WASHING'), 'BLOCKED');
    assert.strictEqual(getActionCompatibility('PAPER_CARDBOARD', 'LIQUID_DRAINAGE'), 'BLOCKED');
    assert.strictEqual(getActionCompatibility('PAPER_CARDBOARD', 'DRY_CLEANING'), 'ALLOWED');
    assert.strictEqual(getActionCompatibility('PAPER_CARDBOARD', 'COMPACTION_BALING'), 'ALLOWED');
    assert.strictEqual(MATERIAL_ACTION_COMPATIBILITY_MATRIX.PAPER_CARDBOARD.AQUEOUS_WASHING, 'BLOCKED');
    assert.strictEqual(MATERIAL_ACTION_COMPATIBILITY_MATRIX.PAPER_CARDBOARD.LIQUID_DRAINAGE, 'BLOCKED');
  });

  // 31. Issue 9.7: Clean homogeneous material remains free of irrelevant interventions
  test('31. should not generate decontamination or segregation interventions for clean homogeneous material', () => {
    const cleanHdpeProfile: RecoveryProfile = {
      ...baseProfile,
      primary_material: {
        code: 'PLASTIC_HDPE',
        name: 'High-Density Polyethylene',
        category: 'PLASTIC',
        confidence: 96.0,
      },
      composition: [
        {
          material: 'Rigid HDPE Industrial Drums',
          material_code: 'PLASTIC_HDPE',
          category: 'PLASTIC',
          estimated_share_percent: 100.0,
          confidence: 96.0,
          visual_evidence: ['Clean blue blow-molded HDPE drum bodies'],
          contamination_percent: 1.5,
          recoverability_score: 96.0,
          recoverability_grade: 'GRADE_A',
          is_separable: false,
          preparation_actions: [],
          uncertainty: [],
        },
      ],
      contamination: {
        percentage: 1.5,
        type: 'CLEAN',
        severity: 'CLEAN',
        explanation: 'Clean empty industrial drums with no chemical residue.',
        visual_indicators: [],
      },
      contamination_evidence: [],
      recoverability: {
        score: 96.0,
        grade: 'GRADE_A',
        is_commercially_viable: true,
        actionable_advice: 'Consolidate for direct transport to blow-molding reprocessor.',
        potential_applications: ['Drum regrind', 'Drainage pipe extrusion'],
      },
    };

    const hdpeVal = valuationService.calculateValuation({
      materialCode: 'PLASTIC_HDPE',
      weightKg: 25.0,
      contaminationPercentage: 1.5,
      qualityGrade: 'GRADE_A',
      isUserSpecifiedWeight: false,
      composition: cleanHdpeProfile.composition,
    });

    const result = optimizationService.generateOptimizationIntelligence({
      profile: cleanHdpeProfile,
      valuation: hdpeVal,
      effectiveWeightKg: 25.0,
      isUserSpecifiedWeight: false,
    });

    for (const scen of result.scenarios) {
      assert.ok(
        !scen.actions.some((a) => a.action_id === 'action-surface-clean'),
        'Clean HDPE must not have surface clean action'
      );
      assert.ok(
        !scen.actions.some((a) => a.action_id === 'action-drain-residuals'),
        'Clean dry drums must not have liquid drain action'
      );
      assert.ok(
        !scen.actions.some((a) => a.action_id.startsWith('action-segregate-')),
        'Clean single-stream HDPE must not have segregation actions'
      );
    }
  });

  // 32. Issue 9.8: No "certified scale weight" wording
  test('32. should not contain "certified scale weight" or unsupported certification wording anywhere in output', () => {
    const result = optimizationService.generateOptimizationIntelligence({
      profile: baseProfile,
      valuation: baseValuation,
      effectiveWeightKg: 15.0,
      isUserSpecifiedWeight: true,
    });

    const serialized = JSON.stringify(result).toLowerCase();
    assert.ok(!serialized.includes('certified scale'), 'Output must not mention "certified scale"');
    assert.ok(!serialized.includes('certified weight'), 'Output must not mention "certified weight"');
    assert.ok(!serialized.includes('certified weighment'), 'Output must not mention "certified weighment"');
    assert.ok(!serialized.includes('physically measured by ai'), 'Output must not claim "physically measured by AI"');
    assert.ok(!serialized.includes('measured by recyclens'), 'Output must not claim "measured by RecycLens"');
  });

  // 33. Issue 9.9: User-confirmed scale weight remains USER_CONFIRMED_SCALE_WEIGHMENT
  test('33. should strictly preserve USER_CONFIRMED_SCALE_WEIGHMENT data origin semantics', () => {
    const result = optimizationService.generateOptimizationIntelligence({
      profile: baseProfile,
      valuation: baseValuation,
      effectiveWeightKg: 50.0,
      isUserSpecifiedWeight: true,
    });

    for (const scen of result.scenarios) {
      assert.strictEqual(
        scen.current_state_reference.weight_basis,
        'USER_CONFIRMED_SCALE_WEIGHMENT',
        'Weight basis must strictly equal USER_CONFIRMED_SCALE_WEIGHMENT'
      );
    }
  });

  // 34. Issue 9.10: Every generated action has an evidence basis
  test('34. should ensure every generated action has a verified evidence basis from Phase 3 normalized data', () => {
    const result = optimizationService.generateOptimizationIntelligence({
      profile: baseProfile,
      valuation: baseValuation,
      effectiveWeightKg: 15.0,
      isUserSpecifiedWeight: false,
    });

    for (const scen of result.scenarios) {
      for (const action of scen.actions) {
        assert.ok(action.action_id, 'Action must have action_id');
        assert.ok(action.title, 'Action must have title');
        assert.ok(action.observed_basis && action.observed_basis.trim().length > 0, 'Action must have observed_basis');
        assert.ok(action.rationale && action.rationale.trim().length > 0, 'Action must have rationale');
        assert.ok(action.scenario_assumption && action.scenario_assumption.trim().length > 0, 'Action must have scenario_assumption');
        assert.ok(action.modeled_effect && action.modeled_effect.trim().length > 0, 'Action must have modeled_effect');
        assert.ok(action.uncertainty && action.uncertainty.trim().length > 0, 'Action must have uncertainty');
        assert.ok(action.affected_material_codes.length > 0, 'Action must declare affected_material_codes');
      }
    }
  });

  // 35. Action Scoping: Heterogeneous batch cannot receive generic batch compaction when incompatible fractions exist
  test('35. should scope compaction to compatible fraction when incompatible fractions (e.g. glass) are present', () => {
    const mixedWithGlassProfile: RecoveryProfile = {
      ...baseProfile,
      primary_material: {
        code: 'OTHER',
        name: 'Mixed Packaging with Glass',
        category: 'OTHER',
        confidence: 90.0,
      },
      composition: [
        {
          material: 'PET Bottles',
          material_code: 'PLASTIC_PET',
          category: 'PLASTIC',
          estimated_share_percent: 60.0,
          confidence: 92.0,
          visual_evidence: ['Transparent bottle contours'],
          contamination_percent: 15.0,
          recoverability_score: 80.0,
          recoverability_grade: 'GRADE_B',
          is_separable: true,
          preparation_actions: ['Segregate'],
          uncertainty: [],
        },
        {
          material: 'Glass Containers',
          material_code: 'GLASS_CULLET',
          category: 'GLASS',
          estimated_share_percent: 40.0,
          confidence: 88.0,
          visual_evidence: ['Amber and flint glass bottles'],
          contamination_percent: 10.0,
          recoverability_score: 85.0,
          recoverability_grade: 'GRADE_A',
          is_separable: true,
          preparation_actions: ['Segregate'],
          uncertainty: [],
        },
      ],
      contamination: {
        percentage: 13.0,
        type: 'DUST',
        severity: 'LOW',
        explanation: 'Surface dust on containers.',
        visual_indicators: ['Dust'],
      },
      contamination_evidence: ['Surface dust'],
    };

    const val = valuationService.calculateValuation({
      materialCode: 'OTHER',
      weightKg: 20.0,
      contaminationPercentage: 13.0,
      qualityGrade: 'GRADE_B',
      isUserSpecifiedWeight: false,
      composition: mixedWithGlassProfile.composition,
    });

    const result = optimizationService.generateOptimizationIntelligence({
      profile: mixedWithGlassProfile,
      valuation: val,
      effectiveWeightKg: 20.0,
      isUserSpecifiedWeight: false,
    });

    for (const scen of result.scenarios) {
      // Must NOT have generic batch compaction
      assert.ok(
        !scen.actions.some((a) => a.title === 'Flatten, Bale & Compact Batch'),
        'Must NOT generate generic batch compaction on mixed batch containing glass'
      );
      // Compaction must be fraction-scoped to PET
      const petCompaction = scen.actions.find((a) => a.action_id === 'action-bale-compact-plastic_pet');
      if (petCompaction) {
        assert.ok(
          petCompaction.title.includes('PET Bottles') && petCompaction.title.includes('After Physical Segregation'),
          'Compaction must be explicitly scoped to PET fraction after physical segregation'
        );
        assert.strictEqual(petCompaction.affected_material_codes.includes('PLASTIC_PET'), true);
        assert.strictEqual(petCompaction.affected_material_codes.includes('GLASS_CULLET'), false);
      }
      // Glass must receive rigid cullet bin consolidation, NOT compaction
      const glassHandling = scen.actions.find((a) => a.action_id === 'action-glass-bin-handling');
      if (glassHandling) {
        assert.ok(glassHandling.title.includes('Rigid Cullet Bins'));
        assert.strictEqual(glassHandling.affected_material_codes.includes('GLASS_CULLET'), true);
      }
    }
  });

  // 36. Liquid Drainage Scoping in Multi-Material Batches
  test('36. should scope liquid drainage specifically to beverage container fractions in multi-material batches', () => {
    const mixedLiquidProfile: RecoveryProfile = {
      ...baseProfile,
      composition: [
        {
          material: 'PET Bottles',
          material_code: 'PLASTIC_PET',
          category: 'PLASTIC',
          estimated_share_percent: 70.0,
          confidence: 90.0,
          visual_evidence: ['Bottle bodies with liquid droplets'],
          contamination_percent: 25.0,
          recoverability_score: 75.0,
          recoverability_grade: 'GRADE_B',
          is_separable: false,
          preparation_actions: ['Drain'],
          uncertainty: [],
        },
        {
          material: 'Cardboard Shipping Sleeves',
          material_code: 'PAPER_CARDBOARD',
          category: 'PAPER',
          estimated_share_percent: 30.0,
          confidence: 90.0,
          visual_evidence: ['Corrugated paper sleeves'],
          contamination_percent: 10.0,
          recoverability_score: 80.0,
          recoverability_grade: 'GRADE_B',
          is_separable: true,
          preparation_actions: ['Segregate'],
          uncertainty: [],
        },
      ],
      contamination: {
        percentage: 20.0,
        type: 'BEVERAGE_DROPLETS',
        severity: 'LOW',
        explanation: 'Liquid pooling in PET bottle bottoms.',
        visual_indicators: ['Liquid pooling'],
      },
      contamination_evidence: ['Liquid pooling in PET bottle bottoms'],
    };

    const val = valuationService.calculateValuation({
      materialCode: 'PLASTIC_PET',
      weightKg: 10.0,
      contaminationPercentage: 20.0,
      qualityGrade: 'GRADE_B',
      isUserSpecifiedWeight: false,
      composition: mixedLiquidProfile.composition,
    });

    const result = optimizationService.generateOptimizationIntelligence({
      profile: mixedLiquidProfile,
      valuation: val,
      effectiveWeightKg: 10.0,
      isUserSpecifiedWeight: false,
    });

    const recommended = result.scenarios.find((s) => s.scenario_type === 'RECOMMENDED_PREPARATION');
    assert.ok(recommended);
    const drainAction = recommended.actions.find((a) => a.action_id === 'action-drain-residuals');
    assert.ok(drainAction, 'Drain action must be present');
    assert.ok(
      drainAction.title.includes('PET Bottles Fraction'),
      'Drainage must be scoped specifically to PET Bottles Fraction'
    );
    assert.strictEqual(
      drainAction.affected_material_codes.includes('PAPER_CARDBOARD'),
      false,
      'Paper/cardboard fraction must NOT be an affected material code for liquid drainage'
    );
  });

  // 37. Semantic Material Distinction: TEST_D Construction Timber / Lumber
  test('37. should correctly model preparation for construction timber / lumber without confusing it with cardboard', () => {
    const timberProfile: RecoveryProfile = {
      ...baseProfile,
      primary_material: {
        code: 'OTHER',
        name: 'Dimensional Construction Lumber',
        category: 'OTHER',
        confidence: 96.0,
      },
      composition: [
        {
          material: 'Dimensional Lumber Beams',
          material_code: 'OTHER',
          category: 'OTHER',
          estimated_share_percent: 95.0,
          confidence: 96.0,
          visual_evidence: ['Large structural wooden timber beams with surface sawdust'],
          contamination_percent: 5.0,
          recoverability_score: 70.0,
          recoverability_grade: 'GRADE_B',
          is_separable: false,
          preparation_actions: [],
          uncertainty: ['Pressure-treated chemical status unconfirmed'],
        },
        {
          material: 'Steel Fasteners and Hardware',
          material_code: 'METAL_STEEL',
          category: 'METAL',
          estimated_share_percent: 5.0,
          confidence: 90.0,
          visual_evidence: ['Circular saw blade, clamps, and steel fasteners'],
          contamination_percent: 0.0,
          recoverability_score: 95.0,
          recoverability_grade: 'GRADE_A',
          is_separable: true,
          preparation_actions: ['Extract fasteners'],
          uncertainty: [],
        },
      ],
      contamination: {
        percentage: 4.8,
        type: 'SURFACE_SAWDUST',
        severity: 'CLEAN',
        explanation: 'Inert surface sawdust on timber beams.',
        visual_indicators: ['Sawdust'],
      },
      contamination_evidence: ['Inert surface sawdust on timber beams'],
    };

    const val = valuationService.calculateValuation({
      materialCode: 'OTHER',
      weightKg: 50.0,
      contaminationPercentage: 4.8,
      qualityGrade: 'GRADE_B',
      isUserSpecifiedWeight: false,
      composition: timberProfile.composition,
    });

    const result = optimizationService.generateOptimizationIntelligence({
      profile: timberProfile,
      valuation: val,
      effectiveWeightKg: 50.0,
      isUserSpecifiedWeight: false,
    });

    for (const scen of result.scenarios) {
      assert.ok(
        !scen.actions.some((a) => a.action_id === 'action-surface-clean'),
        'Aqueous washing must NOT be generated for structural timber batch'
      );
      assert.ok(
        !scen.actions.some((a) => a.action_id === 'action-paper-trimming'),
        'Must NOT generate paper pulper trimming for solid lumber'
      );
    }

    const maxSep = result.scenarios.find((s) => s.scenario_type === 'MAXIMUM_SEPARATION');
    assert.ok(
      maxSep?.actions.some((a) => a.action_id === 'action-segregate-metal_steel'),
      'Must recommend segregating steel fasteners from timber in maximum separation scenario'
    );
  });

  // 38. Component-Specific Evidence Chain Enforcement
  test('38. should ensure action evidence chains are strictly grounded in component-specific normalized data', () => {
    const result = optimizationService.generateOptimizationIntelligence({
      profile: baseProfile,
      valuation: baseValuation,
      effectiveWeightKg: 15.0,
      isUserSpecifiedWeight: false,
    });

    for (const scen of result.scenarios) {
      for (const act of scen.actions) {
        assert.ok(act.observed_basis.length > 0, 'Every action must declare an observed basis');
        assert.ok(act.rationale.length > 0, 'Every action must declare a technical rationale');
        assert.ok(act.scenario_assumption.length > 0, 'Every action must declare an illustrative scenario assumption');
        assert.ok(act.modeled_effect.length > 0, 'Every action must declare a modeled effect');
        assert.ok(act.uncertainty.length > 0, 'Every action must declare an uncertainty');
        assert.ok(act.affected_material_codes.length > 0, 'Action must declare affected material codes');
      }
    }
  });

  // 39. Multi-Material Heap Regression: Visible Secondary Materials with Evidence-Appropriate Granularity
  test('39. should generate tailored preparation actions for each distinct visible secondary fraction without fabricating unsupported polymer codes', () => {
    // Ground-truth matching live Gemini output:
    // PET bottle bodies + Aluminium cans + Plastic closures classified honestly as OTHER (PP vs HDPE unconfirmed visually)
    const liveObservedProfile: RecoveryProfile = {
      ...baseProfile,
      primary_material: {
        code: 'PLASTIC_PET',
        name: 'Polyethylene Terephthalate Bottles',
        category: 'PLASTIC',
        confidence: 94.0,
      },
      composition: [
        {
          material: 'Clear and Colored PET Bottles',
          material_code: 'PLASTIC_PET',
          category: 'PLASTIC',
          estimated_share_percent: 75.0,
          confidence: 94.0,
          visual_evidence: ['Transparent fluted bottle bodies', 'Threaded necks'],
          contamination_percent: 6.0,
          recoverability_score: 90.0,
          recoverability_grade: 'GRADE_A',
          is_separable: false,
          preparation_actions: ['Flatten bottles to reduce volume'],
          uncertainty: [],
        },
        {
          material: 'Aluminium Beverage Cans',
          material_code: 'METAL_ALUMINIUM',
          category: 'METAL',
          estimated_share_percent: 15.0,
          confidence: 92.0,
          visual_evidence: ['Crushed and intact metallic beverage cans with pull tabs'],
          contamination_percent: 4.0,
          recoverability_score: 95.0,
          recoverability_grade: 'GRADE_A',
          is_separable: true,
          preparation_actions: ['Segregate cans from plastic stream'],
          uncertainty: [],
        },
        {
          material: 'Plastic Closures and Caps',
          material_code: 'OTHER',
          category: 'OTHER',
          estimated_share_percent: 10.0,
          confidence: 88.0,
          visual_evidence: ['Small opaque threaded caps in blue, green, and white'],
          contamination_percent: 2.0,
          recoverability_score: 70.0,
          recoverability_grade: 'GRADE_B',
          is_separable: true,
          preparation_actions: ['Unscrew caps prior to baling'],
          uncertainty: ['Exact polymer (PP vs HDPE) requires density or spectroscopic verification'],
        },
      ],
      contamination: {
        percentage: 5.5,
        type: 'BEVERAGE_RESIDUE',
        severity: 'LOW',
        explanation: 'Residual liquid droplets inside bottles and cans.',
        visual_indicators: ['Droplets'],
      },
      contamination_evidence: ['Residual beverage droplets inside containers'],
    };

    const val = valuationService.calculateValuation({
      materialCode: 'PLASTIC_PET',
      weightKg: 20.0,
      contaminationPercentage: 5.5,
      qualityGrade: 'GRADE_A',
      isUserSpecifiedWeight: false,
      composition: liveObservedProfile.composition,
    });

    const result = optimizationService.generateOptimizationIntelligence({
      profile: liveObservedProfile,
      valuation: val,
      effectiveWeightKg: 20.0,
      isUserSpecifiedWeight: false,
    });

    const maxSep = result.scenarios.find((s) => s.scenario_type === 'MAXIMUM_SEPARATION');
    assert.ok(maxSep, 'Must generate MAXIMUM_SEPARATION scenario');

    // 1. Aluminium fraction receives aluminium-compatible segregation action
    const segAluminium = maxSep.actions.find((a) => a.action_id === 'action-segregate-metal_aluminium');
    assert.ok(segAluminium, 'Must generate segregation action for metallic aluminium cans');
    assert.deepStrictEqual(segAluminium.affected_material_codes, ['METAL_ALUMINIUM', 'PLASTIC_PET']);

    // 2. OTHER plastic closures fraction receives appropriate generic segregation action
    const segOther = maxSep.actions.find((a) => a.action_id === 'action-segregate-other');
    assert.ok(segOther, 'Must generate segregation action for plastic closures (OTHER)');
    assert.deepStrictEqual(segOther.affected_material_codes, ['OTHER', 'PLASTIC_PET']);

    // 3. No unsupported PP-specific action should be fabricated when normalized material is OTHER
    assert.ok(
      !maxSep.actions.some((a) => a.action_id === 'action-segregate-plastic_pp'),
      'Must NOT fabricate unsupported PP-specific actions when normalized code is OTHER'
    );

    // 4. PET fraction receives PET-compatible compaction and drainage actions
    const compaction = maxSep.actions.find((a) => a.action_id.startsWith('action-bale-compact'));
    assert.ok(compaction, 'Must generate compaction action for balable stream');
    assert.strictEqual(compaction.action_id, 'action-bale-compact');
    assert.deepStrictEqual(compaction.affected_material_codes, ['PLASTIC_PET']);

    const drainage = maxSep.actions.find((a) => a.action_id === 'action-drain-residuals');
    assert.ok(drainage, 'Must generate liquid drainage action for beverage container fraction');
    assert.deepStrictEqual(drainage.affected_material_codes, ['PLASTIC_PET']);
  });
});
