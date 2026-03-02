// Pages/ResetPassword.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient'; // adjust path
import '../../Components/AuthModal/AuthModal.css';  // reuse your existing styles

const ResetPassword = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Supabase fires PASSWORD_RECOVERY when user lands here via the reset email link.
    // It reads the token from the URL hash and establishes a session automatically.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setReady(true);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleReset = async (e) => {
    e.preventDefault();
    setError('');
    if (password !== confirm) return setError('Passwords do not match.');
    if (password.length < 6) return setError('Password must be at least 6 characters.');

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) setError(error.message);
    else {
      setSuccess(true);
      setTimeout(() => navigate('/'), 2500);
    }
    setLoading(false);
  };

  if (!ready && !success) {
    return (
      <div style={pageStyle}>
        <div style={cardStyle}>
          <h2 style={h2Style}>Reset Password</h2>
          <p style={subtextStyle}>Verifying your reset link…</p>
        </div>
      </div>
    );
  }

  return (
    <div style={pageStyle}>
      <div style={cardStyle}>
        <h2 style={h2Style}>Reset Password</h2>
        <p style={subtextStyle}>
          {success ? 'Password updated! Redirecting…' : 'Choose a new password for your account'}
        </p>

        {error && <div className="errorMessage">{error}</div>}
        {success && <div className="successMessage">✓ Password updated successfully!</div>}

        {!success && (
          <form onSubmit={handleReset}>
            <div className="modalInputGroup">
              <label>New Password</label>
              <div className="passwordWrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required minLength={6}
                  className="modalInput passwordInput"
                  placeholder="••••••••"
                />
                <button type="button" className="passwordToggle"
                  onClick={() => setShowPassword(!showPassword)} tabIndex={-1}>
                  {showPassword ? (
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
              </div>
            </div>

            <div className="modalInputGroup">
              <label>Confirm Password</label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required minLength={6}
                className="modalInput"
                placeholder="••••••••"
              />
            </div>

            <div className="modalButtonsRow">
              <button type="submit" className="modalPrimaryBtn" disabled={loading}>
                {loading ? 'Updating…' : 'Update Password'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

const pageStyle = {
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: '#faf8f4',
  padding: '24px',
};

const cardStyle = {
  background: '#faf8f4',
  border: '1px solid rgba(60, 45, 20, 0.16)',
  borderRadius: '12px',
  padding: '44px 48px',
  maxWidth: '420px',
  width: '100%',
  boxShadow: '0 24px 60px rgba(30, 26, 20, 0.2)',
};

const h2Style = {
  fontSize: '11px',
  fontWeight: 500,
  letterSpacing: '0.22em',
  textTransform: 'uppercase',
  color: '#2a7a4b',
  margin: '0 0 16px 0',
  fontFamily: "'DM Sans', sans-serif",
};

const subtextStyle = {
  fontFamily: "'DM Serif Display', serif",
  fontSize: '24px',
  fontWeight: 400,
  color: '#1e1a14',
  margin: '0 0 28px 0',
  lineHeight: 1.2,
};

export default ResetPassword;