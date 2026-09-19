import { GoogleGenerativeAI } from '@google/generative-ai';
import { z } from 'zod';
import {
  RecoveryProfile,
  MaterialCategory,
  QualityGrade,
  ContaminationSeverity,
  BatchComponent,
  UnresolvedFraction,
  RecoveryDecision,
} from '../../src/types/recyclens.types.ts';

const SYSTEM_INSTRUCTION = `You are RecycLens AI, a specialized Material Recovery Intelligence Computer Vision System.
Your mission is to inspect visual images of post-consumer or commercial recyclable waste batches and output an auditable, structured MULTI-MATERIAL RECOVERY EVIDENCE CHAIN.

CORE OPERATIONAL PRINCIPLES:
1. MULTI-MATERIAL BATCH RECOVERY EVIDENCE CHAIN:
   IMAGE/BATCH → COMPOSITION BREAKDOWN → CONTAMINATION EVIDENCE → RECOVERABILITY ASSESSMENT → UNCERTAINTY / LIMITATIONS → PREPARATION / RECOVERY ROUTE
2. MULTI-MATERIAL COMPOSITION IDENTIFICATION & ANTI-HALLUCINATION:
   - ONLY identify multiple material components when they are CLEARLY and UNAMBIGUOUSLY VISIBLE as distinct physical objects or components in the provided image.
   - NEVER infer or invent secondary materials based on assumptions of what products 'typically' contain (e.g. DO NOT assume screw caps exist unless caps are distinctly visible; DO NOT assume labels or tape exist unless clearly visible; DO NOT assume aluminium cans exist unless metallic cans are clearly depicted).
   - NO contextual inference, environmental speculation, or 'this product usually has X' reasoning.
   - If the image depicts a single homogeneous item or material type without visible secondary components, return EXACTLY ONE component representing 100% estimated visual share.
   - Every listed component MUST have specific, factual visual evidence citing visible features (geometry, color, surface finish, markings, textures) actually observed in the image.
   - DO NOT estimate hidden, microscopic, or internal material layers.
   - For each component, provide: material, material_code, category, estimated_share_percent, confidence, visual_evidence, contamination_percent, recoverability_score, recoverability_grade, is_separable, preparation_actions, uncertainty.
3. VISUAL ESTIMATE VS PHYSICAL MASS:
   - A photograph CANNOT determine exact mass fractions, chemical additives, or hidden layers.
   - estimated_share_percent MUST be treated strictly as an approximate visual surface area share.
   - DO NOT manufacture 100% certainty. If portions of the batch are shadowed, obscured, or ambiguous, assign known components their visual share and attribute the remainder to "unresolved_fraction".
4. OBSERVATION VS HYPOTHESIS:
   - State what is ACTUALLY VISIBLE in the image (geometry, opacity, reflections, labels, color, fractures, surface stains).
   - Never pretend visual inspection provides chemical confirmation. Do not claim exact polymer melt flow index, chemical additive packages, moisture content, or internal molecular purity.
5. PHYSICAL CONSTRAINTS & HONESTY:
   - DO NOT claim exact weight from pixels alone. Weight is user-measured.
   - DO NOT claim exact cash spot pricing from pixels alone.
   - DO NOT fabricate facility certifications, approvals, or external regulatory claims.
6. CONFIDENCE & UNCERTAINTY:
   - Provide realistic confidence percentages (e.g. 75-95% for distinct items; 35-60% if ambiguous, mixed, dirty, or blurry).
   - Confidence represents "Model-Estimated Visual Confidence", NOT a statistically calibrated probability.
   - If an image contains mixed items or is ambiguous, expose uncertainty explicitly.
7. OPERATIONAL PREPARATION & ROUTING:
   - Identify practical segregation actions (e.g. "Unscrew and remove PP caps", "Peel adhesive tape", "Drain liquid residue").
   - Suggest routing strategy: SINGLE_FACILITY (homogeneous), SPLIT_ROUTING (separable multi-category materials), or SPECIALIZED_DISPOSAL (hazardous or severe contamination).

REQUIRED JSON SCHEMA:
{
  "primary_material": {
    "code": "PLASTIC_PET" | "PLASTIC_HDPE" | "PLASTIC_LDPE" | "PAPER_CARDBOARD" | "PAPER_MIXED" | "METAL_ALUMINIUM" | "METAL_STEEL" | "GLASS_CULLET" | "EWASTE_PCB" | "TEXTILE_COTTON" | "OTHER",
    "name": "Human-readable material name (e.g. Polyethylene Terephthalate)",
    "category": "PLASTIC" | "PAPER" | "METAL" | "GLASS" | "EWASTE" | "TEXTILE" | "ORGANIC" | "OTHER",
    "confidence": number between 10 and 99,
    "polymer_subtype": "Optional specific code like PET #1 or HDPE #2"
  },
  "composition": [
    {
      "material": "e.g. Clear PET Bottle Bodies",
      "material_code": "PLASTIC_PET",
      "category": "PLASTIC",
      "estimated_share_percent": 85,
      "confidence": 92,
      "polymer_subtype": "PET #1",
      "visual_evidence": ["Clear transparent fluted bottle bodies", "Standard neck finish"],
      "contamination_percent": 8,
      "recoverability_score": 90,
      "recoverability_grade": "GRADE_A",
      "is_separable": false,
      "preparation_actions": ["Flatten bottles to reduce volume"],
      "uncertainty": ["Intrinsic viscosity cannot be confirmed visually"]
    },
    {
      "material": "e.g. Polypropylene Screw Caps",
      "material_code": "PLASTIC_PP",
      "category": "PLASTIC",
      "estimated_share_percent": 15,
      "confidence": 88,
      "polymer_subtype": "PP #5",
      "visual_evidence": ["Colored opaque threaded closure caps attached to bottle necks"],
      "contamination_percent": 5,
      "recoverability_score": 85,
      "recoverability_grade": "GRADE_A",
      "is_separable": true,
      "preparation_actions": ["Unscrew caps manually prior to baling"],
      "uncertainty": ["Pigment additive composition unconfirmed"]
    }
  ],
  "unresolved_fraction": {
    "estimated_share_percent": 0,
    "visual_reason": "All visible materials resolved"
  },
  "visual_evidence": [
    "Concise factual visual observation 1",
    "Concise factual visual observation 2",
    "Concise factual visual observation 3"
  ],
  "secondary_materials": [
    {
      "name": "e.g. Polypropylene screw caps",
      "percentage": number (estimated visual portion),
      "separable": boolean,
      "notes": "Advice on manual separation"
    }
  ],
  "contamination": {
    "percentage": number (estimated percentage of batch affected by contamination, 0 to 100),
    "type": "e.g. BEVERAGE_RESIDUE, FOOD_GREASE, DIRT, ADHESIVE_TAPE, NONE",
    "severity": "CLEAN" | "LOW" | "MODERATE" | "HIGH" | "CRITICAL",
    "explanation": "Clear explanation of visible contamination and its effect on recovery yield",
    "visual_indicators": ["Visual cue 1", "Visual cue 2"]
  },
  "contamination_evidence": [
    "Visual cue 1 supporting contamination severity",
    "Visual cue 2 supporting contamination severity"
  ],
  "recoverability": {
    "score": number between 10 and 100,
    "grade": "GRADE_A" | "GRADE_B" | "GRADE_C" | "REJECT",
    "is_commercially_viable": boolean,
    "actionable_advice": "Step-by-step preparation advice for maximizing scrap sale price",
    "potential_applications": ["e.g. R-PET fiber spinning", "Bottle-to-bottle food grade recycling"]
  },
  "uncertainty": [
    "Polymer subtype cannot be chemically verified from photo alone",
    "Batch weight cannot be determined visually and requires physical scale weighment"
  ],
  "recommended_preparation": [
    "Practical preparation step 1",
    "Practical preparation step 2"
  ],
  "recovery_decision": {
    "batch_archetype": "Mixed Post-Consumer Packaging",
    "condition_summary": "Low visible contamination (~10%). High clarity bottle stock.",
    "recommended_action": "Segregate PP caps and drain beverage residue before baling.",
    "economic_effect": "Batch yield optimized by cap removal; clean bottle flake earns top benchmark rate.",
    "routing_strategy": "SINGLE_FACILITY",
    "routing_rationale": "Single polymer reclaimer accepts batch if caps removed or sink-float separated."
  },
  "visual_explanation": "Concise 2-sentence summary of what the vision system detected."
}`;

