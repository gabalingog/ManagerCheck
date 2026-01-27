import React, { useState } from 'react';
import { useAuth } from '../../authContext'
import AuthModal from '../AuthModal/AuthModal';
import './Navbar.css';

const Navbar = () => {
  const { user, signOut } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('signin');

  const handleAuthClick = (mode) => {
    setAuthMode(mode);
    setShowAuthModal(true);
  };

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <>
      <div className='navbar'>
        <div className='buttons'>
          {user ? (
            <>
              <span className='userEmail'>{user.email}</span>
              <button onClick={handleSignOut}>Sign Out</button>
            </>
          ) : (
            <>
              <span className='loginLink' onClick={() => handleAuthClick('signin')}>
                Login
              </span>
              <button onClick={() => handleAuthClick('signup')}>Sign Up</button>
            </>
          )}
        </div>
      </div>

      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)}
        mode={authMode}
      />
    </>
  );
};

export default Navbar;