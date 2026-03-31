import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from './../../supabaseClient';
import { useAuth } from './../../authContext';
import AuthModal from '../AuthModal/AuthModal';
import './ManagerForm.css';

const ManagerForm = () => {
  const { managerID } = useParams();
  const location = useLocation();
  const managerName = location.state?.managerName;
  const navigate = useNavigate(); 
  const { user } = useAuth();

  const [showAuthModal, setShowAuthModal] = useState(false);

  const [ratings, setRatings] = useState({
    communication: 0,
    fairness: 0,
    approachability: 0,
    organization: 0
  });

  const [selectedTags, setSelectedTags] = useState([]);
  const [wouldRecommend, setWouldRecommend] = useState(null);
  const [position, setPosition] = useState('');
  const [duration, setDuration] = useState('');

  const availableTags = [
    "Good Scheduling",
    "Bad Scheduling",
    "Good Pay",
    "Low Pay",
    "Low Workload",
    "High Workload"
  ];

  // If user is not logged in, show auth modal immediately
  useEffect(() => {
    if (!user) {
      setShowAuthModal(true);
    }
  }, [user]);

  const handleStarClick = (category, starValue, event) => {
    const starElement = event.currentTarget;
    const rect = starElement.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const isLeftHalf = clickX < rect.width / 2;
    const newValue = isLeftHalf ? starValue - 0.5 : starValue;
    setRatings(prev => ({
      ...prev,
      [category]: prev[category] === newValue ? 0 : newValue
    }));
  };

  const handleTagClick = (tag) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Double-check auth at submit time
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    if (Object.values(ratings).some(r => r === 0)) {
      alert('Please rate all categories');
      return;
    }
    if (wouldRecommend === null) {
      alert('Please indicate if you would recommend this manager');
      return;
    }
    if (!position.trim() || !duration.trim()) {
      alert('Please provide your position and duration');
      return;
    }

    const newRating = {
      manager_id: parseInt(managerID),
      user_id: user.id,           // ← real Supabase user ID
      communication: ratings.communication,
      fairness: ratings.fairness,
      approachability: ratings.approachability,
      organization: ratings.organization,
      would_recommend: wouldRecommend,
      date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
      position: position.trim(),
      duration: duration.trim(),
      tags: selectedTags,
      likes: 0,
      dislikes: 0
    };

    const { error } = await supabase.from('manager_ratings').insert([newRating]);

    if (error) {
      console.error('Error submitting rating:', error);
      alert('Failed to submit rating. Please try again.');
    } else {
      alert('Rating submitted successfully!');
      navigate(`/rate/${managerID}`, { state: { managerName } });
    }
  };

  const handleCancel = () => {
    navigate(`/rate/${managerID}`, { state: { managerName } });
  };

  const renderStars = (category) => {
    const currentRating = ratings[category];
    return [1, 2, 3, 4, 5].map(i => {
      const isHalfFilled = currentRating === i - 0.5;
      const isFilled = currentRating >= i;
      return (
        <div key={i} className="star-container">
          <span
            className={`star-whole ${isFilled ? 'filled' : isHalfFilled ? 'half-filled' : ''}`}
            onClick={(e) => handleStarClick(category, i, e)}
          >★</span>
        </div>
      );
    });
  };

  return (
    <div className="managerFormPage">

      {/* Auth gate — shown if not logged in */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => {
          setShowAuthModal(false);
          // If they closed without logging in, send them back
          if (!user) handleCancel();
        }}
        mode="signin"
      />

      {/* Only render the form if logged in */}
      {user && (
        <div className="formContainer">

          <div className="formHeader">
            <span className="formEyebrow">Leave a Review</span>
            <h1>{managerName}</h1>
          </div>

          <form onSubmit={handleSubmit}>

            <div className="formSection">
              <h2>Your Role</h2>
              <div className="inputRow">
                <div className="inputGroup">
                  <label>Position</label>
                  <input
                    type="text"
                    placeholder="e.g. Server"
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                  />
                </div>
                <div className="inputGroup">
                  <label>Duration</label>
                  <input
                    type="text"
                    placeholder="e.g. 2 years"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="formSection">
              <h2>Rate This Manager</h2>
              {[
                { key: 'communication', label: 'Communication' },
                { key: 'fairness', label: 'Fairness' },
                { key: 'approachability', label: 'Approachability' },
                { key: 'organization', label: 'Organization' },
              ].map(({ key, label }) => (
                <div className="ratingCategory" key={key}>
                  <label>{label}</label>
                  <div className="stars-row">{renderStars(key)}</div>
                  <span className="rating-value">{ratings[key] || '—'}</span>
                </div>
              ))}
            </div>

            <div className="formSection">
              <h2>Tags (Optional)</h2>
              <div className="tagsContainer">
                {availableTags.map(tag => (
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

            <div className="formSection">
              <h2>Would you recommend this manager? <span className="required">*</span></h2>
              <div className="recommendButtons">
                <button
                  type="button"
                  className={`recommend-btn ${wouldRecommend === true ? 'selected' : ''}`}
                  onClick={() => setWouldRecommend(true)}
                >Yes</button>
                <button
                  type="button"
                  className={`recommend-btn ${wouldRecommend === false ? 'selected' : ''}`}
                  onClick={() => setWouldRecommend(false)}
                >No</button>
              </div>
            </div>

            <div className="formActions">
              <button type="submit" className="submitBtn">Submit Review</button>
              <button type="button" className="cancelBtn" onClick={handleCancel}>Cancel</button>
            </div>

          </form>
        </div>
      )}
    </div>
  );
};

export default ManagerForm;