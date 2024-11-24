import React, { useState } from 'react';
import { Table, Form, InputGroup, Pagination } from 'react-bootstrap';
import { FaSearch, FaSort, FaSortUp, FaSortDown } from 'react-icons/fa';
import PropTypes from 'prop-types';

const DataTable = ({
  columns,
  data,
  searchable,
  sortable,
  pagination,
  onSort,
  onSearch,
  onPageChange,
  currentPage,
  totalPages,
  loading,
  emptyMessage = 'No data available'
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
    onSort?.(key, direction);
  };

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    onSearch?.(value);
  };

  const getSortIcon = (columnKey) => {
    if (sortConfig.key !== columnKey) return <FaSort />;
    return sortConfig.direction === 'asc' ? <FaSortUp /> : <FaSortDown />;
  };

  const renderPagination = () => {
    if (!pagination || totalPages <= 1) return null;

    let items = [];
    for (let number = 1; number <= totalPages; number++) {
      items.push(
        <Pagination.Item
          key={number}
          active={number === currentPage}
          onClick={() => onPageChange?.(number)}
        >
          {number}
        </Pagination.Item>
      );
    }

    return (
      <div className="d-flex justify-content-between align-items-center mt-3">
        <div className="text-muted">
          Page {currentPage} of {totalPages}
        </div>
        <Pagination className="mb-0">
          <Pagination.First
            onClick={() => onPageChange?.(1)}
            disabled={currentPage === 1}
          />
          <Pagination.Prev
            onClick={() => onPageChange?.(currentPage - 1)}
            disabled={currentPage === 1}
          />
          {items}
          <Pagination.Next
            onClick={() => onPageChange?.(currentPage + 1)}
            disabled={currentPage === totalPages}
          />
          <Pagination.Last
            onClick={() => onPageChange?.(totalPages)}
            disabled={currentPage === totalPages}
          />
        </Pagination>
      </div>
    );
  };

  return (
    <div>
      {searchable && (
        <div className="mb-3">
          <InputGroup>
            <InputGroup.Text>
              <FaSearch />
            </InputGroup.Text>
            <Form.Control
              placeholder="Search..."
              value={searchTerm}
              onChange={handleSearch}
            />
          </InputGroup>
        </div>
      )}

      <div className="table-responsive">
        <Table hover className="align-middle">
          <thead>
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={sortable && column.sortable ? 'cursor-pointer' : ''}
                  onClick={() => {
                    if (sortable && column.sortable) {
                      handleSort(column.key);
                    }
                  }}
                >
                  <div className="d-flex align-items-center gap-2">
                    {column.label}
                    {sortable && column.sortable && getSortIcon(column.key)}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="text-center py-4">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="text-center py-4">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((row, index) => (
                <tr key={row.id || index}>
                  {columns.map((column) => (
                    <td key={column.key}>
                      {column.render ? column.render(row) : row[column.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </Table>
      </div>

      {renderPagination()}
    </div>
  );
};

DataTable.propTypes = {
  columns: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      sortable: PropTypes.bool,
      render: PropTypes.func
    })
  ).isRequired,
  data: PropTypes.array.isRequired,
  searchable: PropTypes.bool,
  sortable: PropTypes.bool,
  pagination: PropTypes.bool,
  onSort: PropTypes.func,
  onSearch: PropTypes.func,
  onPageChange: PropTypes.func,
  currentPage: PropTypes.number,
  totalPages: PropTypes.number,
  loading: PropTypes.bool,
  emptyMessage: PropTypes.string
};

export default DataTable;
