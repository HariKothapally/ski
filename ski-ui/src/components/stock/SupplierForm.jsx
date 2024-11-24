import React from 'react';
import { Form, Row, Col } from 'react-bootstrap';
import PropTypes from 'prop-types';

const PAYMENT_TERMS = [
  { value: 'NET_30', label: 'Net 30' },
  { value: 'NET_45', label: 'Net 45' },
  { value: 'NET_60', label: 'Net 60' },
  { value: 'IMMEDIATE', label: 'Immediate Payment' },
  { value: 'CUSTOM', label: 'Custom Terms' }
];

const DELIVERY_SCHEDULES = [
  { value: 'DAILY', label: 'Daily' },
  { value: 'WEEKLY', label: 'Weekly' },
  { value: 'BIWEEKLY', label: 'Bi-Weekly' },
  { value: 'MONTHLY', label: 'Monthly' },
  { value: 'ON_DEMAND', label: 'On Demand' }
];

const SupplierForm = ({ formData, onChange }) => {
  const handleChange = (e) => {
    const { name, value, type } = e.target;
    onChange({
      ...formData,
      [name]: type === 'number' ? parseFloat(value) : value
    });
  };

  return (
    <Form>
      {/* Basic Information */}
      <h5 className="mb-3">Basic Information</h5>
      <Row>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Company Name</Form.Label>
            <Form.Control
              type="text"
              name="companyName"
              value={formData.companyName}
              onChange={handleChange}
              placeholder="Enter company name"
              required
            />
          </Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Supplier Code</Form.Label>
            <Form.Control
              type="text"
              name="code"
              value={formData.code}
              onChange={handleChange}
              placeholder="Enter supplier code"
              required
            />
            <Form.Text className="text-muted">
              Unique identifier for this supplier (e.g., SUP001)
            </Form.Text>
          </Form.Group>
        </Col>
      </Row>

      {/* Contact Information */}
      <h5 className="mb-3 mt-4">Contact Information</h5>
      <Row>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Contact Person</Form.Label>
            <Form.Control
              type="text"
              name="contactPerson"
              value={formData.contactPerson}
              onChange={handleChange}
              placeholder="Enter contact person name"
              required
            />
          </Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Email</Form.Label>
            <Form.Control
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter email address"
              required
            />
          </Form.Group>
        </Col>
      </Row>

      <Row>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Phone</Form.Label>
            <Form.Control
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="Enter phone number"
              required
            />
          </Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Alternative Phone</Form.Label>
            <Form.Control
              type="tel"
              name="alternativePhone"
              value={formData.alternativePhone}
              onChange={handleChange}
              placeholder="Enter alternative phone number"
            />
          </Form.Group>
        </Col>
      </Row>

      {/* Address */}
      <h5 className="mb-3 mt-4">Address</h5>
      <Form.Group className="mb-3">
        <Form.Label>Street Address</Form.Label>
        <Form.Control
          type="text"
          name="address"
          value={formData.address}
          onChange={handleChange}
          placeholder="Enter street address"
          required
        />
      </Form.Group>

      <Row>
        <Col md={4}>
          <Form.Group className="mb-3">
            <Form.Label>City</Form.Label>
            <Form.Control
              type="text"
              name="city"
              value={formData.city}
              onChange={handleChange}
              placeholder="Enter city"
              required
            />
          </Form.Group>
        </Col>
        <Col md={4}>
          <Form.Group className="mb-3">
            <Form.Label>State/Province</Form.Label>
            <Form.Control
              type="text"
              name="state"
              value={formData.state}
              onChange={handleChange}
              placeholder="Enter state/province"
              required
            />
          </Form.Group>
        </Col>
        <Col md={4}>
          <Form.Group className="mb-3">
            <Form.Label>Postal Code</Form.Label>
            <Form.Control
              type="text"
              name="postalCode"
              value={formData.postalCode}
              onChange={handleChange}
              placeholder="Enter postal code"
              required
            />
          </Form.Group>
        </Col>
      </Row>

      {/* Business Terms */}
      <h5 className="mb-3 mt-4">Business Terms</h5>
      <Row>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Payment Terms</Form.Label>
            <Form.Select
              name="paymentTerms"
              value={formData.paymentTerms}
              onChange={handleChange}
              required
            >
              <option value="">Select payment terms</option>
              {PAYMENT_TERMS.map(term => (
                <option key={term.value} value={term.value}>
                  {term.label}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Delivery Schedule</Form.Label>
            <Form.Select
              name="deliverySchedule"
              value={formData.deliverySchedule}
              onChange={handleChange}
              required
            >
              <option value="">Select delivery schedule</option>
              {DELIVERY_SCHEDULES.map(schedule => (
                <option key={schedule.value} value={schedule.value}>
                  {schedule.label}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
        </Col>
      </Row>

      <Row>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Lead Time (Days)</Form.Label>
            <Form.Control
              type="number"
              name="leadTimeDays"
              value={formData.leadTimeDays}
              onChange={handleChange}
              placeholder="Enter lead time in days"
              min="0"
              required
            />
          </Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Minimum Order Value</Form.Label>
            <Form.Control
              type="number"
              name="minimumOrderValue"
              value={formData.minimumOrderValue}
              onChange={handleChange}
              placeholder="Enter minimum order value"
              min="0"
              step="0.01"
              required
            />
          </Form.Group>
        </Col>
      </Row>

      {/* Additional Information */}
      <h5 className="mb-3 mt-4">Additional Information</h5>
      <Form.Group className="mb-3">
        <Form.Label>Notes</Form.Label>
        <Form.Control
          as="textarea"
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          placeholder="Enter additional notes"
          rows={3}
        />
      </Form.Group>
    </Form>
  );
};

SupplierForm.propTypes = {
  formData: PropTypes.shape({
    companyName: PropTypes.string.isRequired,
    code: PropTypes.string.isRequired,
    contactPerson: PropTypes.string.isRequired,
    email: PropTypes.string.isRequired,
    phone: PropTypes.string.isRequired,
    alternativePhone: PropTypes.string,
    address: PropTypes.string.isRequired,
    city: PropTypes.string.isRequired,
    state: PropTypes.string.isRequired,
    postalCode: PropTypes.string.isRequired,
    paymentTerms: PropTypes.string.isRequired,
    deliverySchedule: PropTypes.string.isRequired,
    leadTimeDays: PropTypes.number.isRequired,
    minimumOrderValue: PropTypes.number.isRequired,
    notes: PropTypes.string
  }).isRequired,
  onChange: PropTypes.func.isRequired
};

export default SupplierForm;
