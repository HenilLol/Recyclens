import crypto from 'crypto';
import { z } from 'zod';
import {
  BatchRecoveryPassport,
  CreatePassportInput,
  PassportEvidenceSnapshot,
  PassportIntegrity,
  PassportRoutingSnapshot,
  PassportScenarioSnapshot,
  PassportVerificationSnapshot,
  PassportVerificationStatus,
  WeightProvenance,
} from '../../src/types/recyclens.types.ts';

// ==================================================
// CANONICAL VOCABULARY & CONSTANTS
// ==================================================

export const CANONICAL_MATERIAL_CODES = [
  'PLASTIC_PET',
  'PLASTIC_HDPE',
  'PLASTIC_LDPE',
  'PLASTIC_PP',
  'PAPER_CARDBOARD',
  'PAPER_MIXED',
  'METAL_ALUMINIUM',
  'METAL_STEEL',
  'GLASS_CULLET',
  'GLASS',
  'EWASTE_PCB',
  'TEXTILE_COTTON',
  'ORGANIC',
  'OTHER',
] as const;

export type CanonicalMaterialCode = (typeof CANONICAL_MATERIAL_CODES)[number];

export const PASSPORT_HASHED_FIELDS = [
  'passport_id',
  'scan_id',
  'created_at',
  'schema_version',
  'evidence_snapshot',
  'verification_snapshot',
  'scenario_snapshot',
  'routing_snapshot',
  'snapshot_disclosure',
] as const;

export const SNAPSHOT_DISCLOSURE_STATEMENT =
  'This Recovery Passport is an operational digital record of visual observations, AI model inferences, deterministic modeled decisions, and operator-declared inputs captured at creation. It records caller-supplied inputs and modeled decisions, but does not independently authenticate operator identity, establish physical material truth, or constitute certified weighbridge documentation, physical custody transfer, legal ownership certification, or guaranteed commercial settlement.';

export const VERIFICATION_DISCLOSURE_STATEMENT =
  'Verification status represents an operator-declared verification state supplied by the client. RecycLens does not independently authenticate operator identity or prove the underlying physical claim.';

// ==================================================
// CANONICALIZATION SPECIFICATION
// ==================================================
/**
 * Deterministic JSON Canonicalizer for RecycLens Recovery Passport
 *
 * Rules:
 * 1. Primitives:
 *    - string, boolean, null: serialized directly via JSON.stringify()
 *    - number: must be finite (rejects NaN and Infinity); serialized via JSON.stringify()
 * 2. Arrays:
 *    - Ordering is preserved (arrays represent semantic sequences);
 *    - Each item is recursively canonicalized; undefined elements serialize to 'null'.
 * 3. Objects:
 *    - Keys are lexicographically sorted in ascending UTF-16 code unit order (Array.prototype.sort()).
 *    - Keys with undefined, function, or symbol values are omitted.
 *    - Each value is recursively canonicalized.
 * 4. Circular References:
 *    - Tracked via a WeakSet; any circular graph triggers an immediate throw.
 * 5. Cryptographic Guarantee:
 *    - The SHA-256 integrity hash detects changes to the passport payload when the original hash is retained.
 *    - It provides tamper-evidence against uncoordinated modification, not cryptographic authentication
 *      or non-repudiation against an active adversary recalculating the hash.
 */
export function canonicalize(val: any, seen = new WeakSet()): string {
  if (val === null || typeof val !== 'object') {
    if (typeof val === 'number') {
      if (!Number.isFinite(val)) {
        throw new Error('Deterministic canonicalization rejected non-finite number (NaN or Infinity).');
      }
    }
    return JSON.stringify(val);
  }

  if (seen.has(val)) {
    throw new Error('Deterministic canonicalization rejected circular reference.');
  }
  seen.add(val);

  if (Array.isArray(val)) {
    const items = val.map((item) => (item === undefined ? 'null' : canonicalize(item, seen)));
    return `[${items.join(',')}]`;
  }

  const keys = Object.keys(val).sort();
  const pairs: string[] = [];
  for (const key of keys) {
    const value = val[key];
    if (value === undefined || typeof value === 'function' || typeof value === 'symbol') {
      continue;
    }
    pairs.push(`${JSON.stringify(key)}:${canonicalize(value, seen)}`);
  }
  return `{${pairs.join(',')}}`;
}

// ==================================================
// INPUT VALIDATION SCHEMAS WITH DEFENSIVE BOUNDS
// ==================================================

