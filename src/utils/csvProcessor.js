// src/utils/csvProcessor.js - Enhanced version with UK date/currency support
import Papa from 'papaparse';
import { COLUMN_MAPPINGS, VALIDATION_RULES, ERROR_MESSAGES } from './constants';
import { REPORT_CONFIG } from '../config/reportConfig';

export class CSVProcessor {
  constructor(reportType) {
    this.reportType = reportType;
    this.config = REPORT_CONFIG[reportType];
    this.errors = [];
    this.warnings = [];
  }

  // Helper function to validate and parse UK dates (DD/MM/YYYY)
  static isValidUKDate(dateString) {
    if (!dateString || typeof dateString !== 'string') return false;
    
    const cleaned = dateString.trim();
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
    
    // Create date object and validate
    const dateObj = new Date(yearNum, monthNum - 1, dayNum);
    return dateObj.getDate() === dayNum && 
           dateObj.getMonth() === monthNum - 1 && 
           dateObj.getFullYear() === yearNum;
  }

  // Helper function to parse UK date to ISO format
  static parseUKDate(dateString) {
    const ukDatePattern = /^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})$/;
    const match = dateString.trim().match(ukDatePattern);
    
    if (match) {
      const [, day, month, year] = match;
      return new Date(year, month - 1, day);
    }
    
    // Try standard Date.parse as fallback
    return new Date(dateString);
  }

  // Helper function to validate currency values (£1,000, $1000, etc.)
  static isValidCurrency(value) {
    if (!value || typeof value !== 'string') return false;
    
    const cleaned = value.trim()
      .replace(/[£$€¥]/g, '') // Remove currency symbols
      .replace(/,/g, '') // Remove commas
      .replace(/\s/g, ''); // Remove whitespace
    
    return !isNaN(parseFloat(cleaned)) && isFinite(parseFloat(cleaned));
  }

  // Helper function to parse currency to number
  static parseCurrency(value) {
    if (!value) return 0;
    
    if (typeof value === 'number') return value;
    
    const cleaned = value.toString().trim()
      .replace(/[£$€¥]/g, '')
      .replace(/,/g, '')
      .replace(/\s/g, '');
    
    return parseFloat(cleaned) || 0;
  }

  // Helper function to parse number with commas
  static parseNumber(value) {
    if (!value) return 0;
    
    if (typeof value === 'number') return value;
    
    const cleaned = value.toString().trim().replace(/,/g, '');
    return parseFloat(cleaned) || 0;
  }

  // Main processing function
  async processFile(file) {
    try {
      this.validateFile(file);
      const rawData = await this.parseFile(file);
      const mappedData = this.mapColumns(rawData);
      const validatedData = this.validateData(mappedData);
      const processedData = this.processData(validatedData);
      
      return {
        success: true,
        data: processedData,
        errors: this.errors,
        warnings: this.warnings,
        stats: this.generateStats(processedData)
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        errors: this.errors,
        warnings: this.warnings
      };
    }
  }

  // File validation
  validateFile(file) {
    if (!file) {
      throw new Error('No file provided');
    }

    if (file.size > 50 * 1024 * 1024) { // 50MB
      throw new Error(ERROR_MESSAGES.FILE_TOO_LARGE);
    }

    const allowedTypes = ['.csv', '.xlsx', '.xls'];
    const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
    
    if (!allowedTypes.includes(fileExtension)) {
      throw new Error(ERROR_MESSAGES.INVALID_FILE_TYPE);
    }
  }

  // Parse CSV file with proper settings
  parseFile(file) {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        trimHeaders: true,
        dynamicTyping: false, // Keep as strings for proper validation
        transform: (value, header) => {
          // Trim all values
          return typeof value === 'string' ? value.trim() : value;
        },
        complete: (results) => {
          if (results.errors.length > 0) {
            const criticalErrors = results.errors.filter(e => e.type === 'Delimiter');
            if (criticalErrors.length > 0) {
              reject(new Error(`CSV parsing errors: ${criticalErrors.map(e => e.message).join(', ')}`));
            } else {
              // Non-critical errors, continue
              resolve(results.data);
            }
          } else {
            resolve(results.data);
          }
        },
        error: (error) => {
          reject(new Error(`Failed to parse CSV: ${error.message}`));
        }
      });
    });
  }

  // Map column names to standard format
  mapColumns(data) {
    if (!data || data.length === 0) {
      throw new Error(ERROR_MESSAGES.NO_DATA_FOUND);
    }

    const headers = Object.keys(data[0]);
    const mappedHeaders = {};

    // Map each field using the column mappings
    Object.keys(this.config.fields).forEach(standardField => {
      const mapping = COLUMN_MAPPINGS[standardField];
      if (mapping) {
        const foundHeader = headers.find(header => 
          mapping.some(variant => 
            header.toLowerCase().trim() === variant.toLowerCase().trim()
          )
        );
        if (foundHeader) {
          mappedHeaders[foundHeader] = standardField;
        }
      } else {
        // Direct match for fields not in common mappings
        const foundHeader = headers.find(header => 
          header.toLowerCase().trim() === standardField.toLowerCase().trim()
        );
        if (foundHeader) {
          mappedHeaders[foundHeader] = standardField;
        }
      }
    });

    // Transform data with mapped headers
    return data.map((row, index) => {
      const mappedRow = { _rowIndex: index + 2 }; // +2 for header and 0-based index
      
      Object.keys(row).forEach(originalHeader => {
        const standardField = mappedHeaders[originalHeader] || originalHeader;
        mappedRow[standardField] = row[originalHeader];
      });

      return mappedRow;
    });
  }

  // Enhanced validation with UK format support
  validateData(data) {
    const validatedData = [];
    
    data.forEach((row, index) => {
      const validatedRow = { ...row };
      let hasErrors = false;

      // Check each field according to its configuration
      Object.entries(this.config.fields).forEach(([fieldName, fieldConfig]) => {
        const value = row[fieldName];
        
        // Check required fields
        if (fieldConfig.required && !VALIDATION_RULES.required(value)) {
          this.errors.push(`Row ${row._rowIndex}: ${fieldConfig.label} is required`);
          hasErrors = true;
          return;
        }

        // Skip validation for empty optional fields
        if (!value || value === '') {
          return;
        }

        // Validate and transform by field type
        switch (fieldConfig.type) {
          case 'date':
            if (CSVProcessor.isValidUKDate(value)) {
              validatedRow[fieldName] = CSVProcessor.parseUKDate(value);
            } else if (!isNaN(Date.parse(value))) {
              validatedRow[fieldName] = new Date(value);
            } else {
              this.errors.push(`Row ${row._rowIndex}: Invalid date format in ${fieldConfig.label} - expected DD/MM/YYYY or standard date format`);
              hasErrors = true;
            }
            break;

          case 'currency':
            if (CSVProcessor.isValidCurrency(value)) {
              validatedRow[fieldName] = CSVProcessor.parseCurrency(value);
            } else {
              this.errors.push(`Row ${row._rowIndex}: Invalid currency format in ${fieldConfig.label} - '${value}'`);
              hasErrors = true;
            }
            break;

          case 'number':
            const numberValue = CSVProcessor.parseNumber(value);
            if (!isNaN(numberValue) && isFinite(numberValue)) {
              validatedRow[fieldName] = numberValue;
            } else {
              this.errors.push(`Row ${row._rowIndex}: Invalid number in ${fieldConfig.label} - '${value}'`);
              hasErrors = true;
            }
            break;

          case 'percentage':
            let percentValue = value;
            if (typeof value === 'string' && value.includes('%')) {
              percentValue = parseFloat(value.replace('%', '').trim());
            } else {
              percentValue = parseFloat(value);
            }
            
            if (!isNaN(percentValue) && percentValue >= 0 && percentValue <= 100) {
              validatedRow[fieldName] = percentValue;
            } else {
              this.errors.push(`Row ${row._rowIndex}: Invalid percentage in ${fieldConfig.label} - must be 0-100`);
              hasErrors = true;
            }
            break;

          case 'string':
          default:
            // For string fields, just ensure they're not empty if required
            validatedRow[fieldName] = value;
            break;
        }
      });

      // Only include rows without critical errors
      if (!hasErrors) {
        validatedData.push(validatedRow);
      }
    });

    return validatedData;
  }

  // Process and enrich the validated data
  processData(data) {
    return data.map(row => {
      const processedRow = { ...row };

      // Add computed fields based on report type
      switch (this.reportType) {
        case 'lending-volume':
          // Add any lending-specific calculations
          if (processedRow.IssuedAmount && processedRow.Payment) {
            processedRow.remainingBalance = processedRow.IssuedAmount - processedRow.Payment;
          }
          break;

        case 'arrears':
          // Add arrears-specific calculations
          if (processedRow.TotalDue && processedRow.Payment) {
            processedRow.outstandingAmount = processedRow.TotalDue - processedRow.Payment;
          }
          break;

        case 'liquidations':
          // Add liquidation-specific calculations
          if (processedRow.liquidation_amount && processedRow.recovery_amount) {
            processedRow.recovery_rate = (processedRow.recovery_amount / processedRow.liquidation_amount) * 100;
          }
          break;

        default:
          // No specific processing for other report types
          break;
      }

      return processedRow;
    });
  }

  // Generate processing statistics
  generateStats(data) {
    const stats = {
      totalRows: data.length,
      errorCount: this.errors.length,
      warningCount: this.warnings.length,
      dataTypes: {},
      fieldCoverage: {}
    };

    // Analyze field coverage
    Object.keys(this.config.fields).forEach(fieldName => {
      const nonEmptyCount = data.filter(row => 
        row[fieldName] !== null && 
        row[fieldName] !== undefined && 
        row[fieldName] !== ''
      ).length;
      
      stats.fieldCoverage[fieldName] = {
        populated: nonEmptyCount,
        percentage: Math.round((nonEmptyCount / data.length) * 100)
      };
    });

    // Analyze data types found
    if (data.length > 0) {
      Object.keys(data[0]).forEach(field => {
        if (field !== '_rowIndex') {
          const sampleValues = data.slice(0, 100).map(row => row[field]).filter(v => v != null);
          const types = [...new Set(sampleValues.map(v => typeof v))];
          stats.dataTypes[field] = types;
        }
      });
    }

    return stats;
  }

  // Static method for quick validation without full processing
  static async quickValidate(file, reportType) {
    const processor = new CSVProcessor(reportType);
    
    try {
      processor.validateFile(file);
      const rawData = await processor.parseFile(file);
      
      if (!rawData || rawData.length === 0) {
        return { isValid: false, error: 'No data found in file' };
      }

      // Check for basic structure
      const headers = Object.keys(rawData[0]);
      const requiredFields = Object.entries(processor.config.fields)
        .filter(([, config]) => config.required)
        .map(([field]) => field);

      const missingFields = requiredFields.filter(field => {
        const mapping = COLUMN_MAPPINGS[field] || [field];
        return !mapping.some(variant => 
          headers.some(header => 
            header.toLowerCase().trim() === variant.toLowerCase().trim()
          )
        );
      });

      if (missingFields.length > 0) {
        return { 
          isValid: false, 
          error: `Missing required fields: ${missingFields.join(', ')}` 
        };
      }

      return { isValid: true, rowCount: rawData.length };
      
    } catch (error) {
      return { isValid: false, error: error.message };
    }
  }
}

