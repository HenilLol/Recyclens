import { test, describe } from 'node:test';
import assert from 'node:assert';
import { dispatchService } from '../services/dispatch.service.ts';
import { passportService } from '../services/passport.service.ts';
import {
  BatchRecoveryPassport,
  CreatePassportInput,
  OptimizationScenario,
  RecoveryProfile,
} from '../../src/types/recyclens.types.ts';

function createMockRecoveryProfile(overrides: Partial<RecoveryProfile> = {}): RecoveryProfile {
  return {
    id: 'rec-profile-dsp',
    scan_id: 'scan-dsp-101',
    primary_material: {
      code: 'PLASTIC_PET',
      name: 'Polyethylene Terephthalate Bottles',
      category: 'PLASTIC',
      confidence: 94.0,
      polymer_subtype: 'PET #1',
    },
    secondary_materials: [],
    composition: [
      {
        material: 'Clear PET Bottles',
        material_code: 'PLASTIC_PET',
        category: 'PLASTIC',
        estimated_share_percent: 80.0,
        confidence: 94.0,
        visual_evidence: ['Transparent ribbed bottle bodies'],
        contamination_percent: 8.0,
        recoverability_score: 92.0,
        recoverability_grade: 'GRADE_A',
        is_separable: false,
        preparation_actions: ['Drain liquid residue'],
        uncertainty: [],
      },
      {
        material: 'PP Closures',
        material_code: 'PLASTIC_PP',
        category: 'PLASTIC',
        estimated_share_percent: 20.0,
        confidence: 90.0,
        visual_evidence: ['Opaque colored caps'],
        contamination_percent: 4.0,
        recoverability_score: 86.0,
        recoverability_grade: 'GRADE_A',
        is_separable: true,
        preparation_actions: ['Unscrew caps'],
        uncertainty: [],
      },
    ],
    contamination: {
      percentage: 8.0,
      type: 'BEVERAGE_DROPLETS',
      severity: 'LOW',
      explanation: 'Minor sweet beverage droplets visible.',
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
    ...overrides,
  };
}

function createMockScenario(overrides: Partial<OptimizationScenario> = {}): OptimizationScenario {
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
        rationale: 'Reduces moisture and biological penalty',
        scenario_assumption: 'Assumes complete liquid egress',
        modeled_effect: 'Reduces contamination by 60%',
        uncertainty: 'Hidden viscous residue may remain',
        affected_material_codes: ['PLASTIC_PET'],
      },
      {
        action_id: 'action-decap',
        title: 'Manual Cap Removal',
        observed_basis: 'PP caps attached to bottle necks',
        rationale: 'Segregates polymer streams for pure flake',
        scenario_assumption: 'Operator removes 100% of caps',
        modeled_effect: 'Upgrades batch to Grade-A premium',
        uncertainty: 'Requires manual labor',
        affected_material_codes: ['PLASTIC_PP'],
      },
    ],
    affected_material_codes: ['PLASTIC_PET', 'PLASTIC_PP'],
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
      contamination_percentage: 8.0,
      recoverability_score: 90.0,
      recoverability_grade: 'GRADE_A',
      indicative_net_range: { min: 350, max: 420 },
      weight_kg: 10.0,
      weight_basis: 'ILLUSTRATIVE_VISUAL_PROJECTION',
    },
    modeled_state: {
      data_origin: 'SCENARIO_PROJECTED',
      projected_contamination_percentage: 3.2,
      projected_recoverability_score: 95.0,
      projected_recoverability_grade: 'GRADE_A',
      projected_clean_benchmark: 450,
      projected_contamination_penalty: 25,
      projected_indicative_net_range: { min: 410, max: 470 },
    },
    assumptions: ['Illustrative model assumption: 60% contamination reduction.'],
    uncertainties: ['Does not guarantee reprocessor acceptance.'],
    evidence_basis: ['Visible droplets on bottle interior.'],
    economic_effect: 'Projected net uplift of ~₹50.',
    routing_effect: {
      strategy: 'SINGLE_FACILITY_PREFERRED',
      rationale: 'Enhanced clean stream qualifies for Tier 1 PET reprocessor.',
    },
    is_scenario_projection: true,
    is_fallback_demo: false,
    ...overrides,
  };
}

