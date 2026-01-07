import React, { useState } from 'react'
import './Landing.css';
import logo from './../Assets/Logo.png';
import search from './../Assets/Search.png';

const Landing = () => {
    // track user input
    const [searchInput, setSearchInput] = useState('');
    // store all managers
    const [managers, setManagers] = useState([
        { id: 1, name: "Gab"},
        { id: 2, name: "Janelle"}
    ])
    // show add form
    const [showAddForm, setShowAddForm] = useState(false);
    // add form input
    const [newManagerName, setNewManagerName] = useState('');
    // managers that are searched
    const [filteredManagers, setFilteredManagers] = useState([]);

    // runs when user types in search bar
    const handleSearch = (e) => {
        // current input
        const searched = e.target.value;
        setSearchInput(searched);

        // if empty, clear dropdown
        if (searched.trim() === ''){
            setFilteredManagers([]);
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
        setSearchInput(manager.name);
        // close dropdown
        setFilteredManagers([]);
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
            />
        </div>
        </div>
    )
}

export default Landing
