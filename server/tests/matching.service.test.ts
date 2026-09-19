import { test, describe } from 'node:test';
import assert from 'node:assert';
import { matchingService } from '../services/matching.service.ts';
import { valuationService } from '../services/valuation.service.ts';

describe('MatchingService Forensic Unit Tests', () => {
  const valuation = valuationService.calculateValuation({
    materialCode: 'PLASTIC_PET',
    weightKg: 15.0,
    contaminationPercentage: 10.0,
    qualityGrade: 'GRADE_A',
    isUserSpecifiedWeight: true,
  });

  test('should match compatible polymer recycler as eligible and top ranked for PET batch', () => {
    const result = matchingService.findBestMatches({
      materialCode: 'PLASTIC_PET',
      weightKg: 15.0,
      contaminationPercentage: 10.0,
      userLocation: { lat: 19.076, lng: 72.8777, label: 'Mumbai' },
      valuation,
    });

    assert.ok(result.eligibleMatches.length > 0);
    const topMatch = result.eligibleMatches[0];
    assert.strictEqual(topMatch.recycler.id, 'rec-mumbai-01'); // EcoPolymer
    assert.strictEqual(topMatch.is_eligible, true);
    assert.strictEqual(topMatch.scorecard.material_compatibility, 100);
    assert.ok(topMatch.total_score >= 80);
  });

  test('should mark facilities with incompatible material intake as ineligible', () => {
    const result = matchingService.findBestMatches({
      materialCode: 'PAPER_CARDBOARD',
      weightKg: 20.0,
      contaminationPercentage: 5.0,
      userLocation: { lat: 19.076, lng: 72.8777, label: 'Mumbai' },
      valuation,
    });

    // Paper mill should be eligible
    const paperMill = result.eligibleMatches.find((m) => m.recycler.id === 'rec-mumbai-02');
    assert.ok(paperMill);
    assert.strictEqual(paperMill?.is_eligible, true);

    // Polymer recycler should be in incompatibleMatches
    const polymerMRF = result.incompatibleMatches.find((m) => m.recycler.id === 'rec-mumbai-01');
    assert.ok(polymerMRF);
    assert.strictEqual(polymerMRF?.is_eligible, false);
    assert.strictEqual(polymerMRF?.scorecard.material_compatibility, 0);
  });

  test('should return 0 eligible matches for unaccepted exotic material or extreme contamination', () => {
    const result = matchingService.findBestMatches({
      materialCode: 'ORGANIC_RADIOACTIVE_WASTE',
      weightKg: 50.0,
      contaminationPercentage: 90.0,
      userLocation: { lat: 19.076, lng: 72.8777 },
      valuation,
    });

    assert.strictEqual(result.eligibleMatches.length, 0);
    assert.strictEqual(result.incompatibleMatches.length, 6);
  });
});
