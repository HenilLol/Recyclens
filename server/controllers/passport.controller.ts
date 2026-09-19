import { Request, Response } from 'express';
import { passportService, createPassportSchema } from '../services/passport.service.ts';

export class PassportController {
  /**
   * POST /api/passport/create
   * Creates an operational, tamper-evident Recovery Passport snapshot.
   */
  public createPassport(req: Request, res: Response) {
    // 1. Validate incoming payload against strict Zod schema
    const validation = createPassportSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: 'Invalid recovery passport parameters.',
        details: validation.error.format(),
      });
    }

    try {
      // 2. Generate deterministic passport snapshot with cryptographic integrity
      const passport = passportService.createPassport(validation.data as any);

      return res.status(201).json({
        success: true,
        message: 'Operational recovery passport snapshot created successfully.',
        passport,
      });
    } catch (err: any) {
      console.error('[PassportController.createPassport] Error:', err?.message || err);
      return res.status(500).json({
        error: 'Failed to create recovery passport snapshot.',
        message: err?.message || 'Internal processing error.',
      });
    }
  }
}

export const passportController = new PassportController();
