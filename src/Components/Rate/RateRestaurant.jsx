import React, { useEffect, useState } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import './RateRestaurant.css'

const RateRestaurant = () => {
  const { restaurantID } = useParams();
  const location = useLocation();
  const restaurantName = location.state?.restaurantName;
  const navigate = useNavigate();

  const [searchInput, setSearchInput] = useState('');
  const [filteredManagers, setFilteredManagers] = useState([]);
  const [managers, setManagers] = useState(() => {
    const savedManagers = localStorage.getItem('managers');
    return savedManagers ? JSON.parse(savedManagers) : [
      { id: 1, name: "Gab"},
      { id: 2, name: "Janelle"}
    ];
  });

  const goHome = () => {
    navigate('/');
  }

  const goToRatingForm = () => {
    navigate(`/restaurant/${restaurantID}/form`, { state: { restaurantName } });
  }

  const goToManagerLanding = () => {
    navigate('/');
  }

  const handleSearch = (e) => {
    const searched = e.target.value;
    setSearchInput(searched);

    if (searched.trim() === '') {
      setFilteredManagers([]);
    } else {
      const filtered = managers.filter(manager =>
        manager.name.toLowerCase().includes(searched.toLowerCase())
      );
      setFilteredManagers(filtered);
    }
  };

  const handleSelectManager = (manager) => {
    setSearchInput('');
    setFilteredManagers([]);
    navigate(`/rate/${manager.id}`, { state: { managerName: manager.name } });
  };

  const [allRatings, setAllRatings] = useState(() => {
    const savedRatings = localStorage.getItem('restaurantRatings');
    if (savedRatings) {
      return JSON.parse(savedRatings);
    } else {
      return {
        '1': [
          {
            id: 1,
            teamEnvironment: 5,
            shiftAvailability: 5,
            pay: 5,
            staffWorkloadRatio: 5,
            wouldRecommend: true,
            comment: "Amazing place to work! The team is incredibly supportive and management actually cares about work-life balance. Tips are great and shifts are flexible.",
            date: "January 7, 2025",
            position: "Server",
            duration: "2 years",
            tags: ["Good Pay", "Good Management"]
          },
          {
            id: 2,
            teamEnvironment: 4,
            shiftAvailability: 4,
            pay: 4,
            staffWorkloadRatio: 4,
            wouldRecommend: true,
            comment: "Solid workplace with a positive team culture. Good tips and reasonable scheduling. Would recommend to others looking for restaurant work.",
            date: "January 6, 2025",
            position: "Bartender",
            duration: "1 year",
            tags: ["Good Management", "Good Scheduling"]
          },
          {
            id: 3,
            teamEnvironment: 3,
            shiftAvailability: 2,
            pay: 3,
            staffWorkloadRatio: 3,
            wouldRecommend: false,
            comment: "Management could be better organized. Often understaffed during busy shifts which makes the work stressful. Pay is just okay.",
            date: "January 5, 2025",
            position: "Host",
            duration: "6 months",
            tags: ["Low Pay", "Bad Scheduling"]
          },
          {
            id: 4,
            teamEnvironment: 5,
            shiftAvailability: 4,
            pay: 5,
            staffWorkloadRatio: 4,
            wouldRecommend: true,
            comment: "Great restaurant with excellent team dynamics. Everyone helps each other out and the pay is competitive. Management is fair and listens to concerns.",
            date: "January 3, 2025",
            position: "Server",
            duration: "8 months",
            tags: ["Good Management", "Good Pay"]
          },
          {
            id: 5,
            teamEnvironment: 2,
            shiftAvailability: 3,
            pay: 2,
            staffWorkloadRatio: 3,
            wouldRecommend: false,
            comment: "High turnover and poor communication from management. The team environment suffers because of constant new hires. Pay is below average for the area.",
            date: "December 28, 2024",
            position: "Server",
            duration: "4 months",
            tags: ["Bad Scheduling", "Low Pay"]
          }
        ],
        '2': [
          {
            id: 1,
            teamEnvironment: 5,
            shiftAvailability: 5,
            pay: 3,
            staffWorkloadRatio: 4,
            wouldRecommend: true,
            comment: "Excellent team atmosphere! Everyone is friendly and helpful. Management values employee input and makes scheduling easy.",
            date: "January 5, 2025",
            position: "Bartender",
            duration: "3 months",
            tags: ["Good Management", "Good Scheduling"]
          }
        ]
      };
    }
  });

  useEffect(() => {
    localStorage.setItem('restaurantRatings', JSON.stringify(allRatings));
  }, [allRatings]);

  const existingRatings = allRatings[restaurantID] || [];

  const calAverage = (quality) => {
    if (existingRatings.length === 0) return 0;
    const sum = existingRatings.reduce((acc, rating) => acc + rating[quality], 0);
    return (sum / existingRatings.length).toFixed(1);
  };

  const overallRating = existingRatings.length > 0 ? (
    (parseFloat(calAverage('teamEnvironment')) +
    parseFloat(calAverage('shiftAvailability')) + 
    parseFloat(calAverage('pay')) +
    parseFloat(calAverage('staffWorkloadRatio'))) / 4
  ).toFixed(1) : 0;

  const getRatingDistribution = () => {
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    existingRatings.forEach(rating => {
      const avg = Math.round((rating.teamEnvironment + rating.shiftAvailability + rating.pay + rating.staffWorkloadRatio) / 4);
      distribution[avg]++;
    });
    return distribution;
  };

  const ratingDistribution = getRatingDistribution();
  const maxCount = Math.max(...Object.values(ratingDistribution));

  return (
    <div className='rateRestaurantPage'> 
      <div className="topBar">
        <h2 className="pageTitle">Rate restaurant managers</h2>
        <div className="searchBarTop">
          <input 
            type="text" 
            placeholder="Search for a manager" 
            value={searchInput}
            onChange={handleSearch}
          />
          {searchInput && filteredManagers.length > 0 && (
            <div className="searchDropdown">
              {filteredManagers.map((manager) => (
                <div
                  key={manager.id}
                  className="searchDropdownItem"
                  onClick={() => handleSelectManager(manager)}
                >
                  {manager.name}
                </div>
              ))}
            </div>
          )}
          {searchInput && filteredManagers.length === 0 && (
            <div className="searchDropdown">
              <div className="noResults">No managers found</div>
            </div>
          )}
        </div>
        <button className="homeBtn" onClick={goHome}>Home</button>
      </div>

      <div className="header">
        <div className="restaurantInfo">
          <span className="restaurantName">{restaurantName}</span>
          <p className="location">Modesto, California</p>
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
          <button className="rateButton" onClick={goToRatingForm}>Rate this restaurant</button>
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
              <span className="tag">Good Management</span>
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
                <p>No reviews yet. Be the first to review {restaurantName}!</p>
              </div>
            ) : (
              existingRatings.map((rating) => (
                <div key={rating.id} className="reviewCard">
                  <div className="reviewHeader">
                    <div className="stars">
                      {[1, 2, 3, 4, 5].map((star) => {
                        const avgRating = Math.round((rating.teamEnvironment + rating.shiftAvailability + rating.pay + rating.staffWorkloadRatio) / 4);
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

export default RateRestaurant