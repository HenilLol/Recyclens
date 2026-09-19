import recyclersData from '../data/seed-recyclers.json';
import {
  RecyclerPartner,
  RecyclerMatch,
  MatchScorecard,
  ValuationBreakdown,
  BatchComponent,
  SplitRouteRecommendation,
} from '../../src/types/recyclens.types.ts';

function calculateHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

export class MatchingService {
  private recyclers: RecyclerPartner[] = recyclersData as RecyclerPartner[];

  public getAllRecyclers(): RecyclerPartner[] {
    return this.recyclers;
  }

  public findBestMatches(params: {
    materialCode: string;
    weightKg: number;
    contaminationPercentage: number;
    userLocation: { lat: number; lng: number; label?: string };
    valuation: ValuationBreakdown;
    composition?: BatchComponent[];
  }): {
    allMatches: RecyclerMatch[];
    eligibleMatches: RecyclerMatch[];
    incompatibleMatches: RecyclerMatch[];
    splitRoutes?: SplitRouteRecommendation[];
  } {
    const { materialCode, weightKg, contaminationPercentage, userLocation, valuation, composition } = params;

    const allMatches: RecyclerMatch[] = this.recyclers.map((recycler) => {
      const distanceKm = calculateHaversineDistance(
        userLocation.lat,
        userLocation.lng,
        recycler.location.lat,
        recycler.location.lng
      );

      // 1. Material Compatibility (35% weight)
      const acceptsPrimary = recycler.accepted_materials.includes(materialCode);
      const unacceptedComponents = composition
        ? composition.filter((c) => !recycler.accepted_materials.includes(c.material_code))
        : [];
      const acceptedComponents = composition
        ? composition.filter((c) => recycler.accepted_materials.includes(c.material_code))
        : [];

      let materialScore = acceptsPrimary ? 100 : 0;
      if (composition && composition.length > 1) {
        const acceptedShare = acceptedComponents.reduce((sum, c) => sum + c.estimated_share_percent, 0);
        if (acceptsPrimary || acceptedShare >= 50) {
          materialScore = Math.max(20, Math.round(acceptedShare));
        } else {
          materialScore = 0;
        }
      }

      // 2. Quantity Compatibility (20% weight)
      let quantityScore = 100;
      if (weightKg < recycler.min_batch_weight_kg) {
        quantityScore = Math.max(0, Math.round((weightKg / recycler.min_batch_weight_kg) * 100));
      }

      // 3. Contamination Tolerance (15% weight)
      let contamScore = 100;
      const severeContamination = contaminationPercentage > recycler.max_contamination_tolerance * 1.5;
      if (contaminationPercentage > recycler.max_contamination_tolerance) {
        const excess = contaminationPercentage - recycler.max_contamination_tolerance;
        contamScore = Math.max(0, Math.round(100 - excess * 5));
      }

      // 4. Distance Score (15% weight)
      let distanceScore = 100;
      if (distanceKm > 5) {
        const maxDist = recycler.service_radius_km * 1.2;
        distanceScore = Math.max(0, Math.round((1 - distanceKm / maxDist) * 100));
      }

      // 5. Pickup Availability (10% weight)
      const pickupOffered = recycler.pickup_available && distanceKm <= recycler.service_radius_km;
      const pickupScore = pickupOffered ? 100 : 50;

      // 6. Verification / Data Archetype Status (5% weight)
      const verificationScore = recycler.verification_status === 'DEMO_ARCHETYPE' ? 100 : 80;

      // Determine Eligibility:
      // A route is ELIGIBLE only if it accepts primary intake and is not severely contaminated beyond handling limits
      const isEligible = acceptsPrimary && !severeContamination;

      // Weighted Composite Score
      const totalScore = Math.round(
        materialScore * 0.35 +
          quantityScore * 0.2 +
          contamScore * 0.15 +
          distanceScore * 0.15 +
          pickupScore * 0.1 +
          verificationScore * 0.05
      );

      // Calculate Custom Recycler Payout Range
      const mult = recycler.indicative_payout_multiplier || 1.0;
      const minPayout = Math.round(valuation.indicative_net_range.min * mult);
      const maxPayout = Math.round(valuation.indicative_net_range.max * mult);

      // Match Reasons & Warnings
      const reasons: string[] = [];
      const warnings: string[] = [];

      if (acceptsPrimary) {
        reasons.push(`Direct intake capability configured for ${materialCode.replace('_', ' ')}`);
        if (acceptedComponents.length > 1) {
          reasons.push(`Compatible with multiple batch components: ${acceptedComponents.map((c) => c.material).join(', ')}`);
        }
      } else {
        warnings.push(`Does not accept ${materialCode.replace('_', ' ')} as primary intake`);
      }

      if (unacceptedComponents.length > 0 && acceptsPrimary && unacceptedComponents.length < (composition?.length || 0)) {
        warnings.push(`Batch contains non-intake fractions (${unacceptedComponents.map((c) => c.material).join(', ')}); dock sorting or pre-separation required`);
      }

      if (weightKg >= recycler.min_batch_weight_kg) {
        reasons.push(`Batch weight satisfies ${recycler.min_batch_weight_kg}kg batch minimum`);
      } else {
        warnings.push(`Batch (${weightKg}kg) below preferred ${recycler.min_batch_weight_kg}kg minimum`);
      }

      if (contaminationPercentage <= recycler.max_contamination_tolerance) {
        reasons.push(`Contamination (${contaminationPercentage}%) within facility limit (${recycler.max_contamination_tolerance}%)`);
      } else {
        warnings.push(`Contamination (${contaminationPercentage}%) exceeds facility tolerance (${recycler.max_contamination_tolerance}%)`);
      }

      if (pickupOffered) {
        reasons.push(`Doorstep collection available within ${recycler.service_radius_km}km radius`);
      }

      if (recycler.indicative_payout_multiplier > 1.0 && isEligible) {
        const bonus = Math.round((recycler.indicative_payout_multiplier - 1.0) * 100);
        reasons.push(`Offers simulated +${bonus}% commercial premium for bulk clean batches`);
      }

      if (distanceKm > recycler.service_radius_km) {
        warnings.push(`Located outside standard ${recycler.service_radius_km}km service zone`);
      }

      const scorecard: MatchScorecard = {
        material_compatibility: materialScore,
        quantity_compatibility: quantityScore,
        contamination_tolerance: contamScore,
        distance_score: Math.min(100, Math.max(0, distanceScore)),
        pickup_availability: pickupScore,
        verification_score: verificationScore,
      };

      return {
        recycler,
        is_eligible: isEligible,
        total_score: totalScore,
        scorecard,
        distance_km: distanceKm,
        estimated_payout_range: {
          min: minPayout,
          max: maxPayout,
        },
        pickup_offered: pickupOffered,
        match_reasons: reasons,
        warnings: warnings.length > 0 ? warnings : undefined,
      };
    });

    const eligibleMatches = allMatches.filter((m) => m.is_eligible).sort((a, b) => b.total_score - a.total_score);
    const incompatibleMatches = allMatches.filter((m) => !m.is_eligible).sort((a, b) => b.total_score - a.total_score);

    // Multi-Material Split Route Generation
    let splitRoutes: SplitRouteRecommendation[] | undefined = undefined;
    if (composition && composition.length > 1) {
      const distinctCategories = Array.from(new Set(composition.map((c) => c.category)));
      const separableMajor = composition.filter((c) => c.is_separable && c.estimated_share_percent >= 5);

      if (distinctCategories.length > 1 && separableMajor.length >= 1) {
        const routes: SplitRouteRecommendation[] = [];

        for (const comp of composition) {
          if (comp.estimated_share_percent < 5) continue;

          // Find closest compatible facility for this component
          const compatibleRecyclers = this.recyclers.filter((r) => r.accepted_materials.includes(comp.material_code));
          let bestRecycler: RecyclerPartner | undefined = undefined;
          let bestDist = Infinity;

          for (const r of compatibleRecyclers) {
            const dist = calculateHaversineDistance(userLocation.lat, userLocation.lng, r.location.lat, r.location.lng);
            if (dist < bestDist) {
              bestDist = dist;
              bestRecycler = r;
            }
          }

          const compVal = valuation.component_valuations?.find((cv) => cv.material_code === comp.material_code);
          const compPayout = compVal
            ? { min: compVal.indicative_net_range.min, max: compVal.indicative_net_range.max }
            : { min: 0, max: 0 };

          const allocatedKg = Math.round(weightKg * (comp.estimated_share_percent / 100) * 10) / 10;

          routes.push({
            material_code: comp.material_code,
            material_name: comp.material,
            allocated_weight_kg: allocatedKg,
            illustrative_weight_kg: allocatedKg,
            is_provisional: true,
            routing_status: 'PROVISIONAL_SPLIT_ROUTE',
            quantity_basis_disclosure:
              'Illustrative channel mass projected from estimated visual share; routing is provisional pending dock sorting and physical scale weighment.',
            suggested_recycler_id: bestRecycler?.id,
            suggested_recycler_name: bestRecycler ? bestRecycler.name : 'Regional Specialized Aggregator',
            target_facility_type: bestRecycler ? bestRecycler.badge : `${comp.category} Recovery Facility`,
            estimated_payout_range: compPayout,
            preparation_required: comp.preparation_actions,
          });
        }

        if (routes.length >= 2) {
          splitRoutes = routes;
        }
      }
    }

    return {
      allMatches: [...eligibleMatches, ...incompatibleMatches],
      eligibleMatches,
      incompatibleMatches,
      splitRoutes,
    };
  }
}

export const matchingService = new MatchingService();
