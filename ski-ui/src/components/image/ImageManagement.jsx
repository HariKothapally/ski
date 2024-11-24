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
  Image,
  Alert,
  ProgressBar,
} from 'react-bootstrap';
import { FaTrash, FaPlus, FaDownload, FaEye, FaUpload } from 'react-icons/fa';
import createApiService from '../../services/apiService';
import { toast } from 'react-toastify';

const imageService = createApiService('images');

const ImageManagement = () => {
  // State management
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDate, setFilterDate] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    description: '',
    file: null,
  });

  // Fetch images
  const fetchImages = async () => {
    setLoading(true);
    try {
      const data = await imageService.getAll();
      setImages(data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch images');
      toast.error('Failed to fetch images');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchImages();
  }, []);

  // Handle file selection
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({ ...prev, file }));
    }
  };

  // Handle image upload
  const handleUpload = async (e) => {
    e.preventDefault();
    if (!formData.file) {
      toast.error('Please select a file to upload');
      return;
    }

    const uploadData = new FormData();
    uploadData.append('image', formData.file);
    uploadData.append('title', formData.title);
    uploadData.append('category', formData.category);
    uploadData.append('description', formData.description);

    try {
      setLoading(true);
      await imageService.create(uploadData, {
        onUploadProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(progress);
        },
      });
      toast.success('Image uploaded successfully');
      setShowUploadModal(false);
      resetForm();
      fetchImages();
    } catch (err) {
      toast.error('Failed to upload image');
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  // Handle image delete
  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this image?')) {
      setLoading(true);
      try {
        await imageService.delete(id);
        toast.success('Image deleted successfully');
        fetchImages();
      } catch (err) {
        toast.error('Failed to delete image');
      }
      setLoading(false);
    }
  };

  // Handle image view
  const handleView = async (imageId) => {
    try {
      const response = await imageService.getById(imageId);
      setSelectedImage(response);
      setShowViewModal(true);
    } catch (err) {
      toast.error('Failed to load image');
    }
  };

  // Handle image download
  const handleDownload = async (image) => {
    try {
      const response = await fetch(image.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = image.title || 'download';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      toast.error('Failed to download image');
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      title: '',
      category: '',
      description: '',
      file: null,
    });
  };

  // Filter images
  const filteredImages = images.filter((image) => {
    const searchMatch = (image.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      image.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      image.description?.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const dateMatch = !filterDate || image.createdAt?.includes(filterDate);
    
    return searchMatch && dateMatch;
  });

  return (
    <Container fluid className="py-3">
      <Row className="mb-3">
        <Col>
          <h2 className="mb-3">Image Management</h2>
          <Card>
            <Card.Body>
              <Row className="mb-3">
                <Col md={4}>
                  <div className="d-flex">
                    <Form.Control
                      type="text"
                      placeholder="Search images..."
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
                    <Button variant="primary" onClick={() => setShowUploadModal(true)}>
                      <FaPlus className="me-1" /> Upload Image
                    </Button>
                  </div>
                </Col>
              </Row>

              {error && <Alert variant="danger">{error}</Alert>}

              <Table responsive striped bordered hover>
                <thead>
                  <tr>
                    <th>Preview</th>
                    <th>Title</th>
                    <th>Category</th>
                    <th>Upload Date</th>
                    <th>Size</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="6" className="text-center">Loading...</td>
                    </tr>
                  ) : filteredImages.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="text-center">No images found</td>
                    </tr>
                  ) : (
                    filteredImages.map((image) => (
                      <tr key={image._id}>
                        <td>
                          <Image
                            src={image.url}
                            alt={image.title}
                            style={{ height: '50px', width: '50px', objectFit: 'cover' }}
                            thumbnail
                          />
                        </td>
                        <td>{image.title}</td>
                        <td>{image.category}</td>
                        <td>{new Date(image.createdAt).toLocaleDateString()}</td>
                        <td>{Math.round(image.size / 1024)} KB</td>
                        <td>
                          <Button
                            variant="outline-primary"
                            size="sm"
                            className="me-2"
                            onClick={() => handleView(image._id)}
                          >
                            <FaEye />
                          </Button>
                          <Button
                            variant="outline-success"
                            size="sm"
                            className="me-2"
                            onClick={() => handleDownload(image)}
                          >
                            <FaDownload />
                          </Button>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => handleDelete(image._id)}
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

      {/* Upload Modal */}
      <Modal show={showUploadModal} onHide={() => {
        setShowUploadModal(false);
        resetForm();
      }}>
        <Modal.Header closeButton>
          <Modal.Title>Upload Image</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleUpload}>
            <Form.Group className="mb-3">
              <Form.Label>Title</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter image title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Category</Form.Label>
              <Form.Select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                required
              >
                <option value="">Select category</option>
                <option value="Receipt">Receipt</option>
                <option value="Menu">Menu</option>
                <option value="Ingredient">Ingredient</option>
                <option value="Other">Other</option>
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                placeholder="Enter image description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Image File</Form.Label>
              <Form.Control
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                required
              />
            </Form.Group>

            {uploadProgress > 0 && (
              <ProgressBar
                now={uploadProgress}
                label={`${uploadProgress}%`}
                className="mb-3"
              />
            )}

            <div className="d-flex justify-content-end">
              <Button variant="secondary" className="me-2" onClick={() => {
                setShowUploadModal(false);
                resetForm();
              }}>
                Cancel
              </Button>
              <Button variant="primary" type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <FaUpload className="me-1" /> Uploading...
                  </>
                ) : (
                  <>
                    <FaUpload className="me-1" /> Upload
                  </>
                )}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      {/* View Modal */}
      <Modal show={showViewModal} onHide={() => setShowViewModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>{selectedImage?.title || 'Image Preview'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedImage && (
            <>
              <Image src={selectedImage.url} alt={selectedImage.title} fluid />
              <div className="mt-3">
                <h5>Details</h5>
                <p><strong>Category:</strong> {selectedImage.category}</p>
                <p><strong>Upload Date:</strong> {new Date(selectedImage.createdAt).toLocaleString()}</p>
                <p><strong>Size:</strong> {Math.round(selectedImage.size / 1024)} KB</p>
                {selectedImage.description && (
                  <p><strong>Description:</strong> {selectedImage.description}</p>
                )}
              </div>
            </>
          )}
        </Modal.Body>
      </Modal>
    </Container>
  );
};

export default ImageManagement;
