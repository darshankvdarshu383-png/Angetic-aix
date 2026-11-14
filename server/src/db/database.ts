import fs from 'fs';
import path from 'path';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { config } from '../config.js';
import {
  Profile,
  GuardrailPolicy,
  FragmentedDataRecord,
  Incident,
  MitigationWorkflow,
  ChatSession,
  ChatMessage,
  AuditLog,
} from './schema.js';
import {
  DEFAULT_USER_ID,
  createDefaultGuardrailPolicy,
  createSeedRecords,
  createSeedIncidents,
} from './seedData.js';

interface DatabaseSchema {
  profiles: Profile[];
  guardrail_policies: GuardrailPolicy[];
  fragmented_data_records: FragmentedDataRecord[];
  incidents: Incident[];
  mitigation_workflows: MitigationWorkflow[];
  chat_sessions: ChatSession[];
  chat_messages: ChatMessage[];
  audit_logs: AuditLog[];
}

class AegisDatabase {
  private dbPath: string;
  private data: DatabaseSchema;
  public supabase: SupabaseClient | null = null;
  public isSupabaseConnected: boolean = false;

  constructor() {
    this.dbPath = path.join(config.dataDir, 'aegisflow_db.json');
    this.data = {
      profiles: [],
      guardrail_policies: [],
      fragmented_data_records: [],
      incidents: [],
      mitigation_workflows: [],
      chat_sessions: [],
      chat_messages: [],
      audit_logs: [],
    };

    this.initSupabase();
    this.initLocalStorage();
  }

  private initSupabase() {
    if (config.supabaseUrl && config.supabaseKey && !config.supabaseUrl.includes('placeholder')) {
      try {
        this.supabase = createClient(config.supabaseUrl, config.supabaseKey);
        this.isSupabaseConnected = true;
        console.log('[AegisDatabase] Connected to external Supabase instance:', config.supabaseUrl);
        this.syncFromSupabase();
      } catch (err) {
        console.warn('[AegisDatabase] Failed to initialize Supabase client, using local persistent engine:', err);
        this.isSupabaseConnected = false;
      }
    } else {
      console.log('[AegisDatabase] Operating in High-Performance Local Enterprise Storage Mode (Active)');
    }
  }

  public async syncFromSupabase() {
    if (!this.supabase || !this.isSupabaseConnected) return;
    try {
      const [p, g, r, i, m, a] = await Promise.all([
        this.supabase.from('profiles').select('*'),
        this.supabase.from('guardrail_policies').select('*'),
        this.supabase.from('fragmented_data_records').select('*'),
        this.supabase.from('incidents').select('*'),
        this.supabase.from('mitigation_workflows').select('*'),
        this.supabase.from('audit_logs').select('*')
      ]);

      if (p.data && p.data.length > 0) this.data.profiles = p.data;
      if (g.data && g.data.length > 0) this.data.guardrail_policies = g.data;
      if (r.data && r.data.length > 0) this.data.fragmented_data_records = r.data;
      if (i.data && i.data.length > 0) this.data.incidents = i.data;
      if (m.data && m.data.length > 0) this.data.mitigation_workflows = m.data;
      if (a.data && a.data.length > 0) this.data.audit_logs = a.data;

      this.persist();
      console.log('[AegisDatabase] Synced live data from Supabase Cloud:', {
        profiles: this.data.profiles.length,
        records: this.data.fragmented_data_records.length,
        incidents: this.data.incidents.length,
        mitigations: this.data.mitigation_workflows.length,
      });
    } catch (err) {
      console.warn('[AegisDatabase] Supabase initial sync notice:', err);
    }
  }

  private initLocalStorage() {
    if (!fs.existsSync(config.dataDir)) {
      fs.mkdirSync(config.dataDir, { recursive: true });
    }

    if (fs.existsSync(this.dbPath)) {
      try {
        const raw = fs.readFileSync(this.dbPath, 'utf-8');
        this.data = JSON.parse(raw);
        console.log('[AegisDatabase] Loaded existing database with', {
          records: this.data.fragmented_data_records.length,
          incidents: this.data.incidents.length,
          mitigations: this.data.mitigation_workflows.length,
          audit_logs: this.data.audit_logs.length,
        });
      } catch (err) {
        console.error('[AegisDatabase] Corrupted local DB file, reinitializing', err);
        this.persist();
      }
    } else {
      console.log('[AegisDatabase] No database found on disk, bootstrapping initial data...');
      this.bootstrapUserData(DEFAULT_USER_ID);
    }
  }

