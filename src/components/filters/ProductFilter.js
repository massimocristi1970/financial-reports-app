// src/components/filters/ProductFilter.js
import React, { useState, useEffect, useRef } from 'react';
import { PRODUCT_TYPES } from '../../utils/constants';

const ProductFilter = ({ 
  selectedProducts = [], 
  onChange, 
  reportType,
  label = "Products",
  className = "",
  allowMultiple = true 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef(null);

  // Get available products based on report type
  const getAvailableProducts = () => {
    // Return all products or filter based on report type
    return Object.values(PRODUCT_TYPES).filter(product => {
      // Add logic here to filter products based on report type if needed
      switch (reportType) {
        case 'lending-volume':
          return ['Personal Loans', 'Business Loans', 'Mortgages', 'Credit Cards'].includes(product.name);
        case 'arrears':
        case 'liquidations':
          return ['Personal Loans', 'Business Loans', 'Mortgages'].includes(product.name);
        case 'call-center':
        case 'complaints':
          return true; // All products available
        default:
          return true;
      }
    });
  };

  const availableProducts = getAvailableProducts();

  // Filter products based on search term
  const filteredProducts = availableProducts.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleProductToggle = (productCode) => {
    if (!allowMultiple) {
      onChange([productCode]);
      setIsOpen(false);
      return;
    }

    const newSelection = selectedProducts.includes(productCode)
      ? selectedProducts.filter(code => code !== productCode)
      : [...selectedProducts, productCode];
    
    onChange(newSelection);
  };

  const handleSelectAll = () => {
    if (selectedProducts.length === filteredProducts.length) {
      onChange([]);
    } else {
      onChange(filteredProducts.map(p => p.code));
    }
  };

  const handleClear = () => {
    onChange([]);
  };

  const getSelectedProductNames = () => {
    return selectedProducts
      .map(code => {
        const product = availableProducts.find(p => p.code === code);
        return product ? product.name : code;
      })
      .join(', ');
  };

  const getDisplayText = () => {
    if (selectedProducts.length === 0) return 'Select products...';
    if (selectedProducts.length === 1) return getSelectedProductNames();
    return `${selectedProducts.length} products selected`;
  };

  const allSelected = filteredProducts.length > 0 && 
    filteredProducts.every(product => selectedProducts.includes(product.code));

  return (
    <div className={`product-filter ${className}`} ref={dropdownRef}>
      <label className="filter-label">
        {label}
        {selectedProducts.length > 0 && (
          <button 
            onClick={handleClear} 
            className="clear-btn" 
            type="button"
            title="Clear selection"
          >
            ×
          </button>
        )}
      </label>

      {/* Selection Display */}
      <div 
        className={`selection-display ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="selection-text">
          {getDisplayText()}
        </span>
        <span className="dropdown-arrow">
          {isOpen ? '▲' : '▼'}
        </span>
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="dropdown-menu">
          {/* Search Input */}
          <div className="search-container">
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>

          {/* Select All Option */}
          {allowMultiple && filteredProducts.length > 1 && (
            <div className="option-item select-all" onClick={handleSelectAll}>
              <input
                type="checkbox"
                checked={allSelected}
                onChange={() => {}} // Handled by onClick
                className="option-checkbox"
              />
              <span className="option-text">
                {allSelected ? 'Deselect All' : 'Select All'}
              </span>
            </div>
          )}

          {/* Product Options */}
          <div className="options-list">
            {filteredProducts.length > 0 ? (
              filteredProducts.map(product => (
                <div 
                  key={product.code}
                  className="option-item"
                  onClick={() => handleProductToggle(product.code)}
                >
                  <input
                    type={allowMultiple ? "checkbox" : "radio"}
                    checked={selectedProducts.includes(product.code)}
                    onChange={() => {}} // Handled by onClick
                    className="option-checkbox"
                  />
                  <div className="option-content">
                    <span className="option-text">{product.name}</span>
                    <span className="option-code">({product.code})</span>
                  </div>
                  {product.description && (
                    <span className="option-description">{product.description}</span>
                  )}
                </div>
              ))
            ) : (
              <div className="no-options">
                No products found matching "{searchTerm}"
              </div>
            )}
          </div>
        </div>
      )}

      {/* Selected Items Display */}
      {selectedProducts.length > 0 && selectedProducts.length <= 3 && (
        <div className="selected-items">
          {selectedProducts.map(code => {
            const product = availableProducts.find(p => p.code === code);
            return product ? (
              <span key={code} className="selected-item">
                {product.name}
                <button 
                  onClick={() => handleProductToggle(code)}
                  className="remove-item"
                  title={`Remove ${product.name}`}
                >
                  ×
                </button>
              </span>
            ) : null;
          })}
        </div>
      )}

      <style jsx>{`
        .product-filter {
          position: relative;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .filter-label {
          font-weight: 600;
          font-size: 14px;
          color: #2d3748;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .clear-btn {
          background: none;
          border: none;
          color: #e53e3e;
          font-size: 18px;
          cursor: pointer;
          padding: 0;
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          transition: background 0.2s;
        }

        .clear-btn:hover {
          background: #fed7d7;
        }

        .selection-display {
          padding: 10px 12px;
          border: 1px solid #cbd5e0;
          border-radius: 4px;
          background: #fff;
          cursor: pointer;
          display: flex;
          justify-content: space-between;
          align-items: center;
          transition: border-color 0.2s;
          min-height: 40px;
        }

        .selection-display:hover {
          border-color: #a0aec0;
        }

        .selection-display.open {
          border-color: #3182ce;
          box-shadow: 0 0 0 3px rgba(49, 130, 206, 0.1);
        }

        .selection-text {
          color: #4a5568;
          font-size: 14px;
          flex: 1;
        }

        .dropdown-arrow {
          color: #718096;
          font-size: 12px;
          transition: transform 0.2s;
        }

        .dropdown-menu {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          background: #fff;
          border: 1px solid #cbd5e0;
          border-radius: 4px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          z-index: 1000;
          max-height: 300px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        .search-container {
          padding: 12px;
          border-bottom: 1px solid #e2e8f0;
        }

        .search-input {
          width: 100%;
          padding: 8px 12px;
          border: 1px solid #cbd5e0;
          border-radius: 4px;
          font-size: 14px;
        }

        .search-input:focus {
          outline: none;
          border-color: #3182ce;
        }

        .options-list {
          flex: 1;
          overflow-y: auto;
          max-height: 200px;
        }

        .option-item {
          padding: 12px;
          cursor: pointer;
          display: flex;
          align-items: flex-start;
          gap: 10px;
          transition: background 0.2s;
          border-bottom: 1px solid #f7fafc;
        }

        .option-item:hover {
          background: #f7fafc;
        }

        .option-item.select-all {
          font-weight: 600;
          background: #edf2f7;
          border-bottom: 2px solid #cbd5e0;
        }

        .option-checkbox {
          margin: 0;
          flex-shrink: 0;
        }

        .option-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .option-text {
          font-size: 14px;
          color: #2d3748;
          font-weight: 500;
        }

        .option-code {
          font-size: 12px;
          color: #718096;
        }

        .option-description {
          font-size: 12px;
          color: #a0aec0;
          margin-top: 4px;
        }

        .no-options {
          padding: 20px;
          text-align: center;
          color: #718096;
          font-style: italic;
        }

        .selected-items {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-top: 4px;
        }

        .selected-item {
          background: #e6fffa;
          color: #234e52;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          display: flex;
          align-items: center;
          gap: 6px;
          border: 1px solid #81e6d9;
        }

        .remove-item {
          background: none;
          border: none;
          color: #234e52;
          cursor: pointer;
          font-size: 14px;
          padding: 0;
          width: 16px;
          height: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          transition: background 0.2s;
        }

        .remove-item:hover {
          background: rgba(35, 78, 82, 0.1);
        }

        /* Responsive Design */
        @media (max-width: 768px) {
          .dropdown-menu {
            max-height: 250px;
          }

          .options-list {
            max-height: 150px;
          }

          .option-item {
            padding: 10px;
          }

          .search-container {
            padding: 10px;
          }
        }

        @media (max-width: 480px) {
          .selection-display {
            padding: 8px 10px;
            min-height: 36px;
          }

          .selection-text {
            font-size: 13px;
          }

          .dropdown-menu {
            max-height: 200px;
          }

          .selected-items {
            gap: 4px;
          }

          .selected-item {
            font-size: 11px;
            padding: 3px 6px;
          }
        } 
