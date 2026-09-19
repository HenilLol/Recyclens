import {
  RecoveryProfile,
  ValuationBreakdown,
  OptimizationScenario,
  OptimizationComparison,
  PreparationActionEvidence,
  ScenarioType,
  EffortLevel,
  RoutingEffectStrategy,
  QualityGrade,
  BatchComponent,
} from '../../src/types/recyclens.types.ts';
import { valuationService } from './valuation.service.ts';

// =============================================================================
// CENTRALIZED CONFIGURATION & ILLUSTRATIVE MODELING CONSTANTS
// Explicit illustrative scenario assumptions governing deterministic projections.
// Note: These coefficients are transparent scenario modeling assumptions rather
// than empirically validated recovery efficiencies, industry standards, or
// scientifically established constants.
// =============================================================================
export const ILLUSTRATIVE_SCENARIO_COEFFICIENTS = {
  // Illustrative relative contamination reduction coefficients per scenario tier
  CONTAMINATION_REDUCTION: {
    MINIMAL_PREPARATION: 0.35, // Illustrative assumption: models ~35% relative reduction of current contamination
    RECOMMENDED_PREPARATION: 0.65, // Illustrative assumption: models ~65% relative reduction
    MAXIMUM_SEPARATION: 0.85, // Illustrative assumption: models ~85% relative reduction
  },
  // Illustrative recoverability score headroom capture coefficients (% of remaining headroom to 100)
  RECOVERABILITY_IMPROVEMENT: {
    MINIMAL_PREPARATION: 0.25, // Illustrative assumption: models capturing 25% of headroom between current and 100
    RECOMMENDED_PREPARATION: 0.55, // Illustrative assumption: models capturing 55% of headroom
    MAXIMUM_SEPARATION: 0.80, // Illustrative assumption: models capturing 80% of headroom
  },
  // Mathematical safety bounds (honesty constraints to prevent false-zero and false-perfection projections)
  SCENARIO_MIN_CONTAMINATION_FLOOR: 2.0, // Illustrative scenario floor used to prevent false-zero projections
  SCENARIO_MAX_RECOVERABILITY_CEILING: 98.0, // Illustrative scenario ceiling used to prevent false-perfection projections
  SCENARIO_MIN_RECOVERABILITY_FLOOR: 10.0,

  // Behavioral product heuristic: below this threshold, RecycLens suppresses generic
  // decontamination recommendations to avoid unnecessary dock intervention. This is NOT
  // a physical cleanliness standard or commercial purity limit.
  ACTION_SUPPRESSION_THRESHOLD_PERCENT: 5.0,
  ILLUSTRATIVE_ACTION_SUPPRESSION_HEURISTIC: 5.0,
  CLEAN_THRESHOLD_PERCENT: 5.0, // Backward-compatible alias
} as const;

// Backward-compatible alias preserving existing test and controller references
export const OPTIMIZATION_CONFIG = {
  CONTAMINATION_REDUCTION: ILLUSTRATIVE_SCENARIO_COEFFICIENTS.CONTAMINATION_REDUCTION,
  RECOVERABILITY_IMPROVEMENT: ILLUSTRATIVE_SCENARIO_COEFFICIENTS.RECOVERABILITY_IMPROVEMENT,
  SCENARIO_MIN_CONTAMINATION_FLOOR: ILLUSTRATIVE_SCENARIO_COEFFICIENTS.SCENARIO_MIN_CONTAMINATION_FLOOR,
  SCENARIO_MAX_RECOVERABILITY_CEILING: ILLUSTRATIVE_SCENARIO_COEFFICIENTS.SCENARIO_MAX_RECOVERABILITY_CEILING,
  MIN_RESIDUAL_CONTAMINATION_PERCENT: ILLUSTRATIVE_SCENARIO_COEFFICIENTS.SCENARIO_MIN_CONTAMINATION_FLOOR,
  MAX_RECOVERABILITY_SCORE: ILLUSTRATIVE_SCENARIO_COEFFICIENTS.SCENARIO_MAX_RECOVERABILITY_CEILING,
  MIN_RECOVERABILITY_SCORE: ILLUSTRATIVE_SCENARIO_COEFFICIENTS.SCENARIO_MIN_RECOVERABILITY_FLOOR,
  ACTION_SUPPRESSION_THRESHOLD_PERCENT: ILLUSTRATIVE_SCENARIO_COEFFICIENTS.ACTION_SUPPRESSION_THRESHOLD_PERCENT,
  ILLUSTRATIVE_ACTION_SUPPRESSION_HEURISTIC: ILLUSTRATIVE_SCENARIO_COEFFICIENTS.ILLUSTRATIVE_ACTION_SUPPRESSION_HEURISTIC,
  CLEAN_THRESHOLD_PERCENT: ILLUSTRATIVE_SCENARIO_COEFFICIENTS.CLEAN_THRESHOLD_PERCENT,
} as const;

// =============================================================================
// MATERIAL / ACTION COMPATIBILITY MATRIX
// Deterministic rules governing technically appropriate preparation interventions.
// =============================================================================
export type PreparationActionType =
  | 'SEGREGATION'
  | 'DRY_CLEANING'
  | 'LIQUID_DRAINAGE'
  | 'AQUEOUS_WASHING'
  | 'COMPACTION_BALING'
  | 'SPECIALIZED_HANDLING';

export type ActionCompatibility = 'ALLOWED' | 'CONDITIONALLY_ALLOWED' | 'BLOCKED';

