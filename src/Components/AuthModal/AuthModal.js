import React, { useState } from 'react';
import { useAuth } from '../../authContext';
import './AuthModal.css';

const AuthModal = ({ isOpen, onClose, mode = 'signin' }) => {
  const [authMode, setAuthMode] = useState(mode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const { signIn, signUp } = useAuth();

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    if (authMode === 'signin') {
      const { error } = await signIn(email, password);
      if (error) {
        setError(error.message);
      } else {
        onClose();
      }
    } else {
      const { error } = await signUp(email, password);
      if (error) {
        setError(error.message);
      } else {
        setMessage('Account created! You can now sign in.');
        setTimeout(() => {
          setAuthMode('signin');
          setMessage('');
        }, 2000);
      }
    }
    
    setLoading(false);
  };

  const toggleMode = () => {
    setAuthMode(authMode === 'signin' ? 'signup' : 'signin');
    setError('');
    setMessage('');
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="modalOverlay" onClick={onClose}></div>
      <div className="authModal">
        <button className="modalCloseBtn" onClick={onClose}>✕</button>
        <div className="modalContent">
          <h2>{authMode === 'signin' ? 'Sign In' : 'Sign Up'}</h2>
          <p className="authSubtext">
            {authMode === 'signin' 
              ? 'Sign in to rate managers and restaurants' 
              : 'Create an account to start rating'}
          </p>
          
          {error && <div className="errorMessage">{error}</div>}
          {message && <div className="successMessage">{message}</div>}

          {/* Email/Password Form */}
          <form onSubmit={handleEmailAuth}>
            <div className="modalInputGroup">
              <label>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="modalInput"
                placeholder="your@email.com"
              />
            </div>

            <div className="modalInputGroup">
              <label>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="modalInput"
                placeholder="••••••••"
                minLength={6}
              />
            </div>

            <div className="modalButtons">
              <button 
                type="submit" 
                className="modalAddBtn" 
                disabled={loading}
              >
                {loading ? 'Loading...' : (authMode === 'signin' ? 'Sign In' : 'Sign Up')}
              </button>
            </div>
          </form>

          <div className="authToggle">
            {authMode === 'signin' ? (
              <p>
                Don't have an account?{' '}
                <span onClick={toggleMode} className="toggleLink">
                  Sign Up
                </span>
              </p>
            ) : (
              <p>
                Already have an account?{' '}
                <span onClick={toggleMode} className="toggleLink">
                  Sign In
                </span>
              </p>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default AuthModal;