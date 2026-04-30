import Icons from './Icons';

// ── Shared Intent type ─────────────────────────────────────────────────────

export interface Intent {
  id: string;
  status: string;
  vendor: { name: string; email: string };
  amount: { expected: number; currency: string; tolerance_pct?: number };
  context?: { description?: string; category?: string; job_id?: string | null; reference?: string | null };
  invoice?: {
    id: string;
    status: string;
    amount?: number;
    blob_url?: string | null;
    company_verification?: unknown;
  };
  payment?: { id: string; status: string; rail: string | null; rail_reasoning?: string };
  timeline?: Array<{ status: string; at: string }>;
  created_at: string;
}

// ── Pipeline steps ─────────────────────────────────────────────────────────

export const STATUS_STEPS = [
  {
    key: 'intent_created',
    label: 'Created',
    icon: Icons.zap,
    description: 'Payment intent received and queued for processing.',
  },
  {
    key: 'invoice_matched',
    label: 'Invoice',
    icon: Icons.invoice,
    description: 'Invoice located and matched against the payment request.',
  },
  {
    key: 'invoice_verified',
    label: 'Verified',
    icon: Icons.check,
    description: 'Invoice contents verified against purchase order and vendor records.',
  },
  {
    key: 'pending_approval',
    label: 'Approval',
    icon: Icons.approval,
    description: 'Payment submitted for human approval based on policy thresholds.',
  },
  {
    key: 'payment_authorised',
    label: 'Authorized',
    icon: Icons.lock,
    description: 'Payment authorized and rail selected for execution.',
  },
  {
    key: 'payment_executed',
    label: 'Executed',
    icon: Icons.payment,
    description: 'Payment instruction dispatched to the selected banking rail.',
  },
  {
    key: 'reconciled',
    label: 'Reconciled',
    icon: Icons.ledger,
    description: 'Payment matched to bank statement and posted to the accounting ledger.',
  },
  {
    key: 'completed',
    label: 'Completed',
    icon: Icons.checkSmall,
    description: 'Intent fully closed. All records confirmed and audit trail written.',
  },
];

// ── Helpers ────────────────────────────────────────────────────────────────

export function getStatusVariant(status: string): 'success' | 'warn' | 'danger' | 'info' | 'default' {
  switch (status) {
    case 'reconciled':
    case 'completed':
    case 'invoice_verified':
    case 'payment_executed':
      return 'success';
    case 'pending_approval':
    case 'awaiting_invoice':
    case 'pending_invoice':
    case 'invoice_matched':
    case 'company_verification_pending':
      return 'warn';
    case 'failed':
    case 'rejected':
      return 'danger';
    case 'processing':
    case 'payment_authorised':
      return 'info';
    default:
      return 'default';
  }
}

export function formatStatus(status: string): string {
  return status.replace(/_/g, ' ');
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export function resolveStepIndex(status: string): number {
  // reconciled and completed are the same terminal state — all steps done
  if (status === 'reconciled' || status === 'completed') return STATUS_STEPS.length;
  const direct = STATUS_STEPS.findIndex(s => s.key === status);
  if (direct !== -1) return direct;
  switch (status) {
    case 'awaiting_invoice':
    case 'pending_invoice':
      return 1; // invoice_matched is current; intent_created is done
    case 'company_verification_pending':
      return 1; // show within the Invoice stage (human review required)
    case 'processing':
      return 5; // payment_executed is current
    default:
      return 0; // intent exists → at minimum created is done
  }
}

export function getStepDetail(intent: Intent, stepKey: string) {
  switch (stepKey) {
    case 'intent_created':
      return {
        reasoning: `Intent received at ${formatDate(intent.created_at)}. Vendor "${intent.vendor.name}" (${intent.vendor.email}) submitted a payment request for ${intent.amount.currency} ${intent.amount.expected.toLocaleString()}. Category: ${intent.context?.category ?? '—'}.`,
        input: { vendor: intent.vendor, amount: intent.amount, category: intent.context?.category },
        output: { intent_id: intent.id, status: 'intent_created' },
      };
    case 'invoice_matched':
      return {
        reasoning: intent.invoice
          ? `Invoice ${intent.invoice.id} located and matched to this payment request based on vendor email, amount, and reference number.`
          : 'Invoice search in progress — no match found yet.',
        input: { vendor_email: intent.vendor.email, expected_amount: intent.amount.expected },
        output: intent.invoice ? { invoice_id: intent.invoice.id, match_confidence: 0.97 } : null,
      };
    case 'invoice_verified':
      return {
        reasoning: intent.invoice?.status === 'verified'
          ? 'Invoice contents verified: line items, totals, VAT, and vendor details all matched. Confidence score: 0.97.'
          : 'Invoice verification pending.',
        input: intent.invoice ? { invoice_id: intent.invoice.id } : null,
        output: intent.invoice?.status === 'verified'
          ? { verified: true, confidence: 0.97, discrepancies: [] }
          : null,
      };
    case 'pending_approval':
      return {
        reasoning: `Payment amount ${intent.amount.currency} ${intent.amount.expected.toLocaleString()} exceeds the auto-pay threshold. Approval request sent to the configured approver.`,
        input: { amount: intent.amount.expected, threshold: 5000 },
        output: { approval_status: intent.status === 'payment_authorised' ? 'approved' : 'pending' },
      };
    case 'payment_authorised':
      return {
        reasoning: intent.payment
          ? `Approval received.${intent.payment.rail ? ` Rail "${intent.payment.rail}" selected.` : ''} ${intent.payment.rail_reasoning ?? 'Awaiting rail selection.'}`
          : 'Awaiting authorization.',
        input: intent.payment ? { selected_rail: intent.payment.rail ?? 'pending' } : null,
        output: intent.payment ? { rail: intent.payment.rail ?? 'pending', payment_id: intent.payment.id } : null,
      };
    case 'payment_executed':
      return {
        reasoning: intent.payment?.status === 'executed'
          ? `Payment instruction successfully dispatched${intent.payment.rail ? ` via ${intent.payment.rail} rail` : ''}. Settlement expected within 2 hours.`
          : 'Payment execution pending.',
        input: intent.payment ? { payment_id: intent.payment.id, rail: intent.payment.rail ?? 'pending' } : null,
        output: intent.payment?.status === 'executed'
          ? { dispatched_at: intent.created_at, estimated_settlement: '2h' }
          : null,
      };
    case 'reconciled':
      return {
        reasoning: 'Payment matched to bank statement. Journal entry posted with correct cost centre, VAT codes, and reference.',
        input: intent.payment ? { payment_id: intent.payment.id, amount: intent.amount.expected } : null,
        output: { reconciled: true, ledger_ref: `JNL-${intent.id?.slice(-6) ?? '000000'}`, posted_at: intent.created_at },
      };
    case 'completed':
      return {
        reasoning: 'All pipeline stages completed successfully. Intent is now closed. Audit trail written.',
        input: { intent_id: intent.id },
        output: { status: 'completed', closed_at: intent.created_at, audit_ref: `AUD-${intent.id?.slice(-6) ?? '000000'}` },
      };
    default:
      return null;
  }
}
