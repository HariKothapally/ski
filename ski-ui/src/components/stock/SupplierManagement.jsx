import React, { useState } from 'react';
import { Button, Modal, Badge, Card, Row, Col } from 'react-bootstrap';
import { 
  FaPlus, 
  FaEdit, 
  FaTrash, 
  FaPhone, 
  FaEnvelope, 
  FaMapMarkerAlt,
  FaClock,
  FaMoneyBillWave,
  FaTruck,
  FaExclamationTriangle
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import ManagementLayout from '../shared/ManagementLayout';
import DataTable from '../shared/DataTable';
import SupplierForm from './SupplierForm';
import useDataTable from '../../hooks/useDataTable';
import { createApiService } from '../../utils/api';

const supplierApi = createApiService('suppliers');

const PAYMENT_TERMS_LABELS = {
  NET_30: 'Net 30',
  NET_45: 'Net 45',
  NET_60: 'Net 60',
  IMMEDIATE: 'Immediate Payment',
  CUSTOM: 'Custom Terms'
};

const DELIVERY_SCHEDULE_LABELS = {
  DAILY: 'Daily',
  WEEKLY: 'Weekly',
  BIWEEKLY: 'Bi-Weekly',
  MONTHLY: 'Monthly',
  ON_DEMAND: 'On Demand'
};

const SupplierManagement = () => {
  const [showModal, setShowModal] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [formData, setFormData] = useState({
    companyName: '',
    code: '',
    contactPerson: '',
    email: '',
    phone: '',
    alternativePhone: '',
    address: '',
    city: '',
    state: '',
    postalCode: '',
    paymentTerms: '',
    deliverySchedule: '',
    leadTimeDays: 0,
    minimumOrderValue: 0,
    notes: ''
  });

  const {
    data: suppliers,
    loading,
    handlePageChange,
    handleSort,
    handleSearch,
    refresh,
    currentPage,
    totalPages
  } = useDataTable({
    fetchData: supplierApi.getAll,
    defaultSort: { field: 'companyName', direction: 'asc' }
  });

  const columns = [
    { key: 'code', label: 'Code', sortable: true },
    { key: 'companyName', label: 'Company Name', sortable: true },
    { 
      key: 'contact',
      label: 'Contact',
      render: (row) => (
        <div>
          <div>{row.contactPerson}</div>
          <small className="text-muted">
            <FaPhone className="me-1" />
            {row.phone}
          </small>
        </div>
      )
    },
    {
      key: 'performance',
      label: 'Performance',
      render: (row) => {
        const rating = row.performanceRating || 0;
        let variant = 'success';
        if (rating < 3) variant = 'danger';
        else if (rating < 4) variant = 'warning';
        
        return (
          <Badge bg={variant}>
            {rating.toFixed(1)} ★
          </Badge>
        );
      }
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => {
        const variant = row.active ? 'success' : 'danger';
        return (
          <Badge bg={variant}>
            {row.active ? 'Active' : 'Inactive'}
          </Badge>
        );
      }
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <div className="d-flex gap-2">
          <Button
            variant="outline-info"
            size="sm"
            onClick={() => handleViewDetails(row)}
          >
            View
          </Button>
          <Button
            variant="outline-primary"
            size="sm"
            onClick={() => handleEdit(row)}
          >
            <FaEdit />
          </Button>
          <Button
            variant="outline-danger"
            size="sm"
            onClick={() => handleDelete(row)}
          >
            <FaTrash />
          </Button>
        </div>
      )
    }
  ];

  const handleViewDetails = (supplier) => {
    setSelectedSupplier(supplier);
    setShowDetails(true);
  };

  const handleEdit = (supplier) => {
    setSelectedSupplier(supplier);
    setFormData({
      companyName: supplier.companyName,
      code: supplier.code,
      contactPerson: supplier.contactPerson,
      email: supplier.email,
      phone: supplier.phone,
      alternativePhone: supplier.alternativePhone || '',
      address: supplier.address,
      city: supplier.city,
      state: supplier.state,
      postalCode: supplier.postalCode,
      paymentTerms: supplier.paymentTerms,
      deliverySchedule: supplier.deliverySchedule,
      leadTimeDays: supplier.leadTimeDays,
      minimumOrderValue: supplier.minimumOrderValue,
      notes: supplier.notes || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (supplier) => {
    if (window.confirm('Are you sure you want to delete this supplier?')) {
      try {
        await supplierApi.delete(supplier.id);
        toast.success('Supplier deleted successfully');
        refresh();
      } catch (error) {
        toast.error('Failed to delete supplier');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedSupplier) {
        await supplierApi.update(selectedSupplier.id, formData);
        toast.success('Supplier updated successfully');
      } else {
        await supplierApi.create('', formData);
        toast.success('Supplier created successfully');
      }
      setShowModal(false);
      refresh();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save supplier');
    }
  };

  const validateForm = () => {
    const errors = [];
    if (!formData.companyName.trim()) errors.push('Company name is required');
    if (!formData.code.trim()) errors.push('Supplier code is required');
    if (!/^[A-Z0-9_]+$/.test(formData.code)) {
      errors.push('Code must contain only uppercase letters, numbers, and underscores');
    }
    if (!formData.email.includes('@')) errors.push('Invalid email address');
    if (!formData.phone.trim()) errors.push('Phone number is required');
    return errors;
  };

  const actionButtons = (
    <Button variant="primary" onClick={() => {
      setSelectedSupplier(null);
      setFormData({
        companyName: '',
        code: '',
        contactPerson: '',
        email: '',
        phone: '',
        alternativePhone: '',
        address: '',
        city: '',
        state: '',
        postalCode: '',
        paymentTerms: '',
        deliverySchedule: '',
        leadTimeDays: 0,
        minimumOrderValue: 0,
        notes: ''
      });
      setShowModal(true);
    }}>
      <FaPlus className="me-2" />
      New Supplier
    </Button>
  );

  return (
    <>
      <ManagementLayout
        title="Supplier Management"
        subtitle="Manage your suppliers and vendor relationships"
        actionButtons={actionButtons}
      >
        <DataTable
          columns={columns}
          data={suppliers}
          loading={loading}
          searchable
          sortable
          pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          onSort={handleSort}
          onSearch={handleSearch}
        />
      </ManagementLayout>

      {/* Create/Edit Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {selectedSupplier ? 'Edit Supplier' : 'New Supplier'}
          </Modal.Title>
        </Modal.Header>
        <form onSubmit={(e) => {
          e.preventDefault();
          const errors = validateForm();
          if (errors.length > 0) {
            errors.forEach(error => toast.error(error));
            return;
          }
          handleSubmit(e);
        }}>
          <Modal.Body>
            <SupplierForm
              formData={formData}
              onChange={setFormData}
            />
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              {selectedSupplier ? 'Update' : 'Create'}
            </Button>
          </Modal.Footer>
        </form>
      </Modal>

      {/* Details Modal */}
      <Modal 
        show={showDetails} 
        onHide={() => setShowDetails(false)}
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            Supplier Details
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedSupplier && (
            <div>
              {/* Company Information */}
              <Card className="mb-3">
                <Card.Body>
                  <Card.Title>Company Information</Card.Title>
                  <Row>
                    <Col md={6}>
                      <p><strong>Company Name:</strong> {selectedSupplier.companyName}</p>
                      <p><strong>Code:</strong> {selectedSupplier.code}</p>
                    </Col>
                    <Col md={6}>
                      <p>
                        <strong>Status:</strong>{' '}
                        <Badge bg={selectedSupplier.active ? 'success' : 'danger'}>
                          {selectedSupplier.active ? 'Active' : 'Inactive'}
                        </Badge>
                      </p>
                      <p>
                        <strong>Performance Rating:</strong>{' '}
                        <Badge bg="info">{selectedSupplier.performanceRating?.toFixed(1) || 'N/A'} ★</Badge>
                      </p>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>

              {/* Contact Information */}
              <Card className="mb-3">
                <Card.Body>
                  <Card.Title>Contact Information</Card.Title>
                  <Row>
                    <Col md={6}>
                      <p>
                        <FaPhone className="me-2" />
                        <strong>Phone:</strong> {selectedSupplier.phone}
                      </p>
                      {selectedSupplier.alternativePhone && (
                        <p>
                          <FaPhone className="me-2" />
                          <strong>Alternative:</strong> {selectedSupplier.alternativePhone}
                        </p>
                      )}
                    </Col>
                    <Col md={6}>
                      <p>
                        <FaEnvelope className="me-2" />
                        <strong>Email:</strong> {selectedSupplier.email}
                      </p>
                      <p>
                        <strong>Contact Person:</strong> {selectedSupplier.contactPerson}
                      </p>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>

              {/* Address */}
              <Card className="mb-3">
                <Card.Body>
                  <Card.Title>
                    <FaMapMarkerAlt className="me-2" />
                    Address
                  </Card.Title>
                  <p>{selectedSupplier.address}</p>
                  <p>{selectedSupplier.city}, {selectedSupplier.state} {selectedSupplier.postalCode}</p>
                </Card.Body>
              </Card>

              {/* Business Terms */}
              <Card className="mb-3">
                <Card.Body>
                  <Card.Title>Business Terms</Card.Title>
                  <Row>
                    <Col md={6}>
                      <p>
                        <FaMoneyBillWave className="me-2" />
                        <strong>Payment Terms:</strong>{' '}
                        {PAYMENT_TERMS_LABELS[selectedSupplier.paymentTerms]}
                      </p>
                      <p>
                        <strong>Minimum Order:</strong> ${selectedSupplier.minimumOrderValue}
                      </p>
                    </Col>
                    <Col md={6}>
                      <p>
                        <FaTruck className="me-2" />
                        <strong>Delivery Schedule:</strong>{' '}
                        {DELIVERY_SCHEDULE_LABELS[selectedSupplier.deliverySchedule]}
                      </p>
                      <p>
                        <FaClock className="me-2" />
                        <strong>Lead Time:</strong> {selectedSupplier.leadTimeDays} days
                      </p>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>

              {/* Notes */}
              {selectedSupplier.notes && (
                <Card>
                  <Card.Body>
                    <Card.Title>Notes</Card.Title>
                    <p>{selectedSupplier.notes}</p>
                  </Card.Body>
                </Card>
              )}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDetails(false)}>
            Close
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              setShowDetails(false);
              handleEdit(selectedSupplier);
            }}
          >
            Edit Supplier
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default SupplierManagement;
