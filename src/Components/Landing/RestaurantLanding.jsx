import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom';
import './RestaurantLanding.css';
import search from './../Assets/Search.png';
import logo from './../Assets/finalLogo.png';
import bg from './../Assets/background.png';
import waitress from './../Assets/waitress.png';
import pic from './../Assets/other.png';

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
    const [restaurantSelected, setRestaurantSelected] = useState(false);

    const handleSearch = (e) => {
        const searched = e.target.value;
        setSearchInput(searched);

        if (searched.trim() === ''){
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
        setRestaurantSelected(true);
        navigate(`/restaurant/${restaurant.id}`, { state: { restaurantName: restaurant.name } });
    };

    const handleEnterRestaurant = () => {
        setShowAddForm(true);
        setSearchInput('');
        setFilteredRestaurants([]);
    };

    const handleAddRestaurant = () => {
        if (newRestaurantName.trim() === '') {
            alert('Please enter the restaurant name');
            return;
        }
        if (newRestaurantAddress.trim() === '') {
            alert('Please enter the restaurant address');
            return;
        }

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
                    backgroundImage: `url(${bg})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat'
                }}></div>
                <div className="mainBackground">
                    <div className="main">
                        <div className="left">
                            <img src={logo} alt="Logo" className="webLogo" />
                        </div>
                        <div className="right">
                            <div className="searching">
                                <span>Search <i>your</i> restaurant</span>
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
                                        <span className='noManager'>Can't find the restaurant?
                                        <span className='enterName' onClick={handleEnterRestaurant}> Enter name</span></span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div className="bottom">
                <div className="anonBox">
                    <img src={pic} alt="Restaurant workplace" className="boxImage" />
                    <span className='header'>Anonymous reviews</span>
                    <div className="viewRatings">
                        <img src={search} alt="Search" className='searchIcon'/>
                        <input
                            type="text"
                            placeholder="View your ratings"
                            readOnly
                        />
                    </div>
                </div>
                <div className="topRestos">
                    <img src={waitress} alt="Restaurant staff" className="boxImage" />
                    <span>Find the <span className="underline">best</span> workplace</span>
                    <div className="findRestos">
                        <img src={search} alt="Search" className='searchIcon'/>
                        <input
                            type="text"
                            placeholder="View the top rated restaurants near you"
                            readOnly
                        />
                    </div>
                </div>
            </div>

            {/* Add Restaurant Modal */}
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
                                    placeholder=""
                                    value={newRestaurantName}
                                    onChange={(e) => setNewRestaurantName(e.target.value)}
                                    className="modalInput"
                                />
                            </div>

                            <div className="modalInputGroup">
                                <label>Address <span className="required">*</span></label>
                                <input
                                    type="text"
                                    placeholder=""
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