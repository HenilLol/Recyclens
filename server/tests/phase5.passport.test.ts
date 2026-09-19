import { test, describe } from 'node:test';
import assert from 'node:assert';
import {
  passportService,
  canonicalize,
  PASSPORT_HASHED_FIELDS,
  CANONICAL_MATERIAL_CODES,
} from '../services/passport.service.ts';
import {
  CreatePassportInput,
  OptimizationScenario,
  RecoveryProfile,
} from '../../src/types/recyclens.types.ts';

// ==================================================
// MOCK DATA FACTORIES
// ==================================================

function createMockRecoveryProfile(overrides: Partial<RecoveryProfile> = {}): RecoveryProfile {
  return {
    id: 'rec-profile-001',
    scan_id: 'scan-test-777',
    primary_material: {
      code: 'PLASTIC_PET',
      name: 'Polyethylene Terephthalate',
      category: 'PLASTIC',
      confidence: 94.0,
      polymer_subtype: 'PET (Type 1)',
    },
    secondary_materials: [],
    composition: [
      {
        material: 'PET Clear Bottles',
        material_code: 'PLASTIC_PET',
        category: 'PLASTIC',
        estimated_share_percent: 85.0,
        confidence: 94.0,
        visual_evidence: ['Transparent ribbed bottle bodies'],
        contamination_percent: 10.0,
        recoverability_score: 90.0,
        recoverability_grade: 'GRADE_A',
        is_separable: true,
        preparation_actions: ['Empty residual liquid'],
        uncertainty: [],
      },
      {
        material: 'PP Closures',
        material_code: 'PLASTIC_PP',
        category: 'PLASTIC',
        estimated_share_percent: 15.0,
        confidence: 88.0,
        visual_evidence: ['Opaque colored bottle caps'],
        contamination_percent: 5.0,
        recoverability_score: 85.0,
        recoverability_grade: 'GRADE_B',
        is_separable: true,
        preparation_actions: ['Manual cap removal'],
        uncertainty: ['Polymer type unverified without density test'],
      },
    ],
    contamination: {
      percentage: 10.0,
      type: 'Liquid Residue',
      severity: 'LOW',
      explanation: 'Minor sweet beverage droplets visible on inner walls.',
      visual_indicators: ['Droplets adhering to interior surface'],
    },
    recoverability: {
      score: 88.0,
      grade: 'GRADE_A',
      is_commercially_viable: true,
      actionable_advice: 'Rinse and de-cap to maximize premium flake yield.',
      potential_applications: ['Food-grade rPET pellets', 'Polyester staple fiber'],
    },
    visual_explanation: 'Batch predominantly composed of clean post-consumer beverage bottles.',
    visual_evidence: ['Transparent ribbed bottle bodies', 'Opaque colored bottle caps'],
    contamination_evidence: ['Liquid droplets visible in bottles'],
    uncertainty: ['Closure polymer requires density verification'],
    recommended_preparation: ['Manual de-capping', 'Residual liquid draining'],
    recovery_decision: {
      batch_archetype: 'Mixed Post-Consumer Beverage Bottles',
      condition_summary: 'Lightly soiled with non-hazardous sweet beverage residue',
      recommended_action: 'Perform rapid closure segregation and drainage',
      economic_effect: 'Yields high-purity clear PET flake stream',
      routing_strategy: 'SINGLE_FACILITY',
      routing_rationale: 'Primary volume justifies dedicated regional PET reprocessor.',
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
        observed_basis: 'Liquid residue in bottles',
        rationale: 'Reduces moisture and biological penalty',
        scenario_assumption: 'Assumes complete liquid egress',
        modeled_effect: 'Reduces contamination by 65%',
        uncertainty: 'Hidden viscous residue may remain',
        affected_material_codes: ['PLASTIC_PET'],
      },
    ],
    affected_material_codes: ['PLASTIC_PET', 'PLASTIC_PP'],
    modeling_coefficients: {
      contamination_reduction_coefficient: 0.65,
      recoverability_headroom_coefficient: 0.55,
      coefficient_basis: 'ILLUSTRATIVE_SCENARIO_ASSUMPTION',
      contamination_floor: 2.0,
      recoverability_ceiling: 98.0,
      action_suppression_heuristic: 5.0,
    },
    current_state_reference: {
      data_origin: 'MODEL_ESTIMATED',
      contamination_percentage: 10.0,
      recoverability_score: 88.0,
      recoverability_grade: 'GRADE_A',
      indicative_net_range: { min: 400, max: 480 },
      weight_kg: 15.0,
      weight_basis: 'ILLUSTRATIVE_VISUAL_PROJECTION',
    },
    modeled_state: {
      data_origin: 'SCENARIO_PROJECTED',
      projected_contamination_percentage: 3.5,
      projected_recoverability_score: 94.6,
      projected_recoverability_grade: 'GRADE_A',
      projected_clean_benchmark: 528.75,
      projected_contamination_penalty: 35.0,
      projected_indicative_net_range: { min: 460, max: 510 },
    },
    assumptions: ['Illustrative model assumption: 65% relative contamination reduction.'],
    uncertainties: ['Does not guarantee reprocessor acceptance.'],
    evidence_basis: ['Visible droplets on bottle interior.'],
    economic_effect: 'Projected net uplift of ~₹60 across batch.',
    routing_effect: {
      strategy: 'SINGLE_FACILITY_PREFERRED',
      rationale: 'Enhanced clean stream qualifies for Tier 1 PET reprocessor.',
    },
    is_scenario_projection: true,
    is_fallback_demo: false,
    ...overrides,
  };
}

