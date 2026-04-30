export interface User {
  id: string;
  email: string;
  name: string;
  status: string;
  created_at: string;
}

export interface Application {
  id: string;
  user_id: string;
  name: string;
  status: string;
  policies: ApplicationPolicies;
  controls: ApplicationControls;
  created_at: string;
  api_key?: string;
}

export interface ApplicationPolicies {
  auto_pay_threshold?: number;
  auto_pay_min_confidence?: number;
  auto_pay_known_vendors_only?: boolean;
  always_approve_below?: number;
  approver_email?: string | null;
  approver_phone?: string | null;
  approval_timeout_hours?: number;
  fraud_signal_override?: boolean;
}

export interface ApplicationControls {
  allowed_rails?: string[];
  max_payment_amount?: number;
  allowed_currencies?: string[];
  blocked_countries?: string[];
}

export type ConnectionType = 'email' | 'xero' | 'quickbooks' | 'yapily' | 'wise' | 'revolut';

export interface Connection {
  id: string;
  application_id: string;
  type: ConnectionType;
  status: string;
  credentials: Record<string, unknown>;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface ApiError {
  error: {
    code: string;
    message?: string;
  };
}
