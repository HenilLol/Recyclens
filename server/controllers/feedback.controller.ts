import { Request, Response } from 'express';
import { z } from 'zod';
import { FeedbackSubmission } from '../../src/types/recyclens.types.ts';

const feedbackSchema = z.object({
  scan_id: z.string().min(1).max(100),
  corrected_material_code: z.string().max(50).optional(),
  actual_measured_weight_kg: z.number().min(0.1).max(10000).optional(),
  actual_realized_rate: z.number().min(0).max(10000).optional(),
  preparation_completed_status: z.enum(['NOT_PREPARED', 'PARTIALLY_PREPARED', 'FULLY_PREPARED']).optional(),
  operator_observed_contamination_percent: z.number().min(0).max(100).optional(),
  user_notes: z.string().max(1000).optional(),
  contact_email: z.string().email().max(100).optional(),
});

// In-memory feedback store for HITL collection
const feedbackLog: (FeedbackSubmission & { timestamp: string; id: string })[] = [];

export class FeedbackController {
  public submitFeedback(req: Request, res: Response) {
    const validation = feedbackSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: 'Invalid feedback parameters.',
        details: validation.error.format(),
      });
    }

    try {
      const {
        scan_id,
        corrected_material_code,
        actual_measured_weight_kg,
        actual_realized_rate,
        preparation_completed_status,
        operator_observed_contamination_percent,
        user_notes,
        contact_email,
      } = validation.data;

      const entry = {
        id: `fb-${Date.now()}`,
        scan_id,
        corrected_material_code,
        actual_measured_weight_kg,
        actual_realized_rate,
        preparation_completed_status,
        operator_observed_contamination_percent,
        user_notes,
        contact_email,
        timestamp: new Date().toISOString(),
      };

      feedbackLog.push(entry);

      return res.json({
        success: true,
        message: 'Material recovery intelligence feedback logged for dataset refinement.',
        feedback_id: entry.id,
      });
    } catch (err: any) {
      return res.status(500).json({ error: 'Failed to record feedback.' });
    }
  }

  public getFeedbackHistory(req: Request, res: Response) {
    return res.json({ total: feedbackLog.length, history: feedbackLog });
  }
}

export const feedbackController = new FeedbackController();
