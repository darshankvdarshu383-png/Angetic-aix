import {
  UserProfile,
  GuardrailPolicy,
  FragmentedDataRecord,
  Incident,
  MitigationWorkflow,
  DashboardStats,
  FinanceAnalysis,
  ChatSession,
  ChatMessage,
  AuditLog,
} from '../types';

const API_BASE = '/api';

function getHeaders(): HeadersInit {
  const token = localStorage.getItem('aegisflow_token') || '';
  const userJson = localStorage.getItem('aegisflow_user');
  let userId = 'demo-operator-uuid';
  let operatorName = 'Alex Mercer';

  if (userJson) {
    try {
      const user = JSON.parse(userJson);
      userId = user.id || userId;
      operatorName = user.full_name || operatorName;
    } catch {}
  }

  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
    'x-user-id': userId,
    'x-operator-name': operatorName,
  };
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.message || `API request failed with status ${res.status}`);
  }
  return res.json();
}

export const api = {
  auth: {
    demo: () =>
      fetch(`${API_BASE}/auth/demo`, { method: 'POST', headers: { 'Content-Type': 'application/json' } }).then(
        handleResponse<{ success: boolean; user: UserProfile; token: string }>
      ),
    login: (email: string, password: string) =>
      fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      }).then(handleResponse<{ success: boolean; user: UserProfile; token: string }>),
    register: (data: { email: string; password: string; full_name: string; role?: string; organization?: string }) =>
      fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then(handleResponse<{ success: boolean; user: UserProfile; token: string }>),
    getMe: () =>
      fetch(`${API_BASE}/auth/me`, { headers: getHeaders() }).then(
        handleResponse<{ user: UserProfile }>
      ),
  },

  seed: {
    bootstrap: () =>
      fetch(`${API_BASE}/seed/bootstrap`, { method: 'POST', headers: getHeaders() }).then(
        handleResponse<{ success: boolean; message: string; summary: any }>
      ),
    reset: () =>
      fetch(`${API_BASE}/seed/reset`, { method: 'POST', headers: getHeaders() }).then(
        handleResponse<{ success: boolean; message: string }>
      ),
  },

  dashboard: {
    getStats: () =>
      fetch(`${API_BASE}/dashboard/stats`, { headers: getHeaders() }).then(
        handleResponse<DashboardStats>
      ),
  },

  dataSources: {
    getRecords: (params?: { silo?: string; anomalyOnly?: boolean; search?: string }) => {
      const q = new URLSearchParams();
      if (params?.silo) q.set('silo', params.silo);
      if (params?.anomalyOnly) q.set('anomalyOnly', 'true');
      if (params?.search) q.set('search', params.search);
      return fetch(`${API_BASE}/data-sources?${q.toString()}`, { headers: getHeaders() }).then(
        handleResponse<{ records: FragmentedDataRecord[]; total: number }>
      );
    },
    getSilos: () =>
      fetch(`${API_BASE}/data-sources/silos`, { headers: getHeaders() }).then(
        handleResponse<{ silos: any[] }>
      ),
    addRecord: (data: Partial<FragmentedDataRecord>) =>
      fetch(`${API_BASE}/data-sources/record`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(data),
      }).then(handleResponse<{ success: boolean; record: FragmentedDataRecord }>),
  },

  chaos: {
    getPresets: () =>
      fetch(`${API_BASE}/chaos/presets`, { headers: getHeaders() }).then(
        handleResponse<{ presets: any[] }>
      ),
    inject: (data: { presetId?: string; customTelemetry?: any }) =>
      fetch(`${API_BASE}/chaos/inject`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(data),
      }).then(
        handleResponse<{
          success: boolean;
          injectedRecordsCount: number;
          correlation: any;
          incident: Incident | null;
          evaluatedMitigations: any[];
        }>
      ),
  },

  incidents: {
    getAll: (params?: { domain?: string; severity?: string; status?: string }) => {
      const q = new URLSearchParams();
      if (params?.domain) q.set('domain', params.domain);
      if (params?.severity) q.set('severity', params.severity);
      if (params?.status) q.set('status', params.status);
      return fetch(`${API_BASE}/incidents?${q.toString()}`, { headers: getHeaders() }).then(
        handleResponse<{ incidents: Incident[]; total: number }>
      );
    },
    getById: (id: string) =>
      fetch(`${API_BASE}/incidents/${id}`, { headers: getHeaders() }).then(
        handleResponse<{ incident: Incident & { mitigations: MitigationWorkflow[] }; correlatedRecords: FragmentedDataRecord[] }>
      ),
    correlate: () =>
      fetch(`${API_BASE}/incidents/correlate`, { method: 'POST', headers: getHeaders() }).then(
        handleResponse<{
          success: boolean;
          correlation: any;
          incident: Incident | null;
          mitigations: any[];
          message?: string;
        }>
      ),
  },

  guardrails: {
    get: () =>
      fetch(`${API_BASE}/guardrails`, { headers: getHeaders() }).then(
        handleResponse<{
          policy: GuardrailPolicy;
          pendingApprovals: Array<MitigationWorkflow & { incidentTitle: string; incidentSeverity: string }>;
          history: MitigationWorkflow[];
          stats: {
            total: number;
            pendingCount: number;
            autoExecutedCount: number;
            humanExecutedCount: number;
            rejectedCount: number;
          };
        }>
      ),
    updatePolicy: (policy: Partial<GuardrailPolicy>) =>
      fetch(`${API_BASE}/guardrails/policy`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(policy),
      }).then(handleResponse<{ success: boolean; policy: GuardrailPolicy }>),
    takeAction: (data: { workflowId: string; action: 'APPROVE' | 'REJECT'; justification: string; updatedPayload?: any }) =>
      fetch(`${API_BASE}/guardrails/action`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(data),
      }).then(
        handleResponse<{
          success: boolean;
          action: string;
          workflow: MitigationWorkflow;
          incident?: Incident;
        }>
      ),
  },

  finance: {
    analyze: (data?: { growthScenario?: string; stressMultiplier?: number }) =>
      fetch(`${API_BASE}/finance/analyze`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(data || {}),
      }).then(
        handleResponse<{
          success: boolean;
          parameters: { growthScenario: string; stressMultiplier: number };
          analysis: FinanceAnalysis;
        }>
      ),
  },

  chat: {
    getSessions: () =>
      fetch(`${API_BASE}/chat/sessions`, { headers: getHeaders() }).then(
        handleResponse<{ sessions: ChatSession[] }>
      ),
    createSession: (title?: string) =>
      fetch(`${API_BASE}/chat/sessions`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ title }),
      }).then(handleResponse<{ session: ChatSession }>),
    getMessages: (sessionId: string) =>
      fetch(`${API_BASE}/chat/sessions/${sessionId}`, { headers: getHeaders() }).then(
        handleResponse<{ session: ChatSession; messages: ChatMessage[] }>
      ),
    sendMessage: (sessionId: string, content: string) =>
      fetch(`${API_BASE}/chat/message`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ sessionId, content }),
      }).then(
        handleResponse<{
          userMessage: ChatMessage;
          assistantMessage: ChatMessage;
        }>
      ),
  },

  audit: {
    getLogs: (params?: { actor_type?: string; risk_level?: string; limit?: number }) => {
      const q = new URLSearchParams();
      if (params?.actor_type) q.set('actor_type', params.actor_type);
      if (params?.risk_level) q.set('risk_level', params.risk_level);
      if (params?.limit) q.set('limit', params.limit.toString());
      return fetch(`${API_BASE}/audit-logs?${q.toString()}`, { headers: getHeaders() }).then(
        handleResponse<{ auditLogs: AuditLog[]; total: number }>
      );
    },
  },
};
