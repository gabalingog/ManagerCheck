import React from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import './RateManager.css'

const RateManager = () => {
  // get ID from url
  const { managerID } = useParams();
  // get name from navigation
  const location = useLocation();
  const managerName = location.state?.managerName;
  const navigate = useNavigate();

  const goHome = () => {
    navigate('/');
  }

  return (
    <div>
      <div className="rate">
        <span>Rate {managerName}</span>
      </div>
      <div className="home">
        <button onClick={goHome}>Home</button>
      </div>
    </div>
  )
}

export default RateManager
 