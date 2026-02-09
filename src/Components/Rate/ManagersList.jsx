import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from './../../supabaseClient'
import './ManagersList.css'

const ManagersList = () => {
  const { restaurantID } = useParams(); // Get restaurant ID from URL
  const navigate = useNavigate();
  const [managers, setManagers] = useState([]);
  const [restaurant, setRestaurant] = useState(null);
  const [managerRatings, setManagerRatings] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const [filteredManagers, setFilteredManagers] = useState([]);
  const [sortBy, setSortBy] = useState('name'); // name, rating, reviews
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
  }, [restaurantID]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching data for restaurant ID:', restaurantID);
      
      // Fetch the current restaurant
      const { data: restaurantData, error: restaurantError } = await supabase
        .from('restaurants')
        .select('*')
        .eq('id', restaurantID)
        .single();
      
      if (restaurantError) {
        console.error('Error fetching restaurant:', restaurantError);
        throw restaurantError;
      }
      
      console.log('Restaurant fetched:', restaurantData);
      setRestaurant(restaurantData);

      // Fetch managers for THIS restaurant only
      const { data: managersData, error: managersError } = await supabase
        .from('managers')
        .select('*, restaurants(name)')
        .eq('restaurant_id', restaurantID)
        .order('name');
      
      if (managersError) {
        console.error('Error fetching managers:', managersError);
        throw managersError;
      }
      
      console.log('Managers fetched for this restaurant:', managersData);
      
      const managersWithRestaurantName = managersData?.map(m => ({
        ...m,
        restaurantName: m.restaurants?.name || 'Unknown'
      })) || [];
      
      setManagers(managersWithRestaurantName);

      // Fetch all ratings for these managers only
      const managerIds = managersWithRestaurantName.map(m => m.id);
      
      let ratingsData = [];
      if (managerIds.length > 0) {
        const { data, error: ratingsError } = await supabase
          .from('manager_ratings')
          .select('*')
          .in('manager_id', managerIds);
        
        if (ratingsError) {
          console.error('Error fetching ratings:', ratingsError);
        } else {
          ratingsData = data || [];
        }
      }
      
      console.log('Ratings fetched:', ratingsData);
      
      // Calculate stats for each manager
      const ratingsMap = {};
      managersWithRestaurantName.forEach(manager => {
        const managerReviews = ratingsData.filter(r => r.manager_id === manager.id);
        
        if (managerReviews.length > 0) {
          const avgCommunication = managerReviews.reduce((acc, r) => acc + r.communication, 0) / managerReviews.length;
          const avgFairness = managerReviews.reduce((acc, r) => acc + r.fairness, 0) / managerReviews.length;
          const avgApproachability = managerReviews.reduce((acc, r) => acc + r.approachability, 0) / managerReviews.length;
          const avgOrganization = managerReviews.reduce((acc, r) => acc + r.organization, 0) / managerReviews.length;
          
          const overallRating = (avgCommunication + avgFairness + avgApproachability + avgOrganization) / 4;
          
          ratingsMap[manager.id] = {
            count: managerReviews.length,
            overallRating: overallRating.toFixed(1),
            communication: avgCommunication.toFixed(1),
            fairness: avgFairness.toFixed(1),
            approachability: avgApproachability.toFixed(1),
            organization: avgOrganization.toFixed(1)
          };
        } else {
          ratingsMap[manager.id] = {
            count: 0,
            overallRating: 0,
            communication: 0,
            fairness: 0,
            approachability: 0,
            organization: 0
          };
        }
      });
      
      console.log('Ratings map:', ratingsMap);
      
      setManagerRatings(ratingsMap);
      setFilteredManagers(managersWithRestaurantName);
      setLoading(false);
    } catch (err) {
      console.error('Error in fetchData:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (searchInput.trim() === '') {
      setFilteredManagers(managers);
    } else {
      const filtered = managers.filter(manager =>
        manager.name.toLowerCase().includes(searchInput.toLowerCase()) ||
        manager.position.toLowerCase().includes(searchInput.toLowerCase())
      );
      setFilteredManagers(filtered);
    }
  }, [searchInput, managers]);

  const getSortedManagers = () => {
    let sorted = [...filteredManagers];
    
    switch (sortBy) {
      case 'rating':
        sorted.sort((a, b) => {
          const ratingA = parseFloat(managerRatings[a.id]?.overallRating || 0);
          const ratingB = parseFloat(managerRatings[b.id]?.overallRating || 0);
          return ratingB - ratingA;
        });
        break;
      case 'reviews':
        sorted.sort((a, b) => {
          const countA = managerRatings[a.id]?.count || 0;
          const countB = managerRatings[b.id]?.count || 0;
          return countB - countA;
        });
        break;
      case 'name':
      default:
        sorted.sort((a, b) => a.name.localeCompare(b.name));
        break;
    }
    
    return sorted;
  };

  const sortedManagers = getSortedManagers();

  const handleManagerClick = (manager) => {
    navigate(`/rate/${manager.id}`, { state: { managerName: manager.name } });
  };

  const goHome = () => {
    navigate('/');
  };

  const goBack = () => {
    navigate(`/restaurant/${restaurantID}`, { 
      state: { restaurantName: restaurant?.name } 
    });
  };

  if (loading) {
    return (
      <div className="managersListPage">
        <div className="topBar">
          <h1 className="pageTitle">Managers</h1>
          <div className="topBarButtons">
            <button className="backBtn" onClick={goBack}>Back to Restaurant</button>
            <button className="homeBtn" onClick={goHome}>Home</button>
          </div>
        </div>
        <div className="loading">Loading managers...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="managersListPage">
        <div className="topBar">
          <h1 className="pageTitle">Managers</h1>
          <div className="topBarButtons">
            <button className="backBtn" onClick={goBack}>Back to Restaurant</button>
            <button className="homeBtn" onClick={goHome}>Home</button>
          </div>
        </div>
        <div className="managersContainer">
          <div className="error">
            <p>Error loading managers: {error}</p>
            <button onClick={fetchData} className="retryBtn">Retry</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="managersListPage">
      <div className="topBar">
        <h1 className="pageTitle">Managers at {restaurant?.name}</h1>
        <div className="topBarButtons">
          <button className="backBtn" onClick={goBack}>Back to Restaurant</button>
          <button className="homeBtn" onClick={goHome}>Home</button>
        </div>
      </div>

      <div className="managersContainer">
        <div className="controlsBar">
          <input
            type="text"
            placeholder="Search managers or positions..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="searchInput"
          />
          
          <div className="sortControls">
            <label htmlFor="sortSelect">Sort by:</label>
            <select
              id="sortSelect"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="sortDropdown"
            >
              <option value="name">Name (A-Z)</option>
              <option value="rating">Highest Rated</option>
              <option value="reviews">Most Reviews</option>
            </select>
          </div>
        </div>

        <div className="managersCount">
          Showing {sortedManagers.length} {sortedManagers.length === 1 ? 'manager' : 'managers'}
        </div>

        <div className="managersList">
          {sortedManagers.length === 0 ? (
            <div className="noManagers">
              <p>No managers found matching your search.</p>
            </div>
          ) : (
            sortedManagers.map((manager) => {
              const stats = managerRatings[manager.id];
              const hasReviews = stats && stats.count > 0;
              
              return (
                <div
                  key={manager.id}
                  className="managerRow"
                  onClick={() => handleManagerClick(manager)}
                >
                  <div className="managerBasicInfo">
                    <h3 className="managerRowName">{manager.name}</h3>
                    <p className="managerRowPosition">{manager.position}</p>
                  </div>

                  {hasReviews ? (
                    <>
                      <div className="managerRatingInfo">
                        <div className="overallRatingBadge">
                          <span className="ratingNumber">{stats.overallRating}</span>
                          <div className="stars">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <span
                                key={star}
                                className={`star ${star <= Math.round(parseFloat(stats.overallRating)) ? 'filled' : ''}`}
                              >
                                ★
                              </span>
                            ))}
                          </div>
                        </div>
                        <p className="reviewCount">{stats.count} {stats.count === 1 ? 'review' : 'reviews'}</p>
                      </div>

                      <div className="managerRatingBreakdown">
                        <div className="ratingItem">
                          <span className="ratingLabel">Communication</span>
                          <span className="ratingValue">{stats.communication}</span>
                        </div>
                        <div className="ratingItem">
                          <span className="ratingLabel">Fairness</span>
                          <span className="ratingValue">{stats.fairness}</span>
                        </div>
                        <div className="ratingItem">
                          <span className="ratingLabel">Approachability</span>
                          <span className="ratingValue">{stats.approachability}</span>
                        </div>
                        <div className="ratingItem">
                          <span className="ratingLabel">Organization</span>
                          <span className="ratingValue">{stats.organization}</span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="noReviewsYet">
                      <p>No reviews yet</p>
                      <button className="beFirstBtn" onClick={(e) => {
                        e.stopPropagation();
                        handleManagerClick(manager);
                      }}>Be the first to review</button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default ManagersList;