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
  Image,
} from 'react-bootstrap';
import { FaEdit, FaTrash, FaPlus, FaSearch, FaFileUpload, FaEye } from 'react-icons/fa';
import createApiService from '../../services/apiService';
import { toast } from 'react-toastify';

const receiptService = createApiService('receipts');
const imageService = createApiService('images');

const ReceiptManagement = () => {
  // State management
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDate, setFilterDate] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    vendor: '',
    amount: '',
    date: '',
    category: '',
    paymentMethod: '',
    description: '',
    imageId: '',
  });

  // Fetch receipts
  const fetchReceipts = async () => {
    setLoading(true);
    try {
      const data = await receiptService.getAll();
      setReceipts(data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch receipts');
      toast.error('Failed to fetch receipts');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchReceipts();
  }, []);

  // Handle image upload
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await imageService.create(formData);
      setFormData(prev => ({ ...prev, imageId: response.imageId }));
      toast.success('Image uploaded successfully');
    } catch (err) {
      toast.error('Failed to upload image');
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (selectedReceipt) {
        await receiptService.update(selectedReceipt._id, formData);
        toast.success('Receipt updated successfully');
      } else {
        await receiptService.create(formData);
        toast.success('Receipt created successfully');
      }
      setShowForm(false);
      setSelectedReceipt(null);
      resetForm();
      fetchReceipts();
    } catch (err) {
      toast.error(selectedReceipt ? 'Failed to update receipt' : 'Failed to create receipt');
    }
    setLoading(false);
  };

  // Handle delete
  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this receipt?')) {
      setLoading(true);
      try {
        await receiptService.delete(id);
        toast.success('Receipt deleted successfully');
        fetchReceipts();
      } catch (err) {
        toast.error('Failed to delete receipt');
      }
      setLoading(false);
    }
  };

  // Handle edit
  const handleEdit = (receipt) => {
    setSelectedReceipt(receipt);
    setFormData({
      vendor: receipt.vendor,
      amount: receipt.amount,
      date: receipt.date.split('T')[0],
      category: receipt.category,
      paymentMethod: receipt.paymentMethod,
      description: receipt.description,
      imageId: receipt.imageId,
    });
    setShowForm(true);
  };

  // View receipt image
  const handleViewImage = async (imageId) => {
    try {
      const response = await imageService.getById(imageId);
      setSelectedImage(response.url);
      setShowImageModal(true);
    } catch (err) {
      toast.error('Failed to load receipt image');
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      vendor: '',
      amount: '',
      date: '',
      category: '',
      paymentMethod: '',
      description: '',
      imageId: '',
    });
  };

  // Filter receipts
  const filteredReceipts = receipts.filter((receipt) => {
    const searchMatch = receipt.vendor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      receipt.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      receipt.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const dateMatch = !filterDate || receipt.date.includes(filterDate);
    
    return searchMatch && dateMatch;
  });

  return (
    <Container fluid className="py-3">
      <Row className="mb-3">
        <Col>
          <h2 className="mb-3">Receipt Management</h2>
          <Card>
            <Card.Body>
              <Row className="mb-3">
                <Col md={4}>
                  <div className="d-flex">
                    <Form.Control
                      type="text"
                      placeholder="Search receipts..."
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
                      <FaPlus className="me-1" /> Add Receipt
                    </Button>
                  </div>
                </Col>
              </Row>

              {error && <Alert variant="danger">{error}</Alert>}

              <Table responsive striped bordered hover>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Vendor</th>
                    <th>Amount</th>
                    <th>Category</th>
                    <th>Payment Method</th>
                    <th>Image</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="7" className="text-center">Loading...</td>
                    </tr>
                  ) : filteredReceipts.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="text-center">No receipts found</td>
                    </tr>
                  ) : (
                    filteredReceipts.map((receipt) => (
                      <tr key={receipt._id}>
                        <td>{new Date(receipt.date).toLocaleDateString()}</td>
                        <td>{receipt.vendor}</td>
                        <td>${receipt.amount.toFixed(2)}</td>
                        <td>
                          <Badge bg="info">{receipt.category}</Badge>
                        </td>
                        <td>{receipt.paymentMethod}</td>
                        <td>
                          {receipt.imageId && (
                            <Button
                              variant="link"
                              size="sm"
                              onClick={() => handleViewImage(receipt.imageId)}
                            >
                              <FaEye />
                            </Button>
                          )}
                        </td>
                        <td>
                          <Button
                            variant="outline-primary"
                            size="sm"
                            className="me-2"
                            onClick={() => handleEdit(receipt)}
                          >
                            <FaEdit />
                          </Button>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => handleDelete(receipt._id)}
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
        setSelectedReceipt(null);
        resetForm();
      }}>
        <Modal.Header closeButton>
          <Modal.Title>{selectedReceipt ? 'Edit Receipt' : 'Add New Receipt'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Vendor</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter vendor name"
                value={formData.vendor}
                onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                required
              />
            </Form.Group>

            <Row className="mb-3">
              <Col>
                <Form.Group>
                  <Form.Label>Amount</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    placeholder="Enter amount"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    required
                  />
                </Form.Group>
              </Col>
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
            </Row>

            <Row className="mb-3">
              <Col>
                <Form.Group>
                  <Form.Label>Category</Form.Label>
                  <Form.Select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    required
                  >
                    <option value="">Select category</option>
                    <option value="Ingredients">Ingredients</option>
                    <option value="Equipment">Equipment</option>
                    <option value="Utilities">Utilities</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Other">Other</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col>
                <Form.Group>
                  <Form.Label>Payment Method</Form.Label>
                  <Form.Select
                    value={formData.paymentMethod}
                    onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                    required
                  >
                    <option value="">Select payment method</option>
                    <option value="Cash">Cash</option>
                    <option value="Credit Card">Credit Card</option>
                    <option value="Debit Card">Debit Card</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                placeholder="Enter description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Receipt Image</Form.Label>
              <div className="d-flex align-items-center">
                <Form.Control
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="me-2"
                />
                {formData.imageId && (
                  <Button
                    variant="outline-primary"
                    size="sm"
                    onClick={() => handleViewImage(formData.imageId)}
                  >
                    <FaEye className="me-1" /> View
                  </Button>
                )}
              </div>
            </Form.Group>

            <div className="d-flex justify-content-end">
              <Button variant="secondary" className="me-2" onClick={() => {
                setShowForm(false);
                setSelectedReceipt(null);
                resetForm();
              }}>
                Cancel
              </Button>
              <Button variant="primary" type="submit" disabled={loading}>
                {loading ? 'Saving...' : (selectedReceipt ? 'Update' : 'Save')}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Image View Modal */}
      <Modal show={showImageModal} onHide={() => setShowImageModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Receipt Image</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedImage && (
            <Image src={selectedImage} alt="Receipt" fluid />
          )}
        </Modal.Body>
      </Modal>
    </Container>
  );
};

export default ReceiptManagement;