export const TOTAL_AI_BUDGET_MS = 28000;
export const MAX_CANDIDATE_TIMEOUT_MS = 18000;

// Zod Schema for Validating Gemini AI Multimodal Response
export const rawAIResponseSchema = z.object({
  primary_material: z.object({
    code: z.string().min(1).max(50),
    name: z.string().min(1).max(100),
    category: z.enum(['PLASTIC', 'PAPER', 'METAL', 'GLASS', 'EWASTE', 'TEXTILE', 'ORGANIC', 'OTHER']),
    confidence: z.number(),
    polymer_subtype: z.string().max(100).nullable().optional(),
  }),
  composition: z
    .array(
      z.object({
        material: z.string().max(100).optional().default(''),
        material_code: z.string().max(50).optional().default('OTHER'),
        category: z.enum(['PLASTIC', 'PAPER', 'METAL', 'GLASS', 'EWASTE', 'TEXTILE', 'ORGANIC', 'OTHER']).optional().default('OTHER'),
        estimated_share_percent: z.number().optional().default(0),
        confidence: z.number().optional().default(80),
        polymer_subtype: z.string().max(100).nullable().optional(),
        visual_evidence: z.array(z.string().max(500)).optional().default([]),
        contamination_percent: z.number().optional().default(0),
        recoverability_score: z.number().optional().default(80),
        recoverability_grade: z.enum(['GRADE_A', 'GRADE_B', 'GRADE_C', 'REJECT']).optional().default('GRADE_B'),
        is_separable: z.boolean().optional().default(true),
        preparation_actions: z.array(z.string().max(500)).optional().default([]),
        uncertainty: z.array(z.string().max(500)).optional().default([]),
      })
    )
    .optional()
    .default([]),
  unresolved_fraction: z
    .object({
      estimated_share_percent: z.number(),
      visual_reason: z.string().max(500),
    })
    .nullable()
    .optional(),
  visual_evidence: z.array(z.string().max(500)).optional().default([]),
  secondary_materials: z
    .array(
      z.object({
        name: z.string().max(100),
        percentage: z.number().min(0).max(100),
        separable: z.boolean(),
        notes: z.string().max(300).nullable().optional(),
      })
    )
    .optional()
    .default([]),
  contamination: z.object({
    percentage: z.number(),
    type: z.string().max(100),
    severity: z.enum(['CLEAN', 'LOW', 'MODERATE', 'HIGH', 'CRITICAL']),
    explanation: z.string().max(1000),
    visual_indicators: z.array(z.string().max(200)).optional().default([]),
  }),
  contamination_evidence: z.array(z.string().max(500)).optional().default([]),
  recoverability: z.object({
    score: z.number(),
    grade: z.enum(['GRADE_A', 'GRADE_B', 'GRADE_C', 'REJECT']),
    is_commercially_viable: z.boolean(),
    actionable_advice: z.string().max(1000),
    potential_applications: z.array(z.string().max(200)).optional().default([]),
  }),
  uncertainty: z.array(z.string().max(500)).optional().default([]),
  recommended_preparation: z.array(z.string().max(500)).optional().default([]),
  recovery_decision: z
    .object({
      batch_archetype: z.string().max(150),
      condition_summary: z.string().max(500),
      recommended_action: z.string().max(500),
      economic_effect: z.string().max(500),
      routing_strategy: z.enum(['SINGLE_FACILITY', 'SPLIT_ROUTING', 'SPECIALIZED_DISPOSAL']),
      routing_rationale: z.string().max(500),
    })
    .nullable()
    .optional(),
  visual_explanation: z.string().max(1000),
});

