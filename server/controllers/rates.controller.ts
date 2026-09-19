import { Request, Response } from 'express';
import { valuationService } from '../services/valuation.service.ts';

export class RatesController {
  public getRates(req: Request, res: Response) {
    try {
      const rates = valuationService.getAllRates();
      return res.json({
        total: rates.length,
        region: 'IN_WEST_MUMBAI',
        currency: 'INR',
        currency_symbol: '₹',
        rates,
      });
    } catch (err: any) {
      return res.status(500).json({ error: 'Failed to retrieve material rates.' });
    }
  }
}

export const ratesController = new RatesController();
