import React, { useEffect, useState } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import { supabase } from './../../supabaseClient'
import { useAuth } from './../../authContext'
import './RateManager.css'
import managerBG from './../Assets/managerBG.png';

const RateManager = () => {
  const { managerID } = useParams();
  const location = useLocation();
  const managerName = location.state?.managerName;
  const navigate = useNavigate();
  const { user } = useAuth();

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
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    const fetchRestaurants = async () => {
      const { data, error } = await supabase.from('restaurants').select('*').order('name');
      if (!error) setRestaurants(data || []);
    };
    fetchRestaurants();
  }, []);

  useEffect(() => {
    const fetchManagers = async () => {
      const { data, error } = await supabase.from('managers').select('*, restaurants(name)').order('name');
      if (!error) {
        setManagers(data.map(m => ({ ...m, restaurantName: m.restaurants?.name || 'Unknown' })));
      }
    };
    fetchManagers();
  }, []);

  useEffect(() => {
    const fetchCurrentManager = async () => {
      if (!managerID) return;
      const { data, error } = await supabase
        .from('managers').select('*, restaurants(name)').eq('id', managerID).single();
      if (!error) {
        const manager = { ...data, restaurantName: data.restaurants?.name || 'Unknown' };
        setCurrentManager(manager);
        setRestaurantPlaceholder(manager.restaurantName);
        setManagerPlaceholder(manager.name);
      }
    };
    fetchCurrentManager();
  }, [managerID]);

  useEffect(() => {
    const fetchRatings = async () => {
      if (!managerID) return;
      setLoading(true);
      const { data, error } = await supabase
        .from('manager_ratings').select('*').eq('manager_id', managerID).order('created_at', { ascending: false });
      setAllRatings(error ? [] : (data || []));
      setLoading(false);
    };
    fetchRatings();
  }, [managerID]);

  useEffect(() => {
    const fetchUserVotes = async () => {
      if (!user || !managerID) return;
      const { data, error } = await supabase
        .from('user_votes').select('*').eq('user_id', user.id).eq('review_type', 'manager');
      if (!error) {
        const votesMap = {};
        data?.forEach(vote => { votesMap[vote.review_id] = vote.vote_type; });
        setUserVotes(votesMap);
      }
    };
    fetchUserVotes();
  }, [user, managerID]);

  const goToRatingForm = () => navigate(`/rate/${managerID}/form`, { state: { managerName } });
  const goToAllManagers = () => {
    if (currentManager?.restaurant_id) {
      navigate(`/restaurant/${currentManager.restaurant_id}/managers`, {
        state: { restaurantName: currentManager.restaurantName }
      });
    }
  };
  const goToRestaurant = () => {
    if (currentManager?.restaurant_id) {
      navigate(`/restaurant/${currentManager.restaurant_id}`, {
        state: { restaurantName: currentManager.restaurantName }
      });
    }
  };

  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm('Are you sure you want to delete your review?')) return;
    setDeletingId(reviewId);
    const { error } = await supabase.from('manager_ratings').delete().eq('id', reviewId);
    if (error) {
      alert('Failed to delete review. Please try again.');
    } else {
      setAllRatings(prev => prev.filter(r => r.id !== reviewId));
    }
    setDeletingId(null);
  };

  const handleEnterManager = () => setShowAddManagerForm(true);

  const handleAddManager = async () => {
    if (!newManagerName.trim()) { alert("Please enter the manager's first name"); return; }
    if (!newManagerPosition.trim()) { alert("Please enter the manager's position"); return; }
    const { data, error } = await supabase
      .from('managers')
      .insert([{ name: newManagerName.trim(), position: newManagerPosition.trim(), restaurant_id: currentManager?.restaurant_id || 1 }])
      .select().single();
    if (error) { alert('Failed to add manager'); }
    else { navigate(`/rate/${data.id}`, { state: { managerName: data.name } }); }
  };

  const handleCancelAdd = () => {
    setShowAddManagerForm(false);
    setNewManagerName('');
    setNewManagerPosition('');
  };

  const handleVote = async (reviewId, voteType) => {
    if (!user) return;
    const currentVote = userVotes[reviewId];
    const newVote = currentVote === voteType ? null : voteType;
    setUserVotes({ ...userVotes, [reviewId]: newVote });

    if (newVote === null) {
      await supabase.from('user_votes').delete()
        .eq('user_id', user.id).eq('review_type', 'manager').eq('review_id', reviewId);
    } else {
      await supabase.from('user_votes').upsert(
        { user_id: user.id, review_type: 'manager', review_id: reviewId, vote_type: newVote, updated_at: new Date().toISOString() },
        { onConflict: 'user_id,review_type,review_id' }
      );
    }

    const rating = allRatings.find(r => r.id === reviewId);
    if (!rating) return;
    let newLikes = rating.likes || 0;
    let newDislikes = rating.dislikes || 0;
    if (currentVote === 'like' && newVote === null) newLikes = Math.max(0, newLikes - 1);
    else if (currentVote === 'like' && newVote === 'dislike') { newLikes = Math.max(0, newLikes - 1); newDislikes++; }
    else if (currentVote === 'dislike' && newVote === null) newDislikes = Math.max(0, newDislikes - 1);
    else if (currentVote === 'dislike' && newVote === 'like') { newDislikes = Math.max(0, newDislikes - 1); newLikes++; }
    else if (currentVote === null && newVote === 'like') newLikes++;
    else if (currentVote === null && newVote === 'dislike') newDislikes++;

    const { error } = await supabase.from('manager_ratings').update({ likes: newLikes, dislikes: newDislikes }).eq('id', reviewId);
    if (!error) setAllRatings(prev => prev.map(r => r.id === reviewId ? { ...r, likes: newLikes, dislikes: newDislikes } : r));
  };

  const handleRestaurantSearch = (e) => {
    const searched = e.target.value;
    setRestaurantSearchInput(searched);
    setShowRestaurantDropdown(false);
    if (searched.trim() === '') {
      setFilteredRestaurants([]);
      if (currentManager?.restaurantName) setRestaurantPlaceholder(currentManager.restaurantName);
    } else {
      setFilteredRestaurants(restaurants.filter(r => r.name.toLowerCase().includes(searched.toLowerCase())).sort((a, b) => a.name.localeCompare(b.name)));
    }
  };

  const handleClearRestaurantSearch = () => {
    const name = currentManager?.restaurantName || 'Barcelona Wine Bar';
    if (showRestaurantDropdown) {
      setShowRestaurantDropdown(false); setFilteredRestaurants([]); setRestaurantSearchInput(''); setRestaurantPlaceholder(name);
    } else {
      setRestaurantSearchInput(''); setRestaurantPlaceholder('Search for a restaurant'); setShowRestaurantDropdown(true);
      setFilteredRestaurants([...restaurants].sort((a, b) => a.name.localeCompare(b.name)));
    }
  };

  const handleManagerSearch = (e) => {
    const searched = e.target.value;
    setManagerSearchInput(searched);
    setShowManagerDropdown(false);
    setShowAddManagerForm(false);
    if (searched.trim() === '') {
      setFilteredManagers([]); setManagerPlaceholder(managerName || 'Manager Name');
    } else {
      setFilteredManagers(managers.filter(m => m.restaurant_id === currentManager?.restaurant_id && m.name.toLowerCase().includes(searched.toLowerCase())));
    }
  };

  const handleClearManagerSearch = () => {
    if (showManagerDropdown) {
      setShowManagerDropdown(false); setFilteredManagers([]); setManagerSearchInput(''); setManagerPlaceholder(managerName || 'Manager Name');
    } else {
      setManagerSearchInput(''); setManagerPlaceholder('Search for a manager'); setShowManagerDropdown(true);
      setFilteredManagers(managers.filter(m => m.restaurant_id === currentManager?.restaurant_id).sort((a, b) => a.name.localeCompare(b.name)));
    }
  };

  const handleSelectRestaurant = (restaurant) => {
    setRestaurantSearchInput(''); setFilteredRestaurants([]); setShowRestaurantDropdown(false);
    if (currentManager?.restaurantName) setRestaurantPlaceholder(currentManager.restaurantName);
    navigate(`/restaurant/${restaurant.id}`, { state: { restaurantName: restaurant.name } });
  };

  const handleSelectManager = (manager) => {
    setManagerSearchInput(''); setFilteredManagers([]); setShowManagerDropdown(false);
    setManagerPlaceholder(managerName || 'Manager Name');
    navigate(`/rate/${manager.id}`, { state: { managerName: manager.name } });
  };

  const existingRatings = allRatings;

  const calAverage = (quality) => {
    if (existingRatings.length === 0) return 0;
    return (existingRatings.reduce((acc, r) => acc + r[quality], 0) / existingRatings.length).toFixed(1);
  };

  const overallRating = existingRatings.length > 0
    ? ((parseFloat(calAverage('communication')) + parseFloat(calAverage('fairness')) + parseFloat(calAverage('approachability')) + parseFloat(calAverage('organization'))) / 4).toFixed(1)
    : 0;

  const recommendationPercentage = existingRatings.length > 0
    ? Math.round((existingRatings.filter(r => {
        const avg = (r.communication + r.fairness + r.approachability + r.organization) / 4;
        return avg >= 3.5;
      }).length / existingRatings.length) * 100)
    : 0;

  const getRatingDistribution = () => {
    const dist = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    existingRatings.forEach(r => {
      const avg = Math.round((r.communication + r.fairness + r.approachability + r.organization) / 4);
      dist[avg]++;
    });
    return dist;
  };

  const ratingDistribution = getRatingDistribution();
  const maxCount = Math.max(...Object.values(ratingDistribution));

  const getSortedReviews = () => {
    let reviews = [...existingRatings];
    if (ratingFilter !== null) {
      reviews = reviews.filter(r => Math.round((r.communication + r.fairness + r.approachability + r.organization) / 4) === ratingFilter);
    }
    if (tagFilter !== null) reviews = reviews.filter(r => r.tags && r.tags.includes(tagFilter));
    if (reviewFilter === 'top') return reviews.sort((a, b) => ((b.likes || 0) - (b.dislikes || 0)) - ((a.likes || 0) - (a.dislikes || 0)));
    return reviews;
  };

  const sortedReviews = getSortedReviews();
  const totalPages = Math.ceil(sortedReviews.length / reviewsPerPage);
  const currentReviews = sortedReviews.slice((currentPage - 1) * reviewsPerPage, currentPage * reviewsPerPage);

  const handlePageChange = (pageNumber) => { setCurrentPage(pageNumber); window.scrollTo({ top: 400, behavior: 'smooth' }); };
  const handlePrevPage = () => { if (currentPage > 1) handlePageChange(currentPage - 1); };
  const handleNextPage = () => { if (currentPage < totalPages) handlePageChange(currentPage + 1); };

  useEffect(() => { setCurrentPage(1); }, [reviewFilter, ratingFilter, tagFilter]);

  const handleRatingClick = (rating) => {
    if (ratingFilter === rating) { setRatingFilter(null); } else { setRatingFilter(rating); setTagFilter(null); }
  };

  const handleTagClick = (tag) => {
    if (tagFilter === tag) { setTagFilter(null); } else { setTagFilter(tag); setRatingFilter(null); }
  };

  if (loading) {
    return (
      <div className="loadingState">
        <div className="loadingSpinner"></div>
        <p>Loading manager details...</p>
      </div>
    );
  }

  return (
    <div className='rateManagerPage'>
      <nav className="topNav"><div className="navLogo">Manager<span>Check</span></div></nav>

      <div className="searchBarSection">
        <div className="searchBarContainer">
          <div className="searchInputWrapper">
            <svg className="searchIcon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input type="text" placeholder={restaurantPlaceholder} value={restaurantSearchInput} onChange={handleRestaurantSearch} className="searchInput" />
            {!restaurantSearchInput && (
              <button className="searchToggle" onClick={handleClearRestaurantSearch}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
              </button>
            )}
            {(showRestaurantDropdown || (restaurantSearchInput && filteredRestaurants.length > 0)) && (
              <div className="searchDropdown">
                {filteredRestaurants.map(restaurant => (
                  <div key={restaurant.id} className="searchDropdownItem" onClick={() => handleSelectRestaurant(restaurant)}>{restaurant.name}</div>
                ))}
              </div>
            )}
            {restaurantSearchInput && filteredRestaurants.length === 0 && (
              <div className="searchDropdown"><div className="noResults">No restaurants found</div></div>
            )}
          </div>

          <div className="searchInputWrapper">
            <svg className="searchIcon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input type="text" placeholder={managerPlaceholder} value={managerSearchInput} onChange={handleManagerSearch} className="searchInput" />
            {!managerSearchInput && (
              <button className="searchToggle" onClick={handleClearManagerSearch}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
              </button>
            )}
            {(showManagerDropdown || (managerSearchInput && filteredManagers.length > 0)) && (
              <div className="searchDropdown">
                {filteredManagers.map(manager => (
                  <div key={manager.id} className="searchDropdownItem" onClick={() => handleSelectManager(manager)}>{manager.name}</div>
                ))}
              </div>
            )}
            {managerSearchInput && filteredManagers.length === 0 && (
              <div className="searchDropdown">
                <div className="noResults">
                  <span className="noManager">Can't find the manager?&nbsp;<span className="enterName" onClick={handleEnterManager}>Add manager</span></span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <header className="rm-header" style={{ backgroundImage: `url(${managerBG})` }}>
        <div className="headerContent">
          <div className="headerLeft">
            <h1 className="restaurantName">{currentManager?.name || managerName}</h1>
            <p className="restaurantLocation">{currentManager?.restaurantName || 'Barcelona Wine Bar'}</p>
            <button className="rmBackToRestaurantBtn" onClick={goToRestaurant}>Back to Restaurant</button>
          </div>
          <div className="headerRight">
            <div className="headerStats">
              <div className="ratingCard">
                <div className="ratingNumber">{overallRating}</div>
                <div className="ratingStars">
                  {[1, 2, 3, 4, 5].map(star => {
                    const filled = star <= Math.floor(overallRating);
                    const half = !filled && star === Math.ceil(overallRating) && overallRating % 1 >= 0.5;
                    return <span key={star} className={`ratingStar ${filled ? 'filled' : ''} ${half ? 'half' : ''}`}>★</span>;
                  })}
                </div>
                <div className="ratingLabel">{existingRatings.length} {existingRatings.length === 1 ? 'Review' : 'Reviews'}</div>
              </div>
              {existingRatings.length > 0 && (
                <div className="recommendCard">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>
                  </svg>
                  <div className="recommendNumber">{recommendationPercentage}%</div>
                  <div className="recommendLabel">Recommend</div>
                </div>
              )}
            </div>
            <div className="headerActions">
              <button className="btnPrimary" onClick={goToRatingForm}>Rate Manager</button>
              <button className="btnSecondary" onClick={goToAllManagers}>View All Managers</button>
            </div>
          </div>
        </div>
      </header>

      <div className="mainContent">
        <aside className="sidebar">
          <div className="filterCard">
            <h3 className="cardTitle">Sort Reviews</h3>
            <select className="filterSelect" value={reviewFilter} onChange={(e) => setReviewFilter(e.target.value)}>
              <option value="recent">Most Recent</option>
              <option value="top">Top Rated</option>
            </select>
            {(ratingFilter !== null || tagFilter !== null) && (
              <div className="activeFilters">
                {ratingFilter !== null && (
                  <div className="filterBadge">{ratingFilter} stars<button onClick={() => setRatingFilter(null)} className="removeBadge">✕</button></div>
                )}
                {tagFilter !== null && (
                  <div className="filterBadge">{tagFilter}<button onClick={() => setTagFilter(null)} className="removeBadge">✕</button></div>
                )}
              </div>
            )}
          </div>

          <div className="filterCard">
            <h3 className="cardTitle">Rating Breakdown</h3>
            <div className="distributionBars">
              {[5, 4, 3, 2, 1].map(num => (
                <div key={num} className={`distributionRow ${ratingFilter === num ? 'active' : ''}`} onClick={() => handleRatingClick(num)}>
                  <span className="distLabel">{num}</span>
                  <div className="distBarTrack"><div className="distBarFill" style={{ width: maxCount > 0 ? `${(ratingDistribution[num] / maxCount) * 100}%` : '0%' }} /></div>
                  <span className="distCount">{ratingDistribution[num]}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="filterCard">
            <h3 className="cardTitle">Quick Filters</h3>
            <div className="tagsList">
              {['Good Scheduling', 'Good Pay', 'Bad Scheduling'].map(tag => (
                <button key={tag} className={`tagButton ${tagFilter === tag ? 'active' : ''}`} onClick={() => handleTagClick(tag)}>{tag}</button>
              ))}
            </div>
          </div>
        </aside>

        <section className="reviewsSection">
          {existingRatings.length === 0 ? (
            <div className="emptyState">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
                <polyline points="10 9 9 9 8 9"/>
              </svg>
              <h2>No reviews yet</h2>
              <p>Be the first to share your experience with {currentManager?.name || managerName}</p>
              <button className="btnPrimary" onClick={goToRatingForm}>Write First Review</button>
            </div>
          ) : (
            <>
              <div className="reviewsList">
                {currentReviews.map(rating => {
                  const avgRating = Math.round((rating.communication + rating.fairness + rating.approachability + rating.organization) / 4);
                  const isOwner = user && rating.user_id === user.id;
                  return (
                    <article key={rating.id} className="reviewCard">
                      <div className="reviewCardHeader">
                        <div className="reviewStars">
                          {[1, 2, 3, 4, 5].map(star => (
                            <span key={star} className={`reviewStar ${star <= avgRating ? 'filled' : ''}`}>★</span>
                          ))}
                        </div>
                        <div className="reviewMetaRow">
                          <div className="reviewMeta">
                            <span className="reviewPosition">{rating.position}</span>
                            <span className="reviewDot">•</span>
                            <span className="reviewDuration">{rating.duration}</span>
                          </div>
                          {isOwner && (
                            <button
                              className="deleteReviewBtn"
                              onClick={() => handleDeleteReview(rating.id)}
                              disabled={deletingId === rating.id}
                              title="Delete your review"
                            >
                              {deletingId === rating.id ? (
                                <span>Deleting...</span>
                              ) : (
                                <>
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <polyline points="3 6 5 6 21 6"/>
                                    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                                    <path d="M10 11v6M14 11v6"/>
                                    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                                  </svg>
                                  Delete
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      </div>

                      <p className="reviewText">{rating.comment}</p>

                      <div className="reviewCardFooter">
                        {rating.tags && rating.tags.length > 0 && (
                          <div className="reviewTags">
                            {rating.tags.map((tag, i) => <span key={i} className="reviewTag">{tag}</span>)}
                          </div>
                        )}
                        <div className="reviewVotes">
                          <button className={`voteBtn ${userVotes[rating.id] === 'like' ? 'active' : ''}`} onClick={() => handleVote(rating.id, 'like')}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>
                            </svg>
                            <span>{rating.likes || 0}</span>
                          </button>
                          <button className={`voteBtn ${userVotes[rating.id] === 'dislike' ? 'active' : ''}`} onClick={() => handleVote(rating.id, 'dislike')}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"/>
                            </svg>
                            <span>{rating.dislikes || 0}</span>
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>

              {totalPages > 1 && (
                <div className="pagination">
                  <button className="paginationBtn" onClick={handlePrevPage} disabled={currentPage === 1}>← Previous</button>
                  <div className="pageNumbers">
                    {[...Array(totalPages)].map((_, i) => (
                      <button key={i + 1} className={`pageBtn ${currentPage === i + 1 ? 'active' : ''}`} onClick={() => handlePageChange(i + 1)}>{i + 1}</button>
                    ))}
                  </div>
                  <button className="paginationBtn" onClick={handleNextPage} disabled={currentPage === totalPages}>Next →</button>
                </div>
              )}
            </>
          )}
        </section>
      </div>

      {showAddManagerForm && (
        <>
          <div className="modalOverlay" onClick={handleCancelAdd}></div>
          <div className="modal">
            <button className="modalClose" onClick={handleCancelAdd}>✕</button>
            <div className="modalContent">
              <h2 className="modalTitle">Add Manager</h2>
              <p className="modalSubtitle">at {currentManager?.restaurantName || 'Barcelona Wine Bar'}</p>
              <div className="modalInputGroup">
                <label>First Name <span className="required">*</span></label>
                <input type="text" value={newManagerName} onChange={e => setNewManagerName(e.target.value)} className="modalInput" placeholder="Enter first name" />
              </div>
              <div className="modalInputGroup">
                <label>Position <span className="required">*</span></label>
                <input type="text" value={newManagerPosition} onChange={e => setNewManagerPosition(e.target.value)} className="modalInput" placeholder="e.g., General Manager, Chef" />
              </div>
              <div className="modalActions">
                <button onClick={handleAddManager} className="modalBtnPrimary">Add Manager</button>
                <button onClick={handleCancelAdd} className="modalBtnSecondary">Cancel</button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default RateManager;