const materialCategoryEnum = z.enum([
  'PLASTIC',
  'PAPER',
  'METAL',
  'GLASS',
  'EWASTE',
  'TEXTILE',
  'ORGANIC',
  'OTHER',
]);

const qualityGradeEnum = z.enum(['GRADE_A', 'GRADE_B', 'GRADE_C', 'REJECT']);

const contaminationSeverityEnum = z.enum(['CLEAN', 'LOW', 'MODERATE', 'HIGH', 'CRITICAL']);

const weightProvenanceEnum = z.enum([
  'USER_CONFIRMED_SCALE_WEIGHMENT',
  'ILLUSTRATIVE_VISUAL_PROJECTION',
]);

const finiteBoundedNumber = (min: number, max: number) =>
  z.number().finite().min(min).max(max);

const detectedMaterialSchema = z.object({
  code: z.enum(CANONICAL_MATERIAL_CODES),
  name: z.string().min(1).max(100),
  category: materialCategoryEnum,
  confidence: finiteBoundedNumber(0, 100),
  polymer_subtype: z.string().max(100).optional(),
});

const batchComponentSchema = z.object({
  material: z.string().min(1).max(100),
  material_code: z.enum(CANONICAL_MATERIAL_CODES),
  category: materialCategoryEnum,
  estimated_share_percent: finiteBoundedNumber(0, 100),
  confidence: finiteBoundedNumber(0, 100),
  polymer_subtype: z.string().max(100).optional(),
  visual_evidence: z.array(z.string().max(200)).max(30).default([]),
  contamination_percent: finiteBoundedNumber(0, 100),
  recoverability_score: finiteBoundedNumber(0, 100),
  recoverability_grade: qualityGradeEnum,
  is_separable: z.boolean(),
  preparation_actions: z.array(z.string().max(200)).max(30).default([]),
  uncertainty: z.array(z.string().max(200)).max(30).default([]),
});

const contaminationInfoSchema = z.object({
  percentage: finiteBoundedNumber(0, 100),
  type: z.string().min(1).max(100),
  severity: contaminationSeverityEnum,
  explanation: z.string().min(1).max(1000),
  visual_indicators: z.array(z.string().max(200)).max(30).default([]),
});

const recoverabilityInfoSchema = z.object({
  score: finiteBoundedNumber(0, 100),
  grade: qualityGradeEnum,
  is_commercially_viable: z.boolean(),
  actionable_advice: z.string().min(1).max(1000),
  potential_applications: z.array(z.string().max(200)).max(30).default([]),
});

const recoveryProfileSchema = z.object({
  id: z.string().min(1).max(100),
  scan_id: z.string().min(1).max(100),
  primary_material: detectedMaterialSchema,
  secondary_materials: z.array(z.any()).max(20).default([]),
  composition: z.array(batchComponentSchema).max(20).default([]),
  unresolved_fraction: z
    .object({
      estimated_share_percent: finiteBoundedNumber(0, 100),
      visual_reason: z.string().min(1).max(500),
    })
    .optional(),
  recovery_decision: z
    .object({
      batch_archetype: z.string().max(200),
      condition_summary: z.string().max(1000),
      recommended_action: z.string().max(1000),
      economic_effect: z.string().max(1000),
      routing_strategy: z.enum(['SINGLE_FACILITY', 'SPLIT_ROUTING', 'SPECIALIZED_DISPOSAL']),
      routing_rationale: z.string().max(2000),
    })
    .optional(),
  contamination: contaminationInfoSchema,
  recoverability: recoverabilityInfoSchema,
  visual_explanation: z.string().min(1).max(2000),
  visual_evidence: z.array(z.string().max(200)).max(30).optional(),
  contamination_evidence: z.array(z.string().max(200)).max(30).optional(),
  uncertainty: z.array(z.string().max(200)).max(30).optional(),
  recommended_preparation: z.array(z.string().max(200)).max(30).optional(),
  model_name: z.string().min(1).max(100),
  is_fallback_inference: z.boolean(),
  timestamp: z.string(),
});

