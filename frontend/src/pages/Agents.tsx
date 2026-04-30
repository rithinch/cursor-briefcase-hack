import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store/useStore';
import { applicationsApi } from '../api/client';
import Card from '../components/Card';
import Button from '../components/Button';
import Modal from '../components/Modal';
import Input from '../components/Input';
import Badge from '../components/Badge';
import Icons from '../components/Icons';
import type { Application } from '../types';

export default function Agents() {
  const navigate = useNavigate();
  const { user, applications, setApplications, addApplication } = useStore();
  const [loading, setLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newAppName, setNewAppName] = useState('');
  const [creating, setCreating] = useState(false);
  const [newApiKey, setNewApiKey] = useState<string | null>(null);
  const [newAppId, setNewAppId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!user) return;

    const fetchApps = async () => {
      try {
        const response = await applicationsApi.list(user.id);
        setApplications(response.data);
      } catch (err) {
        console.error('Failed to fetch applications:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchApps();
  }, [user, setApplications]);

  const handleCreateApp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newAppName.trim()) return;

    setCreating(true);
    try {
      const app = await applicationsApi.create(user.id, newAppName.trim());
      addApplication(app);
      setNewApiKey(app.api_key);
      setNewAppId(app.id);
      setNewAppName('');
    } catch (err) {
      console.error('Failed to create application:', err);
    } finally {
      setCreating(false);
    }
  };

  const handleCopyKey = () => {
    if (newApiKey) {
      navigator.clipboard.writeText(newApiKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCloseModal = () => {
    setCreateModalOpen(false);
    setNewApiKey(null);
    setNewAppId(null);
    setNewAppName('');
  };

  const filteredApps = applications.filter(app =>
    app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    app.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
            Agents
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--muted)' }}>
            Manage your Pulp agents and their configurations
          </p>
        </div>

        <Button
          variant="primary"
          icon={<Icons.plus size={16} />}
          onClick={() => setCreateModalOpen(true)}
        >
          Create agent
        </Button>
      </motion.div>

      {/* Search */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        style={{ marginBottom: '24px' }}
      >
        <div style={{ position: 'relative', maxWidth: 320 }}>
          <Icons.search
            size={16}
            style={{
              position: 'absolute',
              left: 12,
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--muted)',
            }}
          />
          <input
            type="text"
            placeholder="Search agents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 14px 10px 36px',
              background: 'rgba(247, 242, 234, 0.04)',
              border: '1px solid var(--hair)',
              borderRadius: '6px',
              fontSize: '14px',
              color: 'var(--pith)',
              outline: 'none',
            }}
          />
        </div>
      </motion.div>

      {/* Agents Table */}
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
        ) : filteredApps.length === 0 ? (
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
                <Icons.agent size={24} />
              </div>
              <h3 style={{
                fontSize: '16px',
                fontWeight: 600,
                color: 'var(--pith)',
                marginBottom: '8px',
              }}>
                {searchQuery ? 'No matching agents' : 'No agents yet'}
              </h3>
              <p style={{
                fontSize: '14px',
                color: 'var(--muted)',
                maxWidth: 300,
                marginBottom: '24px',
              }}>
                {searchQuery
                  ? 'Try a different search term'
                  : 'Create your first agent to start processing payment intents'
                }
              </p>
              {!searchQuery && (
                <Button
                  variant="primary"
                  icon={<Icons.plus size={16} />}
                  onClick={() => setCreateModalOpen(true)}
                >
                  Create agent
                </Button>
              )}
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
                  <th style={thStyle}>Agent</th>
                  <th style={thStyle}>Status</th>
                  <th style={thStyle}>Rails</th>
                  <th style={thStyle}>Max Payment</th>
                  <th style={thStyle}>Created</th>
                  <th style={thStyle}></th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {filteredApps.map((app) => (
                    <motion.tr
                      key={app.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onClick={() => navigate(`/dashboard/apps/${app.id}`)}
                      style={{
                        borderBottom: '1px solid var(--hair)',
                        cursor: 'pointer',
                        transition: 'background 150ms ease',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(247, 242, 234, 0.02)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={tdStyle}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{
                            width: 36,
                            height: 36,
                            borderRadius: '8px',
                            background: 'rgba(255, 122, 26, 0.1)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'var(--rind)',
                          }}>
                            <Icons.agent size={18} />
                          </div>
                          <div>
                            <div style={{ fontWeight: 500, color: 'var(--pith)' }}>
                              {app.name}
                            </div>
                            <div style={{
                              fontFamily: "'JetBrains Mono', monospace",
                              fontSize: '11px',
                              color: 'var(--muted)',
                            }}>
                              {app.id}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td style={tdStyle}>
                        <Badge variant={app.status === 'active' ? 'success' : 'default'}>
                          {app.status}
                        </Badge>
                      </td>
                      <td style={tdStyle}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                          {app.controls?.allowed_rails?.slice(0, 3).map((rail) => (
                            <span
                              key={rail}
                              style={{
                                padding: '2px 6px',
                                borderRadius: '4px',
                                background: 'rgba(147, 112, 219, 0.2)',
                                fontFamily: "'JetBrains Mono', monospace",
                                fontSize: '10px',
                                color: '#9370DB',
                              }}
                            >
                              {rail}
                            </span>
                          ))}
                          {(app.controls?.allowed_rails?.length || 0) > 3 && (
                            <span style={{
                              fontSize: '11px',
                              color: 'var(--muted)',
                            }}>
                              +{(app.controls?.allowed_rails?.length || 0) - 3}
                            </span>
                          )}
                        </div>
                      </td>
                      <td style={tdStyle}>
                        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '13px' }}>
                          {app.controls?.allowed_currencies?.[0] || 'GBP'}{' '}
                          {app.controls?.max_payment_amount?.toLocaleString() || '—'}
                        </span>
                      </td>
                      <td style={tdStyle}>
                        <span style={{ color: 'var(--muted)', fontSize: '13px' }}>
                          {new Date(app.created_at).toLocaleDateString()}
                        </span>
                      </td>
                      <td style={tdStyle}>
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={<Icons.chevronRight size={14} />}
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/dashboard/apps/${app.id}`);
                          }}
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

      {/* Create Agent Modal */}
      <Modal
        open={createModalOpen}
        onClose={handleCloseModal}
        title={newApiKey ? 'Agent created' : 'Create new agent'}
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
                Agent created successfully
              </div>
              <p style={{ fontSize: '13px', color: 'var(--muted)' }}>
                Copy your API key now — it won't be shown again.
              </p>
            </div>

            <div style={{ marginBottom: '16px' }}>
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
                  {newApiKey}
                </div>
                <Button
                  variant="secondary"
                  onClick={handleCopyKey}
                  icon={copied ? <Icons.checkSmall size={16} /> : <Icons.copy size={16} />}
                >
                  {copied ? 'Copied' : 'Copy'}
                </Button>
              </div>
            </div>

            <Button
              variant="primary"
              fullWidth
              icon={<Icons.arrowRight size={16} />}
              onClick={() => {
                if (newAppId) navigate(`/dashboard/apps/${newAppId}`);
                else handleCloseModal();
              }}
            >
              Set up agent
            </Button>
          </div>
        ) : (
          <form onSubmit={handleCreateApp}>
            <Input
              label="Agent name"
              placeholder="my-procurement-agent"
              value={newAppName}
              onChange={(e) => setNewAppName(e.target.value)}
              required
              style={{ marginBottom: '20px' }}
            />
            <Button
              type="submit"
              variant="primary"
              fullWidth
              loading={creating}
              disabled={!newAppName.trim()}
            >
              Create agent
            </Button>
          </form>
        )}
      </Modal>
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
