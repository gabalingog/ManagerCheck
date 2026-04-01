import React, { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import emailjs from '@emailjs/browser';
import { supabase } from './../../supabaseClient';
import './RestaurantLanding.css';
import search from './../Assets/Search.png';
import logo from './../Assets/pic2-17.png';
import waitress from './../Assets/waitress.png';
import pic1 from './../Assets/pic1.png';
import pic3 from './../Assets/pic2-4.png';
import insta from './../Assets/favicon-3.png';
import linkedin from './../Assets/favicon-2.png';
import RestaurantMap, { MapButton } from './RestaurantMap';


const missionPhrases = [
    { highlight: "bring transparency", suffix: "to restaurants" },
    { highlight: "find honest", suffix: "employee experiences" },
    { highlight: "build healthier", suffix: "cultures at work" },
    { highlight: "support employees'", suffix: "perspectives" },
];

const MissionSection = ({ missionRef, missionVisible}) => {
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
        <div className="missionContent" ref={missionRef}>
            <div className={`missionEyebrow ${missionVisible ? 'visible' : ''}`}>
                Our Purpose
            </div>
            <div className={`missionHeadlineWrap ${missionVisible ? 'visible' : ''}`}>
                <span className="missionStatic">Our mission is to&nbsp;</span>
                <div className={`missionPhrase ${visible ? 'fadeIn' : 'fadeOut'}`}>
                    <span className="missionHighlight">{phrase.highlight} </span>
                    <span className="missionSuffix">{phrase.suffix}</span>
                </div>
            </div>
            <p className={`missionBody ${missionVisible ? 'visible' : ''}`}>
                Manager Check gives the service industry workers a trusted, anonymous space to share their experiences so the next person can make a more informed choice about their workplace.
            </p>
        </div>
    );
};

