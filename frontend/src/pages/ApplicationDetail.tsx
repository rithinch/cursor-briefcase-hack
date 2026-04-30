import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store/useStore';
import { applicationsApi, connectionsApi, intentsApi } from '../api/client';
import Card from '../components/Card';
import Button from '../components/Button';
import Modal from '../components/Modal';
import Input from '../components/Input';
import Badge, { RailBadge } from '../components/Badge';
import Icons from '../components/Icons';
import type { Application, Connection, ConnectionType } from '../types';
import { type Intent, getStatusVariant, formatStatus, formatDate } from '../components/intentUtils';
import { IntentDetailDrawer } from '../components/IntentDetail';

const TABS = ['overview', 'connections', 'policies', 'intents'] as const;
type Tab = typeof TABS[number];

const TAB_ICONS: Record<Tab, React.ReactElement> = {
  overview: <Icons.home size={14} />,
  connections: <Icons.link size={14} />,
  policies: <Icons.settings size={14} />,
  intents: <Icons.flow size={14} />,
};

// ── Connections catalog ────────────────────────────────────────────────────

const LOGO_TOKEN = 'pk_YRmCN-quT2CuWlBRBozpqA';
const logoUrl = (domain: string) =>
  `https://img.logo.dev/${domain}?token=${LOGO_TOKEN}&retina=true`;

type CategoryKey =
  | 'all'
  | 'payments-domestic'
  | 'payments-international'
  | 'work'
  | 'erp'
  | 'reconciliation';

interface ServiceDef {
  id: string;
  name: string;
  description: string;
  domain: string;
  category: CategoryKey;
  connectionType?: ConnectionType; // maps to real API type if supported
}

const CATEGORIES: { key: CategoryKey; label: string; sub?: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'payments-domestic', label: 'Payments', sub: 'Domestic' },
  { key: 'payments-international', label: 'Payments', sub: 'International' },
  { key: 'work', label: 'Work' },
  { key: 'erp', label: 'ERP' },
  { key: 'reconciliation', label: 'Reconciliation' },
];

const CATEGORY_LABELS: Partial<Record<CategoryKey, string>> = {
  'payments-domestic': 'Payments — Domestic',
  'payments-international': 'Payments — International',
  work: 'Work',
  erp: 'ERP',
  reconciliation: 'Reconciliation',
};

const SERVICES: ServiceDef[] = [
  // Payments — Domestic
  {
    id: 'revolut',
    name: 'Revolut Business',
    description: 'Send and receive domestic GBP & EUR payments with instant settlement and zero fees.',
    domain: 'revolut.com',
    category: 'payments-domestic',
    connectionType: 'revolut',
  },
  {
    id: 'monzo',
    name: 'Monzo Business',
    description: 'Business bank account with real-time notifications, pots, and fast domestic transfers.',
    domain: 'monzo.com',
    category: 'payments-domestic',
  },
  {
    id: 'lloyds',
    name: 'Lloyds Bank',
    description: 'Access Lloyds commercial banking, Faster Payments, and BACS direct debits.',
    domain: 'lloydsbank.com',
    category: 'payments-domestic',
  },
  {
    id: 'hsbc',
    name: 'HSBC Business',
    description: 'Domestic GBP transfers, direct debits, and CHAPS same-day payments via HSBC.',
    domain: 'hsbc.com',
    category: 'payments-domestic',
  },
  {
    id: 'barclays',
    name: 'Barclays Business',
    description: 'Barclays business banking with Faster Payments, CHAPS, and direct debit support.',
    domain: 'barclays.com',
    category: 'payments-domestic',
  },
  // Payments — International
  {
    id: 'wise',
    name: 'Wise Business',
    description: 'Low-cost international transfers in 40+ currencies with mid-market exchange rates.',
    domain: 'wise.com',
    category: 'payments-international',
    connectionType: 'wise',
  },
  {
    id: 'circle',
    name: 'Circle USDC',
    description: 'Programmable USDC stablecoin payments for instant, borderless settlement on-chain.',
    domain: 'circle.com',
    category: 'payments-international',
  },
  // Work
  {
    id: 'gmail',
    name: 'Gmail',
    description: 'Read, compose, and parse invoice emails directly from your Gmail inbox.',
    domain: 'gmail.com',
    category: 'work',
    connectionType: 'email',
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp Business',
    description: 'Receive payment requests and approval notifications via WhatsApp Business API.',
    domain: 'whatsapp.com',
    category: 'work',
  },
  // ERP
  {
    id: 'dynamics365',
    name: 'Microsoft Dynamics 365',
    description: 'Sync purchase orders, invoices, and ledger entries with Microsoft Dynamics 365.',
    domain: 'microsoft.com',
    category: 'erp',
  },
  {
    id: 'netsuite',
    name: 'Oracle NetSuite',
    description: 'Automate AP workflows and journal postings in Oracle NetSuite ERP.',
    domain: 'oracle.com',
    category: 'erp',
  },
  {
    id: 'sap',
    name: 'SAP Business One',
    description: 'Connect to SAP Business One for real-time procurement and financial data.',
    domain: 'sap.com',
    category: 'erp',
  },
  {
    id: 'sage',
    name: 'Sage',
    description: 'Sync invoices, bills, and payments with Sage business management software.',
    domain: 'sage.com',
    category: 'erp',
  },
  // Reconciliation
  {
    id: 'xero',
    name: 'Xero',
    description: 'Automatically reconcile payments and publish journal entries to Xero.',
    domain: 'xero.com',
    category: 'reconciliation',
    connectionType: 'xero',
  },
  {
    id: 'quickbooks',
    name: 'QuickBooks',
    description: 'Match bank transactions and sync payment records to QuickBooks Online.',
    domain: 'quickbooks.intuit.com',
    category: 'reconciliation',
    connectionType: 'quickbooks',
  },
  {
    id: 'novabook',
    name: 'Novabook',
    description: 'AI-powered bookkeeping and reconciliation built for modern finance teams.',
    domain: 'novabook.com',
    category: 'reconciliation',
  },
];

