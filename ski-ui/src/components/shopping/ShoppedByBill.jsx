import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ShoppedByBill = () => {
  const [bills, setBills] = useState([]);
  const [selectedBill, setSelectedBill] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const apiBaseUrl = import.meta.env.VITE_APIBASEURL;

  useEffect(() => {
    fetchShoppedBills();
  }, []);

  const fetchShoppedBills = async () => {
    try {
      setLoading(true);
      const authToken = localStorage.getItem('authToken');
      const response = await axios.get(`${apiBaseUrl}/api/shopping/shopped-bills`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      setBills(response.data);
      setError("");
    } catch (error) {
      console.error("Error fetching shopped bills:", error);
      setError("Failed to fetch shopped bills");
    } finally {
      setLoading(false);
    }
  };

  const fetchBillDetails = async (billId) => {
    try {
      setLoading(true);
      const authToken = localStorage.getItem('authToken');
      const response = await axios.get(`${apiBaseUrl}/api/shopping/shopped-bills/${billId}`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      setSelectedBill(response.data);
      setError("");
    } catch (error) {
      console.error("Error fetching bill details:", error);
      setError("Failed to fetch bill details");
    } finally {
      setLoading(false);
    }
  };

  const handleViewBill = (billId) => {
    fetchBillDetails(billId);
  };

  const handleCloseBillDetails = () => {
    setSelectedBill(null);
  };

  const renderBillDetails = () => {
    if (!selectedBill) return null;

    return (
      <div className="modal" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <div className="modal-dialog modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Bill Details - {selectedBill.billNumber}</h5>
              <button type="button" className="btn-close" onClick={handleCloseBillDetails}></button>
            </div>
            <div className="modal-body">
              <div className="row mb-3">
                <div className="col-md-6">
                  <strong>Date:</strong> {new Date(selectedBill.date).toLocaleDateString()}
                </div>
                <div className="col-md-6">
                  <strong>Status:</strong> {selectedBill.status}
                </div>
              </div>
              <div className="table-responsive">
                <table className="table table-bordered table-hover">
                  <thead className="table-light">
                    <tr>
                      <th>Item</th>
                      <th>Quantity</th>
                      <th>Unit</th>
                      <th>Unit Price</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedBill.items.map((item, index) => (
                      <tr key={index}>
                        <td>{item.name}</td>
                        <td className="text-end">{item.quantity}</td>
                        <td>{item.unit}</td>
                        <td className="text-end">₹{item.unitPrice.toFixed(2)}</td>
                        <td className="text-end">₹{(item.quantity * item.unitPrice).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="table-light">
                    <tr>
                      <td colSpan="4" className="text-end"><strong>Total Amount:</strong></td>
                      <td className="text-end"><strong>₹{selectedBill.totalAmount.toFixed(2)}</strong></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={handleCloseBillDetails}>
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="container mt-4">
      <div className="card">
        <div className="card-header">
          <h4 className="mb-0">Shopped Bills</h4>
        </div>
        <div className="card-body">
          {loading && !selectedBill ? (
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
                      <td>
                        <span className={`badge ${
                          bill.status === 'Pending' ? 'bg-warning' :
                          bill.status === 'Completed' ? 'bg-success' :
                          bill.status === 'Cancelled' ? 'bg-danger' : 'bg-secondary'
                        }`}>
                          {bill.status}
                        </span>
                      </td>
                      <td>
                        <button 
                          className="btn btn-primary btn-sm"
                          onClick={() => handleViewBill(bill.id)}
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      {renderBillDetails()}
    </div>
  );
};

export default ShoppedByBill;