// ==================================================
// PHASE 5.1 FORENSIC PASSPORT TEST SUITE
// ==================================================

describe('Phase 5.1 Recovery Passport Domain Foundation Tests', () => {
  // 1. Valid passport creation
  test('1. should create valid complete Recovery Passport with all snapshot domains', () => {
    const input: CreatePassportInput = {
      scan_id: 'scan-valid-001',
      recovery_profile: createMockRecoveryProfile(),
      weight_kg: 15.0,
      weight_provenance: 'ILLUSTRATIVE_VISUAL_PROJECTION',
      selected_scenario: createMockScenario(),
    };

    const passport = passportService.createPassport(input);

    assert.ok(passport);
    assert.strictEqual(passport.scan_id, 'scan-valid-001');
    assert.ok(passport.passport_id);
    assert.ok(passport.created_at);
    assert.ok(passport.evidence_snapshot);
    assert.ok(passport.verification_snapshot);
    assert.ok(passport.scenario_snapshot);
    assert.ok(passport.routing_snapshot);
    assert.ok(passport.integrity);
    assert.ok(passport.snapshot_disclosure);
  });

  // 2. Passport ID format (RCP-YYYY-<16 HEX CHARS>)
  test('2. should enforce unique random passport ID format RCP-YYYY-<16 HEX CHARS>', () => {
    const input: CreatePassportInput = {
      scan_id: 'scan-id-check-99',
      recovery_profile: createMockRecoveryProfile(),
      weight_kg: 20.0,
      weight_provenance: 'ILLUSTRATIVE_VISUAL_PROJECTION',
    };

    const passport = passportService.createPassport(input);
    const idRegex = /^RCP-\d{4}-[A-F0-9]{16}$/;

    assert.match(passport.passport_id, idRegex);
    const currentYear = new Date().getUTCFullYear().toString();
    assert.ok(passport.passport_id.startsWith(`RCP-${currentYear}-`));
  });

  // 3. Schema version
  test('3. should enforce schema_version = "1.0"', () => {
    const input: CreatePassportInput = {
      scan_id: 'scan-ver-001',
      recovery_profile: createMockRecoveryProfile(),
      weight_kg: 10.0,
      weight_provenance: 'ILLUSTRATIVE_VISUAL_PROJECTION',
    };

    const passport = passportService.createPassport(input);
    assert.strictEqual(passport.schema_version, '1.0');
    assert.strictEqual(passport.integrity.payload_version, '1.0');
  });

  // 4. Timestamp
  test('4. should assign valid ISO 8601 creation timestamp', () => {
    const input: CreatePassportInput = {
      scan_id: 'scan-time-001',
      recovery_profile: createMockRecoveryProfile(),
      weight_kg: 10.0,
      weight_provenance: 'ILLUSTRATIVE_VISUAL_PROJECTION',
    };

    const passport = passportService.createPassport(input);
    const parsedDate = new Date(passport.created_at);
    assert.ok(!isNaN(parsedDate.getTime()));
    assert.ok(passport.created_at.includes('T'));
  });

  // 5. Evidence snapshot
  test('5. should capture complete source-isolated evidence snapshot', () => {
    const profile = createMockRecoveryProfile();
    const input: CreatePassportInput = {
      scan_id: 'scan-evidence-001',
      recovery_profile: profile,
      weight_kg: 12.5,
      weight_provenance: 'ILLUSTRATIVE_VISUAL_PROJECTION',
    };

    const passport = passportService.createPassport(input);
    const ev = passport.evidence_snapshot;

    assert.strictEqual(ev.primary_material.code, 'PLASTIC_PET');
    assert.strictEqual(ev.composition.length, 2);
    assert.strictEqual(ev.composition[0].material_code, 'PLASTIC_PET');
    assert.strictEqual(ev.contamination.percentage, 10.0);
    assert.strictEqual(ev.recoverability.score, 88.0);
    assert.deepStrictEqual(ev.visual_evidence, ['Transparent ribbed bottle bodies', 'Opaque colored bottle caps']);
    assert.deepStrictEqual(ev.contamination_evidence, ['Liquid droplets visible in bottles']);
    assert.deepStrictEqual(ev.uncertainty, ['Closure polymer requires density verification']);
    assert.strictEqual(ev.model_name, 'gemini-1.5-flash');
    assert.strictEqual(ev.is_fallback_inference, false);
  });

  // 6. Weight provenance
  test('6. should explicitly record weight provenance', () => {
    const inputProj: CreatePassportInput = {
      scan_id: 'scan-prov-proj',
      recovery_profile: createMockRecoveryProfile(),
      weight_kg: 15.0,
      weight_provenance: 'ILLUSTRATIVE_VISUAL_PROJECTION',
    };
    const passportProj = passportService.createPassport(inputProj);
    assert.strictEqual(passportProj.evidence_snapshot.weight_provenance, 'ILLUSTRATIVE_VISUAL_PROJECTION');

    const inputWeigh: CreatePassportInput = {
      scan_id: 'scan-prov-weigh',
      recovery_profile: createMockRecoveryProfile(),
      weight_kg: 14.8,
      weight_provenance: 'USER_CONFIRMED_SCALE_WEIGHMENT',
    };
    const passportWeigh = passportService.createPassport(inputWeigh);
    assert.strictEqual(passportWeigh.evidence_snapshot.weight_provenance, 'USER_CONFIRMED_SCALE_WEIGHMENT');
  });

  // 7. Verification snapshot
  test('7. should capture verification snapshot correctly (unverified vs operator declared verified)', () => {
    // Unverified case
    const unverifiedPassport = passportService.createPassport({
      scan_id: 'scan-unver-001',
      recovery_profile: createMockRecoveryProfile(),
      weight_kg: 15.0,
      weight_provenance: 'ILLUSTRATIVE_VISUAL_PROJECTION',
    });
    assert.strictEqual(unverifiedPassport.verification_snapshot.verification_status, 'UNVERIFIED');
    assert.strictEqual(unverifiedPassport.verification_snapshot.confirmed_weight_kg, undefined);

    // Operator-declared verified case
    const verifiedPassport = passportService.createPassport({
      scan_id: 'scan-ver-002',
      recovery_profile: createMockRecoveryProfile(),
      weight_kg: 15.0,
      weight_provenance: 'USER_CONFIRMED_SCALE_WEIGHMENT',
      verification: {
        verification_status: 'OPERATOR_DECLARED_VERIFIED',
        verified_at: '2026-09-19T21:00:00.000Z',
        confirmed_weight_kg: 14.75,
        material_corrections: 'Confirmed 100% PET with PE caps',
        contamination_corrections: 8.0,
        preparation_confirmation: 'PARTIALLY_PREPARED',
        user_notes: 'Dock scale calibration check passed.',
      },
    });
    assert.strictEqual(verifiedPassport.verification_snapshot.verification_status, 'OPERATOR_DECLARED_VERIFIED');
    assert.strictEqual(verifiedPassport.verification_snapshot.confirmed_weight_kg, 14.75);
    assert.strictEqual(verifiedPassport.verification_snapshot.confirmed_weight_provenance, 'USER_CONFIRMED_SCALE_WEIGHMENT');
    assert.strictEqual(verifiedPassport.verification_snapshot.preparation_confirmation, 'PARTIALLY_PREPARED');
    assert.ok(verifiedPassport.verification_snapshot.verification_disclosure?.includes('operator-declared'));
  });

  // 8. Scenario snapshot
  test('8. should snapshot selected Phase 4 optimization scenario fully, not just an ID', () => {
    const scenario = createMockScenario();
    const passport = passportService.createPassport({
      scan_id: 'scan-scen-001',
      recovery_profile: createMockRecoveryProfile(),
      weight_kg: 15.0,
      weight_provenance: 'ILLUSTRATIVE_VISUAL_PROJECTION',
      selected_scenario: scenario,
    });

    const sc = passport.scenario_snapshot;
    assert.strictEqual(sc.scenario_id, 'scenario-rec-prep');
    assert.strictEqual(sc.scenario_type, 'RECOMMENDED_PREPARATION');
    assert.strictEqual(sc.selected_status, 'SELECTED_FOR_PASSPORT');
    assert.strictEqual(sc.effort_level, 'MEDIUM');
    assert.strictEqual(sc.modeled_contamination_percent, 3.5);
    assert.strictEqual(sc.modeled_recoverability_score, 94.6);
    assert.strictEqual(sc.modeled_economic_result.min, 460);
    assert.strictEqual(sc.modeled_economic_result.max, 510);
    assert.strictEqual(sc.preparation_actions.length, 1);
    assert.strictEqual(sc.preparation_actions[0].action_id, 'action-drain');
    assert.ok(sc.coefficient_metadata);
    assert.strictEqual(sc.coefficient_metadata?.contamination_reduction_coefficient, 0.65);
    assert.ok(sc.scenario_disclosure);
  });

  // 9. Routing snapshot
  test('9. should snapshot routing decision with provisional status and rationale', () => {
    const passport = passportService.createPassport({
      scan_id: 'scan-route-001',
      recovery_profile: createMockRecoveryProfile(),
      weight_kg: 15.0,
      weight_provenance: 'ILLUSTRATIVE_VISUAL_PROJECTION',
      selected_route: {
        routing_status: 'RECOMMENDED',
        selected_facility_id: 'facility-mumbai-pet',
        selected_facility_name: 'Apex Polymer Recyclers',
        route_type: 'SINGLE_FACILITY',
        routing_rationale: 'Matches high-grade bottle flake requirement at Apex Polymer Recyclers with minimal transit.',
        preparation_requirements: ['Manual de-capping'],
        indicative_payout_range: { min: 450, max: 500 },
      },
    });

    const rt = passport.routing_snapshot;
    assert.strictEqual(rt.routing_status, 'RECOMMENDED');
    assert.strictEqual(rt.selected_facility_id, 'facility-mumbai-pet');
    assert.strictEqual(rt.selected_facility_name, 'Apex Polymer Recyclers');
    assert.strictEqual(rt.route_type, 'SINGLE_FACILITY');
    assert.ok(rt.routing_rationale.includes('Apex Polymer Recyclers'));
    assert.deepStrictEqual(rt.preparation_requirements, ['Manual de-capping']);
  });

  // 10. Deterministic canonicalization
  test('10. should produce identical canonical string regardless of object key insertion order', () => {
    const objA = { z: 1, a: 2, m: { y: 'bar', b: 'foo' }, list: [1, 2, 3] };
    const objB = { a: 2, m: { b: 'foo', y: 'bar' }, z: 1, list: [1, 2, 3] };

    const canonA = canonicalize(objA);
    const canonB = canonicalize(objB);

    assert.strictEqual(canonA, canonB);
    assert.strictEqual(canonA, '{"a":2,"list":[1,2,3],"m":{"b":"foo","y":"bar"},"z":1}');
  });

  // 11. SHA-256 integrity hash
  test('11. should compute valid 64-char lowercase hexadecimal SHA-256 integrity hash', () => {
    const passport = passportService.createPassport({
      scan_id: 'scan-hash-001',
      recovery_profile: createMockRecoveryProfile(),
      weight_kg: 15.0,
      weight_provenance: 'ILLUSTRATIVE_VISUAL_PROJECTION',
    });

    assert.strictEqual(passport.integrity.algorithm, 'SHA-256');
    assert.match(passport.integrity.canonical_payload_hash, /^[a-f0-9]{64}$/);
    assert.ok(passport.integrity.hashed_fields.includes('evidence_snapshot'));
    assert.ok(passport.integrity.hashed_fields.includes('scenario_snapshot'));
    assert.ok(passport.integrity.hashed_fields.includes('routing_snapshot'));
  });

  // 12. Integrity verification success
  test('12. should successfully verify integrity for an untampered passport', () => {
    const passport = passportService.createPassport({
      scan_id: 'scan-verify-pass',
      recovery_profile: createMockRecoveryProfile(),
      weight_kg: 15.0,
      weight_provenance: 'ILLUSTRATIVE_VISUAL_PROJECTION',
      selected_scenario: createMockScenario(),
    });

    const verification = passportService.verifyPassportIntegrity(passport);
    assert.strictEqual(verification.isValid, true);
    assert.strictEqual(verification.expectedHash, passport.integrity.canonical_payload_hash);
  });

  // 13. Tampering detection (contamination)
  test('13. should detect tampering when contamination percentage is modified', () => {
    const passport = passportService.createPassport({
      scan_id: 'scan-tamper-contam',
      recovery_profile: createMockRecoveryProfile(),
      weight_kg: 15.0,
      weight_provenance: 'ILLUSTRATIVE_VISUAL_PROJECTION',
    });

    // Tamper with contamination
    const tampered = structuredClone(passport);
    tampered.evidence_snapshot.contamination.percentage = 1.0;

    const verification = passportService.verifyPassportIntegrity(tampered);
    assert.strictEqual(verification.isValid, false);
    assert.notStrictEqual(verification.expectedHash, tampered.integrity.canonical_payload_hash);
  });

  // 14. Scenario tampering detection
  test('14. should detect tampering when scenario projected contamination is altered', () => {
    const passport = passportService.createPassport({
      scan_id: 'scan-tamper-scen',
      recovery_profile: createMockRecoveryProfile(),
      weight_kg: 15.0,
      weight_provenance: 'ILLUSTRATIVE_VISUAL_PROJECTION',
      selected_scenario: createMockScenario(),
    });

    // Tamper with scenario projection
    const tampered = structuredClone(passport);
    tampered.scenario_snapshot.modeled_contamination_percent = 0.5;

    const verification = passportService.verifyPassportIntegrity(tampered);
    assert.strictEqual(verification.isValid, false);
  });

  // 15. Routing tampering detection
  test('15. should detect tampering when routing facility or type is modified', () => {
    const passport = passportService.createPassport({
      scan_id: 'scan-tamper-route',
      recovery_profile: createMockRecoveryProfile(),
      weight_kg: 15.0,
      weight_provenance: 'ILLUSTRATIVE_VISUAL_PROJECTION',
    });

    // Tamper with route type
    const tampered = structuredClone(passport);
    tampered.routing_snapshot.route_type = 'SPECIALIZED_DISPOSAL';

    const verification = passportService.verifyPassportIntegrity(tampered);
    assert.strictEqual(verification.isValid, false);
  });

  // 16. Verification tampering detection
  test('16. should detect tampering when verification status is falsified', () => {
    const passport = passportService.createPassport({
      scan_id: 'scan-tamper-ver',
      recovery_profile: createMockRecoveryProfile(),
      weight_kg: 15.0,
      weight_provenance: 'ILLUSTRATIVE_VISUAL_PROJECTION',
    });

    // Falsify verification status from UNVERIFIED to OPERATOR_DECLARED_VERIFIED
    const tampered = structuredClone(passport);
    tampered.verification_snapshot.verification_status = 'OPERATOR_DECLARED_VERIFIED';

    const verification = passportService.verifyPassportIntegrity(tampered);
    assert.strictEqual(verification.isValid, false);
  });

  // 17. Source-object mutation isolation
  test('17. should ensure mutations to input source objects do NOT mutate created passport', () => {
    const sourceProfile = createMockRecoveryProfile();
    const sourceScenario = createMockScenario();

    const passport = passportService.createPassport({
      scan_id: 'scan-mutation-test',
      recovery_profile: sourceProfile,
      weight_kg: 15.0,
      weight_provenance: 'ILLUSTRATIVE_VISUAL_PROJECTION',
      selected_scenario: sourceScenario,
    });

    const originalHash = passport.integrity.canonical_payload_hash;

    // Mutate source objects externally after creation
    sourceProfile.contamination.percentage = 99.0;
    sourceProfile.composition[0].material_code = 'PLASTIC_HDPE';
    sourceScenario.modeled_state.projected_contamination_percentage = 0.1;

    // Passport must remain completely unchanged
    assert.strictEqual(passport.evidence_snapshot.contamination.percentage, 10.0);
    assert.strictEqual(passport.evidence_snapshot.composition[0].material_code, 'PLASTIC_PET');
    assert.strictEqual(passport.scenario_snapshot.modeled_contamination_percent, 3.5);

    // Integrity must still pass
    const verification = passportService.verifyPassportIntegrity(passport);
    assert.strictEqual(verification.isValid, true);
    assert.strictEqual(verification.expectedHash, originalHash);
  });

  // 18. Returned passport mutation causes integrity verification failure
  test('18. should detect direct in-memory mutation of returned passport object', () => {
    const passport = passportService.createPassport({
      scan_id: 'scan-mut-passport',
      recovery_profile: createMockRecoveryProfile(),
      weight_kg: 15.0,
      weight_provenance: 'ILLUSTRATIVE_VISUAL_PROJECTION',
    });

    // Mutate in-memory passport directly
    passport.evidence_snapshot.contamination.percentage = 2.0;

    // Integrity verification must now detect this modification
    const verification = passportService.verifyPassportIntegrity(passport);
    assert.strictEqual(verification.isValid, false);
  });

  // 19. Invalid material code rejected (PLASTIC_UNICORN)
  test('19. should reject arbitrary invalid material codes such as PLASTIC_UNICORN', () => {
    const malformedProfile: any = createMockRecoveryProfile();
    malformedProfile.primary_material.code = 'PLASTIC_UNICORN';

    assert.throws(
      () => {
        passportService.createPassport({
          scan_id: 'scan-inv-mat-code',
          recovery_profile: malformedProfile,
          weight_kg: 10.0,
          weight_provenance: 'ILLUSTRATIVE_VISUAL_PROJECTION',
        });
      },
      (err: any) => err.name === 'ZodError'
    );
  });

  // 20. Legitimate canonical material codes remain accepted
  test('20. should accept all canonical material codes from project vocabulary', () => {
    for (const code of CANONICAL_MATERIAL_CODES) {
      const profile = createMockRecoveryProfile();
      profile.primary_material.code = code;
      profile.composition[0].material_code = code;

      const passport = passportService.createPassport({
        scan_id: `scan-canon-${code}`,
        recovery_profile: profile,
        weight_kg: 10.0,
        weight_provenance: 'ILLUSTRATIVE_VISUAL_PROJECTION',
      });

      assert.strictEqual(passport.evidence_snapshot.primary_material.code, code);
      assert.strictEqual(passport.evidence_snapshot.composition[0].material_code, code);
    }
  });

  // 21. Numerical boundary rejection (percentage, negative weight, NaN/Infinity)
  test('21. should reject invalid percentages, negative weights, and NaN/Infinity', () => {
    // Percentage > 100
    const profileHigh = createMockRecoveryProfile();
    profileHigh.contamination.percentage = 150.0;
    assert.throws(() => {
      passportService.createPassport({
        scan_id: 'scan-inv-pct',
        recovery_profile: profileHigh,
        weight_kg: 10.0,
        weight_provenance: 'ILLUSTRATIVE_VISUAL_PROJECTION',
      });
    });

    // Negative weight
    assert.throws(() => {
      passportService.createPassport({
        scan_id: 'scan-neg-weight',
        recovery_profile: createMockRecoveryProfile(),
        weight_kg: -5.0,
        weight_provenance: 'ILLUSTRATIVE_VISUAL_PROJECTION',
      });
    });

    // NaN weight
    assert.throws(() => {
      passportService.createPassport({
        scan_id: 'scan-nan-weight',
        recovery_profile: createMockRecoveryProfile(),
        weight_kg: NaN,
        weight_provenance: 'ILLUSTRATIVE_VISUAL_PROJECTION',
      });
    });

    // Infinity weight
    assert.throws(() => {
      passportService.createPassport({
        scan_id: 'scan-inf-weight',
        recovery_profile: createMockRecoveryProfile(),
        weight_kg: Infinity,
        weight_provenance: 'ILLUSTRATIVE_VISUAL_PROJECTION',
      });
    });
  });

  // 22. Array bounds enforcement (composition, evidence, actions, split_routes)
  test('22. should reject oversized arrays exceeding bounded domain limits', () => {
    const profile = createMockRecoveryProfile();

    // Composition > 20
    const baseComp = profile.composition[0];
    const oversizedComp = Array(21).fill(baseComp);
    const profileOversizedComp = { ...profile, composition: oversizedComp };
    assert.throws(() => {
      passportService.createPassport({
        scan_id: 'scan-oversized-comp',
        recovery_profile: profileOversizedComp,
        weight_kg: 10.0,
        weight_provenance: 'ILLUSTRATIVE_VISUAL_PROJECTION',
      });
    });

    // Visual evidence > 30
    const oversizedEvidence = Array(31).fill('Evidence observation string');
    const profileOversizedEv = { ...profile, visual_evidence: oversizedEvidence };
    assert.throws(() => {
      passportService.createPassport({
        scan_id: 'scan-oversized-ev',
        recovery_profile: profileOversizedEv,
        weight_kg: 10.0,
        weight_provenance: 'ILLUSTRATIVE_VISUAL_PROJECTION',
      });
    });

    // Actions > 30
    const scenario = createMockScenario();
    const baseAction = scenario.actions[0];
    const oversizedActions = Array(31).fill(baseAction);
    const scenarioOversizedActions = { ...scenario, actions: oversizedActions };
    assert.throws(() => {
      passportService.createPassport({
        scan_id: 'scan-oversized-actions',
        recovery_profile: profile,
        weight_kg: 10.0,
        weight_provenance: 'ILLUSTRATIVE_VISUAL_PROJECTION',
        selected_scenario: scenarioOversizedActions,
      });
    });

    // Split routes > 20
    const oversizedRoutes = Array(21).fill({ route_type: 'SPLIT_ROUTING' });
    assert.throws(() => {
      passportService.createPassport({
        scan_id: 'scan-oversized-routes',
        recovery_profile: profile,
        weight_kg: 10.0,
        weight_provenance: 'ILLUSTRATIVE_VISUAL_PROJECTION',
        selected_route: { split_routes: oversizedRoutes },
      });
    });
  });

  // 23. Integrity metadata tampering detection
  test('23. should detect tampering in integrity algorithm, payload_version, or hashed_fields', () => {
    const passport = passportService.createPassport({
      scan_id: 'scan-tamper-meta',
      recovery_profile: createMockRecoveryProfile(),
      weight_kg: 15.0,
      weight_provenance: 'ILLUSTRATIVE_VISUAL_PROJECTION',
    });

    // A. Algorithm tampering
    const tamperedAlgo = structuredClone(passport);
    tamperedAlgo.integrity.algorithm = 'MD5' as any;
    const resAlgo = passportService.verifyPassportIntegrity(tamperedAlgo);
    assert.strictEqual(resAlgo.isValid, false);
    assert.ok(resAlgo.details?.includes('SHA-256'));

    // B. Payload version tampering
    const tamperedVer = structuredClone(passport);
    tamperedVer.integrity.payload_version = '2.0';
    const resVer = passportService.verifyPassportIntegrity(tamperedVer);
    assert.strictEqual(resVer.isValid, false);
    assert.ok(resVer.details?.includes('1.0'));

    // C. Hashed fields tampering (modified or omitted field)
    const tamperedFields = structuredClone(passport);
    tamperedFields.integrity.hashed_fields = ['passport_id', 'scan_id'];
    const resFields = passportService.verifyPassportIntegrity(tamperedFields);
    assert.strictEqual(resFields.isValid, false);
    assert.ok(resFields.details?.includes('hashed_fields'));
  });

  // 24. Passport ID sample uniqueness (1,000 IDs without collision)
  test('24. should generate unique IDs across 1,000 sample generations without collision', () => {
    const idSet = new Set<string>();
    const count = 1000;

    for (let i = 0; i < count; i++) {
      const passport = passportService.createPassport({
        scan_id: `scan-sample-${i}`,
        recovery_profile: createMockRecoveryProfile(),
        weight_kg: 10.0,
        weight_provenance: 'ILLUSTRATIVE_VISUAL_PROJECTION',
      });

      assert.ok(!idSet.has(passport.passport_id), `Collision detected on ${passport.passport_id}`);
      idSet.add(passport.passport_id);
    }

    assert.strictEqual(idSet.size, count);
  });

  // 25. Weight provenance consistency
  test('25. should maintain clear distinction between scan visual weight and operator dock weighment', () => {
    const passport = passportService.createPassport({
      scan_id: 'scan-weight-dist',
      recovery_profile: createMockRecoveryProfile(),
      weight_kg: 15.0,
      weight_provenance: 'ILLUSTRATIVE_VISUAL_PROJECTION',
      verification: {
        verification_status: 'OPERATOR_DECLARED_VERIFIED',
        confirmed_weight_kg: 14.8,
      },
    });

    assert.strictEqual(passport.evidence_snapshot.batch_weight_kg, 15.0);
    assert.strictEqual(passport.evidence_snapshot.weight_provenance, 'ILLUSTRATIVE_VISUAL_PROJECTION');
    assert.strictEqual(passport.verification_snapshot.confirmed_weight_kg, 14.8);
    assert.strictEqual(passport.verification_snapshot.confirmed_weight_provenance, 'USER_CONFIRMED_SCALE_WEIGHMENT');
  });

  // 26. Fallback/demo state preserved
  test('26. should preserve is_fallback_inference state accurately in snapshot', () => {
    const fallbackProfile = createMockRecoveryProfile({
      is_fallback_inference: true,
      model_name: 'deterministic-fallback-heuristic',
    });

    const passport = passportService.createPassport({
      scan_id: 'scan-fallback-state',
      recovery_profile: fallbackProfile,
      weight_kg: 10.0,
      weight_provenance: 'ILLUSTRATIVE_VISUAL_PROJECTION',
    });

    assert.strictEqual(passport.evidence_snapshot.is_fallback_inference, true);
    assert.strictEqual(passport.evidence_snapshot.model_name, 'deterministic-fallback-heuristic');
  });

  // 27. No external AI invocation
  test('27. should create passport deterministically and synchronously without invoking external AI', () => {
    const startTime = performance.now();

    const passport = passportService.createPassport({
      scan_id: 'scan-perf-test',
      recovery_profile: createMockRecoveryProfile(),
      weight_kg: 15.0,
      weight_provenance: 'ILLUSTRATIVE_VISUAL_PROJECTION',
      selected_scenario: createMockScenario(),
    });

    const duration = performance.now() - startTime;

    assert.ok(passport.passport_id);
    assert.ok(duration < 25, `Expected passport creation in < 25ms, took ${duration}ms`);
  });

  // 28. Backward compatibility with Phase 3/4 profiles and exact canonical hash field-set
  test('28. should accept valid Phase 3/4 profiles and scenarios with exact hash field-set', () => {
    const profile = createMockRecoveryProfile();
    const scenario = createMockScenario();

    const passport = passportService.createPassport({
      scan_id: profile.scan_id,
      recovery_profile: profile,
      weight_kg: 15.0,
      weight_provenance: 'ILLUSTRATIVE_VISUAL_PROJECTION',
      selected_scenario: scenario,
      selected_route: {
        routing_status: 'PROVISIONAL',
        route_type: 'SINGLE_FACILITY',
        routing_rationale: profile.recovery_decision?.routing_rationale,
      },
    });

    assert.strictEqual(passport.schema_version, '1.0');
    assert.strictEqual(passport.evidence_snapshot.primary_material.code, 'PLASTIC_PET');
    assert.strictEqual(passport.scenario_snapshot.scenario_id, 'scenario-rec-prep');
    assert.strictEqual(passport.routing_snapshot.route_type, 'SINGLE_FACILITY');

    assert.deepStrictEqual(passport.integrity.hashed_fields, [...PASSPORT_HASHED_FIELDS]);

    const verification = passportService.verifyPassportIntegrity(passport);
    assert.strictEqual(verification.isValid, true);
  });
});