/**
 * Normalizes and applies deterministic consistency rules to AI Vision response.
 * Implements Phase 3 multi-material batch composition normalization, batch contamination
 * aggregation, batch recoverability aggregation, and operational decision synthesis.
 */
export function normalizeAndValidateAIResponse(raw: unknown): Omit<RecoveryProfile, 'id' | 'scan_id' | 'timestamp'> {
  const parsed = rawAIResponseSchema.parse(raw);

  // 1. Clamp numeric bounds safely for primary fields
  const clampedConfidence = Math.min(99, Math.max(10, Math.round(parsed.primary_material.confidence * 10) / 10));
  const clampedContamPct = Math.min(100, Math.max(0, Math.round(parsed.contamination.percentage * 10) / 10));
  const clampedRecoverScore = Math.min(100, Math.max(10, Math.round(parsed.recoverability.score * 10) / 10));

  // 2. Filter & clean primary array strings
  const cleanVisualEvidence = (parsed.visual_evidence || [])
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
    .slice(0, 6);

  const cleanContamEvidence = (parsed.contamination_evidence || [])
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
    .slice(0, 6);

  const cleanUncertainty = (parsed.uncertainty || [])
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
    .slice(0, 6);

  const cleanPrep = (parsed.recommended_preparation || [])
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
    .slice(0, 6);

  // 3. Consistency Rule A: Visual Evidence fallback if empty
  if (cleanVisualEvidence.length === 0) {
    cleanVisualEvidence.push(parsed.visual_explanation || `Visual characteristics indicate ${parsed.primary_material.name}.`);
  }

  // 4. Consistency Rule B: Contamination Evidence guarantees
  if (clampedContamPct > 5 && cleanContamEvidence.length === 0) {
    if (parsed.contamination.visual_indicators && parsed.contamination.visual_indicators.length > 0) {
      cleanContamEvidence.push(...parsed.contamination.visual_indicators.map((c) => `Visible indicator: ${c}`));
    } else {
      cleanContamEvidence.push(`Observed surface condition suggests ${parsed.contamination.type.toLowerCase().replace(/_/g, ' ')}.`);
    }
  }

  // 5. Consistency Rule C: Mandatory uncertainty disclosures
  const standardLimits = [
    'Polymer subtype & chemical purity cannot be definitively confirmed from photograph alone.',
    'Batch weight cannot be determined visually and requires physical scale weighment.',
  ];
  for (const limit of standardLimits) {
    if (!cleanUncertainty.some((u) => u.toLowerCase().includes(limit.substring(0, 15).toLowerCase()))) {
      cleanUncertainty.push(limit);
    }
  }

  // 6. Consistency Rule D: Ambiguity consistency check
  if (parsed.primary_material.code === 'OTHER' || clampedConfidence < 60) {
    if (!cleanUncertainty.some((u) => u.toLowerCase().includes('ambiguity') || u.toLowerCase().includes('mixed'))) {
      cleanUncertainty.unshift('High visual ambiguity or mixed waste composition prevents single-material identification.');
    }
  }

  // 7. Consistency Rule E: Recommended Preparation fallback
  if (cleanPrep.length === 0) {
    cleanPrep.push(parsed.recoverability.actionable_advice || 'Segregate clean recyclables from contaminated fractions.');
  }

  // =========================================================================
  // 8. PHASE 3 MULTI-MATERIAL COMPOSITION NORMALIZATION
  // =========================================================================
  let rawComponents = parsed.composition || [];

  // Backward Compatibility: If model omitted composition array, synthesize from primary material
  if (rawComponents.length === 0) {
    rawComponents = [
      {
        material: parsed.primary_material.name,
        material_code: parsed.primary_material.code,
        category: parsed.primary_material.category,
        estimated_share_percent: 100,
        confidence: clampedConfidence,
        polymer_subtype: parsed.primary_material.polymer_subtype || undefined,
        visual_evidence: cleanVisualEvidence,
        contamination_percent: clampedContamPct,
        recoverability_score: clampedRecoverScore,
        recoverability_grade: parsed.recoverability.grade,
        is_separable: false,
        preparation_actions: cleanPrep,
        uncertainty: cleanUncertainty,
      },
    ];
  }

  // Filter empty components and clamp per-component metrics
  const validComponents: BatchComponent[] = [];
  const seenCodes = new Map<string, BatchComponent>();

  for (const item of rawComponents) {
    const matName = item.material?.trim();
    const rawShare = Number(item.estimated_share_percent);
    if (!matName || isNaN(rawShare) || rawShare <= 0) continue;

    const clampedShare = Math.min(100, Math.max(1, Math.round(rawShare * 10) / 10));
    const compConf = Math.min(99, Math.max(10, Math.round(Number(item.confidence || clampedConfidence) * 10) / 10));
    const compContam = Math.min(100, Math.max(0, Math.round(Number(item.contamination_percent ?? clampedContamPct) * 10) / 10));
    const compRecover = Math.min(100, Math.max(10, Math.round(Number(item.recoverability_score ?? clampedRecoverScore) * 10) / 10));

    // Ensure visual evidence exists for each component
    let compVisualEvidence = (item.visual_evidence || [])
      .map((s) => s.trim())
      .filter((s) => s.length > 0)
      .slice(0, 4);

    const isPrimaryComponent =
      matName.toLowerCase() === parsed.primary_material.name.toLowerCase() || validComponents.length === 0;

    // Ensure component uncertainty exists
    let compUncertainty = (item.uncertainty || [])
      .map((s) => s.trim())
      .filter((s) => s.length > 0)
      .slice(0, 3);
    if (compUncertainty.length === 0) {
      compUncertainty = [`Sub-component share estimated visually; exact mass requires physical weighment.`];
    }
    if (compConf < 60 || item.material_code === 'OTHER') {
      if (!compUncertainty.some((u) => u.toLowerCase().includes('ambiguous') || u.toLowerCase().includes('ambiguity'))) {
        compUncertainty.unshift(`Classification for ${matName} is visually ambiguous; requires dock sorting confirmation.`);
      }
    }

    if (compVisualEvidence.length === 0) {
      if (isPrimaryComponent) {
        compVisualEvidence = [`Visual morphology consistent with ${matName} (unconfirmed by specific feature evidence).`];
        compUncertainty.push('Primary component classification lacks specific feature evidence; requires physical inspection.');
      } else {
        // Do not convert speculation into "observed evidence" — reject unevidenced secondary components
        continue;
      }
    }

    const prepActions = (item.preparation_actions || [])
      .map((s) => s.trim())
      .filter((s) => s.length > 0)
      .slice(0, 4);

    const comp: BatchComponent = {
      material: matName,
      material_code: item.material_code || 'OTHER',
      category: item.category || 'OTHER',
      estimated_share_percent: clampedShare,
      confidence: compConf,
      polymer_subtype: item.polymer_subtype ? item.polymer_subtype.trim() : undefined,
      visual_evidence: compVisualEvidence,
      contamination_percent: compContam,
      recoverability_score: compRecover,
      recoverability_grade: item.recoverability_grade || parsed.recoverability.grade,
      is_separable: typeof item.is_separable === 'boolean' ? item.is_separable : true,
      preparation_actions: prepActions.length > 0 ? prepActions : cleanPrep.slice(0, 2),
      uncertainty: compUncertainty,
    };

    // Deduplicate identical material codes by aggregating shares
    if (seenCodes.has(comp.material_code)) {
      const existing = seenCodes.get(comp.material_code)!;
      existing.estimated_share_percent = Math.min(100, existing.estimated_share_percent + comp.estimated_share_percent);
      existing.contamination_percent = Math.round(((existing.contamination_percent + comp.contamination_percent) / 2) * 10) / 10;
      existing.recoverability_score = Math.round(((existing.recoverability_score + comp.recoverability_score) / 2) * 10) / 10;
      existing.visual_evidence = Array.from(new Set([...existing.visual_evidence, ...comp.visual_evidence])).slice(0, 4);
    } else {
      seenCodes.set(comp.material_code, comp);
      validComponents.push(comp);
    }
  }

  // Safety fallback if all components were dropped
  if (validComponents.length === 0) {
    validComponents.push({
      material: parsed.primary_material.name,
      material_code: parsed.primary_material.code,
      category: parsed.primary_material.category,
      estimated_share_percent: 100,
      confidence: clampedConfidence,
      polymer_subtype: parsed.primary_material.polymer_subtype || undefined,
      visual_evidence: cleanVisualEvidence,
      contamination_percent: clampedContamPct,
      recoverability_score: clampedRecoverScore,
      recoverability_grade: parsed.recoverability.grade,
      is_separable: false,
      preparation_actions: cleanPrep,
      uncertainty: cleanUncertainty,
    });
  }

  // Limit max components to 6 for production safety
  const finalComponents = validComponents.slice(0, 6);

  // Normalize percentages: scale down if sum > 100; represent remainder as unresolved if sum < 100
  const rawSum = finalComponents.reduce((acc, c) => acc + c.estimated_share_percent, 0);
  let unresolvedFraction: UnresolvedFraction | undefined = undefined;

  if (rawSum > 100) {
    // Proportional downscaling
    let runningSum = 0;
    for (let i = 0; i < finalComponents.length; i++) {
      const scaled = Math.max(1, Math.round((finalComponents[i].estimated_share_percent / rawSum) * 100));
      finalComponents[i].estimated_share_percent = scaled;
      runningSum += scaled;
    }
    // Adjust rounding delta on the highest component
    const delta = 100 - runningSum;
    if (delta !== 0) {
      finalComponents.sort((a, b) => b.estimated_share_percent - a.estimated_share_percent);
      finalComponents[0].estimated_share_percent = Math.max(1, finalComponents[0].estimated_share_percent + delta);
    }
    unresolvedFraction = undefined;
  } else if (rawSum < 100) {
    const remainder = Math.round((100 - rawSum) * 10) / 10;
    if (remainder >= 1.0) {
      const parsedReason = parsed.unresolved_fraction?.visual_reason?.trim();
      unresolvedFraction = {
        estimated_share_percent: remainder,
        visual_reason:
          parsedReason ||
          'Portion obscured, shaded, or visually ambiguous; requires physical sorting and inspection at dock intake.',
      };
      // Mandatory uncertainty disclosure for unresolved material
      if (!cleanUncertainty.some((u) => u.toLowerCase().includes('unresolved') || u.toLowerCase().includes('obscured'))) {
        cleanUncertainty.push(`Approx. ${remainder}% of batch volume is visually unresolved from the photographic perspective.`);
      }
    }
  }

  // =========================================================================
  // 9. BATCH-LEVEL CONTAMINATION AGGREGATION
  // Formula:
  // Batch Contam % = sum(component[i].contam% * (share% / 100)) + (unresolved_share% * 0.50)
  // Explanation: Each component contributes contamination proportional to its visual share.
  // Unresolved fractions carry a conservative 50% contamination risk factor.
  // =========================================================================
  const unresolvedShare = unresolvedFraction ? unresolvedFraction.estimated_share_percent : 0;
  const weightedComponentContam = finalComponents.reduce(
    (acc, c) => acc + c.contamination_percent * (c.estimated_share_percent / 100),
    0
  );
  // If raw input did not provide composition array, preserve primary values for 100% backward compatibility
  const aggregatedContamPct =
    (!parsed.composition || parsed.composition.length === 0)
      ? clampedContamPct
      : Math.min(100, Math.max(0, Math.round((weightedComponentContam + unresolvedShare * 0.5) * 10) / 10));

  let aggregatedSeverity: ContaminationSeverity = 'LOW';
  if (aggregatedContamPct < 5) aggregatedSeverity = 'CLEAN';
  else if (aggregatedContamPct <= 15) aggregatedSeverity = 'LOW';
  else if (aggregatedContamPct <= 30) aggregatedSeverity = 'MODERATE';
  else if (aggregatedContamPct <= 50) aggregatedSeverity = 'HIGH';
  else aggregatedSeverity = 'CRITICAL';

  // =========================================================================
  // 10. BATCH-LEVEL RECOVERABILITY AGGREGATION
  // Formula:
  // Batch Recoverability Score = sum(component[i].score * (share% / 100)) - (unresolved_share% * 0.30)
  // Explanation: Weighted recoverability of components penalized by unclassified fraction uncertainty.
  // =========================================================================
  const weightedComponentRecover = finalComponents.reduce(
    (acc, c) => acc + c.recoverability_score * (c.estimated_share_percent / 100),
    0
  );
  const aggregatedRecoverScore =
    (!parsed.composition || parsed.composition.length === 0)
      ? clampedRecoverScore
      : Math.min(100, Math.max(10, Math.round((weightedComponentRecover - unresolvedShare * 0.3) * 10) / 10));

  let aggregatedGrade: QualityGrade = 'GRADE_B';
  if (aggregatedRecoverScore >= 85) aggregatedGrade = 'GRADE_A';
  else if (aggregatedRecoverScore >= 70) aggregatedGrade = 'GRADE_B';
  else if (aggregatedRecoverScore >= 50) aggregatedGrade = 'GRADE_C';
  else aggregatedGrade = 'REJECT';

  const isBatchCommerciallyViable = aggregatedRecoverScore >= 50 && aggregatedGrade !== 'REJECT';

  // =========================================================================
  // 11. BATCH RECOVERY DECISION SYNTHESIS
  // Determines operational routing strategy:
  // - SINGLE_FACILITY: Homogeneous polymer or single-stream compatible batch
  // - SPLIT_ROUTING: Multi-material batch with separable distinct categories
  // - SPECIALIZED_DISPOSAL: Grade REJECT, OTHER, or extreme contamination
  // =========================================================================
  const distinctCategories = Array.from(new Set(finalComponents.map((c) => c.category)));
  const separableComponents = finalComponents.filter((c) => c.is_separable && c.estimated_share_percent >= 5);
  const isMultiMaterial = finalComponents.length > 1;

  let routingStrategy: 'SINGLE_FACILITY' | 'SPLIT_ROUTING' | 'SPECIALIZED_DISPOSAL' = 'SINGLE_FACILITY';
  let routingRationale = '';

  if (aggregatedGrade === 'REJECT' || aggregatedContamPct >= 65 || parsed.primary_material.code === 'OTHER') {
    routingStrategy = 'SPECIALIZED_DISPOSAL';
    routingRationale = 'High visible contamination, unclassified material, or degraded recoverability requires specialized decontamination or municipal disposal.';
  } else if (isMultiMaterial && distinctCategories.length > 1 && separableComponents.length > 0) {
    routingStrategy = 'SPLIT_ROUTING';
    routingRationale = `Batch contains distinct separable material streams (${distinctCategories.join(
      ' + '
    )}). Segregation into dedicated recovery channels maximizes realization.`;
  } else {
    routingStrategy = 'SINGLE_FACILITY';
    routingRationale = `Single-stream intake compatible with standard ${parsed.primary_material.category} reclaimers.`;
  }

  const batchArchetype = isMultiMaterial
    ? `Multi-Material Batch (${finalComponents.map((c) => `${c.material} ~${c.estimated_share_percent}%`).join(', ')})`
    : `${parsed.primary_material.name} Monomaterial Batch`;

  const conditionSummary = `${aggregatedSeverity} visible contamination (~${aggregatedContamPct}%). ${
    unresolvedFraction
      ? `~${unresolvedFraction.estimated_share_percent}% visually unresolved/ambiguous fraction.`
      : 'Full batch visibility across detected components.'
  }`;

  const recommendedAction = isMultiMaterial && separableComponents.length > 0
    ? `Segregate ${separableComponents.map((c) => c.material).join(' and ')} before dispatch. Drain liquids and remove gross contaminants.`
    : (cleanPrep[0] || 'Clean, compact, and bale batch for direct facility intake.');

  const economicEffect = unresolvedShare > 0
    ? `Indicative batch value reduced by ~${aggregatedContamPct}% contamination deduction; ~${unresolvedShare}% unresolved material carries ₹0 baseline valuation.`
    : `Indicative value reflects ~${aggregatedContamPct}% contamination deduction against regional benchmark rates.`;

  const recoveryDecision: RecoveryDecision = {
    batch_archetype: batchArchetype,
    condition_summary: conditionSummary,
    recommended_action: recommendedAction,
    economic_effect: economicEffect,
    routing_strategy: routingStrategy,
    routing_rationale: routingRationale,
  };

  return {
    primary_material: {
      ...parsed.primary_material,
      polymer_subtype: parsed.primary_material.polymer_subtype || undefined,
      confidence: clampedConfidence,
    },
    composition: finalComponents,
    unresolved_fraction: unresolvedFraction,
    recovery_decision: recoveryDecision,
    visual_evidence: cleanVisualEvidence,
    secondary_materials: parsed.secondary_materials.slice(0, 5).map((m) => ({
      ...m,
      notes: m.notes || undefined,
    })),
    contamination: {
      ...parsed.contamination,
      percentage: aggregatedContamPct,
      severity: aggregatedSeverity,
      visual_indicators: parsed.contamination.visual_indicators.slice(0, 5),
    },
    contamination_evidence: cleanContamEvidence,
    recoverability: {
      ...parsed.recoverability,
      score: aggregatedRecoverScore,
      grade: aggregatedGrade,
      is_commercially_viable: isBatchCommerciallyViable,
      potential_applications: parsed.recoverability.potential_applications.slice(0, 4),
    },
    uncertainty: cleanUncertainty.slice(0, 5),
    recommended_preparation: cleanPrep.slice(0, 5),
    visual_explanation: parsed.visual_explanation.trim(),
    model_name: (process.env.GEMINI_MODEL || 'gemini-3.8-flash') + ' (Live VLM)',
    is_fallback_inference: false,
  };
}

