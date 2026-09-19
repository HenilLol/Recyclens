import { Request, Response } from 'express';
import { reconciliationService, reconcileIntakeInputSchema } from '../services/reconciliation.service.ts';

export class ReconciliationController {
  /**
   * POST /api/reconciliation/report
   * Generates a dock intake reconciliation report comparing physical observations against passport expectations.
   */
  public reconcileIntake(req: Request, res: Response) {
    const validation = reconcileIntakeInputSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: 'Invalid intake reconciliation parameters.',
        details: validation.error.format(),
      });
    }

    try {
      const report = reconciliationService.reconcileIntake(validation.data as any);
      return res.status(201).json({
        success: true,
        message: 'Intake reconciliation report generated successfully.',
        report,
      });
    } catch (err: any) {
      return res.status(500).json({
        error: 'Failed to generate reconciliation report.',
        message: err?.message || 'Internal processing error.',
      });
    }
  }
}

export const reconciliationController = new ReconciliationController();