  private persist() {
    try {
      fs.writeFileSync(this.dbPath, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('[AegisDatabase] Failed to persist data to disk:', err);
    }
  }

  public bootstrapUserData(userId: string = DEFAULT_USER_ID): void {
    // 1. Ensure Profile exists
    const existingProfile = this.data.profiles.find((p) => p.id === userId);
    if (!existingProfile) {
      this.data.profiles.push({
        id: userId,
        email: 'alex.mercer@aegisflow.io',
        full_name: 'Alex Mercer (Lead SecOps & FinOps Commander)',
        role: 'INCIDENT_COMMANDER',
        organization: 'AegisFlow Enterprise Global',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }

    // 2. Ensure Guardrail policy exists
    const existingPolicy = this.data.guardrail_policies.find((p) => p.user_id === userId);
    if (!existingPolicy) {
      this.data.guardrail_policies.push(createDefaultGuardrailPolicy(userId));
    }

    // 3. Ensure Records exist
    const userRecords = this.data.fragmented_data_records.filter((r) => r.user_id === userId);
    if (userRecords.length === 0) {
      const seedRecs = createSeedRecords(userId);
      this.data.fragmented_data_records.push(...seedRecs);
    }

    // 4. Ensure Incidents & Mitigations & Audit Logs exist
    const userIncidents = this.data.incidents.filter((i) => i.user_id === userId);
    if (userIncidents.length === 0) {
      const { incidents, mitigations, auditLogs } = createSeedIncidents(userId);
      this.data.incidents.push(...incidents);
      this.data.mitigation_workflows.push(...mitigations);
      this.data.audit_logs.push(...auditLogs);
    }

    // 5. Ensure Default Welcome Chat Session exists
    const userSessions = this.data.chat_sessions.filter((s) => s.user_id === userId);
    if (userSessions.length === 0) {
      const sessionId = 'session-ops-default';
      this.data.chat_sessions.push({
        id: sessionId,
        user_id: userId,
        title: 'Operations & Cash-at-Risk Triage',
        created_at: new Date(Date.now() - 3600000).toISOString(),
        updated_at: new Date().toISOString(),
      });

      this.data.chat_messages.push({
        id: 'msg-welcome-01',
        session_id: sessionId,
        sender: 'assistant',
        content: `**Welcome to AegisFlow Agentic Operations Command.**

I am continuously monitoring telemetry from **SAP ERP**, **AWS Cost Explorer**, **Stripe Billing**, **NetSuite Vendors**, and **Auth0 Security Logs**.

Currently, I have identified **2 active critical incidents** spanning cross-silo anomalies:
1. **Multi-Region GPU Auto-Scaling Loop** ($52,300 exposure, Risk 88)
2. **Duplicate $85,000 SEPA Wire Batch & Compromised Remittance Bank Update** ($85,000 exposure, Risk 94)

There are **2 high-stakes mitigation workflows awaiting your HITL approval** in the Guardrail Queue. How would you like to proceed?`,
        citations: [
          {
            id: 'inc-cloud-001',
            type: 'INCIDENT',
            title: 'GPU Auto-Scaling Loop',
            financial_usd: 52300,
            risk_score: 88,
            url_path: '/incidents/inc-cloud-001',
          },
          {
            id: 'inc-wire-002',
            type: 'INCIDENT',
            title: 'Duplicate $85k Wire & Vendor IBAN Update',
            financial_usd: 85000,
            risk_score: 94,
            url_path: '/incidents/inc-wire-002',
          },
        ],
        suggested_prompts: [
          'What is our total unmitigated financial exposure right now?',
          'Why did the AWS GPU auto-scaling loop escalate to HITL review?',
          'Simulate the fiscal impact if we approve the SAP wire freeze.',
          'Review the anomalous Tor exit node IP from the Auth0 logs.',
        ],
        created_at: new Date(Date.now() - 3600000).toISOString(),
      });
    }

    this.persist();
  }

  // --- QUERY & MUTATION METHODS ---

  // Profiles
  public getProfile(userId: string): Profile | undefined {
    return this.data.profiles.find((p) => p.id === userId);
  }

  public saveProfile(profile: Profile): void {
    const idx = this.data.profiles.findIndex((p) => p.id === profile.id);
    if (idx >= 0) {
      this.data.profiles[idx] = profile;
    } else {
      this.data.profiles.push(profile);
    }
    this.persist();
  }

  // Guardrail Policies
  public getGuardrailPolicy(userId: string): GuardrailPolicy {
    let policy = this.data.guardrail_policies.find((p) => p.user_id === userId);
    if (!policy) {
      policy = createDefaultGuardrailPolicy(userId);
      this.data.guardrail_policies.push(policy);
      this.persist();
    }
    return policy;
  }

  public updateGuardrailPolicy(userId: string, updates: Partial<GuardrailPolicy>): GuardrailPolicy {
    let policy = this.getGuardrailPolicy(userId);
    policy = {
      ...policy,
      ...updates,
      updated_at: new Date().toISOString(),
    };
    const idx = this.data.guardrail_policies.findIndex((p) => p.user_id === userId);
    this.data.guardrail_policies[idx] = policy;
    this.persist();
    return policy;
  }

  // Fragmented Records
  public getRecords(userId: string): FragmentedDataRecord[] {
    return this.data.fragmented_data_records.filter((r) => r.user_id === userId);
  }

  public getRecordById(id: string): FragmentedDataRecord | undefined {
    return this.data.fragmented_data_records.find((r) => r.id === id);
  }

  public insertRecord(record: FragmentedDataRecord): void {
    this.data.fragmented_data_records.unshift(record);
    this.persist();
  }

  // Incidents
  public getIncidents(userId: string): Incident[] {
    const list = this.data.incidents.filter((i) => i.user_id === userId);
    return list.map((inc) => ({
      ...inc,
      mitigations: this.data.mitigation_workflows.filter((m) => m.incident_id === inc.id),
    }));
  }

  public getIncidentById(id: string): (Incident & { mitigations: MitigationWorkflow[] }) | undefined {
    const inc = this.data.incidents.find((i) => i.id === id);
    if (!inc) return undefined;
    const mitigations = this.data.mitigation_workflows.filter((m) => m.incident_id === id);
    return { ...inc, mitigations };
  }

  public insertIncident(incident: Incident): void {
    this.data.incidents.unshift(incident);
    this.persist();
  }

  public updateIncident(id: string, updates: Partial<Incident>): Incident | undefined {
    const idx = this.data.incidents.findIndex((i) => i.id === id);
    if (idx === -1) return undefined;
    this.data.incidents[idx] = {
      ...this.data.incidents[idx],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    this.persist();
    return this.data.incidents[idx];
  }

  // Mitigation Workflows
  public getMitigationWorkflows(userId: string): MitigationWorkflow[] {
    return this.data.mitigation_workflows.filter((m) => m.user_id === userId);
  }

  public getMitigationById(id: string): MitigationWorkflow | undefined {
    return this.data.mitigation_workflows.find((m) => m.id === id);
  }

  public insertMitigationWorkflow(workflow: MitigationWorkflow): void {
    this.data.mitigation_workflows.unshift(workflow);
    this.persist();
  }

  public updateMitigationWorkflow(id: string, updates: Partial<MitigationWorkflow>): MitigationWorkflow | undefined {
    const idx = this.data.mitigation_workflows.findIndex((m) => m.id === id);
    if (idx === -1) return undefined;
    this.data.mitigation_workflows[idx] = {
      ...this.data.mitigation_workflows[idx],
      ...updates,
    };
    this.persist();
    return this.data.mitigation_workflows[idx];
  }

  // Chat Sessions & Messages
  public getChatSessions(userId: string): ChatSession[] {
    return this.data.chat_sessions
      .filter((s) => s.user_id === userId)
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
  }

  public getChatSessionById(sessionId: string): ChatSession | undefined {
    return this.data.chat_sessions.find((s) => s.id === sessionId);
  }

  public createChatSession(userId: string, title: string): ChatSession {
    const session: ChatSession = {
      id: `session-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      user_id: userId,
      title,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.data.chat_sessions.unshift(session);
    this.persist();
    return session;
  }

  public getChatMessages(sessionId: string): ChatMessage[] {
    return this.data.chat_messages
      .filter((m) => m.session_id === sessionId)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  }

  public insertChatMessage(message: ChatMessage): void {
    this.data.chat_messages.push(message);
    const sessionIdx = this.data.chat_sessions.findIndex((s) => s.id === message.session_id);
    if (sessionIdx >= 0) {
      this.data.chat_sessions[sessionIdx].updated_at = new Date().toISOString();
    }
    this.persist();
  }

  // Audit Logs
  public getAuditLogs(userId: string, limit: number = 100): AuditLog[] {
    return this.data.audit_logs
      .filter((a) => a.user_id === userId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }

  public insertAuditLog(log: AuditLog): void {
    this.data.audit_logs.unshift(log);
    this.persist();
  }

  // Clear / Reset
  public resetToSeed(userId: string = DEFAULT_USER_ID): void {
    this.data.fragmented_data_records = this.data.fragmented_data_records.filter((r) => r.user_id !== userId);
    this.data.incidents = this.data.incidents.filter((i) => i.user_id !== userId);
    this.data.mitigation_workflows = this.data.mitigation_workflows.filter((m) => m.user_id !== userId);
    this.data.audit_logs = this.data.audit_logs.filter((a) => a.user_id !== userId);
    this.data.guardrail_policies = this.data.guardrail_policies.filter((g) => g.user_id !== userId);
    this.data.chat_sessions = this.data.chat_sessions.filter((s) => s.user_id !== userId);
    this.data.chat_messages = [];
    this.bootstrapUserData(userId);
  }
}

export const db = new AegisDatabase();
