import React, { useState } from 'react';
import { useAuth } from '../../authContext';
import { supabase } from '../../supabaseClient';
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

  const [usePhone, setUsePhone] = useState(false);
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);

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
    setPhone('');
    setOtp('');
    setOtpSent(false);
    setUsePhone(false);
    setAuthMode(newMode);
  };

  const togglePhoneMode = () => {
    clearMessages();
    setOtp('');
    setOtpSent(false);
    setPhone('');
    setUsePhone(!usePhone);
  };

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

  const handleSendOtp = async (e) => {
    e.preventDefault();
    clearMessages();
    setLoading(true);
  
    // Normalize to E.164 — strip everything except digits, then prepend +1
    let normalized = phone.replace(/\D/g, '');
    if (normalized.length === 10) {
      normalized = '+1' + normalized;
    } else if (normalized.length === 11 && normalized.startsWith('1')) {
      normalized = '+' + normalized;
    } else if (!normalized.startsWith('+')) {
      normalized = '+' + normalized;
    }
  
    const { error } = await supabase.auth.signInWithOtp({ phone: normalized });
    if (error) setError(error.message);
    else setOtpSent(true);
    setLoading(false);
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    clearMessages();
    setLoading(true);
    const { error } = await supabase.auth.verifyOtp({ phone, token: otp, type: 'sms' });
    if (error) setError(error.message);
    else onClose();
    setLoading(false);
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    clearMessages();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) setError(error.message);
    else setMessage('Reset link sent! Check your inbox.');
    setLoading(false);
  };

  if (!isOpen) return null;

  const titles = {
    signin: { label: 'Welcome Back', sub: 'Sign in to rate managers and restaurants' },
    signup: { label: 'Create Account', sub: 'Join to share your workplace experience' },
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

          {authMode === 'signin' && (
            <>
              {!usePhone ? (
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
                    <button type="button" className="forgotPasswordLink" onClick={() => switchMode('forgot')}>
                      Forgot password?
                    </button>
                  </div>
                  <div className="modalButtonsRow">
                    <button type="button" className="modalSecondaryBtn" onClick={() => switchMode('signup')}>
                      Create Account
                    </button>
                    <button type="submit" className="modalPrimaryBtn" disabled={loading}>
                      {loading ? 'Loading...' : 'Sign In'}
                    </button>
                  </div>
                </form>
              ) : !otpSent ? (
                <form onSubmit={handleSendOtp}>
                  <div className="modalInputGroup">
                    <label>Phone Number</label>
                    <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                      required className="modalInput" placeholder="(555) 000-0000" />
                  </div>
                  <div className="modalButtonsRow">
                    <button type="submit" className="modalPrimaryBtn" disabled={loading}>
                      {loading ? 'Sending...' : 'Send Code'}
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp}>
                  <div className="modalInputGroup">
                    <label>Enter the 6-digit code sent to {phone}</label>
                    <input type="text" value={otp} onChange={(e) => setOtp(e.target.value)}
                      required className="modalInput" placeholder="123456" maxLength={6} />
                  </div>
                  <div className="modalButtonsRow">
                    <button type="button" className="modalSecondaryBtn" onClick={() => setOtpSent(false)}>← Back</button>
                    <button type="submit" className="modalPrimaryBtn" disabled={loading}>
                      {loading ? 'Verifying...' : 'Verify'}
                    </button>
                  </div>
                </form>
              )}
              <div className="authDivider"><span>or</span></div>
              <button type="button" className="phoneToggleBtn" onClick={togglePhoneMode}>
                {usePhone ? 'Use email instead' : 'Continue with phone number'}
              </button>
            </>
          )}

          {authMode === 'signup' && (
            <>
              {!usePhone ? (
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
                    <input type="checkbox" id="termsCheck" checked={termsAccepted}
                      disabled={!termsScrolled} onChange={(e) => setTermsAccepted(e.target.checked)}
                      className="termsCheckbox" />
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
                      {loading ? 'Loading...' : 'Create Account'}
                    </button>
                  </div>
                </form>
              ) : !otpSent ? (
                <form onSubmit={handleSendOtp}>
                  <div className="modalInputGroup">
                    <label>Phone Number</label>
                    <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                      required className="modalInput" placeholder="+1 (555) 000-0000" />
                  </div>
                  <div className="modalButtonsRow">
                    <button type="submit" className="modalPrimaryBtn" disabled={loading}>
                      {loading ? 'Sending...' : 'Send Code'}
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp}>
                  <div className="modalInputGroup">
                    <label>Enter the 6-digit code sent to {phone}</label>
                    <input type="text" value={otp} onChange={(e) => setOtp(e.target.value)}
                      required className="modalInput" placeholder="123456" maxLength={6} />
                  </div>
                  <div className="modalButtonsRow">
                    <button type="button" className="modalSecondaryBtn" onClick={() => setOtpSent(false)}>← Back</button>
                    <button type="submit" className="modalPrimaryBtn" disabled={loading}>
                      {loading ? 'Verifying...' : 'Verify'}
                    </button>
                  </div>
                </form>
              )}
              <div className="authDivider"><span>or</span></div>
              <button type="button" className="phoneToggleBtn" onClick={togglePhoneMode}>
                {usePhone ? 'Use email instead' : 'Continue with phone number'}
              </button>
            </>
          )}

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
                  <button className="modalPrimaryBtn" disabled={!termsScrolled}
                    onClick={() => { setTermsAccepted(true); setShowTerms(false); }}>
                    Accept
                  </button>
                </div>
              </div>
            </>
          )}

          {authMode === 'forgot' && (
            <form onSubmit={handleForgotPassword}>
              <div className="modalInputGroup">
                <label>Email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  required className="modalInput" placeholder="your@email.com" />
              </div>
              <div className="modalButtonsRow">
                <button type="button" className="modalSecondaryBtn" onClick={() => switchMode('signin')}>← Back</button>
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