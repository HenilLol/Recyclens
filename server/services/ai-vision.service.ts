import { GoogleGenerativeAI } from '@google/generative-ai';
import { z } from 'zod';
import { RecoveryProfile, MaterialCategory, QualityGrade, ContaminationSeverity } from '../../src/types/recyclens.types.ts';

const SYSTEM_INSTRUCTION = `You are RecycLens AI, a specialized Material Recovery Intelligence Computer Vision System.
Your mission is to inspect visual images of post-consumer or commercial recyclable waste and output an auditable, structured RECOVERY EVIDENCE CHAIN.

CORE OPERATIONAL PRINCIPLES:
1. RECOVERY EVIDENCE CHAIN:
   IMAGE → OBSERVED VISUAL FEATURES → MATERIAL HYPOTHESIS → CONTAMINATION EVIDENCE → RECOVERABILITY ASSESSMENT → UNCERTAINTY / LIMITATIONS → PREPARATION / RECOVERY ACTION
2. OBSERVATION VS HYPOTHESIS:
   - State what is ACTUALLY VISIBLE in the image (geometry, opacity, reflections, labels, color, fractures).
   - Never pretend visual inspection provides chemical confirmation. Do not claim exact polymer melt flow index, chemical additive packages, moisture content, or internal molecular purity.
3. PHYSICAL CONSTRAINTS & HONESTY:
   - DO NOT claim exact weight from pixels alone. Weight is user-measured.
   - DO NOT claim exact cash spot pricing from pixels alone.
   - DO NOT fabricate facility certifications, approvals, or external regulatory claims.
4. CONFIDENCE:
   - Provide realistic confidence percentages (e.g. 75-95% for distinct items; 35-60% if ambiguous, mixed, dirty, or blurry).
   - Confidence represents "Model-Estimated Visual Confidence", NOT a statistically calibrated probability.
5. AMBIGUOUS / MIXED BATCHES:
   - If an image contains mixed items or is ambiguous, reduce confidence, list uncertainties, and use 'OTHER' or 'MIXED_RESIDUAL' where appropriate.
6. EVIDENCE REQUIREMENTS:
   - visual_evidence: 3-5 concise, concrete visual observations directly supported by the pixels.
   - contamination_evidence: 2-4 visual indicators supporting the contamination assessment.
   - uncertainty: 2-4 explicit physical/chemical limitations or unmeasured variables.
   - recommended_preparation: 2-4 practical recovery steps to maximize downstream yield before dispatch.

REQUIRED JSON SCHEMA:
{
  "primary_material": {
    "code": "PLASTIC_PET" | "PLASTIC_HDPE" | "PLASTIC_LDPE" | "PAPER_CARDBOARD" | "PAPER_MIXED" | "METAL_ALUMINIUM" | "METAL_STEEL" | "GLASS_CULLET" | "EWASTE_PCB" | "TEXTILE_COTTON" | "OTHER",
    "name": "Human-readable material name (e.g. Polyethylene Terephthalate)",
    "category": "PLASTIC" | "PAPER" | "METAL" | "GLASS" | "EWASTE" | "TEXTILE" | "ORGANIC" | "OTHER",
    "confidence": number between 10 and 99,
    "polymer_subtype": "Optional specific code like PET #1 or HDPE #2"
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
  "visual_explanation": "Concise 2-sentence summary of what the vision system detected."
}`;

const TOTAL_AI_BUDGET_MS = 28000;
const MAX_CANDIDATE_TIMEOUT_MS = 18000;

// Zod Schema for Validating Gemini AI Multimodal Response
export const rawAIResponseSchema = z.object({
  primary_material: z.object({
    code: z.string().min(1).max(50),
    name: z.string().min(1).max(100),
    category: z.enum(['PLASTIC', 'PAPER', 'METAL', 'GLASS', 'EWASTE', 'TEXTILE', 'ORGANIC', 'OTHER']),
    confidence: z.number(),
    polymer_subtype: z.string().max(100).nullable().optional(),
  }),
  visual_evidence: z.array(z.string().max(500)).optional().default([]),
  secondary_materials: z.array(
    z.object({
      name: z.string().max(100),
      percentage: z.number().min(0).max(100),
      separable: z.boolean(),
      notes: z.string().max(300).nullable().optional(),
    })
  ).optional().default([]),
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
  visual_explanation: z.string().max(1000),
});

/**
 * Normalizes and applies deterministic consistency rules to AI Vision response.
 * NOTE: Schema validation verifies structural correctness and numeric/data bounds.
 * It does not independently verify the semantic truth of model-generated visual observations.
 * RecycLens therefore treats visual evidence as model-generated observations and explicitly
 * exposes uncertainty rather than claiming semantic verification.
 */
export function normalizeAndValidateAIResponse(raw: unknown): Omit<RecoveryProfile, 'id' | 'scan_id' | 'timestamp'> {
  const parsed = rawAIResponseSchema.parse(raw);

  // 1. Clamp numeric bounds safely
  const clampedConfidence = Math.min(99, Math.max(10, Math.round(parsed.primary_material.confidence * 10) / 10));
  const clampedContamPct = Math.min(100, Math.max(0, Math.round(parsed.contamination.percentage * 10) / 10));
  const clampedRecoverScore = Math.min(100, Math.max(10, Math.round(parsed.recoverability.score * 10) / 10));

  // 2. Filter & clean array strings
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

  return {
    primary_material: {
      ...parsed.primary_material,
      polymer_subtype: parsed.primary_material.polymer_subtype || undefined,
      confidence: clampedConfidence,
    },
    visual_evidence: cleanVisualEvidence,
    secondary_materials: parsed.secondary_materials.slice(0, 5).map((m) => ({
      ...m,
      notes: m.notes || undefined,
    })),
    contamination: {
      ...parsed.contamination,
      percentage: clampedContamPct,
      visual_indicators: parsed.contamination.visual_indicators.slice(0, 5),
    },
    contamination_evidence: cleanContamEvidence,
    recoverability: {
      ...parsed.recoverability,
      score: clampedRecoverScore,
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

