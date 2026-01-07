import './App.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './Components/Navbar/Navbar';
import Home from './Pages/Home';
import RateManager from './Pages/RateManager';
import Managers from './Pages/Managers';

function App() {
  return (
    <div>
      <BrowserRouter>
      <Navbar/>
      <Routes>
        <Route path='/' element={<Home/>}/>
        <Route path='/rate' element={<RateManager/>}>
          <Route path=':managerID' element={<Managers/>}/>
        </Route>
    
      </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
 