const RestaurantLanding = () => {
    const navigate = useNavigate();
    const [searchInput, setSearchInput] = useState('');
    const [restaurants, setRestaurants] = useState([]);
    const [filteredRestaurants, setFilteredRestaurants] = useState([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [dropdownRect, setDropdownRect] = useState(null);
    const searchingRef = useRef(null);
    const [footerForm, setFooterForm] = useState({ name: '', email: '', message: '' });
    const [footerStatus, setFooterStatus] = useState('');

    useEffect(() => {
        const fetchRestaurants = async () => {
            try {
                const { data, error } = await supabase
                    .from('restaurants')
                    .select('id, name, address, city, state, zip_code')
                    .order('name', { ascending: true });
                if (!error) setRestaurants(data || []);
                else console.error('Error fetching restaurants:', error);
            } catch (e) {
                console.error('Supabase error:', e);
            }
        };
        fetchRestaurants();
    }, []);

    const handleFooterSubmit = () => {
        if (!footerForm.name || !footerForm.email || !footerForm.message) {
            setFooterStatus('error');
            return;
        }
        setFooterStatus('sending');
        emailjs.send(
            'service_07btxgs',
            'template_efu5fg6',
            {
                name: footerForm.name,
                email: footerForm.email,
                message: footerForm.message,
            },
            '_E3xngYZfQHiORiDl'
        ).then(() => {
            setFooterStatus('sent');
            setFooterForm({ name: '', email: '', message: '' });
        }).catch((err) => {
            console.error('EmailJS error:', err);
            setFooterStatus('error');
        });
    };

    const [showAddForm, setShowAddForm] = useState(false);
    const [newRestaurantName, setNewRestaurantName] = useState('');
    const [newRestaurantAddress, setNewRestaurantAddress] = useState('');
    const [newRestaurantCity, setNewRestaurantCity] = useState('');
    const [newRestaurantState, setNewRestaurantState] = useState('');
    const [newRestaurantZip, setNewRestaurantZip] = useState('');

    const bottomRef = useRef(null);
    const [cardsVisible, setCardsVisible] = useState([false, false]);

    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    setCardsVisible([true, false]);
                    setTimeout(() => setCardsVisible([true, true]), 120);
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1 });
        if (bottomRef.current) observer.observe(bottomRef.current);
        return () => observer.disconnect();
    }, []);

    const missionRef = useRef(null);
    const [missionVisible, setMissionVisible] = useState(false);

    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    setMissionVisible(true);
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1 });
        if (missionRef.current) observer.observe(missionRef.current);
        return () => observer.disconnect();
    }, []);

    // Calculate the real page position of the search bar so the portal dropdown
    // lines up correctly regardless of any parent stacking context or transform.
    const updateDropdownRect = () => {
        if (searchingRef.current) {
            const rect = searchingRef.current.getBoundingClientRect();
            setDropdownRect({
                top: rect.bottom + window.scrollY + 4,
                left: rect.left + window.scrollX,
                width: rect.width,
            });
        }
    };

    const handleSearch = (e) => {
        const searched = e.target.value;
        setSearchInput(searched);
        if (searched.trim() === '') {
            setFilteredRestaurants([]);
            setShowDropdown(false);
        } else {
            const filtered = restaurants.filter(restaurant =>
                restaurant.name.toLowerCase().includes(searched.toLowerCase())
            );
            setFilteredRestaurants(filtered);
            updateDropdownRect();
            setShowDropdown(true);
        }
    };

    const handleSelectRestaurant = (e, restaurant) => {
        e.preventDefault(); // prevents blur firing before navigation
        setSearchInput('');
        setFilteredRestaurants([]);
        setShowDropdown(false);
        navigate(`/restaurant/${restaurant.id}`, { state: { restaurantName: restaurant.name } });
    };

    const handleEnterRestaurant = (e) => {
        e.preventDefault();
        setShowAddForm(true);
        setSearchInput('');
        setFilteredRestaurants([]);
        setShowDropdown(false);
    };

    const handleInputBlur = () => {
        setShowDropdown(false);
    };

    const handleInputFocus = () => {
        if (searchInput.trim() && filteredRestaurants.length > 0) {
            updateDropdownRect();
            setShowDropdown(true);
        }
    };

    const handleAddRestaurant = async () => {
        if (!newRestaurantName.trim()) return;
        if (!newRestaurantAddress.trim()) return;
        if (!newRestaurantCity.trim()) return;
        if (!newRestaurantState) return;
        if (!newRestaurantZip.trim()) return;

        const { data, error } = await supabase
            .from('restaurants')
            .insert([{
                name: newRestaurantName.trim(),
                address: newRestaurantAddress.trim(),
                city: newRestaurantCity.trim(),
                state: newRestaurantState,
                zip_code: newRestaurantZip.trim(),
            }])
            .select()
            .single();

        if (error) {
            console.error('Error adding restaurant:', error);
            return;
        }

        setRestaurants(prev => [...prev, data]);
        navigate(`/restaurant/${data.id}`, { state: { restaurantName: data.name } });
        setNewRestaurantName('');
        setNewRestaurantAddress('');
        setNewRestaurantCity('');
        setNewRestaurantState('');
        setNewRestaurantZip('');
        setShowAddForm(false);
    };

    const handleCancelAdd = () => {
        setShowAddForm(false);
        setNewRestaurantName('');
        setNewRestaurantAddress('');
        setNewRestaurantCity('');
        setNewRestaurantState('');
        setNewRestaurantZip('');
    };

    const getDisplayAddress = (restaurant) => {
        if (restaurant.city && restaurant.state && restaurant.zip_code) {
            return restaurant.address;
        }
        return restaurant.address || '';
    };

    // Rendered via createPortal into document.body so it is never clipped or
    // blocked by any parent stacking context, overflow, or z-index boundary.
    const PortalDropdown = () => {
        if (!showDropdown || !searchInput || !dropdownRect) return null;

        const style = {
            position: 'absolute',
            top: dropdownRect.top,
            left: dropdownRect.left,
            width: dropdownRect.width,
            background: 'var(--warm-white, #faf8f4)',
            border: '1px solid rgba(60, 45, 20, 0.16)',
            borderRadius: '6px',
            maxHeight: '150px',
            overflowY: 'auto',
            zIndex: 99999,
            textAlign: 'left',
            boxShadow: '0 12px 40px rgba(30, 26, 20, 0.14)',
            fontFamily: "'DM Sans', sans-serif",
        };

        return createPortal(
            <div style={style}>
                {filteredRestaurants.length > 0
                    ? filteredRestaurants.map((restaurant) => (
                        <div
                            key={restaurant.id}
                            className="searchResultItem"
                            onMouseDown={(e) => handleSelectRestaurant(e, restaurant)}
                        >
                            <span className="searchResultName">{restaurant.name}</span>
                            <span className="searchResultAddress">{getDisplayAddress(restaurant)}</span>
                        </div>
                    ))
                    : (
                        <span className='noManager'>
                            Can't find the restaurant?&nbsp;
                            <span
                                className='enterName'
                                onMouseDown={handleEnterRestaurant}
                            >Add it</span>
                        </span>
                    )
                }
            </div>,
            document.body
        );
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
                <div className="left heroFadeUp" style={{ animationDelay: '0.2s', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <img src={logo} alt="ManagerCheck" className='webLogo' />
                    <MapButton />
                </div>
                    <p className="heroTagline heroFadeUp" style={{ animationDelay: '0.5s' }}>
                        Know who you're working for before you start
                    </p>
                        <div className="right heroFadeUp" style={{ animationDelay: '0.75s' }}>
                            {/* ref on .searching so we can measure its position for the portal */}
                            <div className="searching" ref={searchingRef}>
                                <div className="searchRes">
                                    <img src={search} alt="Search" className='searchLogo'/>
                                    <input
                                        type="text"
                                        placeholder="Search for a restaurant"
                                        className='searchBarMan'
                                        value={searchInput}
                                        onChange={handleSearch}
                                        onBlur={handleInputBlur}
                                        onFocus={handleInputFocus}
                                    />
                                </div>
                                {/* Dropdown teleports to document.body via portal */}
                                <PortalDropdown />
                            </div>
                        </div>
                    </div>
                    <div className="heroScroll heroFadeUp" style={{ animationDelay: '1.3s' }}>
                        <span>Scroll</span>
                        <div className="heroScrollLine"></div>
                    </div>
                </div>
            </div>

            <div className="mission">
                <MissionSection 
                    missionRef={missionRef} 
                    missionVisible={missionVisible}
                />
            </div>

            <div className="bottom" ref={bottomRef}>
                <div className={`anonBox featureCard ${cardsVisible[0] ? 'cardVisible' : ''}`}>
                    <img src={pic1} alt="Restaurant workplace" className="boxImage" />
                    <div className="cardContent">
                        <span className='headerBox'>All reviews are anonymous</span>
                        <p className='cardDesc'>Your name is never stored with your review. Speak freely about your past experiences with a restaurant or manager. This also helps the experiences of others in finding a workplace.</p>
                    </div>
                </div>
                <div className={`topRestos featureCard ${cardsVisible[1] ? 'cardVisible' : ''}`}>
                    <img src={waitress} alt="Restaurant staff" className="boxImage" />
                    <div className="cardContent">
                        <span className='headerBox'>Find the best workplace</span>
                        <p className='cardDesc'>Browse any restaurant, see all its managers, and read worker-focused reviews on the management. Prioritize your work experience and choose your future restaurant wisely.</p>
                    </div>
                </div>
            </div>

            <footer className="footer">
                <div className="footerInner">
                    <div className="footerContact">
                        <span className="footerEyebrow">Contact Us</span>
                        <p className="footerSub">Have a question or want to share feedback? We read every message.</p>
                        <div className="socials">
                            <a href="https://www.linkedin.com/company/managercheck/" target="_blank" rel="noopener noreferrer">
                                <img src={linkedin} alt="LinkedIn" className='social1'/>
                            </a>
                            <a href="https://www.instagram.com/managercheckwebsite/" target="_blank" rel="noopener noreferrer">
                                <img src={insta} alt="Instagram" className='social2'/>
                            </a>
                        </div>
                        <span className="footerEyebrow">hello@managercheck.org</span>
                        <span></span>
                        <button
                            className="footerSubmitBtn"
                            onClick={handleFooterSubmit}
                            disabled={footerStatus === 'sending'}
                        >
                            {footerStatus === 'sending' ? 'Sending...' : 'Send Message'}
                        </button>
                        {footerStatus === 'sent' && <p className="footerStatusMsg footerStatusSuccess">Message sent!</p>}
                        {footerStatus === 'error' && <p className="footerStatusMsg footerStatusError">Please fill in all fields and try again.</p>}
                    </div>
                    <div className="footerForm">
                        <div className="footerInputRow">
                            <div className="footerInputGroup">
                                <label>Name</label>
                                <input
                                    type="text"
                                    placeholder="Your name"
                                    className="footerInput"
                                    value={footerForm.name}
                                    onChange={(e) => setFooterForm({ ...footerForm, name: e.target.value })}
                                />
                            </div>
                            <div className="footerInputGroup">
                                <label>Email</label>
                                <input
                                    type="email"
                                    placeholder="your@email.com"
                                    className="footerInput"
                                    value={footerForm.email}
                                    onChange={(e) => setFooterForm({ ...footerForm, email: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="footerInputGroup">
                            <label>Message</label>
                            <textarea
                                placeholder="What's on your mind?"
                                className="footerInput footerTextarea"
                                rows={4}
                                value={footerForm.message}
                                onChange={(e) => setFooterForm({ ...footerForm, message: e.target.value })}
                            />
                        </div>
                    </div>
                </div>
            </footer>

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
                                    style={{ borderBottom: '1.5px solid #2a7a4b' }}
                                    value={newRestaurantName}
                                    onChange={(e) => setNewRestaurantName(e.target.value)}
                                    className="modalInput"
                                />
                            </div>
                            <div className="modalInputGroup">
                                <label>Street Address <span className="required">*</span></label>
                                <input
                                    type="text"
                                    style={{ borderBottom: '1.5px solid #2a7a4b' }}
                                    value={newRestaurantAddress}
                                    onChange={(e) => setNewRestaurantAddress(e.target.value)}
                                    className="modalInput"
                                />
                            </div>
                            <div className="modalInputRow">
                                <div className="modalInputGroup">
                                    <label>City <span className="required">*</span></label>
                                    <input
                                        type="text"
                                        style={{ borderBottom: '1.5px solid #2a7a4b' }}
                                        value={newRestaurantCity}
                                        onChange={(e) => setNewRestaurantCity(e.target.value)}
                                        className="modalInput"
                                    />
                                </div>
                                <div className="modalInputGroup modalInputGroupSm">
                                    <label>State <span className="required">*</span></label>
                                    <select
                                        value={newRestaurantState}
                                        style={{ borderBottom: '1.5px solid #2a7a4b' }}
                                        onChange={(e) => setNewRestaurantState(e.target.value)}
                                        className="modalInput modalSelect"
                                    >
                                        <option value="">—</option>
                                        {["AL","AK","AZ","AR","CA","CO","CT","DC", "DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY"].map(s => (
                                            <option key={s} value={s}>{s}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="modalInputGroup modalInputGroupSm">
                                    <label>ZIP <span className="required">*</span></label>
                                    <input
                                        type="text"
                                        style={{ borderBottom: '1.5px solid #2a7a4b' }}
                                        maxLength={5}
                                        value={newRestaurantZip}
                                        onChange={(e) => setNewRestaurantZip(e.target.value)}
                                        className="modalInput"
                                    />
                                </div>
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
    );
};

export default RestaurantLanding;