export const createPassportSchema = z.object({
  scan_id: z.string().min(1).max(100),
  recovery_profile: recoveryProfileSchema,
  weight_kg: z.number().finite().positive().max(100000),
  weight_provenance: weightProvenanceEnum,
  verification: z
    .object({
      verification_status: z
        .enum(['UNVERIFIED', 'OPERATOR_DECLARED_VERIFIED', 'OPERATOR_VERIFIED'])
        .optional(),
      verified_at: z.string().optional(),
      confirmed_weight_kg: z.number().finite().positive().max(100000).optional(),
      material_corrections: z.string().max(200).optional(),
      contamination_corrections: finiteBoundedNumber(0, 100).optional(),
      preparation_confirmation: z
        .enum(['NOT_PREPARED', 'PARTIALLY_PREPARED', 'FULLY_PREPARED'])
        .optional(),
      user_notes: z.string().max(2000).optional(),
    })
    .optional(),
  selected_scenario: z
    .object({
      scenario_id: z.string().min(1).max(100),
      scenario_type: z.enum([
        'MINIMAL_PREPARATION',
        'RECOMMENDED_PREPARATION',
        'MAXIMUM_SEPARATION',
      ]),
      title: z.string().min(1).max(200),
      description: z.string().default(''),
      effort_level: z.enum(['LOW', 'MEDIUM', 'HIGH']),
      actions: z.array(z.any()).max(30).default([]),
      affected_material_codes: z.array(z.enum(CANONICAL_MATERIAL_CODES)).max(20).default([]),
      modeling_coefficients: z.any().optional(),
      current_state_reference: z.any().optional(),
      modeled_state: z.object({
        projected_contamination_percentage: finiteBoundedNumber(0, 100),
        projected_recoverability_score: finiteBoundedNumber(0, 100),
        projected_recoverability_grade: qualityGradeEnum,
        projected_clean_benchmark: z.number().finite().min(0).optional(),
        projected_contamination_penalty: z.number().finite().min(0).optional(),
        projected_indicative_net_range: z
          .object({
            min: z.number().finite(),
            max: z.number().finite(),
          })
          .optional(),
      }),
      assumptions: z.array(z.string().max(500)).max(30).default([]),
      uncertainties: z.array(z.string().max(500)).max(30).default([]),
      evidence_basis: z.array(z.string().max(500)).max(30).default([]),
      economic_effect: z.string().default(''),
      routing_effect: z
        .object({
          strategy: z.any(),
          rationale: z.string(),
        })
        .optional(),
      is_scenario_projection: z.literal(true),
      is_fallback_demo: z.boolean().optional(),
    })
    .optional(),
  selected_route: z
    .object({
      routing_status: z.enum(['PLANNED', 'PROVISIONAL', 'RECOMMENDED']).optional(),
      selected_facility_id: z.string().max(100).optional(),
      selected_facility_name: z.string().max(200).optional(),
      route_type: z.enum(['SINGLE_FACILITY', 'SPLIT_ROUTING', 'SPECIALIZED_DISPOSAL']).optional(),
      split_routes: z.array(z.any()).max(20).optional(),
      routing_rationale: z.string().max(2000).optional(),
      preparation_requirements: z.array(z.string().max(200)).max(30).optional(),
      indicative_payout_range: z
        .object({
          min: z.number().finite(),
          max: z.number().finite(),
        })
        .optional(),
    })
    .optional(),
});

// ==================================================
// PASSPORT SERVICE
// ==================================================

export class PassportService {
  /**
   * Generates a unique, human-readable passport identifier in the format RCP-YYYY-<16 HEX CHARS>.
   * Passport IDs use cryptographically random entropy (64 bits) for practical uniqueness.
   * They are identifiers, not integrity proofs.
   */
  private generatePassportId(createdAt: string): string {
    const year = new Date(createdAt).getUTCFullYear();
    const randomEntropy = crypto.randomBytes(8).toString('hex').toUpperCase();
    return `RCP-${year}-${randomEntropy}`;
  }

  /**
   * Computes the SHA-256 integrity hash across the canonical payload fields.
   * Excludes the 'integrity' field itself to prevent circular hashing.
   */
  public computePassportHash(
    passportWithoutIntegrity: Omit<BatchRecoveryPassport, 'integrity'>
  ): PassportIntegrity {
    const canonicalPayload = canonicalize(passportWithoutIntegrity);
    const hash = crypto.createHash('sha256').update(canonicalPayload, 'utf8').digest('hex');

    return {
      algorithm: 'SHA-256',
      canonical_payload_hash: hash,
      payload_version: '1.0',
      hashed_fields: [...PASSPORT_HASHED_FIELDS],
    };
  }

