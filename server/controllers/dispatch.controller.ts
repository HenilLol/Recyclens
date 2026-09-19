import { Request, Response } from 'express';
import { dispatchService, createDispatchSchema } from '../services/dispatch.service.ts';

export class DispatchController {
  /**
   * POST /api/dispatch/manifest
   * Generates a scenario-aware Recovery Dispatch Manifest from an integrity-verified Recovery Passport.
   */
  public createManifest(req: Request, res: Response) {
    const validation = createDispatchSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: 'Invalid dispatch manifest parameters.',
        details: validation.error.format(),
      });
    }

    try {
      const manifest = dispatchService.createDispatchManifest(validation.data as any);
      return res.status(201).json({
        success: true,
        message: 'Recovery dispatch manifest generated successfully.',
        manifest,
      });
    } catch (err: any) {
      const status = err.message?.includes('integrity verification failed') ? 400 : 500;
      return res.status(status).json({
        error: 'Failed to generate dispatch manifest.',
        message: err?.message || 'Internal processing error.',
      });
    }
  }
}

export const dispatchController = new DispatchController();
