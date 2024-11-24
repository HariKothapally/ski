import React, { useState, useEffect } from 'react';
import { supplierService } from '../../services/api/services';
import { Toast } from 'bootstrap';

const SupplierManagement = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    contact: '',
    email: '',
    phone: '',
    address: '',
    contractStatus: 'active',
    notes: ''
  });

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const data = await supplierService.getAll();
      setSuppliers(data);
    } catch (error) {
      showToast(error.message, 'danger');
    } finally {
      setLoading(false);
    }
  };

  const handleAddEdit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await supplierService.update(editingId, formData);
        showToast('Supplier updated successfully', 'success');
      } else {
        await supplierService.create(formData);
        showToast('Supplier added successfully', 'success');
      }
      setIsModalVisible(false);
      resetForm();
      fetchSuppliers();
    } catch (error) {
      showToast(error.message, 'danger');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this supplier?')) {
      try {
        await supplierService.delete(id);
        showToast('Supplier deleted successfully', 'success');
        fetchSuppliers();
      } catch (error) {
        showToast(error.message, 'danger');
      }
    }
  };

  const showToast = (message, type) => {
    const toastLiveExample = document.getElementById('liveToast');
    const toastBootstrap = Toast.getOrCreateInstance(toastLiveExample);
    const toastBody = document.querySelector('.toast-body');
    const toastHeader = document.querySelector('.toast-header strong');
    
    toastHeader.textContent = type === 'success' ? 'Success' : 'Error';
    toastBody.textContent = message;
    toastLiveExample.className = `toast align-items-center text-white bg-${type} border-0`;
    toastBootstrap.show();
  };

  const resetForm = () => {
    setFormData({
      name: '',
      contact: '',
      email: '',
      phone: '',
      address: '',
      contractStatus: 'active',
      notes: ''
    });
    setEditingId(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const editSupplier = (supplier) => {
    setEditingId(supplier._id);
    setFormData({
      name: supplier.name,
      contact: supplier.contact,
      email: supplier.email,
      phone: supplier.phone,
      address: supplier.address,
      contractStatus: supplier.contractStatus,
      notes: supplier.notes
    });
    setIsModalVisible(true);
  };

  const getContractBadgeColor = (status) => {
    switch (status) {
      case 'terminated':
        return 'danger';
      case 'pending':
        return 'warning';
      case 'active':
      default:
        return 'success';
    }
  };

  return (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">Supplier Management</h2>
        <button
          className="btn btn-primary"
          onClick={() => {
            resetForm();
            setIsModalVisible(true);
          }}
        >
          <i className="bi bi-plus-lg me-2"></i>
          Add Supplier
        </button>
      </div>

      {/* Suppliers Table */}
      <div className="card border-0 shadow-sm">
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-hover align-middle">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Contact Info</th>
                  <th>Contract Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="4" className="text-center py-4">
                      <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                    </td>
                  </tr>
                ) : suppliers.map((supplier) => (
                  <tr key={supplier._id}>
                    <td>{supplier.name}</td>
                    <td>
                      <div>
                        <i className="bi bi-person me-2"></i>
                        {supplier.contact}
                      </div>
                      <div>
                        <i className="bi bi-envelope me-2"></i>
                        {supplier.email}
                      </div>
                      <div>
                        <i className="bi bi-telephone me-2"></i>
                        {supplier.phone}
                      </div>
                    </td>
                    <td>
                      <span className={`badge bg-${getContractBadgeColor(supplier.contractStatus)}`}>
                        {supplier.contractStatus.charAt(0).toUpperCase() + supplier.contractStatus.slice(1)}
                      </span>
                    </td>
                    <td>
                      <div className="btn-group">
                        <button
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => editSupplier(supplier)}
                        >
                          <i className="bi bi-pencil"></i>
                        </button>
                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => handleDelete(supplier._id)}
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!loading && suppliers.length === 0 && (
                  <tr>
                    <td colSpan="4" className="text-center py-4">
                      No suppliers found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add/Edit Modal */}
      <div
        className={`modal fade ${isModalVisible ? 'show' : ''}`}
        tabIndex="-1"
        style={{ display: isModalVisible ? 'block' : 'none' }}
      >
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">
                {editingId ? 'Edit Supplier' : 'Add Supplier'}
              </h5>
              <button
                type="button"
                className="btn-close"
                onClick={() => {
                  setIsModalVisible(false);
                  resetForm();
                }}
              ></button>
            </div>
            <form onSubmit={handleAddEdit}>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Name</label>
                  <input
                    type="text"
                    className="form-control"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Contact</label>
                  <input
                    type="text"
                    className="form-control"
                    name="contact"
                    value={formData.contact}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    className="form-control"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Phone</label>
                  <input
                    type="tel"
                    className="form-control"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Address</label>
                  <textarea
                    className="form-control"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    rows="2"
                  ></textarea>
                </div>
                <div className="mb-3">
                  <label className="form-label">Contract Status</label>
                  <select
                    className="form-select"
                    name="contractStatus"
                    value={formData.contractStatus}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="active">Active</option>
                    <option value="pending">Pending</option>
                    <option value="terminated">Terminated</option>
                  </select>
                </div>
                <div className="mb-3">
                  <label className="form-label">Notes</label>
                  <textarea
                    className="form-control"
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    rows="3"
                  ></textarea>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setIsModalVisible(false);
                    resetForm();
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingId ? 'Update' : 'Add'} Supplier
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Modal Backdrop */}
      {isModalVisible && (
        <div className="modal-backdrop fade show"></div>
      )}

      {/* Toast */}
      <div className="toast-container position-fixed bottom-0 end-0 p-3">
        <div
          id="liveToast"
          className="toast align-items-center text-white border-0"
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

export default SupplierManagement;