  /**
   * Verifies the cryptographic integrity of an existing passport.
   * Validates integrity metadata before comparing canonical hashes.
   */
  public verifyPassportIntegrity(passport: BatchRecoveryPassport): {
    isValid: boolean;
    expectedHash: string;
    actualHash: string;
    details?: string;
  } {
    if (!passport || typeof passport !== 'object') {
      return {
        isValid: false,
        expectedHash: '',
        actualHash: '',
        details: 'Passport object is missing or invalid.',
      };
    }

    // 1. Validate integrity metadata fields
    if (passport.integrity?.algorithm !== 'SHA-256') {
      return {
        isValid: false,
        expectedHash: '',
        actualHash: passport.integrity?.canonical_payload_hash || '',
        details: `Unsupported or tampered integrity algorithm: expected 'SHA-256', received '${passport.integrity?.algorithm}'.`,
      };
    }

    if (passport.integrity?.payload_version !== '1.0') {
      return {
        isValid: false,
        expectedHash: '',
        actualHash: passport.integrity?.canonical_payload_hash || '',
        details: `Unsupported or tampered payload version: expected '1.0', received '${passport.integrity?.payload_version}'.`,
      };
    }

    if (
      !Array.isArray(passport.integrity?.hashed_fields) ||
      passport.integrity.hashed_fields.length !== PASSPORT_HASHED_FIELDS.length ||
      !PASSPORT_HASHED_FIELDS.every((field, idx) => passport.integrity.hashed_fields[idx] === field)
    ) {
      return {
        isValid: false,
        expectedHash: '',
        actualHash: passport.integrity?.canonical_payload_hash || '',
        details: 'Tampered or mismatched hashed_fields integrity metadata.',
      };
    }

    const actualHash = passport.integrity.canonical_payload_hash || '';

    const payloadToHash: Omit<BatchRecoveryPassport, 'integrity'> = {
      passport_id: passport.passport_id,
      scan_id: passport.scan_id,
      created_at: passport.created_at,
      schema_version: passport.schema_version,
      evidence_snapshot: passport.evidence_snapshot,
      verification_snapshot: passport.verification_snapshot,
      scenario_snapshot: passport.scenario_snapshot,
      routing_snapshot: passport.routing_snapshot,
      snapshot_disclosure: passport.snapshot_disclosure,
    };

    try {
      const canonical = canonicalize(payloadToHash);
      const expectedHash = crypto.createHash('sha256').update(canonical, 'utf8').digest('hex');
      const isValid = Boolean(actualHash && expectedHash === actualHash);

      return {
        isValid,
        expectedHash,
        actualHash,
        details: isValid
          ? 'Canonical payload matches integrity hash.'
          : 'Integrity hash mismatch: passport payload has been modified or corrupted.',
      };
    } catch (err: any) {
      return {
        isValid: false,
        expectedHash: '',
        actualHash,
        details: `Canonicalization failure during verification: ${err.message}`,
      };
    }
  }

