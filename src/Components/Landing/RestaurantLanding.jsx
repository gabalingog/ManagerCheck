import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom';
import './RestaurantLanding.css';
import search from './../Assets/Search.png';
import logo from './../Assets/finalLogo.png';
// import bg from './../Assets/background.png';
import waitress from './../Assets/waitress.png';
// import pic from './../Assets/other.png';
// import logo2 from './../Assets/trialLogo.png';
import pic1 from './../Assets/pic1.png';
// import pic2 from './../Assets/pic2-2.png';
import pic3 from './../Assets/pic2-4.png';

const RestaurantLanding = () => {
    const navigate = useNavigate();
    const [searchInput, setSearchInput] = useState('');
    const [restaurants, setRestaurants] = useState(() => {
        const savedRestaurants = localStorage.getItem('restaurants');
        return savedRestaurants ? JSON.parse(savedRestaurants) : [
            { id: 1, name: "Barcelona Wine Bar", address: "525 Tremont St, Boston, MA 02116" },
            { id: 2, name: "Olive Garden", address: "234 Main St, Boston, MA 02118" }
        ];
    });

    useEffect(() => {
        localStorage.setItem('restaurants', JSON.stringify(restaurants));
    }, [restaurants]);
    
    const [showAddForm, setShowAddForm] = useState(false);
    const [newRestaurantName, setNewRestaurantName] = useState('');
    const [newRestaurantAddress, setNewRestaurantAddress] = useState('');
    const [filteredRestaurants, setFilteredRestaurants] = useState([]);

    const missionPhrases = [
        /**
         * bring transparency to restaurants
         * share honest employee experiences
         * build healthier cultures at work
         * support employees' perspectives
         */
        { highlight: "bring transparency", suffix: "to restaurants" },
        { highlight: "find honest", suffix: "employee experiences" },
        { highlight: "build healthier", suffix: "cultures at work" },
        { highlight: "support employees'", suffix: "perspectives" },
      ];
      
      const MissionSection = () => {
        const [index, setIndex] = useState(0);
        const [visible, setVisible] = useState(true);
      
        useEffect(() => {
          const interval = setInterval(() => {
            setVisible(false);
            setTimeout(() => {
              setIndex(prev => (prev + 1) % missionPhrases.length);
              setVisible(true);
            }, 500);
          }, 3500);
          return () => clearInterval(interval);
        }, []);
      
        const phrase = missionPhrases[index];
      
        return (
            <div className="mission">
                <div className="missionContent">
                    <span className="missionStatic">Our mission is to&nbsp;</span>
                    <div className={`missionPhrase ${visible ? 'fadeIn' : 'fadeOut'}`}>
                        <span className="missionHighlight">{phrase.highlight} </span>
                        <span className="missionSuffix">{phrase.suffix}</span>
                    </div>
                </div>
            </div>
        );
      };

    const handleSearch = (e) => {
        const searched = e.target.value;
        setSearchInput(searched);
        if (searched.trim() === '') {
            setFilteredRestaurants([]);
        } else {
            const filtered = restaurants.filter(restaurant =>
                restaurant.name.toLowerCase().includes(searched.toLowerCase())
            );
            setFilteredRestaurants(filtered);
        }
    };

    const handleSelectRestaurant = (restaurant) => {
        setSearchInput('');
        setFilteredRestaurants([]);
        navigate(`/restaurant/${restaurant.id}`, { state: { restaurantName: restaurant.name } });
    };

    const handleEnterRestaurant = () => {
        setShowAddForm(true);
        setSearchInput('');
        setFilteredRestaurants([]);
    };

    const handleAddRestaurant = () => {
        if (newRestaurantName.trim() === '') { alert('Please enter the restaurant name'); return; }
        if (newRestaurantAddress.trim() === '') { alert('Please enter the restaurant address'); return; }
        const newRestaurant = {
            id: restaurants.length + 1,
            name: newRestaurantName.trim(),
            address: newRestaurantAddress.trim()
        };
        const updatedRestaurants = [...restaurants, newRestaurant];
        setRestaurants(updatedRestaurants);
        navigate(`/restaurant/${newRestaurant.id}`, { state: { restaurantName: newRestaurant.name } });
        setNewRestaurantName('');
        setNewRestaurantAddress('');
        setShowAddForm(false);
    };

    const handleCancelAdd = () => {
        setShowAddForm(false);
        setNewRestaurantName('');
        setNewRestaurantAddress('');
    };

    return (
        <div className='restoLanding'>
            <div className="bgmain">
                <div className="bgImage" style={{
                    backgroundImage: `url(${pic3})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat'
                }}></div>
                <div className="mainBackground">
                    <div className="main">
                        <div className="left">
                            {/* Logo image stays — only font/styling changes in CSS */}
                            <img src={logo} alt="ManagerCheck" className='webLogo' />
                        </div>
                        <div className="right">
                            <div className="searching">
                                <div className="searchRes">
                                    <img src={search} alt="Search" className='searchLogo'/>
                                    <input
                                        type="text"
                                        placeholder="Search for a restaurant"
                                        className='searchBarMan'
                                        value={searchInput}
                                        onChange={handleSearch}
                                    />
                                </div>
                                
                                {searchInput && filteredRestaurants.length > 0 && (
                                    <div className="searchResult">
                                        {filteredRestaurants.map((restaurant) => (
                                            <div
                                                key={restaurant.id}
                                                className="searchResultItem"
                                                onClick={() => handleSelectRestaurant(restaurant)}>
                                                {restaurant.name}
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {searchInput && filteredRestaurants.length === 0 && (
                                    <div className="searchResult">
                                        <span className='noManager'>Can't find the restaurant?&nbsp;
                                            <span className='enterName' onClick={handleEnterRestaurant}>Add it</span>
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mission">
                {/* <span>
                    Our mission is to bring <span style={{fontWeight: 600}}>transparency</span> to restaurant workplaces by<br/>
                    empowering employees to <span style={{fontWeight: 600}}>share honest experiences</span> about management.<br/>
                    ManagerCheck gives restaurant workers the clarity they deserve before clocking in,<br/>
                    while also encouraging restaurants to <span style={{fontWeight: 600}}>build healthier cultures.</span>
                </span> */}
                <MissionSection />
            </div>
            
            <div className="bottom">
                <div className="anonBox">
                    <img src={pic1} alt="Restaurant workplace" className="boxImage" />
                    <span className='headerBox'>All reviews are anonymous</span>
                </div>
                <div className="topRestos">
                    <img src={waitress} alt="Restaurant staff" className="boxImage" />
                    <span>Find the best workplace</span>
                </div>
            </div>

            {showAddForm && (
                <>
                    <div className="modalOverlay" onClick={handleCancelAdd}></div>
                    <div className="addRestaurantModal">
                        <button className="modalCloseBtn" onClick={handleCancelAdd}>✕</button>
                        <div className="modalContent">
                            <h2>Add Restaurant</h2>
                            
                            <div className="modalInputGroup">
                                <label>Restaurant Name <span className="required">*</span></label>
                                <input
                                    type="text"
                                    value={newRestaurantName}
                                    onChange={(e) => setNewRestaurantName(e.target.value)}
                                    className="modalInput"
                                />
                            </div>

                            <div className="modalInputGroup">
                                <label>Address <span className="required">*</span></label>
                                <input
                                    type="text"
                                    value={newRestaurantAddress}
                                    onChange={(e) => setNewRestaurantAddress(e.target.value)}
                                    className="modalInput"
                                />
                            </div>

                            <div className="modalButtons">
                                <button onClick={handleAddRestaurant} className="modalAddBtn">Add Restaurant</button>
                                <button onClick={handleCancelAdd} className="modalCancelBtn">Cancel</button>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}

export default RestaurantLanding