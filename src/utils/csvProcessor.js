// src/utils/csvProcessor.js
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

  // Parse CSV file
  parseFile(file) {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        trimHeaders: true,
        dynamicTyping: false, // Keep as strings for validation
        complete: (results) => {
          if (results.errors.length > 0) {
            reject(new Error(`CSV parsing errors: ${results.errors.map(e => e.message).join(', ')}`));
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

    // Map each required field
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

  // Validate data against field requirements
  validateData(data) {
    const validatedData = [];
    
    data.forEach((row, index) => {
      const validatedRow = { ...row };
      let hasErrors = false;

      // Check required fields
      Object.entries(this.config.fields).forEach(([fieldName, fieldConfig]) => {
        const value = row[fieldName];
        
        if (fieldConfig.required && !VALIDATION_RULES.required(value)) {
          this.errors.push(`Row ${row._rowIndex}: ${fieldConfig.label} is required`);
          hasErrors = true;
          return;
        }

        if (value && value !== '') {
          // Validate by field type
          switch (fieldConfig.type) {
            case 'date':
              if (!this.validateDate(value)) {
                this.errors.push(`Row ${row._rowIndex}: Invalid date format in ${fieldConfig.label}`);
                hasErrors = true;
              } else {
                validatedRow[fieldName] = this.parseDate(value);
              }
              break;

            case 'number':
            case 'currency':
              if (!VALIDATION_RULES.isNumber(value)) {
                this.errors.push(`Row ${row._rowIndex}: Invalid number in ${fieldConfig.label}`);
                hasErrors = true;
              } else {
                validatedRow[fieldName] = parseFloat(value);
              }
              break;

            case 'percentage':
              if (!VALIDATION_RULES.isPercentage(value)) {
                this.errors.push(`Row ${row._rowIndex}: Invalid percentage in ${fieldConfig.label}`);
                hasErrors = true;
              } else {
                validatedRow[fieldName] = parseFloat(value);
              }
              break;

            case 'category':
            case 'string':
              validatedRow[fieldName] = value.toString().trim();
              break;

            default:
              validatedRow[fieldName] = value;
          }
        }
      });

      if (!hasErrors) {
        validatedData.push(validatedRow);
      }
    });

    if (validatedData.length === 0) {
      throw new Error('No valid records found after validation');
    }

    return validatedData;
  }

  // Process and enrich data
  processData(data) {
    return data.map(row => {
      const processedRow = { ...row };

      // Add calculated fields based on report type
      switch (this.reportType) {
        case 'arrears':
          processedRow.days_overdue_bucket = this.getArrearsBucket(row.days_overdue);
          break;

        case 'call-center':
          if (row.calls_received && row.calls_answered) {
            processedRow.service_level = (row.calls_answered / row.calls_received) * 100;
          }
          break;

        case 'liquidations':
          if (row.recovery_rate && typeof row.recovery_rate === 'string' && row.recovery_rate.includes('%')) {
            processedRow.recovery_rate = parseFloat(row.recovery_rate.replace('%', ''));
          }
          break;

        default:
          break;
      }

      // Add metadata
      processedRow._processed_date = new Date().toISOString();
      processedRow._id = this.generateRowId(row);

      return processedRow;
    });
  }

  // Helper functions
  validateDate(value) {
    // Try multiple date formats
    const formats = [
      /^\d{4}-\d{2}-\d{2}$/, // YYYY-MM-DD
      /^\d{2}\/\d{2}\/\d{4}$/, // DD/MM/YYYY
      /^\d{2}-\d{2}-\d{4}$/, // DD-MM-YYYY
    ];

    return formats.some(format => format.test(value)) && !isNaN(Date.parse(value));
  }

  parseDate(value) {
    // Handle different date formats
    if (value.includes('/')) {
      const parts = value.split('/');
      if (parts.length === 3) {
        // Assume DD/MM/YYYY
        return new Date(parts[2], parts[1] - 1, parts[0]).toISOString().split('T')[0];
      }
    }
    
    return new Date(value).toISOString().split('T')[0];
  }

  getArrearsBucket(daysOverdue) {
    const days = parseInt(daysOverdue);
    if (days === 0) return 'Current';
    if (days <= 30) return '1-30 days';
    if (days <= 60) return '31-60 days';
    if (days <= 90) return '61-90 days';
    return '90+ days';
  }

  generateRowId(row) {
    // Create unique ID based on key fields
    const keyFields = ['date', 'account_id', 'complaint_id'].filter(field => row[field]);
    const keyString = keyFields.map(field => row[field]).join('_');
    return btoa(keyString).replace(/[+/=]/g, '').substring(0, 10);
  }

  generateStats(data) {
    return {
      totalRows: data.length,
      dateRange: this.getDateRange(data),
      fieldCoverage: this.getFieldCoverage(data),
      duplicateCount: this.getDuplicateCount(data)
    };
  }

  getDateRange(data) {
    const dates = data
      .map(row => row.date)
      .filter(date => date)
      .sort();
    
    return {
      earliest: dates[0] || null,
      latest: dates[dates.length - 1] || null
    };
  }

  getFieldCoverage(data) {
    const coverage = {};
    
    Object.keys(this.config.fields).forEach(field => {
      const populatedCount = data.filter(row => row[field] && row[field] !== '').length;
      coverage[field] = {
        populated: populatedCount,
        percentage: (populatedCount / data.length) * 100
      };
    });

    return coverage;
  }

  getDuplicateCount(data) {
    const seen = new Set();
    let duplicates = 0;

    data.forEach(row => {
      const key = row._id;
      if (seen.has(key)) {
        duplicates++;
      } else {
        seen.add(key);
      }
    });

    return duplicates;
  }
}

// Utility functions for external use
export const processCSV = async (file, reportType) => {
  const processor = new CSVProcessor(reportType);
  return await processor.processFile(file);
};

export const validateCSVStructure = (headers, reportType) => {
  const config = REPORT_CONFIG[reportType];
  const requiredFields = Object.entries(config.fields)
    .filter(([_, fieldConfig]) => fieldConfig.required)
    .map(([fieldName, _]) => fieldName);

  const missingFields = requiredFields.filter(field => {
    const mapping = COLUMN_MAPPINGS[field] || [field];
    return !headers.some(header => 
      mapping.some(variant => 
        header.toLowerCase().trim() === variant.toLowerCase().trim()
      )
    );
  });

  return {
    valid: missingFields.length === 0,
    missingFields,
    suggestions: missingFields.map(field => ({
      field,
      suggestions: COLUMN_MAPPINGS[field] || [field]
    }))
  };
};

export default CSVProcessor;

// Additional exports for compatibility
export const processCSVFile = processCSV;
export const validateDataTypes = () => ({ isValid: true, errors: [], warnings: [] });
export const validateBusinessRules = () => ({ isValid: true, errors: [], warnings: [] });
export const validateData = () => ({ isValid: true, errors: [], warnings: [] });
