import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, NavLink, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import toast from 'react-hot-toast';
import MenuView from './pages/MenuView';
import AdminDashboard from './pages/AdminDashboard';
import LoginPage from './pages/LoginPage';
import { getToken, removeToken, verifyToken, logout } from './api';
import './index.css';

function Header() {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');

  async function handleLogout() {
    try { await logout(); } catch {}
    removeToken();
    toast.success('Çıkış yapıldı');
    window.location.href = '/';
  }

  return (
    <header className="header">
      <div className="header-inner">
        <NavLink to="/" className="header-logo">
          <img
            src="/logo.png"
            alt="My Cookies Patisserie"
            className="logo-img"
            onError={(e) => { e.target.style.display = 'none'; }}
          />
        </NavLink>
        {isAdmin ? (
          <nav className="header-nav">
            <button
              onClick={handleLogout}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.8rem' }}
            >
              🚪 Çıkış Yap
            </button>
          </nav>
        ) : (
          <nav className="header-nav">
            <NavLink to="/" className={({ isActive }) => isActive ? 'active' : ''} end>
              Menü
            </NavLink>
          </nav>
        )}
      </div>
    </header>
  );
}

function AdminRoute() {
  const [authed, setAuthed] = useState(null); // null=checking, true/false

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    const token = getToken();
    if (!token) {
      setAuthed(false);
      return;
    }
    try {
      await verifyToken();
      setAuthed(true);
    } catch {
      removeToken();
      setAuthed(false);
    }
  }

  if (authed === null) {
    return (
      <div className="page-content">
        <div className="empty-state">
          <div className="empty-icon">🔐</div>
          <p>Yetkilendirme kontrol ediliyor...</p>
        </div>
      </div>
    );
  }

  if (!authed) {
    return <LoginPage onLogin={() => setAuthed(true)} />;
  }

  return <AdminDashboard />;
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="app-container">
        <Header />
        <Routes>
          <Route path="/" element={<MenuView />} />
          <Route path="/admin" element={<AdminRoute />} />
        </Routes>
      </div>
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#1a1a1a',
            color: '#f5f5f5',
            border: '1px solid #2a2a2a',
            fontFamily: 'Inter, sans-serif',
            fontSize: '0.9rem',
          },
        }}
      />
    </BrowserRouter>
  );
}
