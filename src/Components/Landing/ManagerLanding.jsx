import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom';
import './ManagerLanding.css';
import search from './../Assets/Search.png';

const Landing = () => {
    const navigate = useNavigate();
    const [searchInput, setSearchInput] = useState('');
    const [managers, setManagers] = useState(() => {
        const savedManagers = localStorage.getItem('managers');
        if (savedManagers) {
            return JSON.parse(savedManagers);
        } else {
            const defaultManagers = [
                { id: 1, name: "Gab", restaurantId: 1, restaurantName: "Barcelona Wine Bar" },
                { id: 2, name: "Janelle", restaurantId: 2, restaurantName: "Atlantic Fish Company" }
            ];
            localStorage.setItem('managers', JSON.stringify(defaultManagers));
            return defaultManagers;
        }
    });

    useEffect(() => {
        localStorage.setItem('managers', JSON.stringify(managers));
    }, [managers]);
    
    const [showAddForm, setShowAddForm] = useState(false);
    const [newManagerName, setNewManagerName] = useState('');
    const [filteredManagers, setFilteredManagers] = useState([]);
    const [managerSelected, setManagerSelected] = useState(false);

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
        setManagerSelected(true);
        navigate(`/rate/${manager.id}`, { state: { managerName: manager.name } });
    };

    const handleEnterManager = () => {
        setShowAddForm(true);
    };

    const handleAddManager = () => {
        if (newManagerName.trim() === '') return;

        const newManager = {
            id: managers.length + 1,
            name: newManagerName,
            restaurantId: 1,
            restaurantName: "Barcelona Wine Bar"
        };

        setManagers([...managers, newManager]);
        navigate(`/rate/${newManager.id}`, { state: { managerName: newManager.name } });
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