export default function ApplicationDetail() {
  const { appId } = useParams<{ appId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isDemo = searchParams.get('demo') === 'true';
  const { applications, updateApplication, removeApplication, setApiKey, clearApiKey } = useStore();

  const [app, setApp] = useState<Application | null>(null);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  // Modals
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showRotateModal, setShowRotateModal] = useState(false);
  const [newApiKey, setNewApiKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [rotating, setRotating] = useState(false);

  // Get stored app with visible key
  const storedApp = applications.find(a => a.id === appId);
  const visibleApiKey = (storedApp as any)?.api_key_visible;

  useEffect(() => {
    if (!appId) return;

    const fetchData = async () => {
      try {
        const [appData, connsData] = await Promise.all([
          applicationsApi.get(appId),
          connectionsApi.list(appId),
        ]);
        setApp(appData);
        setConnections(connsData.data);
      } catch (err) {
        console.error('Failed to fetch application:', err);
        if (isDemo) {
          // In demo mode, fall back to cached store data
          const cached = applications.find(a => a.id === appId);
          if (cached) {
            setApp(cached);
          } else {
            setError('Agent not found in demo data.');
          }
        } else {
          setError('Failed to load agent. The API may be unavailable.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [appId, isDemo]);

  const handleDelete = async () => {
    if (!appId) return;
    setDeleting(true);
    try {
      await applicationsApi.delete(appId);
      removeApplication(appId);
      navigate('/dashboard');
    } catch (err) {
      console.error('Failed to delete application:', err);
    } finally {
      setDeleting(false);
    }
  };

  const handleRotateKey = async () => {
    if (!appId) return;
    setRotating(true);
    try {
      const { api_key } = await applicationsApi.rotateKey(appId);
      setNewApiKey(api_key);
      setApiKey(appId, api_key);
    } catch (err) {
      console.error('Failed to rotate key:', err);
    } finally {
      setRotating(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        color: 'var(--muted)',
      }}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
        >
          <Icons.refresh size={24} />
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        gap: '12px',
        color: 'var(--muted)',
      }}>
        <Icons.alert size={32} style={{ color: 'var(--error, #e55)' }} />
        <p style={{ fontSize: '14px', color: 'var(--ink)' }}>{error}</p>
        <button
          onClick={() => navigate('/dashboard/agents')}
          style={{
            fontSize: '13px',
            color: 'var(--rind)',
            cursor: 'pointer',
            textDecoration: 'underline',
          }}
        >
          Back to agents
        </button>
      </div>
    );
  }

  if (!app) return null;

  return (
    <div style={{ padding: '32px 40px' }}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Breadcrumb */}
        <button
          onClick={() => navigate('/dashboard')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '13px',
            color: 'var(--muted)',
            cursor: 'pointer',
            marginBottom: '16px',
            transition: 'color 150ms ease',
          }}
          onMouseOver={(e) => e.currentTarget.style.color = 'var(--pith)'}
          onMouseOut={(e) => e.currentTarget.style.color = 'var(--muted)'}
        >
          <Icons.arrowLeft size={14} />
          Back to agents
        </button>

        {/* Title row */}
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          marginBottom: '24px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              width: 48,
              height: 48,
              borderRadius: '12px',
              background: 'rgba(255, 122, 26, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--rind)',
            }}>
              <Icons.agent size={24} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <h1 style={{
                  fontSize: '24px',
                  fontWeight: 700,
                  letterSpacing: '-0.02em',
                  color: 'var(--pith)',
                }}>
                  {app.name}
                </h1>
                <Badge variant={app.status === 'active' ? 'success' : 'default'}>
                  {app.status}
                </Badge>
              </div>
              <div style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '12px',
                color: 'var(--muted)',
                marginTop: '4px',
              }}>
                {app.id}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <Button
              variant="secondary"
              size="sm"
              icon={<Icons.refresh size={14} />}
              onClick={() => setShowRotateModal(true)}
            >
              Rotate key
            </Button>
            <Button
              variant="danger"
              size="sm"
              icon={<Icons.trash size={14} />}
              onClick={() => setShowDeleteModal(true)}
            >
              Delete
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex',
          gap: '4px',
          borderBottom: '1px solid var(--hair)',
          marginBottom: '24px',
        }}>
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '12px 16px',
                fontSize: '14px',
                fontWeight: 500,
                color: activeTab === tab ? 'var(--pith)' : 'var(--muted)',
                borderBottom: activeTab === tab ? '2px solid var(--rind)' : '2px solid transparent',
                cursor: 'pointer',
                transition: 'all 150ms ease',
                textTransform: 'capitalize',
                marginBottom: '-1px',
              }}
            >
              {TAB_ICONS[tab]}
              {tab}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'overview' && (
            <OverviewTab 
              app={app} 
              visibleApiKey={visibleApiKey}
              onCopy={handleCopy}
              copied={copied}
            />
          )}
          {activeTab === 'connections' && (
            <ConnectionsTab
              appId={app.id}
              connections={connections}
              setConnections={setConnections}
            />
          )}
          {activeTab === 'policies' && (
            <PoliciesTab app={app} onUpdate={setApp} />
          )}
          {activeTab === 'intents' && (
            <IntentsTab appId={app.id} />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Delete Modal */}
      <Modal
        open={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete agent"
        width={400}
      >
        <p style={{ color: 'var(--muted)', marginBottom: '20px' }}>
          Are you sure you want to delete <strong style={{ color: 'var(--pith)' }}>{app.name}</strong>? 
          This action cannot be undone.
        </p>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)} style={{ flex: 1 }}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDelete} loading={deleting} style={{ flex: 1 }}>
            Delete agent
          </Button>
        </div>
      </Modal>

      {/* Rotate Key Modal */}
      <Modal
        open={showRotateModal}
        onClose={() => { setShowRotateModal(false); setNewApiKey(null); }}
        title={newApiKey ? 'New API key' : 'Rotate API key'}
        width={440}
      >
        {newApiKey ? (
          <div>
            <div style={{
              padding: '16px',
              background: 'rgba(79, 199, 127, 0.1)',
              border: '1px solid rgba(79, 199, 127, 0.2)',
              borderRadius: '6px',
              marginBottom: '20px',
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: 'var(--success)',
                fontSize: '14px',
                fontWeight: 500,
                marginBottom: '8px',
              }}>
                <Icons.check size={16} />
                Key rotated successfully
              </div>
              <p style={{ fontSize: '13px', color: 'var(--muted)' }}>
                Copy your new API key now — it won't be shown again.
              </p>
            </div>

            <ApiKeyDisplay apiKey={newApiKey} onCopy={handleCopy} copied={copied} />

            <Button
              variant="primary"
              fullWidth
              onClick={() => { setShowRotateModal(false); setNewApiKey(null); }}
              style={{ marginTop: '16px' }}
            >
              Done
            </Button>
          </div>
        ) : (
          <div>
            <div style={{
              padding: '16px',
              background: 'rgba(232, 163, 10, 0.1)',
              border: '1px solid rgba(232, 163, 10, 0.2)',
              borderRadius: '6px',
              marginBottom: '20px',
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: 'var(--warn)',
                fontSize: '14px',
                fontWeight: 500,
                marginBottom: '8px',
              }}>
                <Icons.alert size={16} />
                This will invalidate the current key
              </div>
              <p style={{ fontSize: '13px', color: 'var(--muted)' }}>
                The old API key will stop working immediately. Make sure to update your application.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <Button variant="secondary" onClick={() => setShowRotateModal(false)} style={{ flex: 1 }}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleRotateKey} loading={rotating} style={{ flex: 1 }}>
                Rotate key
              </Button>
            </div>
          </div>
        )}
      </Modal>

    </div>
  );
}

