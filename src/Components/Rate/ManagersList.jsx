import React, { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from './../../supabaseClient'
import './ManagersList.css'

const ManagersList = () => {
  const { restaurantID } = useParams();
  const navigate = useNavigate();
  const [managers, setManagers] = useState([]);
  const [restaurant, setRestaurant] = useState(null);
  const [managerRatings, setManagerRatings] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const [filteredManagers, setFilteredManagers] = useState([]);
  const [sortBy, setSortBy] = useState('name');
  const [error, setError] = useState(null);
  const [showAddManagerForm, setShowAddManagerForm] = useState(false);
  const [newManagerName, setNewManagerName] = useState('');
  const [newManagerPosition, setNewManagerPosition] = useState('');

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch the current restaurant via Supabase
      const { data: restaurantData, error: restaurantError } = await supabase
        .from('restaurants')
        .select('*')
        .eq('id', restaurantID)
        .single();

      if (restaurantError) throw restaurantError;
      setRestaurant(restaurantData);

      // Fetch managers for this restaurant via Supabase
      const { data: managersData, error: managersError } = await supabase
        .from('managers')
        .select('*')
        .eq('restaurant_id', restaurantID)
        .order('name');

      if (managersError) throw managersError;

      const managersWithRestaurantName = (managersData || []).map(m => ({
        ...m,
        restaurantName: restaurantData?.name || 'Unknown'
      }));

      setManagers(managersWithRestaurantName);
      setFilteredManagers(managersWithRestaurantName);

      // Fetch all ratings for these managers via Supabase
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

      // Calculate per-manager stats
      const ratingsMap = {};
      managersWithRestaurantName.forEach(manager => {
        const reviews = ratingsData.filter(r => r.manager_id === manager.id);

        if (reviews.length > 0) {
          const avg = (key) => reviews.reduce((acc, r) => acc + r[key], 0) / reviews.length;
          const overall = (avg('communication') + avg('fairness') + avg('approachability') + avg('organization')) / 4;

          ratingsMap[manager.id] = {
            count: reviews.length,
            overallRating: overall.toFixed(1),
            communication: avg('communication').toFixed(1),
            fairness: avg('fairness').toFixed(1),
            approachability: avg('approachability').toFixed(1),
            organization: avg('organization').toFixed(1),
            recommendPct: Math.round(
              (reviews.filter(r =>
                (r.communication + r.fairness + r.approachability + r.organization) / 4 >= 3.5
              ).length / reviews.length) * 100
            ),
          };
        } else {
          ratingsMap[manager.id] = { count: 0, overallRating: 0, communication: 0, fairness: 0, approachability: 0, organization: 0 };
        }
      });

      setManagerRatings(ratingsMap);
      setLoading(false);
    } catch (err) {
      console.error('Error in fetchData:', err);
      setError(err.message);
      setLoading(false);
    }
  }, [restaurantID]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    if (searchInput.trim() === '') {
      setFilteredManagers(managers);
    } else {
      const q = searchInput.toLowerCase();
      setFilteredManagers(managers.filter(m =>
        m.name.toLowerCase().includes(q) || m.position.toLowerCase().includes(q)
      ));
    }
  }, [searchInput, managers]);

  const getSortedManagers = () => {
    const sorted = [...filteredManagers];
    switch (sortBy) {
      case 'rating':
        return sorted.sort((a, b) =>
          parseFloat(managerRatings[b.id]?.overallRating || 0) - parseFloat(managerRatings[a.id]?.overallRating || 0)
        );
      case 'reviews':
        return sorted.sort((a, b) =>
          (managerRatings[b.id]?.count || 0) - (managerRatings[a.id]?.count || 0)
        );
      default:
        return sorted.sort((a, b) => a.name.localeCompare(b.name));
    }
  };

  const sortedManagers = getSortedManagers();

  const handleManagerClick = (manager) => {
    navigate(`/rate/${manager.id}`, { state: { managerName: manager.name } });
  };

  const goBack = () => navigate(`/restaurant/${restaurantID}`, { state: { restaurantName: restaurant?.name } });

  const handleAddManager = async () => {
    if (!newManagerName.trim() || !newManagerPosition.trim()) return;

    const { error: insertError } = await supabase
      .from('managers')
      .insert([{
        name: newManagerName.trim(),
        position: newManagerPosition.trim(),
        restaurant_id: parseInt(restaurantID),
      }])
      .select()
      .single();

    if (insertError) {
      console.error('Error adding manager:', insertError);
    } else {
      setShowAddManagerForm(false);
      setNewManagerName('');
      setNewManagerPosition('');
      fetchData();
    }
  };

  const handleCancelAdd = () => {
    setShowAddManagerForm(false);
    setNewManagerName('');
    setNewManagerPosition('');
  };

  /* ── LOADING ─────────────────────────────────────────── */
  if (loading) {
    return (
      <div className="managersListPage">
        <div className="topBar">
          <h1 className="pageTitle">Managers</h1>
          <div className="topBarButtons">
            <button className="backBtn" onClick={goBack}>Back to Restaurant</button>
          </div>
        </div>
        <div className="loading">Loading…</div>
      </div>
    );
  }

  /* ── ERROR ───────────────────────────────────────────── */
  if (error) {
    return (
      <div className="managersListPage">
        <div className="topBar">
          <h1 className="pageTitle">Managers</h1>
          <div className="topBarButtons">
            <button className="backBtn" onClick={goBack}>Back to Restaurant</button>
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

  /* ── MAIN RENDER ─────────────────────────────────────── */
  return (
    <div className="managersListPage">
      <div className="topBar">
        <h1 className="pageTitle">
          {restaurant?.name}
        </h1>
        <div className="topBarButtons">
          <button className="backBtn" onClick={goBack}>Back to Restaurant</button>
        </div>
      </div>

      <div className="managersContainer">
        {managers.length === 0 ? (
          <div className="noManagersAtAll">
            <div className="emptyState">
              <h2>No Managers Yet</h2>
              <p>Be the first to add a manager at {restaurant?.name}.</p>
              <button className="addFirstManagerBtn" onClick={() => setShowAddManagerForm(true)}>
                Add First Manager
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="controlsBar">
              <input
                type="text"
                placeholder="Search managers or positions…"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="searchInput"
              />
              <div className="sortControls">
                <label htmlFor="sortSelect">Sort by</label>
                <select
                  id="sortSelect"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="sortDropdown"
                >
                  <option value="name">Name (A–Z)</option>
                  <option value="rating">Highest Rated</option>
                  <option value="reviews">Most Reviews</option>
                </select>
              </div>
            </div>

            <div className="managersCount">
              {sortedManagers.length} {sortedManagers.length === 1 ? 'manager' : 'managers'}
            </div>

            <div className="managersList">
                {sortedManagers.length === 0 ? (
                  <div className="noManagers">No managers match your search.</div>
                ) : (
                  sortedManagers.map((manager) => {
                    const stats = managerRatings[manager.id];
                    const hasReviews = stats && stats.count > 0;

                    return (
                      <div key={manager.id} className="managerRow">
                        <div className="managerBasicInfo">
                          <h3 className="managerRowName">{manager.name}</h3>
                          <p className="managerRowPosition">{manager.position}</p>
                          {hasReviews && stats.recommendPct > 50 && (
                            <div className="managerRecommend recommend-yes">
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>
                              </svg>
                              {stats.recommendPct}% Recommended
                            </div>
                          )}
                          <button
                            className="rateManagerBtn"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/rate/${manager.id}/form`, {
                                state: { managerName: manager.name, returnTo: `/restaurant/${restaurantID}/managers` }
                              });
                            }}
                          >
                            Rate Manager
                          </button>
                        </div>

                        {hasReviews ? (
                          <>
                            <div className="managerRatingInfo">
                              <div className="overallRatingBadge">
                                <span className="ratingNumber">{stats.overallRating}</span>
                                <div className="stars">
                                  {[1, 2, 3, 4, 5].map((star) => {
                                    const filled = star <= Math.floor(parseFloat(stats.overallRating));
                                    const half = !filled && star === Math.ceil(parseFloat(stats.overallRating)) && parseFloat(stats.overallRating) % 1 >= 0.5;
                                    return <span key={star} className={`star ${filled ? 'filled' : ''} ${half ? 'half' : ''}`}>★</span>;
                                  })}
                                </div>
                              </div>
                              <p className="reviewCount">{stats.count} {stats.count === 1 ? 'review' : 'reviews'}</p>
                            </div>

                            <div className="managerRatingBreakdown">
                              {[
                                ['Communication', stats.communication],
                                ['Fairness', stats.fairness],
                                ['Approachability', stats.approachability],
                                ['Organization', stats.organization],
                              ].map(([label, val]) => (
                                <div className="ratingItem" key={label}>
                                  <span className="ratingLabel">{label}</span>
                                  <span className="ratingValue">{val}</span>
                                </div>
                              ))}
                            </div>
                          </>
                        ) : (
                          <div className="noReviewsYet">
                            <p>No reviews yet</p>
                            <button
                              className="beFirstBtn"
                              onClick={(e) => { e.stopPropagation(); setShowAddManagerForm(true); }}
                            >
                              Be the first to review
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}

                <div className="managerRow addManagerCard" onClick={() => setShowAddManagerForm(true)}>
                  <span className="addManagerPlus">+</span>
                  <span className="addManagerLabel">Add a Manager</span>
                </div>
            </div>
          </>
        )}
      </div>

      {/* Add Manager Modal */}
      {showAddManagerForm && (
        <>
          <div className="modalOverlay" onClick={handleCancelAdd}></div>
          <div className="addManagerModal">
            <button className="modalCloseBtn" onClick={handleCancelAdd}>✕</button>
            <div className="modalContent">
              <h2>Add a Manager at {restaurant?.name}</h2>

              <div className="modalInputGroup">
                <label>First Name <span className="required">*</span></label>
                <input
                  type="text"
                  value={newManagerName}
                  onChange={(e) => setNewManagerName(e.target.value)}
                  className="modalInput"
                  placeholder="e.g. Sarah"
                />
              </div>

              <div className="modalInputGroup">
                <label>Position <span className="required">*</span></label>
                <input
                  type="text"
                  value={newManagerPosition}
                  onChange={(e) => setNewManagerPosition(e.target.value)}
                  className="modalInput"
                  placeholder="e.g. General Manager"
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
  );
};

export default ManagersList;