  /**
   * Creates an operational Recovery Passport snapshot.
   * Defensive deep cloning ensures that mutations to input source objects do NOT mutate the passport.
   */
  public createPassport(rawInput: CreatePassportInput): BatchRecoveryPassport {
    // 1. Validate Input
    const validated = createPassportSchema.parse(rawInput);

    // 2. Defensive deep clone to enforce snapshot isolation
    const input: CreatePassportInput = structuredClone(validated) as CreatePassportInput;

    // 3. Identity and Timestamps
    const createdAt = new Date().toISOString();
    const passportId = this.generatePassportId(createdAt);

    // 4. Evidence Snapshot
    const evidenceSnapshot: PassportEvidenceSnapshot = {
      primary_material: input.recovery_profile.primary_material,
      composition: input.recovery_profile.composition || [],
      unresolved_fraction: input.recovery_profile.unresolved_fraction,
      contamination: input.recovery_profile.contamination,
      recoverability: input.recovery_profile.recoverability,
      visual_evidence: input.recovery_profile.visual_evidence || [],
      contamination_evidence: input.recovery_profile.contamination_evidence || [],
      uncertainty: input.recovery_profile.uncertainty || [],
      visual_explanation: input.recovery_profile.visual_explanation || '',
      batch_weight_kg: input.weight_kg,
      weight_provenance: input.weight_provenance,
      model_name: input.recovery_profile.model_name,
      is_fallback_inference: input.recovery_profile.is_fallback_inference,
      captured_at: input.recovery_profile.timestamp || createdAt,
    };

    // 5. Verification Snapshot
    let normalizedVerificationStatus: PassportVerificationStatus = 'UNVERIFIED';
    if (
      input.verification?.verification_status === 'OPERATOR_DECLARED_VERIFIED' ||
      input.verification?.verification_status === 'OPERATOR_VERIFIED'
    ) {
      normalizedVerificationStatus = 'OPERATOR_DECLARED_VERIFIED';
    }

    const verificationSnapshot: PassportVerificationSnapshot = {
      verification_status: normalizedVerificationStatus,
      verified_at: input.verification?.verified_at,
      confirmed_weight_kg: input.verification?.confirmed_weight_kg,
      confirmed_weight_provenance: input.verification?.confirmed_weight_kg
        ? 'USER_CONFIRMED_SCALE_WEIGHMENT'
        : undefined,
      material_corrections: input.verification?.material_corrections,
      contamination_corrections: input.verification?.contamination_corrections,
      preparation_confirmation: input.verification?.preparation_confirmation,
      user_notes: input.verification?.user_notes,
      verification_disclosure: VERIFICATION_DISCLOSURE_STATEMENT,
    };

    // 6. Scenario Snapshot
    let scenarioSnapshot: PassportScenarioSnapshot;
    if (input.selected_scenario) {
      const s = input.selected_scenario;
      scenarioSnapshot = {
        scenario_id: s.scenario_id,
        scenario_type: s.scenario_type,
        title: s.title,
        selected_status: 'SELECTED_FOR_PASSPORT',
        effort_level: s.effort_level,
        modeled_contamination_percent: s.modeled_state.projected_contamination_percentage,
        modeled_recoverability_score: s.modeled_state.projected_recoverability_score,
        modeled_recoverability_grade: s.modeled_state.projected_recoverability_grade,
        modeled_economic_result: {
          min: s.modeled_state.projected_indicative_net_range?.min ?? 0,
          max: s.modeled_state.projected_indicative_net_range?.max ?? 0,
          currency: 'INR',
        },
        preparation_actions: s.actions || [],
        scenario_assumptions: s.assumptions || [],
        coefficient_metadata: s.modeling_coefficients,
        scenario_disclosure:
          'Snapshot of selected Phase 4 illustrative what-if optimization scenario modeling.',
      };
    } else {
      scenarioSnapshot = {
        scenario_id: 'SCENARIO_NONE',
        scenario_type: 'NONE',
        title: 'As-Is Unprepared Baseline',
        selected_status: 'SELECTED_FOR_PASSPORT',
        effort_level: 'NONE',
        modeled_contamination_percent: input.recovery_profile.contamination.percentage,
        modeled_recoverability_score: input.recovery_profile.recoverability.score,
        modeled_recoverability_grade: input.recovery_profile.recoverability.grade,
        modeled_economic_result: { min: 0, max: 0, currency: 'INR' },
        preparation_actions: [],
        scenario_assumptions: ['Baseline recovery without additional pre-dispatch preparation.'],
        scenario_disclosure:
          'Baseline visual recovery snapshot without what-if intervention modeling.',
      };
    }

    // 7. Routing Snapshot
    const routingSnapshot: PassportRoutingSnapshot = {
      routing_status: input.selected_route?.routing_status || 'PROVISIONAL',
      selected_facility_id: input.selected_route?.selected_facility_id,
      selected_facility_name: input.selected_route?.selected_facility_name,
      route_type:
        input.selected_route?.route_type ||
        input.recovery_profile.recovery_decision?.routing_strategy ||
        'SINGLE_FACILITY',
      split_routes: input.selected_route?.split_routes || [],
      routing_rationale:
        input.selected_route?.routing_rationale ||
        input.recovery_profile.recovery_decision?.routing_rationale ||
        'Provisional routing strategy based on visual batch assessment.',
      preparation_requirements:
        input.selected_route?.preparation_requirements ||
        input.recovery_profile.recommended_preparation ||
        [],
      indicative_payout_range: input.selected_route?.indicative_payout_range || { min: 0, max: 0 },
    };

    // 8. Assemble Core Payload without integrity
    const basePassport: Omit<BatchRecoveryPassport, 'integrity'> = {
      passport_id: passportId,
      scan_id: input.scan_id,
      created_at: createdAt,
      schema_version: '1.0',
      evidence_snapshot: evidenceSnapshot,
      verification_snapshot: verificationSnapshot,
      scenario_snapshot: scenarioSnapshot,
      routing_snapshot: routingSnapshot,
      snapshot_disclosure: SNAPSHOT_DISCLOSURE_STATEMENT,
    };

    // 9. Compute Integrity Hash
    const integrity = this.computePassportHash(basePassport);

    // 10. Return Complete Structured Passport
    return {
      ...basePassport,
      integrity,
    };
  }
}

export const passportService = new PassportService();