// API Key Display Component
function ApiKeyDisplay({ 
  apiKey, 
  onCopy, 
  copied,
  hidden = false,
}: { 
  apiKey: string; 
  onCopy: (text: string) => void; 
  copied: boolean;
  hidden?: boolean;
}) {
  const [visible, setVisible] = useState(!hidden);

  return (
    <div>
      <label style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: '11px',
        fontWeight: 500,
        letterSpacing: '0.18em',
        textTransform: 'uppercase',
        color: 'var(--muted)',
        display: 'block',
        marginBottom: '8px',
      }}>
        API Key
      </label>
      <div style={{ display: 'flex', gap: '8px' }}>
        <div style={{
          flex: 1,
          padding: '10px 14px',
          background: 'rgba(247, 242, 234, 0.04)',
          border: '1px solid var(--hair)',
          borderRadius: '5px',
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '12px',
          color: 'var(--pith)',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {visible ? apiKey : '•'.repeat(40)}
        </div>
        {hidden && (
          <Button
            variant="secondary"
            onClick={() => setVisible(!visible)}
            icon={visible ? <Icons.eyeOff size={16} /> : <Icons.eye size={16} />}
          />
        )}
        <Button
          variant="secondary"
          onClick={() => onCopy(apiKey)}
          icon={copied ? <Icons.checkSmall size={16} /> : <Icons.copy size={16} />}
        >
          {copied ? 'Copied' : 'Copy'}
        </Button>
      </div>
    </div>
  );
}