export const MATERIAL_ACTION_COMPATIBILITY_MATRIX: Record<string, Record<PreparationActionType, ActionCompatibility>> = {
  PLASTIC_PET: {
    SEGREGATION: 'ALLOWED',
    DRY_CLEANING: 'ALLOWED',
    LIQUID_DRAINAGE: 'ALLOWED',
    AQUEOUS_WASHING: 'CONDITIONALLY_ALLOWED', // Only on rigid containers with water-soluble residue/dirt evidence; never blanket wash on mixed debris
    COMPACTION_BALING: 'ALLOWED',
    SPECIALIZED_HANDLING: 'CONDITIONALLY_ALLOWED',
  },
  PLASTIC_PP: {
    SEGREGATION: 'ALLOWED',
    DRY_CLEANING: 'ALLOWED',
    LIQUID_DRAINAGE: 'ALLOWED',
    AQUEOUS_WASHING: 'CONDITIONALLY_ALLOWED',
    COMPACTION_BALING: 'ALLOWED',
    SPECIALIZED_HANDLING: 'CONDITIONALLY_ALLOWED',
  },
  PLASTIC_HDPE: {
    SEGREGATION: 'ALLOWED',
    DRY_CLEANING: 'ALLOWED',
    LIQUID_DRAINAGE: 'ALLOWED',
    AQUEOUS_WASHING: 'CONDITIONALLY_ALLOWED',
    COMPACTION_BALING: 'ALLOWED',
    SPECIALIZED_HANDLING: 'CONDITIONALLY_ALLOWED',
  },
  PAPER_CARDBOARD: {
    SEGREGATION: 'ALLOWED',
    DRY_CLEANING: 'ALLOWED', // Dry mechanical shaking, manual excision of soiled sections
    LIQUID_DRAINAGE: 'BLOCKED', // Liquid causes cellulose dissolution and fiber rot
    AQUEOUS_WASHING: 'BLOCKED', // Water dissolves cellulose fibers and destroys pulp strength
    COMPACTION_BALING: 'ALLOWED',
    SPECIALIZED_HANDLING: 'CONDITIONALLY_ALLOWED',
  },
  METAL_ALUMINIUM: {
    SEGREGATION: 'ALLOWED',
    DRY_CLEANING: 'ALLOWED',
    LIQUID_DRAINAGE: 'ALLOWED',
    AQUEOUS_WASHING: 'CONDITIONALLY_ALLOWED',
    COMPACTION_BALING: 'ALLOWED',
    SPECIALIZED_HANDLING: 'CONDITIONALLY_ALLOWED',
  },
  METAL_STEEL: {
    SEGREGATION: 'ALLOWED',
    DRY_CLEANING: 'ALLOWED',
    LIQUID_DRAINAGE: 'ALLOWED',
    AQUEOUS_WASHING: 'CONDITIONALLY_ALLOWED',
    COMPACTION_BALING: 'ALLOWED',
    SPECIALIZED_HANDLING: 'CONDITIONALLY_ALLOWED',
  },
  EWASTE_PCB: {
    SEGREGATION: 'ALLOWED',
    DRY_CLEANING: 'ALLOWED', // Anti-static dry brushing, low-pressure compressed air
    LIQUID_DRAINAGE: 'BLOCKED',
    AQUEOUS_WASHING: 'BLOCKED', // Aqueous wash shorts conductive traces and corrodes IC pins
    COMPACTION_BALING: 'BLOCKED', // Hydraulic baling crushes chips, punctures capacitors, releases toxic dust
    SPECIALIZED_HANDLING: 'ALLOWED', // Anti-static palletizing, specialized dismantling
  },
  GLASS_CULLET: {
    SEGREGATION: 'ALLOWED',
    DRY_CLEANING: 'ALLOWED', // Screening particulate/grit
    LIQUID_DRAINAGE: 'ALLOWED',
    AQUEOUS_WASHING: 'CONDITIONALLY_ALLOWED',
    COMPACTION_BALING: 'BLOCKED', // Glass cannot be baled; crushing requires dedicated cullet breaker
    SPECIALIZED_HANDLING: 'CONDITIONALLY_ALLOWED',
  },
  OTHER: {
    SEGREGATION: 'ALLOWED',
    DRY_CLEANING: 'ALLOWED',
    LIQUID_DRAINAGE: 'CONDITIONALLY_ALLOWED',
    AQUEOUS_WASHING: 'BLOCKED', // Heterogeneous unsegregated "OTHER" streams cannot receive blanket wash
    COMPACTION_BALING: 'CONDITIONALLY_ALLOWED',
    SPECIALIZED_HANDLING: 'ALLOWED',
  },
};

// Shorthand aliases ensuring direct dictionary lookup by standard material names
MATERIAL_ACTION_COMPATIBILITY_MATRIX['PET'] = MATERIAL_ACTION_COMPATIBILITY_MATRIX['PLASTIC_PET'];
MATERIAL_ACTION_COMPATIBILITY_MATRIX['PP'] = MATERIAL_ACTION_COMPATIBILITY_MATRIX['PLASTIC_PP'];
MATERIAL_ACTION_COMPATIBILITY_MATRIX['HDPE'] = MATERIAL_ACTION_COMPATIBILITY_MATRIX['PLASTIC_HDPE'];
MATERIAL_ACTION_COMPATIBILITY_MATRIX['GLASS'] = MATERIAL_ACTION_COMPATIBILITY_MATRIX['GLASS_CULLET'];

export function getActionCompatibility(materialCode: string, actionType: PreparationActionType): ActionCompatibility {
  const normCode = (materialCode || '').toUpperCase();
  if (MATERIAL_ACTION_COMPATIBILITY_MATRIX[normCode]) {
    return MATERIAL_ACTION_COMPATIBILITY_MATRIX[normCode][actionType];
  }
  if (normCode === 'PET' || normCode.startsWith('PLASTIC_PET')) return MATERIAL_ACTION_COMPATIBILITY_MATRIX['PLASTIC_PET'][actionType];
  if (normCode === 'PP' || normCode.startsWith('PLASTIC_PP')) return MATERIAL_ACTION_COMPATIBILITY_MATRIX['PLASTIC_PP'][actionType];
  if (normCode === 'HDPE' || normCode.startsWith('PLASTIC_HDPE')) return MATERIAL_ACTION_COMPATIBILITY_MATRIX['PLASTIC_HDPE'][actionType];
  if (normCode === 'GLASS' || normCode.startsWith('GLASS_')) return MATERIAL_ACTION_COMPATIBILITY_MATRIX['GLASS_CULLET'][actionType];
  if (normCode.startsWith('PLASTIC_')) return MATERIAL_ACTION_COMPATIBILITY_MATRIX['PLASTIC_PET'][actionType];
  if (normCode.startsWith('METAL_')) return MATERIAL_ACTION_COMPATIBILITY_MATRIX['METAL_ALUMINIUM'][actionType];
  if (normCode.startsWith('EWASTE_')) return MATERIAL_ACTION_COMPATIBILITY_MATRIX['EWASTE_PCB'][actionType];
  if (normCode.startsWith('PAPER_')) return MATERIAL_ACTION_COMPATIBILITY_MATRIX['PAPER_CARDBOARD'][actionType];
  return MATERIAL_ACTION_COMPATIBILITY_MATRIX['OTHER'][actionType];
}

