import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom';
import './ManagerLanding.css';
import logo from './../Assets/Logo.png';
import search from './../Assets/Search.png';

const Landing = () => {
    const navigate = useNavigate();

    // track user input
    const [searchInput, setSearchInput] = useState('');

    // store all managers
    const [managers, setManagers] = useState(() => {
        const savedManagers = localStorage.getItem('managers');
        return savedManagers ? JSON.parse(savedManagers) : [
            { id: 1, name: "Gab"},
            { id: 2, name: "Janelle"}
        ];
    });

    // save to local storage
    useEffect(() => {
        localStorage.setItem('managers', JSON.stringify(managers));
    }, [managers]);
    
    // show add form
    const [showAddForm, setShowAddForm] = useState(false);
    // add form input
    const [newManagerName, setNewManagerName] = useState('');
    // managers that are searched
    const [filteredManagers, setFilteredManagers] = useState([]);
    // track selected manager
    const [managerSelected, setManagerSelected] = useState(false);

    // runs when user types in search bar
    const handleSearch = (e) => {
        // current input
        const searched = e.target.value;
        setSearchInput(searched);

        // if empty, clear dropdown
        if (searched.trim() === ''){
            setFilteredManagers([]);
            setShowAddForm(false);
            setNewManagerName('');
        } else {
            // filter managers
            const filtered = managers.filter(manager =>
                manager.name.toLowerCase().includes(searched.toLowerCase())
            );
            // update filtered managers in dropdown
            setFilteredManagers(filtered);
        }
    };

    // runs when user clicks manager
    const handleSelectManager = (manager) => {
        //console.log()
        // fill search bar
        setSearchInput('');
        // close dropdown
        setFilteredManagers([]);
        setManagerSelected(true);
        navigate(`/rate/${manager.id}`, { state: { managerName: manager.name } });
    };

    // runs when user clickes to enter name
    const handleEnterManager = () => {
        setShowAddForm(true);
    };

    // runs when user clicks add
    const handleAddManager = () => {
        // dont add if whitespace
        if (newManagerName.trim() === '') return;

        // new manager object
        const newManager = {
            id: managers.length + 1,
            name: newManagerName
        };

        // add to array
        setManagers([...managers, newManager]);
        navigate(`/rate/${newManager.id}`, { state: { managerName: newManager.name } });
        setNewManagerName('');
        setShowAddForm(false);
        setSearchInput('');
    };

    // runs when user clicks cancel
    const handleCancelAdd = () => {
        setShowAddForm(false);
        setNewManagerName('');
    };

    return (
        <div className='landing'>
            <div className="title">
                <img src={logo} alt="Logo" className='logo'/>
                <span className='webTitle font-medium'>Manager Check</span>
            </div>
            <span className='intro'> Rate your manager from <span className='font-medium'>Barcelona Wine Bar</span></span>
            <div className="searchRes">
                <img src={search} alt="Search" className='searchLogo'/>
                <input
                    type="text"
                    placeholder="Search for a manager"
                    className='searchBarMan'
                    value={searchInput}
                    onChange={handleSearch}
                />
                {/* dropdown */}
                {/* searching on bar and there's a filtered result */}
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

                {/* no managers matching */}
                {searchInput && filteredManagers.length === 0 && (
                    <div className="searchResult">
                        <span className='noManager'>Can't find the manager?
                        <span className='enterName font-medium' onClick={handleEnterManager}>Enter first name</span></span>
                    </div>
                )}

                {/* add form */}
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
    )
}

export default Landing