// Overview Tab
function OverviewTab({
  app,
  visibleApiKey,
  onCopy,
  copied,
}: {
  app: Application;
  visibleApiKey?: string;
  onCopy: (text: string) => void;
  copied: boolean;
}) {
  return (
    <div style={{ display: 'grid', gap: '24px' }}>
      {/* API Key Section */}
      <Card>
        <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--pith)', marginBottom: '16px' }}>
          API Credentials
        </h3>
        {visibleApiKey ? (
          <ApiKeyDisplay apiKey={visibleApiKey} onCopy={onCopy} copied={copied} hidden />
        ) : (
          <div style={{
            padding: '16px',
            background: 'rgba(247, 242, 234, 0.04)',
            borderRadius: '6px',
            color: 'var(--muted)',
            fontSize: '13px',
          }}>
            API key was shown only once at creation. Use "Rotate key" to generate a new one.
          </div>
        )}
      </Card>

      {/* Quick Info */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        <Card padding="dense">
          <div style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '10px',
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: 'var(--muted)',
            marginBottom: '8px',
          }}>
            Allowed Rails
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {app.controls?.allowed_rails?.map((rail) => (
              <RailBadge key={rail} rail={rail} />
            ))}
          </div>
        </Card>

        <Card padding="dense">
          <div style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '10px',
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: 'var(--muted)',
            marginBottom: '8px',
          }}>
            Max Payment
          </div>
          <div style={{ fontSize: '20px', fontWeight: 600, color: 'var(--pith)' }}>
            {app.controls?.allowed_currencies?.[0] || 'GBP'} {app.controls?.max_payment_amount?.toLocaleString() || '—'}
          </div>
        </Card>

        <Card padding="dense">
          <div style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '10px',
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: 'var(--muted)',
            marginBottom: '8px',
          }}>
            Auto-Pay Below
          </div>
          <div style={{ fontSize: '20px', fontWeight: 600, color: 'var(--pith)' }}>
            {app.controls?.allowed_currencies?.[0] || 'GBP'} {app.policies?.auto_pay_threshold?.toLocaleString() || '—'}
          </div>
        </Card>

        <Card padding="dense">
          <div style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '10px',
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: 'var(--muted)',
            marginBottom: '8px',
          }}>
            Created
          </div>
          <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--pith)' }}>
            {new Date(app.created_at).toLocaleDateString(undefined, {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </div>
        </Card>
      </div>

      {/* Quickstart */}
      <QuickstartSection apiKey={visibleApiKey ?? 'YOUR_API_KEY'} />
    </div>
  );
}

// Quickstart Section
// ── Syntax tokeniser ──────────────────────────────────────────────────────

type TokType = 'keyword' | 'string' | 'comment' | 'number' | 'class' | 'fn' | 'plain';

const JS_KEYWORDS = new Set([
  'import', 'export', 'from', 'const', 'let', 'var', 'await', 'for', 'of',
  'in', 'new', 'async', 'function', 'return', 'true', 'false', 'null',
  'undefined', 'if', 'else', 'class', 'interface', 'type', 'as',
]);

function tokenizeJS(code: string): Array<{ type: TokType; text: string }> {
  const tokens: Array<{ type: TokType; text: string }> = [];
  let i = 0;
  while (i < code.length) {
    const ch = code[i];

    // line comment
    if (ch === '/' && code[i + 1] === '/') {
      const end = code.indexOf('\n', i);
      tokens.push({ type: 'comment', text: end === -1 ? code.slice(i) : code.slice(i, end) });
      i = end === -1 ? code.length : end;
      continue;
    }

    // string
    if (ch === '"' || ch === "'" || ch === '`') {
      let j = i + 1;
      while (j < code.length) {
        if (code[j] === '\\') { j += 2; continue; }
        if (code[j] === ch) { j++; break; }
        j++;
      }
      tokens.push({ type: 'string', text: code.slice(i, j) });
      i = j;
      continue;
    }

    // number
    if (/[0-9]/.test(ch)) {
      let j = i;
      while (j < code.length && /[0-9._]/.test(code[j])) j++;
      tokens.push({ type: 'number', text: code.slice(i, j) });
      i = j;
      continue;
    }

    // identifier / keyword
    if (/[a-zA-Z_$]/.test(ch)) {
      let j = i;
      while (j < code.length && /[\w$]/.test(code[j])) j++;
      const word = code.slice(i, j);
      let type: TokType;
      if (JS_KEYWORDS.has(word)) type = 'keyword';
      else if (/^[A-Z]/.test(word)) type = 'class';
      else if (code.slice(j).trimStart()[0] === '(') type = 'fn';
      else type = 'plain';
      tokens.push({ type, text: word });
      i = j;
      continue;
    }

    tokens.push({ type: 'plain', text: ch });
    i++;
  }
  return tokens;
}

const TOK_COLORS: Record<TokType, string> = {
  keyword:  '#7C8FFF',
  string:   '#E8883A',
  comment:  'rgba(247,242,234,0.35)',
  number:   '#4FC77F',
  class:    '#E8C06A',
  fn:       '#89CBE0',
  plain:    'var(--pith)',
};

function SyntaxHighlighter({ code }: { code: string }) {
  const tokens = tokenizeJS(code);
  return (
    <pre style={{
      margin: 0,
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: '12px',
      lineHeight: 1.7,
      overflowX: 'auto',
      whiteSpace: 'pre',
    }}>
      {tokens.map((tok, i) => (
        <span key={i} style={{ color: TOK_COLORS[tok.type] }}>{tok.text}</span>
      ))}
    </pre>
  );
}

// ── Quickstart ─────────────────────────────────────────────────────────────

function QuickstartSection({ apiKey }: { apiKey: string }) {
  const [tab, setTab] = useState<'agents' | 'api'>('agents');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const installCmds: Record<'agents' | 'api', string> = {
    agents: 'npm install @anthropic-ai/claude-agent-sdk @pulp/sdk',
    api:    'npm install @pulp/sdk',
  };

  const agentCode = `import { query } from "@anthropic-ai/claude-agent-sdk";
import Pulp from "@pulp/sdk";

const pulp = await Pulp.connect({ apiKey: "${apiKey}" });

for await (const msg of query({
  prompt: "Pay Acme Supplies £2,400 for the October invoice, ref INV-2024-089. Validate against our open intent and auto-pay if confidence is above 90%.",
  options: {
    mcpServers: {
      pulp: pulp.mcp(),
    },
  },
})) {
  console.log(msg);
}`;

  const apiCode = `import Pulp from "@pulp/sdk";

const client = new Pulp({ apiKey: "${apiKey}" });

// Register a payment intent
const intent = await client.intents.create({
  vendor: { name: "Acme Supplies" },
  amount: { expected: 2400.00, currency: "GBP" },
  reference: "INV-2024-089",
});

console.log("Intent registered:", intent.id);`;

  const tabStyle = (active: boolean): React.CSSProperties => ({
    padding: '9px 18px',
    fontSize: '13px',
    fontWeight: 500,
    color: active ? 'var(--rind)' : 'var(--muted)',
    borderBottom: active ? '2px solid var(--rind)' : '2px solid transparent',
    cursor: 'pointer',
    transition: 'all 150ms ease',
    marginBottom: '-1px',
  });

  return (
    <Card>
      <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--pith)', marginBottom: '20px' }}>
        Quickstart
      </h3>

      {/* Install */}
      <div style={{ marginBottom: '24px' }}>
        <p style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '10px',
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: 'var(--muted)',
          marginBottom: '8px',
        }}>
          Install
        </p>
        <CodeBlock
          code={installCmds[tab]}
          id={`install-${tab}`}
          copiedId={copiedId}
          onCopy={handleCopy}
          standalone
        />
      </div>

      {/* Code tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--hair)' }}>
        <button onClick={() => setTab('agents')} style={tabStyle(tab === 'agents')}>Agents</button>
        <button onClick={() => setTab('api')} style={tabStyle(tab === 'api')}>API</button>
      </div>
      <CodeBlock
        code={tab === 'agents' ? agentCode : apiCode}
        id={`code-${tab}`}
        copiedId={copiedId}
        onCopy={handleCopy}
      />
    </Card>
  );
}

function CodeBlock({ code, id, copiedId, onCopy, standalone = false }: {
  code: string;
  id: string;
  copiedId: string | null;
  onCopy: (text: string, id: string) => void;
  standalone?: boolean;
}) {
  const isCopied = copiedId === id;
  return (
    <div style={{
      position: 'relative',
      padding: '14px 48px 14px 16px',
      background: 'rgba(11, 11, 15, 0.7)',
      border: '1px solid var(--hair)',
      borderTop: standalone ? '1px solid var(--hair)' : 'none',
      borderRadius: standalone ? '6px' : '0 0 6px 6px',
    }}>
      <SyntaxHighlighter code={code} />
      <button
        onClick={() => onCopy(code, id)}
        style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          padding: '4px 10px',
          borderRadius: '5px',
          background: isCopied ? 'rgba(79,199,127,0.12)' : 'rgba(247,242,234,0.06)',
          border: `1px solid ${isCopied ? 'rgba(79,199,127,0.3)' : 'var(--hair)'}`,
          color: isCopied ? 'var(--success)' : 'var(--muted)',
          fontSize: '11px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          transition: 'all 150ms ease',
          whiteSpace: 'nowrap',
        }}
      >
        {isCopied ? <Icons.checkSmall size={12} /> : <Icons.copy size={12} />}
        {isCopied ? 'Copied' : 'Copy'}
      </button>
    </div>
  );
}

// Connections Tab
function ConnectionsTab({
  appId,
  connections,
  setConnections,
}: {
  appId: string;
  connections: Connection[];
  setConnections: React.Dispatch<React.SetStateAction<Connection[]>>;
}) {
  const [activeCategory, setActiveCategory] = useState<CategoryKey>('all');
  const [manageService, setManageService] = useState<ServiceDef | null>(null);
  const [connectingId, setConnectingId] = useState<string | null>(null);

  // Derive connected service IDs from backend connections
  const [connectedIds, setConnectedIds] = useState<Set<string>>(() => {
    const s = new Set<string>();
    for (const conn of connections) {
      const svc = SERVICES.find(sv => sv.connectionType === conn.type);
      if (svc) s.add(svc.id);
    }
    return s;
  });

  // Map serviceId → backend connection ID (for delete)
  const [connIdMap, setConnIdMap] = useState<Record<string, string>>(() => {
    const m: Record<string, string> = {};
    for (const conn of connections) {
      const svc = SERVICES.find(sv => sv.connectionType === conn.type);
      if (svc) m[svc.id] = conn.id;
    }
    return m;
  });

  // Keep derived state in sync when the parent refreshes connections
  useEffect(() => {
    const ids = new Set<string>();
    const map: Record<string, string> = {};
    for (const conn of connections) {
      const svc = SERVICES.find(sv => sv.connectionType === conn.type);
      if (svc) { ids.add(svc.id); map[svc.id] = conn.id; }
    }
    setConnectedIds(ids);
    setConnIdMap(map);
  }, [connections]);

  const handleConnect = async (service: ServiceDef) => {
    setConnectingId(service.id);
    if (service.connectionType) {
      try {
        const conn = await connectionsApi.create(appId, service.connectionType);
        setConnections(prev => [...prev, conn]);
        setConnectedIds(prev => new Set([...prev, service.id]));
        setConnIdMap(prev => ({ ...prev, [service.id]: conn.id }));
      } catch {
        // Fallback to local state on API failure (demo mode)
        setConnectedIds(prev => new Set([...prev, service.id]));
      }
    } else {
      await new Promise(r => setTimeout(r, 800));
      setConnectedIds(prev => new Set([...prev, service.id]));
    }
    setConnectingId(null);
  };

  const handleDisconnect = async (serviceId: string) => {
    const connId = connIdMap[serviceId];
    if (connId) {
      try {
        await connectionsApi.delete(appId, connId);
        setConnections(prev => prev.filter(c => c.id !== connId));
        setConnIdMap(prev => { const m = { ...prev }; delete m[serviceId]; return m; });
      } catch (err) {
        console.error('Failed to disconnect:', err);
      }
    }
    setConnectedIds(prev => { const s = new Set(prev); s.delete(serviceId); return s; });
    setManageService(null);
  };

  const filtered = activeCategory === 'all'
    ? SERVICES
    : SERVICES.filter(s => s.category === activeCategory);

  const connectedCount = SERVICES.filter(s => connectedIds.has(s.id)).length;

  return (
    <div>
      {/* Sub-header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '20px',
      }}>
        <p style={{ color: 'var(--muted)', fontSize: '14px' }}>
          Connect banking, accounting, and productivity tools to automate payment workflows for this agent.
        </p>
        <span style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '11px',
          color: 'var(--muted)',
          background: 'rgba(247,242,234,0.06)',
          borderRadius: '5px',
          padding: '4px 10px',
          flexShrink: 0,
        }}>
          {connectedCount}/{SERVICES.length} connected
        </span>
      </div>

      {/* Category filter pills */}
      <div style={{
        display: 'flex',
        gap: '6px',
        marginBottom: '24px',
        flexWrap: 'wrap',
      }}>
        {CATEGORIES.map(({ key, label, sub }) => {
          const isActive = activeCategory === key;
          return (
            <button
              key={key}
              onClick={() => setActiveCategory(key)}
              style={{
                padding: '7px 14px',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: 500,
                background: isActive ? 'rgba(255, 122, 26, 0.1)' : 'transparent',
                border: isActive ? '1px solid var(--rind)' : '1px solid var(--hair)',
                color: isActive ? 'var(--rind)' : 'var(--muted)',
                cursor: 'pointer',
                transition: 'all 150ms ease',
                whiteSpace: 'nowrap',
              }}
            >
              {sub ? `${label} · ${sub}` : label}
            </button>
          );
        })}
      </div>

      {/* Service grid — grouped when showing 'all' */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeCategory}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.15 }}
        >
          {activeCategory === 'all' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
              {(['payments-domestic', 'payments-international', 'work', 'erp', 'reconciliation'] as CategoryKey[]).map(cat => {
                const items = SERVICES.filter(s => s.category === cat);
                const catConnected = items.filter(s => connectedIds.has(s.id)).length;
                return (
                  <div key={cat}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                      <span style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: '10px',
                        letterSpacing: '0.14em',
                        textTransform: 'uppercase',
                        color: 'var(--muted)',
                        fontWeight: 600,
                      }}>
                        {CATEGORY_LABELS[cat]}
                      </span>
                      <span style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: '10px',
                        color: 'var(--muted)',
                        background: 'rgba(247,242,234,0.06)',
                        borderRadius: '4px',
                        padding: '1px 6px',
                      }}>
                        {catConnected}/{items.length}
                      </span>
                    </div>
                    <ServiceGrid
                      items={items}
                      connectedIds={connectedIds}
                      connectingId={connectingId}
                      onConnect={handleConnect}
                      onManage={setManageService}
                    />
                  </div>
                );
              })}
            </div>
          ) : (
            <ServiceGrid
              items={filtered}
              connectedIds={connectedIds}
              connectingId={connectingId}
              onConnect={handleConnect}
              onManage={setManageService}
            />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Manage sub-modal */}
      {manageService && (
        <ConnManageModal
          service={manageService}
          connId={connIdMap[manageService.id]}
          onClose={() => setManageService(null)}
          onDisconnect={() => handleDisconnect(manageService.id)}
        />
      )}
    </div>
  );
}

