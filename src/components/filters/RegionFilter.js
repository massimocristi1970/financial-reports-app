// src/components/filters/RegionFilter.js
import React, { useState, useEffect, useRef } from 'react';
import { REGIONS, REGION_GROUPS } from '../../utils/constants';

const RegionFilter = ({ 
  selectedRegions = [], 
  onChange, 
  reportType,
  label = "Regions",
  className = "",
  allowMultiple = true,
  groupByCategory = true 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedGroups, setExpandedGroups] = useState(new Set(['major-cities']));
  const dropdownRef = useRef(null);

  // Get available regions based on report type
  const getAvailableRegions = () => {
    return Object.values(REGIONS);
  };

  const availableRegions = getAvailableRegions();

  // Filter regions based on search term
  const filteredRegions = availableRegions.filter(region =>
    region.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    region.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (region.state && region.state.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Group regions by category
  const groupedRegions = groupByCategory ? 
    Object.entries(REGION_GROUPS).reduce((acc, [groupKey, group]) => {
      const regionsInGroup = filteredRegions.filter(region => 
        group.regions.includes(region.code)
      );
      if (regionsInGroup.length > 0) {
        acc[groupKey] = {
          ...group,
          regions: regionsInGroup
        };
      }
      return acc;
    }, {}) : 
    { all: { name: 'All Regions', regions: filteredRegions } };

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

  const handleRegionToggle = (regionCode) => {
    if (!allowMultiple) {
      onChange([regionCode]);
      setIsOpen(false);
      return;
    }

    const newSelection = selectedRegions.includes(regionCode)
      ? selectedRegions.filter(code => code !== regionCode)
      : [...selectedRegions, regionCode];
    
    onChange(newSelection);
  };

  const handleGroupToggle = (groupKey) => {
    const group = groupedRegions[groupKey];
    if (!group) return;

    const groupRegionCodes = group.regions.map(r => r.code);
    const allSelected = groupRegionCodes.every(code => selectedRegions.includes(code));

    if (allSelected) {
      // Deselect all regions in this group
      onChange(selectedRegions.filter(code => !groupRegionCodes.includes(code)));
    } else {
      // Select all regions in this group
      const newSelection = [...selectedRegions];
      groupRegionCodes.forEach(code => {
        if (!newSelection.includes(code)) {
          newSelection.push(code);
        }
      });
      onChange(newSelection);
    }
  };

  const handleSelectAll = () => {
    if (selectedRegions.length === filteredRegions.length) {
      onChange([]);
    } else {
      onChange(filteredRegions.map(r => r.code));
    }
  };

  const handleClear = () => {
    onChange([]);
  };

  const toggleGroupExpansion = (groupKey) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupKey)) {
      newExpanded.delete(groupKey);
    } else {
      newExpanded.add(groupKey);
    }
    setExpandedGroups(newExpanded);
  };

  const getSelectedRegionNames = () => {
    return selectedRegions
      .map(code => {
        const region = availableRegions.find(r => r.code === code);
        return region ? region.name : code;
      })
      .join(', ');
  };

  const getDisplayText = () => {
    if (selectedRegions.length === 0) return 'Select regions...';
    if (selectedRegions.length === 1) return getSelectedRegionNames();
    return `${selectedRegions.length} regions selected`;
  };

  const allSelected = filteredRegions.length > 0 && 
    filteredRegions.every(region => selectedRegions.includes(region.code));

  return (
    <div className={`region-filter ${className}`} ref={dropdownRef}>
      <label className="filter-label">
        {label}
        {selectedRegions.length > 0 && (
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
              placeholder="Search regions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>

          {/* Select All Option */}
          {allowMultiple && filteredRegions.length > 1 && (
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

          {/* Grouped Regions */}
          <div className="options-list">
            {Object.keys(groupedRegions).length > 0 ? (
              Object.entries(groupedRegions).map(([groupKey, group]) => (
                <div key={groupKey} className="region-group">
                  {groupByCategory && Object.keys(groupedRegions).length > 1 && (
                    <div className="group-header">
                      <button
                        onClick={() => toggleGroupExpansion(groupKey)}
                        className="group-toggle"
                      >
                        <span className="group-arrow">
                          {expandedGroups.has(groupKey) ? '▼' : '▶'}
                        </span>
                        <span className="group-name">{group.name}</span>
                        <span className="group-count">({group.regions.length})</span>
                      </button>
                      {allowMultiple && (
                        <button
                          onClick={() => handleGroupToggle(groupKey)}
                          className="group-select-all"
                        >
                          {group.regions.every(r => selectedRegions.includes(r.code)) ? 
                            'Deselect All' : 'Select All'}
                        </button>
                      )}
                    </div>
                  )}
                  
                  {(!groupByCategory || expandedGroups.has(groupKey)) && (
                    <div className="group-regions">
                      {group.regions.map(region => (
                        <div 
                          key={region.code}
                          className="option-item"
                          onClick={() => handleRegionToggle(region.code)}
                        >
                          <input
                            type={allowMultiple ? "checkbox" : "radio"}
                            checked={selectedRegions.includes(region.code)}
                            onChange={() => {}} // Handled by onClick
                            className="option-checkbox"
                          />
                          <div className="option-content">
                            <span className="option-text">{region.name}</span>
                            <span className="option-details">
                              {region.state && <span className="region-state">{region.state}</span>}
                              <span className="region-code">({region.code})</span>
                            </span>
                          </div>
                          {region.population && (
                            <span className="region-population">
                              {(region.population / 1000000).toFixed(1)}M
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="no-options">
                No regions found matching "{searchTerm}"
              </div>
            )}
          </div>
        </div>
      )}

      {/* Selected Items Display */}
      {selectedRegions.length > 0 && selectedRegions.length <= 4 && (
        <div className="selected-items">
          {selectedRegions.map(code => {
            const region = availableRegions.find(r => r.code === code);
            return region ? (
              <span key={code} className="selected-item">
                {region.name}
                <button 
                  onClick={() => handleRegionToggle(code)}
                  className="remove-item"
                  title={`Remove ${region.name}`}
                >
                  ×
                </button>
              </span>
            ) : null;
          })}
        </div>
      )}

      <style jsx>{`
        .region-filter {
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
          max-height: 400px;
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
          max-height: 300px;
        }

        .region-group {
          border-bottom: 1px solid #f1f5f9;
        }

        .group-header {
          background: #f8fafc;
          padding: 8px 12px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid #e2e8f0;
        }

        .group-toggle {
          background: none;
          border: none;
          display: flex;
          align-items: center;
          gap: 6px;
          cursor: pointer;
          font-size: 14px;
          color: #374151;
          flex: 1;
          text-align: left;
        }

        .group-arrow {
          font-size: 10px;
          color: #6b7280;
        }

        .group-name {
          font-weight: 600;
        }

        .group-count {
          color: #6b7280;
          font-size: 12px;
        }

        .group-select-all {
          background: none;
          border: 1px solid #d1d5db;
          color: #374151;
          padding: 4px 8px;
          border-radius: 3px;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .group-select-all:hover {
          background: #f3f4f6;
          border-color: #9ca3af;
        }

        .group-regions {
          background: #fff;
        }

        .option-item {
          padding: 10px 12px;
          cursor: pointer;
          display: flex;
          align-items: flex-start;
          gap: 10px;
          transition: background 0.2s;
          border-bottom: 1px solid #f9fafb;
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
          margin-top: 2px;
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

        .option-details {
          display: flex;
          gap: 8px;
          align-items: center;
        }

        .region-state {
          font-size: 12px;
          color: #718096;
        }

        .region-code {
          font-size: 12px;
          color: #a0aec0;
        }

        .region-population {
          font-size: 11px;
          color: #718096;
          font-weight: 500;
          margin-left: auto;
          flex-shrink: 0;
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
            max-height: 350px;
          }

          .options-list {
            max-height: 250px;
          }

          .option-item {
            padding: 8px 10px;
          }

          .group-header {
            padding: 6px 10px;
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
            max-height: 280px;
          }

          .selected-items {
            gap: 4px;
          }

          .selected-item {
            font-size: 11px;
            padding: 3px 6px;
          }

          .group-toggle {
            font-size: 13px;
          }

          .group-select-all {
            font-size: 11px;
            padding: 3px 6px;
          }
        }
      `}</style>
    </div>
  );
};

export default RegionFilter; 
