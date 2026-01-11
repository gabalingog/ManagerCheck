import './App.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './Components/Navbar/Navbar';
import Home from './Pages/Home';
import RateManager from './Components/Rate/RateManager';
import Managers from './Pages/Managers';
import Landing from './Components/Landing/ManagerLanding';
import ManagerForm from './Components/ManagerForm/ManagerForm.jsx'

function App() {
  return (
    <div>
      <BrowserRouter>
      <Routes>
        <Route path='/' element={<Home/>}/>
        <Route path='/rate/:managerID' element={<RateManager/>}/>
        <Route path="/rate/:managerID/form" element={<ManagerForm />} />
        {/* <Route path='/rate' element={<RateManager/>}>
          <Route path=':managerID' element={<Managers/>}/>
        </Route> */}
      </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
 