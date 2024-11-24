import React, { useState, useEffect } from 'react';
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Form,
  Table,
  Modal,
  Badge,
  Alert,
} from 'react-bootstrap';
import { FaEdit, FaTrash, FaPlus, FaSearch } from 'react-icons/fa';
import createApiService from '../../services/apiService';
import { toast } from 'react-toastify';

const mealTrackerService = createApiService('mealtrackers');

const MealTrackerManagement = () => {
  // State management
  const [mealTracks, setMealTracks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [selectedMealTrack, setSelectedMealTrack] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDate, setFilterDate] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    mealName: '',
    servingSize: '',
    servingUnit: '',
    mealType: '',
    mealTime: '',
    date: '',
    calories: '',
    notes: '',
  });

  // Fetch meal tracks
  const fetchMealTracks = async () => {
    setLoading(true);
    try {
      const data = await mealTrackerService.getAll();
      setMealTracks(data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch meal tracks');
      toast.error('Failed to fetch meal tracks');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchMealTracks();
  }, []);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (selectedMealTrack) {
        await mealTrackerService.update(selectedMealTrack._id, formData);
        toast.success('Meal track updated successfully');
      } else {
        await mealTrackerService.create(formData);
        toast.success('Meal track created successfully');
      }
      setShowForm(false);
      setSelectedMealTrack(null);
      resetForm();
      fetchMealTracks();
    } catch (err) {
      toast.error(selectedMealTrack ? 'Failed to update meal track' : 'Failed to create meal track');
    }
    setLoading(false);
  };

  // Handle delete
  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this meal track?')) {
      setLoading(true);
      try {
        await mealTrackerService.delete(id);
        toast.success('Meal track deleted successfully');
        fetchMealTracks();
      } catch (err) {
        toast.error('Failed to delete meal track');
      }
      setLoading(false);
    }
  };

  // Handle edit
  const handleEdit = (mealTrack) => {
    setSelectedMealTrack(mealTrack);
    setFormData({
      mealName: mealTrack.mealName,
      servingSize: mealTrack.servingSize,
      servingUnit: mealTrack.servingUnit,
      mealType: mealTrack.mealType,
      mealTime: mealTrack.mealTime,
      date: mealTrack.date.split('T')[0],
      calories: mealTrack.calories,
      notes: mealTrack.notes,
    });
    setShowForm(true);
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      mealName: '',
      servingSize: '',
      servingUnit: '',
      mealType: '',
      mealTime: '',
      date: '',
      calories: '',
      notes: '',
    });
  };

  // Filter meal tracks
  const filteredMealTracks = mealTracks.filter((track) => {
    const searchMatch = track.mealName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      track.mealType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      track.notes.toLowerCase().includes(searchTerm.toLowerCase());
    
    const dateMatch = !filterDate || track.date.includes(filterDate);
    
    return searchMatch && dateMatch;
  });

  return (
    <Container fluid className="py-3">
      <Row className="mb-3">
        <Col>
          <h2 className="mb-3">Meal Tracker Management</h2>
          <Card>
            <Card.Body>
              <Row className="mb-3">
                <Col md={4}>
                  <div className="d-flex">
                    <Form.Control
                      type="text"
                      placeholder="Search meals..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="me-2"
                    />
                    <Form.Control
                      type="date"
                      value={filterDate}
                      onChange={(e) => setFilterDate(e.target.value)}
                      className="me-2"
                    />
                    <Button variant="primary" onClick={() => setShowForm(true)}>
                      <FaPlus className="me-1" /> Add Meal
                    </Button>
                  </div>
                </Col>
              </Row>

              {error && <Alert variant="danger">{error}</Alert>}

              <Table responsive striped bordered hover>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Meal Name</th>
                    <th>Type</th>
                    <th>Time</th>
                    <th>Serving</th>
                    <th>Calories</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="7" className="text-center">Loading...</td>
                    </tr>
                  ) : filteredMealTracks.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="text-center">No meal tracks found</td>
                    </tr>
                  ) : (
                    filteredMealTracks.map((track) => (
                      <tr key={track._id}>
                        <td>{new Date(track.date).toLocaleDateString()}</td>
                        <td>{track.mealName}</td>
                        <td>
                          <Badge bg="info">{track.mealType}</Badge>
                        </td>
                        <td>{track.mealTime}</td>
                        <td>{`${track.servingSize} ${track.servingUnit}`}</td>
                        <td>{track.calories}</td>
                        <td>
                          <Button
                            variant="outline-primary"
                            size="sm"
                            className="me-2"
                            onClick={() => handleEdit(track)}
                          >
                            <FaEdit />
                          </Button>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => handleDelete(track._id)}
                          >
                            <FaTrash />
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Add/Edit Form Modal */}
      <Modal show={showForm} onHide={() => {
        setShowForm(false);
        setSelectedMealTrack(null);
        resetForm();
      }}>
        <Modal.Header closeButton>
          <Modal.Title>{selectedMealTrack ? 'Edit Meal Track' : 'Add New Meal Track'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Meal Name</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter meal name"
                value={formData.mealName}
                onChange={(e) => setFormData({ ...formData, mealName: e.target.value })}
                required
              />
            </Form.Group>

            <Row className="mb-3">
              <Col>
                <Form.Group>
                  <Form.Label>Serving Size</Form.Label>
                  <Form.Control
                    type="number"
                    placeholder="Enter serving size"
                    value={formData.servingSize}
                    onChange={(e) => setFormData({ ...formData, servingSize: e.target.value })}
                    required
                  />
                </Form.Group>
              </Col>
              <Col>
                <Form.Group>
                  <Form.Label>Unit</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="e.g., grams, pieces"
                    value={formData.servingUnit}
                    onChange={(e) => setFormData({ ...formData, servingUnit: e.target.value })}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row className="mb-3">
              <Col>
                <Form.Group>
                  <Form.Label>Meal Type</Form.Label>
                  <Form.Select
                    value={formData.mealType}
                    onChange={(e) => setFormData({ ...formData, mealType: e.target.value })}
                    required
                  >
                    <option value="">Select type</option>
                    <option value="Breakfast">Breakfast</option>
                    <option value="Lunch">Lunch</option>
                    <option value="Dinner">Dinner</option>
                    <option value="Snack">Snack</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col>
                <Form.Group>
                  <Form.Label>Time</Form.Label>
                  <Form.Control
                    type="time"
                    value={formData.mealTime}
                    onChange={(e) => setFormData({ ...formData, mealTime: e.target.value })}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row className="mb-3">
              <Col>
                <Form.Group>
                  <Form.Label>Date</Form.Label>
                  <Form.Control
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                  />
                </Form.Group>
              </Col>
              <Col>
                <Form.Group>
                  <Form.Label>Calories</Form.Label>
                  <Form.Control
                    type="number"
                    placeholder="Enter calories"
                    value={formData.calories}
                    onChange={(e) => setFormData({ ...formData, calories: e.target.value })}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Notes</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                placeholder="Enter any additional notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </Form.Group>

            <div className="d-flex justify-content-end">
              <Button variant="secondary" className="me-2" onClick={() => {
                setShowForm(false);
                setSelectedMealTrack(null);
                resetForm();
              }}>
                Cancel
              </Button>
              <Button variant="primary" type="submit" disabled={loading}>
                {loading ? 'Saving...' : (selectedMealTrack ? 'Update' : 'Save')}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </Container>
  );
};

export default MealTrackerManagement;
