import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store/useStore';
import { applicationsApi, intentsApi } from '../api/client';
import Card from '../components/Card';
import Button from '../components/Button';
import Modal from '../components/Modal';
import Input from '../components/Input';
import Badge from '../components/Badge';
import Icons from '../components/Icons';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { Application } from '../types';
import type { Intent } from '../components/intentUtils';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, applications, setApplications, addApplication } = useStore();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newAppName, setNewAppName] = useState('');
  const [creating, setCreating] = useState(false);
  const [newApiKey, setNewApiKey] = useState<string | null>(null);
  const [newAppId, setNewAppId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [allIntents, setAllIntents] = useState<Intent[]>([]);
  const [intentsLoading, setIntentsLoading] = useState(false);
  const [chartPeriod, setChartPeriod] = useState<'day' | 'month' | 'hourly'>('hourly');

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

  // Fetch all intents from all applications
  useEffect(() => {
    if (!applications.length) {
      setAllIntents([]);
      return;
    }

    const fetchAllIntents = async () => {
      setIntentsLoading(true);
      try {
        const intentPromises = applications.map(app => 
          ((app as any).api_key_visible
            ? intentsApi.list(app.id, (app as any).api_key_visible, 1000)
            : Promise.resolve({ data: [] as any[] })
          ).catch(err => {
            console.error(`Failed to fetch intents for app ${app.id}:`, err);
            return { data: [] };
          })
        );
        const results = await Promise.all(intentPromises);
        const combined = results.flatMap(r => r.data);
        setAllIntents(combined);
      } catch (err) {
        console.error('Failed to fetch intents:', err);
      } finally {
        setIntentsLoading(false);
      }
    };

    fetchAllIntents();
  }, [applications]);

  // Compute stats from intents
  const stats = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    const intentsToday = allIntents.filter(intent => 
      new Date(intent.created_at) >= todayStart
    ).length;

    const payments = allIntents.filter(intent => 
      intent.payment?.id && 
      ['payment_executed', 'reconciled', 'completed'].includes(intent.status)
    ).length;

    return { intentsToday, payments };
  }, [allIntents]);

  // Compute chart data
  const chartData = useMemo(() => {
    if (allIntents.length === 0) return [];

    if (chartPeriod === 'hourly') {
      // Create 24 hour buckets
      const hourlyData: { date: string; volume: number; count: number }[] = [];
      for (let hour = 0; hour < 24; hour++) {
        hourlyData.push({
          date: String(hour),
          volume: 0,
          count: 0,
        });
      }

      // Group intents by hour of day
      allIntents.forEach(intent => {
        const date = new Date(intent.created_at);
        const hour = date.getHours();
        hourlyData[hour].volume += intent.amount?.expected || 0;
        hourlyData[hour].count += 1;
      });

      return hourlyData;
    }

    const grouped: Record<string, { date: string; volume: number; count: number }> = {};

    allIntents.forEach(intent => {
      const date = new Date(intent.created_at);
      let key: string;

      if (chartPeriod === 'day') {
        // Group by day
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      } else {
        // Group by month
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      }

      if (!grouped[key]) {
        grouped[key] = { date: key, volume: 0, count: 0 };
      }

      grouped[key].volume += intent.amount?.expected || 0;
      grouped[key].count += 1;
    });

    // Sort by date and limit to last 30 days or 12 months
    const sortedData = Object.values(grouped).sort((a, b) => a.date.localeCompare(b.date));
    const limit = chartPeriod === 'day' ? 30 : 12;
    return sortedData.slice(-limit);
  }, [allIntents, chartPeriod]);

  const handleRefresh = async () => {
    if (!user || refreshing) return;
    setRefreshing(true);
    try {
      const response = await applicationsApi.list(user.id);
      setApplications(response.data);
      
      // Fetch intents for all apps
      if (response.data.length > 0) {
        const intentPromises = response.data.map(app => 
          ((app as any).api_key_visible
            ? intentsApi.list(app.id, (app as any).api_key_visible, 1000)
            : Promise.resolve({ data: [] as any[] })
          ).catch(err => {
            console.error(`Failed to fetch intents for app ${app.id}:`, err);
            return { data: [] };
          })
        );
        const results = await Promise.all(intentPromises);
        const combined = results.flatMap(r => r.data);
        setAllIntents(combined);
      }
    } catch (err) {
      console.error('Failed to refresh:', err);
    } finally {
      setRefreshing(false);
    }
  };

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
          marginBottom: '32px',
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
            Home
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--muted)' }}>
            Monitor payment volume and agent activity
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <motion.button
            onClick={handleRefresh}
            animate={refreshing ? { rotate: 360 } : { rotate: 0 }}
            transition={refreshing ? { repeat: Infinity, duration: 0.8, ease: 'linear' } : {}}
            style={{
              width: 36,
              height: 36,
              borderRadius: '6px',
              background: 'rgba(247,242,234,0.04)',
              border: '1px solid var(--hair)',
              color: 'var(--muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'color 150ms ease',
            }}
            onMouseOver={(e) => (e.currentTarget.style.color = 'var(--pith)')}
            onMouseOut={(e) => (e.currentTarget.style.color = 'var(--muted)')}
            title="Refresh"
          >
            <Icons.refresh size={16} />
          </motion.button>
          <Button
            variant="primary"
            icon={<Icons.plus size={16} />}
            onClick={() => setCreateModalOpen(true)}
          >
            Create agent
          </Button>
        </div>
      </motion.div>

      {/* Payment Volume Chart - Now at top */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        style={{ marginBottom: '32px' }}
      >
        <Card>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '8px',
          }}>
            <div>
              <h3 style={{
                fontSize: '14px',
                fontWeight: 500,
                color: 'var(--muted)',
                marginBottom: '4px',
              }}>
                Payment Volume
              </h3>
              <div style={{
                fontSize: '32px',
                fontWeight: 700,
                letterSpacing: '-0.03em',
                color: 'var(--pith)',
              }}>
                £{chartData.reduce((sum, d) => sum + d.volume, 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
            <div style={{
              display: 'flex',
              gap: '4px',
              background: 'rgba(247, 242, 234, 0.04)',
              border: '1px solid var(--hair)',
              borderRadius: '6px',
              padding: '4px',
            }}>
              <button
                onClick={() => setChartPeriod('hourly')}
                style={{
                  padding: '6px 12px',
                  fontSize: '13px',
                  fontWeight: 500,
                  borderRadius: '4px',
                  border: 'none',
                  background: chartPeriod === 'hourly' ? 'var(--rind)' : 'transparent',
                  color: chartPeriod === 'hourly' ? 'var(--ink-900)' : 'var(--muted)',
                  cursor: 'pointer',
                  transition: 'all 150ms ease',
                }}
              >
                Hourly
              </button>
              <button
                onClick={() => setChartPeriod('day')}
                style={{
                  padding: '6px 12px',
                  fontSize: '13px',
                  fontWeight: 500,
                  borderRadius: '4px',
                  border: 'none',
                  background: chartPeriod === 'day' ? 'var(--rind)' : 'transparent',
                  color: chartPeriod === 'day' ? 'var(--ink-900)' : 'var(--muted)',
                  cursor: 'pointer',
                  transition: 'all 150ms ease',
                }}
              >
                Daily
              </button>
              <button
                onClick={() => setChartPeriod('month')}
                style={{
                  padding: '6px 12px',
                  fontSize: '13px',
                  fontWeight: 500,
                  borderRadius: '4px',
                  border: 'none',
                  background: chartPeriod === 'month' ? 'var(--rind)' : 'transparent',
                  color: chartPeriod === 'month' ? 'var(--ink-900)' : 'var(--muted)',
                  cursor: 'pointer',
                  transition: 'all 150ms ease',
                }}
              >
                Monthly
              </button>
            </div>
          </div>

          {intentsLoading ? (
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
          ) : chartData.length === 0 ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '60px',
              color: 'var(--muted)',
              textAlign: 'center',
            }}>
              <Icons.flow size={32} style={{ marginBottom: '12px', opacity: 0.5 }} />
              <p style={{ fontSize: '14px' }}>No payment data yet</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="volumeGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--rind)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--rind)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--hair)" opacity={0.3} />
                <XAxis 
                  dataKey="date" 
                  stroke="var(--muted)"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => {
                    if (chartPeriod === 'hourly') {
                      const hour = parseInt(value);
                      if (hour === 0) return '12am';
                      if (hour < 12) return `${hour}am`;
                      if (hour === 12) return '12pm';
                      return `${hour - 12}pm`;
                    } else if (chartPeriod === 'day') {
                      const date = new Date(value);
                      return `${date.getMonth() + 1}/${date.getDate()}`;
                    } else {
                      const [year, month] = value.split('-');
                      return `${month}/${year.slice(2)}`;
                    }
                  }}
                />
                <YAxis 
                  stroke="var(--muted)"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => {
                    if (value >= 1000000) return `£${(value / 1000000).toFixed(1)}M`;
                    if (value >= 1000) return `£${(value / 1000).toFixed(0)}k`;
                    return `£${value}`;
                  }}
                />
                <Tooltip
                  contentStyle={{
                    background: 'var(--ink-800)',
                    border: '1px solid var(--hair)',
                    borderRadius: '6px',
                    fontSize: '12px',
                    color: 'var(--pith)',
                  }}
                  formatter={(value: any) => [`£${Number(value).toLocaleString()}`, 'Volume']}
                  labelFormatter={(label) => {
                    if (chartPeriod === 'hourly') {
                      const hour = parseInt(label);
                      if (hour === 0) return '12:00 AM';
                      if (hour < 12) return `${hour}:00 AM`;
                      if (hour === 12) return '12:00 PM';
                      return `${hour - 12}:00 PM`;
                    } else if (chartPeriod === 'day') {
                      const date = new Date(label);
                      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                    } else {
                      const [year, month] = label.split('-');
                      const date = new Date(parseInt(year), parseInt(month) - 1);
                      return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
                    }
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="volume"
                  stroke="var(--rind)"
                  strokeWidth={2}
                  fill="url(#volumeGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </Card>
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.15 }}
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          marginBottom: '40px',
        }}
      >
        <StatCard
          label="Agents"
          value={applications.length}
          icon={<Icons.agent size={20} />}
        />
        <StatCard
          label="Active"
          value={applications.filter(a => a.status === 'active').length}
          icon={<Icons.zap size={20} />}
          variant="success"
        />
        <StatCard
          label="Intents today"
          value={stats.intentsToday}
          icon={<Icons.flow size={20} />}
        />
        <StatCard
          label="Payments"
          value={stats.payments}
          icon={<Icons.payment size={20} />}
        />
      </motion.div>

      {/* Applications Grid */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '16px',
        }}>
          <h2 style={{
            fontSize: '16px',
            fontWeight: 600,
            color: 'var(--pith)',
          }}>
            Your agents
          </h2>
          <span style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '11px',
            color: 'var(--muted)',
          }}>
            {applications.length} total
          </span>
        </div>

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
        ) : applications.length === 0 ? (
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
                No agents yet
              </h3>
              <p style={{
                fontSize: '14px',
                color: 'var(--muted)',
                maxWidth: 300,
                marginBottom: '24px',
              }}>
                Create your first agent to start processing payment intents
              </p>
              <Button
                variant="primary"
                icon={<Icons.plus size={16} />}
                onClick={() => setCreateModalOpen(true)}
              >
                Create agent
              </Button>
            </div>
          </Card>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '16px',
          }}>
            <AnimatePresence>
              {applications.map((app, index) => (
                <motion.div
                  key={app.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                >
                  <ApplicationCard
                    app={app}
                    onClick={() => navigate(`/dashboard/apps/${app.id}`)}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
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
              <div style={{
                display: 'flex',
                gap: '8px',
              }}>
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

function StatCard({ 
  label, 
  value, 
  icon, 
  variant 
}: { 
  label: string; 
  value: number; 
  icon: React.ReactNode;
  variant?: 'success' | 'warn' | 'danger';
}) {
  return (
    <Card padding="dense">
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <div style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '11px',
            fontWeight: 500,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: 'var(--muted)',
            marginBottom: '8px',
          }}>
            {label}
          </div>
          <div style={{
            fontSize: '32px',
            fontWeight: 700,
            letterSpacing: '-0.03em',
            color: variant ? `var(--${variant})` : 'var(--pith)',
          }}>
            {value}
          </div>
        </div>
        <div style={{ color: 'var(--rind)', opacity: 0.7 }}>
          {icon}
        </div>
      </div>
    </Card>
  );
}

function ApplicationCard({ app, onClick }: { app: Application; onClick: () => void }) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ duration: 0.15 }}
      onClick={onClick}
      style={{
        background: 'var(--ink-700)',
        border: '1px solid var(--hair)',
        borderRadius: '8px',
        padding: '20px',
        cursor: 'pointer',
      }}
    >
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '16px',
      }}>
        <div style={{
          width: 40,
          height: 40,
          borderRadius: '10px',
          background: 'rgba(255, 122, 26, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--rind)',
        }}>
          <Icons.agent size={20} />
        </div>
        <Badge variant={app.status === 'active' ? 'success' : 'default'}>
          {app.status}
        </Badge>
      </div>

      <h3 style={{
        fontSize: '16px',
        fontWeight: 600,
        color: 'var(--pith)',
        marginBottom: '4px',
      }}>
        {app.name}
      </h3>

      <div style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: '11px',
        color: 'var(--muted)',
      }}>
        {app.id}
      </div>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        marginTop: '16px',
        paddingTop: '16px',
        borderTop: '1px solid var(--hair)',
      }}>
        <div style={{ fontSize: '12px', color: 'var(--muted)' }}>
          <span style={{ color: 'var(--pith)', fontWeight: 500 }}>
            {app.controls?.allowed_rails?.length || 0}
          </span>
          {' '}rails
        </div>
        <div style={{ fontSize: '12px', color: 'var(--muted)' }}>
          Created {new Date(app.created_at).toLocaleDateString()}
        </div>
      </div>
    </motion.div>
  );
}