export class OptimizationService {
  /**
   * Generates deterministic what-if recovery optimization intelligence.
   */
  public generateOptimizationIntelligence(params: {
    profile: RecoveryProfile;
    valuation: ValuationBreakdown;
    effectiveWeightKg: number;
    isUserSpecifiedWeight: boolean;
    userConfirmedContamination?: number;
  }): {
    scenarios: OptimizationScenario[];
    comparison: OptimizationComparison;
  } {
    const { profile, valuation, effectiveWeightKg, isUserSpecifiedWeight, userConfirmedContamination } = params;

    // Determine current baseline state with safe clamping
    const rawContam = typeof userConfirmedContamination === 'number'
      ? userConfirmedContamination
      : (typeof profile.contamination?.percentage === 'number' ? profile.contamination.percentage : 10.0);
    const currentContam = isNaN(rawContam) ? 10.0 : Math.max(0, Math.min(100, rawContam));

    const rawRecover = typeof profile.recoverability?.score === 'number' ? profile.recoverability.score : 50.0;
    const currentRecover = isNaN(rawRecover) ? 50.0 : Math.max(0, Math.min(100, rawRecover));
    const currentGrade = profile.recoverability?.grade || 'GRADE_B';
    const isMultiMaterial = profile.composition && profile.composition.length > 1;
    const separableComponents = profile.composition
      ? profile.composition.filter((c) => c.is_separable && c.estimated_share_percent >= 5)
      : [];

    const weightBasis = isUserSpecifiedWeight
      ? ('USER_CONFIRMED_SCALE_WEIGHMENT' as const)
      : ('ILLUSTRATIVE_VISUAL_PROJECTION' as const);

    const dataOrigin = typeof userConfirmedContamination === 'number'
      ? ('USER_CONFIRMED' as const)
      : profile.is_fallback_inference
      ? ('MODEL_ESTIMATED' as const)
      : ('OBSERVED' as const);

    // Generate grounded preparation actions based on evidence
    const availableActions = this.deriveGroundedActions(profile, currentContam);

    // Generate up to 3 deterministic scenarios
    const scenarios: OptimizationScenario[] = [];

    // Scenario 1: MINIMAL_PREPARATION (Effort: LOW)
    const minimalScenario = this.buildScenario({
      scenarioType: 'MINIMAL_PREPARATION',
      profile,
      valuation,
      effectiveWeightKg,
      isUserSpecifiedWeight,
      currentContam,
      currentRecover,
      currentGrade,
      availableActions,
      weightBasis,
      dataOrigin,
    });
    if (minimalScenario) scenarios.push(minimalScenario);

    // Scenario 2: RECOMMENDED_PREPARATION (Effort: MEDIUM)
    const recommendedScenario = this.buildScenario({
      scenarioType: 'RECOMMENDED_PREPARATION',
      profile,
      valuation,
      effectiveWeightKg,
      isUserSpecifiedWeight,
      currentContam,
      currentRecover,
      currentGrade,
      availableActions,
      weightBasis,
      dataOrigin,
    });
    if (recommendedScenario) scenarios.push(recommendedScenario);

    // Scenario 3: MAXIMUM_SEPARATION (Effort: HIGH)
    // Only generate MAXIMUM_SEPARATION if batch has separable multi-material streams OR high contamination
    if (isMultiMaterial && separableComponents.length > 0 || currentContam >= 20.0) {
      const maxSeparationScenario = this.buildScenario({
        scenarioType: 'MAXIMUM_SEPARATION',
        profile,
        valuation,
        effectiveWeightKg,
        isUserSpecifiedWeight,
        currentContam,
        currentRecover,
        currentGrade,
        availableActions,
        weightBasis,
        dataOrigin,
      });
      if (maxSeparationScenario) scenarios.push(maxSeparationScenario);
    }

    // Build side-by-side comparison matrix
    const comparison = this.buildComparisonMatrix(profile, valuation, scenarios, dataOrigin);

    return { scenarios, comparison };
  }

