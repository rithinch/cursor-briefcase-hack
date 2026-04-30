import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Badge, { RailBadge } from './Badge';
import Icons from './Icons';
import Button from './Button';
import Modal from './Modal';
import {
  type Intent,
  STATUS_STEPS,
  getStatusVariant,
  formatStatus,
  resolveStepIndex,
  getStepDetail,
} from './intentUtils';

export type { Intent };

// ── Detail content (shared between modal and drawer) ───────────────────────

export function IntentDetailContent({ intent, onClose }: { intent: Intent; onClose: () => void }) {
  const currentStepIndex = resolveStepIndex(intent.status);
  const [expandedStep, setExpandedStep] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const openPreview = useCallback((url: string) => setPreviewUrl(url), []);

  const monoLabel: React.CSSProperties = {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '10px',
    letterSpacing: '0.18em',
    textTransform: 'uppercase',
    color: 'var(--muted)',
    marginBottom: '8px',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <div style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '13px',
            color: 'var(--pith)',
            marginBottom: '6px',
          }}>
            {intent.id}
          </div>
          <Badge variant={getStatusVariant(intent.status)} size="md">
            {formatStatus(intent.status)}
          </Badge>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{
            fontSize: '24px',
            fontWeight: 700,
            color: 'var(--pith)',
            fontFamily: "'JetBrains Mono', monospace",
            letterSpacing: '-0.02em',
          }}>
            {intent.amount.currency} {intent.amount.expected.toLocaleString()}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--muted)' }}>Expected amount</div>
        </div>
      </div>

      {/* Pipeline */}
      <div>
        <div style={{ ...monoLabel, marginBottom: '12px' }}>
          Pipeline — click a step to drill in
        </div>

        {/* Progress bars */}
        <div style={{ display: 'flex', gap: '4px', marginBottom: '10px' }}>
          {STATUS_STEPS.map((step, i) => (
            <motion.div
              key={step.key}
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.3, delay: i * 0.04 }}
              style={{
                flex: 1, height: 4, borderRadius: 2,
                background: i <= currentStepIndex ? 'var(--rind)' : 'var(--hair)',
                transformOrigin: 'left',
              }}
            />
          ))}
        </div>

        {/* Step icons */}
        <div style={{ display: 'flex', gap: '4px' }}>
          {STATUS_STEPS.map((step, i) => {
            const Icon = step.icon;
            const isPast = i < currentStepIndex;
            const isCurrent = i === currentStepIndex;
            const isComplete = i <= currentStepIndex;
            const isExpanded = expandedStep === step.key;
            return (
              <button
                key={step.key}
                onClick={() => setExpandedStep(isExpanded ? null : step.key)}
                title={step.description}
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 4px',
                  borderRadius: '8px',
                  background: isExpanded ? 'rgba(255,122,26,0.12)' : 'transparent',
                  border: isExpanded ? '1px solid var(--rind)' : '1px solid transparent',
                  cursor: 'pointer',
                  transition: 'all 150ms ease',
                }}
              >
                <div style={{ position: 'relative' }}>
                  <div style={{
                    width: 30, height: 30, borderRadius: '7px',
                    background: isComplete ? 'rgba(255,122,26,0.15)' : 'rgba(247,242,234,0.05)',
                    border: isCurrent ? '2px solid var(--rind)' : 'none',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: isComplete ? 'var(--rind)' : 'var(--muted)',
                  }}>
                    <Icon size={14} />
                  </div>
                  {isPast && (
                    <div style={{
                      position: 'absolute',
                      bottom: -3, right: -3,
                      width: 13, height: 13,
                      borderRadius: '50%',
                      background: 'var(--success)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Icons.checkSmall size={8} style={{ color: '#0b0b0f' }} />
                    </div>
                  )}
                </div>
                <span style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '8px', letterSpacing: '0.04em', textTransform: 'uppercase',
                  color: isComplete ? 'var(--pith)' : 'var(--muted)',
                  textAlign: 'center', lineHeight: 1.2,
                }}>
                  {step.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Drill-down panel */}
        <AnimatePresence>
          {expandedStep && (() => {
            const step = STATUS_STEPS.find(s => s.key === expandedStep)!;
            const stepIdx = STATUS_STEPS.findIndex(s => s.key === expandedStep);
            const isPast = stepIdx < currentStepIndex;
            const isCurrent = stepIdx === currentStepIndex;
            const isFuture = stepIdx > currentStepIndex;
            const detail = getStepDetail(intent, expandedStep);
            const timelineEvent = intent.timeline?.find(e => e.status === expandedStep);
            return (
              <motion.div
                key={expandedStep}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                style={{ overflow: 'hidden', marginTop: '8px' }}
              >
                <div style={{
                  padding: '16px',
                  background: 'rgba(247,242,234,0.04)',
                  border: '1px solid var(--hair)',
                  borderRadius: '8px',
                }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    marginBottom: '12px',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--pith)' }}>
                        {step.label}
                      </span>
                      <Badge variant={isPast ? 'success' : isCurrent ? 'info' : 'default'}>
                        {isPast ? 'complete' : isCurrent ? 'in progress' : 'not reached'}
                      </Badge>
                    </div>
                    {timelineEvent && (
                      <span style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: '11px', color: 'var(--muted)',
                      }}>
                        {new Date(timelineEvent.at).toLocaleString()}
                      </span>
                    )}
                  </div>

                  {isFuture ? (
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '20px 0 8px',
                      textAlign: 'center',
                    }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: '8px',
                        background: 'rgba(247,242,234,0.05)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'var(--muted)',
                      }}>
                        <Icons.clock size={18} />
                      </div>
                      <div>
                        <p style={{ fontSize: '13px', fontWeight: 500, color: 'var(--muted)', marginBottom: '5px' }}>
                          Not reached yet
                        </p>
                        <p style={{ fontSize: '12px', color: 'var(--muted)', opacity: 0.55, lineHeight: 1.55, maxWidth: 320 }}>
                          {step.description}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p style={{
                        fontSize: '13px', color: 'var(--muted)', lineHeight: 1.55,
                        marginBottom: detail ? '12px' : 0,
                      }}>
                        {step.description}
                      </p>
                      {detail && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <div style={{
                            padding: '10px 14px',
                            background: 'rgba(255,122,26,0.06)',
                            borderLeft: '3px solid var(--rind)',
                            borderRadius: '0 6px 6px 0',
                          }}>
                            <div style={{ ...monoLabel, color: 'var(--rind)', marginBottom: '6px' }}>
                              Reasoning
                            </div>
                            <p style={{ fontSize: '13px', color: 'var(--pith)', lineHeight: 1.5 }}>
                              {detail.reasoning}
                            </p>
                          </div>
                          {(detail.input || detail.output) && (
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                              {detail.input && (
                                <div style={{
                                  padding: '10px 14px',
                                  background: 'rgba(247,242,234,0.03)',
                                  borderRadius: '6px', border: '1px solid var(--hair)',
                                }}>
                                  <div style={{ ...monoLabel, marginBottom: '8px' }}>Input</div>
                                  <pre style={{
                                    fontFamily: "'JetBrains Mono', monospace",
                                    fontSize: '11px', color: 'var(--pith)',
                                    whiteSpace: 'pre-wrap', wordBreak: 'break-all',
                                    margin: 0, lineHeight: 1.5,
                                  }}>
                                    {JSON.stringify(detail.input, null, 2)}
                                  </pre>
                                </div>
                              )}
                              {detail.output && (
                                <div style={{
                                  padding: '10px 14px',
                                  background: 'rgba(79,199,127,0.04)',
                                  borderRadius: '6px', border: '1px solid rgba(79,199,127,0.15)',
                                }}>
                                  <div style={{ ...monoLabel, color: 'var(--success)', marginBottom: '8px' }}>
                                    Output
                                  </div>
                                  <pre style={{
                                    fontFamily: "'JetBrains Mono', monospace",
                                    fontSize: '11px', color: 'var(--pith)',
                                    whiteSpace: 'pre-wrap', wordBreak: 'break-all',
                                    margin: 0, lineHeight: 1.5,
                                  }}>
                                    {JSON.stringify(detail.output, null, 2)}
                                  </pre>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </motion.div>
            );
          })()}
        </AnimatePresence>
      </div>

      {/* Details grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        {[
          {
            label: 'Vendor',
            content: (
              <>
                <div style={{ fontWeight: 500, color: 'var(--pith)', marginBottom: '2px' }}>
                  {intent.vendor.name}
                </div>
                <div style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '11px', color: 'var(--muted)',
                }}>
                  {intent.vendor.email}
                </div>
              </>
            ),
          },
          intent.context && {
            label: 'Category',
            content: (
              <div style={{ fontWeight: 500, color: 'var(--pith)', textTransform: 'capitalize' }}>
                {intent.context.category}
              </div>
            ),
          },
          intent.invoice && {
            label: 'Invoice',
            content: (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Badge variant={intent.invoice.status === 'verified' ? 'success' : 'default'}>
                    {intent.invoice.status}
                  </Badge>
                  <span style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: '11px', color: 'var(--muted)',
                  }}>
                    {intent.invoice.id}
                  </span>
                </div>
                {intent.invoice.blob_url && (
                  <button
                    onClick={() => openPreview(intent.invoice!.blob_url!)}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: '5px',
                      padding: '4px 10px', borderRadius: '5px',
                      background: 'rgba(255,122,26,0.08)',
                      border: '1px solid rgba(255,122,26,0.25)',
                      color: 'var(--rind)', fontSize: '12px', fontWeight: 500,
                      cursor: 'pointer', transition: 'all 150ms ease',
                      alignSelf: 'flex-start',
                    }}
                    onMouseOver={(e) => (e.currentTarget.style.background = 'rgba(255,122,26,0.14)')}
                    onMouseOut={(e) => (e.currentTarget.style.background = 'rgba(255,122,26,0.08)')}
                  >
                    <Icons.invoice size={12} />
                    View PDF
                  </button>
                )}
              </div>
            ),
          },
          intent.payment?.rail && {
            label: 'Payment Rail',
            content: (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <RailBadge rail={intent.payment!.rail!} />
                {intent.payment!.rail_reasoning && (
                  <span style={{ fontSize: '12px', color: 'var(--muted)' }}>
                    {intent.payment!.rail_reasoning}
                  </span>
                )}
              </div>
            ),
          },
        ].filter(Boolean).map((item: any) => (
          <div key={item.label} style={{
            padding: '14px 16px',
            background: 'rgba(247,242,234,0.04)',
            borderRadius: '8px',
          }}>
            <div style={monoLabel}>{item.label}</div>
            {item.content}
          </div>
        ))}
      </div>

      {/* Description */}
      {intent.context?.description && (
        <div style={{ padding: '14px 16px', background: 'rgba(247,242,234,0.04)', borderRadius: '8px' }}>
          <div style={monoLabel}>Description</div>
          <div style={{ fontSize: '14px', color: 'var(--pith)', lineHeight: 1.5 }}>
            {intent.context.description}
          </div>
        </div>
      )}

      {/* Timeline */}
      {intent.timeline && intent.timeline.length > 0 && (
        <div>
          <div style={{ ...monoLabel, marginBottom: '12px' }}>Event Timeline</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {intent.timeline.map((event, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '10px 14px',
                background: 'rgba(247,242,234,0.04)', borderRadius: '6px',
              }}>
                <div style={{
                  width: 7, height: 7, borderRadius: '50%', background: 'var(--rind)', flexShrink: 0,
                }} />
                <span style={{ flex: 1, fontSize: '13px', fontWeight: 500, color: 'var(--pith)', textTransform: 'capitalize' }}>
                  {event.status.replace(/_/g, ' ')}
                </span>
                <span style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '11px', color: 'var(--muted)',
                }}>
                  {new Date(event.at).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <Button variant="secondary" onClick={onClose} fullWidth>Close</Button>

      {/* PDF preview modal */}
      {previewUrl && (
        <Modal open onClose={() => setPreviewUrl(null)} title="Invoice PDF" width={780}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{
              borderRadius: '6px',
              overflow: 'hidden',
              border: '1px solid var(--hair)',
              background: '#fff',
            }}>
              <iframe
                src={previewUrl}
                title="Invoice PDF"
                style={{ width: '100%', height: '70vh', border: 'none', display: 'block' }}
              />
            </div>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <a
                href={previewUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  padding: '8px 16px', borderRadius: '6px',
                  background: 'rgba(247,242,234,0.06)', border: '1px solid var(--hair)',
                  color: 'var(--pith)', fontSize: '13px', fontWeight: 500,
                  textDecoration: 'none',
                }}
              >
                <Icons.arrowRight size={14} />
                Open in new tab
              </a>
              <Button variant="secondary" onClick={() => setPreviewUrl(null)}>Close</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ── Centered modal (used on the Intents page) ──────────────────────────────

export function IntentDetailModal({ intent, onClose }: { intent: Intent; onClose: () => void }) {
  return (
    <Modal open onClose={onClose} title="Intent Details" width={680}>
      <IntentDetailContent intent={intent} onClose={onClose} />
    </Modal>
  );
}

// ── Side drawer (used inside ApplicationDetail) ────────────────────────────

export function IntentDetailDrawer({ intent, onClose }: { intent: Intent | null; onClose: () => void }) {
  return (
    <AnimatePresence>
      {intent && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            style={{
              position: 'fixed', inset: 0,
              background: 'rgba(11,11,15,0.55)',
              backdropFilter: 'blur(2px)',
              zIndex: 1000,
            }}
          />
          <motion.div
            key="panel"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 32, stiffness: 320 }}
            style={{
              position: 'fixed', top: 0, right: 0, bottom: 0,
              width: 620,
              maxWidth: '90vw',
              background: 'var(--ink-700)',
              borderLeft: '1px solid var(--hair)',
              zIndex: 1001,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '16px 20px',
              borderBottom: '1px solid var(--hair)',
              flexShrink: 0,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--pith)' }}>
                  Intent Details
                </h3>
                <Badge variant={getStatusVariant(intent.status)}>
                  {formatStatus(intent.status)}
                </Badge>
              </div>
              <button
                onClick={onClose}
                style={{
                  width: 28, height: 28, borderRadius: '5px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--muted)', cursor: 'pointer',
                  transition: 'color 150ms ease',
                }}
                onMouseOver={(e) => (e.currentTarget.style.color = 'var(--pith)')}
                onMouseOut={(e) => (e.currentTarget.style.color = 'var(--muted)')}
              >
                <Icons.x size={16} />
              </button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
              <IntentDetailContent intent={intent} onClose={onClose} />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
