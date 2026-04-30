import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useStore } from '../store/useStore';
import { usersApi } from '../api/client';
import CitrusFlowBG from '../brand/CitrusFlowBG';
import Logo from '../components/Logo';
import Button from '../components/Button';
import Input from '../components/Input';
import Icons from '../components/Icons';

export default function CreateAccount() {
  const navigate = useNavigate();
  const { setUser } = useStore();
  
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await usersApi.create(email, name);
      setUser(user);
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'relative',
      width: '100%',
      height: '100vh',
      overflow: 'hidden',
    }}>
      {/* Shader Background */}
      <CitrusFlowBG interactive={false} style={{ opacity: 0.4 }} />

      {/* Content */}
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
          transition={{ duration: 0.4 }}
          style={{
            background: 'rgba(26, 26, 32, 0.95)',
            backdropFilter: 'blur(16px)',
            border: '1px solid var(--hair)',
            borderRadius: '8px',
            padding: '32px',
            width: '100%',
            maxWidth: 400,
          }}
        >
          {/* Back button */}
          <button
            onClick={() => navigate('/')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '13px',
              color: 'var(--muted)',
              cursor: 'pointer',
              marginBottom: '24px',
              transition: 'color 150ms ease',
            }}
            onMouseOver={(e) => e.currentTarget.style.color = 'var(--pith)'}
            onMouseOut={(e) => e.currentTarget.style.color = 'var(--muted)'}
          >
            <Icons.arrowLeft size={14} />
            Back
          </button>

          {/* Header */}
          <div style={{ marginBottom: '32px' }}>
            <Logo size={28} variant="dark" />
            <h1 style={{
              fontSize: '24px',
              fontWeight: 700,
              letterSpacing: '-0.02em',
              marginTop: '24px',
              marginBottom: '8px',
              color: 'var(--pith)',
            }}>
              Create your account
            </h1>
            <p style={{
              fontSize: '14px',
              color: 'var(--muted)',
            }}>
              Get started with your developer dashboard
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <Input
              label="Name"
              type="text"
              placeholder="Jane Smith"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />

            <Input
              label="Email"
              type="email"
              placeholder="jane@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              mono
              required
            />

            {error && (
              <div style={{
                padding: '12px 16px',
                borderRadius: '6px',
                background: 'rgba(232, 112, 112, 0.1)',
                border: '1px solid rgba(232, 112, 112, 0.2)',
                color: 'var(--danger)',
                fontSize: '13px',
              }}>
                {error}
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              loading={loading}
              style={{ marginTop: '8px' }}
            >
              Create account
            </Button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
