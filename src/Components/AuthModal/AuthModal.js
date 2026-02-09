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

  // Update authMode when mode prop changes
  React.useEffect(() => {
    setAuthMode(mode);
  }, [mode]);

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

  const switchToSignIn = () => {
    setAuthMode('signin');
    setError('');
    setMessage('');
  };

  const switchToSignUp = () => {
    setAuthMode('signup');
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

            <div className="modalButtonsRow">
              {authMode === 'signin' ? (
                <>
                  <button 
                    type="button"
                    className="modalSecondaryBtn" 
                    onClick={switchToSignUp}
                  >
                    Create an Account
                  </button>
                  <button 
                    type="submit" 
                    className="modalPrimaryBtn" 
                    disabled={loading}
                  >
                    {loading ? 'Loading...' : 'Sign In'}
                  </button>
                </>
              ) : (
                <>
                  <button 
                    type="button"
                    className="modalSecondaryBtn" 
                    onClick={switchToSignIn}
                  >
                    Sign In
                  </button>
                  <button 
                    type="submit" 
                    className="modalPrimaryBtn" 
                    disabled={loading}
                  >
                    {loading ? 'Loading...' : 'Create an Account'}
                  </button>
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