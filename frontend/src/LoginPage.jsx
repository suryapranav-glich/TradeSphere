import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useNavigate } from 'react-router-dom';
import loginBg from './assets/login-bg.jpg';
import './LoginPage.css';

// ─── Diamond Logo (shared) ────────────────────────────────────────────────
const DiamondLogo = () => (
  <div className="login-logo-icon">
    <svg viewBox="0 0 40 40" width="44" height="44">
      <defs>
        <linearGradient id="loginLogoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6c63ff" />
          <stop offset="100%" stopColor="#00d4ff" />
        </linearGradient>
      </defs>
      <polygon points="20,2 38,20 20,38 2,20" fill="url(#loginLogoGrad)" />
    </svg>
  </div>
);

// ─── Eye Icons ────────────────────────────────────────────────────────────
const EyeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeOffIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

const LoginPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSigningUpAction, setIsSigningUpAction] = useState(false);

  // Forgot password state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetStatus, setResetStatus] = useState(''); // 'sent' | 'error' | ''
  const [resetMsg, setResetMsg] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  const { login, signup, loginWithGoogle, resetPassword, user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && !isSigningUpAction) navigate('/');
  }, [user, navigate, isSigningUpAction]);

// ─── Shared Error Handler ───────────────────────────────────────────
  const getFriendlyErrorMessage = (err) => {
    let msg = err.message || '';
    if (msg.includes('auth/invalid-api-key')) return 'Configuration Error: Invalid Firebase API Key in .env file.';
    if (msg.includes('auth/email-already-in-use')) return 'Already account exists.';
    if (msg.includes('auth/weak-password')) return 'Password should be at least 6 characters.';
    if (msg.includes('auth/invalid-credential') || msg.includes('auth/user-not-found') || msg.includes('auth/wrong-password')) return 'Invalid email or password.';
    if (msg.includes('auth/network-request-failed')) return 'Network error. Please check your connection.';
    if (msg.includes('auth/operation-not-allowed')) return 'Email/Password sign-up is disabled in your Firebase Console. Please enable it in Firebase Authentication settings.';
    
    // Cleanup any other Firebase string
    const cleaned = msg.replace('Firebase:', '').replace(/\(auth\/.*\)\.?/, '').replace('Error', '').trim();
    return cleaned || `Authentication failed: ${msg}`;
  };

  // ─── Auth Handlers ────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    if (!isLogin && password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    try {
      if (isLogin) {
        await login(email, password);
        navigate('/');
      } else {
        setIsSigningUpAction(true);
        await signup(email, password, name);
        await logout(); // Sign out to force manual login
        setIsLogin(true);
        setSuccessMsg('Account created successfully! Please sign in.');
        setPassword('');
        setConfirmPassword('');
        setTimeout(() => setIsSigningUpAction(false), 500);
      }
    } catch (err) {
      setError(getFriendlyErrorMessage(err));
      setIsSigningUpAction(false);
    }
  };

  const handleGoogle = async () => {
    setError('');
    setSuccessMsg('');
    try {
      await loginWithGoogle();
      navigate('/');
    } catch (err) {
      setError(getFriendlyErrorMessage(err));
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError('');
    setSuccessMsg('');
    setConfirmPassword('');
  };

  // ─── Forgot Password Handlers ─────────────────────────────────────
  const openForgotModal = (e) => {
    e.preventDefault();
    setResetEmail(email); // pre-fill if user already typed email
    setResetStatus('');
    setResetMsg('');
    setShowForgotModal(true);
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!resetEmail.trim()) {
      setResetStatus('error');
      setResetMsg('Please enter your email address.');
      return;
    }
    setResetLoading(true);
    try {
      await resetPassword(resetEmail.trim());
      setResetStatus('sent');
      setResetMsg(`A password reset link has been sent to ${resetEmail.trim()}. Check your inbox (and spam folder).`);
    } catch (err) {
      setResetStatus('error');
      setResetMsg(err.message.replace('Firebase: ', '').replace(/\(auth\/.*\)/, '').trim());
    } finally {
      setResetLoading(false);
    }
  };

  const closeForgotModal = () => {
    setShowForgotModal(false);
    setResetStatus('');
    setResetMsg('');
  };

  // ─── Render ───────────────────────────────────────────────────────
  return (
    <div className="login-split">

      {/* ── FORGOT PASSWORD MODAL ──────────────────────────────── */}
      {showForgotModal && (
        <div className="fp-backdrop" onClick={closeForgotModal}>
          <div className="fp-modal" onClick={(e) => e.stopPropagation()}>
            <button className="fp-close-btn" onClick={closeForgotModal} aria-label="Close">✕</button>

            <div className="fp-header">
              <DiamondLogo />
              <h2 className="fp-title">Reset Password</h2>
              <p className="fp-subtitle">
                Enter your account email and we'll send you a secure reset link.
              </p>
            </div>

            {resetStatus === 'sent' ? (
              <div className="fp-success">
                <div className="fp-success-icon">✓</div>
                <p>{resetMsg}</p>
                <button className="fp-done-btn" onClick={closeForgotModal}>Done</button>
              </div>
            ) : (
              <form onSubmit={handleResetPassword} className="fp-form">
                {resetStatus === 'error' && (
                  <div className="fp-error">{resetMsg}</div>
                )}
                <div className="login-field">
                  <label className="login-label" htmlFor="fp-email">Email Address</label>
                  <input
                    id="fp-email"
                    className="login-input"
                    type="email"
                    placeholder="you@example.com"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    required
                    autoFocus
                  />
                </div>
                <button className="login-submit-btn fp-submit-btn" type="submit" disabled={resetLoading}>
                  {resetLoading ? 'Sending…' : 'Send Reset Link'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ── LEFT PANEL ─────────────────────────────────────────── */}
      <div className="login-left">
        <div className="login-form-wrapper">

          {/* Logo — always visible in both login & signup */}
          <div className="login-logo-area">
            <DiamondLogo />
            <h1 className="login-app-name">InsightIQ</h1>
            <p className="login-tagline">Your AI-Powered Business Intelligence Dashboard</p>
          </div>

          {/* Messages */}
          {error && <div className="login-error">{error}</div>}
          {successMsg && <div className="login-success">{successMsg}</div>}

          {/* Form */}
          <form onSubmit={handleSubmit} className="login-form">

            {/* Full Name (signup only) */}
            <div className={`login-field-slide ${!isLogin ? 'login-field-slide--visible' : ''}`}>
              {!isLogin && (
                <div className="login-field">
                  <label className="login-label" htmlFor="login-name">Full Name</label>
                  <input
                    id="login-name"
                    className="login-input"
                    type="text"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required={!isLogin}
                  />
                </div>
              )}
            </div>

            {/* Email */}
            <div className="login-field">
              <label className="login-label" htmlFor="login-email">Email Address</label>
              <input
                id="login-email"
                className="login-input"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            {/* Password */}
            <div className="login-field">
              <label className="login-label" htmlFor="login-password">Password</label>
              <div className="login-input-wrapper">
                <input
                  id="login-password"
                  className="login-input login-input--has-toggle"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="login-eye-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>

            {/* Confirm Password (signup only) */}
            <div className={`login-field-slide ${!isLogin ? 'login-field-slide--visible' : ''}`}>
              {!isLogin && (
                <div className="login-field">
                  <label className="login-label" htmlFor="login-confirm-password">Confirm Password</label>
                  <div className="login-input-wrapper">
                    <input
                      id="login-confirm-password"
                      className="login-input login-input--has-toggle"
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required={!isLogin}
                    />
                    <button
                      type="button"
                      className="login-eye-btn"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      tabIndex={-1}
                    >
                      {showConfirmPassword ? <EyeOffIcon /> : <EyeIcon />}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Forgot Password */}
            {isLogin && (
              <div className="login-forgot-row">
                <a href="#" className="login-forgot-link" onClick={openForgotModal}>
                  Forgot Password?
                </a>
              </div>
            )}

            {/* Submit */}
            <button className="login-submit-btn" type="submit">
              {isLogin ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          {/* Or Divider */}
          <div className="login-or-divider"><span>or</span></div>

          {/* Google Button */}
          <button className="login-google-btn" onClick={handleGoogle} type="button">
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>

          {/* Toggle */}
          <div className="login-toggle">
            {isLogin ? "Don't have an account?" : 'Already have an account?'}
            <button className="login-toggle-btn" onClick={toggleMode} type="button">
              {isLogin ? 'Sign Up' : 'Sign In'}
            </button>
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL ────────────────────────────────────────── */}
      <div className="login-right">
        <img src={loginBg} alt="Business Intelligence Dashboard" className="login-right-img" />
        <div className="login-right-overlay" />
        <div className="login-right-fade" />
      </div>
    </div>
  );
};

export default LoginPage;