// Service grid helper
function ServiceGrid({
  items,
  connectedIds,
  connectingId,
  onConnect,
  onManage,
}: {
  items: ServiceDef[];
  connectedIds: Set<string>;
  connectingId: string | null;
  onConnect: (s: ServiceDef) => void;
  onManage: (s: ServiceDef) => void;
}) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
      gap: '10px',
    }}>
      {items.map((service, idx) => (
        <motion.div
          key={service.id}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18, delay: idx * 0.03 }}
        >
          <ServiceCard
            service={service}
            isConnected={connectedIds.has(service.id)}
            isConnecting={connectingId === service.id}
            onConnect={() => onConnect(service)}
            onManage={() => onManage(service)}
          />
        </motion.div>
      ))}
    </div>
  );
}

// Individual service card
function ServiceCard({
  service,
  isConnected,
  isConnecting,
  onConnect,
  onManage,
}: {
  service: ServiceDef;
  isConnected: boolean;
  isConnecting: boolean;
  onConnect: () => void;
  onManage: () => void;
}) {
  const [imgError, setImgError] = useState(false);

  return (
    <motion.div
      whileHover={{ y: -1 }}
      transition={{ duration: 0.12 }}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
        padding: '14px 18px',
        background: 'var(--ink-700)',
        border: isConnected
          ? '1px solid rgba(79,199,127,0.3)'
          : '1px solid var(--hair)',
        borderRadius: '10px',
        transition: 'border-color 200ms ease',
      }}
    >
      {/* Logo */}
      <div style={{
        width: 42,
        height: 42,
        borderRadius: '9px',
        background: 'rgba(247,242,234,0.06)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        overflow: 'hidden',
      }}>
        {imgError ? (
          <Icons.link size={20} style={{ color: 'var(--muted)' }} />
        ) : (
          <img
            src={logoUrl(service.domain)}
            alt={service.name}
            width={26}
            height={26}
            style={{ objectFit: 'contain', borderRadius: '3px' }}
            onError={() => setImgError(true)}
          />
        )}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: '13px',
          fontWeight: 600,
          color: 'var(--pith)',
          marginBottom: '2px',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}>
          {service.name}
        </div>
        <div style={{
          fontSize: '11px',
          color: 'var(--muted)',
          lineHeight: 1.4,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}>
          {service.description}
        </div>
      </div>

      {/* Action */}
      <div style={{ flexShrink: 0 }}>
        {isConnected ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '5px' }}>
            <Badge variant="success">Connected</Badge>
            <button
              onClick={onManage}
              style={{
                fontSize: '11px',
                color: 'var(--muted)',
                cursor: 'pointer',
                textDecoration: 'underline',
                background: 'none',
                border: 'none',
                padding: 0,
                transition: 'color 150ms ease',
              }}
              onMouseOver={e => (e.currentTarget.style.color = 'var(--pith)')}
              onMouseOut={e => (e.currentTarget.style.color = 'var(--muted)')}
              onFocus={e => (e.currentTarget.style.color = 'var(--pith)')}
              onBlur={e => (e.currentTarget.style.color = 'var(--muted)')}
            >
              Manage
            </button>
          </div>
        ) : (
          <Button
            variant="primary"
            size="sm"
            loading={isConnecting}
            onClick={onConnect}
          >
            Connect
          </Button>
        )}
      </div>
    </motion.div>
  );
}

