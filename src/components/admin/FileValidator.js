// src/components/admin/FileValidator.js - Clean version with juddering fix
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

  // Prevent juddering - only validate once per file/reportType combination
  const [hasValidated, setHasValidated] = useState(false);

  // Helper function to validate UK date formats (DD/MM/YYYY, DD-MM-YYYY, etc.)
  const isValidUKDate = useCallback((dateString) => {
    if (!dateString || typeof dateString !== 'string') return false;
    
    const cleaned = dateString.trim();
    const ukDatePattern = /^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})$/;
    const match = cleaned.match(ukDatePattern);
    
    if (!match) return false;
    
    const [, day, month, year] = match;
    const dayNum = parseInt(day, 10);
    const monthNum = parseInt(month, 10);
    const yearNum = parseInt(year, 10);
    
    if (dayNum < 1 || dayNum > 31) return false;
    if (monthNum < 1 || monthNum > 12) return false;
    if (yearNum < 1900 || yearNum > 2100) return false;
    
    const dateObj = new Date(yearNum, monthNum - 1, dayNum);
    return dateObj.getDate() === dayNum && 
           dateObj.getMonth() === monthNum - 1 && 
           dateObj.getFullYear() === yearNum;
  }, []);

  // Helper function to validate currency values
  const isValidCurrency = useCallback((value) => {
    if (!value || typeof value !== 'string') return false;
    
    const cleaned = value.trim()
      .replace(/[£$€¥]/g, '')
      .replace(/,/g, '')
      .replace(/\s/g, '');
    
    return !isNaN(parseFloat(cleaned)) && isFinite(parseFloat(cleaned));
  }, []);

  // Read file content
  const readFileContent = useCallback((file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = (e) => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }, []);

  // Parse CSV with Papa Parse
  const parseCSV = useCallback((content) => {
    return new Promise((resolve, reject) => {
      Papa.parse(content, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: false,
        delimitersToGuess: [',', '\t', ';', '|'],
        transform: (value) => {
          return typeof value === 'string' ? value.trim() : value;
        },
        complete: (results) => {
          if (results.errors.length > 0) {
            const criticalErrors = results.errors.filter(e => e.type === 'Delimiter');
            if (criticalErrors.length > 0) {
              reject(new Error(`CSV parsing error: ${criticalErrors[0].message}`));
            } else {
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

    // Check for required fields
    const missingRequired = [];
    Object.entries(reportConfig.fields).forEach(([fieldName, fieldConfig]) => {
      if (fieldConfig.required) {
        const possibleColumns = COLUMN_MAPPINGS[fieldName] || [fieldName];
        
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
        const possibleColumns = COLUMN_MAPPINGS[fieldName] || [fieldName];
        const csvHeaders = Object.keys(row);
        const matchedVariation = possibleColumns.find(variation => 
          csvHeaders.some(header => 
            header.toLowerCase().trim() === variation.toLowerCase().trim()
          )
        );

        if (!matchedVariation) return;

        const csvHeaderName = csvHeaders.find(header => 
          header.toLowerCase().trim() === matchedVariation.toLowerCase().trim()
        );

        const value = row[csvHeaderName];
        
        if (!fieldConfig.required && (value === null || value === undefined || value === '')) {
          return;
        }

        if (value === null || value === undefined || value === '') {
          return;
        }

        // Enhanced type checking with UK format support
        switch (fieldConfig.type) {
          case 'number':
            const cleanedNumber = typeof value === 'string' ?
              value.replace(/,/g, '').trim() : value;
            if (isNaN(parseFloat(cleanedNumber))) {
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
            // More flexible currency validation
            const stringValue = typeof value === 'string' ? value : String(value);
            const cleanedCurrency = stringValue.trim()
              .replace(/[£$€¥�]/g, '') // Include � for encoding issues
              .replace(/,/g, '')
              .replace(/\s/g, '')
              .replace(/[^\d.-]/g, ''); // Remove any non-numeric characters
            
            const currencyNumber = parseFloat(cleanedCurrency);
            if (isNaN(currencyNumber) || !isFinite(currencyNumber)) {
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
            if (!isValidUKDate(value) && isNaN(Date.parse(value))) {
              errors.push({
                type: 'TYPE_ERROR',
                message: `Row ${index + 1}: '${csvHeaderName}' must be a valid date (DD/MM/YYYY or YYYY-MM-DD), got '${value}'`,
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
      sampleData: data.slice(0, 3),
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
      const reportConfig = REPORT_CONFIGS[reportType];
      if (!reportConfig) {
        throw new Error(`Unknown report type: ${reportType}`);
      }

      if (!reportConfig.fields) {
        throw new Error(`No fields configuration found for report type: ${reportType}`);
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

      const validationResult = {
        isValid,
        errors: allErrors,
        warnings: allWarnings,
        summary,
        details: {
          csvData: csvData.slice(0, 5),
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

  // Fixed auto-validation to prevent juddering - only validate once per file/reportType
  useEffect(() => {
    if (autoValidate && file && reportType && !hasValidated) {
      validateFile();
      setHasValidated(true);
    }
  }, [file, reportType, autoValidate, hasValidated, validateFile]);

  // Reset validation flag when file or reportType changes
  useEffect(() => {
    setHasValidated(false);
  }, [file, reportType]);

  // Manual validation trigger
  const triggerValidation = () => {
    setHasValidated(false);
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