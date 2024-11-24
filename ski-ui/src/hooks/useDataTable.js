import { useState, useCallback, useEffect } from 'react';
import { toast } from 'react-toastify';

const useDataTable = ({
  fetchData,
  defaultSort = { field: 'id', direction: 'desc' },
  defaultPageSize = 10,
  searchFields = []
}) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(defaultPageSize);
  const [sortField, setSortField] = useState(defaultSort.field);
  const [sortDirection, setSortDirection] = useState(defaultSort.direction);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({});

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = {
        page: currentPage,
        size: pageSize,
        sort: `${sortField},${sortDirection}`,
        search: searchTerm,
        ...filters
      };

      const response = await fetchData(params);
      
      setData(response.data.content || response.data);
      setTotalItems(response.data.totalElements || response.data.length);
    } catch (err) {
      setError(err);
      toast.error('Failed to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, sortField, sortDirection, searchTerm, filters, fetchData]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleSort = (field, direction) => {
    setSortField(field);
    setSortDirection(direction);
    setCurrentPage(1);
  };

  const handleSearch = (term) => {
    setSearchTerm(term);
    setCurrentPage(1);
  };

  const handleFilter = (filterName, value) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
    setCurrentPage(1);
  };

  const refresh = () => {
    loadData();
  };

  const totalPages = Math.ceil(totalItems / pageSize);

  return {
    // State
    data,
    loading,
    error,
    currentPage,
    totalPages,
    totalItems,
    pageSize,
    sortField,
    sortDirection,
    searchTerm,
    filters,

    // Handlers
    handlePageChange,
    handleSort,
    handleSearch,
    handleFilter,
    refresh,

    // Utils
    isEmpty: data.length === 0,
    isFirstPage: currentPage === 1,
    isLastPage: currentPage === totalPages
  };
};

export default useDataTable;
