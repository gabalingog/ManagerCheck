import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import './ManagerLanding.css';
import search from './../Assets/Search.png';

const Landing = () => {
    const navigate = useNavigate();
    const [searchInput, setSearchInput] = useState('');
    const [managers, setManagers] = useState([]);
    const [showAddForm, setShowAddForm] = useState(false);
    const [newManagerName, setNewManagerName] = useState('');
    const [filteredManagers, setFilteredManagers] = useState([]);

    // Fetch managers from Supabase
    useEffect(() => {
        fetchManagers();
    }, []);

    const fetchManagers = async () => {
        const { data, error } = await supabase
            .from('managers')
            .select(`
                id,
                name,
                position,
                restaurant_id,
                restaurants (
                    name
                )
            `);

        if (error) {
            console.error('Error fetching managers:', error);
        } else {
            // Format data to match expected structure
            const formattedManagers = data.map(m => ({
                id: m.id,
                name: m.name,
                restaurantId: m.restaurant_id,
                restaurantName: m.restaurants?.name || 'Unknown Restaurant'
            }));
            setManagers(formattedManagers);
        }
    };

    const handleSearch = (e) => {
        const searched = e.target.value;
        setSearchInput(searched);

        if (searched.trim() === ''){
            setFilteredManagers([]);
            setShowAddForm(false);
            setNewManagerName('');
        } else {
            const filtered = managers.filter(manager =>
                manager.name.toLowerCase().includes(searched.toLowerCase())
            );
            setFilteredManagers(filtered);
        }
    };

    const handleSelectManager = (manager) => {
        setSearchInput('');
        setFilteredManagers([]);
        navigate(`/rate/${manager.id}`, { state: { managerName: manager.name } });
    };

    const handleEnterManager = () => {
        setShowAddForm(true);
    };

    const handleAddManager = async () => {
        if (newManagerName.trim() === '') return;

        // For now, add to default restaurant (id: 1)
        // You can make this more sophisticated later
        const { data, error } = await supabase
            .from('managers')
            .insert([
                {
                    name: newManagerName.trim(),
                    position: 'Manager',
                    restaurant_id: 1 // Default restaurant
                }
            ])
            .select()
            .single();

        if (error) {
            console.error('Error adding manager:', error);
            alert('Error adding manager. Please make sure a restaurant exists first.');
            return;
        }

        // Navigate to new manager's page
        navigate(`/rate/${data.id}`, { state: { managerName: data.name } });
        
        // Refresh managers list
        fetchManagers();
        
        setNewManagerName('');
        setShowAddForm(false);
        setSearchInput('');
    };

    const handleCancelAdd = () => {
        setShowAddForm(false);
        setNewManagerName('');
    };

    return (
        <div className='landing'>
            <div className="bgmain">
                <div className="main">
                    <div className="left">
                        <span className='title'>Manager<br />Check</span>
                    </div>
                    <div className="right">
                        <div className="searching">
                            <span>Rate <i>your</i> manager</span>
                            <div className="searchRes">
                                <img src={search} alt="Search" className='searchLogo'/>
                                <input
                                    type="text"
                                    placeholder="Search for a manager"
                                    className='searchBarMan'
                                    value={searchInput}
                                    onChange={handleSearch}
                                />
                            </div>
                            
                            {searchInput && filteredManagers.length > 0 && (
                                <div className="searchResult">
                                    {filteredManagers.map((manager) => (
                                        <div
                                            key={manager.id}
                                            className="searchResultItem"
                                            onClick={() => handleSelectManager(manager)}>
                                            {manager.name}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {searchInput && filteredManagers.length === 0 && (
                                <div className="searchResult">
                                    <span className='noManager'>Can't find the manager?
                                    <span className='enterName' onClick={handleEnterManager}> Enter first name</span></span>
                                </div>
                            )}

                            {showAddForm && (
                                <div className="addManagerForm">
                                    <input
                                        type="text"
                                        placeholder="Enter manager's first name"
                                        className='addManagerInput'
                                        value={newManagerName}
                                        onChange={(e) => setNewManagerName(e.target.value)}
                                    />
                                    <div className="formButtons">
                                        <button onClick={handleAddManager} className='addButton'>Add</button>
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

export default Landing