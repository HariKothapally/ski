import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ShoppingBillComponent = () => {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const apiBaseUrl = import.meta.env.VITE_APIBASEURL;

  useEffect(() => {
    fetchShoppingBills();
  }, []);

  const fetchShoppingBills = async () => {
    try {
      setLoading(true);
      const authToken = localStorage.getItem('authToken');
      const response = await axios.get(`${apiBaseUrl}/api/shopping/bills`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      setBills(response.data);
      setError("");
    } catch (error) {
      console.error("Error fetching shopping bills:", error);
      setError("Failed to fetch shopping bills");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mt-4">
      <div className="card">
        <div className="card-header">
          <h4 className="mb-0">Shopping Bills</h4>
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
                    <th style={{ width: '20%' }}>Bill Date</th>
                    <th style={{ width: '20%' }}>Bill Number</th>
                    <th style={{ width: '20%' }}>Total Amount</th>
                    <th style={{ width: '20%' }}>Status</th>
                    <th style={{ width: '20%' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {bills.map((bill, index) => (
                    <tr key={index}>
                      <td>{new Date(bill.date).toLocaleDateString()}</td>
                      <td>{bill.billNumber}</td>
                      <td className="text-end">
                        <div style={{ 
                          display: 'flex',
                          border: '1px solid #ced4da',
                          borderRadius: '4px',
                          overflow: 'hidden',
                          backgroundColor: '#f8f9fa'
                        }}>
                          <div style={{ 
                            padding: '6px 8px',
                            fontSize: '1rem',
                            lineHeight: '1.5',
                            display: 'flex',
                            alignItems: 'center',
                            borderRight: '1px solid #ced4da'
                          }}>₹</div>
                          <input
                            type="text"
                            style={{ 
                              textAlign: 'right',
                              border: 'none',
                              padding: '6px 12px',
                              width: '100%',
                              backgroundColor: '#f8f9fa',
                              outline: 'none'
                            }}
                            value={bill.totalAmount.toFixed(2)}
                            readOnly
                          />
                        </div>
                      </td>
                      <td>{bill.status}</td>
                      <td>
                        <button className="btn btn-primary btn-sm me-2">View</button>
                        <button className="btn btn-danger btn-sm">Delete</button>
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

export default ShoppingBillComponent;