// Manage connection sub-modal
function ConnManageModal({
  service,
  connId,
  onClose,
  onDisconnect,
}: {
  service: ServiceDef;
  connId?: string;
  onClose: () => void;
  onDisconnect: () => void;
}) {
  const [imgError, setImgError] = useState(false);
  const [confirming, setConfirming] = useState(false);

  return (
    <Modal open onClose={onClose} title="Manage Connection" width={460}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Service header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          padding: '16px',
          background: 'rgba(79,199,127,0.07)',
          border: '1px solid rgba(79,199,127,0.2)',
          borderRadius: '8px',
        }}>
          <div style={{
            width: 48,
            height: 48,
            borderRadius: '10px',
            background: 'rgba(247,242,234,0.06)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            overflow: 'hidden',
          }}>
            {imgError ? (
              <Icons.link size={22} style={{ color: 'var(--muted)' }} />
            ) : (
              <img
                src={logoUrl(service.domain)}
                alt={service.name}
                width={30}
                height={30}
                style={{ objectFit: 'contain', borderRadius: '4px' }}
                onError={() => setImgError(true)}
              />
            )}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--pith)', marginBottom: '4px' }}>
              {service.name}
            </div>
            <Badge variant="success">Active</Badge>
          </div>
        </div>

        {/* Details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
          {[
            { label: 'Status', value: 'Connected' },
            { label: 'Category', value: CATEGORY_LABELS[service.category] ?? service.category },
            { label: 'Domain', value: service.domain, mono: true },
            ...(connId ? [{ label: 'Connection ID', value: connId, mono: true }] : []),
          ].map(({ label, value, mono }) => (
            <div
              key={label}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '9px 0',
                borderBottom: '1px solid var(--hair)',
              }}
            >
              <span style={{
                fontSize: '12px',
                color: 'var(--muted)',
                fontFamily: "'JetBrains Mono', monospace",
                letterSpacing: '0.05em',
              }}>
                {label}
              </span>
              <span style={{
                fontSize: '13px',
                color: 'var(--pith)',
                fontWeight: 500,
                fontFamily: mono ? "'JetBrains Mono', monospace" : undefined,
                maxWidth: '240px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {value}
              </span>
            </div>
          ))}
        </div>

        <p style={{ fontSize: '13px', color: 'var(--muted)', lineHeight: 1.5 }}>
          {service.description}
        </p>

        {/* Actions */}
        {confirming ? (
          <div>
            <div style={{
              padding: '12px 16px',
              background: 'rgba(229,85,85,0.08)',
              border: '1px solid rgba(229,85,85,0.2)',
              borderRadius: '6px',
              fontSize: '13px',
              color: 'var(--muted)',
              marginBottom: '12px',
            }}>
              Disconnecting will revoke access and may interrupt active workflows on this agent.
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <Button variant="secondary" onClick={() => setConfirming(false)} style={{ flex: 1 }}>
                Cancel
              </Button>
              <Button variant="danger" onClick={onDisconnect} style={{ flex: 1 }}>
                Disconnect
              </Button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '10px' }}>
            <Button variant="secondary" onClick={onClose} style={{ flex: 1 }}>
              Close
            </Button>
            <Button
              variant="danger"
              icon={<Icons.x size={14} />}
              onClick={() => setConfirming(true)}
              style={{ flex: 1 }}
            >
              Disconnect
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
}

