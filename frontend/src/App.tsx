import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { useStore } from './store/useStore';
import { useTheme } from './store/useTheme';
import Landing from './pages/Landing';
import CreateAccount from './pages/CreateAccount';
import Dashboard from './pages/Dashboard';
import Agents from './pages/Agents';
import Intents from './pages/Intents';
import ApplicationDetail from './pages/ApplicationDetail';
import Sidebar from './components/Sidebar';

function ProtectedLayout() {
  const user = useStore(s => s.user);
  if (!user) return <Navigate to="/" replace />;

  return (
    <div style={{ display: 'flex', height: '100vh', background: 'var(--ink)' }}>
      <Sidebar />
      <main style={{ flex: 1, overflow: 'auto', position: 'relative' }}>
        <Outlet />
      </main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemedRoutes />
    </BrowserRouter>
  );
}

function ThemedRoutes() {
  const location = useLocation();
  const { theme } = useTheme();

  useEffect(() => {
    const isAuthRoute = location.pathname === '/' || location.pathname === '/signup';
    document.documentElement.setAttribute('data-theme', isAuthRoute ? 'dark' : theme);
  }, [location.pathname, theme]);

  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/signup" element={<CreateAccount />} />
      <Route path="/dashboard" element={<ProtectedLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="agents" element={<Agents />} />
        <Route path="intents" element={<Intents />} />
        <Route path="apps/:appId" element={<ApplicationDetail />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
