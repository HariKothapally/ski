import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ShoppingReview = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const apiBaseUrl = import.meta.env.VITE_APIBASEURL;

  useEffect(() => {
    fetchShoppingReviews();
  }, []);

  const fetchShoppingReviews = async () => {
    try {
      setLoading(true);
      const authToken = localStorage.getItem('authToken');
      const response = await axios.get(`${apiBaseUrl}/api/shopping/reviews`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      setReviews(response.data);
      setError("");
    } catch (error) {
      console.error("Error fetching shopping reviews:", error);
      setError("Failed to fetch shopping reviews");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (reviewId) => {
    try {
      const authToken = localStorage.getItem('authToken');
      await axios.post(`${apiBaseUrl}/api/shopping/reviews/${reviewId}/approve`, {}, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      fetchShoppingReviews(); // Refresh the list
    } catch (error) {
      console.error("Error approving review:", error);
      setError("Failed to approve review");
    }
  };

  const handleReject = async (reviewId) => {
    try {
      const authToken = localStorage.getItem('authToken');
      await axios.post(`${apiBaseUrl}/api/shopping/reviews/${reviewId}/reject`, {}, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      fetchShoppingReviews(); // Refresh the list
    } catch (error) {
      console.error("Error rejecting review:", error);
      setError("Failed to reject review");
    }
  };

  return (
    <div className="container mt-4">
      <div className="card">
        <div className="card-header">
          <h4 className="mb-0">Shopping Reviews</h4>
        </div>
        <div className="card-body">
          {loading ? (
            <div className="text-center">
              <div className="spinner-border" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : error ? (
            <div className="alert alert-danger">{error}</div>
          ) : (
            <div className="table-responsive">
              <table className="table table-bordered table-hover align-middle">
                <thead className="table-light">
                  <tr>
                    <th style={{ width: '20%' }}>Date</th>
                    <th style={{ width: '20%' }}>Submitted By</th>
                    <th style={{ width: '20%' }}>Items Count</th>
                    <th style={{ width: '20%' }}>Status</th>
                    <th style={{ width: '20%' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {reviews.map((review, index) => (
                    <tr key={index}>
                      <td>{new Date(review.date).toLocaleDateString()}</td>
                      <td>{review.submittedBy}</td>
                      <td className="text-center">{review.itemsCount}</td>
                      <td>
                        <span className={`badge ${
                          review.status === 'Pending' ? 'bg-warning' :
                          review.status === 'Approved' ? 'bg-success' :
                          review.status === 'Rejected' ? 'bg-danger' : 'bg-secondary'
                        }`}>
                          {review.status}
                        </span>
                      </td>
                      <td>
                        {review.status === 'Pending' && (
                          <>
                            <button 
                              className="btn btn-success btn-sm me-2"
                              onClick={() => handleApprove(review.id)}
                            >
                              Approve
                            </button>
                            <button 
                              className="btn btn-danger btn-sm"
                              onClick={() => handleReject(review.id)}
                            >
                              Reject
                            </button>
                          </>
                        )}
                        {review.status !== 'Pending' && (
                          <button className="btn btn-primary btn-sm">View</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShoppingReview;
