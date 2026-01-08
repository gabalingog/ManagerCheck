import React, { useEffect, useState } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import './RateManager.css'
import { queryAllByAltText } from '@testing-library/dom';

const RateManager = () => {
  // get ID from url
  const { managerID } = useParams();
  // get name from navigation
  const location = useLocation();
  const managerName = location.state?.managerName;
  const navigate = useNavigate();

  // rating form
  const [communication, setCommunication] = useState(0);
  const [fairness, setFairness] = useState(0);
  const [approachability, setApproachability] = useState(0);
  const [organization, setOrganization] = useState(0);
  const [wouldRecommend, setWouldRecommend] = useState(null);
  const [comment, setComment] = useState('');

  const goHome = () => {
    navigate('/');
  }

  // localstorage of data
  const [allRatings, setAllRatings] = useState(() => {
    const savedRatings = localStorage.getItem('managerRatings');
    if (savedRatings) {
      return JSON.parse(savedRatings);
    } else {
      return {
        '1': [ // for first person (Gab)
          {
            id: 1,
            communication: 5,
            fairness: 4,
            approachability: 3,
            organization: 5,
            wouldRecommend: true,
            comment: "Great!",
            date: "January 7, 2026"
          },
          {
            id: 2,
            communication: 3,
            fairness: 2,
            approachability: 3,
            organization: 3,
            wouldRecommend: false,
            comment: "Not decent...",
            date: "January 6, 2026"
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
            comment: "Excellent!",
            date: "January 5, 2026"
          }
        ]
      };
    }
  });

  // save ratings
  useEffect(() => {
    localStorage.setItem('managerRatings', JSON.stringify(allRatings));
  }, [allRatings]);

  // raitings for current manager
  const existingRatings = allRatings[managerID] || [];

  // average ratings
  const calAverage = (quality) => {
    if (existingRatings.length === 0) return 0;
    const sum = existingRatings.reduce((acc, rating) => acc + rating[quality], 0);
    return (sum / existingRatings.length).toFixed(1);
  };

  // overall rating
  const overallRating = existingRatings.length > 0 ? (
    (parseFloat(calAverage('communication')) +
    parseFloat(calAverage('fairness')) + 
    parseFloat(calAverage('approachability')) +
    parseFloat(calAverage('organization'))) / 4
  ).toFixed(1) : 0;

  const recoPercent = existingRatings.length > 0 ? Math.round(
    (existingRatings.filter(r => r.wouldRecommend).length / existingRatings.length)
  ) : 0;

  // runs to submit rating
  const submitRating = (e) => {
    e.preventDefault();
    // check if all are filled
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
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year:'numeric'})
    };

    // add rating to manager's rating
    setAllRatings(prevRatings => ({
      ...prevRatings,
      [managerID]: [...(prevRatings[managerID] || []), newRating]
    }));

    // reset form
    setCommunication(0);
    setFairness(0);
    setApproachability(0);
    setOrganization(0);
    setWouldRecommend(null);
    setComment('');

    alert('Rating submitted successfully!');
  };

  const ratingStars = ({ rating, setRating, label }) => {
    return (
      <div className="ratingRow">
        <label>{label}</label>
        <div className="stars">
          {[1, 2, 3, 4, 5].map((star) => (
            <span
              key={star}
              className={`star ${rating >= star ? 'filled' : ''}`}
              onClick={() => setRating(star)}
            >★</span>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className='rateManagerPage'> 
      <div className="home">
        <button onClick={goHome}>Home</button>
      </div>

      <div className="header">
        <div className="managerInfo">
          <span>{managerName}</span>
          <p className="resName">Barcelona Wine Bar</p>
          <p className="resLoc">Boston, MA</p>
        </div>

        <div className="ratingSummary">
          <div className="overallRating">
            <div className="rateNum">{overallRating}</div>
            <div className="rateLabel">Overall Rating</div>
            <div className="rateTotal">{existingRatings.length} ratings</div>
          </div>
          <div className="recoStats">
            <div className="recoNum">{recoPercent}%</div>
            <div className="recoLabel">Would recommend</div>
          </div>
        </div>
      </div>

      {existingRatings.length > 0 && (
        <div className="rateBreakdown">
          <div className="breakdownItems">
            <span className="breakdownLabel">Communication</span>
            <div className="breakdownBar">
              <div className="breakdownFill"
                style={{width: `${(calAverage('communication') / 5) * 100}%`}}></div>
            </div>
            <span className="breakdownNum">{calAverage('communication')}</span>
          </div>
        </div>
      )}

      <div className="contentCont">
        <div className="ratingsList">
          <span>Manager Ratings</span>
          {existingRatings.length === 0 ? (
            <div className="noRatings">
              <p>No ratings yet. Be the first to rate {managerName}</p>
            </div>
          ) : (
            existingRatings.map((rating) => (
              <div key={rating.id} className='rating Card'>
                <div className='ratingCardHeader'>
                  <div className='qualityRatings'>
                    <span className='qualityTag'>Communication: {rating.communication}/5</span>
                    {/* others */}
                  </div>
                  <span className='ratingDate'>{rating.date}</span>
                </div>
                {/* would recommend */}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

export default RateManager
 