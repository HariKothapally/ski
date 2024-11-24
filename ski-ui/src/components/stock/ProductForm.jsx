import React from 'react';
import { Form, Row, Col } from 'react-bootstrap';
import PropTypes from 'prop-types';

const ProductForm = ({ formData, onChange, categories }) => {
  const handleChange = (e) => {
    const { name, value, type } = e.target;
    onChange({
      ...formData,
      [name]: type === 'number' ? parseFloat(value) : value
    });
  };

  return (
    <Form>
      <Row>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Name</Form.Label>
            <Form.Control
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter product name"
              required
            />
          </Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Category</Form.Label>
            <Form.Select
              name="categoryId"
              value={formData.categoryId}
              onChange={handleChange}
              required
            >
              <option value="">Select category</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
        </Col>
      </Row>

      <Row>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Unit Price</Form.Label>
            <Form.Control
              type="number"
              name="unitPrice"
              value={formData.unitPrice}
              onChange={handleChange}
              placeholder="Enter unit price"
              min="0"
              step="0.01"
              required
            />
          </Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Unit of Measure</Form.Label>
            <Form.Select
              name="unitOfMeasure"
              value={formData.unitOfMeasure}
              onChange={handleChange}
              required
            >
              <option value="">Select unit</option>
              <option value="KG">Kilogram (KG)</option>
              <option value="G">Gram (G)</option>
              <option value="L">Liter (L)</option>
              <option value="ML">Milliliter (ML)</option>
              <option value="PCS">Pieces (PCS)</option>
              <option value="BOX">Box (BOX)</option>
            </Form.Select>
          </Form.Group>
        </Col>
      </Row>

      <Row>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Minimum Stock Level</Form.Label>
            <Form.Control
              type="number"
              name="minStockLevel"
              value={formData.minStockLevel}
              onChange={handleChange}
              placeholder="Enter minimum stock level"
              min="0"
              required
            />
          </Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Maximum Stock Level</Form.Label>
            <Form.Control
              type="number"
              name="maxStockLevel"
              value={formData.maxStockLevel}
              onChange={handleChange}
              placeholder="Enter maximum stock level"
              min="0"
              required
            />
          </Form.Group>
        </Col>
      </Row>

      <Form.Group className="mb-3">
        <Form.Label>Description</Form.Label>
        <Form.Control
          as="textarea"
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="Enter product description"
          rows={3}
        />
      </Form.Group>

      <Row>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Storage Location</Form.Label>
            <Form.Control
              type="text"
              name="storageLocation"
              value={formData.storageLocation}
              onChange={handleChange}
              placeholder="Enter storage location"
            />
          </Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>SKU</Form.Label>
            <Form.Control
              type="text"
              name="sku"
              value={formData.sku}
              onChange={handleChange}
              placeholder="Enter SKU"
              required
            />
          </Form.Group>
        </Col>
      </Row>
    </Form>
  );
};

ProductForm.propTypes = {
  formData: PropTypes.shape({
    name: PropTypes.string.isRequired,
    categoryId: PropTypes.string.isRequired,
    unitPrice: PropTypes.number.isRequired,
    unitOfMeasure: PropTypes.string.isRequired,
    minStockLevel: PropTypes.number.isRequired,
    maxStockLevel: PropTypes.number.isRequired,
    description: PropTypes.string,
    storageLocation: PropTypes.string,
    sku: PropTypes.string.isRequired
  }).isRequired,
  onChange: PropTypes.func.isRequired,
  categories: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired
    })
  ).isRequired
};

export default ProductForm;
