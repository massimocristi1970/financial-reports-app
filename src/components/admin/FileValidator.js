// src/components/admin/FileValidator.js - COMPLETE FIXED VERSION
import React, { useState, useEffect, useCallback } from 'react';
import { REPORT_CONFIGS } from '../../config/reportConfig';
import { COLUMN_MAPPINGS } from '../../utils/constants';
import Papa from 'papaparse';

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

  // Helper function to read file content
  const readFileContent = useCallback((file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = (e) => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }, []);

  // Helper function to parse CSV using Papa Parse
  const parseCSV = useCallback(async (content) => {
    return new Promise((resolve, reject) => {
      Papa.parse(content, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: true,
        complete: (results) => {
          if (results.errors.length > 0) {
            reject(new Error(`CSV parsing error: ${results.errors[0].message}`));
          } else {
            resolve(results.data);
          }
        },
        error: (error) => {
          reject(new Error(`CSV parsing failed: ${error.message}`));
        }
      });
    });
  }, []);

  // Generate validation summary
  const generateValidationSummary = useCallback((data, errors, warnings) => {
    return {
      totalRows: data.length,
      validRows: data.length - errors.filter(e => e.type === 'ROW_ERROR').length,
      errorCount: errors.length,
      warningCount: warnings.length,
      fileSize: file ? `${(file.size / 1024).toFixed(1)} KB` : 'Unknown',
      fileName: file ? file.name : 'Unknown'
    };
  }, [file]);

  // CSV structure validation with column mappings
  const validateCSVStructure = useCallback((csvData, reportConfig) => {
    const errors = [];
    const warnings = [];

    if (!csvData || csvData.length === 0) {
      errors.push({
        type: 'STRUCTURE',
        message: 'No data found in CSV file',
        severity: 'error'
      });
      return { errors, warnings };
    }

    // Get CSV headers
    const csvHeaders = Object.keys(csvData[0] || {});
    console.log('CSV Headers found:', csvHeaders);

    // Get required fields
    const requiredFields = Object.entries(reportConfig.fields)
      .filter(([key, config]) => config.required)
      .map(([key]) => key);

    console.log('Required fields:', requiredFields);

    // Check for missing required fields using column mappings
    const missingFields = requiredFields.filter(field => {
      // Get possible column variations for this field
      const possibleColumns = COLUMN_MAPPINGS[field] || [field];
      console.log(`Checking field '${field}' against variations:`, possibleColumns);
      
      // Check if any variation exists in CSV headers
      const found = possibleColumns.some(variation => 
        csvHeaders.some(header => 
          header.toLowerCase() === variation.toLowerCase()
        )
      );
      
      console.log(`Field '${field}' found: ${found}`);
      return !found;
    });

    if (missingFields.length > 0) {
      missingFields.forEach(field => {
        const possibleColumns = COLUMN_MAPPINGS[field] || [field];
        errors.push({
          type: 'MISSING_FIELD',
          message: `Required field '${field}' not found. Expected one of: ${possibleColumns.join(', ')}`,
          severity: 'error'
        });
      });
    }

    // Check for empty data
    const nonEmptyRows = csvData.filter(row => 
      Object.values(row).some(value => value !== null && value !== undefined && value !== '')
    );

    if (nonEmptyRows.length === 0) {
      errors.push({
        type: 'NO_DATA',
        message: 'No valid data rows found',
        severity: 'error'
      });
    }

    return { errors, warnings };
  }, []);

  // Basic data type validation
  const validateDataTypes = useCallback((csvData, reportConfig) => {
    const errors = [];
    const warnings = [];

    csvData.forEach((row, index) => {
      Object.entries(reportConfig.fields).forEach(([fieldName, fieldConfig]) => {
        // Find the actual CSV header that maps to this field
        const possibleColumns = COLUMN_MAPPINGS[fieldName] || [fieldName];
        const csvHeaders = Object.keys(row);
        const actualHeader = possibleColumns.find(variation => 
          csvHeaders.some(header => 
            header.toLowerCase() === variation.toLowerCase()
          )
        );

        if (!actualHeader) return; // Field not found in CSV

        // Get the actual header name from CSV
        const csvHeaderName = csvHeaders.find(header => 
          header.toLowerCase() === actualHeader.toLowerCase()
        );

        const value = row[csvHeaderName];
        
        // Skip validation for empty optional fields
        if (!fieldConfig.required && (value === null || value === undefined || value === '')) {
          return;
        }

        // Skip validation for empty required fields (already caught by structure validation)
        if (value === null || value === undefined || value === '') {
          return;
        }

        // Basic type checking
        switch (fieldConfig.type) {
          case 'number':
          case 'currency':
            if (isNaN(Number(value))) {
              errors.push({
                type: 'TYPE_ERROR',
                message: `Row ${index + 1}: '${csvHeaderName}' must be a number, got '${value}'`,
                severity: 'error',
                row: index + 1
              });
            }
            break;
          
          case 'date':
          case 'datetime':
            if (isNaN(Date.parse(value))) {
              errors.push({
                type: 'TYPE_ERROR',
                message: `Row ${index + 1}: '${csvHeaderName}' must be a valid date, got '${value}'`,
                severity: 'error',
                row: index + 1
              });
            }
            break;

          case 'percentage':
            const numValue = Number(value);
            if (isNaN(numValue) || numValue < 0 || numValue > 100) {
              errors.push({
                type: 'TYPE_ERROR',
                message: `Row ${index + 1}: '${csvHeaderName}' must be a percentage (0-100), got '${value}'`,
                severity: 'error',
                row: index + 1
              });
            }
            break;

		default:
    
			break;
	}
      });
    });

    return { errors, warnings };
  }, []);

  // Basic business rules validation
  const validateBusinessRules = useCallback((csvData, reportConfig) => {
    const errors = [];
    const warnings = [];

    // Add any business-specific validation here
    // For now, just return empty arrays
    
    return { errors, warnings };
  }, []);

  // Main validation function
  const validateFile = useCallback(async () => {
    if (!file || !reportType) return;

    setValidationState(prev => ({
      ...prev,
      isValidating: true,
      errors: [],
      warnings: [],
      isValid: null
    }));

    try {
      console.log('Validating file for report type:', reportType);
      
      const reportConfig = REPORT_CONFIGS[reportType];
      if (!reportConfig) {
        throw new Error(`Unknown report type: ${reportType}`);
      }

      console.log('Report config found:', reportConfig);

      if (!reportConfig.fields) {
        throw new Error(`No fields configuration found for report type: ${reportType}`);
      }

      // Read file content
      const fileContent = await readFileContent(file);
      
      // Parse CSV
      const csvData = await parseCSV(fileContent);
      
      console.log('CSV data parsed:', csvData.length, 'rows');

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

      console.log('Validation complete. Errors:', allErrors.length, 'Warnings:', allWarnings.length);

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
      console.error('Validation error:', error);
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
  }, [file, reportType, readFileContent, parseCSV, generateValidationSummary, validateCSVStructure, validateDataTypes, validateBusinessRules]);

  // Auto-validate when file or reportType changes
  useEffect(() => {
    if (autoValidate && file && reportType) {
      validateFile();
    }
  }, [autoValidate, file, reportType, validateFile]);

  // Update parent component with validation results
  useEffect(() => {
    if (onValidation) {
      onValidation(validationState);
    }
  }, [validationState, onValidation]);

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
                    <span className="message-text">{warning.message || warning}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FileValidator;