// Enhanced utility functions for data processing
export const processCSVFile = async (file, reportType, progressCallback) => {
  const processor = new CSVProcessor(reportType);
  
  if (progressCallback) progressCallback(10, 'Starting file processing...');
  
  try {
    const result = await processor.processFile(file);
    
    if (progressCallback) {
      if (result.success) {
        progressCallback(100, 'Processing complete');
      } else {
        progressCallback(0, `Processing failed: ${result.error}`);
      }
    }
    
    return result;
  } catch (error) {
    if (progressCallback) {
      progressCallback(0, `Processing error: ${error.message}`);
    }
    
    return {
      success: false,
      error: error.message,
      errors: [error.message],
      warnings: []
    };
  }
};

// Helper function to validate a single row of data
export const validateRowData = (rowData, reportType) => {
  const processor = new CSVProcessor(reportType);
  const errors = [];
  
  Object.entries(processor.config.fields).forEach(([fieldName, fieldConfig]) => {
    const value = rowData[fieldName];
    
    if (fieldConfig.required && !value) {
      errors.push(`${fieldConfig.label} is required`);
      return;
    }

    if (!value) return;

    switch (fieldConfig.type) {
      case 'date':
        if (!CSVProcessor.isValidUKDate(value) && isNaN(Date.parse(value))) {
          errors.push(`${fieldConfig.label} must be a valid date`);
        }
        break;
      case 'currency':
        if (!CSVProcessor.isValidCurrency(value)) {
          errors.push(`${fieldConfig.label} must be a valid currency amount`);
        }
        break;
      case 'number':
        if (isNaN(CSVProcessor.parseNumber(value))) {
          errors.push(`${fieldConfig.label} must be a valid number`);
        }
        break;
    }
  });
  
  return { isValid: errors.length === 0, errors };
};

// Export utility functions for use in other components
export const dateUtils = {
  isValidUKDate: CSVProcessor.isValidUKDate,
  parseUKDate: CSVProcessor.parseUKDate,
  formatUKDate: (date) => {
    if (!date) return '';
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  }
};

export const currencyUtils = {
  isValidCurrency: CSVProcessor.isValidCurrency,
  parseCurrency: CSVProcessor.parseCurrency,
  formatCurrency: (amount, currency = 'GBP') => {
    if (amount == null || isNaN(amount)) return '';
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }
};

export default CSVProcessor;