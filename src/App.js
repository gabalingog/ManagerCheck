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
import { AuthProvider } from './authContext.js';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path='/' element={<Home/>}/>
          <Route path='/rate/:managerID' element={<RateManager/>}/>
          <Route path="/restaurants" element={<RestaurantLanding />} />
          <Route path="/restaurant/:restaurantID" element={<RateRestaurant />} />
          <Route path="/restaurant/:restaurantID/managers" element={<ManagersList />} /> {/* ADD THIS ROUTE */}
          <Route path="/rate/:managerID/form" element={<ManagerForm />} />
          <Route path="/restaurant/:restaurantID/form" element={<RestaurantForm />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;