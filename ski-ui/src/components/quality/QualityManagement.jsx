import React, { useState, useEffect } from 'react';
import { qualityService } from '../../services/services';
import { Toast } from 'bootstrap';

const QualityManagement = () => {
  const [qualityChecks, setQualityChecks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    date: '',
    inspector: '',
    status: 'pending',
    notes: ''
  });

  useEffect(() => {
    fetchQualityChecks();
  }, []);

  const fetchQualityChecks = async () => {
    try {
      setLoading(true);
      const data = await qualityService.getAll();
      setQualityChecks(data);
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
        await qualityService.update(editingId, formData);
        showToast('Quality check updated successfully', 'success');
      } else {
        await qualityService.create(formData);
        showToast('Quality check added successfully', 'success');
      }
      setIsModalVisible(false);
      resetForm();
      fetchQualityChecks();
    } catch (error) {
      showToast(error.message, 'danger');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this quality check?')) {
      try {
        await qualityService.delete(id);
        showToast('Quality check deleted successfully', 'success');
        fetchQualityChecks();
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
      title: '',
      date: '',
      inspector: '',
      status: 'pending',
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

  const editCheck = (check) => {
    setEditingId(check._id);
    setFormData({
      title: check.title,
      date: check.date,
      inspector: check.inspector,
      status: check.status,
      notes: check.notes
    });
    setIsModalVisible(true);
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'failed':
        return 'danger';
      case 'pending':
      default:
        return 'warning';
    }
  };

  return (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">Quality Management</h2>
        <button
          className="btn btn-primary"
          onClick={() => {
            resetForm();
            setIsModalVisible(true);
          }}
        >
          <i className="bi bi-plus-lg me-2"></i>
          Add Quality Check
        </button>
      </div>

      {/* Quality Checks Table */}
      <div className="card border-0 shadow-sm">
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-hover align-middle">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Date</th>
                  <th>Inspector</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="5" className="text-center py-4">
                      <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                    </td>
                  </tr>
                ) : qualityChecks.map((check) => (
                  <tr key={check._id}>
                    <td>{check.title}</td>
                    <td>{check.date}</td>
                    <td>{check.inspector}</td>
                    <td>
                      <span className={`badge bg-${getStatusBadgeColor(check.status)}`}>
                        {check.status.charAt(0).toUpperCase() + check.status.slice(1)}
                      </span>
                    </td>
                    <td>
                      <div className="btn-group">
                        <button
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => editCheck(check)}
                        >
                          <i className="bi bi-pencil"></i>
                        </button>
                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => handleDelete(check._id)}
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!loading && qualityChecks.length === 0 && (
                  <tr>
                    <td colSpan="5" className="text-center py-4">
                      No quality checks found
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
                {editingId ? 'Edit Quality Check' : 'Add Quality Check'}
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
                  <label className="form-label">Title</label>
                  <input
                    type="text"
                    className="form-control"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Date</label>
                  <input
                    type="date"
                    className="form-control"
                    name="date"
                    value={formData.date}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Inspector</label>
                  <input
                    type="text"
                    className="form-control"
                    name="inspector"
                    value={formData.inspector}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Status</label>
                  <select
                    className="form-select"
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="pending">Pending</option>
                    <option value="completed">Completed</option>
                    <option value="failed">Failed</option>
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
                  {editingId ? 'Update' : 'Add'} Quality Check
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

export default QualityManagement;
