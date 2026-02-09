import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../authContext';
import AuthModal from '../AuthModal/AuthModal';
import './RestaurantForm.css';

const RestaurantForm = () => {
  const { restaurantID } = useParams();
  const location = useLocation();
  const restaurantName = location.state?.restaurantName;
  const navigate = useNavigate();
  const { user } = useAuth();

  const [ratings, setRatings] = useState({
    teamEnvironment: 0,
    shiftAvailability: 0,
    pay: 0,
    staffWorkloadRatio: 0
  });

  const [selectedTags, setSelectedTags] = useState([]);
  const [comment, setComment] = useState('');
  const [wouldRecommend, setWouldRecommend] = useState(null);
  const [position, setPosition] = useState('');
  const [duration, setDuration] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const availableTags = [
    "Good Management",
    "Bad Management",
    "Good Scheduling",
    "Bad Scheduling",
    "Good Pay",
    "Low Pay"
  ];

  // Generate or retrieve user ID
  useEffect(() => {
    let userId = localStorage.getItem('tempUserId');
    if (!userId) {
      userId = 'user_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('tempUserId', userId);
    }
    setCurrentUserId(userId);
  }, []);

  const handleStarClick = (category, starValue, event) => {
    const starElement = event.currentTarget;
    const rect = starElement.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const starWidth = rect.width;
    
    const isLeftHalf = clickX < starWidth / 2;
    const newValue = isLeftHalf ? starValue - 0.5 : starValue;
    
    setRatings(prev => ({
      ...prev,
      [category]: prev[category] === newValue ? 0 : newValue
    }));
  };

  const handleTagClick = (tag) => {
    setSelectedTags(prev => {
      if (prev.includes(tag)) {
        return prev.filter(t => t !== tag);
      } else {
        return [...prev, tag];
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!currentUserId) {
      alert('Error: Could not generate user ID');
      return;
    }

    // Validation
    if (Object.values(ratings).some(rating => rating === 0)) {
      alert('Please rate all categories');
      return;
    }
    if (wouldRecommend === null) {
      alert('Please indicate if you would recommend this restaurant');
      return;
    }
    if (!comment.trim()) {
      alert('Please provide a comment');
      return;
    }
    if (!position.trim() || !duration.trim()) {
      alert('Please provide your position and duration');
      return;
    }

    setSubmitting(true);

    // Insert into Supabase
    const { data, error } = await supabase
      .from('restaurant_ratings')
      .insert([
        {
          restaurant_id: parseInt(restaurantID),
          team_environment: ratings.teamEnvironment,
          shift_availability: ratings.shiftAvailability,
          pay: ratings.pay,
          staff_workload_ratio: ratings.staffWorkloadRatio,
          would_recommend: wouldRecommend,
          comment: comment.trim(),
          position: position.trim(),
          duration: duration.trim(),
          tags: selectedTags,
          likes: 0,
          dislikes: 0
        }
      ])
      .select();

    setSubmitting(false);

    if (error) {
      console.error('Error inserting rating:', error);
      alert('Error submitting rating: ' + error.message);
      return;
    }

    if (error) {
      console.error('Error submitting rating:', error);
      alert('Failed to submit rating. Please try again.');
    } else {
      alert('Rating submitted successfully!');
      navigate(`/restaurant/${restaurantID}`, { state: { restaurantName } });
    }
  };

  const handleCancel = () => {
    navigate(`/restaurant/${restaurantID}`, { state: { restaurantName } });
  };

  const renderStars = (category) => {
    const currentRating = ratings[category];
    const stars = [];

    for (let i = 1; i <= 5; i++) {
      const isHalfFilled = currentRating === i - 0.5;
      const isFilled = currentRating >= i;

      stars.push(
        <div key={i} className="star-container">
          <span
            className={`star-whole ${isFilled ? 'filled' : isHalfFilled ? 'half-filled' : ''}`}
            onClick={(e) => handleStarClick(category, i, e)}
          >
            ★
          </span>
        </div>
      );
    }

    return stars;
  };

  return (
    <div className="restaurantFormPage">
      <div className="formContainer">
        <div className="formHeader">
          <h1>Rate {restaurantName}</h1>
          <p className="locationName">Boston, MA</p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Personal Information */}
          <div className="formSection">
            <div className="inputRow">
              <div className="inputGroup">
                <label>Position</label>
                <input
                  type="text"
                  placeholder="Server"
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                />
              </div>
              <div className="inputGroup">
                <label>Duration</label>
                <input
                  type="text"
                  placeholder="2 years"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Rating Categories */}
          <div className="formSection">
            <h2>Rate This Workplace</h2>
            
            <div className="ratingCategory">
              <label>Team Environment</label>
              <div className="stars-row">
                {renderStars('teamEnvironment')}
              </div>
              <span className="rating-value">{ratings.teamEnvironment}/5</span>
            </div>

            <div className="ratingCategory">
              <label>Shift Availability / Avg Hours</label>
              <div className="stars-row">
                {renderStars('shiftAvailability')}
              </div>
              <span className="rating-value">{ratings.shiftAvailability}/5</span>
            </div>

            <div className="ratingCategory">
              <label>Pay</label>
              <div className="stars-row">
                {renderStars('pay')}
              </div>
              <span className="rating-value">{ratings.pay}/5</span>
            </div>

            <div className="ratingCategory">
              <label>Staff-to-Workload Ratio</label>
              <div className="stars-row">
                {renderStars('staffWorkloadRatio')}
              </div>
              <span className="rating-value">{ratings.staffWorkloadRatio}/5</span>
            </div>
          </div>

          {/* Tags */}
          <div className="formSection">
            <h2>Select Tags (Optional)</h2>
            <div className="tagsContainer">
              {availableTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  className={`tag-button ${selectedTags.includes(tag) ? 'selected' : ''}`}
                  onClick={() => handleTagClick(tag)}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Recommendation */}
          <div className="formSection">
            <h2>Would you recommend this workplace? <span className="required">*</span></h2>
            <div className="recommendButtons">
              <button
                type="button"
                className={`recommend-btn ${wouldRecommend === true ? 'selected' : ''}`}
                onClick={() => setWouldRecommend(true)}
              >
                Yes
              </button>
              <button
                type="button"
                className={`recommend-btn ${wouldRecommend === false ? 'selected' : ''}`}
                onClick={() => setWouldRecommend(false)}
              >
                No
              </button>
            </div>
          </div>

          {/* Comment */}
          <div className="formSection">
            <h2>Your Review</h2>
            <textarea
              className="commentBox"
              placeholder="Share your experience working at this restaurant..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows="6"
            />
          </div>

          {/* Submit Buttons */}
          <div className="formActions">
            <button type="submit" className="submitBtn" disabled={submitting}>
              {submitting ? 'Submitting...' : 'Submit Rating'}
            </button>
            <button type="button" className="cancelBtn" onClick={handleCancel}>Cancel</button>
          </div>
        </form>
      </div>

      {/* Auth Modal */}
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)}
        mode="signup"
      />
    </div>
  );
};

export default RestaurantForm;