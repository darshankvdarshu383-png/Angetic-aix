import { Router, Request, Response } from 'express';
import { db } from '../db/database.js';
import { DEFAULT_USER_ID } from '../db/seedData.js';
import { geminiService } from '../ai/geminiClient.js';
import { z } from 'zod';

const router = Router();

const FinanceAnalyzeSchema = z.object({
  growthScenario: z.string().optional().default('Baseline High-Volatility'),
  stressMultiplier: z.number().min(0.1).max(10).optional().default(1.0),
});

router.post('/analyze', async (req: Request, res: Response) => {
  const userId = (req.headers['x-user-id'] as string) || DEFAULT_USER_ID;
  const parseResult = FinanceAnalyzeSchema.safeParse(req.body);

  if (!parseResult.success) {
    return res.status(400).json({ error: 'Invalid financial parameters', details: parseResult.error.errors });
  }

  const { growthScenario, stressMultiplier } = parseResult.data;
  const incidents = db.getIncidents(userId).filter((i) => i.status !== 'RESOLVED');
  const records = db.getRecords(userId);

  try {
    const analysis = await geminiService.generateFinanceAnalysis(incidents, records, {
      growthScenario,
      stressMultiplier,
    });

    res.json({
      success: true,
      parameters: { growthScenario, stressMultiplier },
      analysis,
    });
  } catch (err: any) {
    console.error('[FinanceRoutes] Finance analysis error:', err);
    res.status(500).json({ error: 'Failed to generate financial analysis', details: err.message });
  }
});

export default router;
