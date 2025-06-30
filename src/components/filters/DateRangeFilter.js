// src/components/filters/DateRangeFilter.js
import React, { useState, useEffect } from 'react';
import { formatDate, getDateRangePresets, isValidDateRange } from '../../utils/dateUtils';

const DateRangeFilter = ({ 
  value = { startDate: '', endDate: '' }, 
  onChange, 
  reportType,
  label = "Date Range",
  className = ""
}) => {
  const [localStartDate, setLocalStartDate] = useState(value.startDate || '');
  const [localEndDate, setLocalEndDate] = useState(value.endDate || '');
  const [selectedPreset, setSelectedPreset] = useState('custom');
  const [error, setError] = useState('');

  const presets = getDateRangePresets();

  // Update local state when props change
  useEffect(() => {
    setLocalStartDate(value.startDate || '');
    setLocalEndDate(value.endDate || '');
  }, [value]);

  // Validate and update parent
  const updateParent = (startDate, endDate) => {
    const dateRange = { startDate, endDate };
    
    if (startDate && endDate) {
      if (isValidDateRange(startDate, endDate)) {
        setError('');
        onChange(dateRange);
      } else {
        setError('End date must be after start date');
      }
    } else if (!startDate && !endDate) {
      setError('');
      onChange(dateRange);
    } else {
      setError('Please select both start and end dates');
    }
  };

  const handleStartDateChange = (date) => {
    setLocalStartDate(date);
    setSelectedPreset('custom');
    updateParent(date, localEndDate);
  };

  const handleEndDateChange = (date) => {
    setLocalEndDate(date);
    setSelectedPreset('custom');
    updateParent(localStartDate, date);
  };

  const handlePresetChange = (presetKey) => {
    setSelectedPreset(presetKey);
    
    if (presetKey === 'custom') {
      return;
    }

    const preset = presets.find(p => p.key === presetKey);
    if (preset) {
      const startDate = formatDate(preset.startDate, 'YYYY-MM-DD');
      const endDate = formatDate(preset.endDate, 'YYYY-MM-DD');
      
      setLocalStartDate(startDate);
      setLocalEndDate(endDate);
      updateParent(startDate, endDate);
    }
  };

  const handleClear = () => {
    setLocalStartDate('');
    setLocalEndDate('');
    setSelectedPreset('custom');
    setError('');
    onChange({ startDate: '', endDate: '' });
  };

  // Get max date (today)
  const maxDate = formatDate(new Date(), 'YYYY-MM-DD');

  return (
    <div className={`date-range-filter ${className}`}>
      <label className="filter-label">
        {label}
        {(localStartDate || localEndDate) && (
          <button 
            onClick={handleClear} 
            className="clear-btn" 
            type="button"
            title="Clear date range"
          >
            ×
          </button>
        )}
      </label>

      {/* Preset Buttons */}
      <div className="preset-buttons">
        {presets.map(preset => (
          <button
            key={preset.key}
            type="button"
            onClick={() => handlePresetChange(preset.key)}
            className={`preset-btn ${selectedPreset === preset.key ? 'active' : ''}`}
          >
            {preset.label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => handlePresetChange('custom')}
          className={`preset-btn ${selectedPreset === 'custom' ? 'active' : ''}`}
        >
          Custom
        </button>
      </div>

      {/* Date Inputs */}
      <div className="date-inputs">
        <div className="date-input-group">
          <label htmlFor="start-date" className="date-label">From</label>
          <input
            id="start-date"
            type="date"
            value={localStartDate}
            onChange={(e) => handleStartDateChange(e.target.value)}
            max={localEndDate || maxDate}
            className="date-input"
          />
        </div>

        <div className="date-separator">to</div>

        <div className="date-input-group">
          <label htmlFor="end-date" className="date-label">To</label>
          <input
            id="end-date"
            type="date"
            value={localEndDate}
            onChange={(e) => handleEndDateChange(e.target.value)}
            min={localStartDate}
            max={maxDate}
            className="date-input"
          />
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {/* Selected Range Display */}
      {localStartDate && localEndDate && !error && (
        <div className="selected-range">
          {formatDate(localStartDate)} - {formatDate(localEndDate)}
        </div>
      )}

      <style jsx>{`
        .date-range-filter {
          display: flex;
          flex-direction: column;
          gap: 12px;
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

        .preset-buttons {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .preset-btn {
          padding: 6px 12px;
          border: 1px solid #cbd5e0;
          background: #fff;
          color: #4a5568;
          border-radius: 4px;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .preset-btn:hover {
          border-color: #3182ce;
          color: #3182ce;
        }

        .preset-btn.active {
          background: #3182ce;
          border-color: #3182ce;
          color: white;
        }

        .date-inputs {
          display: flex;
          align-items: end;
          gap: 12px;
        }

        .date-input-group {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .date-label {
          font-size: 12px;
          color: #718096;
          font-weight: 500;
        }

        .date-input {
          padding: 8px 12px;
          border: 1px solid #cbd5e0;
          border-radius: 4px;
          font-size: 14px;
          transition: border-color 0.2s;
        }

        .date-input:focus {
          outline: none;
          border-color: #3182ce;
          box-shadow: 0 0 0 3px rgba(49, 130, 206, 0.1);
        }

        .date-separator {
          color: #718096;
          font-size: 14px;
          padding: 0 4px;
          margin-bottom: 4px;
        }

        .error-message {
          background: #fed7d7;
          color: #c53030;
          padding: 8px 12px;
          border-radius: 4px;
          font-size: 13px;
          border: 1px solid #feb2b2;
        }

        .selected-range {
          background: #e6fffa;
          color: #234e52;
          padding: 8px 12px;
          border-radius: 4px;
          font-size: 13px;
          border: 1px solid #81e6d9;
          text-align: center;
        }

        /* Responsive Design */
        @media (max-width: 768px) {
          .date-inputs {
            flex-direction: column;
            gap: 8px;
          }

          .date-separator {
            display: none;
          }

          .preset-buttons {
            gap: 6px;
          }

          .preset-btn {
            font-size: 12px;
            padding: 5px 10px;
          }
        }

        @media (max-width: 480px) {
          .preset-buttons {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 6px;
          }
        }
      `}</style>
    </div>
  );
};

export default DateRangeFilter; 
