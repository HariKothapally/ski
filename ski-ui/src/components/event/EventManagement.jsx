import React, { useState, useEffect } from 'react';
import { eventService } from '../../services/services';
import axios from 'axios';

const EventManagement = () => {
  const [events, setEvents] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    date: '',
    time: '',
    location: '',
    description: '',
    attendees: '',
    status: 'upcoming'
  });

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const data = await eventService.getAll();
      setEvents(data);
    } catch (error) {
      showToast('Failed to fetch events', 'danger');
    } finally {
      setLoading(false);
    }
  };

  const handleAddEdit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await eventService.update(editingId, formData);
        showToast('Event updated successfully', 'success');
      } else {
        await eventService.create(formData);
        showToast('Event added successfully', 'success');
      }
      setIsModalVisible(false);
      resetForm();
      fetchEvents();
    } catch (error) {
      showToast('Operation failed', 'danger');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      try {
        await eventService.delete(id);
        showToast('Event deleted successfully', 'success');
        fetchEvents();
      } catch (error) {
        showToast('Failed to delete event', 'danger');
      }
    }
  };

  const showToast = (message, type) => {
    const toastLiveExample = document.getElementById('liveToast');
    const toastBootstrap = bootstrap.Toast.getOrCreateInstance(toastLiveExample);
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
      time: '',
      location: '',
      description: '',
      attendees: '',
      status: 'upcoming'
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

  const editEvent = (event) => {
    setEditingId(event._id);
    setFormData({
      title: event.title,
      date: event.date,
      time: event.time,
      location: event.location,
      description: event.description,
      attendees: event.attendees,
      status: event.status
    });
    setIsModalVisible(true);
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'cancelled':
        return 'danger';
      case 'upcoming':
      default:
        return 'warning';
    }
  };

  return (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">Event Management</h2>
        <button
          className="btn btn-primary"
          onClick={() => {
            resetForm();
            setIsModalVisible(true);
          }}
        >
          <i className="bi bi-plus-lg me-2"></i>
          Add Event
        </button>
      </div>

      {/* Events Table */}
      <div className="card border-0 shadow-sm">
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-hover align-middle">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Date & Time</th>
                  <th>Location</th>
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
                ) : events.map((event) => (
                  <tr key={event._id}>
                    <td>{event.title}</td>
                    <td>{`${event.date} ${event.time}`}</td>
                    <td>{event.location}</td>
                    <td>
                      <span className={`badge bg-${getStatusBadgeColor(event.status)}`}>
                        {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                      </span>
                    </td>
                    <td>
                      <div className="btn-group">
                        <button
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => editEvent(event)}
                        >
                          <i className="bi bi-pencil"></i>
                        </button>
                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => handleDelete(event._id)}
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!loading && events.length === 0 && (
                  <tr>
                    <td colSpan="5" className="text-center py-4">
                      No events found
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
                {editingId ? 'Edit Event' : 'Add Event'}
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
                  <label className="form-label">Time</label>
                  <input
                    type="time"
                    className="form-control"
                    name="time"
                    value={formData.time}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Location</label>
                  <input
                    type="text"
                    className="form-control"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Description</label>
                  <textarea
                    className="form-control"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows="3"
                  ></textarea>
                </div>
                <div className="mb-3">
                  <label className="form-label">Attendees</label>
                  <input
                    type="text"
                    className="form-control"
                    name="attendees"
                    value={formData.attendees}
                    onChange={handleInputChange}
                    placeholder="e.g., John Doe, Jane Smith"
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
                    <option value="upcoming">Upcoming</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
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
                  {editingId ? 'Update' : 'Add'} Event
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

export default EventManagement;
