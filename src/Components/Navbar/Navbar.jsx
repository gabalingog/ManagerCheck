import React, { useState } from 'react'
import './Navbar.css'
import { Link } from 'react-router-dom';

const Navbar = () => {

  const [menu, setMenu] = useState("home");

  return (
    <div className='navbar'>
      <div className='buttons'>
        <Link to='/rate'><button >Sign up</button></Link>
        <span>Login</span>
      </div>
    </div>
  )
}

export default Navbar
