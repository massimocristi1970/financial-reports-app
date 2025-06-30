// src/components/filters/FilterPanel.js
import React, { useState, useEffect } from 'react';
import DateRangeFilter from './DateRangeFilter';
import ProductFilter from './ProductFilter';
import RegionFilter from './RegionFilter';
import { FILTER_TYPES, DEFAULT_FILTERS } from '../../utils/constants';

const FilterPanel = ({ 
  reportType, 
  onFiltersChange, 
  initialFilters = DEFAULT_FILTERS,
  className = '',
  isCollapsible = true 
}) => {
  const [filters, setFilters] = useState(initialFilters);
  const [isExpanded, setIsExpanded] = useState(true);

  // Update parent when filters change
  useEffect(() => {
    onFiltersChange(filters);
  }, [filters, onFiltersChange]);

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const handleClearFilters = () => {
    setFilters(DEFAULT_FILTERS);
  };

  const handleApplyFilters = () => {
    onFiltersChange(filters);
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.dateRange.startDate && filters.dateRange.endDate) count++;
    if (filters.products && filters.products.length > 0) count++;
    if (filters.regions && filters.regions.length > 0) count++;
    return count;
  };

  const activeCount = getActiveFilterCount();

  return (
    <div className={`filter-panel ${className}`}>
      {/* Filter Header */}
      <div className="filter-header">
        <div className="filter-title">
          <h3>Filters</h3>
          {activeCount > 0 && (
            <span className="filter-badge">{activeCount} active</span>
          )}
        </div>
        
        <div className="filter-actions">
          {activeCount > 0 && (
            <button 
              onClick={handleClearFilters}
              className="btn-clear"
              title="Clear all filters"
            >
              Clear All
            </button>
          )}
          
          {isCollapsible && (
            <button 
              onClick={() => setIsExpanded(!isExpanded)}
              className="btn-toggle"
              title={isExpanded ? "Collapse filters" : "Expand filters"}
            >
              {isExpanded ? '−' : '+'}
            </button>
          )}
        </div>
      </div>

      {/* Filter Content */}
      {isExpanded && (
        <div className="filter-content">
          <div className="filter-grid">
            {/* Date Range Filter */}
            <div className="filter-group">
              <DateRangeFilter
                value={filters.dateRange}
                onChange={(dateRange) => handleFilterChange('dateRange', dateRange)}
                reportType={reportType}
              />
            </div>

            {/* Product Filter */}
            <div className="filter-group">
              <ProductFilter
                selectedProducts={filters.products}
                onChange={(products) => handleFilterChange('products', products)}
                reportType={reportType}
              />
            </div>

            {/* Region Filter */}
            <div className="filter-group">
              <RegionFilter
                selectedRegions={filters.regions}
                onChange={(regions) => handleFilterChange('regions', regions)}
                reportType={reportType}
              />
            </div>
          </div>

          {/* Apply Button */}
          <div className="filter-footer">
            <button 
              onClick={handleApplyFilters}
              className="btn-apply"
            >
              Apply Filters
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        .filter-panel {
          background: #fff;
          border: 1px solid #e1e5e9;
          border-radius: 8px;
          margin-bottom: 24px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .filter-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          border-bottom: 1px solid #e1e5e9;
          background: #f8f9fa;
          border-radius: 8px 8px 0 0;
        }

        .filter-title {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .filter-title h3 {
          margin: 0;
          font-size: 16px;
          font-weight: 600;
          color: #2d3748;
        }

        .filter-badge {
          background: #3182ce;
          color: white;
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 500;
        }

        .filter-actions {
          display: flex;
          gap: 8px;
          align-items: center;
        }

        .btn-clear {
          background: none;
          border: 1px solid #e53e3e;
          color: #e53e3e;
          padding: 6px 12px;
          border-radius: 4px;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-clear:hover {
          background: #e53e3e;
          color: white;
        }

        .btn-toggle {
          background: none;
          border: 1px solid #cbd5e0;
          color: #4a5568;
          padding: 6px 10px;
          border-radius: 4px;
          font-size: 16px;
          cursor: pointer;
          transition: all 0.2s;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .btn-toggle:hover {
          background: #edf2f7;
          border-color: #a0aec0;
        }

        .filter-content {
          padding: 20px;
        }

        .filter-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 20px;
          margin-bottom: 20px;
        }

        .filter-group {
          display: flex;
          flex-direction: column;
        }

        .filter-footer {
          border-top: 1px solid #e1e5e9;
          padding-top: 16px;
          display: flex;
          justify-content: flex-end;
        }

        .btn-apply {
          background: #3182ce;
          color: white;
          border: none;
          padding: 10px 24px;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.2s;
        }

        .btn-apply:hover {
          background: #2c5aa0;
        }

        /* Responsive Design */
        @media (max-width: 768px) {
          .filter-header {
            padding: 12px 16px;
          }

          .filter-content {
            padding: 16px;
          }

          .filter-grid {
            grid-template-columns: 1fr;
            gap: 16px;
          }

          .filter-title h3 {
            font-size: 15px;
          }

          .btn-clear, .btn-apply {
            font-size: 13px;
            padding: 8px 16px;
          }
        }
      `}</style>
    </div>
  );
};

export default FilterPanel; 
