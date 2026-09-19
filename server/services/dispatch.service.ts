import crypto from 'crypto';
import { z } from 'zod';
import {
  BatchRecoveryPassport,
  CreateDispatchInput,
  DispatchChecklistItem,
  DispatchMaterialFraction,
  RecoveryDispatchManifest,
} from '../../src/types/recyclens.types.ts';
import { passportService } from './passport.service.ts';

export const DISPATCH_DISCLOSURE_STATEMENT =
  'This Recovery Dispatch Manifest is an operational preparation record generated from verified digital Recovery Passport parameters and modeled recovery scenarios. It specifies batch preparation requirements and routing recommendations, but does not constitute certified weighbridge documentation, physical custody transfer, legal ownership certification, or guaranteed commercial settlement.';

// Defensive Zod schema for dispatch creation
export const createDispatchSchema = z.object({
  passport: z.custom<BatchRecoveryPassport>((val) => {
    return val && typeof val === 'object' && 'passport_id' in val && 'integrity' in val;
  }, 'Valid BatchRecoveryPassport object is required.'),
  override_facility_id: z.string().max(100).optional(),
  override_facility_name: z.string().max(200).optional(),
  handling_notes: z.array(z.string().max(500)).max(20).optional(),
});

export class DispatchService {
  /**
   * Generates a unique dispatch manifest identifier in the format DSP-YYYY-<16 HEX CHARS>.
   * Uses 64-bit cryptographically secure randomness.
   */
  private generateManifestId(createdAt: string): string {
    const year = new Date(createdAt).getUTCFullYear();
    const randomEntropy = crypto.randomBytes(8).toString('hex').toUpperCase();
    return `DSP-${year}-${randomEntropy}`;
  }

  /**
   * Deterministically determines handling precautions based on material category and contamination.
   */
  public getHandlingPrecautions(
    primaryCategory: string,
    primaryMaterialCode: string,
    contaminationType: string,
    additionalNotes: string[] = []
  ): string[] {
    const precautions: string[] = [];

    const normCat = (primaryCategory || '').toUpperCase();
    const normCode = (primaryMaterialCode || '').toUpperCase();

    if (normCat === 'EWASTE' || normCode.includes('EWASTE') || normCode.includes('PCB')) {
      precautions.push(
        'Store in anti-static ESD containers; avoid hydraulic baling or shearing to prevent toxic dust and capacitor puncture.'
      );
      precautions.push(
        'Segregate heavy heat sinks and detachable backup batteries before mechanical processing.'
      );
    } else if (normCat === 'PAPER' || normCode.includes('PAPER') || normCode.includes('CARDBOARD')) {
      precautions.push(
        'Keep protected from atmospheric rain and moisture; strictly prevent water ingress to preserve cellulose fiber tensile strength.'
      );
      precautions.push(
        'Segregate heavily oil-saturated or food-soiled sections to avoid contamination deduction at pulper intake.'
      );
    } else if (normCat === 'METAL' || normCode.includes('ALUMINIUM') || normCode.includes('STEEL')) {
      precautions.push(
        'Confirm batch is completely free of closed pressurized aerosol canisters before baling or shredding.'
      );
      precautions.push(
        'Maintain magnetic separation between ferrous steel and non-ferrous aluminium scrap.'
      );
    } else if (normCat === 'GLASS' || normCode.includes('GLASS')) {
      precautions.push(
        'Do not compact in standard balers; handle in rigid cullet bins to prevent operator hazard and fragmentation.'
      );
    } else if (normCat === 'PLASTIC') {
      precautions.push(
        'Ensure liquid containers are completely drained of beverage/chemical residue to prevent microbial rot and moisture penalty.'
      );
      if (normCode.includes('PET')) {
        precautions.push(
          'Segregate opaque or colored closure caps where possible to achieve prime clear flake benchmark.'
        );
      }
    }

    if (contaminationType && !contaminationType.toLowerCase().includes('none') && !contaminationType.toLowerCase().includes('clean')) {
      precautions.push(`Contamination Alert: Visible ${contaminationType.replace(/_/g, ' ')} detected; handle with standard MRF PPE.`);
    }

    // Append custom caller notes up to limit
    if (additionalNotes && additionalNotes.length > 0) {
      precautions.push(...additionalNotes.slice(0, 5));
    }

    // Universal fallback precaution
    if (precautions.length === 0) {
      precautions.push('Standard dry recyclable handling protocol; keep protected from weather during transit.');
    }

    return Array.from(new Set(precautions)).slice(0, 8);
  }