// Policies Tab
function PoliciesTab({
  app,
  onUpdate
}: {
  app: Application;
  onUpdate: (app: Application) => void;
}) {
  const [policies, setPolicies] = useState(app.policies);
  const [controls, setControls] = useState(app.controls);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const currency = controls.allowed_currencies?.[0] ?? 'GBP';

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await applicationsApi.update(app.id, { policies, controls });
      onUpdate(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error('Failed to update policies:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ display: 'grid', gap: '24px', maxWidth: 680 }}>
      <Card>
        <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--pith)', marginBottom: '24px' }}>
          Approval Policies
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
          <CurrencyInput
            label="Auto-pay threshold"
            value={policies.auto_pay_threshold}
            onChange={(val) => setPolicies({ ...policies, auto_pay_threshold: val })}
            hint="Payments below this amount are auto-approved without human review"
            currency={currency}
            max={20000}
            step={500}
          />
          <ConfidenceSlider
            label="Min confidence for auto-pay"
            value={policies.auto_pay_min_confidence}
            onChange={(val) => setPolicies({ ...policies, auto_pay_min_confidence: val })}
            hint="Minimum invoice verification confidence score required to auto-pay"
          />
          <CurrencyInput
            label="Always approve below"
            value={policies.always_approve_below}
            onChange={(val) => setPolicies({ ...policies, always_approve_below: val })}
            hint="Skip the approval workflow entirely for amounts below this threshold"
            currency={currency}
            max={5000}
            step={100}
          />
          <div style={{ paddingTop: '4px' }}>
            <Input
              label="Approver email"
              type="email"
              value={policies.approver_email ?? ''}
              onChange={(e) => setPolicies({ ...policies, approver_email: e.target.value || null })}
              hint="Email address that receives approval requests"
              mono
            />
          </div>
          <div style={{ paddingTop: '4px' }}>
            <Input
              label="Approver WhatsApp"
              type="tel"
              value={policies.approver_phone ?? ''}
              onChange={(e) => setPolicies({ ...policies, approver_phone: e.target.value || null })}
              hint="Phone number for WhatsApp approval messages, e.g. +447911123456"
              mono
            />
          </div>
        </div>
      </Card>

      <Card>
        <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--pith)', marginBottom: '24px' }}>
          Payment Controls
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
          <CurrencyInput
            label="Max payment amount"
            value={controls.max_payment_amount}
            onChange={(val) => setControls({ ...controls, max_payment_amount: val })}
            hint="Hard ceiling — no single payment may exceed this amount"
            currency={currency}
            max={100000}
            step={1000}
          />
          <div style={{ paddingTop: '4px' }}>
            <Input
              label="Allowed currencies"
              type="text"
              value={controls.allowed_currencies?.join(', ') ?? ''}
              onChange={(e) => setControls({ ...controls, allowed_currencies: e.target.value.split(',').map(s => s.trim().toUpperCase()) })}
              hint="Comma-separated currency codes (e.g., GBP, USD, EUR)"
              mono
            />
          </div>
          <div>
            <Input
              label="Allowed rails"
              type="text"
              value={controls.allowed_rails?.join(', ') ?? ''}
              onChange={(e) => setControls({ ...controls, allowed_rails: e.target.value.split(',').map(s => s.trim().toLowerCase()) })}
              hint="Comma-separated payment rails (e.g., mock, wise, revolut)"
              mono
            />
          </div>
        </div>
      </Card>

      <Button
        variant="primary"
        onClick={handleSave}
        loading={saving}
        icon={saved ? <Icons.checkSmall size={16} /> : undefined}
      >
        {saved ? 'Saved' : 'Save changes'}
      </Button>
    </div>
  );
}

function CurrencyInput({
  label,
  value,
  onChange,
  hint,
  currency = 'GBP',
  max = 50000,
  step = 500,
}: {
  label: string;
  value: number | undefined;
  onChange: (val: number) => void;
  hint?: string;
  currency?: string;
  max?: number;
  step?: number;
}) {
  const symbol = ({ GBP: '£', USD: '$', EUR: '€' } as Record<string, string>)[currency] ?? currency;
  const current = value ?? 0;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
        <span style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '11px',
          fontWeight: 500,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: 'var(--muted)',
        }}>
          {label}
        </span>
        <span style={{ fontSize: '20px', fontWeight: 700, color: 'var(--pith)', letterSpacing: '-0.02em' }}>
          {symbol}{current.toLocaleString()}
        </span>
      </div>

      <input
        type="range"
        min="0"
        max={max}
        step={step}
        value={current}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ width: '100%', accentColor: 'var(--rind)', cursor: 'pointer', marginBottom: '4px' }}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
        {[0, 0.5, 1].map((fraction) => (
          <span key={fraction} style={{
            fontSize: '10px',
            color: 'var(--muted)',
            fontFamily: "'JetBrains Mono', monospace",
            opacity: 0.6,
          }}>
            {symbol}{(max * fraction).toLocaleString()}
          </span>
        ))}
      </div>

      {hint && <p style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '2px' }}>{hint}</p>}
    </div>
  );
}

