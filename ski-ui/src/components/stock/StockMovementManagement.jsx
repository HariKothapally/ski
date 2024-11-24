import React, { useState } from 'react';
import { Button, Badge, Modal, Form, Nav } from 'react-bootstrap';
import { FaPlus, FaEdit, FaTrash, FaArrowUp, FaArrowDown, FaChartLine } from 'react-icons/fa';
import { toast } from 'react-toastify';
import ManagementLayout from '../shared/ManagementLayout';
import DataTable from '../shared/DataTable';
import useDataTable from '../../hooks/useDataTable';
import { createApiService } from '../../utils/api';
import StockAnalytics from './StockAnalytics';

const stockMovementApi = createApiService('stockmovements');

const StockMovementManagement = () => {
  const [showModal, setShowModal] = useState(false);
  const [selectedMovement, setSelectedMovement] = useState(null);
  const [activeTab, setActiveTab] = useState('movements');
  const [formData, setFormData] = useState({
    productId: '',
    quantity: '',
    type: 'IN',
    notes: ''
  });

  const {
    data: stockMovements,
    loading,
    handlePageChange,
    handleSort,
    handleSearch,
    refresh,
    currentPage,
    totalPages
  } = useDataTable({
    fetchData: stockMovementApi.getAll,
    defaultSort: { field: 'createdAt', direction: 'desc' }
  });

  const columns = [
    { key: 'id', label: 'ID', sortable: true },
    { key: 'product', label: 'Product', sortable: true },
    { 
      key: 'type',
      label: 'Type',
      sortable: true,
      render: (row) => (
        <Badge bg={row.type === 'IN' ? 'success' : 'danger'}>
          {row.type === 'IN' ? <FaArrowDown className="me-1" /> : <FaArrowUp className="me-1" />}
          {row.type}
        </Badge>
      )
    },
    { 
      key: 'quantity',
      label: 'Quantity',
      sortable: true,
      render: (row) => (
        <span className={row.type === 'IN' ? 'text-success' : 'text-danger'}>
          {row.type === 'IN' ? '+' : '-'}{row.quantity}
        </span>
      )
    },
    { 
      key: 'createdAt',
      label: 'Date',
      sortable: true,
      render: (row) => new Date(row.createdAt).toLocaleString()
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <div className="d-flex gap-2">
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

  const handleEdit = (movement) => {
    setSelectedMovement(movement);
    setFormData({
      productId: movement.productId,
      quantity: Math.abs(movement.quantity),
      type: movement.type,
      notes: movement.notes || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (movement) => {
    if (window.confirm('Are you sure you want to delete this stock movement?')) {
      try {
        await stockMovementApi.delete(movement.id);
        toast.success('Stock movement deleted successfully');
        refresh();
      } catch (error) {
        toast.error('Failed to delete stock movement');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedMovement) {
        await stockMovementApi.update(selectedMovement.id, formData);
        toast.success('Stock movement updated successfully');
      } else {
        await stockMovementApi.create('', formData);
        toast.success('Stock movement created successfully');
      }
      setShowModal(false);
      refresh();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save stock movement');
    }
  };

  const handleAdd = () => {
    setSelectedMovement(null);
    setFormData({
      productId: '',
      quantity: '',
      type: 'IN',
      notes: ''
    });
    setShowModal(true);
  };

  return (
    <div>
      <Nav variant="tabs" className="mb-3">
        <Nav.Item>
          <Nav.Link 
            active={activeTab === 'movements'} 
            onClick={() => setActiveTab('movements')}
          >
            Stock Movements
          </Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link 
            active={activeTab === 'analytics'} 
            onClick={() => setActiveTab('analytics')}
          >
            <FaChartLine className="me-2" />
            Analytics & Orders
          </Nav.Link>
        </Nav.Item>
      </Nav>

      {activeTab === 'movements' ? (
        <ManagementLayout
          title="Stock Movements"
          actionButton={
            <Button variant="primary" onClick={handleAdd}>
              <FaPlus className="me-2" />
              Add Movement
            </Button>
          }
        >
          <DataTable
            columns={columns}
            data={stockMovements}
            loading={loading}
            onPageChange={handlePageChange}
            onSort={handleSort}
            onSearch={handleSearch}
            currentPage={currentPage}
            totalPages={totalPages}
          />
          
          {/* Movement Form Modal */}
          <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
            <Modal.Header closeButton>
              <Modal.Title>
                {selectedMovement ? 'Edit Stock Movement' : 'New Stock Movement'}
              </Modal.Title>
            </Modal.Header>
            <Form onSubmit={handleSubmit}>
              <Modal.Body>
                <Form.Group className="mb-3">
                  <Form.Label>Product</Form.Label>
                  <Form.Control
                    type="text"
                    name="productId"
                    value={formData.productId}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      productId: e.target.value
                    }))}
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Type</Form.Label>
                  <Form.Select
                    name="type"
                    value={formData.type}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      type: e.target.value
                    }))}
                    required
                  >
                    <option value="IN">Stock In</option>
                    <option value="OUT">Stock Out</option>
                  </Form.Select>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Quantity</Form.Label>
                  <Form.Control
                    type="number"
                    name="quantity"
                    value={formData.quantity}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      quantity: e.target.value
                    }))}
                    min="1"
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Notes</Form.Label>
                  <Form.Control
                    as="textarea"
                    name="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      notes: e.target.value
                    }))}
                    rows={3}
                  />
                </Form.Group>
              </Modal.Body>
              <Modal.Footer>
                <Button variant="secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </Button>
                <Button variant="primary" type="submit">
                  {selectedMovement ? 'Update' : 'Create'}
                </Button>
              </Modal.Footer>
            </Form>
          </Modal>
        </ManagementLayout>
      ) : (
        <StockAnalytics />
      )}
    </div>
  );
};

export default StockMovementManagement;
