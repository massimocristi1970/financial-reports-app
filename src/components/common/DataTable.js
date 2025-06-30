// src/components/common/DataTable.js
import React, { useState, useMemo } from 'react';
import { formatCurrency, formatNumber, formatPercentage } from '../../utils/formatters';
import { formatDate } from '../../utils/dateUtils';

const DataTable = ({
  data = [],
  columns = [],
  title,
  pageSize = 10,
  showPagination = true,
  showSearch = true,
  showExport = true,
  sortable = true,
  onRowClick,
  onExport,
  isLoading = false,
  error = null,
  emptyMessage = 'No data available'
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [searchTerm, setSearchTerm] = useState('');

  // Filter data based on search term
  const filteredData = useMemo(() => {
    if (!searchTerm) return data;
    
    return data.filter(row =>
      columns.some(column => {
        const value = row[column.key];
        if (value === null || value === undefined) return false;
        return value.toString().toLowerCase().includes(searchTerm.toLowerCase());
      })
    );
  }, [data, searchTerm, columns]);

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortConfig.key) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
      }

      const aString = aValue.toString().toLowerCase();
      const bString = bValue.toString().toLowerCase();

      if (aString < bString) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aString > bString) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredData, sortConfig]);

  // Paginate data
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return sortedData.slice(startIndex, startIndex + pageSize);
  }, [sortedData, currentPage, pageSize]);

  // Calculate pagination info
  const totalPages = Math.ceil(sortedData.length / pageSize);
  const startRow = (currentPage - 1) * pageSize + 1;
  const endRow = Math.min(currentPage * pageSize, sortedData.length);

  // Handle sorting
  const handleSort = (key) => {
    if (!sortable) return;

    setSortConfig(prevConfig => ({
      key,
      direction: prevConfig.key === key && prevConfig.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  // Format cell value based on column type
  const formatCellValue = (value, column) => {
    if (value === null || value === undefined) return '-';

    switch (column.type) {
      case 'currency':
        return formatCurrency(value);
      case 'percentage':
        return formatPercentage(value);
      case 'number':
        return formatNumber(value);
      case 'date':
        return formatDate(value);
      case 'boolean':
        return value ? '✅' : '❌';
      default:
        return value.toString();
    }
  };

  // Get sort icon
  const getSortIcon = (columnKey) => {
    if (sortConfig.key !== columnKey) return '↕️';
    return sortConfig.direction === 'asc' ? '↑' : '↓';
  };

  // Handle export
  const handleExport = () => {
    if (onExport) {
      onExport(sortedData, columns);
    } else {
      // Default CSV export
      const headers = columns.map(col => col.header).join(',');
      const rows = sortedData.map(row =>
        columns.map(col => {
          const value = formatCellValue(row[col.key], col);
          return `"${value.replace(/"/g, '""')}"`;
        }).join(',')
      );
      
      const csvContent = [headers, ...rows].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `${title || 'data'}_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      
      URL.revokeObjectURL(url);
    }
  };

  if (isLoading) {
    return (
      <div className="data-table-container">
        <div className="data-table-loading">
          <div className="loading-spinner"></div>
          <div className="loading-text">Loading data...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="data-table-container">
        <div className="data-table-error">
          <div className="error-icon">⚠️</div>
          <div className="error-message">
            <h4>Error Loading Data</h4>
            <p>{error.message || 'Failed to load table data'}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="data-table-container">
      {/* Table Header */}
      <div className="data-table-header">
        {title && <h3 className="data-table-title">{title}</h3>}
        
        <div className="data-table-controls">
          {showSearch && (
            <div className="search-container">
              <input
                type="text"
                className="search-input"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1); // Reset to first page on search
                }}
              />
              <span className="search-icon">🔍</span>
            </div>
          )}
          
          {showExport && sortedData.length > 0 && (
            <button
              className="export-button"
              onClick={handleExport}
              title="Export to CSV"
            >
              📁 Export
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="data-table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`table-header ${sortable ? 'sortable' : ''} ${
                    sortConfig.key === column.key ? 'sorted' : ''
                  }`}
                  onClick={() => handleSort(column.key)}
                  style={{ width: column.width }}
                >
                  <div className="header-content">
                    <span className="header-text">{column.header}</span>
                    {sortable && (
                      <span className="sort-icon">{getSortIcon(column.key)}</span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="empty-message">
                  {filteredData.length === 0 && searchTerm 
                    ? `No results found for "${searchTerm}"`
                    : emptyMessage
                  }
                </td>
              </tr>
            ) : (
              paginatedData.map((row, index) => (
                <tr
                  key={index}
                  className={`table-row ${onRowClick ? 'clickable' : ''}`}
                  onClick={() => onRowClick?.(row, index)}
                >
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className={`table-cell ${column.align || 'left'}`}
                    >
                      {formatCellValue(row[column.key], column)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {showPagination && totalPages > 1 && (
        <div className="data-table-pagination">
          <div className="pagination-info">
            Showing {startRow}-{endRow} of {sortedData.length} entries
            {searchTerm && ` (filtered from ${data.length} total)`}
          </div>
          
          <div className="pagination-controls">
            <button
              className="pagination-button"
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
            >
              ⏮️
            </button>
            <button
              className="pagination-button"
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
            >
              ◀️
            </button>
            
            <div className="page-numbers">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage > totalPages - 3) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                return (
                  <button
                    key={pageNum}
                    className={`page-button ${currentPage === pageNum ? 'active' : ''}`}
                    onClick={() => setCurrentPage(pageNum)}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            
            <button
              className="pagination-button"
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              ▶️
            </button>
            <button
              className="pagination-button"
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
            >
              ⏭️
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataTable; 
