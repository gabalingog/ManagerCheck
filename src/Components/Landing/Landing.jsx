import React from 'react'
import './Landing.css';
import logo from './../Assets/Logo.png';
import search from './../Assets/Search.png';

const Landing = () => {
  return (
    <div className='landing'>
      <div className="title">
        <img src={logo} alt="Logo" className='logo'/>
        <span className='webTitle font-medium'>Manager Check</span>
      </div>
      <span className='intro'> Rate your manager from <span className='font-medium'>Barcelona Wine Bar</span></span>
      <div className="searchRes">
      <img src={search} alt="Search" className='searchLogo'/>
        <input
            type="text"
            placeholder="Search for a manager"
            className='searchBarMan'
        />
      </div>
    </div>
  )
}

export default Landing
