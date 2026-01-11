import React, { useEffect, useState } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import './RateManager.css'

const RateManager = () => {
  const { managerID } = useParams();
  const location = useLocation();
  const managerName = location.state?.managerName;
  const navigate = useNavigate();

  const [communication, setCommunication] = useState(0);
  const [fairness, setFairness] = useState(0);
  const [approachability, setApproachability] = useState(0);
  const [organization, setOrganization] = useState(0);
  const [wouldRecommend, setWouldRecommend] = useState(null);
  const [comment, setComment] = useState('');

  const goHome = () => {
    navigate('/');
  }

  const [allRatings, setAllRatings] = useState(() => {
    const savedRatings = localStorage.getItem('managerRatings');
    if (savedRatings) {
      return JSON.parse(savedRatings);
    } else {
      return {
        '1': [
          {
            id: 1,
            communication: 5,
            fairness: 5,
            approachability: 5,
            organization: 5,
            wouldRecommend: true,
            comment: "Great manager! Very supportive and always available when you need help. Makes the work environment enjoyable.",
            date: "January 7, 2025",
            position: "Host",
            duration: "5 months",
            tags: ["Good Scheduling"]
          },
          {
            id: 2,
            communication: 4,
            fairness: 4,
            approachability: 4,
            organization: 4,
            wouldRecommend: true,
            comment: "Excellent leadership and communication skills. Fair with scheduling and always listens to concerns. Would definitely recommend working under this manager.",
            date: "January 6, 2025",
            position: "Server",
            duration: "2 years",
            tags: ["Good Scheduling"]
          },
          {
            id: 3,
            communication: 3,
            fairness: 2,
            approachability: 3,
            organization: 3,
            wouldRecommend: false,
            comment: "Could improve on fairness and organization. Sometimes plays favorites with scheduling.",
            date: "January 5, 2025",
            position: "Bartender",
            duration: "1 year",
            tags: ["Low Workload", "Good Pay"]
          },
          {
            id: 4,
            communication: 5,
            fairness: 4,
            approachability: 5,
            organization: 4,
            wouldRecommend: true,
            comment: "Very approachable and understanding. Easy to talk to about any issues or concerns.",
            date: "January 3, 2025",
            position: "Server",
            duration: "8 months",
            tags: ["Bad Scheduling"]
          },
          {
            id: 5,
            communication: 2,
            fairness: 3,
            approachability: 2,
            organization: 3,
            wouldRecommend: false,
            comment: "Lacks communication skills. Often doesn't relay important information to the team in a timely manner.",
            date: "December 28, 2024",
            position: "Host",
            duration: "4 months",
            tags: ["Low Workload"]
          }
        ],
        '2': [
          {
            id: 1,
            communication: 5,
            fairness: 5,
            approachability: 3,
            organization: 4,
            wouldRecommend: true,
            comment: "Excellent manager overall! Very organized and fair with everyone.",
            date: "January 5, 2025",
            position: "Host",
            duration: "3 months",
            tags: ["Good Pay"]
          }
        ]
      };
    }
  });

  useEffect(() => {
    localStorage.setItem('managerRatings', JSON.stringify(allRatings));
  }, [allRatings]);

  const existingRatings = allRatings[managerID] || [];

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

  const recoPercent = existingRatings.length > 0 ? Math.round(
    (existingRatings.filter(r => r.wouldRecommend).length / existingRatings.length) * 100
  ) : 0;

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

  const submitRating = (e) => {
    e.preventDefault();
    if (!communication || !fairness || !approachability || !organization || wouldRecommend === null || !comment.trim()) {
      alert('Please complete all fields before submitting');
      return;
    }

    const newRating = {
      id: existingRatings.length > 0 ? Math.max(...existingRatings.map(r => r.id)) + 1 : 1,
      communication,
      fairness,
      approachability,
      organization,
      wouldRecommend,
      comment: comment.trim(),
      date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year:'numeric'}),
      position: "Server",
      duration: "6 months",
      tags: []
    };

    setAllRatings(prevRatings => ({
      ...prevRatings,
      [managerID]: [...(prevRatings[managerID] || []), newRating]
    }));

    setCommunication(0);
    setFairness(0);
    setApproachability(0);
    setOrganization(0);
    setWouldRecommend(null);
    setComment('');

    alert('Rating submitted successfully!');
  };

  return (
    <div className='rateManagerPage'> 
      <div className="topBar">
        <div className="searchBarTop">
          <input type="text" placeholder="Search your restaurant" />
        </div>
        <button className="homeBtn" onClick={goHome}>Home</button>
      </div>

      <div className="header">
        <div className="managerInfo">
          <span className="managerName">{managerName}</span>
          <p className="resName">Barcelona Wine Bar</p>
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
          <button className="rateButton">Rate your manager</button>
        </div>
      </div>

      <div className="contentContainer">
        <div className="leftSection">
          {/* Rating Distribution */}
          <div className="ratingDistribution">
            {[5, 4, 3, 2, 1].map((num) => (
              <div key={num} className="distributionRow">
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

          {/* Summary Tags */}
          <div className="summaryTags">
            <h3>Summary</h3>
            <div className="tags">
              <span className="tag">Low Workload</span>
              <span className="tag">Good Pay</span>
              <span className="tag">Bad Scheduling</span>
            </div>
          </div>
        </div>

        <div className="rightSection">
          {/* Reviews List */}
          <div className="reviewsList">
            {existingRatings.length === 0 ? (
              <div className="noReviews">
                <p>No reviews yet. Be the first to review {managerName}!</p>
              </div>
            ) : (
              existingRatings.map((rating) => (
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
                    {rating.tags && rating.tags.map((tag, index) => (
                      <span key={index} className="reviewTag">{tag}</span>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default RateManager