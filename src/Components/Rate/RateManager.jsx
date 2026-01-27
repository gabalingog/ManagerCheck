import React, { useEffect, useState } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '../../supabaseClient'
import { useAuth } from '../../authContext';
import AuthModal from '../AuthModal/AuthModal';
import './RateManager.css'

const RateManager = () => {
  const { managerID } = useParams();
  const location = useLocation();
  const managerName = location.state?.managerName;
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);

  const [manager, setManager] = useState(null);
  const [ratings, setRatings] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [reviewFilter, setReviewFilter] = useState('recent');
  const [ratingFilter, setRatingFilter] = useState(null);
  const [tagFilter, setTagFilter] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const reviewsPerPage = 10;

  // Fetch manager data
  useEffect(() => {
    const fetchManager = async () => {
      const { data, error } = await supabase
        .from('managers')
        .select(`
          *,
          restaurants (
            id,
            name,
            location
          )
        `)
        .eq('id', managerID)
        .single();

      if (error) {
        console.error('Error fetching manager:', error);
      } else {
        setManager(data);
      }
    };

    fetchManager();
  }, [managerID]);

  // Fetch ratings
  useEffect(() => {
    const fetchRatings = async () => {
      const { data, error } = await supabase
        .from('manager_ratings')
        .select('*')
        .eq('manager_id', managerID)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching ratings:', error);
      } else {
        setRatings(data || []);
      }
      setLoading(false);
    };

    fetchRatings();
  }, [managerID]);

  const handleVote = async (reviewId, voteType) => {
    const rating = ratings.find(r => r.id === reviewId);
    if (!rating) return;

    const likeDelta = voteType === 'like' ? 1 : 0;
    const dislikeDelta = voteType === 'dislike' ? 1 : 0;

    const { error } = await supabase
      .from('manager_ratings')
      .update({
        likes: (rating.likes || 0) + likeDelta,
        dislikes: (rating.dislikes || 0) + dislikeDelta
      })
      .eq('id', reviewId);

    if (error) {
      console.error('Error updating vote:', error);
      return;
    }

    const { data } = await supabase
      .from('manager_ratings')
      .select('*')
      .eq('manager_id', managerID)
      .order('created_at', { ascending: false });

    if (data) {
      setRatings(data);
    }
  };

  const goHome = () => navigate('/');
  
  const goToRatingForm = () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    navigate(`/rate/${managerID}/form`, { state: { managerName: manager?.name || managerName } });
  };

  const calAverage = (quality) => {
    if (ratings.length === 0) return 0;
    const sum = ratings.reduce((acc, rating) => acc + rating[quality], 0);
    return (sum / ratings.length).toFixed(1);
  };

  const overallRating = ratings.length > 0 ? (
    (parseFloat(calAverage('communication')) +
    parseFloat(calAverage('fairness')) + 
    parseFloat(calAverage('approachability')) +
    parseFloat(calAverage('organization'))) / 4
  ).toFixed(1) : 0;

  const getRatingDistribution = () => {
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    ratings.forEach(rating => {
      const avg = Math.round((rating.communication + rating.fairness + rating.approachability + rating.organization) / 4);
      distribution[avg]++;
    });
    return distribution;
  };

  const ratingDistribution = getRatingDistribution();
  const maxCount = Math.max(...Object.values(ratingDistribution));

  const getSortedReviews = () => {
    let reviews = [...ratings];
    
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
    }
    
    return reviews;
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

  useEffect(() => {
    setCurrentPage(1);
  }, [reviewFilter, ratingFilter, tagFilter]);

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className='rateManagerPage'> 
      <div className="topBar">
        <button className="homeBtn" onClick={goHome}>Home</button>
      </div>

      <div className="header">
        <div className="managerInfo">
          <span className="managerName">{manager?.name || managerName}</span>
          <p className="resName">{manager?.restaurants?.name || 'Restaurant'}</p>
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
            <div className="recoNum">{ratings.length}</div>
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
            {ratings.length === 0 ? (
              <div className="noReviews">
                <p>No reviews yet. Be the first to review {manager?.name || managerName}!</p>
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
                          className="voteButton"
                          onClick={() => handleVote(rating.id, 'like')}
                        >
                          <svg className="voteIcon" width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <path d="M8 3L12 7H9V13H7V7H4L8 3Z" fill="currentColor"/>
                          </svg>
                          <span className="voteCount">{rating.likes || 0}</span>
                        </button>
                        <button 
                          className="voteButton"
                          onClick={() => handleVote(rating.id, 'dislike')}
                        >
                          <svg className="voteIcon" width="16" height="16" viewBox="0 0 16 16" fill="none">
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
                      onClick={() => handlePageChange(currentPage - 1)}
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
                      onClick={() => handlePageChange(currentPage + 1)}
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

      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)}
        mode="signup"
      />
    </div>
  )
}

export default RateManager;