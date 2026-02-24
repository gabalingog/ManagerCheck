import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from './../../supabaseClient';
import { useAuth } from './../../authContext';
import AuthModal from '../AuthModal/AuthModal';
import './RestaurantForm.css';

const RestaurantForm = () => {
  const { restaurantID } = useParams();
  const location = useLocation();
  const restaurantName = location.state?.restaurantName;
  const navigate = useNavigate();
  const { user } = useAuth();

  const [showAuthModal, setShowAuthModal] = useState(false);

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

  const availableTags = [
    "Good Management", "Bad Management",
    "Good Scheduling", "Bad Scheduling",
    "Good Pay", "Low Pay"
  ];

  useEffect(() => {
    if (!user) setShowAuthModal(true);
  }, [user]);

  const handleStarClick = (category, starValue, event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const isLeftHalf = (event.clientX - rect.left) < rect.width / 2;
    const newValue = isLeftHalf ? starValue - 0.5 : starValue;
    setRatings(prev => ({ ...prev, [category]: prev[category] === newValue ? 0 : newValue }));
  };

  const handleTagClick = (tag) => {
    setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) { setShowAuthModal(true); return; }

    if (Object.values(ratings).some(r => r === 0)) { alert('Please rate all categories'); return; }
    if (wouldRecommend === null) { alert('Please indicate if you would recommend this restaurant'); return; }
    if (!comment.trim()) { alert('Please provide a comment'); return; }
    if (!position.trim() || !duration.trim()) { alert('Please provide your position and duration'); return; }

    const newRating = {
      restaurant_id: parseInt(restaurantID),
      user_id: user.id,
      team_environment: ratings.teamEnvironment,
      shift_availability: ratings.shiftAvailability,
      pay: ratings.pay,
      staff_workload_ratio: ratings.staffWorkloadRatio,
      would_recommend: wouldRecommend,
      comment: comment.trim(),
      date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
      position: position.trim(),
      duration: duration.trim(),
      tags: selectedTags,
      likes: 0,
      dislikes: 0
    };

    console.log('Submitting as user:', user.id);
    console.log('Payload:', newRating);

    const { error } = await supabase.from('restaurant_ratings').insert([newRating]);

    if (error) {
      console.error('Supabase error:', error);
      alert(`Submit failed: ${error.message}\n\nCode: ${error.code}\nDetails: ${error.details}`);
    } else {
      alert('Rating submitted successfully!');
      navigate(`/restaurant/${restaurantID}`, { state: { restaurantName } });
    }
  };

  const handleCancel = () => navigate(`/restaurant/${restaurantID}`, { state: { restaurantName } });

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
    <div className="restaurantFormPage">
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => { setShowAuthModal(false); if (!user) handleCancel(); }}
        mode="signin"
      />

      {user && (
        <div className="formContainer">
          <div className="formHeader">
            <span className="formEyebrow">Leave a Review</span>
            <h1>{restaurantName}</h1>
            <p className="locationName">Boston, MA</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="formSection">
              <h2>Your Role</h2>
              <div className="inputRow">
                <div className="inputGroup">
                  <label>Position</label>
                  <input type="text" placeholder="e.g. Server" value={position} onChange={(e) => setPosition(e.target.value)} />
                </div>
                <div className="inputGroup">
                  <label>Duration</label>
                  <input type="text" placeholder="e.g. 2 years" value={duration} onChange={(e) => setDuration(e.target.value)} />
                </div>
              </div>
            </div>

            <div className="formSection">
              <h2>Rate This Workplace</h2>
              {[
                { key: 'teamEnvironment', label: 'Team Environment' },
                { key: 'shiftAvailability', label: 'Shift Availability / Avg Hours' },
                { key: 'pay', label: 'Pay' },
                { key: 'staffWorkloadRatio', label: 'Staff-to-Workload Ratio' },
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
                  <button key={tag} type="button" className={`tag-button ${selectedTags.includes(tag) ? 'selected' : ''}`} onClick={() => handleTagClick(tag)}>
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            <div className="formSection">
              <h2>Would you recommend this workplace? <span className="required">*</span></h2>
              <div className="recommendButtons">
                <button type="button" className={`recommend-btn ${wouldRecommend === true ? 'selected' : ''}`} onClick={() => setWouldRecommend(true)}>Yes</button>
                <button type="button" className={`recommend-btn ${wouldRecommend === false ? 'selected' : ''}`} onClick={() => setWouldRecommend(false)}>No</button>
              </div>
            </div>

            <div className="formSection">
              <h2>Your Review</h2>
              <textarea className="commentBox" placeholder="Share your experience working at this restaurant…" value={comment} onChange={(e) => setComment(e.target.value)} rows="6" />
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

export default RestaurantForm;