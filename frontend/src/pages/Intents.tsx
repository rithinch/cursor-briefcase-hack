import { useState, useEffect, useCallback } from 'react';
import type React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store/useStore';
import { intentsApi } from '../api/client';
import Card from '../components/Card';
import Badge, { RailBadge } from '../components/Badge';
import Icons from '../components/Icons';
import Button from '../components/Button';
import { type Intent, STATUS_STEPS, getStatusVariant, formatStatus, formatDate } from '../components/intentUtils';
import { IntentDetailModal } from '../components/IntentDetail';

const POLL_INTERVAL_MS = 15_000;

export default function Intents() {
  const { applications } = useStore();
  const [intents, setIntents] = useState<Intent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [selectedIntent, setSelectedIntent] = useState<Intent | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed' | 'failed'>('all');

  const fetchIntents = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const results = await Promise.allSettled(
        applications.map(app => intentsApi.list(app.id))
      );
      const all: Intent[] = [];
      for (const r of results) {
        if (r.status === 'fulfilled') all.push(...(r.value.data as Intent[]));
      }
      all.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setIntents(all);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Failed to fetch intents:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [applications]);

  useEffect(() => {
    fetchIntents();
    const interval = setInterval(() => fetchIntents(true), POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchIntents]);

  const filteredIntents = intents.filter(intent => {
    if (filter === 'all') return true;
    if (filter === 'pending') return ['awaiting_invoice', 'pending_approval', 'processing'].includes(intent.status);
    if (filter === 'completed') return ['reconciled', 'completed'].includes(intent.status);
    if (filter === 'failed') return ['failed', 'rejected'].includes(intent.status);
    return true;
  });

  return (
    <div style={{ padding: '32px 40px' }}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '24px',
        }}
      >
        <div>
          <h1 style={{
            fontSize: '28px',
            fontWeight: 700,
            letterSpacing: '-0.025em',
            color: 'var(--pith)',
            marginBottom: '4px',
          }}>
            Payments
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--muted)' }}>
            Monitor payment transactions across all your agents
          </p>
        </div>

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
          {/* Manual refresh */}
          <motion.button
            onClick={() => fetchIntents(true)}
            animate={refreshing ? { rotate: 360 } : { rotate: 0 }}
            transition={refreshing ? { repeat: Infinity, duration: 0.7, ease: 'linear' } : { duration: 0 }}
            style={{
              width: 28, height: 28, borderRadius: '5px',
              background: 'transparent', border: '1px solid transparent',
              color: 'var(--muted)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
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
          {/* Live indicator */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 12px',
            background: 'rgba(79, 199, 127, 0.1)',
            borderRadius: '6px',
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '11px',
            color: 'var(--success)',
          }}>
            <motion.div
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ repeat: Infinity, duration: 2 }}
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: 'var(--success)',
              }}
            />
            Live
          </div>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}
      >
        {(['all', 'pending', 'completed', 'failed'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: 500,
              textTransform: 'capitalize',
              background: filter === f ? 'rgba(255, 122, 26, 0.1)' : 'transparent',
              border: filter === f ? '1px solid var(--rind)' : '1px solid var(--hair)',
              color: filter === f ? 'var(--rind)' : 'var(--muted)',
              cursor: 'pointer',
              transition: 'all 150ms ease',
            }}
          >
            {f}
          </button>
        ))}
      </motion.div>

      {/* Intents List */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        {loading ? (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '60px',
            color: 'var(--muted)',
          }}>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
            >
              <Icons.refresh size={24} />
            </motion.div>
          </div>
        ) : filteredIntents.length === 0 ? (
          <Card>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '80px 20px',
              textAlign: 'center',
            }}>
              <div style={{
                width: 64,
                height: 64,
                borderRadius: '16px',
                background: 'rgba(255, 122, 26, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--rind)',
                marginBottom: '24px',
              }}>
                <Icons.flow size={32} />
              </div>
              <h3 style={{
                fontSize: '18px',
                fontWeight: 600,
                color: 'var(--pith)',
                marginBottom: '8px',
              }}>
                No intents yet
              </h3>
              <p style={{
                fontSize: '14px',
                color: 'var(--muted)',
                maxWidth: 360,
                lineHeight: 1.5,
              }}>
                When your agents start processing payment requests, intents will appear here with their full timeline and status.
              </p>

              {/* Pipeline diagram */}
              <div style={{
                marginTop: '48px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}>
                {STATUS_STEPS.slice(0, 5).map((step, i) => {
                  const Icon = step.icon;
                  return (
                    <div key={step.key} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '6px',
                      }}>
                        <div style={{
                          width: 36,
                          height: 36,
                          borderRadius: '8px',
                          background: 'rgba(247, 242, 234, 0.05)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'var(--muted)',
                        }}>
                          <Icon size={18} />
                        </div>
                        <span style={{
                          fontFamily: "'JetBrains Mono', monospace",
                          fontSize: '9px',
                          letterSpacing: '0.1em',
                          textTransform: 'uppercase',
                          color: 'var(--muted)',
                        }}>
                          {step.label}
                        </span>
                      </div>
                      {i < 4 && (
                        <Icons.arrowRight size={14} style={{ color: 'var(--muted)', opacity: 0.5 }} />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </Card>
        ) : (
          <div style={{
            background: 'var(--ink-700)',
            border: '1px solid var(--hair)',
            borderRadius: '8px',
            overflow: 'hidden',
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--hair)' }}>
                  <th style={thStyle}>Intent</th>
                  <th style={thStyle}>Status</th>
                  <th style={thStyle}>Vendor</th>
                  <th style={thStyle}>Amount</th>
                  <th style={thStyle}>Rail</th>
                  <th style={thStyle}>Created</th>
                  <th style={thStyle}></th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {filteredIntents.map((intent) => (
                    <motion.tr
                      key={intent.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onClick={() => setSelectedIntent(intent)}
                      style={{
                        borderBottom: '1px solid var(--hair)',
                        cursor: 'pointer',
                        transition: 'background 150ms ease',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(247, 242, 234, 0.02)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={tdStyle}>
                        <span style={{
                          fontFamily: "'JetBrains Mono', monospace",
                          fontSize: '12px',
                          color: 'var(--pith)',
                        }}>
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
                          <div style={{ fontWeight: 500, color: 'var(--pith)' }}>
                            {intent.vendor.name}
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--muted)' }}>
                            {intent.vendor.email}
                          </div>
                        </div>
                      </td>
                      <td style={tdStyle}>
                        <span style={{
                          fontFamily: "'JetBrains Mono', monospace",
                          fontSize: '14px',
                          fontWeight: 500,
                        }}>
                          {intent.amount.currency} {intent.amount.expected.toLocaleString()}
                        </span>
                      </td>
                      <td style={tdStyle}>
                        {intent.payment?.rail ? (
                          <RailBadge rail={intent.payment.rail} />
                        ) : (
                          <span style={{ color: 'var(--muted)', fontSize: '12px' }}>—</span>
                        )}
                      </td>
                      <td style={tdStyle}>
                        <span style={{ color: 'var(--muted)', fontSize: '13px' }}>
                          {formatDate(intent.created_at)}
                        </span>
                      </td>
                      <td style={tdStyle}>
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={<Icons.chevronRight size={14} />}
                        />
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* Intent Detail Modal */}
      {selectedIntent && (
        <IntentDetailModal
          intent={selectedIntent}
          onClose={() => setSelectedIntent(null)}
        />
      )}
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
  fontSize: '14px',
  color: 'var(--pith)',
};
