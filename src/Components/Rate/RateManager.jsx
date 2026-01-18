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
  const [showAddManagerForm, setShowAddManagerForm] = useState(false);
  const [newManagerName, setNewManagerName] = useState('');
  const [newManagerPosition, setNewManagerPosition] = useState('');
  const [managerPlaceholder, setManagerPlaceholder] = useState(managerName || 'Manager Name');
  const [restaurantPlaceholder, setRestaurantPlaceholder] = useState('Barcelona Wine Bar');
  const [reviewFilter, setReviewFilter] = useState('recent');
  const [ratingFilter, setRatingFilter] = useState(null);
  const [tagFilter, setTagFilter] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const reviewsPerPage = 10;
  const [userVotes, setUserVotes] = useState(() => {
    const saved = localStorage.getItem('userVotes_manager_' + managerID);
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

  const goHome = () => {
    navigate('/');
  }

  const goToRatingForm = () => {
    navigate(`/rate/${managerID}/form`, { state: { managerName } });
  }

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

    const currentManager = managers.find(m => m.id === parseInt(managerID));
    const restaurantId = currentManager?.restaurantId || 1;
    const restaurantName = currentManager?.restaurantName || 'Barcelona Wine Bar';

    const savedManagers = localStorage.getItem('managers');
    const currentManagers = savedManagers ? JSON.parse(savedManagers) : [];
    
    const newManager = {
      id: currentManagers.length > 0 ? Math.max(...currentManagers.map(m => m.id)) + 1 : 1,
      name: newManagerName.trim(),
      position: newManagerPosition.trim(),
      restaurantId: restaurantId,
      restaurantName: restaurantName
    };

    const updatedManagers = [...currentManagers, newManager];
    localStorage.setItem('managers', JSON.stringify(updatedManagers));
    setManagers(updatedManagers);
    
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

    if (currentVote === voteType) {
      newVote = null;
    } else {
      newVote = voteType;
    }

    const newUserVotes = {
      ...userVotes,
      [reviewId]: newVote
    };
    setUserVotes(newUserVotes);
    localStorage.setItem('userVotes_manager_' + managerID, JSON.stringify(newUserVotes));

    const savedRatings = localStorage.getItem('managerRatings');
    if (savedRatings) {
      const allRatings = JSON.parse(savedRatings);
      const managerRatings = allRatings[managerID] || [];
      
      const updatedRatings = managerRatings.map(rating => {
        if (rating.id === reviewId) {
          const updatedRating = { ...rating };
          
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
      
      allRatings[managerID] = updatedRatings;
      localStorage.setItem('managerRatings', JSON.stringify(allRatings));
      setAllRatings(allRatings);
    }
  };

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
      setShowRestaurantDropdown(false);
      setFilteredRestaurants([]);
      setRestaurantSearchInput('');
      setRestaurantPlaceholder(currentRestaurantName);
    } else {
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
    setShowAddManagerForm(false);

    if (searched.trim() === '') {
      setFilteredManagers([]);
      setManagerPlaceholder(managerName || 'Manager Name');
    } else {
      const currentManager = managers.find(m => m.id === parseInt(managerID));
      const currentRestaurantId = currentManager?.restaurantId;
      
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
      
      const currentManager = managers.find(m => m.id === parseInt(managerID));
      const currentRestaurantId = currentManager?.restaurantId;
      
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
      const defaultRatings = {
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
            tags: ["Good Scheduling"],
            likes: 8,
            dislikes: 1
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
            tags: ["Good Scheduling"],
            likes: 7,
            dislikes: 2
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
            tags: ["Low Workload", "Good Pay"],
            likes: 4,
            dislikes: 5
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
            tags: ["Bad Scheduling"],
            likes: 6,
            dislikes: 1
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
            tags: ["Low Workload"],
            likes: 3,
            dislikes: 6
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
            tags: ["Good Pay"],
            likes: 6,
            dislikes: 0
          }
        ]
      };
      localStorage.setItem('managerRatings', JSON.stringify(defaultRatings));
      return defaultRatings;
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

  const getSortedReviews = () => {
    let reviews = [...existingRatings];
    
    if (ratingFilter !== null) {
      reviews = reviews.filter(rating => {
        const avg = Math.round((rating.communication + rating.fairness + rating.approachability + rating.organization) / 4);
        return avg === ratingFilter;
      });
    }
    
    if (tagFilter !== null) {
      reviews = reviews.filter(rating => {
        return rating.tags && rating.tags.includes(tagFilter);
      });
    }
    
    if (reviewFilter === 'top') {
      return reviews.sort((a, b) => {
        const netA = (a.likes || 0) - (a.dislikes || 0);
        const netB = (b.likes || 0) - (b.dislikes || 0);
        return netB - netA;
      });
    } else {
      return reviews.reverse();
    }
  };

  const sortedReviews = getSortedReviews();

  const totalPages = Math.ceil(sortedReviews.length / reviewsPerPage);
  const indexOfLastReview = currentPage * reviewsPerPage;
  const indexOfFirstReview = indexOfLastReview - reviewsPerPage;
  const currentReviews = sortedReviews.slice(indexOfFirstReview, indexOfLastReview);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 400, behavior: 'smooth' });
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      handlePageChange(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      handlePageChange(currentPage + 1);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [reviewFilter, ratingFilter, tagFilter]);

  const handleRatingClick = (rating) => {
    if (ratingFilter === rating) {
      setRatingFilter(null);
    } else {
      setRatingFilter(rating);
      setTagFilter(null);
    }
  };

  const handleTagClick = (tag) => {
    if (tagFilter === tag) {
      setTagFilter(null);
    } else {
      setTagFilter(tag);
      setRatingFilter(null);
    }
  };

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
          <button className="rateButton" onClick={goToRatingForm}>Rate this manager</button>
        </div>
      </div>

      <div className="contentContainer">
        <div className="leftSection">
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
            {tagFilter !== null && (
              <div className="activeFilterBadge">
                Showing "{tagFilter}" reviews
                <button 
                  className="clearFilterBtn"
                  onClick={() => setTagFilter(null)}
                  aria-label="Clear filter"
                >
                  ✕
                </button>
              </div>
            )}
          </div>

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

          <div className="summaryTags">
            <h3>Summary</h3>
            <div className="tags">
              <span 
                className={`tag ${tagFilter === 'Good Scheduling' ? 'active' : ''}`}
                onClick={() => handleTagClick('Good Scheduling')}
              >
                Good Scheduling
              </span>
              <span 
                className={`tag ${tagFilter === 'Good Pay' ? 'active' : ''}`}
                onClick={() => handleTagClick('Good Pay')}
              >
                Good Pay
              </span>
              <span 
                className={`tag ${tagFilter === 'Bad Scheduling' ? 'active' : ''}`}
                onClick={() => handleTagClick('Bad Scheduling')}
              >
                Bad Scheduling
              </span>
            </div>
          </div>
        </div>

        <div className="rightSection">
          <div className="reviewsList">
            {existingRatings.length === 0 ? (
              <div className="noReviews">
                <p>No reviews yet. Be the first to review {managerName}!</p>
              </div>
            ) : (
              <>
                {currentReviews.map((rating) => (
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
                ))}

                {totalPages > 1 && (
                  <div className="pagination">
                    <button 
                      className="pageArrow"
                      onClick={handlePrevPage}
                      disabled={currentPage === 1}
                    >
                      ←
                    </button>
                    
                    <div className="pageNumbers">
                      {[...Array(totalPages)].map((_, index) => {
                        const pageNum = index + 1;
                        return (
                          <button
                            key={pageNum}
                            className={`pageNumber ${currentPage === pageNum ? 'active' : ''}`}
                            onClick={() => handlePageChange(pageNum)}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>

                    <button 
                      className="pageArrow"
                      onClick={handleNextPage}
                      disabled={currentPage === totalPages}
                    >
                      →
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {showAddManagerForm && (
        <>
          <div className="modalOverlay" onClick={handleCancelAdd}></div>
          <div className="addManagerModal">
            <button className="modalCloseBtn" onClick={handleCancelAdd}>✕</button>
            <div className="modalContent">
              <h2>Manager at {managers.find(m => m.id === parseInt(managerID))?.restaurantName || 'Barcelona Wine Bar'}</h2>
              
              <div className="modalInputGroup">
                <label>First Name <span className="required">*</span></label>
                <input
                  type="text"
                  placeholder=""
                  value={newManagerName}
                  onChange={(e) => setNewManagerName(e.target.value)}
                  className="modalInput"
                />
              </div>

              <div className="modalInputGroup">
                <label>Position <span className="required">*</span></label>
                <input
                  type="text"
                  placeholder=""
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

export default RateManager