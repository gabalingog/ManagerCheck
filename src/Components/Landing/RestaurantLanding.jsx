import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import './RestaurantLanding.css';
import search from './../Assets/Search.png';

const RestaurantLanding = () => {
    const navigate = useNavigate();
    const [searchInput, setSearchInput] = useState('');
    const [restaurants, setRestaurants] = useState([]);
    const [showAddForm, setShowAddForm] = useState(false);
    const [newRestaurantName, setNewRestaurantName] = useState('');
    const [newRestaurantAddress, setNewRestaurantAddress] = useState('');
    const [filteredRestaurants, setFilteredRestaurants] = useState([]);

    // Fetch restaurants from Supabase
    useEffect(() => {
        fetchRestaurants();
    }, []);

    const fetchRestaurants = async () => {
        const { data, error } = await supabase
            .from('restaurants')
            .select('*')
            .order('name');

        if (error) {
            console.error('Error fetching restaurants:', error);
        } else {
            setRestaurants(data || []);
        }
    };

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
        navigate(`/restaurant/${restaurant.id}`, { state: { restaurantName: restaurant.name } });
    };

    const handleEnterRestaurant = () => {
        setShowAddForm(true);
        setSearchInput('');
        setFilteredRestaurants([]);
    };

    const handleAddRestaurant = async () => {
        if (newRestaurantName.trim() === '') {
            alert('Please enter the restaurant name');
            return;
        }
        if (newRestaurantAddress.trim() === '') {
            alert('Please enter the restaurant address');
            return;
        }

        const { data, error } = await supabase
            .from('restaurants')
            .insert([
                {
                    name: newRestaurantName.trim(),
                    address: newRestaurantAddress.trim(),
                    location: 'Boston, MA' // Default location
                }
            ])
            .select()
            .single();

        if (error) {
            console.error('Error adding restaurant:', error);
            alert('Error adding restaurant: ' + error.message);
            return;
        }

        // Navigate to new restaurant's page
        navigate(`/restaurant/${data.id}`, { state: { restaurantName: data.name } });
        
        // Refresh restaurants list
        fetchRestaurants();
        
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