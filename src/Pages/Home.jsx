import React from 'react'
import ManagerLanding from '../Components/Landing/ManagerLanding';
import Navbar from './../Components/Navbar/Navbar';
import RestaurantLanding from '../Components/Landing/RestaurantLanding';

const Home = () => {
  return (
    <div>
      {/* <ManagerLanding/> */}
      <RestaurantLanding/>
    </div>
  )
}

export default Home
