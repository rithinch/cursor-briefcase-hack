import type { User, Application, Connection, ConnectionType } from '../types';

const BASE = '/v1';

export class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const optHeaders = options?.headers;
  const mergedHeaders =
    optHeaders instanceof Headers
      ? { 'Content-Type': 'application/json', ...Object.fromEntries(optHeaders.entries()) }
      : { 'Content-Type': 'application/json', ...(optHeaders as Record<string, string> | undefined) };

  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: mergedHeaders,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const msg = body?.error?.message || body?.detail?.error?.message || `HTTP ${res.status}`;
    throw new ApiError(msg, res.status);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

// Users
export const usersApi = {
  create: (email: string, name: string) =>
    request<User>('/users', {
      method: 'POST',
      body: JSON.stringify({ email, name }),
    }),

  lookupByEmail: (email: string) =>
    request<User>(`/users/lookup?email=${encodeURIComponent(email)}`),

  get: (userId: string) => request<User>(`/users/${userId}`),

  update: (userId: string, name: string) =>
    request<User>(`/users/${userId}`, {
      method: 'PATCH',
      body: JSON.stringify({ name }),
    }),
};

// Applications
export const applicationsApi = {
  create: (userId: string, name: string, policies?: object, controls?: object) =>
    request<Application & { api_key: string }>(`/users/${userId}/applications`, {
      method: 'POST',
      body: JSON.stringify({ name, ...(policies && { policies }), ...(controls && { controls }) }),
    }),

  list: (userId: string) =>
    request<{ data: Application[] }>(`/users/${userId}/applications`),

  get: (appId: string) => request<Application>(`/applications/${appId}`),

  update: (appId: string, updates: { name?: string; status?: string; policies?: object; controls?: object }) =>
    request<Application>(`/applications/${appId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    }),

  delete: (appId: string) =>
    request<void>(`/applications/${appId}`, { method: 'DELETE' }),

  rotateKey: (appId: string) =>
    request<{ api_key: string }>(`/applications/${appId}/rotate-key`, {
      method: 'POST',
    }),
};

// Intents
export const intentsApi = {
  list: (appId: string, apiKey: string, limit = 100) =>
    request<{ data: any[] }>(`/applications/${appId}/intents?limit=${limit}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    }),

  create: (apiKey: string, payload: {
    vendor: { name: string; email: string };
    amount: { expected: number; currency: string; tolerance_pct: number };
    context: { description: string; category: string };
  }) =>
    request<any>(`/intents`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify(payload),
    }),
};

// Invoices
export const invoicesApi = {
  uploadPdf: async (apiKey: string, intentId: string, file: File) => {
    const res = await fetch(`${BASE}/invoices?intent_id=${encodeURIComponent(intentId)}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/pdf',
      },
      body: file,
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      const msg = body?.error?.message || body?.detail?.error?.message || `HTTP ${res.status}`;
      throw new ApiError(msg, res.status);
    }
    return res.json();
  },
};

// Connections
export const connectionsApi = {
  create: (appId: string, type: ConnectionType, credentials?: object, metadata?: object) =>
    request<Connection>(`/applications/${appId}/connections`, {
      method: 'POST',
      body: JSON.stringify({ type, ...(credentials && { credentials }), ...(metadata && { metadata }) }),
    }),

  list: (appId: string) =>
    request<{ data: Connection[] }>(`/applications/${appId}/connections`),

  get: (appId: string, connId: string) =>
    request<Connection>(`/applications/${appId}/connections/${connId}`),

  update: (appId: string, connId: string, updates: object) =>
    request<Connection>(`/applications/${appId}/connections/${connId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    }),

  delete: (appId: string, connId: string) =>
    request<void>(`/applications/${appId}/connections/${connId}`, {
      method: 'DELETE',
    }),
};

// Payments
export const paymentsApi = {
  approve: async (apiKey: string, approvalUrl: string) => {
    const res = await fetch(approvalUrl, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      const msg = body?.error?.message || body?.detail?.error?.message || `HTTP ${res.status}`;
      throw new ApiError(msg, res.status);
    }
    return res.json();
  },
};