function safeParseJson(text: string): any {
  let cleaned = text.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();
  }
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }
  try {
    return JSON.parse(cleaned);
  } catch {
    // Attempt minor recovery: remove trailing commas before closing braces/brackets
    const sanitized = cleaned.replace(/,\s*([}\]])/g, '$1');
    return JSON.parse(sanitized);
  }
}

export class AIVisionService {
  private genAI: GoogleGenerativeAI | null = null;

  constructor() {
    this.ensureClient();
  }

  private ensureClient(): void {
    if (!this.genAI) {
      const apiKey = process.env.GEMINI_API_KEY;
      if (apiKey && apiKey.trim().length > 0) {
        this.genAI = new GoogleGenerativeAI(apiKey.trim());
      }
    }
  }

  public isConfigured(): boolean {
    this.ensureClient();
    return this.genAI !== null;
  }

  public async analyzeImage(base64DataUri: string): Promise<Omit<RecoveryProfile, 'id' | 'scan_id' | 'timestamp'>> {
    this.ensureClient();
    if (!this.genAI) {
      throw new Error('GEMINI_API_KEY is not configured on server.');
    }

    // Extract mime type and base64 string
    const match = base64DataUri.match(/^data:(image\/[a-zA-Z0-9+.-]+);base64,(.+)$/);
    if (!match) {
      throw new Error('Invalid Base64 image format. Expected data:image/...;base64,...');
    }

    const mimeType = match[1];
    const base64Data = match[2];

    const imagePart = {
      inlineData: {
        data: base64Data,
        mimeType: mimeType,
      },
    };

    const prompt = 'Inspect this waste/scrap image and return the structured Material Recovery Intelligence JSON profile according to the system instructions.';

    const candidateModels = Array.from(
      new Set([
        process.env.GEMINI_MODEL || 'gemini-3.8-flash',
        'gemini-3-flash-preview',
        'gemini-3.6-flash',
        'gemini-3.1-flash-lite',
      ])
    ).filter(Boolean);

    const deadline = Date.now() + TOTAL_AI_BUDGET_MS;
    let response: any = null;
    let successfulModelName = candidateModels[0];
    let lastErr: any = null;

    for (const mName of candidateModels) {
      const remainingBudget = deadline - Date.now();
      if (remainingBudget < 4000) {
        break;
      }

      const candidateTimeoutMs = Math.min(MAX_CANDIDATE_TIMEOUT_MS, remainingBudget);

      try {
        const model = this.genAI.getGenerativeModel({
          model: mName,
          generationConfig: {
            temperature: 0.15,
            responseMimeType: 'application/json',
            maxOutputTokens: 4096,
          },
        });

        const generatePromise = model.generateContent([
          { text: SYSTEM_INSTRUCTION },
          imagePart,
          { text: prompt },
        ]);
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(
            () => reject(new Error(`AI Vision request for ${mName} timed out after ${candidateTimeoutMs}ms`)),
            candidateTimeoutMs
          );
        });

        response = await Promise.race([generatePromise, timeoutPromise]);
        successfulModelName = mName;
        break;
      } catch (err: any) {
        lastErr = err;
        const msg = err?.message || String(err);
        const isTransient =
          msg.includes('503') ||
          msg.includes('high demand') ||
          msg.includes('404') ||
          msg.includes('429') ||
          msg.includes('quota') ||
          msg.includes('timed out');

        if (isTransient && deadline - Date.now() >= 4000) {
          console.warn(`[AI Vision Warning]: ${mName} unavailable (${msg.split('\n')[0]}). Attempting failover...`);
          await new Promise((r) => setTimeout(r, 400));
          continue;
        }
        throw err;
      }
    }

    if (!response) {
      throw lastErr || new Error('All Gemini candidate models failed.');
    }

    const rawText = response.response.text();
    const parsed = safeParseJson(rawText);

    // Validate and apply normalization & consistency rules
    const normalized = normalizeAndValidateAIResponse(parsed);
    return {
      ...normalized,
      model_name: `${successfulModelName} (Live VLM)`,
    };
  }
}

export const aiVisionService = new AIVisionService();

