import { Router, Request, Response } from 'express';
import { db } from '../db/database.js';
import { DEFAULT_USER_ID } from '../db/seedData.js';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  const userId = (req.headers['x-user-id'] as string) || DEFAULT_USER_ID;
  const { actor_type, risk_level, limit } = req.query;

  const max = limit ? parseInt(limit as string, 10) : 100;
  let logs = db.getAuditLogs(userId, max);

  if (actor_type && actor_type !== 'ALL') {
    logs = logs.filter((l) => l.actor_type === actor_type);
  }

  if (risk_level && risk_level !== 'ALL') {
    logs = logs.filter((l) => l.risk_level === risk_level);
  }

  res.json({
    auditLogs: logs,
    total: logs.length,
  });
});

export default router;
