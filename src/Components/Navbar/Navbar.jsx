import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../authContext';
import AuthModal from '../AuthModal/AuthModal';
import './Navbar.css';

const Navbar = () => {
  const { user, signOut } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('signin');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const isLandingPage = location.pathname === '/';

  const handleAuthClick = (mode) => {
    setAuthMode(mode);
    setShowAuthModal(true);
  };

  const handleSignOut = async () => {
    await signOut();
    setShowUserMenu(false);
    navigate('/');
  };

  const goHome = () => navigate('/');

  // Get initials from email for avatar
  const getInitials = (email) => {
    if (!email) return '?';
    return email.charAt(0).toUpperCase();
  };

  return (
    <>
      <nav className='mainNavbar'>
        <div className='navLeft'>
          <div className='navLogo' onClick={goHome} style={{ cursor: 'pointer' }}>
            Manager<span>Check</span>
          </div>
          {!isLandingPage && (
            <button className='navHomeBtn' onClick={goHome}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                <polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
              Home
            </button>
          )}
        </div>

        <div className='navRight'>
          {user ? (
            /* ── LOGGED IN STATE ── */
            <div className="navUserSection">
              <div className="navUserInfo">
                <span className="navWelcome">Welcome back,</span>
                <span className="navUserEmail">{user.email}</span>
              </div>
              <div className="navUserMenuWrapper">
                <button
                  className="navAvatar"
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  title={user.email}
                >
                  {getInitials(user.email)}
                </button>
                {showUserMenu && (
                  <>
                    <div className="navMenuBackdrop" onClick={() => setShowUserMenu(false)} />
                    <div className="navUserMenu">
                      <div className="navMenuEmail">{user.email}</div>
                      <div className="navMenuDivider" />
                      <button className="navMenuSignOut" onClick={handleSignOut}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                          <polyline points="16 17 21 12 16 7"/>
                          <line x1="21" y1="12" x2="9" y2="12"/>
                        </svg>
                        Sign Out
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          ) : (
            /* ── LOGGED OUT STATE ── */
            <>
              <button className='navBtnLogin' onClick={() => handleAuthClick('signin')}>
                Login
              </button>
              <button className='navBtnSignup' onClick={() => handleAuthClick('signup')}>
                Sign Up
              </button>
            </>
          )}
        </div>
      </nav>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        mode={authMode}
      />
    </>
  );
};

export default Navbar;