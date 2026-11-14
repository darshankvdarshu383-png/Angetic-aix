import { Router, Request, Response } from 'express';
import { db } from '../db/database.js';
import { DEFAULT_USER_ID } from '../db/seedData.js';

const router = Router();

// Idempotent workspace bootstrap
router.post('/bootstrap', (req: Request, res: Response) => {
  const userId = (req.headers['x-user-id'] as string) || DEFAULT_USER_ID;
  db.bootstrapUserData(userId);

  const policy = db.getGuardrailPolicy(userId);
  const records = db.getRecords(userId);
  const incidents = db.getIncidents(userId);

  res.json({
    success: true,
    message: 'AegisFlow workspace bootstrapped successfully',
    summary: {
      userId,
      recordsCount: records.length,
      incidentsCount: incidents.length,
      policyConfigured: !!policy,
    },
  });
});

// Full reset to pristine demo state
router.post('/reset', (req: Request, res: Response) => {
  const userId = (req.headers['x-user-id'] as string) || DEFAULT_USER_ID;
  db.resetToSeed(userId);

  res.json({
    success: true,
    message: 'AegisFlow workspace restored to factory demo state',
  });
});

export default router;
