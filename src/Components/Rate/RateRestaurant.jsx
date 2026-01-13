import React, { useEffect, useState } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import './RateRestaurant.css'

const RateRestaurant = () => {
  const { restaurantID } = useParams();
  const location = useLocation();
  const restaurantName = location.state?.restaurantName;
  const navigate = useNavigate();

  const [managerSearchInput, setManagerSearchInput] = useState('');
  const [restaurantSearchInput, setRestaurantSearchInput] = useState('');
  const [filteredManagers, setFilteredManagers] = useState([]);
  const [filteredRestaurants, setFilteredRestaurants] = useState([]);
  const [showRestaurantDropdown, setShowRestaurantDropdown] = useState(false);
  const [restaurantPlaceholder, setRestaurantPlaceholder] = useState('Barcelona Wine Bar');
  const [showAddManagerForm, setShowAddManagerForm] = useState(false);
  const [newManagerName, setNewManagerName] = useState('');
  const [newManagerPosition, setNewManagerPosition] = useState('');
  const [reviewFilter, setReviewFilter] = useState('recent'); // 'recent' or 'top'
  const [ratingFilter, setRatingFilter] = useState(null); // null or 1-5
  const [userVotes, setUserVotes] = useState(() => {
    const saved = localStorage.getItem('userVotes_restaurant_' + restaurantID);
    return saved ? JSON.parse(saved) : {};
  });
  
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

  // Force initialize with all 18 restaurants
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
    // Always use the default 18 restaurants and update localStorage
    localStorage.setItem('restaurants', JSON.stringify(defaultRestaurants));
    return defaultRestaurants;
  });

  const goHome = () => {
    navigate('/');
  }

  const goToRatingForm = () => {
    navigate(`/restaurant/${restaurantID}/form`, { state: { restaurantName } });
  }

  const handleManagerSearch = (e) => {
    const searched = e.target.value;
    setManagerSearchInput(searched);
    setShowAddManagerForm(false);

    if (searched.trim() === '') {
      setFilteredManagers([]);
    } else {
      // Filter managers by current restaurant ID AND search term
      const filtered = managers.filter(manager =>
        manager.restaurantId === parseInt(restaurantID) &&
        manager.name.toLowerCase().includes(searched.toLowerCase())
      );
      setFilteredManagers(filtered);
    }
  };

  const handleEnterManager = () => {
    setShowAddManagerForm(true);
  };

  const handleAddManager = () => {
    if (newManagerName.trim() === '') {
      alert('Please enter the manager\'s first name');
      return;
    }
    if (newManagerPosition.trim() === '') {
      alert('Please enter the manager\'s position');
      return;
    }

    const savedManagers = localStorage.getItem('managers');
    const currentManagers = savedManagers ? JSON.parse(savedManagers) : [];
    
    const newManager = {
      id: currentManagers.length > 0 ? Math.max(...currentManagers.map(m => m.id)) + 1 : 1,
      name: newManagerName.trim(),
      position: newManagerPosition.trim(),
      restaurantId: parseInt(restaurantID),
      restaurantName: restaurantName
    };

    const updatedManagers = [...currentManagers, newManager];
    localStorage.setItem('managers', JSON.stringify(updatedManagers));
    
    // Navigate to the new manager's page
    navigate(`/rate/${newManager.id}`, { state: { managerName: newManager.name } });
  };

  const handleCancelAdd = () => {
    setShowAddManagerForm(false);
    setNewManagerName('');
    setNewManagerPosition('');
  };

  const handleVote = (reviewId, voteType) => {
    const currentVote = userVotes[reviewId];
    let newVote = null;

    // Toggle logic: if clicking the same vote, remove it
    if (currentVote === voteType) {
      newVote = null;
    } else {
      newVote = voteType;
    }

    // Update user votes
    const newUserVotes = {
      ...userVotes,
      [reviewId]: newVote
    };
    setUserVotes(newUserVotes);
    localStorage.setItem('userVotes_restaurant_' + restaurantID, JSON.stringify(newUserVotes));

    // Update the ratings in localStorage
    const savedRatings = localStorage.getItem('restaurantRatings');
    if (savedRatings) {
      const allRatings = JSON.parse(savedRatings);
      const restaurantRatings = allRatings[restaurantID] || [];
      
      const updatedRatings = restaurantRatings.map(rating => {
        if (rating.id === reviewId) {
          const updatedRating = { ...rating };
          
          // Adjust counts based on vote change
          if (currentVote === 'like' && newVote === null) {
            updatedRating.likes = Math.max(0, (updatedRating.likes || 0) - 1);
          } else if (currentVote === 'like' && newVote === 'dislike') {
            updatedRating.likes = Math.max(0, (updatedRating.likes || 0) - 1);
            updatedRating.dislikes = (updatedRating.dislikes || 0) + 1;
          } else if (currentVote === 'dislike' && newVote === null) {
            updatedRating.dislikes = Math.max(0, (updatedRating.dislikes || 0) - 1);
          } else if (currentVote === 'dislike' && newVote === 'like') {
            updatedRating.dislikes = Math.max(0, (updatedRating.dislikes || 0) - 1);
            updatedRating.likes = (updatedRating.likes || 0) + 1;
          } else if (currentVote === null && newVote === 'like') {
            updatedRating.likes = (updatedRating.likes || 0) + 1;
          } else if (currentVote === null && newVote === 'dislike') {
            updatedRating.dislikes = (updatedRating.dislikes || 0) + 1;
          }
          
          return updatedRating;
        }
        return rating;
      });
      
      allRatings[restaurantID] = updatedRatings;
      localStorage.setItem('restaurantRatings', JSON.stringify(allRatings));
      setAllRatings(allRatings);
    }
  };

  const handleRestaurantSearch = (e) => {
    const searched = e.target.value;
    setRestaurantSearchInput(searched);
    setShowRestaurantDropdown(false);

    if (searched.trim() === '') {
      setFilteredRestaurants([]);
      setRestaurantPlaceholder('Barcelona Wine Bar'); // Reset placeholder when search is cleared
    } else {
      const filtered = restaurants.filter(restaurant =>
        restaurant.name.toLowerCase().includes(searched.toLowerCase())
      ).sort((a, b) => a.name.localeCompare(b.name));
      setFilteredRestaurants(filtered);
    }
  };

  const handleClearRestaurantSearch = () => {
    if (showRestaurantDropdown) {
      // If dropdown is already showing, hide it
      setShowRestaurantDropdown(false);
      setFilteredRestaurants([]);
      setRestaurantSearchInput('');
      setRestaurantPlaceholder('Barcelona Wine Bar');
    } else {
      // If dropdown is not showing, show it with all restaurants
      setRestaurantSearchInput('');
      setRestaurantPlaceholder('Search for a restaurant');
      setShowRestaurantDropdown(true);
      const sortedRestaurants = [...restaurants].sort((a, b) => a.name.localeCompare(b.name));
      setFilteredRestaurants(sortedRestaurants);
    }
  };

  const handleSelectManager = (manager) => {
    setManagerSearchInput('');
    setFilteredManagers([]);
    navigate(`/rate/${manager.id}`, { state: { managerName: manager.name } });
  };

  const handleSelectRestaurant = (restaurant) => {
    setRestaurantSearchInput('');
    setFilteredRestaurants([]);
    setShowRestaurantDropdown(false);
    setRestaurantPlaceholder('Barcelona Wine Bar'); // Reset placeholder when restaurant is selected
    navigate(`/restaurant/${restaurant.id}`, { state: { restaurantName: restaurant.name } });
  };

  const [allRatings, setAllRatings] = useState(() => {
    // Force refresh with correct data structure
    const defaultRatings = {
      '1': [
        {
          id: 1,
          teamEnvironment: 5,
          shiftAvailability: 5,
          pay: 5,
          staffWorkloadRatio: 5,
          wouldRecommend: true,
          comment: "Amazing place to work! The team is incredibly supportive and management actually cares about work-life balance. Tips are great and shifts are flexible.",
          date: "January 7, 2025",
          position: "Server",
          duration: "2 years",
          tags: ["Good Pay", "Good Management"],
          likes: 9,
          dislikes: 1
        },
        {
          id: 2,
          teamEnvironment: 4,
          shiftAvailability: 4,
          pay: 4,
          staffWorkloadRatio: 4,
          wouldRecommend: true,
          comment: "Solid workplace with a positive team culture. Good tips and reasonable scheduling. Would recommend to others looking for restaurant work.",
          date: "January 6, 2025",
          position: "Bartender",
          duration: "1 year",
          tags: ["Good Management", "Good Scheduling"],
          likes: 7,
          dislikes: 2
        },
        {
          id: 3,
          teamEnvironment: 3,
          shiftAvailability: 2,
          pay: 3,
          staffWorkloadRatio: 3,
          wouldRecommend: false,
          comment: "Management could be better organized. Often understaffed during busy shifts which makes the work stressful. Pay is just okay.",
          date: "January 5, 2025",
          position: "Host",
          duration: "6 months",
          tags: ["Low Pay", "Bad Scheduling"],
          likes: 4,
          dislikes: 5
        },
        {
          id: 4,
          teamEnvironment: 5,
          shiftAvailability: 4,
          pay: 5,
          staffWorkloadRatio: 4,
          wouldRecommend: true,
          comment: "Great restaurant with excellent team dynamics. Everyone helps each other out and the pay is competitive. Management is fair and listens to concerns.",
          date: "January 3, 2025",
          position: "Server",
          duration: "8 months",
          tags: ["Good Management", "Good Pay"],
          likes: 8,
          dislikes: 1
        },
        {
          id: 5,
          teamEnvironment: 2,
          shiftAvailability: 3,
          pay: 2,
          staffWorkloadRatio: 3,
          wouldRecommend: false,
          comment: "High turnover and poor communication from management. The team environment suffers because of constant new hires. Pay is below average for the area.",
          date: "December 28, 2024",
          position: "Server",
          duration: "4 months",
          tags: ["Bad Scheduling", "Low Pay"],
          likes: 3,
          dislikes: 6
        }
      ],
      '2': [
        {
          id: 1,
          teamEnvironment: 5,
          shiftAvailability: 5,
          pay: 3,
          staffWorkloadRatio: 4,
          wouldRecommend: true,
          comment: "Excellent team atmosphere! Everyone is friendly and helpful. Management values employee input and makes scheduling easy.",
          date: "January 5, 2025",
          position: "Bartender",
          duration: "3 months",
          tags: ["Good Management", "Good Scheduling"],
          likes: 6,
          dislikes: 0
        }
      ]
    };
    
    localStorage.setItem('restaurantRatings', JSON.stringify(defaultRatings));
    return defaultRatings;
  });

  useEffect(() => {
    localStorage.setItem('restaurantRatings', JSON.stringify(allRatings));
  }, [allRatings]);

  const existingRatings = allRatings[restaurantID] || [];

  const calAverage = (quality) => {
    if (existingRatings.length === 0) return 0;
    const sum = existingRatings.reduce((acc, rating) => acc + rating[quality], 0);
    return (sum / existingRatings.length).toFixed(1);
  };

  const overallRating = existingRatings.length > 0 ? (
    (parseFloat(calAverage('teamEnvironment')) +
    parseFloat(calAverage('shiftAvailability')) + 
    parseFloat(calAverage('pay')) +
    parseFloat(calAverage('staffWorkloadRatio'))) / 4
  ).toFixed(1) : 0;

  const getRatingDistribution = () => {
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    existingRatings.forEach(rating => {
      const avg = Math.round((rating.teamEnvironment + rating.shiftAvailability + rating.pay + rating.staffWorkloadRatio) / 4);
      distribution[avg]++;
    });
    return distribution;
  };

  const ratingDistribution = getRatingDistribution();
  const maxCount = Math.max(...Object.values(ratingDistribution));

  const getSortedReviews = () => {
    let reviews = [...existingRatings];
    
    // Filter by rating if selected
    if (ratingFilter !== null) {
      reviews = reviews.filter(rating => {
        const avg = Math.round((rating.teamEnvironment + rating.shiftAvailability + rating.pay + rating.staffWorkloadRatio) / 4);
        return avg === ratingFilter;
      });
    }
    
    // Sort by filter type
    if (reviewFilter === 'top') {
      // Sort by net likes (likes - dislikes)
      return reviews.sort((a, b) => {
        const netA = (a.likes || 0) - (a.dislikes || 0);
        const netB = (b.likes || 0) - (b.dislikes || 0);
        return netB - netA;
      });
    } else {
      // Sort by most recent (already in order, but reverse to show newest first)
      return reviews.reverse();
    }
  };

  const sortedReviews = getSortedReviews();

  const handleRatingClick = (rating) => {
    // Toggle: if clicking the same rating, clear filter
    if (ratingFilter === rating) {
      setRatingFilter(null);
    } else {
      setRatingFilter(rating);
    }
  };

  return (
    <div className='rateRestaurantPage'> 
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
              placeholder="Search for a manager" 
              value={managerSearchInput}
              onChange={handleManagerSearch}
            />
            {managerSearchInput && filteredManagers.length > 0 && (
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
                <div className="noResults">
                  <span className='noManager'>Can't find the manager?
                  <span className='enterName' onClick={handleEnterManager}> Enter first name</span></span>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <button className="homeBtn" onClick={goHome}>Home</button>
      </div>

      <div className="header">
        <div className="restaurantInfo">
          <span className="restaurantName">{restaurantName}</span>
          <p className="location">Modesto, California</p>
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
          <button className="rateButton" onClick={goToRatingForm}>Rate this restaurant</button>
        </div>
      </div>

      <div className="contentContainer">
        <div className="leftSection">
          {/* Filter Dropdown */}
          <div className="reviewFilters">
            <label htmlFor="filterSelect" className="filterLabel">Sort by:</label>
            <select 
              id="filterSelect"
              className="filterDropdown"
              value={reviewFilter}
              onChange={(e) => setReviewFilter(e.target.value)}
            >
              <option value="recent">Most Recent</option>
              <option value="top">Top Reviews</option>
            </select>
            {ratingFilter !== null && (
              <div className="activeFilterBadge">
                Showing {ratingFilter}-star reviews
                <button 
                  className="clearFilterBtn"
                  onClick={() => setRatingFilter(null)}
                  aria-label="Clear filter"
                >
                  ✕
                </button>
              </div>
            )}
          </div>

          {/* Rating Distribution */}
          <div className="ratingDistribution">
            {[5, 4, 3, 2, 1].map((num) => (
              <div 
                key={num} 
                className={`distributionRow ${ratingFilter === num ? 'active' : ''}`}
                onClick={() => handleRatingClick(num)}
                title={`${ratingDistribution[num]} ${ratingDistribution[num] === 1 ? 'review' : 'reviews'} with ${num} ${num === 1 ? 'star' : 'stars'}`}
              >
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
              <span className="tag">Good Management</span>
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
                <p>No reviews yet. Be the first to review {restaurantName}!</p>
              </div>
            ) : (
              sortedReviews.map((rating) => (
                <div key={rating.id} className="reviewCard">
                  <div className="reviewHeader">
                    <div className="stars">
                      {[1, 2, 3, 4, 5].map((star) => {
                        const avgRating = Math.round((rating.teamEnvironment + rating.shiftAvailability + rating.pay + rating.staffWorkloadRatio) / 4);
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
                    <div className="reviewTags">
                      {rating.tags && rating.tags.map((tag, index) => (
                        <span key={index} className="reviewTag">{tag}</span>
                      ))}
                    </div>
                    <div className="reviewVotes">
                      <button 
                        className={`voteButton ${userVotes[rating.id] === 'like' ? 'active' : ''}`}
                        onClick={() => handleVote(rating.id, 'like')}
                        aria-label="Like"
                      >
                        <svg className="voteIcon" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M8 3L12 7H9V13H7V7H4L8 3Z" fill="currentColor"/>
                        </svg>
                        <span className="voteCount">{rating.likes || 0}</span>
                      </button>
                      <button 
                        className={`voteButton ${userVotes[rating.id] === 'dislike' ? 'active' : ''}`}
                        onClick={() => handleVote(rating.id, 'dislike')}
                        aria-label="Dislike"
                      >
                        <svg className="voteIcon" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M8 13L4 9H7V3H9V9H12L8 13Z" fill="currentColor"/>
                        </svg>
                        <span className="voteCount">{rating.dislikes || 0}</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Add Manager Modal */}
      {showAddManagerForm && (
        <>
          <div className="modalOverlay" onClick={handleCancelAdd}></div>
          <div className="addManagerModal">
            <button className="modalCloseBtn" onClick={handleCancelAdd}>✕</button>
            <div className="modalContent">
              <h2>Add Manager</h2>
              <p className="modalSubtext">Adding manager to <strong>{restaurantName}</strong></p>
              
              <div className="modalInputGroup">
                <label>First Name <span className="required">*</span></label>
                <input
                  type="text"
                  placeholder="e.g., John"
                  value={newManagerName}
                  onChange={(e) => setNewManagerName(e.target.value)}
                  className="modalInput"
                />
              </div>

              <div className="modalInputGroup">
                <label>Position <span className="required">*</span></label>
                <input
                  type="text"
                  placeholder="e.g., General Manager, Shift Manager"
                  value={newManagerPosition}
                  onChange={(e) => setNewManagerPosition(e.target.value)}
                  className="modalInput"
                />
              </div>

              <div className="modalButtons">
                <button onClick={handleAddManager} className="modalAddBtn">Add Manager</button>
                <button onClick={handleCancelAdd} className="modalCancelBtn">Cancel</button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default RateRestaurant