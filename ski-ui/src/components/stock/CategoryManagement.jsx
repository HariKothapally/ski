import React, { useState } from 'react';
import { Button, Modal, Badge } from 'react-bootstrap';
import { FaPlus, FaEdit, FaTrash, FaBox } from 'react-icons/fa';
import { toast } from 'react-toastify';
import ManagementLayout from '../shared/ManagementLayout';
import DataTable from '../shared/DataTable';
import CategoryForm from './CategoryForm';
import useDataTable from '../../hooks/useDataTable';
import { createApiService } from '../../utils/api';

const categoryApi = createApiService('categories');

const CategoryManagement = () => {
  const [showModal, setShowModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    code: ''
  });

  const {
    data: categories,
    loading,
    handlePageChange,
    handleSort,
    handleSearch,
    refresh,
    currentPage,
    totalPages
  } = useDataTable({
    fetchData: categoryApi.getAll,
    defaultSort: { field: 'name', direction: 'asc' }
  });

  const columns = [
    { key: 'code', label: 'Code', sortable: true },
    { key: 'name', label: 'Name', sortable: true },
    { key: 'description', label: 'Description', sortable: true },
    {
      key: 'productCount',
      label: 'Products',
      sortable: true,
      render: (row) => (
        <Badge bg="info">
          <FaBox className="me-1" />
          {row.productCount || 0}
        </Badge>
      )
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
            disabled={row.productCount > 0}
          >
            <FaTrash />
          </Button>
        </div>
      )
    }
  ];

  const handleEdit = (category) => {
    setSelectedCategory(category);
    setFormData({
      name: category.name,
      description: category.description || '',
      code: category.code
    });
    setShowModal(true);
  };

  const handleDelete = async (category) => {
    if (category.productCount > 0) {
      toast.error('Cannot delete category with associated products');
      return;
    }

    if (window.confirm('Are you sure you want to delete this category?')) {
      try {
        await categoryApi.delete(category.id);
        toast.success('Category deleted successfully');
        refresh();
      } catch (error) {
        toast.error('Failed to delete category');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedCategory) {
        await categoryApi.update(selectedCategory.id, formData);
        toast.success('Category updated successfully');
      } else {
        await categoryApi.create('', formData);
        toast.success('Category created successfully');
      }
      setShowModal(false);
      refresh();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save category');
    }
  };

  const validateForm = () => {
    const errors = [];
    if (!formData.name.trim()) errors.push('Name is required');
    if (!formData.code.trim()) errors.push('Code is required');
    if (formData.code.length < 2 || formData.code.length > 10) {
      errors.push('Code must be between 2 and 10 characters');
    }
    if (!/^[A-Z0-9_]+$/.test(formData.code)) {
      errors.push('Code must contain only uppercase letters, numbers, and underscores');
    }
    return errors;
  };

  const actionButtons = (
    <Button variant="primary" onClick={() => {
      setSelectedCategory(null);
      setFormData({
        name: '',
        description: '',
        code: ''
      });
      setShowModal(true);
    }}>
      <FaPlus className="me-2" />
      New Category
    </Button>
  );

  return (
    <>
      <ManagementLayout
        title="Category Management"
        subtitle="Manage your product categories"
        actionButtons={actionButtons}
      >
        <DataTable
          columns={columns}
          data={categories}
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

      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>
            {selectedCategory ? 'Edit Category' : 'New Category'}
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
            <CategoryForm
              formData={formData}
              onChange={setFormData}
            />
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              {selectedCategory ? 'Update' : 'Create'}
            </Button>
          </Modal.Footer>
        </form>
      </Modal>
    </>
  );
};

export default CategoryManagement;
