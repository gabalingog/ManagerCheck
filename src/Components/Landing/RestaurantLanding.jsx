import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom';
import './RestaurantLanding.css';
import search from './../Assets/Search.png';

const RestaurantLanding = () => {
    const navigate = useNavigate();
    const [searchInput, setSearchInput] = useState('');
    const [restaurants, setRestaurants] = useState(() => {
        const savedRestaurants = localStorage.getItem('restaurants');
        return savedRestaurants ? JSON.parse(savedRestaurants) : [
            { id: 1, name: "Barcelona Wine Bar"},
            { id: 2, name: "Olive Garden"}
        ];
    });

    useEffect(() => {
        localStorage.setItem('restaurants', JSON.stringify(restaurants));
    }, [restaurants]);
    
    const [showAddForm, setShowAddForm] = useState(false);
    const [newRestaurantName, setNewRestaurantName] = useState('');
    const [filteredRestaurants, setFilteredRestaurants] = useState([]);
    const [restaurantSelected, setRestaurantSelected] = useState(false);

    const handleSearch = (e) => {
        const searched = e.target.value;
        setSearchInput(searched);

        if (searched.trim() === ''){
            setFilteredRestaurants([]);
            setShowAddForm(false);
            setNewRestaurantName('');
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
    };

    const handleAddRestaurant = () => {
        if (newRestaurantName.trim() === '') return;

        const newRestaurant = {
            id: restaurants.length + 1,
            name: newRestaurantName
        };

        setRestaurants([...restaurants, newRestaurant]);
        navigate(`/restaurant/${newRestaurant.id}`, { state: { restaurantName: newRestaurant.name } });
        setNewRestaurantName('');
        setShowAddForm(false);
        setSearchInput('');
    };

    const handleCancelAdd = () => {
        setShowAddForm(false);
        setNewRestaurantName('');
    };

    return (
        <div className='restoLanding'>
            <div className="bgmain">
                <div className="main">
                    <div className="left">
                        <span className='title'>Manager<br />Check</span>
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

                            {showAddForm && (
                                <div className="addManagerForm">
                                    <input
                                        type="text"
                                        placeholder="Enter restaurant name"
                                        className='addManagerInput'
                                        value={newRestaurantName}
                                        onChange={(e) => setNewRestaurantName(e.target.value)}
                                    />
                                    <div className="formButtons">
                                        <button onClick={handleAddRestaurant} className='addButton'>Add</button>
                                        <button onClick={handleCancelAdd} className='cancelButton'>Cancel</button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            
            <div className="bottom">
                <div className="anonBox">
                    <span className='header'>Anonymous reviews</span>
                    <button className="viewRatings">View your ratings</button>
                </div>
                <div className="topRestos">
                    <span>Find the <span className="underline">best</span> workplace</span>
                    <button className="findRestos">View the top rated restaurants near you</button>
                </div>
            </div>
        </div>
    )
}

export default RestaurantLanding