function ConfidenceSlider({
  label,
  value,
  onChange,
  hint,
}: {
  label: string;
  value: number | undefined;
  onChange: (val: number) => void;
  hint?: string;
}) {
  const pct = Math.round((value ?? 0) * 100);
  const color = pct >= 80 ? 'var(--success)' : pct >= 50 ? 'var(--warn)' : 'var(--rind)';
  const bgColor = pct >= 80 ? 'rgba(79,199,127,0.12)' : pct >= 50 ? 'rgba(232,163,10,0.12)' : 'rgba(247,242,234,0.08)';
  const borderColor = pct >= 80 ? 'rgba(79,199,127,0.3)' : pct >= 50 ? 'rgba(232,163,10,0.3)' : 'var(--hair)';

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
        <span style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '11px',
          fontWeight: 500,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: 'var(--muted)',
        }}>
          {label}
        </span>
        <span style={{
          padding: '3px 10px',
          borderRadius: '20px',
          background: bgColor,
          border: `1px solid ${borderColor}`,
          color,
          fontSize: '14px',
          fontWeight: 700,
          fontFamily: "'JetBrains Mono', monospace",
        }}>
          {pct}%
        </span>
      </div>

      <input
        type="range"
        min="0"
        max="100"
        step="5"
        value={pct}
        onChange={(e) => onChange(Number(e.target.value) / 100)}
        style={{ width: '100%', accentColor: color, cursor: 'pointer', marginBottom: '6px' }}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        {[0, 25, 50, 75, 100].map((m) => (
          <span key={m} style={{
            fontSize: '10px',
            color: 'var(--muted)',
            fontFamily: "'JetBrains Mono', monospace",
            opacity: pct >= m ? 0.8 : 0.35,
          }}>
            {m}%
          </span>
        ))}
      </div>

      {hint && <p style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '7px' }}>{hint}</p>}
    </div>
  );
}

// Intents Tab
const POLL_INTERVAL_MS = 15_000;

function IntentsTab({ appId }: { appId: string }) {
  const [intents, setIntents] = useState<Intent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [selectedIntent, setSelectedIntent] = useState<Intent | null>(null);

  const fetchIntents = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const res = await intentsApi.list(appId);
      setIntents(res.data as Intent[]);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Failed to fetch intents:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [appId]);

  // Initial load + polling
  useEffect(() => {
    fetchIntents();
    const interval = setInterval(() => fetchIntents(true), POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchIntents]);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px', color: 'var(--muted)' }}>
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
          <Icons.refresh size={24} />
        </motion.div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <p style={{ color: 'var(--muted)', fontSize: '14px' }}>
          Payment intents processed by this agent
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {lastUpdated && (
            <span style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '11px',
              color: 'var(--muted)',
              opacity: 0.6,
            }}>
              {lastUpdated.toLocaleTimeString()}
            </span>
          )}
          {/* Pulse dot */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <motion.div
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ repeat: Infinity, duration: 2.5 }}
              style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--success)' }}
            />
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', color: 'var(--muted)' }}>
              live
            </span>
          </div>
          {/* Manual refresh */}
          <motion.button
            onClick={() => fetchIntents(true)}
            animate={refreshing ? { rotate: 360 } : { rotate: 0 }}
            transition={refreshing ? { repeat: Infinity, duration: 0.7, ease: 'linear' } : { duration: 0 }}
            style={{
              width: 28,
              height: 28,
              borderRadius: '5px',
              background: 'transparent',
              border: '1px solid transparent',
              color: 'var(--muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'color 150ms ease, border-color 150ms ease',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.color = 'var(--pith)';
              e.currentTarget.style.borderColor = 'var(--hair)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.color = 'var(--muted)';
              e.currentTarget.style.borderColor = 'transparent';
            }}
            title="Refresh"
          >
            <Icons.refresh size={13} />
          </motion.button>
        </div>
      </div>

      {intents.length === 0 ? (
        <Card>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '60px 20px',
            textAlign: 'center',
          }}>
            <div style={{
              width: 48,
              height: 48,
              borderRadius: '12px',
              background: 'rgba(255, 122, 26, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--rind)',
              marginBottom: '16px',
            }}>
              <Icons.flow size={24} />
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--pith)', marginBottom: '8px' }}>
              No intents yet
            </h3>
            <p style={{ fontSize: '14px', color: 'var(--muted)', maxWidth: 300 }}>
              Intents will appear here when your agent starts processing payment requests
            </p>
          </div>
        </Card>
      ) : (
        <IntentsTable intents={intents} onSelect={setSelectedIntent} />
      )}

      <IntentDetailDrawer
        intent={selectedIntent}
        onClose={() => setSelectedIntent(null)}
      />
    </div>
  );
}

function IntentsTable({ intents, onSelect }: { intents: Intent[]; onSelect: (intent: Intent) => void }) {
  return (
    <div style={{
      background: 'var(--ink-700)',
      border: '1px solid var(--hair)',
      borderRadius: '8px',
      overflow: 'hidden',
    }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--hair)' }}>
            <th style={thStyle}>Intent ID</th>
            <th style={thStyle}>Status</th>
            <th style={thStyle}>Vendor</th>
            <th style={thStyle}>Amount</th>
            <th style={thStyle}>Created</th>
            <th style={thStyle}></th>
          </tr>
        </thead>
        <tbody>
          {intents.map((intent) => (
            <tr
              key={intent.id}
              onClick={() => onSelect(intent)}
              style={{ borderBottom: '1px solid var(--hair)', cursor: 'pointer', transition: 'background 150ms ease' }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(247, 242, 234, 0.02)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <td style={tdStyle}>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '12px' }}>
                  {intent.id}
                </span>
              </td>
              <td style={tdStyle}>
                <Badge variant={getStatusVariant(intent.status)}>
                  {formatStatus(intent.status)}
                </Badge>
              </td>
              <td style={tdStyle}>
                <div>
                  <div style={{ fontWeight: 500, color: 'var(--pith)' }}>{intent.vendor?.name}</div>
                  <div style={{ fontSize: '12px', color: 'var(--muted)' }}>{intent.vendor?.email}</div>
                </div>
              </td>
              <td style={tdStyle}>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 500 }}>
                  {intent.amount?.currency} {intent.amount?.expected?.toLocaleString()}
                </span>
              </td>
              <td style={tdStyle}>
                <span style={{ color: 'var(--muted)', fontSize: '13px' }}>
                  {formatDate(intent.created_at)}
                </span>
              </td>
              <td style={tdStyle}>
                <Icons.chevronRight size={14} style={{ color: 'var(--muted)', display: 'block' }} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const thStyle: React.CSSProperties = {
  padding: '12px 16px',
  textAlign: 'left',
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: '10px',
  fontWeight: 500,
  letterSpacing: '0.18em',
  textTransform: 'uppercase',
  color: 'var(--muted)',
};

const tdStyle: React.CSSProperties = {
  padding: '12px 16px',
  fontSize: '13px',
  color: 'var(--pith)',
};

