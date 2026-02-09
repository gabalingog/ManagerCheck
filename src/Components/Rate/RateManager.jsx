import React, { useEffect, useState } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import { supabase } from './../../supabaseClient'
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
  
  const [managers, setManagers] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [currentManager, setCurrentManager] = useState(null);
  const [allRatings, setAllRatings] = useState([]);
  const [userVotes, setUserVotes] = useState({});
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState(null);

  // Generate or retrieve a simple user ID (stored in localStorage for consistency)
  useEffect(() => {
    let userId = localStorage.getItem('tempUserId');
    if (!userId) {
      userId = 'user_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('tempUserId', userId);
    }
    setCurrentUserId(userId);
  }, []);

  // Fetch restaurants
  useEffect(() => {
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
    fetchRestaurants();
  }, []);

  // Fetch managers
  useEffect(() => {
    const fetchManagers = async () => {
      const { data, error } = await supabase
        .from('managers')
        .select('*, restaurants(name)')
        .order('name');
      
      if (error) {
        console.error('Error fetching managers:', error);
      } else {
        const managersWithRestaurantName = data.map(m => ({
          ...m,
          restaurantName: m.restaurants?.name || 'Unknown'
        }));
        setManagers(managersWithRestaurantName || []);
      }
    };
    fetchManagers();
  }, []);

  // Fetch current manager details
  useEffect(() => {
    const fetchCurrentManager = async () => {
      if (!managerID) return;
      
      const { data, error } = await supabase
        .from('managers')
        .select('*, restaurants(name)')
        .eq('id', managerID)
        .single();
      
      if (error) {
        console.error('Error fetching manager:', error);
      } else {
        const manager = {
          ...data,
          restaurantName: data.restaurants?.name || 'Unknown'
        };
        setCurrentManager(manager);
        setRestaurantPlaceholder(manager.restaurantName);
        setManagerPlaceholder(manager.name);
      }
    };
    fetchCurrentManager();
  }, [managerID]);

  // Fetch ratings for this manager
  useEffect(() => {
    const fetchRatings = async () => {
      if (!managerID) return;
      
      setLoading(true);
      const { data, error } = await supabase
        .from('manager_ratings')
        .select('*')
        .eq('manager_id', managerID)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching ratings:', error);
        setAllRatings([]);
      } else {
        setAllRatings(data || []);
      }
      setLoading(false);
    };
    fetchRatings();
  }, [managerID]);

  // Fetch user votes
  useEffect(() => {
    const fetchUserVotes = async () => {
      if (!currentUserId || !managerID) return;
      
      const { data, error } = await supabase
        .from('user_votes')
        .select('*')
        .eq('user_id', currentUserId)
        .eq('review_type', 'manager');
      
      if (error) {
        console.error('Error fetching user votes:', error);
      } else {
        const votesMap = {};
        data?.forEach(vote => {
          votesMap[vote.review_id] = vote.vote_type;
        });
        setUserVotes(votesMap);
      }
    };
    fetchUserVotes();
  }, [currentUserId, managerID]);

  const goHome = () => {
    navigate('/');
  }

  const goToRatingForm = () => {
    navigate(`/rate/${managerID}/form`, { state: { managerName } });
  }

  const handleEnterManager = () => {
    setShowAddManagerForm(true);
  };

  const handleAddManager = async () => {
    if (newManagerName.trim() === '') {
      alert('Please enter the manager\'s first name');
      return;
    }
    if (newManagerPosition.trim() === '') {
      alert('Please enter the manager\'s position');
      return;
    }

    const restaurantId = currentManager?.restaurant_id || 1;

    const { data, error } = await supabase
      .from('managers')
      .insert([{
        name: newManagerName.trim(),
        position: newManagerPosition.trim(),
        restaurant_id: restaurantId
      }])
      .select()
      .single();

    if (error) {
      console.error('Error adding manager:', error);
      alert('Failed to add manager');
    } else {
      navigate(`/rate/${data.id}`, { state: { managerName: data.name } });
    }
  };

  const handleCancelAdd = () => {
    setShowAddManagerForm(false);
    setNewManagerName('');
    setNewManagerPosition('');
  };

  const handleVote = async (reviewId, voteType) => {
    if (!currentUserId) return;

    const currentVote = userVotes[reviewId];
    let newVote = null;

    if (currentVote === voteType) {
      newVote = null;
    } else {
      newVote = voteType;
    }

    // Update local state immediately for responsiveness
    const newUserVotes = {
      ...userVotes,
      [reviewId]: newVote
    };
    setUserVotes(newUserVotes);

    // Update in database
    if (newVote === null) {
      // Delete vote
      await supabase
        .from('user_votes')
        .delete()
        .eq('user_id', currentUserId)
        .eq('review_type', 'manager')
        .eq('review_id', reviewId);
    } else {
      // Upsert vote
      await supabase
        .from('user_votes')
        .upsert({
          user_id: currentUserId,
          review_type: 'manager',
          review_id: reviewId,
          vote_type: newVote,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,review_type,review_id'
        });
    }

    // Calculate new like/dislike counts
    const rating = allRatings.find(r => r.id === reviewId);
    if (!rating) return;

    let newLikes = rating.likes || 0;
    let newDislikes = rating.dislikes || 0;

    if (currentVote === 'like' && newVote === null) {
      newLikes = Math.max(0, newLikes - 1);
    } else if (currentVote === 'like' && newVote === 'dislike') {
      newLikes = Math.max(0, newLikes - 1);
      newDislikes = newDislikes + 1;
    } else if (currentVote === 'dislike' && newVote === null) {
      newDislikes = Math.max(0, newDislikes - 1);
    } else if (currentVote === 'dislike' && newVote === 'like') {
      newDislikes = Math.max(0, newDislikes - 1);
      newLikes = newLikes + 1;
    } else if (currentVote === null && newVote === 'like') {
      newLikes = newLikes + 1;
    } else if (currentVote === null && newVote === 'dislike') {
      newDislikes = newDislikes + 1;
    }

    // Update rating counts in database
    const { error } = await supabase
      .from('manager_ratings')
      .update({ likes: newLikes, dislikes: newDislikes })
      .eq('id', reviewId);

    if (error) {
      console.error('Error updating vote counts:', error);
    } else {
      // Update local state
      setAllRatings(prevRatings =>
        prevRatings.map(r =>
          r.id === reviewId
            ? { ...r, likes: newLikes, dislikes: newDislikes }
            : r
        )
      );
    }
  };

  const handleRestaurantSearch = (e) => {
    const searched = e.target.value;
    setRestaurantSearchInput(searched);
    setShowRestaurantDropdown(false);

    if (searched.trim() === '') {
      setFilteredRestaurants([]);
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
      const currentRestaurantId = currentManager?.restaurant_id;
      
      const filtered = managers.filter(manager =>
        manager.restaurant_id === currentRestaurantId &&
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
      
      const currentRestaurantId = currentManager?.restaurant_id;
      
      const restaurantManagers = managers.filter(m => m.restaurant_id === currentRestaurantId)
        .sort((a, b) => a.name.localeCompare(b.name));
      setFilteredManagers(restaurantManagers);
    }
  };

  const handleSelectRestaurant = (restaurant) => {
    setRestaurantSearchInput('');
    setFilteredRestaurants([]);
    setShowRestaurantDropdown(false);
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

  const existingRatings = allRatings;

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

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

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
          <span className="managerName">{currentManager?.name || managerName}</span>
          <p className="resName">{currentManager?.restaurantName || 'Barcelona Wine Bar'}</p>
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
                <p>No reviews yet. Be the first to review {currentManager?.name || managerName}!</p>
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
              <h2>Manager at {currentManager?.restaurantName || 'Barcelona Wine Bar'}</h2>
              
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