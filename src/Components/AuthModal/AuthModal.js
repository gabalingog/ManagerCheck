import React, { useState } from 'react';
import { useAuth } from '../../authContext';
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

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setError(''); setMessage(''); setLoading(true);
    if (authMode === 'signin') {
      const { error } = await signIn(email, password);
      if (error) { setError(error.message); } else { onClose(); }
    } else {
      const { error } = await signUp(email, password);
      if (error) { setError(error.message); }
      else {
        setMessage('Account created! You can now sign in.');
        setTimeout(() => { setAuthMode('signin'); setMessage(''); }, 2000);
      }
    }
    setLoading(false);
  };

  const switchToSignIn = () => { setAuthMode('signin'); setError(''); setMessage(''); };
  const switchToSignUp = () => { setAuthMode('signup'); setError(''); setMessage(''); };

  if (!isOpen) return null;

  return (
    <>
      <div className="authModalOverlay" onClick={onClose}></div>
      <div className="authModal">
        <button className="modalCloseBtn" onClick={onClose}>✕</button>
        <div className="modalContent">
          <h2>{authMode === 'signin' ? 'Sign In' : 'Sign Up'}</h2>
          <p className="authSubtext">
            {authMode === 'signin' ? 'Sign in to rate managers and restaurants' : 'Create an account to start rating'}
          </p>

          {error && <div className="errorMessage">{error}</div>}
          {message && <div className="successMessage">{message}</div>}

          <form onSubmit={handleEmailAuth}>
            <div className="modalInputGroup">
              <label>Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="modalInput" placeholder="your@email.com" />
            </div>

            <div className="modalInputGroup">
              <label>Password</label>
              <div className="passwordWrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="modalInput passwordInput"
                  placeholder="••••••••"
                  minLength={6}
                />
                <button type="button" className="passwordToggle" onClick={() => setShowPassword(!showPassword)} tabIndex={-1}>
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

            <div className="modalButtonsRow">
              {authMode === 'signin' ? (
                <>
                  <button type="button" className="modalSecondaryBtn" onClick={switchToSignUp}>Create an Account</button>
                  <button type="submit" className="modalPrimaryBtn" disabled={loading}>{loading ? 'Loading...' : 'Sign In'}</button>
                </>
              ) : (
                <>
                  <button type="button" className="modalSecondaryBtn" onClick={switchToSignIn}>Sign In</button>
                  <button type="submit" className="modalPrimaryBtn" disabled={loading}>{loading ? 'Loading...' : 'Create an Account'}</button>
                </>
              )}
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default AuthModal;