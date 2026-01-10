import React from 'react'
import './RestaurantLanding.css';
import { useNavigate } from 'react-router-dom';
import logo from './../Assets/Logo.png';
import search from './../Assets/Search.png';

const RestaurantLanding = () => {
  return (
    <div className='restoLanding'>
        <div className="bgmain">
            <div className="main">
                <div className="left">
                    <span className='title'>Manager <br></br>Check</span>
                </div>
                <div className="right">
                    <div className="searching">
                        <span>Rate <i>your</i> restaurant</span>
                        <div className="searchRes">
                            <img src={search} alt="Search" className='searchLogo'/>
                            <input
                                type="text"
                                placeholder="Search for a restaurant"
                                className='searchBarMan'
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div className="bottom">
            <div className="anonBox">
                <span className='header'>Anonymous reviews</span>
                {/* <p>Manager Check protects your reviews about the restaurant industry</p> */}
                <button className="viewRatings">View your ratings</button>
            </div>
            <div className="topRestos">
                <span>Find the <underline>best</underline> workplace</span>
                <button className="findRestos">View the top rated restaurants</button>
            </div>
      </div>
    </div>
  )
}

export default RestaurantLanding
