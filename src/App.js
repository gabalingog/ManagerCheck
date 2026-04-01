import './App.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './Components/Navbar/Navbar';
import Home from './Pages/Home';
import RateManager from './Components/Rate/RateManager';
import ManagerForm from './Components/ManagerForm/ManagerForm.jsx'
import RestaurantForm from './Components/ManagerForm/RestaurantForm.jsx';
import RestaurantLanding from './Components/Landing/RestaurantLanding.jsx';
import RateRestaurant from './Components/Rate/RateRestaurant.jsx';
import ManagersList from './Components/Rate/ManagersList.jsx';
import ResetPassword from './Components/Navbar/ResetPassword.jsx';
import { AuthProvider } from './authContext.js';
import RestaurantMap from './Components/Landing/RestaurantMap.jsx';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path='/' element={<Home />} />
          <Route path='/rate/:managerID' element={<RateManager />} />
          <Route path="/restaurants" element={<RestaurantLanding />} />
          <Route path="/restaurant/:restaurantID" element={<RateRestaurant />} />
          <Route path="/restaurant/:restaurantID/managers" element={<ManagersList />} />
          <Route path="/rate/:managerID/form" element={<ManagerForm />} />
          <Route path="/restaurant/:restaurantID/form" element={<RestaurantForm />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/map" element={<RestaurantMap />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;