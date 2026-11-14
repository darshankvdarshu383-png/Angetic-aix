import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import fs from 'fs';
import { config } from './config.js';
import { db } from './db/database.js';

// Route handlers
import authRoutes from './routes/authRoutes.js';
import seedRoutes from './routes/seedRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import dataSourcesRoutes from './routes/dataSourcesRoutes.js';
import chaosRoutes from './routes/chaosRoutes.js';
import incidentRoutes from './routes/incidentRoutes.js';
import guardrailRoutes from './routes/guardrailRoutes.js';
import financeRoutes from './routes/financeRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import auditRoutes from './routes/auditRoutes.js';

const app = express();

// Security Middlewares
app.use(helmet({
  crossOriginResourcePolicy: false,
}));

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-user-id', 'x-operator-name'],
}));

app.use(express.json({ limit: '10mb' }));

// Rate Limiter
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please slow down.' },
});
app.use('/api', apiLimiter);

// System Health Endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ONLINE',
    service: 'AegisFlow Orchestration Engine',
    version: '2.5.0',
    timestamp: new Date().toISOString(),
    geminiStatus: config.geminiApiKey ? 'ACTIVE_LIVE_API' : 'ACTIVE_DETERMINISTIC_REASONER',
    databaseMode: db.isSupabaseConnected ? 'SUPABASE_CLOUD' : 'LOCAL_HIGH_PERFORMANCE_STORE',
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/seed', seedRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/data-sources', dataSourcesRoutes);
app.use('/api/chaos', chaosRoutes);
app.use('/api/incidents', incidentRoutes);
app.use('/api/guardrails', guardrailRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/audit-logs', auditRoutes);

// Static Frontend Serving in Production
const clientDistCandidates = [
  path.resolve(process.cwd(), '../client/dist'),
  path.resolve(process.cwd(), 'client/dist'),
  path.resolve(__dirname, '../../client/dist'),
];

for (const distPath of clientDistCandidates) {
  if (fs.existsSync(distPath)) {
    console.log(`[AegisFlow] Serving static production frontend from: ${distPath}`);
    app.use(express.static(distPath));
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api')) return next();
      res.sendFile(path.join(distPath, 'index.html'));
    });
    break;
  }
}

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('[AegisFlow Server Error]:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message || 'An unexpected server fault occurred',
  });
});

const PORT = config.port;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`=======================================================`);
  console.log(`🛡️  AEGISFLOW DECISION CORE SERVER RUNNING ON PORT ${PORT}`);
  console.log(`   Environment: ${config.nodeEnv}`);
  console.log(`   Gemini Engine: ${config.geminiApiKey ? 'ONLINE (Live Gemini 2.5 Flash)' : 'ONLINE (Deterministic Engine Fallback)'}`);
  console.log(`   Database Engine: ${db.isSupabaseConnected ? 'Connected to Supabase' : 'Local Persistent Relational Store'}`);
  console.log(`=======================================================`);
});
