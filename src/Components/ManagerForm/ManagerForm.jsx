import React, { useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../authContext';
import AuthModal from '../AuthModal/AuthModal';
import './ManagerForm.css';

const ManagerForm = () => {
  const { managerID } = useParams();
  const location = useLocation();
  const managerName = location.state?.managerName;
  const navigate = useNavigate();
  const { user } = useAuth();

  const [ratings, setRatings] = useState({
    communication: 0,
    fairness: 0,
    approachability: 0,
    organization: 0
  });

  const [selectedTags, setSelectedTags] = useState([]);
  const [comment, setComment] = useState('');
  const [wouldRecommend, setWouldRecommend] = useState(null);
  const [position, setPosition] = useState('');
  const [duration, setDuration] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const availableTags = [
    "Good Scheduling",
    "Bad Scheduling",
    "Low Workload",
    "Good Pay",
    "Poor Communication"
  ];

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

    // Check if user is logged in
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    // Validation
    if (Object.values(ratings).some(rating => rating === 0)) {
      alert('Please rate all categories');
      return;
    }
    if (wouldRecommend === null) {
      alert('Please indicate if you would recommend this manager');
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
      .from('manager_ratings')
      .insert([
        {
          manager_id: parseInt(managerID),
          communication: ratings.communication,
          fairness: ratings.fairness,
          approachability: ratings.approachability,
          organization: ratings.organization,
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

    alert('Rating submitted successfully!');
    navigate(`/rate/${managerID}`, { state: { managerName } });
  };

  const handleCancel = () => {
    navigate(`/rate/${managerID}`, { state: { managerName } });
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
    <div className="managerFormPage">
      <div className="formContainer">
        <div className="formHeader">
          <h1>Rate {managerName}</h1>
          <p className="restaurantName">Barcelona Wine Bar</p>
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
            <h2>Rate Your Manager</h2>
            
            <div className="ratingCategory">
              <label>Communication</label>
              <div className="stars-row">
                {renderStars('communication')}
              </div>
              <span className="rating-value">{ratings.communication}/5</span>
            </div>

            <div className="ratingCategory">
              <label>Fairness</label>
              <div className="stars-row">
                {renderStars('fairness')}
              </div>
              <span className="rating-value">{ratings.fairness}/5</span>
            </div>

            <div className="ratingCategory">
              <label>Approachability</label>
              <div className="stars-row">
                {renderStars('approachability')}
              </div>
              <span className="rating-value">{ratings.approachability}/5</span>
            </div>

            <div className="ratingCategory">
              <label>Organization</label>
              <div className="stars-row">
                {renderStars('organization')}
              </div>
              <span className="rating-value">{ratings.organization}/5</span>
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
            <h2>Would you recommend this manager? <span className="required">*</span></h2>
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
              placeholder="Share your experience working with this manager..."
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

export default ManagerForm;