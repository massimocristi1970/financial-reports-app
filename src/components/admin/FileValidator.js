// src/components/admin/FileValidator.js
import React, { useState, useEffect } from 'react';
import { validateCSVStructure, validateDataTypes, validateBusinessRules } from '../../utils/csvProcessor';
import { REPORT_CONFIGS } from '../../config/reportConfig';

const FileValidator = ({ 
  file, 
  reportType, 
  onValidation,
  autoValidate = true,
  className = ""
}) => {
  const [validationState, setValidationState] = useState({
    isValidating: false,
    isValid: null,
    errors: [],
    warnings: [],
    summary: null,
    details: null
  });

  // Auto-validate when file or reportType changes
  useEffect(() => {
    if (autoValidate && file && reportType) {
      validateFile();
    }
  }, [file, reportType, autoValidate]);

  // Update parent component with validation results
  useEffect(() => {
    if (onValidation) {
      onValidation(validationState);
    }
  }, [validationState, onValidation]);

  const validateFile = async () => {
    if (!file || !reportType) return;

    setValidationState(prev => ({
      ...prev,
      isValidating: true,
      errors: [],
      warnings: [],
      isValid: null
    }));

    try {
      const reportConfig = REPORT_CONFIGS[reportType];
      if (!reportConfig) {
        throw new Error(`Unknown report type: ${reportType}`);
      }

      // Read file content
      const fileContent = await readFileContent(file);
      
      // Parse CSV
      const csvData = await parseCSV(fileContent);
      
      // Run validation steps
      const structureValidation = validateCSVStructure(csvData, reportConfig);
      const dataTypeValidation = validateDataTypes(csvData, reportConfig);
      const businessRuleValidation = validateBusinessRules(csvData, reportConfig);

      // Combine results
      const allErrors = [
        ...structureValidation.errors,
        ...dataTypeValidation.errors,
        ...businessRuleValidation.errors
      ];

      const allWarnings = [
        ...structureValidation.warnings,
        ...dataTypeValidation.warnings,
        ...businessRuleValidation.warnings
      ];

      const isValid = allErrors.length === 0;

      // Generate summary
      const summary = generateValidationSummary(csvData, allErrors, allWarnings);

      setValidationState({
        isValidating: false,
        isValid,
        errors: allErrors,
        warnings: allWarnings,
        summary,
        details: {
          structure: structureValidation,
          dataTypes: dataTypeValidation,
          businessRules: businessRuleValidation,
          rowCount: csvData.length,
          columnCount: Object.keys(csvData[0] || {}).length
        }
      });

    } catch (error) {
      setValidationState(prev => ({
        ...prev,
        isValidating: false,
        isValid: false,
        errors: [{
          type: 'CRITICAL',
          message: `File validation failed: ${error.message}`,
          severity: 'error'
        }]
      }));
    }
  };

  const readFileContent = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = (e) => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  };

  const parseCSV = async (content) => {
    // Simple CSV parser - in real implementation, use Papa Parse
    const lines = content.split('\n').filter(line => line.trim());
    if (lines.length === 0) throw new Error('File is empty');

    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const data = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
      const row = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      data.push(row);
    }

    return data;
  };

  const generateValidationSummary = (data, errors, warnings) => {
    return {
      totalRows: data.length,
      validRows: data.length - errors.filter(e => e.type === 'ROW_ERROR').length,
      errorCount: errors.length,
      warningCount: warnings.length,
      fileSize: file ? `${(file.size / 1024).toFixed(1)} KB` : 'Unknown',
      fileName: file ? file.name : 'Unknown'
    };
  };

  const getValidationIcon = () => {
    if (validationState.isValidating) return '⏳';
    if (validationState.isValid === true) return '✅';
    if (validationState.isValid === false) return '❌';
    return '📄';
  };

  const getValidationStatus = () => {
    if (validationState.isValidating) return 'Validating...';
    if (validationState.isValid === true) return 'Valid';
    if (validationState.isValid === false) return 'Invalid';
    return 'Ready to validate';
  };

  const getStatusColor = () => {
    if (validationState.isValidating) return '#3182ce';
    if (validationState.isValid === true) return '#38a169';
    if (validationState.isValid === false) return '#e53e3e';
    return '#718096';
  };

  return (
    <div className={`file-validator ${className}`}>
      {/* Validation Header */}
      <div className="validation-header">
        <div className="validation-status">
          <span className="status-icon">{getValidationIcon()}</span>
          <span className="status-text" style={{ color: getStatusColor() }}>
            {getValidationStatus()}
          </span>
        </div>
        
        {!autoValidate && file && reportType && (
          <button 
            onClick={validateFile}
            disabled={validationState.isValidating}
            className="validate-btn"
          >
            {validationState.isValidating ? 'Validating...' : 'Validate File'}
          </button>
        )}
      </div>

      {/* File Summary */}
      {validationState.summary && (
        <div className="file-summary">
          <div className="summary-grid">
            <div className="summary-item">
              <span className="summary-label">File:</span>
              <span className="summary-value">{validationState.summary.fileName}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Size:</span>
              <span className="summary-value">{validationState.summary.fileSize}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Rows:</span>
              <span className="summary-value">{validationState.summary.totalRows}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Valid:</span>
              <span className="summary-value">{validationState.summary.validRows}</span>
            </div>
          </div>
        </div>
      )}

      {/* Validation Results */}
      {(validationState.errors.length > 0 || validationState.warnings.length > 0) && (
        <div className="validation-results">
          {/* Errors */}
          {validationState.errors.length > 0 && (
            <div className="error-section">
              <h4 className="section-title error-title">
                Errors ({validationState.errors.length})
              </h4>
              <div className="message-list">
                {validationState.errors.map((error, index) => (
                  <div key={index} className="message-item error-item">
                    <span className="message-type">{error.type}</span>
                    <span className="message-text">{error.message}</span>
                    {error.row && (
                      <span className="message-location">Row {error.row}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Warnings */}
          {validationState.warnings.length > 0 && (
            <div className="warning-section">
              <h4 className="section-title warning-title">
                Warnings ({validationState.warnings.length})
              </h4>
              <div className="message-list">
                {validationState.warnings.map((warning, index) => (
                  <div key={index} className="message-item warning-item">
                    <span className="message-type">{warning.type}</span>
                    <span className="message-text">{warning.message}</span>
                    {warning.row && (
                      <span className="message-location">Row {warning.row}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Success Message */}
      {validationState.isValid === true && validationState.errors.length === 0 && (
        <div className="success-message">
          <span className="success-icon">✅</span>
          <span className="success-text">
            File validation passed! Ready to upload {validationState.summary?.totalRows} rows.
          </span>
        </div>
      )}

      <style jsx>{`
        .file-validator {
          background: #fff;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 16px;
        }

        .validation-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .validation-status {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .status-icon {
          font-size: 18px;
        }

        .status-text {
          font-weight: 600;
          font-size: 14px;
        }

        .validate-btn {
          background: #3182ce;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          font-size: 14px;
          cursor: pointer;
          transition: background 0.2s;
        }

        .validate-btn:hover:not(:disabled) {
          background: #2c5aa0;
        }

        .validate-btn:disabled {
          background: #a0aec0;
          cursor: not-allowed;
        }

        .file-summary {
          background: #f7fafc;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          padding: 12px;
          margin-bottom: 16px;
        }

        .summary-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
          gap: 12px;
        }

        .summary-item {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .summary-label {
          font-size: 12px;
          color: #718096;
          font-weight: 500;
        }

        .summary-value {
          font-size: 14px;
          color: #2d3748;
          font-weight: 600;
        }

        .validation-results {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .section-title {
          font-size: 14px;
          font-weight: 600;
          margin: 0 0 8px 0;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .error-title {
          color: #e53e3e;
        }

        .warning-title {
          color: #d69e2e;
        }

        .message-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .message-item {
          padding: 10px 12px;
          border-radius: 4px;
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          align-items: center;
          font-size: 13px;
        }

        .error-item {
          background: #fed7d7;
          border: 1px solid #feb2b2;
          color: #c53030;
        }

        .warning-item {
          background: #fefcbf;
          border: 1px solid #f6e05e;
          color: #975a16;
        }

        .message-type {
          background: rgba(0,0,0,0.1);
          padding: 2px 6px;
          border-radius: 3px;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
        }

        .message-text {
          flex: 1;
          min-width: 200px;
        }

        .message-location {
          background: rgba(0,0,0,0.1);
          padding: 2px 6px;
          border-radius: 3px;
          font-size: 11px;
          font-weight: 500;
        }

        .success-message {
          background: #c6f6d5;
          border: 1px solid #9ae6b4;
          color: #276749;
          padding: 12px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .success-icon {
          font-size: 16px;
        }

        .success-text {
          font-size: 14px;
          font-weight: 500;
        }

        /* Responsive Design */
        @media (max-width: 768px) {
          .validation-header {
            flex-direction: column;
            align-items: stretch;
            gap: 12px;
          }

          .summary-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .message-item {
            flex-direction: column;
            align-items: flex-start;
          }

          .message-text {
            min-width: auto;
          }
        }

        @media (max-width: 480px) {
          .summary-grid {
            grid-template-columns: 1fr;
          }

          .file-validator {
            padding: 12px;
          }
        }
      `}</style>
    </div>
  );
};

export default FileValidator; 
