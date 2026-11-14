import { Router, Request, Response } from 'express';
import { db } from '../db/database.js';
import { DEFAULT_USER_ID } from '../db/seedData.js';
import { SiloSource, FragmentedDataRecord } from '../db/schema.js';
import { z } from 'zod';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  const userId = (req.headers['x-user-id'] as string) || DEFAULT_USER_ID;
  const { silo, anomalyOnly, search } = req.query;

  let records = db.getRecords(userId);

  if (silo && silo !== 'ALL') {
    records = records.filter((r) => r.silo_source === silo);
  }

  if (anomalyOnly === 'true') {
    records = records.filter((r) => r.is_anomaly);
  }

  if (search && typeof search === 'string') {
    const q = search.toLowerCase();
    records = records.filter(
      (r) =>
        r.entity_name.toLowerCase().includes(q) ||
        r.external_record_id.toLowerCase().includes(q) ||
        (r.anomaly_reason && r.anomaly_reason.toLowerCase().includes(q)) ||
        r.status.toLowerCase().includes(q)
    );
  }

  res.json({
    records,
    total: records.length,
  });
});

router.get('/silos', (req: Request, res: Response) => {
  const userId = (req.headers['x-user-id'] as string) || DEFAULT_USER_ID;
  const records = db.getRecords(userId);

  const silos: SiloSource[] = [
    'SAP_ERP_LEDGER',
    'AWS_COST_EXPLORER',
    'STRIPE_BILLING',
    'NETSUITE_VENDORS',
    'AUTH0_SECURITY_LOGS',
  ];

  const breakdown = silos.map((siloKey) => {
    const siloRecords = records.filter((r) => r.silo_source === siloKey);
    const anomalies = siloRecords.filter((r) => r.is_anomaly);
    const totalUsd = siloRecords.reduce((sum, r) => sum + (r.amount_usd || 0), 0);
    const latestRecord = siloRecords[0];

    return {
      silo: siloKey,
      totalRecords: siloRecords.length,
      anomaliesCount: anomalies.length,
      totalUsd,
      latestTimestamp: latestRecord?.timestamp || null,
      healthStatus: anomalies.length > 0 ? 'ANOMALIES_DETECTED' : 'HEALTHY',
    };
  });

  res.json({ silos: breakdown });
});

const NewRecordSchema = z.object({
  silo_source: z.enum([
    'SAP_ERP_LEDGER',
    'AWS_COST_EXPLORER',
    'STRIPE_BILLING',
    'NETSUITE_VENDORS',
    'AUTH0_SECURITY_LOGS',
  ]),
  external_record_id: z.string().min(1),
  entity_name: z.string().min(1),
  amount_usd: z.number().default(0),
  status: z.string().default('NORMAL'),
  is_anomaly: z.boolean().default(false),
  anomaly_reason: z.string().optional(),
  raw_payload: z.record(z.any()).default({}),
});

router.post('/record', (req: Request, res: Response) => {
  const userId = (req.headers['x-user-id'] as string) || DEFAULT_USER_ID;
  const parseResult = NewRecordSchema.safeParse(req.body);

  if (!parseResult.success) {
    return res.status(400).json({ error: 'Invalid telemetry record', details: parseResult.error.errors });
  }

  const record: FragmentedDataRecord = {
    id: `rec-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
    user_id: userId,
    ...parseResult.data,
    timestamp: new Date().toISOString(),
    created_at: new Date().toISOString(),
  };

  db.insertRecord(record);

  res.status(201).json({
    success: true,
    record,
  });
});

export default router;
