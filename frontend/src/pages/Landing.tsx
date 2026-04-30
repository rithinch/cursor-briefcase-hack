import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store/useStore';
import { usersApi, ApiError } from '../api/client';
import CitrusFlowBG from '../brand/CitrusFlowBG';
import Logo from '../components/Logo';
import Button from '../components/Button';
import Input from '../components/Input';
import Modal from '../components/Modal';
import Icons from '../components/Icons';

export default function Landing() {
  const navigate = useNavigate();
  const { setUser } = useStore();
  const theme = 'dark' as const;

  const [step, setStep] = useState<'landing' | 'email'>('landing');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [name, setName] = useState('');
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState('');

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await usersApi.lookupByEmail(email);
      setUser(user);
      navigate('/dashboard');
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        setShowCreateModal(true);
      } else {
        setError(err instanceof Error ? err.message : 'Something went wrong');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError('');
    setCreateLoading(true);
    try {
      const user = await usersApi.create(email, name);
      setUser(user);
      navigate('/dashboard');
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Failed to create account');
    } finally {
      setCreateLoading(false);
    }
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100vh', overflow: 'hidden' }}>
      <CitrusFlowBG interactive theme={theme} />

      <div style={{
        position: 'relative',
        zIndex: 10,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        padding: '40px 24px',
      }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            maxWidth: 440,
            width: '100%',
          }}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Logo size={64} variant={theme === 'dark' ? 'dark' : 'light'} />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            style={{ marginTop: 32, textAlign: 'center' }}
          >
            <h1 style={{
              fontSize: '44px',
              fontWeight: 700,
              letterSpacing: '-0.03em',
              lineHeight: 1.1,
              marginBottom: 8,
              textWrap: 'pretty',
            }}>
              <span style={{ color: 'var(--pith)' }}>Autonomous AP </span>
              <span style={{ color: 'var(--rind-400)' }}>for SMEs.</span>
            </h1>
            <p style={{
              fontSize: '16px',
              color: 'var(--muted)',
              maxWidth: 340,
              margin: '0 auto',
              lineHeight: 1.5,
            }}>
              Enabling food importers globally to pay their supplier invoices autonomously.
            </p>
          </motion.div>

          {/* Auth section */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            style={{
              marginTop: 48,
              width: '100%',
              maxWidth: 320,
            }}
          >
            <AnimatePresence mode="wait">
              {step === 'landing' ? (
                <motion.div
                  key="landing"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.2 }}
                >
                  <Button
                    variant="secondary"
                    size="lg"
                    fullWidth
                    icon={<Icons.mail size={18} />}
                    onClick={() => setStep('email')}
                    style={{
                      background: theme === 'dark' ? 'rgba(26, 26, 32, 0.9)' : 'rgba(255, 255, 255, 0.9)',
                      backdropFilter: 'blur(8px)',
                    }}
                  >
                    Continue with Email
                  </Button>
                </motion.div>
              ) : (
                <motion.form
                  key="email"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.2 }}
                  onSubmit={handleEmailSubmit}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12,
                    background: theme === 'dark' ? 'rgba(26, 26, 32, 0.92)' : 'rgba(255, 255, 255, 0.92)',
                    backdropFilter: 'blur(12px)',
                    border: '1px solid var(--hair)',
                    borderRadius: '8px',
                    padding: '20px',
                  }}
                >
                  <Input
                    label="Email address"
                    type="email"
                    placeholder="you@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    mono
                    autoFocus
                    required
                  />

                  {error && (
                    <div style={{
                      padding: '10px 14px',
                      borderRadius: '6px',
                      background: 'rgba(232, 112, 112, 0.1)',
                      border: '1px solid rgba(232, 112, 112, 0.2)',
                      color: 'var(--danger)',
                      fontSize: '13px',
                    }}>
                      {error}
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: 8 }}>
                    <Button
                      type="button"
                      variant="ghost"
                      size="md"
                      onClick={() => { setStep('landing'); setError(''); setEmail(''); }}
                    >
                      Back
                    </Button>
                    <Button
                      type="submit"
                      variant="primary"
                      size="md"
                      fullWidth
                      loading={loading}
                    >
                      Continue
                    </Button>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            style={{
              marginTop: 48,
              display: 'flex',
              alignItems: 'center',
              gap: 24,
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '11px',
              letterSpacing: '0.1em',
              color: 'var(--muted)',
              opacity: 0.6,
            }}
          >
            <span>pulp.sh</span>
            <span>•</span>
            <span>v1.0 · 2026</span>
          </motion.div>
        </motion.div>
      </div>

      {/* Create account modal */}
      <Modal
        open={showCreateModal}
        onClose={() => { setShowCreateModal(false); setCreateError(''); setName(''); }}
        title="Create your account"
        width={400}
      >
        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <p style={{ fontSize: '14px', color: 'var(--muted)', margin: 0 }}>
            No account found for{' '}
            <span style={{ color: 'var(--pith)', fontFamily: "'JetBrains Mono', monospace", fontSize: '13px' }}>
              {email}
            </span>
            . Enter your name to get started.
          </p>

          <Input
            label="Full name"
            type="text"
            placeholder="Jane Smith"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
            required
          />

          {createError && (
            <div style={{
              padding: '10px 14px',
              borderRadius: '6px',
              background: 'rgba(232, 112, 112, 0.1)',
              border: '1px solid rgba(232, 112, 112, 0.2)',
              color: 'var(--danger)',
              fontSize: '13px',
            }}>
              {createError}
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            loading={createLoading}
          >
            Create account
          </Button>
        </form>
      </Modal>
    </div>
  );
}
