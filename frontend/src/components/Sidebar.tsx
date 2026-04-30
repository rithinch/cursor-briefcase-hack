import { NavLink, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useStore } from '../store/useStore';
import { useTheme } from '../store/useTheme';
import Logo from './Logo';
import Icons from './Icons';

const navItems = [
  { to: '/dashboard', icon: Icons.home, label: 'Overview' },
  { to: '/dashboard/agents', icon: Icons.agent, label: 'Agents' },
  { to: '/dashboard/intents', icon: Icons.flow, label: 'Payments' },
];

export default function Sidebar() {
  const { user, clearUser } = useStore();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    clearUser();
    navigate('/');
  };

  return (
    <aside style={{
      width: 240,
      height: '100vh',
      background: 'var(--ink)',
      borderRight: '1px solid var(--hair)',
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
    }}>
      {/* Logo */}
      <div style={{ padding: '20px 16px', borderBottom: '1px solid var(--hair)' }}>
        <Logo size={32} variant={theme === 'dark' ? 'dark' : 'light'} />
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: '16px 8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/dashboard'}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '10px 12px',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: 500,
              color: isActive ? 'var(--pith)' : 'var(--muted)',
              background: isActive ? 'rgba(255, 122, 26, 0.1)' : 'transparent',
              textDecoration: 'none',
              transition: 'all 150ms ease',
            })}
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Bottom section */}
      <div style={{ padding: '16px', borderTop: '1px solid var(--hair)' }}>
        {/* User info */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '8px 0',
          marginBottom: '12px',
        }}>
          <div style={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            background: 'var(--rind)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--ink)',
            fontSize: '13px',
            fontWeight: 600,
          }}>
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: '13px',
              fontWeight: 500,
              color: 'var(--pith)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}>
              {user?.name || 'User'}
            </div>
            <div style={{
              fontSize: '11px',
              color: 'var(--muted)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}>
              {user?.email}
            </div>
          </div>
        </div>

        {/* Theme toggle */}
        <motion.button
          onClick={toggleTheme}
          whileHover={{ background: 'rgba(247, 242, 234, 0.05)' }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            width: '100%',
            padding: '8px 12px',
            borderRadius: '6px',
            fontSize: '13px',
            color: 'var(--muted)',
            cursor: 'pointer',
            transition: 'color 150ms ease',
          }}
        >
          {theme === 'dark' ? <Icons.sun size={16} /> : <Icons.moon size={16} />}
          {theme === 'light' ? 'Dark mode' : 'Light mode'}
        </motion.button>

        {/* Logout button */}
        <motion.button
          onClick={handleLogout}
          whileHover={{ background: 'rgba(247, 242, 234, 0.05)' }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            width: '100%',
            padding: '8px 12px',
            borderRadius: '6px',
            fontSize: '13px',
            color: 'var(--muted)',
            cursor: 'pointer',
            transition: 'color 150ms ease',
          }}
        >
          <Icons.logout size={16} />
          Sign out
        </motion.button>
      </div>
    </aside>
  );
}
