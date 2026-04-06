import React, { useState, useEffect, useRef } from 'react';
import { Palette, Upload, Sparkles } from 'lucide-react';
import { useDashboardStore } from '../store/dashboardStore';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from '../AuthContext';
import { useNavigate } from 'react-router-dom';
import './HeaderAuth.css';

const Header = () => {
  const { theme, setTheme, setUploadOpen } = useDashboardStore();
  const [time, setTime] = useState(new Date());
  const [showTheme, setShowTheme] = useState(false);
  const [tagline, setTagline] = useState('');
  const fullTagline = 'Ask anything. See everything.';
  const taglineTyped = useRef(false);
  const [showAuth, setShowAuth] = useState(false);
  const authRef = useRef(null);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  // Click outside auth dropdown
  useEffect(() => {
    const handleClick = (e) => {
      if (authRef.current && !authRef.current.contains(e.target)) {
        setShowAuth(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Live clock
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Typewriter tagline
  useEffect(() => {
    if (taglineTyped.current) return;
    taglineTyped.current = true;
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setTagline(fullTagline.slice(0, i));
      if (i >= fullTagline.length) clearInterval(interval);
    }, 80);
    return () => clearInterval(interval);
  }, []);

  const fmt = time.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  const tms = time.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });

  const themes = [
    { id: 'midnight', label: 'Midnight', desc: 'Deep indigo & blue', swatch: 'linear-gradient(135deg,#0f0c29,#302b63,#24243e)' },
    { id: 'aurora', label: 'Aurora', desc: 'Emerald & teal', swatch: 'linear-gradient(135deg,#0a1628,#0a2a1e,#051a10)' },
    { id: 'crimson', label: 'Crimson', desc: 'Rose & amber', swatch: 'linear-gradient(135deg,#1a0a0a,#2a0a0a,#1a0505)' },
  ];

  return (
    <header style={{
      position: 'fixed', top: 0, left: 0, width: '100%', height: 64, zIndex: 100,
      background: 'var(--bg-header)', backdropFilter: 'blur(24px) saturate(180%)',
      borderBottom: '1px solid rgba(var(--color-primary-rgb), 0.2)',
      boxShadow: '0 4px 30px rgba(0,0,0,0.5)',
      display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 24px', flexWrap: 'nowrap',
    }}>
      {/* LEFT */}
      <div style={{ flex: '0 0 auto', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 36, height: 36, animation: 'geo-rotate 20s linear infinite' }}>
          <svg viewBox="0 0 40 40" width="36" height="36">
            <defs>
              <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="var(--color-primary)" />
                <stop offset="100%" stopColor="var(--color-secondary)" />
              </linearGradient>
            </defs>
            <polygon points="20,2 38,20 20,38 2,20" fill="url(#logoGrad)" />
          </svg>
        </div>
        <span style={{ fontSize: 22, fontWeight: 700, letterSpacing: -0.5 }} className="gradient-text">QueryIQ</span>
      </div>

      {/* CENTER */}
      <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
        <span style={{ fontSize: 13, color: 'rgba(148,163,184,0.8)', letterSpacing: 2, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
          {tagline}<span style={{ animation: 'blink-cursor 0.8s infinite', marginLeft: 2 }}>|</span>
        </span>
      </div>

      {/* RIGHT */}
      <div style={{ flex: '0 0 auto', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'nowrap' }}>
        {/* Clock */}
        <span className="tabular-nums" style={{ fontSize: 13, color: 'var(--color-muted)', whiteSpace: 'nowrap' }}>
          {fmt} • {tms}
        </span>



        {/* Theme */}
        <div style={{ position: 'relative' }}>
          <button onClick={() => setShowTheme(!showTheme)} style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}>
            <Palette size={16} color="var(--color-muted)" />
          </button>
          <AnimatePresence>
            {showTheme && (
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} transition={{ duration: 0.15 }} style={{ position: 'absolute', right: 0, top: 42, width: 240, zIndex: 200, background: 'rgba(8,4,24,0.98)', border: '1px solid rgba(var(--color-primary-rgb),0.2)', borderRadius: 16, padding: 16, boxShadow: '0 20px 60px rgba(0,0,0,0.6)' }}>
                <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--color-muted)', marginBottom: 12 }}>Choose Theme</div>
                {themes.map(t => (
                  <button key={t.id} onClick={() => { setTheme(t.id); setShowTheme(false); }} style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: 12, borderRadius: 12, border: theme === t.id ? '1px solid rgba(var(--color-primary-rgb),0.4)' : '1px solid transparent', background: theme === t.id ? 'rgba(var(--color-primary-rgb),0.08)' : 'transparent', cursor: 'pointer', marginBottom: 4, transition: 'all 0.2s' }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: t.swatch, flexShrink: 0 }} />
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontSize: 14, fontWeight: 500, color: 'white' }}>{t.label}</div>
                      <div style={{ fontSize: 12, color: 'var(--color-muted)' }}>{t.desc}</div>
                    </div>
                    {theme === t.id && <span style={{ marginLeft: 'auto', color: 'var(--color-primary)' }}>✓</span>}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Upload */}
        <button onClick={() => setUploadOpen(true)} style={{ height: 34, padding: '0 16px', background: 'rgba(var(--color-primary-rgb),0.1)', border: '1px solid rgba(var(--color-primary-rgb),0.3)', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', transition: 'all 0.2s', color: 'var(--color-primary)', fontSize: 13, fontWeight: 500 }}>
          <Upload size={14} />
          Upload Data
        </button>

        {/* Auth Avatar Section */}
        <div ref={authRef} style={{ position: 'relative' }}>
          <div className="avatar-container" onClick={() => setShowAuth(!showAuth)}>
            <span className="user-name-greeting">Hey, {user?.displayName?.split(' ')[0] || 'User'}</span>
            <div className="avatar-circle">
              {user?.photoURL ? (
                <img src={user.photoURL} alt={user.displayName} className="avatar-img" />
              ) : (
                <span>{user?.displayName?.charAt(0) || user?.email?.charAt(0).toUpperCase()}</span>
              )}
            </div>
          </div>

          <AnimatePresence>
            {showAuth && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: -10 }} 
                animate={{ opacity: 1, scale: 1, y: 0 }} 
                exit={{ opacity: 0, scale: 0.95, y: -10 }} 
                className="auth-dropdown"
              >
                <div className="dropdown-header">
                  {user?.photoURL ? (
                    <img src={user.photoURL} alt={user.displayName} className="dropdown-avatar-large" />
                  ) : (
                    <div className="avatar-circle" style={{ width: 72, height: 72, fontSize: 28, borderWidth: 3 }}>
                      {user?.displayName?.charAt(0) || user?.email?.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="dropdown-name">{user?.displayName || 'InsightIQ User'}</div>
                  <div className="dropdown-email">{user?.email}</div>
                </div>
                <button className="logout-btn" onClick={handleLogout}>Logout</button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
};

export default Header;