  /**
   * Generates a scenario-aware Recovery Dispatch Manifest from a verified Recovery Passport.
   */
  public createDispatchManifest(input: CreateDispatchInput): RecoveryDispatchManifest {
    // 1. Validate input schema
    const validated = createDispatchSchema.parse(input);
    const passport = structuredClone(validated.passport) as BatchRecoveryPassport;

    // 2. Cryptographic integrity check: Do NOT issue dispatch for tampered passport
    const integrityCheck = passportService.verifyPassportIntegrity(passport);
    if (!integrityCheck.isValid) {
      throw new Error(
        `Passport integrity verification failed: ${integrityCheck.details || 'Hash mismatch'}. Cannot generate dispatch manifest from a tampered passport.`
      );
    }

    const createdAt = new Date().toISOString();
    const manifestId = this.generateManifestId(createdAt);

    // 3. Compute material breakdown with estimated kg distribution
    const totalWeightKg = passport.evidence_snapshot.batch_weight_kg;
    const materialBreakdown: DispatchMaterialFraction[] = [];

    if (passport.evidence_snapshot.composition && passport.evidence_snapshot.composition.length > 0) {
      for (const comp of passport.evidence_snapshot.composition) {
        const sharePct = comp.estimated_share_percent;
        const estKg = Math.round((totalWeightKg * (sharePct / 100)) * 100) / 100;
        materialBreakdown.push({
          material_code: comp.material_code,
          name: comp.material || comp.material_code,
          category: comp.category,
          estimated_share_percent: sharePct,
          estimated_weight_kg: estKg,
        });
      }
    } else {
      materialBreakdown.push({
        material_code: passport.evidence_snapshot.primary_material.code,
        name: passport.evidence_snapshot.primary_material.name,
        category: passport.evidence_snapshot.primary_material.category,
        estimated_share_percent: 100,
        estimated_weight_kg: totalWeightKg,
      });
    }

    // 4. Construct preparation checklist from scenario snapshot
    const checklist: DispatchChecklistItem[] = [];

    if (passport.scenario_snapshot.preparation_actions && passport.scenario_snapshot.preparation_actions.length > 0) {
      for (const action of passport.scenario_snapshot.preparation_actions) {
        checklist.push({
          action_id: action.action_id,
          title: action.title,
          required: true,
          rationale: action.rationale,
          observed_basis: action.observed_basis,
          completed: false,
        });
      }
    } else if (passport.routing_snapshot.preparation_requirements && passport.routing_snapshot.preparation_requirements.length > 0) {
      passport.routing_snapshot.preparation_requirements.forEach((req, idx) => {
        checklist.push({
          action_id: `req-${idx + 1}`,
          title: req,
          required: true,
          rationale: 'Specified in recovery routing protocol',
          completed: false,
        });
      });
    }

    // 5. Handling precautions
    const precautions = this.getHandlingPrecautions(
      passport.evidence_snapshot.primary_material.category,
      passport.evidence_snapshot.primary_material.code,
      passport.evidence_snapshot.contamination.type,
      validated.handling_notes
    );

    // 6. Target facility information
    const facilityName =
      validated.override_facility_name ||
      passport.routing_snapshot.selected_facility_name ||
      'Designated Regional Material Recovery Facility';

    const facilityId =
      validated.override_facility_id ||
      passport.routing_snapshot.selected_facility_id;

    // 7. Assemble Complete Manifest
    const manifest: RecoveryDispatchManifest = {
      manifest_id: manifestId,
      passport_id: passport.passport_id,
      scan_id: passport.scan_id,
      created_at: createdAt,
      selected_scenario_id: passport.scenario_snapshot.scenario_id,
      selected_scenario_type: passport.scenario_snapshot.scenario_type,
      scenario_title: passport.scenario_snapshot.title,
      target_facility: {
        facility_id: facilityId,
        facility_name: facilityName,
        route_type: passport.routing_snapshot.route_type,
      },
      material_breakdown: materialBreakdown,
      batch_weight_kg: totalWeightKg,
      weight_provenance: passport.evidence_snapshot.weight_provenance,
      preparation_checklist: checklist,
      handling_precautions: precautions,
      modeled_expectations: {
        projected_contamination_percent: passport.scenario_snapshot.modeled_contamination_percent,
        projected_recoverability_grade: passport.scenario_snapshot.modeled_recoverability_grade,
        projected_indicative_net_range: {
          min: passport.scenario_snapshot.modeled_economic_result.min,
          max: passport.scenario_snapshot.modeled_economic_result.max,
          currency: 'INR',
        },
      },
      dispatch_disclosure: DISPATCH_DISCLOSURE_STATEMENT,
    };

    return manifest;
  }
}

export const dispatchService = new DispatchService();
