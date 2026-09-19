import { test, describe } from 'node:test';
import assert from 'node:assert';
import { valuationService } from '../services/valuation.service.ts';

describe('ValuationService Forensic Unit Tests', () => {
  test('should calculate correct clean benchmark and indicative range for normal PET batch', () => {
    const result = valuationService.calculateValuation({
      materialCode: 'PLASTIC_PET',
      weightKg: 15.0,
      contaminationPercentage: 12.0,
      qualityGrade: 'GRADE_A',
      isUserSpecifiedWeight: true,
    });

    assert.strictEqual(result.currency, 'INR');
    assert.strictEqual(result.batch_weight_kg, 15.0);
    // PET rate min=32.0, max=38.5, mid=35.25. 15 * 35.25 = 528.75
    assert.strictEqual(result.clean_batch_benchmark, 528.75);
    assert.ok(result.contamination_penalty_amount > 0);
    assert.ok(result.indicative_net_range.min < result.indicative_net_range.max);
    assert.strictEqual(result.indicative_net_range.min, 431);
    assert.strictEqual(result.indicative_net_range.max, 519);
    assert.strictEqual(result.is_estimate, true);
  });

  test('should apply higher contamination penalty for heavily soiled cardboard', () => {
    const cleanResult = valuationService.calculateValuation({
      materialCode: 'PAPER_CARDBOARD',
      weightKg: 10.0,
      contaminationPercentage: 0.0,
      qualityGrade: 'GRADE_A',
      isUserSpecifiedWeight: true,
    });

    const dirtyResult = valuationService.calculateValuation({
      materialCode: 'PAPER_CARDBOARD',
      weightKg: 10.0,
      contaminationPercentage: 40.0,
      qualityGrade: 'GRADE_C',
      isUserSpecifiedWeight: true,
    });

    assert.ok(dirtyResult.contamination_penalty_amount > cleanResult.contamination_penalty_amount);
    assert.ok(dirtyResult.indicative_net_range.min < cleanResult.indicative_net_range.min);
    assert.ok(dirtyResult.indicative_net_range.max < cleanResult.indicative_net_range.max);
  });

  test('should safely handle invalid or negative inputs without NaN or throwing', () => {
    const result = valuationService.calculateValuation({
      materialCode: 'NON_EXISTENT_POLYMER',
      weightKg: -5.0,
      contaminationPercentage: 999,
      qualityGrade: 'REJECT',
      isUserSpecifiedWeight: false,
    });

    assert.ok(!isNaN(result.clean_batch_benchmark));
    assert.ok(!isNaN(result.indicative_net_range.min));
    assert.ok(!isNaN(result.indicative_net_range.max));
    assert.ok(result.indicative_net_range.min >= 0);
    assert.ok(result.indicative_net_range.max >= result.indicative_net_range.min);
  });
});
