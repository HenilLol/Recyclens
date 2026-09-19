import { Request, Response } from 'express';
import { z } from 'zod';
import { aiVisionService } from '../services/ai-vision.service.ts';
import { fallbackService } from '../services/fallback.service.ts';
import { valuationService } from '../services/valuation.service.ts';
import { matchingService } from '../services/matching.service.ts';
import { optimizationService } from '../services/optimization.service.ts';
import presetsData from '../data/preset-scans.json';
import { ScanAnalysisResponse, RecoveryProfile } from '../../src/types/recyclens.types.ts';

// In-Memory Rate Limiter (20 requests per minute per IP)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_MAX = 20;
const RATE_LIMIT_WINDOW_MS = 60 * 1000;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return false;
  }

  entry.count += 1;
  return true;
}

// Zod Input Validation Schema
const scanAnalyzeSchema = z
  .object({
    image: z
      .string()
      .max(25 * 1024 * 1024, 'Image payload exceeds 25MB maximum base64 limit')
      .regex(/^data:image\/(jpeg|jpg|png|webp);base64,[A-Za-z0-9+/=\s]+$/, 'Image must be a valid JPEG, PNG, or WebP base64 data URI')
      .optional(),
    preset_id: z.string().min(1).max(100).optional(),
    weight_kg: z.number().min(0.1, 'Weight must be at least 0.1 kg').max(10000, 'Weight cannot exceed 10,000 kg').optional(),
    location: z
      .object({
        lat: z.number().min(-90).max(90),
        lng: z.number().min(-180).max(180),
        label: z.string().max(200).optional(),
      })
      .optional(),
    material_hint: z.string().max(100).optional(),
  })
  .refine((data) => data.image || data.preset_id, {
    message: 'Either image or preset_id must be provided.',
    path: ['image'],
  });

export class ScanController {
  public async analyzeScan(req: Request, res: Response) {
    const startTime = Date.now();

    // 1. Rate Limiting Check
    const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
    if (!checkRateLimit(clientIp)) {
      return res.status(429).json({
        error: 'Rate limit exceeded.',
        message: 'Maximum 20 scan requests per minute permitted for live demonstration.',
      });
    }

    // 2. Input Validation
    const validation = scanAnalyzeSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: 'Invalid scan request parameters.',
        details: validation.error.format(),
      });
    }

    const { image, weight_kg, location, preset_id, material_hint } = validation.data;

    try {
      let profileData: Omit<RecoveryProfile, 'id' | 'scan_id' | 'timestamp'>;
      let isFallback = false;
      let aiEngine = (process.env.GEMINI_MODEL || 'Gemini 3.6 Flash') + ' (Live VLM)';

      // Tier 1: Live Multimodal VLM
      if (image && aiVisionService.isConfigured() && !preset_id) {
        try {
          profileData = await aiVisionService.analyzeImage(image);
          if (profileData.model_name) {
            aiEngine = profileData.model_name;
          }
        } catch (aiErr: any) {
          console.warn('[AI Vision Service Warning]: Live call failed or timed out. Gracefully routing to deterministic fallback.', aiErr?.message);
          profileData = fallbackService.generateFallbackProfile(material_hint, preset_id);
          isFallback = true;
          aiEngine = 'Demo fallback mode — visual AI unavailable';
        }
      } else {
        // Tier 2/3: Deterministic Fallback / Preset Engine
        profileData = fallbackService.generateFallbackProfile(material_hint, preset_id);
        isFallback = true;
        aiEngine = preset_id ? 'Demo Preset Verification Archetype' : 'Demo fallback mode — visual AI unavailable';
      }

      const scanId = `scan-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const fullProfile: RecoveryProfile = {
        id: `prof-${Date.now()}`,
        scan_id: scanId,
        ...profileData,
        timestamp: new Date().toISOString(),
      };

      // 3. Valuation Calculation
      const effectiveWeight = typeof weight_kg === 'number' && weight_kg > 0 ? weight_kg : 10.0;
      const isUserSpecifiedWeight = typeof weight_kg === 'number' && weight_kg > 0;

      const valuation = valuationService.calculateValuation({
        materialCode: fullProfile.primary_material.code,
        weightKg: effectiveWeight,
        contaminationPercentage: fullProfile.contamination.percentage,
        qualityGrade: fullProfile.recoverability.grade,
        isUserSpecifiedWeight,
        composition: fullProfile.composition,
        unresolvedSharePercent: fullProfile.unresolved_fraction?.estimated_share_percent,
      });

      // 4. Recycler Matching Calculation with Honest Default Location Label
      const userLoc = location && typeof location.lat === 'number'
        ? location
        : { lat: 19.076, lng: 72.8777, label: 'Demo Default Location (Mumbai MMR)' };

      const matchResults = matchingService.findBestMatches({
        materialCode: fullProfile.primary_material.code,
        weightKg: effectiveWeight,
        contaminationPercentage: fullProfile.contamination.percentage,
        userLocation: userLoc,
        valuation,
        composition: fullProfile.composition,
      });

      // 5. Recovery Optimization & What-If Intelligence (Phase 4)
      const optimization = optimizationService.generateOptimizationIntelligence({
        profile: fullProfile,
        valuation,
        effectiveWeightKg: effectiveWeight,
        isUserSpecifiedWeight,
      });

      const responsePayload: ScanAnalysisResponse = {
        scan_id: scanId,
        image_url: image || (presetsData.find((p) => p.id === preset_id)?.image_url ?? ''),
        recovery_profile: fullProfile,
        valuation,
        matches: matchResults.allMatches,
        eligible_matches: matchResults.eligibleMatches,
        incompatible_matches: matchResults.incompatibleMatches,
        split_routes: matchResults.splitRoutes,
        optimization_scenarios: optimization.scenarios,
        optimization_comparison: optimization.comparison,
        telemetry: {
          processing_time_ms: Date.now() - startTime,
          ai_engine: aiEngine,
          is_offline_fallback: isFallback,
        },
      };

      return res.json(responsePayload);
    } catch (err: any) {
      console.error('[ScanController Error]:', err?.message || err);
      return res.status(500).json({
        error: 'Failed to complete material recovery intelligence analysis.',
        message: 'Internal server error occurred while processing scan request.',
      });
    }
  }

  public getPresets(req: Request, res: Response) {
    return res.json(presetsData);
  }
}

export const scanController = new ScanController();