function createMockPassport(scenario?: OptimizationScenario): BatchRecoveryPassport {
  const input: CreatePassportInput = {
    scan_id: 'scan-dsp-101',
    recovery_profile: createMockRecoveryProfile(),
    weight_kg: 20.0,
    weight_provenance: 'ILLUSTRATIVE_VISUAL_PROJECTION',
    selected_scenario: scenario || createMockScenario(),
    selected_route: {
      routing_status: 'RECOMMENDED',
      selected_facility_id: 'facility-mumbai-pet',
      selected_facility_name: 'Apex Polymer Recyclers',
      route_type: 'SINGLE_FACILITY',
      routing_rationale: 'Primary regional PET reprocessor offering premium flake rate.',
      preparation_requirements: ['Manual de-capping', 'Drain liquid'],
      indicative_payout_range: { min: 410, max: 470 },
    },
  };
  return passportService.createPassport(input);
}

describe('Phase 5.2 Recovery Dispatch Manifest Tests', () => {
  // 1. Valid dispatch manifest generation
  test('1. should generate valid Recovery Dispatch Manifest from integrity-verified passport', () => {
    const passport = createMockPassport();
    const manifest = dispatchService.createDispatchManifest({ passport });

    assert.ok(manifest);
    assert.ok(manifest.manifest_id);
    assert.strictEqual(manifest.passport_id, passport.passport_id);
    assert.strictEqual(manifest.scan_id, passport.scan_id);
    assert.strictEqual(manifest.selected_scenario_id, 'scenario-rec-prep');
    assert.strictEqual(manifest.target_facility.facility_name, 'Apex Polymer Recyclers');
    assert.strictEqual(manifest.batch_weight_kg, 20.0);
    assert.strictEqual(manifest.weight_provenance, 'ILLUSTRATIVE_VISUAL_PROJECTION');
    assert.ok(manifest.dispatch_disclosure);
  });

  // 2. CSPRNG manifest ID format DSP-YYYY-<16 HEX>
  test('2. should enforce unique CSPRNG manifest ID format DSP-YYYY-<16 HEX CHARS>', () => {
    const passport = createMockPassport();
    const manifest = dispatchService.createDispatchManifest({ passport });

    const regex = /^DSP-\d{4}-[A-F0-9]{16}$/;
    assert.match(manifest.manifest_id, regex);
    const currentYear = new Date().getUTCFullYear().toString();
    assert.ok(manifest.manifest_id.startsWith(`DSP-${currentYear}-`));
  });

  // 3. Scenario preservation & modeled expectations
  test('3. should preserve selected scenario and accurately reflect its modeled expectations', () => {
    const scenario = createMockScenario({
      scenario_type: 'MAXIMUM_SEPARATION',
      title: 'Full Stream Separation',
      modeled_state: {
        data_origin: 'SCENARIO_PROJECTED',
        projected_contamination_percentage: 1.5,
        projected_recoverability_score: 97.2,
        projected_recoverability_grade: 'GRADE_A',
        projected_clean_benchmark: 500,
        projected_contamination_penalty: 20,
        projected_indicative_net_range: { min: 460, max: 520 },
      },
    });

    const passport = createMockPassport(scenario);
    const manifest = dispatchService.createDispatchManifest({ passport });

    assert.strictEqual(manifest.selected_scenario_type, 'MAXIMUM_SEPARATION');
    assert.strictEqual(manifest.scenario_title, 'Full Stream Separation');
    assert.strictEqual(manifest.modeled_expectations.projected_contamination_percent, 1.5);
    assert.strictEqual(manifest.modeled_expectations.projected_recoverability_grade, 'GRADE_A');
    assert.strictEqual(manifest.modeled_expectations.projected_indicative_net_range.min, 460);
    assert.strictEqual(manifest.modeled_expectations.projected_indicative_net_range.max, 520);
  });

  // 4. Baseline scenario handling when no optimization scenario selected
  test('4. should handle baseline unmodeled scenario correctly in dispatch manifest', () => {
    const input: CreatePassportInput = {
      scan_id: 'scan-dsp-baseline',
      recovery_profile: createMockRecoveryProfile(),
      weight_kg: 15.0,
      weight_provenance: 'ILLUSTRATIVE_VISUAL_PROJECTION',
    };
    const baselinePassport = passportService.createPassport(input);
    const manifest = dispatchService.createDispatchManifest({ passport: baselinePassport });

    assert.strictEqual(manifest.selected_scenario_id, 'SCENARIO_NONE');
    assert.strictEqual(manifest.selected_scenario_type, 'NONE');
    assert.strictEqual(manifest.scenario_title, 'As-Is Unprepared Baseline');
    assert.strictEqual(manifest.modeled_expectations.projected_contamination_percent, 8.0);
  });

  // 5. Material breakdown calculations in kg
  test('5. should accurately compute stream-by-stream weight breakdown in kg', () => {
    const passport = createMockPassport(); // 20.0 kg total (80% PET, 20% PP)
    const manifest = dispatchService.createDispatchManifest({ passport });

    assert.strictEqual(manifest.material_breakdown.length, 2);
    // 80% of 20 kg = 16.0 kg
    assert.strictEqual(manifest.material_breakdown[0].material_code, 'PLASTIC_PET');
    assert.strictEqual(manifest.material_breakdown[0].estimated_share_percent, 80.0);
    assert.strictEqual(manifest.material_breakdown[0].estimated_weight_kg, 16.0);

    // 20% of 20 kg = 4.0 kg
    assert.strictEqual(manifest.material_breakdown[1].material_code, 'PLASTIC_PP');
    assert.strictEqual(manifest.material_breakdown[1].estimated_share_percent, 20.0);
    assert.strictEqual(manifest.material_breakdown[1].estimated_weight_kg, 4.0);
  });

  // 6. Preparation checklist extraction from scenario actions
  test('6. should populate operational preparation checklist from scenario actions', () => {
    const passport = createMockPassport();
    const manifest = dispatchService.createDispatchManifest({ passport });

    assert.strictEqual(manifest.preparation_checklist.length, 2);
    assert.strictEqual(manifest.preparation_checklist[0].action_id, 'action-drain');
    assert.strictEqual(manifest.preparation_checklist[0].title, 'Drain Residual Liquid');
    assert.strictEqual(manifest.preparation_checklist[0].required, true);
    assert.strictEqual(manifest.preparation_checklist[0].completed, false);
    assert.strictEqual(manifest.preparation_checklist[1].action_id, 'action-decap');
  });

  // 7. Material-specific handling precautions
  test('7. should generate material-specific handling precautions for paper, e-waste, and plastics', () => {
    // E-waste
    const ewastePrecautions = dispatchService.getHandlingPrecautions('EWASTE', 'EWASTE_PCB', 'DUST');
    assert.ok(ewastePrecautions.some((p) => p.includes('anti-static ESD')));

    // Paper / Cardboard
    const paperPrecautions = dispatchService.getHandlingPrecautions('PAPER', 'PAPER_CARDBOARD', 'OIL');
    assert.ok(paperPrecautions.some((p) => p.includes('strictly prevent water ingress')));

    // Plastic PET
    const plasticPrecautions = dispatchService.getHandlingPrecautions('PLASTIC', 'PLASTIC_PET', 'BEVERAGE_DROPLETS');
    assert.ok(plasticPrecautions.some((p) => p.includes('liquid containers are completely drained')));
  });

  // 8. Rejection of tampered passport
  test('8. should reject dispatch manifest generation when passport integrity is tampered', () => {
    const passport = createMockPassport();

    // Tamper with contamination in evidence snapshot
    passport.evidence_snapshot.contamination.percentage = 99.0;

    assert.throws(
      () => {
        dispatchService.createDispatchManifest({ passport });
      },
      (err: any) => err.message.includes('integrity verification failed')
    );
  });

  // 9. Override facility name and handling notes
  test('9. should allow overriding target facility and appending custom handling notes', () => {
    const passport = createMockPassport();
    const manifest = dispatchService.createDispatchManifest({
      passport,
      override_facility_name: 'Metro MRF Processing Yard 3',
      override_facility_id: 'facility-metro-03',
      handling_notes: ['Dedicated bay #4 reserved for rapid unload.'],
    });

    assert.strictEqual(manifest.target_facility.facility_name, 'Metro MRF Processing Yard 3');
    assert.strictEqual(manifest.target_facility.facility_id, 'facility-metro-03');
    assert.ok(manifest.handling_precautions.some((p) => p.includes('Dedicated bay #4')));
  });

  // 10. Disclosure checks (no unsupported claims)
  test('10. should ensure manifest disclosure disavows legal custody and settlement guarantees', () => {
    const passport = createMockPassport();
    const manifest = dispatchService.createDispatchManifest({ passport });

    assert.ok(manifest.dispatch_disclosure.includes('operational preparation record'));
    assert.ok(manifest.dispatch_disclosure.includes('does not constitute certified weighbridge documentation'));
    assert.ok(manifest.dispatch_disclosure.includes('physical custody transfer'));
  });

  // 11. ID uniqueness across 500 samples
  test('11. should generate unique manifest IDs across 500 sample generations', () => {
    const passport = createMockPassport();
    const idSet = new Set<string>();
    const count = 500;

    for (let i = 0; i < count; i++) {
      const manifest = dispatchService.createDispatchManifest({ passport });
      assert.ok(!idSet.has(manifest.manifest_id), `Duplicate ID: ${manifest.manifest_id}`);
      idSet.add(manifest.manifest_id);
    }

    assert.strictEqual(idSet.size, count);
  });
});
