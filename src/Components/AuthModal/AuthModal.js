import React, { useState } from 'react';
import { useAuth } from '../../authContext';
import { supabase } from '../../supabaseClient'; // adjust path if needed
import './AuthModal.css';

const AuthModal = ({ isOpen, onClose, mode = 'signin' }) => {
  const [authMode, setAuthMode] = useState(mode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const { signIn, signUp } = useAuth();

  React.useEffect(() => { setAuthMode(mode); }, [mode]);

  const clearMessages = () => { setError(''); setMessage(''); };

  const switchMode = (newMode) => {
    clearMessages();
    setEmail('');
    setPassword('');
    setAuthMode(newMode);
  };

  // ── SIGN IN / SIGN UP ────────────────────────────────────
  const handleEmailAuth = async (e) => {
    e.preventDefault();
    clearMessages();
    setLoading(true);

    if (authMode === 'signin') {
      const { error } = await signIn(email, password);
      if (error) setError(error.message);
      else onClose();
    } else {
      const { error } = await signUp(email, password);
      if (error) setError(error.message);
      else {
        setMessage('Account created! You can now sign in.');
        setTimeout(() => switchMode('signin'), 2000);
      }
    }
    setLoading(false);
  };

  // ── FORGOT PASSWORD ──────────────────────────────────────
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    clearMessages();
    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      // Add this URL to: Supabase Dashboard → Auth → URL Configuration → Redirect URLs
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) setError(error.message);
    else setMessage('Reset link sent! Check your inbox.');
    setLoading(false);
  };

  if (!isOpen) return null;

  // ── TITLES per mode ──────────────────────────────────────
  const titles = {
    signin: { label: 'Sign In', sub: 'Sign in to rate managers and restaurants' },
    signup: { label: 'Sign Up', sub: 'Create an account to start rating' },
    forgot: { label: 'Reset Password', sub: "Enter your email and we'll send a reset link" },
  };
  const { label, sub } = titles[authMode];

  return (
    <>
      <div className="authModalOverlay" onClick={onClose}></div>
      <div className="authModal">
        <button className="modalCloseBtn" onClick={onClose}>✕</button>
        <div className="modalContent">
          <h2>{label}</h2>
          <p className="authSubtext">{sub}</p>

          {error && <div className="errorMessage">{error}</div>}
          {message && <div className="successMessage">{message}</div>}

          {/* ── SIGN IN ── */}
          {authMode === 'signin' && (
            <form onSubmit={handleEmailAuth}>
              <div className="modalInputGroup">
                <label>Email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  required className="modalInput" placeholder="your@email.com" />
              </div>
              <div className="modalInputGroup">
                <label>Password</label>
                <div className="passwordWrapper">
                  <input type={showPassword ? 'text' : 'password'} value={password}
                    onChange={(e) => setPassword(e.target.value)} required
                    className="modalInput passwordInput" placeholder="••••••••" minLength={6} />
                  <PasswordToggle show={showPassword} onToggle={() => setShowPassword(!showPassword)} />
                </div>
                {/* Forgot password link sits under the password field */}
                <button type="button" className="forgotPasswordLink"
                  onClick={() => switchMode('forgot')}>
                  Forgot password?
                </button>
              </div>
              <div className="modalButtonsRow">
                <button type="button" className="modalSecondaryBtn" onClick={() => switchMode('signup')}>
                  Create an Account
                </button>
                <button type="submit" className="modalPrimaryBtn" disabled={loading}>
                  {loading ? 'Loading...' : 'Sign In'}
                </button>
              </div>
            </form>
          )}

          {/* ── SIGN UP ── */}
          {authMode === 'signup' && (
            <form onSubmit={handleEmailAuth}>
              <div className="modalInputGroup">
                <label>Email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  required className="modalInput" placeholder="your@email.com" />
              </div>
              <div className="modalInputGroup">
                <label>Password</label>
                <div className="passwordWrapper">
                  <input type={showPassword ? 'text' : 'password'} value={password}
                    onChange={(e) => setPassword(e.target.value)} required
                    className="modalInput passwordInput" placeholder="••••••••" minLength={6} />
                  <PasswordToggle show={showPassword} onToggle={() => setShowPassword(!showPassword)} />
                </div>
              </div>
              <div className="modalButtonsRow">
                <button type="button" className="modalSecondaryBtn" onClick={() => switchMode('signin')}>
                  Sign In
                </button>
                <button type="submit" className="modalPrimaryBtn" disabled={loading}>
                  {loading ? 'Loading...' : 'Create an Account'}
                </button>
              </div>
            </form>
          )}

          {/* ── FORGOT PASSWORD ── */}
          {authMode === 'forgot' && (
            <form onSubmit={handleForgotPassword}>
              <div className="modalInputGroup">
                <label>Email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  required className="modalInput" placeholder="your@email.com" />
              </div>
              <div className="modalButtonsRow">
                <button type="button" className="modalSecondaryBtn" onClick={() => switchMode('signin')}>
                  ← Back
                </button>
                <button type="submit" className="modalPrimaryBtn" disabled={loading || !!message}>
                  {loading ? 'Sending...' : 'Send Reset Link'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </>
  );
};

// ── Small reusable toggle to avoid duplication ────────────
const PasswordToggle = ({ show, onToggle }) => (
  <button type="button" className="passwordToggle" onClick={onToggle} tabIndex={-1}>
    {show ? (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
        <line x1="1" y1="1" x2="23" y2="23"/>
      </svg>
    ) : (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
        <circle cx="12" cy="12" r="3"/>
      </svg>
    )}
  </button>
);

export default AuthModal;