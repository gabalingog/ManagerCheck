import React from 'react'
import './Navbar.css'

const Navbar = () => {

  //const [login, setLogin] = useState("login");

  return (
    <div className='navbar'>
      <div className='buttons'>
        <button>Sign up</button>
        {/* <span onClick={()=>{setLogin("login")}}>Login<hr/></span> */}
        <span>Login</span>
      </div>
    </div>
  )
}

export default Navbar
