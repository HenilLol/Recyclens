import { Request, Response } from 'express';
import { z } from 'zod';
import { valuationService } from '../services/valuation.service.ts';
import { matchingService } from '../services/matching.service.ts';

const matchCalculateSchema = z.object({
  material_code: z.string().min(1).max(50),
  weight_kg: z.number().min(0.1).max(10000).optional(),
  contamination_percentage: z.number().min(0).max(100).optional(),
  quality_grade: z.enum(['GRADE_A', 'GRADE_B', 'GRADE_C', 'REJECT']).optional(),
  location: z
    .object({
      lat: z.number().min(-90).max(90),
      lng: z.number().min(-180).max(180),
      label: z.string().max(200).optional(),
    })
    .optional(),
});

export class MatchController {
  public calculateMatch(req: Request, res: Response) {
    const validation = matchCalculateSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: 'Invalid match recalculation parameters.',
        details: validation.error.format(),
      });
    }

    try {
      const { material_code, weight_kg, contamination_percentage, quality_grade, location } = validation.data;

      const effectiveWeight = typeof weight_kg === 'number' && weight_kg > 0 ? weight_kg : 10.0;
      const contam = typeof contamination_percentage === 'number' ? contamination_percentage : 10.0;
      const grade = quality_grade || 'GRADE_A';

      const valuation = valuationService.calculateValuation({
        materialCode: material_code,
        weightKg: effectiveWeight,
        contaminationPercentage: contam,
        qualityGrade: grade,
        isUserSpecifiedWeight: true,
      });

      const userLoc = location && typeof location.lat === 'number'
        ? location
        : { lat: 19.076, lng: 72.8777, label: 'Demo Default (Mumbai MMR)' };

      const matchResults = matchingService.findBestMatches({
        materialCode: material_code,
        weightKg: effectiveWeight,
        contaminationPercentage: contam,
        userLocation: userLoc,
        valuation,
      });

      return res.json({
        valuation,
        matches: matchResults.allMatches,
        eligible_matches: matchResults.eligibleMatches,
        incompatible_matches: matchResults.incompatibleMatches,
      });
    } catch (err: any) {
      return res.status(500).json({ error: 'Failed to recalculate matches.' });
    }
  }

  public getRecyclers(req: Request, res: Response) {
    try {
      const recyclers = matchingService.getAllRecyclers();
      return res.json({ total: recyclers.length, recyclers });
    } catch (err: any) {
      return res.status(500).json({ error: 'Failed to retrieve recyclers.' });
    }
  }
}

export const matchController = new MatchController();
