import React, { useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import './RestaurantForm.css';

const RestaurantForm = () => {
  const { restaurantID } = useParams();
  const location = useLocation();
  const restaurantName = location.state?.restaurantName;
  const navigate = useNavigate();

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
  const [industry, setIndustry] = useState('');
  const [otherIndustry, setOtherIndustry] = useState('');

  const availableTags = [
    "Good Management",
    "Bad Management",
    "Good Scheduling",
    "Bad Scheduling",
    "Good Pay",
    "Low Pay"
  ];

  const industries = [
    "Service",
    "Retail",
    "Healthcare",
    "Labor",
    "Entertainment",
    "Corporate",
    "Other"
  ];

  const handleStarClick = (category, starValue, isHalf) => {
    const newValue = isHalf ? starValue - 0.5 : starValue;
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

  const handleIndustryClick = (selectedIndustry) => {
    setIndustry(selectedIndustry);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

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
    if (!industry) {
      alert('Please select an industry category');
      return;
    }
    if (industry === 'Other' && !otherIndustry.trim()) {
      alert('Please specify the industry');
      return;
    }

    // Get existing ratings from localStorage
    const savedRatings = localStorage.getItem('restaurantRatings');
    const allRatings = savedRatings ? JSON.parse(savedRatings) : {};
    const existingRatings = allRatings[restaurantID] || [];

    const newRating = {
      id: existingRatings.length > 0 ? Math.max(...existingRatings.map(r => r.id)) + 1 : 1,
      teamEnvironment: ratings.teamEnvironment,
      shiftAvailability: ratings.shiftAvailability,
      pay: ratings.pay,
      staffWorkloadRatio: ratings.staffWorkloadRatio,
      wouldRecommend,
      comment: comment.trim(),
      date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
      position: position.trim(),
      duration: duration.trim(),
      industry: industry === 'Other' ? otherIndustry.trim() : industry,
      tags: selectedTags
    };

    allRatings[restaurantID] = [...existingRatings, newRating];
    localStorage.setItem('restaurantRatings', JSON.stringify(allRatings));

    alert('Rating submitted successfully!');
    navigate(`/restaurant/${restaurantID}`, { state: { restaurantName } });
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
            onClick={() => handleStarClick(category, i, false)}
            onDoubleClick={() => handleStarClick(category, i, true)}
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
                  placeholder="e.g., Server, Host, Bartender"
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                />
              </div>
              <div className="inputGroup">
                <label>Duration</label>
                <input
                  type="text"
                  placeholder="e.g., 6 months, 2 years"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Industry Category */}
          <div className="formSection">
            <h2>Industry Category</h2>
            <div className="industryContainer">
              {industries.map((ind) => (
                <button
                  key={ind}
                  type="button"
                  className={`industry-button ${industry === ind ? 'selected' : ''}`}
                  onClick={() => handleIndustryClick(ind)}
                >
                  {ind}
                </button>
              ))}
            </div>
            {industry === 'Other' && (
              <div className="otherIndustryInput">
                <input
                  type="text"
                  placeholder="Please specify industry"
                  value={otherIndustry}
                  onChange={(e) => setOtherIndustry(e.target.value)}
                />
              </div>
            )}
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
            <button type="submit" className="submitBtn">Submit Rating</button>
            <button type="button" className="cancelBtn" onClick={handleCancel}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RestaurantForm;