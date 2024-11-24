import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Shopping = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const apiBaseUrl = import.meta.env.VITE_APIBASEURL;

  useEffect(() => {
    fetchShoppingItems();
  }, []);

  const fetchShoppingItems = async () => {
    try {
      setLoading(true);
      const authToken = localStorage.getItem('authToken');
      const response = await axios.get(`${apiBaseUrl}/api/shopping`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      setItems(response.data);
      setError("");
    } catch (error) {
      console.error("Error fetching shopping items:", error);
      setError("Failed to fetch shopping items");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mt-4">
      <div className="card">
        <div className="card-header">
          <h4 className="mb-0">Shopping List</h4>
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
                    <th style={{ width: '30%' }}>Item</th>
                    <th style={{ width: '15%' }}>Quantity</th>
                    <th style={{ width: '15%' }}>Unit</th>
                    <th style={{ width: '20%' }}>Status</th>
                    <th style={{ width: '20%' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => (
                    <tr key={index}>
                      <td>{item.name}</td>
                      <td className="text-end">{item.quantity}</td>
                      <td>{item.unit}</td>
                      <td>{item.status}</td>
                      <td>
                        <button className="btn btn-primary btn-sm me-2">Edit</button>
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

export default Shopping;
