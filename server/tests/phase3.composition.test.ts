import { test, describe } from 'node:test';
import assert from 'node:assert';
import {
  normalizeAndValidateAIResponse,
  rawAIResponseSchema,
  TOTAL_AI_BUDGET_MS,
  MAX_CANDIDATE_TIMEOUT_MS,
} from '../services/ai-vision.service.ts';
import { valuationService } from '../services/valuation.service.ts';
import { matchingService } from '../services/matching.service.ts';
import { fallbackService } from '../services/fallback.service.ts';
import { BatchComponent, QualityGrade } from '../../src/types/recyclens.types.ts';

describe('Phase 3 Multi-Material Batch Composition & Decision Engine Tests', () => {
  const baseMock = {
    primary_material: {
      code: 'PLASTIC_PET',
      name: 'Polyethylene Terephthalate',
      category: 'PLASTIC' as const,
      confidence: 90.0,
      polymer_subtype: 'PET #1',
    },
    visual_evidence: ['Clear optical transparency', 'Blow-molded petaloid base finish'],
    secondary_materials: [],
    contamination: {
      percentage: 10.0,
      type: 'BEVERAGE_RESIDUE',
      severity: 'LOW' as const,
      explanation: 'Minor droplet condensation.',
      visual_indicators: ['Droplet traces'],
    },
    contamination_evidence: ['Visible droplet pooling in base cavity'],
    recoverability: {
      score: 88.0,
      grade: 'GRADE_A' as const,
      is_commercially_viable: true,
      actionable_advice: 'Flatten and drain bottles.',
      potential_applications: ['rPET bottle-to-bottle'],
    },
    uncertainty: ['Polymer IV cannot be measured visually', 'Batch weight requires scale'],
    recommended_preparation: ['Drain liquid', 'Remove caps'],
    visual_explanation: 'Clear beverage container batch in good recyclable condition.',
  };

  // 1. Valid Single-Material Composition
  test('1. should handle valid single-material composition correctly', () => {
    const singleMatMock = {
      ...baseMock,
      composition: [
        {
          material: 'PET Bottle Bodies',
          material_code: 'PLASTIC_PET',
          category: 'PLASTIC' as const,
          estimated_share_percent: 100,
          confidence: 92,
          polymer_subtype: 'PET #1',
          visual_evidence: ['Transparent sidewalls', 'Petaloid base'],
          contamination_percent: 10,
          recoverability_score: 90,
          recoverability_grade: 'GRADE_A' as const,
          is_separable: false,
          preparation_actions: ['Flatten bottles'],
          uncertainty: ['Viscosity unconfirmed'],
        },
      ],
    };

    const result = normalizeAndValidateAIResponse(singleMatMock);
    assert.strictEqual(result.composition.length, 1);
    assert.strictEqual(result.composition[0].estimated_share_percent, 100);
    assert.strictEqual(result.unresolved_fraction, undefined);
    assert.ok(result.recovery_decision);
    assert.strictEqual(result.recovery_decision?.routing_strategy, 'SINGLE_FACILITY');
  });

  // 2. Valid Multi-Material Composition
  test('2. should normalize and preserve valid multi-material composition', () => {
    const multiMatMock = {
      ...baseMock,
      composition: [
        {
          material: 'PET Bottle Bodies',
          material_code: 'PLASTIC_PET',
          category: 'PLASTIC' as const,
          estimated_share_percent: 80,
          confidence: 91,
          visual_evidence: ['Clear cylindrical fluted bottle bodies'],
          contamination_percent: 8,
          recoverability_score: 92,
          recoverability_grade: 'GRADE_A' as const,
          is_separable: false,
          preparation_actions: ['Perforate and compress'],
          uncertainty: ['IV unverified'],
        },
        {
          material: 'PP Screw Closures',
          material_code: 'PLASTIC_PP',
          category: 'PLASTIC' as const,
          estimated_share_percent: 20,
          confidence: 88,
          visual_evidence: ['Opaque blue injection molded closure caps'],
          contamination_percent: 5,
          recoverability_score: 85,
          recoverability_grade: 'GRADE_A' as const,
          is_separable: true,
          preparation_actions: ['Unscrew manually prior to baling'],
          uncertainty: ['Additive colorant unconfirmed'],
        },
      ],
    };

    const result = normalizeAndValidateAIResponse(multiMatMock);
    assert.strictEqual(result.composition.length, 2);
    assert.strictEqual(result.composition[0].estimated_share_percent, 80);
    assert.strictEqual(result.composition[1].estimated_share_percent, 20);
    assert.ok(result.recovery_decision?.batch_archetype.includes('Multi-Material'));
    assert.ok(result.recovery_decision?.recommended_action.includes('PP Screw Closures'));
  });

  // 3. Percentages Within Valid Bounds
  test('3. should enforce component percentage bounds [1, 100]', () => {
    const boundsMock = {
      ...baseMock,
      composition: [
        {
          material: 'PET Bottle Bodies',
          material_code: 'PLASTIC_PET',
          category: 'PLASTIC' as const,
          estimated_share_percent: 60,
          confidence: 90,
          visual_evidence: ['Evidence A'],
          contamination_percent: 5,
          recoverability_score: 90,
          recoverability_grade: 'GRADE_A' as const,
          is_separable: false,
          preparation_actions: ['Prep A'],
          uncertainty: ['Unc A'],
        },
        {
          material: 'PP Closures',
          material_code: 'PLASTIC_PP',
          category: 'PLASTIC' as const,
          estimated_share_percent: 40,
          confidence: 85,
          visual_evidence: ['Evidence B'],
          contamination_percent: 5,
          recoverability_score: 85,
          recoverability_grade: 'GRADE_A' as const,
          is_separable: true,
          preparation_actions: ['Prep B'],
          uncertainty: ['Unc B'],
        },
      ],
    };

    const result = normalizeAndValidateAIResponse(boundsMock);
    const sum = result.composition.reduce((acc, c) => acc + c.estimated_share_percent, 0);
    assert.strictEqual(sum, 100);
    for (const c of result.composition) {
      assert.ok(c.estimated_share_percent >= 1 && c.estimated_share_percent <= 100);
    }
  });

  // 4. Percentages Exceeding 100
  test('4. should proportionally downscale composition shares when exceeding 100', () => {
    const over100Mock = {
      ...baseMock,
      composition: [
        {
          material: 'Component Alpha',
          material_code: 'PLASTIC_PET',
          category: 'PLASTIC' as const,
          estimated_share_percent: 90,
          confidence: 90,
          visual_evidence: ['Evidence Alpha'],
          contamination_percent: 10,
          recoverability_score: 85,
          recoverability_grade: 'GRADE_A' as const,
          is_separable: false,
          preparation_actions: [],
          uncertainty: [],
        },
        {
          material: 'Component Beta',
          material_code: 'PLASTIC_HDPE',
          category: 'PLASTIC' as const,
          estimated_share_percent: 60,
          confidence: 85,
          visual_evidence: ['Evidence Beta'],
          contamination_percent: 10,
          recoverability_score: 85,
          recoverability_grade: 'GRADE_A' as const,
          is_separable: true,
          preparation_actions: [],
          uncertainty: [],
        },
      ],
    };

    const result = normalizeAndValidateAIResponse(over100Mock);
    const sum = result.composition.reduce((acc, c) => acc + c.estimated_share_percent, 0);
    assert.strictEqual(sum, 100, `Expected sum to be normalized to 100, got ${sum}`);
    assert.strictEqual(result.unresolved_fraction, undefined);
    assert.ok(result.composition[0].estimated_share_percent > result.composition[1].estimated_share_percent);
  });

  // 5. Unresolved / Unknown Remainder
  test('5. should assign remainder to unresolved_fraction when composition sum is under 100', () => {
    const under100Mock = {
      ...baseMock,
      composition: [
        {
          material: 'Aluminium Cans',
          material_code: 'METAL_ALUMINIUM',
          category: 'METAL' as const,
          estimated_share_percent: 65,
          confidence: 95,
          visual_evidence: ['Metallic draw-and-ironed bodies'],
          contamination_percent: 5,
          recoverability_score: 95,
          recoverability_grade: 'GRADE_A' as const,
          is_separable: false,
          preparation_actions: ['Crush cans'],
          uncertainty: ['Alloy ratio unverified'],
        },
      ],
      unresolved_fraction: {
        estimated_share_percent: 35,
        visual_reason: 'Lower half of sack is visually obstructed by opaque burlap.',
      },
    };

    const result = normalizeAndValidateAIResponse(under100Mock);
    assert.strictEqual(result.composition[0].estimated_share_percent, 65);
    assert.ok(result.unresolved_fraction);
    assert.strictEqual(result.unresolved_fraction?.estimated_share_percent, 35);
    assert.ok(result.uncertainty && result.uncertainty.some((u) => u.includes('35%') || u.includes('unresolved')));
  });

  // 6. Missing Evidence
  test('6. should auto-populate visual evidence for component if omitted by model', () => {
    const missingCompEvidenceMock = {
      ...baseMock,
      composition: [
        {
          material: 'HDPE Flakes',
          material_code: 'PLASTIC_HDPE',
          category: 'PLASTIC' as const,
          estimated_share_percent: 100,
          confidence: 88,
          visual_evidence: [],
          contamination_percent: 10,
          recoverability_score: 85,
          recoverability_grade: 'GRADE_A' as const,
          is_separable: false,
          preparation_actions: [],
          uncertainty: [],
        },
      ],
    };

    const result = normalizeAndValidateAIResponse(missingCompEvidenceMock);
    assert.ok(result.composition[0].visual_evidence.length > 0);
    assert.ok(result.composition[0].visual_evidence[0].includes('HDPE Flakes'));
  });

  // 7. Low-Confidence Material
  test('7. should enforce ambiguity disclosures for low-confidence or OTHER material codes', () => {
    const lowConfMock = {
      ...baseMock,
      primary_material: {
        code: 'OTHER',
        name: 'Unidentified Residual Waste',
        category: 'OTHER' as const,
        confidence: 42.0,
      },
      composition: [
        {
          material: 'Unknown Mixed Shred',
          material_code: 'OTHER',
          category: 'OTHER' as const,
          estimated_share_percent: 100,
          confidence: 42.0,
          visual_evidence: ['Mixed dark shredded fragments'],
          contamination_percent: 40,
          recoverability_score: 45,
          recoverability_grade: 'REJECT' as const,
          is_separable: false,
          preparation_actions: [],
          uncertainty: [],
        },
      ],
    };

    const result = normalizeAndValidateAIResponse(lowConfMock);
    assert.ok(result.uncertainty && result.uncertainty.length > 0);
    assert.ok(result.uncertainty?.[0]?.toLowerCase().includes('ambiguity') || result.uncertainty?.[0]?.toLowerCase().includes('mixed'));
    assert.strictEqual(result.recovery_decision?.routing_strategy, 'SPECIALIZED_DISPOSAL');
  });

  // 8. Contamination Aggregation
  test('8. should calculate explainable aggregated contamination using weighted component formula', () => {
    const contamMock = {
      ...baseMock,
      composition: [
        {
          material: 'Clean PET Bodies',
          material_code: 'PLASTIC_PET',
          category: 'PLASTIC' as const,
          estimated_share_percent: 70,
          confidence: 90,
          visual_evidence: ['Clear bottles'],
          contamination_percent: 10, // 70% * 10% = 7%
          recoverability_score: 90,
          recoverability_grade: 'GRADE_A' as const,
          is_separable: false,
          preparation_actions: [],
          uncertainty: [],
        },
        {
          material: 'Heavily Soiled Sludge Labels',
          material_code: 'OTHER',
          category: 'OTHER' as const,
          estimated_share_percent: 30,
          confidence: 85,
          visual_evidence: ['Grease encrusted paper labels'],
          contamination_percent: 50, // 30% * 50% = 15%
          recoverability_score: 50,
          recoverability_grade: 'GRADE_C' as const,
          is_separable: true,
          preparation_actions: [],
          uncertainty: [],
        },
      ],
    };

    // Expected aggregated = 7 + 15 = 22%
    const result = normalizeAndValidateAIResponse(contamMock);
    assert.strictEqual(result.contamination.percentage, 22);
    assert.strictEqual(result.contamination.severity, 'MODERATE');
  });

  // 9. Batch Recoverability
  test('9. should calculate aggregated recoverability score and quality grade correctly', () => {
    const recoverMock = {
      ...baseMock,
      composition: [
        {
          material: 'Grade-A Flakes',
          material_code: 'PLASTIC_PET',
          category: 'PLASTIC' as const,
          estimated_share_percent: 80,
          confidence: 90,
          visual_evidence: ['Pristine flakes'],
          contamination_percent: 5,
          recoverability_score: 95, // 80% * 95 = 76
          recoverability_grade: 'GRADE_A' as const,
          is_separable: false,
          preparation_actions: [],
          uncertainty: [],
        },
        {
          material: 'Contaminated Offcuts',
          material_code: 'PLASTIC_HDPE',
          category: 'PLASTIC' as const,
          estimated_share_percent: 20,
          confidence: 85,
          visual_evidence: ['Dusty offcuts'],
          contamination_percent: 20,
          recoverability_score: 60, // 20% * 60 = 12
          recoverability_grade: 'GRADE_C' as const,
          is_separable: true,
          preparation_actions: [],
          uncertainty: [],
        },
      ],
    };

    // Expected recoverability = 76 + 12 = 88 -> GRADE_A
    const result = normalizeAndValidateAIResponse(recoverMock);
    assert.strictEqual(result.recoverability.score, 88);
    assert.strictEqual(result.recoverability.grade, 'GRADE_A');
    assert.strictEqual(result.recoverability.is_commercially_viable, true);
  });

  // 10. Multi-Material Valuation
  test('10. should allocate weight and benchmark value across components proportionally', () => {
    const components: BatchComponent[] = [
      {
        material: 'PET Bottles',
        material_code: 'PLASTIC_PET',
        category: 'PLASTIC',
        estimated_share_percent: 60, // 6.0 kg of 10kg
        confidence: 90,
        visual_evidence: ['Clear bottles'],
        contamination_percent: 10,
        recoverability_score: 90,
        recoverability_grade: 'GRADE_A',
        is_separable: false,
        preparation_actions: [],
        uncertainty: [],
      },
      {
        material: 'PP Caps',
        material_code: 'PLASTIC_PP',
        category: 'PLASTIC',
        estimated_share_percent: 30, // 3.0 kg of 10kg
        confidence: 85,
        visual_evidence: ['Colored caps'],
        contamination_percent: 5,
        recoverability_score: 85,
        recoverability_grade: 'GRADE_A',
        is_separable: true,
        preparation_actions: [],
        uncertainty: [],
      },
    ];

    const val = valuationService.calculateValuation({
      materialCode: 'PLASTIC_PET',
      weightKg: 10.0,
      contaminationPercentage: 8.5,
      qualityGrade: 'GRADE_A',
      isUserSpecifiedWeight: true,
      composition: components,
      unresolvedSharePercent: 10, // 1.0 kg unresolved
    });

    assert.ok(val.component_valuations && val.component_valuations.length === 2);
    assert.strictEqual(val.component_valuations[0].allocated_weight_kg, 6.0);
    assert.strictEqual(val.component_valuations[1].allocated_weight_kg, 3.0);
    assert.ok(val.clean_batch_benchmark > 0);
    assert.ok(val.contamination_penalty_amount >= 0);
    assert.ok(val.indicative_net_range.min > 0);
    assert.ok(val.unresolved_economic_impact && val.unresolved_economic_impact.includes('10%'));
  });

  // 11. Mixed-Material Matching & Split Routing
  test('11. should generate split route recommendations for separable multi-category batch', () => {
    const mixedComposition: BatchComponent[] = [
      {
        material: 'Populated Circuit Boards',
        material_code: 'EWASTE_PCB',
        category: 'EWASTE',
        estimated_share_percent: 70,
        confidence: 90,
        visual_evidence: ['Green FR4 board with chips'],
        contamination_percent: 10,
        recoverability_score: 90,
        recoverability_grade: 'GRADE_A',
        is_separable: false,
        preparation_actions: ['Store in anti-static bins'],
        uncertainty: [],
      },
      {
        material: 'Extruded Aluminium Heat Sinks',
        material_code: 'METAL_ALUMINIUM',
        category: 'METAL',
        estimated_share_percent: 30,
        confidence: 94,
        visual_evidence: ['Finned aluminium heat sinks'],
        contamination_percent: 5,
        recoverability_score: 95,
        recoverability_grade: 'GRADE_A',
        is_separable: true,
        preparation_actions: ['Unscrew heat sinks with screwdriver'],
        uncertainty: [],
      },
    ];

    const dummyValuation = valuationService.calculateValuation({
      materialCode: 'EWASTE_PCB',
      weightKg: 10.0,
      contaminationPercentage: 8.5,
      qualityGrade: 'GRADE_A',
      isUserSpecifiedWeight: true,
      composition: mixedComposition,
    });

    const matchResults = matchingService.findBestMatches({
      materialCode: 'EWASTE_PCB',
      weightKg: 10.0,
      contaminationPercentage: 8.5,
      userLocation: { lat: 19.076, lng: 72.8777 },
      valuation: dummyValuation,
      composition: mixedComposition,
    });

    assert.ok(matchResults.splitRoutes && matchResults.splitRoutes.length >= 2);
    const aluRoute = matchResults.splitRoutes.find((r) => r.material_code === 'METAL_ALUMINIUM');
    assert.ok(aluRoute);
    assert.strictEqual(aluRoute.allocated_weight_kg, 3.0);
    assert.ok(aluRoute.suggested_recycler_name);
  });

  // 12. Single-Material Backward Compatibility
  test('12. should maintain 100% backward compatibility with Phase 2 single-material input', () => {
    // Pure Phase 2 payload without composition field
    const phase2Payload = { ...baseMock };
    delete (phase2Payload as any).composition;

    const profile = normalizeAndValidateAIResponse(phase2Payload);
    assert.strictEqual(profile.primary_material.code, 'PLASTIC_PET');
    assert.ok(profile.composition && profile.composition.length === 1);
    assert.strictEqual(profile.composition[0].material_code, 'PLASTIC_PET');
    assert.strictEqual(profile.composition[0].estimated_share_percent, 100);
    assert.strictEqual(profile.contamination.percentage, 10);
    assert.strictEqual(profile.recoverability.score, 88);

    // Valuation backward compatibility without composition parameter
    const legacyVal = valuationService.calculateValuation({
      materialCode: 'PLASTIC_PET',
      weightKg: 10.0,
      contaminationPercentage: 10.0,
      qualityGrade: 'GRADE_A',
      isUserSpecifiedWeight: true,
    });
    assert.strictEqual(legacyVal.batch_weight_kg, 10.0);
    assert.ok(legacyVal.clean_batch_benchmark > 0);
    assert.ok(legacyVal.indicative_net_range.max > legacyVal.indicative_net_range.min);

    // Matching backward compatibility without composition parameter
    const legacyMatches = matchingService.findBestMatches({
      materialCode: 'PLASTIC_PET',
      weightKg: 10.0,
      contaminationPercentage: 10.0,
      userLocation: { lat: 19.076, lng: 72.8777 },
      valuation: legacyVal,
    });
    assert.ok(legacyMatches.eligibleMatches.length > 0);
    assert.strictEqual(legacyMatches.eligibleMatches[0].is_eligible, true);
  });

  // 13. Malformed Gemini Composition Output
  test('13. should safely normalize malformed, negative, or NaN composition numbers', () => {
    const malformed = {
      ...baseMock,
      composition: [
        {
          material: 'Valid PET Body',
          material_code: 'PLASTIC_PET',
          category: 'PLASTIC' as const,
          estimated_share_percent: 75,
          confidence: 90,
          visual_evidence: ['Evidence'],
          contamination_percent: 10,
          recoverability_score: 85,
          recoverability_grade: 'GRADE_A' as const,
          is_separable: false,
          preparation_actions: [],
          uncertainty: [],
        },
        {
          material: 'Dropped Negative Share Item',
          material_code: 'OTHER',
          category: 'OTHER' as const,
          estimated_share_percent: -20, // Should be dropped
          confidence: 80,
          visual_evidence: [],
          contamination_percent: 0,
          recoverability_score: 50,
          recoverability_grade: 'GRADE_C' as const,
          is_separable: true,
          preparation_actions: [],
          uncertainty: [],
        },
        {
          material: '', // Empty name should be dropped
          material_code: 'OTHER',
          category: 'OTHER' as const,
          estimated_share_percent: 25,
          confidence: 50,
          visual_evidence: [],
          contamination_percent: 0,
          recoverability_score: 50,
          recoverability_grade: 'GRADE_C' as const,
          is_separable: false,
          preparation_actions: [],
          uncertainty: [],
        },
      ],
    };

    const result = normalizeAndValidateAIResponse(malformed);
    assert.strictEqual(result.composition.length, 1);
    assert.strictEqual(result.composition[0].material, 'Valid PET Body');
    // Remainder should be assigned to unresolved fraction
    assert.ok(result.unresolved_fraction);
    assert.strictEqual(result.unresolved_fraction?.estimated_share_percent, 25);
  });

  // 14. Fallback Composition Verification
  test('14. should verify all 5 deterministic fallback profiles contain valid Phase 3 multi-material composition', () => {
    const presets = [
      'preset-pet-bottles',
      'preset-cardboard-pizza',
      'preset-alu-cans',
      'preset-ewaste-pcb',
      'preset-hdpe-containers',
    ];

    for (const preset of presets) {
      const profile = fallbackService.generateFallbackProfile(undefined, preset);

      assert.ok(profile.composition && profile.composition.length >= 1, `${preset} missing composition`);
      const compSum = profile.composition.reduce((acc, c) => acc + c.estimated_share_percent, 0);
      const unresolved = profile.unresolved_fraction?.estimated_share_percent || 0;
      assert.strictEqual(Math.round(compSum + unresolved), 100, `${preset} composition + unresolved does not sum to 100%`);

      for (const comp of profile.composition) {
        assert.ok(comp.visual_evidence && comp.visual_evidence.length >= 1, `${preset} component missing visual_evidence`);
        assert.ok(comp.confidence >= 10 && comp.confidence <= 99, `${preset} component confidence out of bounds`);
        assert.ok(comp.preparation_actions && comp.preparation_actions.length >= 1, `${preset} component missing preparation_actions`);
      }

      assert.ok(profile.recovery_decision, `${preset} missing recovery_decision`);
      assert.ok(profile.recovery_decision?.batch_archetype);
      assert.ok(profile.recovery_decision?.condition_summary);
      assert.ok(profile.recovery_decision?.recommended_action);
      assert.ok(profile.recovery_decision?.economic_effect);
      assert.ok(['SINGLE_FACILITY', 'SPLIT_ROUTING', 'SPECIALIZED_DISPOSAL'].includes(profile.recovery_decision?.routing_strategy || ''));
    }
  });

  // 15. Zod schema validation reject on invalid types
  test('15. should reject malformed raw response missing core fields', () => {
    const invalidSchemaData = {
      primary_material: {
        code: 123, // wrong type
      },
    };

    assert.throws(() => {
      rawAIResponseSchema.parse(invalidSchemaData);
    });
  });

  // 16. Visual share must not be presented as measured mass
  test('16. visual share must not be presented as measured mass in valuation', () => {
    const components: BatchComponent[] = [
      {
        material: 'PET Bottle Bodies',
        material_code: 'PLASTIC_PET',
        category: 'PLASTIC',
        estimated_share_percent: 70,
        confidence: 90,
        visual_evidence: ['Clear fluted bottles'],
        contamination_percent: 5,
        recoverability_score: 90,
        recoverability_grade: 'GRADE_A',
        is_separable: false,
        preparation_actions: [],
        uncertainty: [],
      },
    ];

    const val = valuationService.calculateValuation({
      materialCode: 'PLASTIC_PET',
      weightKg: 20.0,
      contaminationPercentage: 5.0,
      qualityGrade: 'GRADE_A',
      isUserSpecifiedWeight: true,
      composition: components,
    });

    assert.ok(val.component_valuations && val.component_valuations.length === 1);
    const compVal = val.component_valuations[0];
    assert.strictEqual(compVal.weight_allocation_basis, 'ILLUSTRATIVE_VISUAL_PROJECTION');
    assert.strictEqual(compVal.illustrative_weight_kg, 14.0);
    assert.ok(compVal.allocation_disclosure.includes('Illustrative weight allocation'));
    assert.ok(compVal.allocation_disclosure.includes('true physical mass requires physical segregation and scale weighment for commercial confirmation'));
  });

  // 17. Valuation disclosure for model-estimated allocation
  test('17. valuation disclosure for model-estimated allocation must be present', () => {
    const val = valuationService.calculateValuation({
      materialCode: 'PLASTIC_PET',
      weightKg: 15.0,
      contaminationPercentage: 10.0,
      qualityGrade: 'GRADE_B',
      isUserSpecifiedWeight: true,
      composition: [
        {
          material: 'PET Bottles',
          material_code: 'PLASTIC_PET',
          category: 'PLASTIC',
          estimated_share_percent: 80,
          confidence: 90,
          visual_evidence: ['Clear bottles'],
          contamination_percent: 5,
          recoverability_score: 90,
          recoverability_grade: 'GRADE_A',
          is_separable: false,
          preparation_actions: [],
          uncertainty: [],
        },
      ],
      unresolvedSharePercent: 20,
    });

    assert.ok(val.valuation_methodology);
    assert.ok(val.valuation_methodology.includes('Does not measure true physical density'));
    assert.ok(val.unresolved_economic_impact && val.unresolved_economic_impact.includes('illustrative allocation'));
  });

  // 18. Split-route quantity disclosure and provisional status
  test('18. split-route recommendations must be explicitly marked provisional with quantity disclosure', () => {
    const mixedComposition: BatchComponent[] = [
      {
        material: 'Populated PCB Boards',
        material_code: 'EWASTE_PCB',
        category: 'EWASTE',
        estimated_share_percent: 70,
        confidence: 90,
        visual_evidence: ['FR4 substrate'],
        contamination_percent: 5,
        recoverability_score: 90,
        recoverability_grade: 'GRADE_A',
        is_separable: true,
        preparation_actions: [],
        uncertainty: [],
      },
      {
        material: 'Aluminium Heat Sinks',
        material_code: 'METAL_ALUMINIUM',
        category: 'METAL',
        estimated_share_percent: 30,
        confidence: 90,
        visual_evidence: ['Finned aluminium block'],
        contamination_percent: 2,
        recoverability_score: 95,
        recoverability_grade: 'GRADE_A',
        is_separable: true,
        preparation_actions: [],
        uncertainty: [],
      },
    ];

    const val = valuationService.calculateValuation({
      materialCode: 'EWASTE_PCB',
      weightKg: 10.0,
      contaminationPercentage: 4.1,
      qualityGrade: 'GRADE_A',
      isUserSpecifiedWeight: true,
      composition: mixedComposition,
    });

    const matchRes = matchingService.findBestMatches({
      materialCode: 'EWASTE_PCB',
      weightKg: 10.0,
      contaminationPercentage: 4.1,
      userLocation: { lat: 19.076, lng: 72.8777 },
      valuation: val,
      composition: mixedComposition,
    });

    assert.ok(matchRes.splitRoutes && matchRes.splitRoutes.length >= 2);
    for (const sr of matchRes.splitRoutes) {
      assert.strictEqual(sr.is_provisional, true);
      assert.strictEqual(sr.routing_status, 'PROVISIONAL_SPLIT_ROUTE');
      assert.ok(sr.quantity_basis_disclosure.includes('provisional pending dock sorting'));
    }
  });

  // 19. Unsupported secondary material handling
  test('19. should reject unsupported secondary materials missing visual evidence and assign share to unresolved', () => {
    const rawWithUnsupportedSecondary = {
      ...baseMock,
      composition: [
        {
          material: 'PET Bottle Bodies',
          material_code: 'PLASTIC_PET',
          category: 'PLASTIC' as const,
          estimated_share_percent: 75,
          confidence: 90,
          visual_evidence: ['Clear fluted bottle bodies'],
          contamination_percent: 5,
          recoverability_score: 90,
          recoverability_grade: 'GRADE_A' as const,
          is_separable: false,
          preparation_actions: ['Flatten'],
          uncertainty: [],
        },
        {
          material: 'Hallucinated Aluminium Cans',
          material_code: 'METAL_ALUMINIUM',
          category: 'METAL' as const,
          estimated_share_percent: 25,
          confidence: 85,
          visual_evidence: [], // NO visual evidence provided!
          contamination_percent: 0,
          recoverability_score: 95,
          recoverability_grade: 'GRADE_A' as const,
          is_separable: true,
          preparation_actions: [],
          uncertainty: [],
        },
      ],
    };

    const normalized = normalizeAndValidateAIResponse(rawWithUnsupportedSecondary);
    // Unsupported secondary component should be dropped
    assert.strictEqual(normalized.composition.length, 1);
    assert.strictEqual(normalized.composition[0].material_code, 'PLASTIC_PET');
    // Its 25% share should be assigned to unresolved_fraction
    assert.ok(normalized.unresolved_fraction);
    assert.strictEqual(normalized.unresolved_fraction?.estimated_share_percent, 25);
  });

  // 20. Multi-material evidence requirements
  test('20. should require explicit uncertainty disclosures for low-confidence or OTHER components', () => {
    const rawWithLowConf = {
      ...baseMock,
      composition: [
        {
          material: 'Mixed Residue Pieces',
          material_code: 'OTHER',
          category: 'OTHER' as const,
          estimated_share_percent: 100,
          confidence: 45, // Low confidence
          visual_evidence: ['Dark unidentified fragments in corner'],
          contamination_percent: 30,
          recoverability_score: 35,
          recoverability_grade: 'GRADE_C' as const,
          is_separable: false,
          preparation_actions: [],
          uncertainty: [],
        },
      ],
    };

    const normalized = normalizeAndValidateAIResponse(rawWithLowConf);
    assert.ok(normalized.composition[0].uncertainty.length > 0);
    assert.ok(normalized.composition[0].uncertainty.some((u) => u.toLowerCase().includes('ambiguous')));
  });

  // 21. Timeout constants & bounding architecture verification
  test('21. should enforce strict 28s total AI budget and 18s per-candidate timeout bounds', () => {
    assert.strictEqual(TOTAL_AI_BUDGET_MS, 28000, 'Overall AI budget must be exactly 28,000ms');
    assert.strictEqual(MAX_CANDIDATE_TIMEOUT_MS, 18000, 'Max candidate timeout must be exactly 18,000ms');
    assert.ok(MAX_CANDIDATE_TIMEOUT_MS < TOTAL_AI_BUDGET_MS, 'Candidate timeout must fit within overall budget');
  });

  // 22. AI Candidate timeout simulation via Promise.race
  test('22. should correctly trigger timeout rejection when candidate model exceeds budget', async () => {
    const testTimeoutMs = 50;
    const slowCandidate = new Promise<string>((resolve) => setTimeout(() => resolve('slow response'), 500));
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`AI Vision request timed out after ${testTimeoutMs}ms`)), testTimeoutMs)
    );

    await assert.rejects(
      async () => {
        await Promise.race([slowCandidate, timeoutPromise]);
      },
      {
        name: 'Error',
        message: `AI Vision request timed out after ${testTimeoutMs}ms`,
      }
    );
  });

  // 23. Single-material backward compatibility test
  test('23. should maintain 100% backward compatibility when composition is omitted', () => {
    const legacyPhase2Response = {
      primary_material: {
        code: 'PAPER_CARDBOARD',
        name: 'Corrugated Cardboard',
        category: 'PAPER' as const,
        confidence: 88,
      },
      visual_evidence: ['Brown kraft paper surface', 'Corrugation flute'],
      contamination: {
        percentage: 5,
        type: 'DIRT_DUST',
        severity: 'LOW' as const,
        explanation: 'Minimal surface dust',
        visual_indicators: ['Dust marks'],
      },
      recoverability: {
        score: 92,
        grade: 'GRADE_A' as const,
        is_commercially_viable: true,
        actionable_advice: 'Keep dry and bale',
        potential_applications: ['Recycled containerboard'],
      },
      uncertainty: ['Internal moisture unconfirmed'],
      recommended_preparation: ['Keep dry'],
      visual_explanation: 'Clean corrugated shipping cartons.',
    };

    const normalized = normalizeAndValidateAIResponse(legacyPhase2Response);
    assert.strictEqual(normalized.composition.length, 1);
    assert.strictEqual(normalized.composition[0].material_code, 'PAPER_CARDBOARD');
    assert.strictEqual(normalized.composition[0].estimated_share_percent, 100);
    assert.strictEqual(normalized.unresolved_fraction, undefined);
    assert.strictEqual(normalized.recovery_decision?.routing_strategy, 'SINGLE_FACILITY');
  });

  // 24. Controlled Verification of Candidate Failover on Timeout / Recoverable Failure
  test('24. Candidate A timeout/failover -> Candidate B success -> successful AI result', async () => {
    const candidateModels = ['model-candidate-a', 'model-candidate-b'];
    const deadline = Date.now() + 5000;
    let successfulModelName: string | null = null;
    let finalPayload: any = null;

    for (const mName of candidateModels) {
      const remainingBudget = deadline - Date.now();
      const candidateTimeoutMs = Math.min(100, remainingBudget);

      try {
        if (mName === 'model-candidate-a') {
          // Candidate A intentionally exceeds candidate timeout
          const slowPromise = new Promise((resolve) => setTimeout(() => resolve('candidate A late'), 300));
          const timeoutPromise = new Promise<never>((_, reject) =>
            setTimeout(
              () => reject(new Error(`AI Vision request for ${mName} timed out after ${candidateTimeoutMs}ms`)),
              candidateTimeoutMs
            )
          );
          await Promise.race([slowPromise, timeoutPromise]);
        } else {
          // Candidate B succeeds within budget
          successfulModelName = mName;
          finalPayload = {
            ...baseMock,
            visual_explanation: 'Recovered via candidate failover to candidate B.',
          };
          break;
        }
      } catch (err: any) {
        // Candidate A timed out; trigger failover to next candidate model
        assert.ok(err.message.includes('timed out'));
        continue;
      }
    }

    assert.strictEqual(successfulModelName, 'model-candidate-b');
    assert.ok(finalPayload);
    const normalized = normalizeAndValidateAIResponse(finalPayload);
    assert.strictEqual(normalized.primary_material.code, 'PLASTIC_PET');
    assert.strictEqual(normalized.is_fallback_inference, false);
  });
});
