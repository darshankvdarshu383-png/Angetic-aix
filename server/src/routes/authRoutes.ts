import { Router, Request, Response } from 'express';
import { db } from '../db/database.js';
import { DEFAULT_USER_ID } from '../db/seedData.js';
import { z } from 'zod';

const router = Router();

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(4),
});

const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(4),
  full_name: z.string().min(2),
  role: z.enum(['FINOPS_OPERATOR', 'SECOPS_ENGINEER', 'CFO', 'INCIDENT_COMMANDER']).optional(),
  organization: z.string().optional(),
});

// Demo login: instant workspace access
router.post('/demo', (req: Request, res: Response) => {
  db.bootstrapUserData(DEFAULT_USER_ID);
  const profile = db.getProfile(DEFAULT_USER_ID);
  res.json({
    success: true,
    user: profile,
    token: `demo-jwt-token-${DEFAULT_USER_ID}`,
  });
});

// Standard login
router.post('/login', (req: Request, res: Response) => {
  const result = LoginSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: 'Invalid login credentials', details: result.error.errors });
  }

  const { email } = result.data;
  // In demo / production mode, find or create
  let profile = db.getProfile(DEFAULT_USER_ID);
  if (email !== 'alex.mercer@aegisflow.io') {
    // Check if another profile exists
    profile = {
      id: `usr-${Buffer.from(email).toString('hex').substring(0, 12)}`,
      email,
      full_name: email.split('@')[0].replace('.', ' '),
      role: 'FINOPS_OPERATOR',
      organization: 'AegisFlow Enterprise',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    db.saveProfile(profile);
    db.bootstrapUserData(profile.id);
  }

  if (!profile) {
    profile = {
      id: DEFAULT_USER_ID,
      email: 'alex.mercer@aegisflow.io',
      full_name: 'Alex Mercer (Lead SecOps & FinOps Commander)',
      role: 'INCIDENT_COMMANDER',
      organization: 'AegisFlow Enterprise Global',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }

  res.json({
    success: true,
    user: profile,
    token: `jwt-session-${profile.id}`,
  });
});

// Register
router.post('/register', (req: Request, res: Response) => {
  const result = RegisterSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: 'Invalid registration details', details: result.error.errors });
  }

  const { email, full_name, role, organization } = result.data;
  const userId = `usr-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;

  const profile = {
    id: userId,
    email,
    full_name,
    role: role || 'FINOPS_OPERATOR',
    organization: organization || 'Enterprise Client',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  db.saveProfile(profile);
  db.bootstrapUserData(userId);

  res.status(201).json({
    success: true,
    user: profile,
    token: `jwt-session-${userId}`,
  });
});

// Get current user profile
router.get('/me', (req: Request, res: Response) => {
  const userId = (req.headers['x-user-id'] as string) || DEFAULT_USER_ID;
  const profile = db.getProfile(userId) || db.getProfile(DEFAULT_USER_ID);
  res.json({ user: profile });
});

export default router;
