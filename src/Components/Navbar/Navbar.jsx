import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../authContext';
import AuthModal from '../AuthModal/AuthModal';
import './Navbar.css';

const Navbar = () => {
  const { user, signOut } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('signin');
  const location = useLocation();
  const navigate = useNavigate();

  const isLandingPage = location.pathname === '/';

  const handleAuthClick = (mode) => {
    setAuthMode(mode);
    setShowAuthModal(true);
  };

  const handleSignOut = async () => {
    await signOut();
  };

  const goHome = () => {
    navigate('/');
  };

  return (
    <>
      <nav className='mainNavbar'>
        <div className='navLeft'>
          <div className='navLogo'>
            Manager<span>Check</span>
          </div>
        </div>
        
        <div className='navRight'>
          {!isLandingPage && (
            <button className='navHomeBtn' onClick={goHome}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                <polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
              Home
            </button>
          )}
          {user ? (
            <>
              <span className='navUserEmail'>{user.email}</span>
              <button className='navBtnSecondary' onClick={handleSignOut}>Sign Out</button>
            </>
          ) : (
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