import React, { useState, useEffect } from 'react';
import { menuService } from '../../services/services';

const MenuManagement = () => {
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    isAvailable: true,
    ingredients: [],
    imageUrl: '',
    preparationTime: '',
    nutritionalInfo: ''
  });

  useEffect(() => {
    fetchMenuItems();
  }, []);

  const fetchMenuItems = async () => {
    try {
      setLoading(true);
      const data = await menuService.getAll();
      setMenuItems(data);
    } catch (error) {
      showToast(error.message, 'danger');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message, type = 'success') => {
    const toastEl = document.getElementById('menuToast');
    const toast = new bootstrap.Toast(toastEl);
    toastEl.querySelector('.toast-body').textContent = message;
    toastEl.className = `toast align-items-center text-white bg-${type} border-0`;
    toast.show();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await menuService.update(editingId, formData);
        showToast('Menu item updated successfully');
      } else {
        await menuService.create(formData);
        showToast('Menu item added successfully');
      }
      setShowModal(false);
      resetForm();
      fetchMenuItems();
    } catch (error) {
      showToast(error.message, 'danger');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        await menuService.delete(id);
        showToast('Menu item deleted successfully');
        fetchMenuItems();
      } catch (error) {
        showToast(error.message, 'danger');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      category: '',
      isAvailable: true,
      ingredients: [],
      imageUrl: '',
      preparationTime: '',
      nutritionalInfo: ''
    });
    setEditingId(null);
  };

  const handleEdit = (item) => {
    setFormData({
      name: item.name,
      description: item.description,
      price: item.price,
      category: item.category,
      isAvailable: item.isAvailable,
      ingredients: item.ingredients,
      imageUrl: item.imageUrl,
      preparationTime: item.preparationTime,
      nutritionalInfo: item.nutritionalInfo
    });
    setEditingId(item.id);
    setShowModal(true);
  };

  return (
    <div className="container-fluid px-4 py-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="h4 mb-0">
          <i className="bi bi-menu-button-wide me-2"></i>
          Menu Management
        </h2>
        <button
          className="btn btn-primary"
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
        >
          <i className="bi bi-plus-lg me-2"></i>
          Add Menu Item
        </button>
      </div>

      {/* Menu Items Table */}
      <div className="card shadow-sm">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="bg-light">
                <tr>
                  <th className="px-4">Name</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Status</th>
                  <th className="text-end px-4">Actions</th>
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
                ) : menuItems.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center py-4">
                      <i className="bi bi-inbox text-muted fs-1 d-block mb-2"></i>
                      No menu items found
                    </td>
                  </tr>
                ) : (
                  menuItems.map((item) => (
                    <tr key={item.id}>
                      <td className="px-4">
                        <div className="d-flex align-items-center">
                          {item.imageUrl && (
                            <img
                              src={item.imageUrl}
                              alt={item.name}
                              className="rounded me-3"
                              style={{ width: '40px', height: '40px', objectFit: 'cover' }}
                            />
                          )}
                          <div>
                            <div className="fw-medium">{item.name}</div>
                            <small className="text-muted">{item.description}</small>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="badge bg-light text-dark">
                          {item.category}
                        </span>
                      </td>
                      <td>${item.price}</td>
                      <td>
                        <span className={`badge ${item.isAvailable ? 'bg-success' : 'bg-danger'}`}>
                          {item.isAvailable ? 'Available' : 'Unavailable'}
                        </span>
                      </td>
                      <td className="text-end px-4">
                        <button
                          className="btn btn-sm btn-outline-primary me-2"
                          onClick={() => handleEdit(item)}
                        >
                          <i className="bi bi-pencil me-2"></i>
                          <span className="d-none d-sm-inline">Edit</span>
                        </button>
                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => handleDelete(item.id)}
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
        id="menuModal"
        tabIndex="-1"
        aria-labelledby="menuModalLabel"
        aria-hidden="true"
        show={showModal}
      >
        <div className="modal-dialog modal-lg modal-dialog-scrollable">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id="menuModalLabel">
                {editingId ? 'Edit Menu Item' : 'Add Menu Item'}
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
                  <label className="form-label">Category</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    required
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Price</label>
                  <div className="input-group">
                    <span className="input-group-text">$</span>
                    <input
                      type="number"
                      className="form-control"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      required
                      step="0.01"
                      min="0"
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <label className="form-label">Preparation Time (mins)</label>
                  <input
                    type="number"
                    className="form-control"
                    value={formData.preparationTime}
                    onChange={(e) => setFormData({ ...formData, preparationTime: e.target.value })}
                    required
                    min="0"
                  />
                </div>
                <div className="col-12">
                  <label className="form-label">Description</label>
                  <textarea
                    className="form-control"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    required
                    rows="3"
                  ></textarea>
                </div>
                <div className="col-12">
                  <label className="form-label">Image URL</label>
                  <input
                    type="url"
                    className="form-control"
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  />
                </div>
                <div className="col-12">
                  <label className="form-label">Ingredients</label>
                  <textarea
                    className="form-control"
                    value={formData.ingredients.join(', ')}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        ingredients: e.target.value.split(',').map((i) => i.trim())
                      })
                    }
                    placeholder="Enter ingredients separated by commas"
                    rows="2"
                  ></textarea>
                </div>
                <div className="col-12">
                  <label className="form-label">Nutritional Info</label>
                  <textarea
                    className="form-control"
                    value={formData.nutritionalInfo}
                    onChange={(e) => setFormData({ ...formData, nutritionalInfo: e.target.value })}
                    rows="2"
                  ></textarea>
                </div>
                <div className="col-12">
                  <div className="form-check form-switch">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="isAvailable"
                      checked={formData.isAvailable}
                      onChange={(e) => setFormData({ ...formData, isAvailable: e.target.checked })}
                    />
                    <label className="form-check-label" htmlFor="isAvailable">
                      Available for Order
                    </label>
                  </div>
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
                {editingId ? 'Update' : 'Add'} Menu Item
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      <div className="toast-container position-fixed bottom-0 end-0 p-3">
        <div
          id="menuToast"
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

export default MenuManagement;