  /**
   * Derives concrete preparation actions strictly grounded in observed evidence
   * and centralized material compatibility rules (MATERIAL_ACTION_COMPATIBILITY_MATRIX).
   * High contamination ALONE does not generate surface washing.
   * Heterogeneous mixed batches never receive blanket washing recommendations.
   */
  private deriveGroundedActions(profile: RecoveryProfile, currentContam: number): PreparationActionEvidence[] {
    const actions: PreparationActionEvidence[] = [];
    const contamType = (profile.contamination.type || '').toUpperCase();
    const contamExplanation = profile.contamination.explanation || '';
    const indicators = (profile.contamination.visual_indicators || []).map((i) => i.toLowerCase());
    const evidence = (profile.contamination_evidence || []).map((e) => e.toLowerCase());

    // Product heuristic: below this threshold, generic decontamination recommendations are suppressed
    const isBelowSuppressionThreshold = currentContam < OPTIMIZATION_CONFIG.ACTION_SUPPRESSION_THRESHOLD_PERCENT;

    const primaryCode = (profile.primary_material.code || '').toUpperCase();
    const isMultiMaterial = Boolean(profile.composition && profile.composition.length > 1);

    // -------------------------------------------------------------------------
    // 1. SEGREGATION ACTIONS (First-order priority for multi-material batches)
    // -------------------------------------------------------------------------
    if (isMultiMaterial && profile.composition) {
      const separable = profile.composition.filter((c) => c.is_separable && c.estimated_share_percent >= 5);
      for (const comp of separable) {
        const compEvidence = comp.visual_evidence?.[0] || `Visually distinct ${comp.material} fraction`;
        actions.push({
          action_id: `action-segregate-${comp.material_code.toLowerCase()}`,
          title: `Detach & Segregate ${comp.material}`,
          observed_basis: compEvidence,
          rationale: `Mixing ${comp.material} with ${profile.primary_material.name} contaminates the recovery stream. Physical segregation unlocks dedicated clean-stream pricing and prevents downcycling.`,
          scenario_assumption: `Assumes manual or mechanical detachment of ${comp.material} prior to batch consolidation.`,
          modeled_effect: `Preserves high-purity benchmark for ${profile.primary_material.name} while generating a secondary realizable stream.`,
          uncertainty: 'Adhesive residues or thermal bonding may prevent complete 100% mechanical separation.',
          affected_material_codes: [comp.material_code, profile.primary_material.code],
        });
      }
    }

    // -------------------------------------------------------------------------
    // 2. LIQUID DRAINAGE (Grounded in explicit liquid/pooling/droplet evidence)
    // -------------------------------------------------------------------------
    const liquidEvidenceStr =
      (profile.contamination_evidence || []).find((e) =>
        /droplet|liquid|beverage|moisture|pooling|condensation|syrup/i.test(e)
      ) ||
      (profile.contamination.visual_indicators || []).find((i) =>
        /droplet|liquid|beverage|moisture|pooling|condensation|syrup/i.test(i)
      ) ||
      (/liquid|beverage/i.test(contamType) ? contamExplanation : undefined);

    if (liquidEvidenceStr && !isBelowSuppressionThreshold) {
      if (isMultiMaterial && profile.composition) {
        // Find liquid-compatible container fraction (e.g. PET, HDPE, PP, Glass)
        const liquidComp = profile.composition.find(
          (c) => getActionCompatibility(c.material_code, 'LIQUID_DRAINAGE') === 'ALLOWED'
        );
        if (liquidComp) {
          actions.push({
            action_id: 'action-drain-residuals',
            title: `Drain Residual Liquids from ${liquidComp.material} Fraction`,
            observed_basis: liquidEvidenceStr,
            rationale: `Residual beverages and liquids trapped inside ${liquidComp.material} cause biological mould and scale deductions. Draining must be scoped specifically to containers to avoid wetting moisture-sensitive fractions.`,
            scenario_assumption: `Assumes containers in the ${liquidComp.material} stream are inverted, pierced, or gravity-drained of free liquid after segregation.`,
            modeled_effect: `Projected reduction in contamination penalty deduction by eliminating moisture weight.`,
            uncertainty: 'Internal sticky syrupy residue inside opaque containers cannot be verified without physical rinsing.',
            affected_material_codes: [liquidComp.material_code],
          });
        }
      } else {
        const drainageCompatibility = getActionCompatibility(primaryCode, 'LIQUID_DRAINAGE');
        if (drainageCompatibility !== 'BLOCKED') {
          actions.push({
            action_id: 'action-drain-residuals',
            title: `Drain Free Residual Liquids & Moisture from ${profile.primary_material.name} Containers`,
            observed_basis: liquidEvidenceStr,
            rationale: 'Residual beverages and liquids cause biological mould, attract pests, and impose weight deductions at facility intake scales.',
            scenario_assumption: 'Assumes containers are inverted, pierced, or gravity-drained of free-flowing liquid prior to baling.',
            modeled_effect: 'Projected reduction in gross contamination penalty deduction by eliminating moisture weight.',
            uncertainty: 'Internal sticky syrupy residue inside opaque containers cannot be verified without physical rinsing.',
            affected_material_codes: [profile.primary_material.code],
          });
        }
      }
    }

    // -------------------------------------------------------------------------
    // 3. DRY CLEANING / DUSTING / TRIMMING (Grounded in particulate/dust/grease evidence)
    // -------------------------------------------------------------------------
    const particulateEvidenceStr =
      (profile.contamination_evidence || []).find((e) =>
        /dirt|soil|stain|grease|particulate|dust|sand|grit|mud|sludge/i.test(e)
      ) ||
      (profile.contamination.visual_indicators || []).find((i) =>
        /dirt|soil|stain|grease|particulate|dust|sand|grit|mud|sludge/i.test(i)
      ) ||
      (/soil|grease|organic|particulate|dust|mud/i.test(contamType) ? contamExplanation : undefined);

    if (particulateEvidenceStr && !isBelowSuppressionThreshold) {
      if (isMultiMaterial && profile.composition) {
        const ewasteComp = profile.composition.find((c) => c.material_code.toUpperCase().startsWith('EWASTE'));
        if (ewasteComp) {
          actions.push({
            action_id: 'action-ewaste-dusting',
            title: `Dry Particulate Dusting & Blowout for ${ewasteComp.material} Fraction`,
            observed_basis: particulateEvidenceStr,
            rationale: `Aqueous washing damages conductive PCB traces and risks component short-circuiting. Low-pressure dry air or anti-static brushing safely clears foreign particles after detachment.`,
            scenario_assumption: `Assumes controlled dry particulate blowout or manual anti-static brushing on ${ewasteComp.material} without aqueous contact.`,
            modeled_effect: `Projected reduction in particulate penalty while preventing moisture damage to sensitive circuitry.`,
            uncertainty: 'Subsurface solder oxidation and component-level corrosion cannot be resolved by surface dusting.',
            affected_material_codes: [ewasteComp.material_code],
          });
        }
        const paperComp = profile.composition.find((c) => c.material_code.toUpperCase().startsWith('PAPER'));
        if (paperComp) {
          actions.push({
            action_id: 'action-paper-trimming',
            title: `Dry Shaking & Contaminated Section Trimming for ${paperComp.material} Fraction`,
            observed_basis: particulateEvidenceStr,
            rationale: `Aqueous washing degrades cellulose paper fibers and dissolves pulp slurry. Dry mechanical shaking or trimming heavily stained sections prevents baling spoilage.`,
            scenario_assumption: `Assumes dry mechanical separation or manual trimming of non-pulpable stained sections on ${paperComp.material} prior to baling.`,
            modeled_effect: `Prevents batch degradation at reprocessor pulper intake.`,
            uncertainty: 'Deeply absorbed food oils cannot be excised without discarding affected fiber mass.',
            affected_material_codes: [paperComp.material_code],
          });
        }
      } else {
        if (primaryCode.startsWith('EWASTE_')) {
          actions.push({
            action_id: 'action-ewaste-dusting',
            title: `Dry Particulate Dusting & Component Blowout for ${profile.primary_material.name}`,
            observed_basis: particulateEvidenceStr,
            rationale: 'Aqueous washing damages conductive PCB traces and risks component short-circuiting. Low-pressure dry air or anti-static brushing safely clears foreign particles.',
            scenario_assumption: 'Assumes controlled dry particulate blowout or manual anti-static brushing without aqueous liquid contact.',
            modeled_effect: 'Projected reduction in particulate penalty while preventing moisture damage to sensitive circuitry.',
            uncertainty: 'Subsurface solder oxidation and component-level corrosion cannot be resolved by surface dusting.',
            affected_material_codes: [profile.primary_material.code],
          });
        } else if (primaryCode.startsWith('PAPER_')) {
          actions.push({
            action_id: 'action-paper-trimming',
            title: `Dry Shaking & Contaminated Section Segregation for ${profile.primary_material.name}`,
            observed_basis: particulateEvidenceStr,
            rationale: 'Aqueous washing degrades cellulose paper fibers and dissolves pulp slurry. Dry mechanical shaking or trimming heavily stained sections prevents baling spoilage.',
            scenario_assumption: 'Assumes dry mechanical separation or manual trimming of non-pulpable stained sections prior to baling.',
            modeled_effect: 'Prevents batch degradation at reprocessor pulper intake.',
            uncertainty: 'Deeply absorbed food oils cannot be excised without discarding affected fiber mass.',
            affected_material_codes: [profile.primary_material.code],
          });
        }
      }
    }

    // -------------------------------------------------------------------------
    // 4. AQUEOUS WASHING (Strictly evidence-grounded & material-compatible)
    // High contamination ALONE does NOT generate washing.
    // Blanket washing of mixed heterogeneous batches is STRICTLY PROHIBITED.
    // -------------------------------------------------------------------------
    const solubleEvidenceStr =
      (profile.contamination_evidence || []).find((e) =>
        /mud|sludge|syrup|sticky residue|grease film|caked soil|soluble/i.test(e)
      ) ||
      (profile.contamination.visual_indicators || []).find((i) =>
        /mud|sludge|syrup|sticky|caked|wash/i.test(i)
      ) ||
      (/mud|sludge|syrup|sticky/i.test(contamType) ? contamExplanation : undefined);

    const washCompatibility = getActionCompatibility(primaryCode, 'AQUEOUS_WASHING');

    if (solubleEvidenceStr && !isBelowSuppressionThreshold && washCompatibility !== 'BLOCKED') {
      if (isMultiMaterial && profile.composition) {
        // For mixed batches: ONLY derive washing for a specific rigid washable fraction
        const washableComp = profile.composition.find(
          (c) =>
            ['PLASTIC_PET', 'PLASTIC_HDPE', 'PLASTIC_PP', 'GLASS_CULLET', 'METAL_ALUMINIUM'].includes(
              c.material_code.toUpperCase()
            ) && getActionCompatibility(c.material_code, 'AQUEOUS_WASHING') === 'CONDITIONALLY_ALLOWED'
        );

        if (washableComp) {
          actions.push({
            action_id: `action-targeted-wash-${washableComp.material_code.toLowerCase()}`,
            title: `Post-Segregation Targeted Wash for ${washableComp.material} Fraction`,
            observed_basis: solubleEvidenceStr,
            rationale: `Post-segregation wash targets strictly the rigid ${washableComp.material} fraction. Blanket washing the heterogeneous mixed batch is prohibited to prevent fiber soaking, trapped water, and contaminated sludge.`,
            scenario_assumption: `Assumes mechanical wash tank pre-treatment is applied strictly to segregated ${washableComp.material} after physical sorting.`,
            modeled_effect: `Restores flake purity for ${washableComp.material} without waterlogging incompatible fractions.`,
            uncertainty: 'Chemical absorption or severe polymer yellowing may persist after wash.',
            affected_material_codes: [washableComp.material_code],
          });
        }
      } else if (!isMultiMaterial) {
        // Homogeneous washable material with explicit soluble residue evidence
        actions.push({
          action_id: 'action-surface-clean',
          title: `Surface Wash & Particulate Shaking for ${profile.primary_material.name}`,
          observed_basis: solubleEvidenceStr,
          rationale: 'Foreign grit, soil, and mineral dust accelerate shredder blade wear and reduce reprocessed flake purity.',
          scenario_assumption: 'Assumes mechanical shaking, dry brushing, or wash pre-treatment removes surface dust.',
          modeled_effect: 'Projected increase in batch recoverability grade and reduction in quality penalty.',
          uncertainty: 'Subsurface chemical absorption or polymer discoloration may persist after wash.',
          affected_material_codes: [profile.primary_material.code],
        });
      }
    }

    // -------------------------------------------------------------------------
    // 5. HANDLING & CONSOLIDATION (Material-aware logistics)
    // Grounded strictly in Phase 3 visual evidence or stream explanation.
    // For heterogeneous batches: actions MUST be explicitly scoped to compatible fractions.
    // Generic batch compaction is strictly prohibited if any present fraction is blocked.
    // -------------------------------------------------------------------------
    const observedVisualBasis =
      profile.visual_evidence?.[0] ||
      profile.contamination?.visual_indicators?.[0] ||
      profile.composition?.[0]?.visual_evidence?.[0] ||
      profile.visual_explanation;

    if (observedVisualBasis) {
      if (isMultiMaterial && profile.composition && profile.composition.length > 1) {
        // Heterogeneous batch handling: check fraction compatibility
        const hasBlockedCompaction = profile.composition.some(
          (c) => getActionCompatibility(c.material_code, 'COMPACTION_BALING') === 'BLOCKED'
        );

        // Glass handling if glass fraction is present
        const glassComp = profile.composition.find((c) =>
          c.material_code.toUpperCase().startsWith('GLASS')
        );
        if (glassComp) {
          actions.push({
            action_id: 'action-glass-bin-handling',
            title: `Consolidate ${glassComp.material} into Rigid Cullet Bins Post-Segregation`,
            observed_basis: glassComp.visual_evidence?.[0] || observedVisualBasis,
            rationale: `Glass cannot be hydraulically baled due to fragmentation and severe handling hazards. Placing segregated cullet into dedicated rigid bulk bins prevents shattering and material loss.`,
            scenario_assumption: `Assumes placement of sorted ${glassComp.material} into heavy-duty rigid bulk boxes or steel roll-off cullet bins.`,
            modeled_effect: `Ensures safe containment and compliant bulk transport to glass re-melting furnace.`,
            uncertainty: `Mixed glass color cullet cannot be optically sorted after transit breakage.`,
            affected_material_codes: [glassComp.material_code],
          });
        }

        // E-waste handling if e-waste fraction is present
        const ewasteComp = profile.composition.find((c) =>
          c.material_code.toUpperCase().startsWith('EWASTE')
        );
        if (ewasteComp) {
          actions.push({
            action_id: 'action-ewaste-consolidation',
            title: `Route ${ewasteComp.material} to Specialized Anti-Static Palletizing`,
            observed_basis: ewasteComp.visual_evidence?.[0] || observedVisualBasis,
            rationale: `Hydraulic baling crushes PCB components, risking capacitor punctures and toxic dust release. Protective palletizing ensures safe transit to authorized refiners.`,
            scenario_assumption: `Assumes anti-static protective packaging or palletized stacking after physical detachment.`,
            modeled_effect: `Preserves electronic component recovery yield and complies with safe electronics handling protocols.`,
            uncertainty: `Physical transit vibration may loosen damaged surface-mount components.`,
            affected_material_codes: [ewasteComp.material_code],
          });
        }

        // Compaction & Baling for compatible fractions in heterogeneous batch
        if (hasBlockedCompaction) {
          // One or more fractions are blocked from compaction (e.g. Glass or E-waste).
          // Generic batch compaction is BLOCKED. Generate fraction-scoped compaction only for balable components.
          const balableComps = profile.composition.filter(
            (c) =>
              getActionCompatibility(c.material_code, 'COMPACTION_BALING') === 'ALLOWED' &&
              c.estimated_share_percent >= 5
          );
          for (const comp of balableComps) {
            actions.push({
              action_id: `action-bale-compact-${comp.material_code.toLowerCase()}`,
              title: `Compact & Bale ${comp.material} Fraction After Physical Segregation`,
              observed_basis: comp.visual_evidence?.[0] || observedVisualBasis,
              rationale: `Mixed compaction is blocked because incompatible fractions in the batch (such as glass cullet or delicate assemblies) will shatter or release contaminants. Baling must be strictly confined to the segregated ${comp.material} fraction.`,
              scenario_assumption: `Assumes mechanical crushing or hydraulic baling into standardized high-density bundles is performed exclusively on the segregated ${comp.material} stream.`,
              modeled_effect: `Maximizes transit payload efficiency for the ${comp.material} channel while safeguarding unbalable streams from cross-contamination.`,
              uncertainty: `True post-baling volumetric density depends on baler compaction pressure.`,
              affected_material_codes: [comp.material_code],
            });
          }
        } else {
          // All components in the multi-material batch are balable (e.g. PET bottles + PP closures + Aluminium cans)
          actions.push({
            action_id: 'action-bale-compact',
            title: 'Compact & Bale Compatible Fractions After Physical Segregation',
            observed_basis: observedVisualBasis,
            rationale: `High volumetric bulk increases transport cost per kilogram. Baling compatible separated fractions into high-density bundles optimizes transit logistics.`,
            scenario_assumption: `Assumes manual crushing or hydraulic baling into standardized high-density bundles after stream sorting.`,
            modeled_effect: `Maximizes transit payload efficiency and aligns with standard aggregator handling preferences.`,
            uncertainty: `Baling does not alter polymer chemistry or visual contamination percentages.`,
            affected_material_codes: [profile.primary_material.code],
          });
        }
      } else {
        // Homogeneous batch handling
        if (primaryCode.startsWith('EWASTE_')) {
          actions.push({
            action_id: 'action-ewaste-consolidation',
            title: `Anti-Static Stacking & Protective Palletizing for ${profile.primary_material.name}`,
            observed_basis: observedVisualBasis,
            rationale: 'Hydraulic baling crushes PCB components, risking capacitor punctures and toxic dust release. Protective palletizing ensures safe transit to refiners.',
            scenario_assumption: 'Assumes anti-static protective boxing or palletized stacking rather than destructive hydraulic compaction.',
            modeled_effect: 'Preserves component recovery yield and complies with safe electronics handling protocols.',
            uncertainty: 'Physical transit vibration may loosen damaged surface-mount components.',
            affected_material_codes: [profile.primary_material.code],
          });
        } else if (primaryCode.startsWith('GLASS_')) {
          actions.push({
            action_id: 'action-glass-bin-handling',
            title: `Rigid Cullet Bin Consolidation for ${profile.primary_material.name}`,
            observed_basis: observedVisualBasis,
            rationale: 'Glass cannot be hydraulically baled. Rigid palletized bins prevent transit shattering hazard and cullet loss.',
            scenario_assumption: 'Assumes placement into heavy-duty rigid bulk boxes or steel roll-off cullet bins.',
            modeled_effect: 'Ensures safe containment and compliant bulk transport to glass furnace.',
            uncertainty: 'Mixed glass color cullet cannot be optically sorted after transit breakage.',
            affected_material_codes: [profile.primary_material.code],
          });
        } else if (getActionCompatibility(primaryCode, 'COMPACTION_BALING') !== 'BLOCKED') {
          actions.push({
            action_id: 'action-bale-compact',
            title: `Flatten, Bale & Compact ${profile.primary_material.name} Batch`,
            observed_basis: observedVisualBasis,
            rationale: 'High volumetric bulk increases transport cost per kilogram and limits aggregator collection payload efficiency.',
            scenario_assumption: 'Assumes manual crushing or hydraulic baling into standardized high-density bundles.',
            modeled_effect: 'Maximizes transit payload efficiency and aligns with standard aggregator handling preferences.',
            uncertainty: 'Baling does not alter polymer chemistry or visual contamination percentages.',
            affected_material_codes: [profile.primary_material.code],
          });
        }
      }
    }

    return actions;
  }

