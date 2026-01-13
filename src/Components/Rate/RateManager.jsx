import React, { useEffect, useState } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import './RateManager.css'

const RateManager = () => {
  const { managerID } = useParams();
  const location = useLocation();
  const managerName = location.state?.managerName;
  const navigate = useNavigate();

  const [restaurantSearchInput, setRestaurantSearchInput] = useState('');
  const [managerSearchInput, setManagerSearchInput] = useState('');
  const [filteredRestaurants, setFilteredRestaurants] = useState([]);
  const [filteredManagers, setFilteredManagers] = useState([]);
  const [showManagerDropdown, setShowManagerDropdown] = useState(false);
  const [showRestaurantDropdown, setShowRestaurantDropdown] = useState(false);
  const [managerPlaceholder, setManagerPlaceholder] = useState(managerName || 'Manager Name');
  const [restaurantPlaceholder, setRestaurantPlaceholder] = useState('Barcelona Wine Bar');

  const goHome = () => {
    navigate('/');
  }

  const goToRatingForm = () => {
    navigate(`/rate/${managerID}/form`, { state: { managerName } });
  }

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

  const defaultRestaurants = [
    { id: 1, name: "Barcelona Wine Bar", location: "Boston, MA" },
    { id: 2, name: "Atlantic Fish Company", location: "Boston, MA" },
    { id: 3, name: "Borelli's Italian Restaurant", location: "Boston, MA" },
    { id: 4, name: "Chart House", location: "Boston, MA" },
    { id: 5, name: "Davio's Northern Italian Steakhouse", location: "Boston, MA" },
    { id: 6, name: "Empire Restaurant & Lounge", location: "Boston, MA" },
    { id: 7, name: "French Quarter", location: "Boston, MA" },
    { id: 8, name: "Grill 23 & Bar", location: "Boston, MA" },
    { id: 9, name: "Legal Sea Foods", location: "Boston, MA" },
    { id: 10, name: "Mama Maria", location: "Boston, MA" },
    { id: 11, name: "Mistral", location: "Boston, MA" },
    { id: 12, name: "Neptune Oyster", location: "Boston, MA" },
    { id: 13, name: "No. 9 Park", location: "Boston, MA" },
    { id: 14, name: "Oleana", location: "Boston, MA" },
    { id: 15, name: "The Capital Grille", location: "Boston, MA" },
    { id: 16, name: "The Salty Pig", location: "Boston, MA" },
    { id: 17, name: "Top of the Hub", location: "Boston, MA" },
    { id: 18, name: "Union Oyster House", location: "Boston, MA" }
  ];

  const [restaurants] = useState(() => {
    localStorage.setItem('restaurants', JSON.stringify(defaultRestaurants));
    return defaultRestaurants;
  });

  // Set restaurant placeholder based on current manager's restaurant
  useEffect(() => {
    const currentManager = managers.find(m => m.id === parseInt(managerID));
    if (currentManager && currentManager.restaurantName) {
      setRestaurantPlaceholder(currentManager.restaurantName);
    }
  }, [managerID, managers]);

  const handleRestaurantSearch = (e) => {
    const searched = e.target.value;
    setRestaurantSearchInput(searched);
    setShowRestaurantDropdown(false);

    if (searched.trim() === '') {
      setFilteredRestaurants([]);
      const currentManager = managers.find(m => m.id === parseInt(managerID));
      if (currentManager && currentManager.restaurantName) {
        setRestaurantPlaceholder(currentManager.restaurantName);
      }
    } else {
      const filtered = restaurants.filter(restaurant =>
        restaurant.name.toLowerCase().includes(searched.toLowerCase())
      ).sort((a, b) => a.name.localeCompare(b.name));
      setFilteredRestaurants(filtered);
    }
  };

  const handleClearRestaurantSearch = () => {
    const currentManager = managers.find(m => m.id === parseInt(managerID));
    const currentRestaurantName = currentManager?.restaurantName || 'Barcelona Wine Bar';
    
    if (showRestaurantDropdown) {
      // Second click - close dropdown and restore restaurant name
      setShowRestaurantDropdown(false);
      setFilteredRestaurants([]);
      setRestaurantSearchInput('');
      setRestaurantPlaceholder(currentRestaurantName);
    } else {
      // First click - show all restaurants
      setRestaurantSearchInput('');
      setRestaurantPlaceholder('Search for a restaurant');
      setShowRestaurantDropdown(true);
      const sortedRestaurants = [...restaurants].sort((a, b) => a.name.localeCompare(b.name));
      setFilteredRestaurants(sortedRestaurants);
    }
  };

  const handleManagerSearch = (e) => {
    const searched = e.target.value;
    setManagerSearchInput(searched);
    setShowManagerDropdown(false);

    if (searched.trim() === '') {
      setFilteredManagers([]);
      setManagerPlaceholder(managerName || 'Manager Name');
    } else {
      // Get current manager's restaurant ID
      const currentManager = managers.find(m => m.id === parseInt(managerID));
      const currentRestaurantId = currentManager?.restaurantId;
      
      // Filter managers by current restaurant AND search term
      const filtered = managers.filter(manager =>
        manager.restaurantId === currentRestaurantId &&
        manager.name.toLowerCase().includes(searched.toLowerCase())
      );
      setFilteredManagers(filtered);
    }
  };

  const handleClearManagerSearch = () => {
    if (showManagerDropdown) {
      setShowManagerDropdown(false);
      setFilteredManagers([]);
      setManagerSearchInput('');
      setManagerPlaceholder(managerName || 'Manager Name');
    } else {
      setManagerSearchInput('');
      setManagerPlaceholder('Search for a manager');
      setShowManagerDropdown(true);
      
      // Get current manager's restaurant ID
      const currentManager = managers.find(m => m.id === parseInt(managerID));
      const currentRestaurantId = currentManager?.restaurantId;
      
      // Only show managers from the same restaurant
      const restaurantManagers = managers.filter(m => m.restaurantId === currentRestaurantId)
        .sort((a, b) => a.name.localeCompare(b.name));
      setFilteredManagers(restaurantManagers);
    }
  };

  const handleSelectRestaurant = (restaurant) => {
    setRestaurantSearchInput('');
    setFilteredRestaurants([]);
    setShowRestaurantDropdown(false);
    const currentManager = managers.find(m => m.id === parseInt(managerID));
    if (currentManager && currentManager.restaurantName) {
      setRestaurantPlaceholder(currentManager.restaurantName);
    }
    navigate(`/restaurant/${restaurant.id}`, { state: { restaurantName: restaurant.name } });
  };

  const handleSelectManager = (manager) => {
    setManagerSearchInput('');
    setFilteredManagers([]);
    setShowManagerDropdown(false);
    setManagerPlaceholder(managerName || 'Manager Name');
    navigate(`/rate/${manager.id}`, { state: { managerName: manager.name } });
  };

  const [allRatings, setAllRatings] = useState(() => {
    const savedRatings = localStorage.getItem('managerRatings');
    if (savedRatings) {
      return JSON.parse(savedRatings);
    } else {
      return {
        '1': [
          {
            id: 1,
            communication: 5,
            fairness: 5,
            approachability: 5,
            organization: 5,
            wouldRecommend: true,
            comment: "Great manager! Very supportive and always available when you need help. Makes the work environment enjoyable.",
            date: "January 7, 2025",
            position: "Host",
            duration: "5 months",
            tags: ["Good Scheduling"]
          },
          {
            id: 2,
            communication: 4,
            fairness: 4,
            approachability: 4,
            organization: 4,
            wouldRecommend: true,
            comment: "Excellent leadership and communication skills. Fair with scheduling and always listens to concerns. Would definitely recommend working under this manager.",
            date: "January 6, 2025",
            position: "Server",
            duration: "2 years",
            tags: ["Good Scheduling"]
          },
          {
            id: 3,
            communication: 3,
            fairness: 2,
            approachability: 3,
            organization: 3,
            wouldRecommend: false,
            comment: "Could improve on fairness and organization. Sometimes plays favorites with scheduling.",
            date: "January 5, 2025",
            position: "Bartender",
            duration: "1 year",
            tags: ["Low Workload", "Good Pay"]
          },
          {
            id: 4,
            communication: 5,
            fairness: 4,
            approachability: 5,
            organization: 4,
            wouldRecommend: true,
            comment: "Very approachable and understanding. Easy to talk to about any issues or concerns.",
            date: "January 3, 2025",
            position: "Server",
            duration: "8 months",
            tags: ["Bad Scheduling"]
          },
          {
            id: 5,
            communication: 2,
            fairness: 3,
            approachability: 2,
            organization: 3,
            wouldRecommend: false,
            comment: "Lacks communication skills. Often doesn't relay important information to the team in a timely manner.",
            date: "December 28, 2024",
            position: "Host",
            duration: "4 months",
            tags: ["Low Workload"]
          }
        ],
        '2': [
          {
            id: 1,
            communication: 5,
            fairness: 5,
            approachability: 3,
            organization: 4,
            wouldRecommend: true,
            comment: "Excellent manager overall! Very organized and fair with everyone.",
            date: "January 5, 2025",
            position: "Host",
            duration: "3 months",
            tags: ["Good Pay"]
          }
        ]
      };
    }
  });

  useEffect(() => {
    localStorage.setItem('managerRatings', JSON.stringify(allRatings));
  }, [allRatings]);

  const existingRatings = allRatings[managerID] || [];

  const calAverage = (quality) => {
    if (existingRatings.length === 0) return 0;
    const sum = existingRatings.reduce((acc, rating) => acc + rating[quality], 0);
    return (sum / existingRatings.length).toFixed(1);
  };

  const overallRating = existingRatings.length > 0 ? (
    (parseFloat(calAverage('communication')) +
    parseFloat(calAverage('fairness')) + 
    parseFloat(calAverage('approachability')) +
    parseFloat(calAverage('organization'))) / 4
  ).toFixed(1) : 0;

  const getRatingDistribution = () => {
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    existingRatings.forEach(rating => {
      const avg = Math.round((rating.communication + rating.fairness + rating.approachability + rating.organization) / 4);
      distribution[avg]++;
    });
    return distribution;
  };

  const ratingDistribution = getRatingDistribution();
  const maxCount = Math.max(...Object.values(ratingDistribution));

  return (
    <div className='rateManagerPage'> 
      <div className="topBar">
        <div className="dualSearchBar">
          <div className="searchSection">
            <input 
              type="text" 
              placeholder={restaurantPlaceholder}
              value={restaurantSearchInput}
              onChange={handleRestaurantSearch}
              className="restaurantSearchInput"
            />
            {!restaurantSearchInput && (
              <button 
                className="clearButton"
                onClick={handleClearRestaurantSearch}
              >
                ✕
              </button>
            )}
            {(showRestaurantDropdown || (restaurantSearchInput && filteredRestaurants.length > 0)) && (
              <div className="searchDropdown">
                {filteredRestaurants.map((restaurant) => (
                  <div
                    key={restaurant.id}
                    className="searchDropdownItem"
                    onClick={() => handleSelectRestaurant(restaurant)}
                  >
                    {restaurant.name}
                  </div>
                ))}
              </div>
            )}
            {restaurantSearchInput && filteredRestaurants.length === 0 && (
              <div className="searchDropdown">
                <div className="noResults">No restaurants found</div>
              </div>
            )}
          </div>

          <div className="searchSection">
            <input 
              type="text" 
              placeholder={managerPlaceholder}
              value={managerSearchInput}
              onChange={handleManagerSearch}
              className="managerSearchInput"
            />
            {!managerSearchInput && (
              <button 
                className="clearButton"
                onClick={handleClearManagerSearch}
              >
                ✕
              </button>
            )}
            {(showManagerDropdown || (managerSearchInput && filteredManagers.length > 0)) && (
              <div className="searchDropdown">
                {filteredManagers.map((manager) => (
                  <div
                    key={manager.id}
                    className="searchDropdownItem"
                    onClick={() => handleSelectManager(manager)}
                  >
                    {manager.name}
                  </div>
                ))}
              </div>
            )}
            {managerSearchInput && filteredManagers.length === 0 && (
              <div className="searchDropdown">
                <div className="noResults">No managers found</div>
              </div>
            )}
          </div>
        </div>
        
        <button className="homeBtn" onClick={goHome}>Home</button>
      </div>

      <div className="header">
        <div className="managerInfo">
          <span className="managerName">{managerName}</span>
          <p className="resName">{managers.find(m => m.id === parseInt(managerID))?.restaurantName || 'Barcelona Wine Bar'}</p>
          <div className="stars">
            {[1, 2, 3].map((star) => (
              <span key={star} className="star filled">★</span>
            ))}
          </div>
        </div>

        <div className="ratingSummary">
          <div className="overallRating">
            <div className="rateNum">{overallRating}/5</div>
            <div className="rateLabel">Average Rating</div>
          </div>
          <div className="recoStats">
            <div className="recoNum">{existingRatings.length}</div>
            <div className="rateLabel">Total Reviews</div>
          </div>
          <button className="rateButton" onClick={goToRatingForm}>Rate the manager</button>
        </div>
      </div>

      <div className="contentContainer">
        <div className="leftSection">
          {/* Rating Distribution */}
          <div className="ratingDistribution">
            {[5, 4, 3, 2, 1].map((num) => (
              <div key={num} className="distributionRow">
                <span className="distNum">{num}</span>
                <div className="distBar">
                  <div 
                    className="distFill" 
                    style={{ width: maxCount > 0 ? `${(ratingDistribution[num] / maxCount) * 100}%` : '0%' }}
                  ></div>
                </div>
              </div>
            ))}
          </div>

          {/* Summary Tags */}
          <div className="summaryTags">
            <h3>Summary</h3>
            <div className="tags">
              <span className="tag">Low Workload</span>
              <span className="tag">Good Pay</span>
              <span className="tag">Bad Scheduling</span>
            </div>
          </div>
        </div>

        <div className="rightSection">
          {/* Reviews List */}
          <div className="reviewsList">
            {existingRatings.length === 0 ? (
              <div className="noReviews">
                <p>No reviews yet. Be the first to review {managerName}!</p>
              </div>
            ) : (
              existingRatings.map((rating) => (
                <div key={rating.id} className="reviewCard">
                  <div className="reviewHeader">
                    <div className="stars">
                      {[1, 2, 3, 4, 5].map((star) => {
                        const avgRating = Math.round((rating.communication + rating.fairness + rating.approachability + rating.organization) / 4);
                        return (
                          <span key={star} className={`star ${star <= avgRating ? 'filled' : ''}`}>★</span>
                        );
                      })}
                    </div>
                    <span className="reviewPosition">{rating.position}</span>
                    <span className="reviewDuration">{rating.duration}</span>
                  </div>
                  
                  <div className="reviewComment">
                    {rating.comment}
                  </div>
                  
                  <div className="reviewFooter">
                    {rating.tags && rating.tags.map((tag, index) => (
                      <span key={index} className="reviewTag">{tag}</span>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default RateManager