// src/components/admin/FileValidator.js - FIXED VERSION with UK date/currency support
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

  // Helper function to validate UK date formats (DD/MM/YYYY, DD-MM-YYYY, etc.)
  const isValidUKDate = useCallback((dateString) => {
    if (!dateString || typeof dateString !== 'string') return false;
    
    // Clean the date string
    const cleaned = dateString.trim();
    
    // UK date patterns: DD/MM/YYYY, DD-MM-YYYY, DD.MM.YYYY
    const ukDatePattern = /^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})$/;
    const match = cleaned.match(ukDatePattern);
    
    if (!match) return false;
    
    const [, day, month, year] = match;
    const dayNum = parseInt(day, 10);
    const monthNum = parseInt(month, 10);
    const yearNum = parseInt(year, 10);
    
    // Basic range checks
    if (dayNum < 1 || dayNum > 31) return false;
    if (monthNum < 1 || monthNum > 12) return false;
    if (yearNum < 1900 || yearNum > 2100) return false;
    
    // Create date object (month is 0-indexed in JS)
    const dateObj = new Date(yearNum, monthNum - 1, dayNum);
    
    // Check if the date is valid (handles Feb 29, etc.)
    return dateObj.getDate() === dayNum && 
           dateObj.getMonth() === monthNum - 1 && 
           dateObj.getFullYear() === yearNum;
  }, []);

  // Helper function to validate and parse currency values
  const isValidCurrency = useCallback((value) => {
    if (!value || typeof value !== 'string') return false;
    
    // Remove currency symbols, commas, and whitespace
    const cleaned = value.trim()
      .replace(/[£$€¥]/g, '') // Remove currency symbols
      .replace(/,/g, '') // Remove commas
      .replace(/\s/g, ''); // Remove whitespace
    
    // Check if what's left is a valid number
    return !isNaN(parseFloat(cleaned)) && isFinite(parseFloat(cleaned));
  }, []);

  // Helper function to parse currency value to number
  const parseCurrency = useCallback((value) => {
    if (!value || typeof value !== 'string') return 0;
    
    const cleaned = value.trim()
      .replace(/[£$€¥]/g, '')
      .replace(/,/g, '')
      .replace(/\s/g, '');
    
    return parseFloat(cleaned) || 0;
  }, []);

  // Helper function to parse UK date to ISO format
  const parseUKDate = useCallback((dateString) => {
    const ukDatePattern = /^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})$/;
    const match = dateString.trim().match(ukDatePattern);
    
    if (match) {
      const [, day, month, year] = match;
      return new Date(year, month - 1, day).toISOString().split('T')[0];
    }
    
    return null;
  }, []);

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
        trimHeaders: true,
        dynamicTyping: false, // Keep as strings for proper validation
        transform: (value, header) => {
          // Trim whitespace from all values
          return typeof value === 'string' ? value.trim() : value;
        },
        complete: (results) => {
          if (results.errors.length > 0) {
            const criticalErrors = results.errors.filter(e => e.type === 'Delimiter');
            if (criticalErrors.length > 0) {
              reject(new Error(`CSV parsing error: ${criticalErrors[0].message}`));
            } else {
              // Non-critical errors, continue with data
              resolve(results.data);
            }
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

  // Validate CSV structure and required columns
  const validateCSVStructure = useCallback((csvData, reportConfig) => {
    const errors = [];
    const warnings = [];

    if (!csvData || csvData.length === 0) {
      errors.push({
        type: 'NO_DATA',
        message: 'No data found in CSV file',
        severity: 'error'
      });
      return { errors, warnings };
    }

    const csvHeaders = Object.keys(csvData[0]);
    console.log('CSV Headers found:', csvHeaders);

    // Check for required fields
    const missingRequired = [];
    Object.entries(reportConfig.fields).forEach(([fieldName, fieldConfig]) => {
      if (fieldConfig.required) {
        const possibleColumns = COLUMN_MAPPINGS[fieldName] || [fieldName];
        console.log(`Checking required field '${fieldName}' with possible columns:`, possibleColumns);
        
        const foundColumn = possibleColumns.find(variation => 
          csvHeaders.some(header => 
            header.toLowerCase().trim() === variation.toLowerCase().trim()
          )
        );

        if (!foundColumn) {
          missingRequired.push({
            field: fieldName,
            label: fieldConfig.label,
            possibleColumns: possibleColumns
          });
        }
      }
    });

    if (missingRequired.length > 0) {
      missingRequired.forEach(missing => {
        errors.push({
          type: 'MISSING_REQUIRED_FIELD',
          message: `Required field '${missing.label}' not found. Expected one of: ${missing.possibleColumns.join(', ')}`,
          severity: 'error'
        });
      });
    }

    return { errors, warnings };
  }, []);

  // Enhanced data type validation with UK format support
  const validateDataTypes = useCallback((csvData, reportConfig) => {
    const errors = [];
    const warnings = [];

    csvData.forEach((row, index) => {
      Object.entries(reportConfig.fields).forEach(([fieldName, fieldConfig]) => {
        // Find the actual CSV header that maps to this field
        const possibleColumns = COLUMN_MAPPINGS[fieldName] || [fieldName];
        const csvHeaders = Object.keys(row);
        const matchedVariation = possibleColumns.find(variation => 
          csvHeaders.some(header => 
            header.toLowerCase().trim() === variation.toLowerCase().trim()
          )
        );

        if (!matchedVariation) return; // Field not found in CSV

        // Get the actual header name from CSV
        const csvHeaderName = csvHeaders.find(header => 
          header.toLowerCase().trim() === matchedVariation.toLowerCase().trim()
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

        // Enhanced type checking with UK format support
        switch (fieldConfig.type) {
          case 'number':
            // Handle numbers that might have commas
            const cleanedNumber = typeof value === 'string' ? 
              value.replace(/,/g, '').trim() : value;
            if (isNaN(Number(cleanedNumber))) {
              errors.push({
                type: 'TYPE_ERROR',
                message: `Row ${index + 1}: '${csvHeaderName}' must be a number, got '${value}'`,
                severity: 'error',
                row: index + 1,
                field: csvHeaderName,
                value: value
              });
            }
            break;
          
          case 'currency':
            // Use enhanced currency validation
            if (!isValidCurrency(value)) {
              errors.push({
                type: 'TYPE_ERROR',
                message: `Row ${index + 1}: '${csvHeaderName}' must be a valid currency amount, got '${value}'`,
                severity: 'error',
                row: index + 1,
                field: csvHeaderName,
                value: value
              });
            }
            break;
          
          case 'date':
          case 'datetime':
            // Use enhanced UK date validation
            if (!isValidUKDate(value) && isNaN(Date.parse(value))) {
              errors.push({
                type: 'TYPE_ERROR',
                message: `Row ${index + 1}: '${csvHeaderName}' must be a valid date (DD/MM/YYYY format supported), got '${value}'`,
                severity: 'error',
                row: index + 1,
                field: csvHeaderName,
                value: value
              });
            }
            break;

          case 'percentage':
            const percentValue = typeof value === 'string' ? 
              parseFloat(value.replace('%', '').trim()) : parseFloat(value);
            if (isNaN(percentValue) || percentValue < 0 || percentValue > 100) {
              errors.push({
                type: 'TYPE_ERROR',
                message: `Row ${index + 1}: '${csvHeaderName}' must be a percentage (0-100), got '${value}'`,
                severity: 'error',
                row: index + 1,
                field: csvHeaderName,
                value: value
              });
            }
            break;

          default:
            // For string fields, just check they're not empty if required
            if (fieldConfig.required && (!value || value.toString().trim() === '')) {
              errors.push({
                type: 'TYPE_ERROR',
                message: `Row ${index + 1}: '${csvHeaderName}' is required but empty`,
                severity: 'error',
                row: index + 1,
                field: csvHeaderName,
                value: value
              });
            }
            break;
        }
      });
    });

    return { errors, warnings };
  }, [isValidUKDate, isValidCurrency]);

  // Basic business rules validation
  const validateBusinessRules = useCallback((csvData, reportConfig) => {
    const errors = [];
    const warnings = [];

    // Add any business-specific validation here
    // For now, just return empty arrays
    
    return { errors, warnings };
  }, []);

  // Generate validation summary
  const generateValidationSummary = useCallback((data, errors, warnings) => {
    return {
      totalRows: data.length,
      validRows: data.length - errors.filter(e => e.type === 'ROW_ERROR').length,
      errorCount: errors.length,
      warningCount: warnings.length,
      fileSize: file ? `${(file.size / 1024).toFixed(1)} KB` : 'Unknown',
      fileName: file ? file.name : 'Unknown',
      sampleData: data.slice(0, 3), // First 3 rows for preview
      detectedColumns: data.length > 0 ? Object.keys(data[0]) : []
    };
  }, [file]);

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
      console.log('Sample row:', csvData[0]);

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

      const validationResult = {
        isValid,
        errors: allErrors,
        warnings: allWarnings,
        summary,
        details: {
          csvData: csvData.slice(0, 5), // First 5 rows for debugging
          reportConfig
        }
      };

      setValidationState({
        isValidating: false,
        isValid,
        errors: allErrors,
        warnings: allWarnings,
        summary,
        details: validationResult.details
      });

      // Call the onValidation callback
      if (onValidation) {
        onValidation(validationResult);
      }

    } catch (error) {
      console.error('Validation error:', error);
      
      const errorResult = {
        isValid: false,
        errors: [{
          type: 'VALIDATION_ERROR',
          message: error.message,
          severity: 'error'
        }],
        warnings: [],
        summary: null,
        details: null
      };

      setValidationState({
        isValidating: false,
        isValid: false,
        errors: errorResult.errors,
        warnings: [],
        summary: null,
        details: null
      });

      if (onValidation) {
        onValidation(errorResult);
      }
    }
  }, [file, reportType, readFileContent, parseCSV, validateCSVStructure, validateDataTypes, validateBusinessRules, generateValidationSummary, onValidation]);

  // Auto-validate when file or report type changes
  useEffect(() => {
    if (autoValidate && file && reportType) {
      validateFile();
    }
  }, [file, reportType, autoValidate, validateFile]);

  // Manual validation trigger
  const triggerValidation = () => {
    validateFile();
  };

  // Render validation results
  const renderValidationResults = () => {
    if (validationState.isValidating) {
      return (
        <div className="validation-status validating">
          <div className="validation-spinner"></div>
          <span>Validating file...</span>
        </div>
      );
    }

    if (validationState.isValid === null) {
      return null;
    }

    return (
      <div className={`validation-results ${validationState.isValid ? 'valid' : 'invalid'}`}>
        <div className="validation-summary">
          <div className={`validation-status ${validationState.isValid ? 'valid' : 'invalid'}`}>
            <span className="status-icon">
              {validationState.isValid ? '✅' : '❌'}
            </span>
            <span className="status-text">
              {validationState.isValid ? 'File is valid' : 'File has errors'}
            </span>
          </div>

          {validationState.summary && (
            <div className="file-summary">
              <span>📄 {validationState.summary.fileName}</span>
              <span>📊 {validationState.summary.totalRows} rows</span>
              <span>💾 {validationState.summary.fileSize}</span>
              {validationState.summary.errorCount > 0 && (
                <span className="error-count">❌ {validationState.summary.errorCount} errors</span>
              )}
              {validationState.summary.warningCount > 0 && (
                <span className="warning-count">⚠️ {validationState.summary.warningCount} warnings</span>
              )}
            </div>
          )}
        </div>

        {validationState.errors.length > 0 && (
          <div className="validation-errors">
            <h4>Errors ({validationState.errors.length})</h4>
            <div className="error-list">
              {validationState.errors.slice(0, 10).map((error, index) => (
                <div key={index} className="error-item">
                  <span className="error-type">{error.type}</span>
                  <span className="error-message">{error.message}</span>
                </div>
              ))}
              {validationState.errors.length > 10 && (
                <div className="error-item">
                  <span className="error-more">
                    ... and {validationState.errors.length - 10} more errors
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {validationState.warnings.length > 0 && (
          <div className="validation-warnings">
            <h4>Warnings ({validationState.warnings.length})</h4>
            <div className="warning-list">
              {validationState.warnings.slice(0, 5).map((warning, index) => (
                <div key={index} className="warning-item">
                  <span className="warning-message">{warning.message}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`file-validator ${className}`}>
      {!autoValidate && (
        <div className="validator-controls">
          <button 
            onClick={triggerValidation}
            disabled={!file || !reportType || validationState.isValidating}
            className="validate-button"
          >
            {validationState.isValidating ? 'Validating...' : 'Validate File'}
          </button>
        </div>
      )}
      
      {renderValidationResults()}
    </div>
  );
};

export default FileValidator;