  /**
   * Deterministically constructs an OptimizationScenario based on configuration.
   */
  private buildScenario(params: {
    scenarioType: ScenarioType;
    profile: RecoveryProfile;
    valuation: ValuationBreakdown;
    effectiveWeightKg: number;
    isUserSpecifiedWeight: boolean;
    currentContam: number;
    currentRecover: number;
    currentGrade: QualityGrade;
    availableActions: PreparationActionEvidence[];
    weightBasis: 'ILLUSTRATIVE_VISUAL_PROJECTION' | 'USER_CONFIRMED_SCALE_WEIGHMENT';
    dataOrigin: 'OBSERVED' | 'MODEL_ESTIMATED' | 'USER_CONFIRMED';
  }): OptimizationScenario | null {
    const {
      scenarioType,
      profile,
      effectiveWeightKg,
      isUserSpecifiedWeight,
      currentContam,
      currentRecover,
      availableActions,
      weightBasis,
      dataOrigin,
    } = params;

    const isBelowSuppressionThreshold = currentContam < OPTIMIZATION_CONFIG.ACTION_SUPPRESSION_THRESHOLD_PERCENT;
    const isMultiMaterial = profile.composition && profile.composition.length > 1;

    // Filter relevant actions for this scenario tier
    let tierActions: PreparationActionEvidence[] = [];
    let effortLevel: EffortLevel = 'LOW';
    let title = '';
    let description = '';
    let assumptions: string[] = [];
    let uncertainties: string[] = [];
    let reductionFactor = 0;
    let improvementFactor = 0;

    if (scenarioType === 'MINIMAL_PREPARATION') {
      effortLevel = 'LOW';
      reductionFactor = OPTIMIZATION_CONFIG.CONTAMINATION_REDUCTION.MINIMAL_PREPARATION;
      improvementFactor = OPTIMIZATION_CONFIG.RECOVERABILITY_IMPROVEMENT.MINIMAL_PREPARATION;
      title = 'Minimal Quick-Intervention Baseline';
      description = isBelowSuppressionThreshold
        ? 'Basic compaction and transport preparation for batch below action-suppression threshold. No intensive decontamination required.'
        : 'Immediate low-effort dock interventions: free liquid drainage and coarse debris removal.';

      tierActions = availableActions.filter(
        (a) =>
          a.action_id.startsWith('action-drain-') ||
          a.action_id.startsWith('action-bale-compact') ||
          a.action_id.startsWith('action-ewaste-consolidation') ||
          a.action_id.startsWith('action-glass-bin-handling')
      );
      if (tierActions.length === 0) tierActions = availableActions.slice(0, 1);

      assumptions = [
        'Interventions modeled at a LOW EFFORT level using manual pre-sorting without specialized mechanical wash equipment.',
        isBelowSuppressionThreshold
          ? 'Batch contamination is below the illustrative action-suppression threshold (5.0%); interventions focus on logistics consolidation rather than decontamination.'
          : 'Free-flowing liquids and gross particulate are removed.',
      ];
      uncertainties = [
        'Internal surface moisture and adhered dirt are not treated in minimal tier.',
        'True post-intervention mass requires dock scale weighment.',
      ];
    } else if (scenarioType === 'RECOMMENDED_PREPARATION') {
      effortLevel = 'MEDIUM';
      reductionFactor = OPTIMIZATION_CONFIG.CONTAMINATION_REDUCTION.RECOMMENDED_PREPARATION;
      improvementFactor = OPTIMIZATION_CONFIG.RECOVERABILITY_IMPROVEMENT.RECOMMENDED_PREPARATION;
      title = 'Recommended Balanced Preparation Protocol';
      description =
        'Standard best-practice protocol balancing labor effort against benchmark realization. Removes active contaminants and separates major attachments.';

      tierActions = availableActions.filter((a) => !a.action_id.startsWith('action-segregate-'));
      const firstSeg = availableActions.find((a) => a.action_id.startsWith('action-segregate-'));
      if (firstSeg) tierActions.push(firstSeg);
      if (tierActions.length === 0) tierActions = availableActions;

      assumptions = [
        'Batch undergoes standard pre-sorting: drainage, particulate shaking, and peeling of easily removable wrappers/closures.',
        'Scenario assumes preparation improves modeled material condition; actual facility acceptance depends on physical inspection and facility-specific criteria.',
      ];
      uncertainties = [
        'Adhesive dissolution depends on caustic wash tank temperature at reclaimer.',
        'Melt flow index and chemical degradation cannot be improved by surface preparation.',
      ];
    } else {
      // MAXIMUM_SEPARATION
      effortLevel = 'HIGH';
      reductionFactor = OPTIMIZATION_CONFIG.CONTAMINATION_REDUCTION.MAXIMUM_SEPARATION;
      improvementFactor = OPTIMIZATION_CONFIG.RECOVERABILITY_IMPROVEMENT.MAXIMUM_SEPARATION;
      title = 'Comprehensive Stream Separation & Clean Wash';
      description =
        'Full physical segregation of all secondary streams into dedicated recovery channels, combined with thorough wash decontamination.';

      tierActions = availableActions;
      assumptions = [
        'Complete physical segregation into monomaterial fractions before transport.',
        'Comprehensive cleaning assumes removal of soluble surface contaminants down to the illustrative scenario floor (~2%).',
      ];
      uncertainties = [
        'Higher manual sorting labor may offset marginal revenue gains on small volume batches.',
        'Micro-composites and multi-layer laminated barrier films cannot be separated mechanically.',
      ];
    }

    // -------------------------------------------------------------------------
    // DETERMINISTIC SCENARIO CALCULATIONS
    // -------------------------------------------------------------------------
    // 1. Modeled Contamination
    let modeledContam: number;
    if (isBelowSuppressionThreshold) {
      modeledContam = currentContam; // Below suppression heuristic threshold, no further generic decontamination modeled
    } else {
      const reduced = currentContam * (1 - reductionFactor);
      modeledContam = Math.max(OPTIMIZATION_CONFIG.SCENARIO_MIN_CONTAMINATION_FLOOR, Math.round(reduced * 10) / 10);
    }

    // 2. Modeled Recoverability Score & Grade
    const headroom = 100 - currentRecover;
    const gained = headroom * improvementFactor;
    const modeledRecover = Math.min(
      OPTIMIZATION_CONFIG.SCENARIO_MAX_RECOVERABILITY_CEILING,
      Math.max(OPTIMIZATION_CONFIG.MIN_RECOVERABILITY_SCORE, Math.round((currentRecover + gained) * 10) / 10)
    );

    let modeledGrade: QualityGrade = 'GRADE_B';
    if (modeledRecover >= 85) modeledGrade = 'GRADE_A';
    else if (modeledRecover >= 70) modeledGrade = 'GRADE_B';
    else if (modeledRecover >= 50) modeledGrade = 'GRADE_C';
    else modeledGrade = 'REJECT';

    // 3. Modeled Component Composition Adjustments
    let modeledComponents: BatchComponent[] | undefined = undefined;
    if (profile.composition && profile.composition.length > 0) {
      modeledComponents = profile.composition.map((c) => {
        const cContamReduced = Math.max(
          OPTIMIZATION_CONFIG.SCENARIO_MIN_CONTAMINATION_FLOOR,
          Math.round(c.contamination_percent * (1 - reductionFactor) * 10) / 10
        );
        const cRecoverGained = (100 - c.recoverability_score) * improvementFactor;
        const cRecoverModeled = Math.min(
          OPTIMIZATION_CONFIG.SCENARIO_MAX_RECOVERABILITY_CEILING,
          Math.round((c.recoverability_score + cRecoverGained) * 10) / 10
        );
        let cGrade: QualityGrade = 'GRADE_B';
        if (cRecoverModeled >= 85) cGrade = 'GRADE_A';
        else if (cRecoverModeled >= 70) cGrade = 'GRADE_B';
        else if (cRecoverModeled >= 50) cGrade = 'GRADE_C';
        else cGrade = 'REJECT';

        return {
          ...c,
          contamination_percent: cContamReduced,
          recoverability_score: cRecoverModeled,
          recoverability_grade: cGrade,
        };
      });
    }

    // 4. Deterministic Modeled Valuation using existing ValuationService
    const modeledValuation = valuationService.calculateValuation({
      materialCode: profile.primary_material.code,
      weightKg: effectiveWeightKg,
      contaminationPercentage: modeledContam,
      qualityGrade: modeledGrade,
      isUserSpecifiedWeight,
      composition: modeledComponents,
      unresolvedSharePercent: profile.unresolved_fraction?.estimated_share_percent,
    });

    // 5. Routing Strategy Effect
    let routingStrategy: RoutingEffectStrategy = 'NO_ROUTE_CHANGE';
    let routingRationale = 'Existing facility routing remains optimal for this batch archetype.';

    if (scenarioType === 'MAXIMUM_SEPARATION' && isMultiMaterial && profile.composition.length >= 2) {
      routingStrategy = 'SPLIT_ROUTING_RECOMMENDED';
      routingRationale =
        'Full stream segregation separates distinct polymer and metal fractions, unlocking dedicated higher-value regional recovery channels.';
    } else if (params.currentGrade === 'REJECT' && modeledGrade !== 'REJECT') {
      routingStrategy = 'SINGLE_FACILITY_PREFERRED';
      routingRationale =
        'Intervention reduces contamination below dock rejection threshold, elevating batch from municipal disposal to commercial recycling intake.';
    }

    // 6. Modeled Economic Effect Summary
    const currentNetMin = params.valuation.indicative_net_range.min;
    const currentNetMax = params.valuation.indicative_net_range.max;
    const deltaMin = Math.max(0, modeledValuation.indicative_net_range.min - currentNetMin);
    const deltaMax = Math.max(0, modeledValuation.indicative_net_range.max - currentNetMax);

    const economicEffect = deltaMax > 0
      ? `Modeled illustrative benchmark effect: projected indicative realization change of ~₹${deltaMin}–₹${deltaMax} resulting from modeled ~${Math.round(
          currentContam - modeledContam
        )}% lower contamination deduction and upgraded recoverability. This is not a guaranteed price, realized profit, or guaranteed payout.`
      : 'Contamination is already below the illustrative action-suppression threshold (5.0%); modeled value change is primarily driven by transport consolidation.';

    const affectedCodes = Array.from(
      new Set([profile.primary_material.code, ...tierActions.flatMap((a) => a.affected_material_codes)])
    );

    return {
      scenario_id: `scenario-${scenarioType.toLowerCase().replace('_', '-')}`,
      scenario_type: scenarioType,
      title,
      description,
      effort_level: effortLevel,
      actions: tierActions,
      affected_material_codes: affectedCodes,
      modeling_coefficients: {
        contamination_reduction_coefficient: reductionFactor,
        recoverability_headroom_coefficient: improvementFactor,
        coefficient_basis: 'ILLUSTRATIVE_SCENARIO_ASSUMPTION',
        contamination_floor: OPTIMIZATION_CONFIG.SCENARIO_MIN_CONTAMINATION_FLOOR,
        recoverability_ceiling: OPTIMIZATION_CONFIG.SCENARIO_MAX_RECOVERABILITY_CEILING,
        action_suppression_heuristic: OPTIMIZATION_CONFIG.ACTION_SUPPRESSION_THRESHOLD_PERCENT,
      },
      current_state_reference: {
        data_origin: dataOrigin,
        contamination_percentage: currentContam,
        recoverability_score: currentRecover,
        recoverability_grade: params.currentGrade,
        indicative_net_range: params.valuation.indicative_net_range,
        weight_kg: effectiveWeightKg,
        weight_basis: weightBasis,
      },
      modeled_state: {
        data_origin: 'SCENARIO_PROJECTED',
        projected_contamination_percentage: modeledContam,
        projected_recoverability_score: modeledRecover,
        projected_recoverability_grade: modeledGrade,
        projected_clean_benchmark: modeledValuation.clean_batch_benchmark,
        projected_contamination_penalty: modeledValuation.contamination_penalty_amount,
        projected_indicative_net_range: modeledValuation.indicative_net_range,
        projected_component_valuations: modeledValuation.component_valuations,
      },
      assumptions,
      uncertainties,
      evidence_basis: profile.contamination_evidence || profile.visual_evidence || [],
      economic_effect: economicEffect,
      routing_effect: {
        strategy: routingStrategy,
        rationale: routingRationale,
      },
      is_scenario_projection: true,
      is_fallback_demo: profile.is_fallback_inference,
    };
  }

