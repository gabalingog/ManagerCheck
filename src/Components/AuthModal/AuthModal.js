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

  const [showTerms, setShowTerms] = useState(false);
  const [termsScrolled, setTermsScrolled] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  const handleTermsScroll = (e) => {
    const el = e.target;
    if (el.scrollHeight - el.scrollTop <= el.clientHeight + 10) {
      setTermsScrolled(true);
    }
  };

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

              <div className="termsRow">
                <input
                  type="checkbox"
                  id="termsCheck"
                  checked={termsAccepted}
                  disabled={!termsScrolled}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="termsCheckbox"
                />
                <label htmlFor="termsCheck" className={`termsLabel ${!termsScrolled ? 'termsDisabled' : ''}`}>
                  I agree to the{' '}
                  <button type="button" className="termsLink" onClick={() => setShowTerms(true)}>
                    terms and conditions
                  </button>
                </label>
              </div>

              <div className="modalButtonsRow">
                <button type="button" className="modalSecondaryBtn" onClick={() => switchMode('signin')}>
                  Sign In
                </button>
                <button type="submit" className="modalPrimaryBtn" disabled={loading || !termsAccepted}>
                  {loading ? 'Loading...' : 'Create an Account'}
                </button>
              </div>
            </form>
          )}

          {/* Terms Modal */}
          {showTerms && (
            <>
              <div className="termsOverlay" onClick={() => setShowTerms(false)}></div>
              <div className="termsModal">
                <div className="termsModalHeader">
                  <h3>Terms and Conditions</h3>
                  <button className="modalCloseBtn" onClick={() => setShowTerms(false)}>✕</button>
                </div>
                <div className="termsModalBody" onScroll={handleTermsScroll}>
                  <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p>
                  <p>Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>
                  <p>Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.</p>
                  <p>Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt. Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet.</p>
                  <p>At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti quos dolores et quas molestias excepturi sint occaecati cupiditate non provident.</p>
                  <p>Similique sunt in culpa qui officia deserunt mollitia animi, id est laborum et dolorum fuga. Et harum quidem rerum facilis est et expedita distinctio. Nam libero tempore, cum soluta nobis est eligendi optio cumque nihil impedit quo minus.</p>
                  <p>Temporibus autem quibusdam et aut officiis debitis aut rerum necessitatibus saepe eveniet ut et voluptates repudiandae sint et molestiae non recusandae. Itaque earum rerum hic tenetur a sapiente delectus, ut aut reiciendis voluptatibus maiores.</p>
                </div>
                <div className="termsModalFooter">
                  {!termsScrolled && <p className="termsScrollHint">Scroll to the bottom to accept</p>}
                  <button
                    className="modalPrimaryBtn"
                    disabled={!termsScrolled}
                    onClick={() => { setTermsAccepted(true); setShowTerms(false); }}
                  >
                    Accept
                  </button>
                </div>
              </div>
            </>
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