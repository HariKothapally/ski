import React, { useState, useEffect } from 'react';
import axios from 'axios';

const RecipeManagement = () => {
  const [recipes, setRecipes] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    prepTime: '',
    ingredients: [{ ingredient: '', quantity: '' }],
    instructions: ''
  });

  useEffect(() => {
    fetchRecipes();
    fetchIngredients();
  }, []);

  const fetchRecipes = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/recipes');
      setRecipes(response.data);
    } catch (error) {
      showToast('Failed to fetch recipes', 'danger');
    } finally {
      setLoading(false);
    }
  };

  const fetchIngredients = async () => {
    try {
      const response = await axios.get('/api/ingredients');
      setIngredients(response.data);
    } catch (error) {
      showToast('Failed to fetch ingredients', 'danger');
    }
  };

  const handleAddEdit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        ingredients: formData.ingredients.filter(ing => ing.ingredient && ing.quantity)
      };

      if (editingId) {
        await axios.put(`/api/recipes/${editingId}`, payload);
        showToast('Recipe updated successfully', 'success');
      } else {
        await axios.post('/api/recipes', payload);
        showToast('Recipe added successfully', 'success');
      }
      setIsModalVisible(false);
      resetForm();
      fetchRecipes();
    } catch (error) {
      showToast('Operation failed', 'danger');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this recipe?')) {
      try {
        await axios.delete(`/api/recipes/${id}`);
        showToast('Recipe deleted successfully', 'success');
        fetchRecipes();
      } catch (error) {
        showToast('Failed to delete recipe', 'danger');
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
      name: '',
      category: '',
      prepTime: '',
      ingredients: [{ ingredient: '', quantity: '' }],
      instructions: ''
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

  const handleIngredientChange = (index, field, value) => {
    const newIngredients = [...formData.ingredients];
    newIngredients[index] = {
      ...newIngredients[index],
      [field]: value
    };
    setFormData(prev => ({
      ...prev,
      ingredients: newIngredients
    }));
  };

  const addIngredientField = () => {
    setFormData(prev => ({
      ...prev,
      ingredients: [...prev.ingredients, { ingredient: '', quantity: '' }]
    }));
  };

  const removeIngredientField = (index) => {
    setFormData(prev => ({
      ...prev,
      ingredients: prev.ingredients.filter((_, i) => i !== index)
    }));
  };

  const editItem = (recipe) => {
    setEditingId(recipe._id);
    setFormData({
      name: recipe.name,
      category: recipe.category,
      prepTime: recipe.prepTime,
      ingredients: recipe.ingredients.map(ing => ({
        ingredient: ing.ingredient._id,
        quantity: ing.quantity
      })),
      instructions: recipe.instructions
    });
    setIsModalVisible(true);
  };

  return (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">Recipe Management</h2>
        <button
          className="btn btn-primary"
          onClick={() => {
            resetForm();
            setIsModalVisible(true);
          }}
        >
          <i className="bi bi-plus-lg me-2"></i>
          Add Recipe
        </button>
      </div>

      {/* Recipes Table */}
      <div className="card border-0 shadow-sm">
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-hover align-middle">
              <thead>
                <tr>
                  <th></th>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Prep Time</th>
                  <th>Cost</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="6" className="text-center py-4">
                      <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                    </td>
                  </tr>
                ) : recipes.map((recipe) => (
                  <React.Fragment key={recipe._id}>
                    <tr>
                      <td>
                        <button
                          className="btn btn-sm btn-link"
                          type="button"
                          data-bs-toggle="collapse"
                          data-bs-target={`#recipe-${recipe._id}`}
                          aria-expanded="false"
                        >
                          <i className="bi bi-chevron-down"></i>
                        </button>
                      </td>
                      <td>{recipe.name}</td>
                      <td>
                        <span className={`badge bg-${
                          recipe.category === 'appetizer' ? 'info' :
                          recipe.category === 'main' ? 'primary' :
                          recipe.category === 'dessert' ? 'success' : 'warning'
                        }`}>
                          {recipe.category.charAt(0).toUpperCase() + recipe.category.slice(1)}
                        </span>
                      </td>
                      <td>{recipe.prepTime} minutes</td>
                      <td>${recipe.cost.toFixed(2)}</td>
                      <td>
                        <div className="btn-group">
                          <button
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => editItem(recipe)}
                          >
                            <i className="bi bi-pencil"></i>
                          </button>
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => handleDelete(recipe._id)}
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td colSpan="6" className="p-0">
                        <div className="collapse" id={`recipe-${recipe._id}`}>
                          <div className="card card-body border-0">
                            <div className="row">
                              <div className="col-md-6">
                                <h6 className="mb-3">Ingredients:</h6>
                                <ul className="list-group list-group-flush">
                                  {recipe.ingredients.map((item, index) => (
                                    <li key={index} className="list-group-item px-0">
                                      {item.ingredient.name}: {item.quantity} {item.ingredient.unit}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                              <div className="col-md-6">
                                <h6 className="mb-3">Instructions:</h6>
                                <p className="mb-0">{recipe.instructions}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  </React.Fragment>
                ))}
                {!loading && recipes.length === 0 && (
                  <tr>
                    <td colSpan="6" className="text-center py-4">
                      No recipes found
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
        <div className="modal-dialog modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">
                {editingId ? 'Edit Recipe' : 'Add Recipe'}
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
                  <label className="form-label">Category</label>
                  <select
                    className="form-select"
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select category</option>
                    <option value="appetizer">Appetizer</option>
                    <option value="main">Main Course</option>
                    <option value="dessert">Dessert</option>
                    <option value="beverage">Beverage</option>
                  </select>
                </div>
                <div className="mb-3">
                  <label className="form-label">Preparation Time (minutes)</label>
                  <input
                    type="number"
                    className="form-control"
                    name="prepTime"
                    value={formData.prepTime}
                    onChange={handleInputChange}
                    min="1"
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Ingredients</label>
                  {formData.ingredients.map((ing, index) => (
                    <div key={index} className="row mb-2">
                      <div className="col-md-6">
                        <select
                          className="form-select"
                          value={ing.ingredient}
                          onChange={(e) => handleIngredientChange(index, 'ingredient', e.target.value)}
                          required
                        >
                          <option value="">Select ingredient</option>
                          {ingredients.map(item => (
                            <option key={item._id} value={item._id}>
                              {item.name} ({item.unit})
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="col-md-4">
                        <input
                          type="number"
                          className="form-control"
                          placeholder="Quantity"
                          value={ing.quantity}
                          onChange={(e) => handleIngredientChange(index, 'quantity', e.target.value)}
                          min="0"
                          step="0.01"
                          required
                        />
                      </div>
                      <div className="col-md-2">
                        <button
                          type="button"
                          className="btn btn-outline-danger"
                          onClick={() => removeIngredientField(index)}
                          disabled={formData.ingredients.length === 1}
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                      </div>
                    </div>
                  ))}
                  <button
                    type="button"
                    className="btn btn-outline-primary w-100"
                    onClick={addIngredientField}
                  >
                    <i className="bi bi-plus-lg me-2"></i>
                    Add Ingredient
                  </button>
                </div>
                <div className="mb-3">
                  <label className="form-label">Instructions</label>
                  <textarea
                    className="form-control"
                    name="instructions"
                    value={formData.instructions}
                    onChange={handleInputChange}
                    rows="4"
                    required
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
                  {editingId ? 'Update' : 'Add'} Recipe
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
          className="toast align-items-center text-white bg-primary border-0"
          role="alert"
          aria-live="assertive"
          aria-atomic="true"
        >
          <div className="d-flex">
            <div className="toast-header">
              <strong className="me-auto">Success</strong>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="toast"
                aria-label="Close"
              ></button>
            </div>
            <div className="toast-body"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecipeManagement;
