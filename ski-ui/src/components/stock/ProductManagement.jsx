import React, { useState, useEffect } from 'react';
import { Button, Modal, Badge } from 'react-bootstrap';
import { FaPlus, FaEdit, FaTrash, FaExclamationTriangle } from 'react-icons/fa';
import { toast } from 'react-toastify';
import ManagementLayout from '../shared/ManagementLayout';
import DataTable from '../shared/DataTable';
import ProductForm from './ProductForm';
import useDataTable from '../../hooks/useDataTable';
import { createApiService } from '../../utils/api';

const productApi = createApiService('products');
const categoryApi = createApiService('categories');

const ProductManagement = () => {
  const [showModal, setShowModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    categoryId: '',
    unitPrice: 0,
    unitOfMeasure: '',
    minStockLevel: 0,
    maxStockLevel: 0,
    description: '',
    storageLocation: '',
    sku: ''
  });

  const {
    data: products,
    loading,
    handlePageChange,
    handleSort,
    handleSearch,
    refresh,
    currentPage,
    totalPages
  } = useDataTable({
    fetchData: productApi.getAll,
    defaultSort: { field: 'name', direction: 'asc' }
  });

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await categoryApi.getAll();
        setCategories(response.data);
      } catch (error) {
        toast.error('Failed to load categories');
      }
    };
    loadCategories();
  }, []);

  const columns = [
    { key: 'sku', label: 'SKU', sortable: true },
    { key: 'name', label: 'Name', sortable: true },
    { 
      key: 'category',
      label: 'Category',
      sortable: true,
      render: (row) => row.category?.name
    },
    { 
      key: 'stockLevel',
      label: 'Stock Level',
      sortable: true,
      render: (row) => {
        const stockLevel = row.currentStock || 0;
        let badgeVariant = 'success';
        let icon = null;

        if (stockLevel <= row.minStockLevel) {
          badgeVariant = 'danger';
          icon = <FaExclamationTriangle className="me-1" />;
        } else if (stockLevel <= row.minStockLevel * 1.2) {
          badgeVariant = 'warning';
          icon = <FaExclamationTriangle className="me-1" />;
        }

        return (
          <Badge bg={badgeVariant}>
            {icon}
            {stockLevel} {row.unitOfMeasure}
          </Badge>
        );
      }
    },
    { 
      key: 'unitPrice',
      label: 'Unit Price',
      sortable: true,
      render: (row) => `$${row.unitPrice.toFixed(2)}`
    },
    { key: 'storageLocation', label: 'Location', sortable: true },
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

  const handleEdit = (product) => {
    setSelectedProduct(product);
    setFormData({
      name: product.name,
      categoryId: product.categoryId,
      unitPrice: product.unitPrice,
      unitOfMeasure: product.unitOfMeasure,
      minStockLevel: product.minStockLevel,
      maxStockLevel: product.maxStockLevel,
      description: product.description || '',
      storageLocation: product.storageLocation || '',
      sku: product.sku
    });
    setShowModal(true);
  };

  const handleDelete = async (product) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await productApi.delete(product.id);
        toast.success('Product deleted successfully');
        refresh();
      } catch (error) {
        toast.error('Failed to delete product');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedProduct) {
        await productApi.update(selectedProduct.id, formData);
        toast.success('Product updated successfully');
      } else {
        await productApi.create('', formData);
        toast.success('Product created successfully');
      }
      setShowModal(false);
      refresh();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save product');
    }
  };

  const actionButtons = (
    <Button variant="primary" onClick={() => {
      setSelectedProduct(null);
      setFormData({
        name: '',
        categoryId: '',
        unitPrice: 0,
        unitOfMeasure: '',
        minStockLevel: 0,
        maxStockLevel: 0,
        description: '',
        storageLocation: '',
        sku: ''
      });
      setShowModal(true);
    }}>
      <FaPlus className="me-2" />
      New Product
    </Button>
  );

  return (
    <>
      <ManagementLayout
        title="Product Management"
        subtitle="Manage your product catalog"
        actionButtons={actionButtons}
      >
        <DataTable
          columns={columns}
          data={products}
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

      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {selectedProduct ? 'Edit Product' : 'New Product'}
          </Modal.Title>
        </Modal.Header>
        <form onSubmit={handleSubmit}>
          <Modal.Body>
            <ProductForm
              formData={formData}
              onChange={setFormData}
              categories={categories}
            />
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              {selectedProduct ? 'Update' : 'Create'}
            </Button>
          </Modal.Footer>
        </form>
      </Modal>
    </>
  );
};

export default ProductManagement;
