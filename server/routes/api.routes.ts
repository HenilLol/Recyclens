import { Router } from 'express';
import { scanController } from '../controllers/scan.controller.ts';
import { ratesController } from '../controllers/rates.controller.ts';
import { matchController } from '../controllers/match.controller.ts';
import { feedbackController } from '../controllers/feedback.controller.ts';
import { passportController } from '../controllers/passport.controller.ts';
import { aiVisionService } from '../services/ai-vision.service.ts';

const router = Router();

// Health & Telemetry
router.get('/health', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    service: 'RecycLens Material Recovery Intelligence API',
    ai_vision_configured: aiVisionService.isConfigured(),
    version: '1.0.0-hackathon-mvp',
  });
});

// Scan & Analysis Endpoints
router.post('/scan/analyze', (req, res) => scanController.analyzeScan(req, res));
router.get('/scan/presets', (req, res) => scanController.getPresets(req, res));

// Material Rates
router.get('/material-rates', (req, res) => ratesController.getRates(req, res));

// Matching & Recyclers
router.post('/match/calculate', (req, res) => matchController.calculateMatch(req, res));
router.get('/recyclers', (req, res) => matchController.getRecyclers(req, res));

// Human-In-The-Loop Feedback
router.post('/feedback', (req, res) => feedbackController.submitFeedback(req, res));
router.get('/feedback/history', (req, res) => feedbackController.getFeedbackHistory(req, res));

// Recovery Passport (Phase 5.1)
router.post('/passport/create', (req, res) => passportController.createPassport(req, res));

export default router;
