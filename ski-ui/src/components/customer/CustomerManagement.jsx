import React, { useState, useEffect } from 'react';
import { customerService } from '../../services/services';
import { Toast } from 'bootstrap';

const CustomerManagement = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    membershipTier: 'regular',
    preferences: '',
    allergies: '',
    notes: ''
  });
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const data = await customerService.getAll();
      setCustomers(data);
    } catch (error) {
      showToast(error.message, 'danger');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message, type = 'success') => {
    const toastEl = document.getElementById('customerToast');
    const toast = new Toast(toastEl);
    toastEl.querySelector('.toast-body').textContent = message;
    toastEl.className = `toast align-items-center text-white bg-${type} border-0`;
    toast.show();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await customerService.update(editingId, formData);
        showToast('Customer updated successfully');
      } else {
        await customerService.create(formData);
        showToast('Customer added successfully');
      }
      setShowModal(false);
      resetForm();
      fetchCustomers();
    } catch (error) {
      showToast(error.message, 'danger');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this customer?')) {
      try {
        await customerService.delete(id);
        showToast('Customer deleted successfully');
        fetchCustomers();
      } catch (error) {
        showToast(error.message, 'danger');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      address: '',
      membershipTier: 'regular',
      preferences: '',
      allergies: '',
      notes: ''
    });
    setEditingId(null);
  };

  const handleEdit = (customer) => {
    setFormData({
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      address: customer.address,
      membershipTier: customer.membershipTier,
      preferences: customer.preferences,
      allergies: customer.allergies,
      notes: customer.notes
    });
    setEditingId(customer.id);
    setShowModal(true);
  };

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone.includes(searchTerm)
  );

  const getMembershipBadgeColor = (tier) => {
    switch (tier) {
      case 'vip':
        return 'warning';
      case 'premium':
        return 'info';
      case 'regular':
      default:
        return 'secondary';
    }
  };

  return (
    <div className="container-fluid px-4 py-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="h4 mb-0">
          <i className="bi bi-people me-2"></i>
          Customer Management
        </h2>
        <button
          className="btn btn-primary"
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
        >
          <i className="bi bi-plus-lg me-2"></i>
          Add Customer
        </button>
      </div>

      {/* Search Bar */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body">
          <div className="input-group">
            <span className="input-group-text bg-transparent border-end-0">
              <i className="bi bi-search"></i>
            </span>
            <input
              type="text"
              className="form-control border-start-0"
              placeholder="Search customers by name, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Customers Table */}
      <div className="card shadow-sm">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="bg-light">
                <tr>
                  <th className="px-4">Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Address</th>
                  <th>Membership</th>
                  <th>Preferences</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="7" className="text-center py-4">
                      <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-4">
                      <i className="bi bi-inbox text-muted fs-1 d-block mb-2"></i>
                      No customers found
                    </td>
                  </tr>
                ) : (
                  filteredCustomers.map((customer) => (
                    <tr key={customer.id}>
                      <td className="px-4">
                        <div className="d-flex align-items-center">
                          <div>
                            <div className="fw-medium">{customer.name}</div>
                            <small className="text-muted">{customer.email}</small>
                          </div>
                        </div>
                      </td>
                      <td>{customer.email}</td>
                      <td>{customer.phone}</td>
                      <td>{customer.address}</td>
                      <td>
                        <span className={`badge bg-${getMembershipBadgeColor(customer.membershipTier)}`}>
                          {customer.membershipTier.toUpperCase()}
                        </span>
                      </td>
                      <td>
                        {customer.preferences && (
                          <div className="mb-1">
                            <small className="text-muted">Preferences:</small>
                            <br />
                            {customer.preferences}
                          </div>
                        )}
                        {customer.allergies && (
                          <div>
                            <small className="text-danger">Allergies:</small>
                            <br />
                            {customer.allergies}
                          </div>
                        )}
                      </td>
                      <td className="text-end px-4">
                        <button
                          className="btn btn-sm btn-outline-primary me-2"
                          onClick={() => handleEdit(customer)}
                        >
                          <i className="bi bi-pencil me-2"></i>
                          <span className="d-none d-sm-inline">Edit</span>
                        </button>
                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => handleDelete(customer.id)}
                        >
                          <i className="bi bi-trash me-2"></i>
                          <span className="d-none d-sm-inline">Delete</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add/Edit Modal */}
      <div
        className="modal fade"
        id="customerModal"
        tabIndex="-1"
        aria-labelledby="customerModalLabel"
        aria-hidden="true"
        show={showModal}
      >
        <div className="modal-dialog modal-lg modal-dialog-scrollable">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id="customerModalLabel">
                {editingId ? 'Edit Customer' : 'Add Customer'}
              </h5>
              <button
                type="button"
                className="btn-close"
                onClick={() => setShowModal(false)}
                aria-label="Close"
              ></button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleSubmit} className="row g-3">
                <div className="col-md-6">
                  <label className="form-label">Name</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    className="form-control"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Phone</label>
                  <input
                    type="tel"
                    className="form-control"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    required
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Address</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    required
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Membership Tier</label>
                  <select
                    className="form-select"
                    value={formData.membershipTier}
                    onChange={(e) => setFormData({ ...formData, membershipTier: e.target.value })}
                    required
                  >
                    <option value="regular">Regular</option>
                    <option value="premium">Premium</option>
                    <option value="vip">VIP</option>
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="form-label">Preferences</label>
                  <textarea
                    className="form-control"
                    value={formData.preferences}
                    onChange={(e) => setFormData({ ...formData, preferences: e.target.value })}
                    rows="3"
                    placeholder="Dietary preferences, favorite dishes, etc."
                  ></textarea>
                </div>
                <div className="col-md-6">
                  <label className="form-label">Allergies</label>
                  <textarea
                    className="form-control"
                    value={formData.allergies}
                    onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                    rows="3"
                    placeholder="Food allergies and restrictions"
                  ></textarea>
                </div>
                <div className="col-12">
                  <label className="form-label">Notes</label>
                  <textarea
                    className="form-control"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows="3"
                  ></textarea>
                </div>
              </form>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowModal(false)}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" onClick={handleSubmit}>
                {editingId ? 'Update' : 'Add'} Customer
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      <div className="toast-container position-fixed bottom-0 end-0 p-3">
        <div
          id="customerToast"
          className="toast align-items-center text-white bg-success border-0"
          role="alert"
          aria-live="assertive"
          aria-atomic="true"
        >
          <div className="d-flex">
            <div className="toast-body"></div>
            <button
              type="button"
              className="btn-close btn-close-white me-2 m-auto"
              data-bs-dismiss="toast"
              aria-label="Close"
            ></button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerManagement;
