import { test, describe } from 'node:test';
import assert from 'node:assert';
import { normalizeAndValidateAIResponse, rawAIResponseSchema } from '../services/ai-vision.service.ts';
import { fallbackService } from '../services/fallback.service.ts';

describe('AI Vision Response Validation & Normalization Unit Tests', () => {
  const validMockAIResponse = {
    primary_material: {
      code: 'PLASTIC_PET',
      name: 'Polyethylene Terephthalate (PET)',
      category: 'PLASTIC',
      confidence: 91.5,
      polymer_subtype: 'PET Rigid Bottle Grade (Type 1)',
    },
    visual_evidence: [
      'Transparent bottle sidewalls with standard injection blow-molded base',
      'High optical transmission and clear reflective surfaces',
      'Threaded closure neck finish visible with blue screw caps',
    ],
    secondary_materials: [
      { name: 'HDPE Closure Caps', percentage: 7.0, separable: true, notes: 'Sink-float floatable' },
    ],
    contamination: {
      percentage: 12.0,
      type: 'BEVERAGE_LIQUID_RESIDUE',
      severity: 'LOW',
      explanation: 'Minor droplet pooling on bottom interior flutes.',
      visual_indicators: ['Liquid condensation inside base', 'Attached printed label sleeve'],
    },
    contamination_evidence: [
      'Visible liquid droplets pooled at the bottom of 3 containers',
      'Attached outer printed advertising wrap covering central cylinder',
    ],
    recoverability: {
      score: 88.0,
      grade: 'GRADE_A',
      is_commercially_viable: true,
      actionable_advice: 'Flatten bottles and drain liquid residue completely.',
      potential_applications: ['rPET bottle-to-bottle food grade', 'Polyester staple fiber'],
    },
    uncertainty: [
      'Polymer intrinsic viscosity (IV) cannot be measured visually',
      'Moisture weight contribution requires physical platform scale',
    ],
    recommended_preparation: [
      'Drain all residual liquid before baling',
      'Remove colored closure caps to retain maximum clean resin value',
    ],
    visual_explanation: 'Clear post-consumer PET beverage containers in prime recyclable condition.',
  };

  test('should validate and normalize a valid complete AI response', () => {
    const result = normalizeAndValidateAIResponse(validMockAIResponse);

    assert.strictEqual(result.primary_material.code, 'PLASTIC_PET');
    assert.strictEqual(result.primary_material.confidence, 91.5);
    assert.strictEqual(result.visual_evidence?.length, 3);
    assert.strictEqual(result.contamination_evidence?.length, 2);
    assert.ok(result.uncertainty && result.uncertainty.length >= 2);
    assert.strictEqual(result.recommended_preparation?.length, 2);
    assert.strictEqual(result.is_fallback_inference, false);
    assert.strictEqual(result.model_name, (process.env.GEMINI_MODEL || 'gemini-3.8-flash') + ' (Live VLM)');
  });

  test('should clamp out-of-bounds confidence safely between 10 and 99', () => {
    const highConfidenceMock = {
      ...validMockAIResponse,
      primary_material: {
        ...validMockAIResponse.primary_material,
        confidence: 145.0,
      },
    };
    const lowConfidenceMock = {
      ...validMockAIResponse,
      primary_material: {
        ...validMockAIResponse.primary_material,
        confidence: 2.0,
      },
    };

    const highResult = normalizeAndValidateAIResponse(highConfidenceMock);
    const lowResult = normalizeAndValidateAIResponse(lowConfidenceMock);

    assert.strictEqual(highResult.primary_material.confidence, 99);
    assert.strictEqual(lowResult.primary_material.confidence, 10);
  });

  test('should clamp contamination percentage safely between 0 and 100', () => {
    const overContamMock = {
      ...validMockAIResponse,
      contamination: {
        ...validMockAIResponse.contamination,
        percentage: 125.0,
      },
    };
    const negativeContamMock = {
      ...validMockAIResponse,
      contamination: {
        ...validMockAIResponse.contamination,
        percentage: -15.0,
      },
    };

    const overResult = normalizeAndValidateAIResponse(overContamMock);
    const negResult = normalizeAndValidateAIResponse(negativeContamMock);

    assert.strictEqual(overResult.contamination.percentage, 100);
    assert.strictEqual(negResult.contamination.percentage, 0);
  });

  test('should auto-populate visual evidence if model omits it', () => {
    const missingEvidenceMock = {
      ...validMockAIResponse,
      visual_evidence: [],
    };

    const result = normalizeAndValidateAIResponse(missingEvidenceMock);
    assert.ok(result.visual_evidence && result.visual_evidence.length > 0);
    assert.strictEqual(result.visual_evidence[0], validMockAIResponse.visual_explanation);
  });

  test('should guarantee contamination evidence when contamination is materially non-zero', () => {
    const emptyContamEvidenceMock = {
      ...validMockAIResponse,
      contamination: {
        ...validMockAIResponse.contamination,
        percentage: 25.0,
        visual_indicators: ['Visible oil stains on lower flap'],
      },
      contamination_evidence: [],
    };

    const result = normalizeAndValidateAIResponse(emptyContamEvidenceMock);
    assert.ok(result.contamination_evidence && result.contamination_evidence.length > 0);
  });

  test('should ensure standard uncertainty limitations are present in output', () => {
    const emptyUncertaintyMock = {
      ...validMockAIResponse,
      uncertainty: [],
    };

    const result = normalizeAndValidateAIResponse(emptyUncertaintyMock);
    assert.ok(result.uncertainty && result.uncertainty.length >= 2);
    assert.ok(result.uncertainty.some((u) => u.toLowerCase().includes('chemical') || u.toLowerCase().includes('polymer')));
    assert.ok(result.uncertainty.some((u) => u.toLowerCase().includes('weight') || u.toLowerCase().includes('scale')));
  });

  test('should prepend ambiguity disclosure for low-confidence or OTHER materials', () => {
    const ambiguousMock = {
      ...validMockAIResponse,
      primary_material: {
        ...validMockAIResponse.primary_material,
        code: 'OTHER',
        confidence: 45.0,
      },
    };

    const result = normalizeAndValidateAIResponse(ambiguousMock);
    assert.ok(result.uncertainty && result.uncertainty.length > 0);
    assert.ok(result.uncertainty[0].toLowerCase().includes('ambiguity') || result.uncertainty[0].toLowerCase().includes('mixed'));
  });

  test('should reject invalid raw AI JSON missing required fields', () => {
    const malformed = {
      primary_material: {
        code: 'PLASTIC_PET',
        // missing name, category, confidence
      },
    };

    assert.throws(() => {
      rawAIResponseSchema.parse(malformed);
    });
  });

  test('should verify all deterministic fallback profiles satisfy the Recovery Evidence Chain contract', () => {
    const presets = [
      'preset-pet-bottles',
      'preset-cardboard-pizza',
      'preset-alu-cans',
      'preset-ewaste-pcb',
      'preset-hdpe-containers',
    ];

    for (const preset of presets) {
      const profile = fallbackService.generateFallbackProfile(undefined, preset);

      assert.ok(profile.visual_evidence && profile.visual_evidence.length >= 2, `${preset} missing visual_evidence`);
      assert.ok(profile.contamination_evidence && profile.contamination_evidence.length >= 1, `${preset} missing contamination_evidence`);
      assert.ok(profile.uncertainty && profile.uncertainty.length >= 2, `${preset} missing uncertainty`);
      assert.ok(profile.recommended_preparation && profile.recommended_preparation.length >= 2, `${preset} missing recommended_preparation`);
      assert.strictEqual(profile.is_fallback_inference, true, `${preset} is_fallback_inference should be true`);
    }
  });

  test('should truncate oversized evidence, uncertainty, and preparation arrays to production limits', () => {
    const oversizedMock = {
      ...validMockAIResponse,
      visual_evidence: [
        'Observation 1',
        'Observation 2',
        'Observation 3',
        'Observation 4',
        'Observation 5',
        'Observation 6',
        'Observation 7',
        'Observation 8',
        'Observation 9',
        'Observation 10',
      ],
      contamination_evidence: [
        'Contam 1',
        'Contam 2',
        'Contam 3',
        'Contam 4',
        'Contam 5',
        'Contam 6',
        'Contam 7',
        'Contam 8',
      ],
      uncertainty: [
        'Uncertainty 1',
        'Uncertainty 2',
        'Uncertainty 3',
        'Uncertainty 4',
        'Uncertainty 5',
        'Uncertainty 6',
        'Uncertainty 7',
        'Uncertainty 8',
      ],
      recommended_preparation: [
        'Prep 1',
        'Prep 2',
        'Prep 3',
        'Prep 4',
        'Prep 5',
        'Prep 6',
        'Prep 7',
        'Prep 8',
      ],
    };

    const result = normalizeAndValidateAIResponse(oversizedMock);

    // Production bounds in normalizeAndValidateAIResponse:
    // visual_evidence capped at 6
    assert.strictEqual(result.visual_evidence?.length, 6);
    // contamination_evidence capped at 6
    assert.strictEqual(result.contamination_evidence?.length, 6);
    // uncertainty sliced to 5
    assert.strictEqual(result.uncertainty?.length, 5);
    // recommended_preparation sliced to 5
    assert.strictEqual(result.recommended_preparation?.length, 5);
  });
});