  /**
   * Builds the side-by-side comparison matrix between Current State and Scenarios.
   */
  private buildComparisonMatrix(
    profile: RecoveryProfile,
    valuation: ValuationBreakdown,
    scenarios: OptimizationScenario[],
    dataOrigin: 'OBSERVED' | 'MODEL_ESTIMATED' | 'USER_CONFIRMED'
  ): OptimizationComparison {
    const minimal = scenarios.find((s) => s.scenario_type === 'MINIMAL_PREPARATION');
    const recommended = scenarios.find((s) => s.scenario_type === 'RECOMMENDED_PREPARATION');
    const maximum = scenarios.find((s) => s.scenario_type === 'MAXIMUM_SEPARATION');

    const comparisons = [
      {
        metric: 'Visible Contamination',
        current_value_label: `${profile.contamination.percentage}%`,
        minimal_value_label: minimal ? `~${minimal.modeled_state.projected_contamination_percentage}%` : undefined,
        recommended_value_label: recommended ? `~${recommended.modeled_state.projected_contamination_percentage}%` : undefined,
        maximum_value_label: maximum ? `~${maximum.modeled_state.projected_contamination_percentage}%` : undefined,
        unit: '%',
        interpretation: 'Lower contamination reduces monetary penalty deduction at facility scale.',
      },
      {
        metric: 'Recoverability Score',
        current_value_label: `${profile.recoverability.score}/100 (${profile.recoverability.grade})`,
        minimal_value_label: minimal
          ? `~${minimal.modeled_state.projected_recoverability_score} (${minimal.modeled_state.projected_recoverability_grade})`
          : undefined,
        recommended_value_label: recommended
          ? `~${recommended.modeled_state.projected_recoverability_score} (${recommended.modeled_state.projected_recoverability_grade})`
          : undefined,
        maximum_value_label: maximum
          ? `~${maximum.modeled_state.projected_recoverability_score} (${maximum.modeled_state.projected_recoverability_grade})`
          : undefined,
        unit: 'Score',
        interpretation: 'Higher score models improved reprocessor yield; actual facility acceptance depends on physical dock inspection.',
      },
      {
        metric: 'Indicative Net Realization',
        current_value_label: `₹${valuation.indicative_net_range.min} – ₹${valuation.indicative_net_range.max}`,
        minimal_value_label: minimal
          ? `~₹${minimal.modeled_state.projected_indicative_net_range.min} – ₹${minimal.modeled_state.projected_indicative_net_range.max}`
          : undefined,
        recommended_value_label: recommended
          ? `~₹${recommended.modeled_state.projected_indicative_net_range.min} – ₹${recommended.modeled_state.projected_indicative_net_range.max}`
          : undefined,
        maximum_value_label: maximum
          ? `~${maximum.modeled_state.projected_indicative_net_range.min} – ₹${maximum.modeled_state.projected_indicative_net_range.max}`
          : undefined,
        unit: 'INR',
        interpretation: 'Estimated net payout range across illustrative batch weight after contamination deduction.',
      },
      {
        metric: 'Dispatch Routing Strategy',
        current_value_label: profile.recovery_decision?.routing_strategy.replace('_', ' ') || 'SINGLE FACILITY',
        minimal_value_label: minimal?.routing_effect.strategy.replace('_', ' '),
        recommended_value_label: recommended?.routing_effect.strategy.replace('_', ' '),
        maximum_value_label: maximum?.routing_effect.strategy.replace('_', ' '),
        unit: 'Strategy',
        interpretation: 'Operational routing recommendation based on stream separability.',
      },
    ];

    return {
      current_state_summary: {
        data_origin: dataOrigin,
        contamination_label: `${profile.contamination.percentage}% (${profile.contamination.severity})`,
        recoverability_label: `${profile.recoverability.score} (${profile.recoverability.grade})`,
        net_realization_label: `₹${valuation.indicative_net_range.min} – ₹${valuation.indicative_net_range.max}`,
        routing_label: profile.recovery_decision?.routing_strategy.replace('_', ' ') || 'SINGLE FACILITY',
      },
      comparisons,
      modeling_disclosure:
        'Scenario projections are illustrative calculations based on configurable assumptions and existing visual-share estimates. They are not measured post-preparation results, guaranteed market prices, or guaranteed recycler acceptance.',
    };
  }
}

export const optimizationService = new OptimizationService();
