// src/services/validationService.js
import { REPORT_TYPES, VALIDATION_RULES } from '../utils/constants';
import { formatters } from '../utils/formatters';

class ValidationService {
  constructor() {
    this.validationRules = this.initializeValidationRules();
    this.customValidators = new Map();
  }

  // Initialize validation rules for each report type
  initializeValidationRules() {
    return {
      [REPORT_TYPES.LENDING_VOLUME]: {
        required: ['date', 'product_type', 'region', 'amount', 'count'],
        types: {
          date: 'date',
          product_type: 'string',
          region: 'string',
          amount: 'number',
          count: 'integer'
        },
        constraints: {
          amount: { min: 0, max: 10000000 },
          count: { min: 0, max: 100000 },
          product_type: { enum: ['Personal Loan', 'Mortgage', 'Credit Card', 'Business Loan', 'Auto Loan'] },
          region: { enum: ['North', 'South', 'East', 'West', 'Central'] }
        }
      },
      [REPORT_TYPES.ARREARS]: {
        required: ['date', 'account_id', 'product_type', 'days_overdue', 'outstanding_amount', 'region'],
        types: {
          date: 'date',
          account_id: 'string',
          product_type: 'string',
          days_overdue: 'integer',
          outstanding_amount: 'number',
          region: 'string'
        },
        constraints: {
          days_overdue: { min: 1, max: 9999 },
          outstanding_amount: { min: 0, max: 10000000 },
          account_id: { pattern: /^[A-Z0-9]{8,15}$/ }
        }
      },
      [REPORT_TYPES.LIQUIDATIONS]: {
        required: ['date', 'account_id', 'product_type', 'liquidation_amount', 'recovery_amount', 'status'],
        types: {
          date: 'date',
          account_id: 'string',
          product_type: 'string',
          liquidation_amount: 'number',
          recovery_amount: 'number',
          status: 'string'
        },
        constraints: {
          liquidation_amount: { min: 0, max: 10000000 },
          recovery_amount: { min: 0, max: 10000000 },
          status: { enum: ['Pending', 'In Progress', 'Completed', 'Failed'] }
        }
      },
      [REPORT_TYPES.CALL_CENTER]: {
        required: ['date', 'agent_id', 'call_type', 'duration_minutes', 'resolution_status', 'satisfaction_score'],
        types: {
          date: 'date',
          agent_id: 'string',
          call_type: 'string',
          duration_minutes: 'number',
          resolution_status: 'string',
          satisfaction_score: 'integer'
        },
        constraints: {
          duration_minutes: { min: 0, max: 300 },
          satisfaction_score: { min: 1, max: 5 },
          call_type: { enum: ['Support', 'Sales', 'Complaint', 'Information', 'Technical'] },
          resolution_status: { enum: ['Resolved', 'Escalated', 'Pending', 'Transferred'] }
        }
      },
      [REPORT_TYPES.COMPLAINTS]: {
        required: ['date', 'complaint_id', 'category', 'severity', 'status', 'days_to_resolve'],
        types: {
          date: 'date',
          complaint_id: 'string',
          category: 'string',
          severity: 'string',
          status: 'string',
          days_to_resolve: 'integer'
        },
        constraints: {
          days_to_resolve: { min: 0, max: 365 },
          severity: { enum: ['Low', 'Medium', 'High', 'Critical'] },
          status: { enum: ['Open', 'In Progress', 'Resolved', 'Closed'] },
          category: { enum: ['Service', 'Product', 'Billing', 'Technical', 'Process'] }
        }
      }
    };
  }

  // Validate a single record
  validateRecord(record, reportType, options = {}) {
    const {
      strict = true,
      allowPartial = false,
      customRules = null
    } = options;

    const errors = [];
    const warnings = [];
    
    // Get validation rules for report type
    const rules = customRules || this.validationRules[reportType];
    if (!rules) {
      return {
        isValid: false,
        errors: [`Unknown report type: ${reportType}`],
        warnings: []
      };
    }

    // Check required fields
    if (!allowPartial) {
      for (const field of rules.required) {
        if (record[field] === undefined || record[field] === null || record[field] === '') {
          errors.push(`Missing required field: ${field}`);
        }
      }
    }

    // Validate field types and constraints
    for (const [field, value] of Object.entries(record)) {
      if (value === undefined || value === null || value === '') {
        continue; // Skip empty values (handled by required check)
      }

      // Type validation
      if (rules.types && rules.types[field]) {
        const typeValidation = this.validateFieldType(value, rules.types[field], field);
        if (!typeValidation.isValid) {
          errors.push(...typeValidation.errors);
        }
        if (typeValidation.warnings) {
          warnings.push(...typeValidation.warnings);
        }
      }

      // Constraint validation
      if (rules.constraints && rules.constraints[field]) {
        const constraintValidation = this.validateFieldConstraints(value, rules.constraints[field], field);
        if (!constraintValidation.isValid) {
          errors.push(...constraintValidation.errors);
        }
        if (constraintValidation.warnings) {
          warnings.push(...constraintValidation.warnings);
        }
      }
    }

    // Business logic validation
    const businessValidation = this.validateBusinessLogic(record, reportType);
    if (!businessValidation.isValid) {
      errors.push(...businessValidation.errors);
    }
    if (businessValidation.warnings) {
      warnings.push(...businessValidation.warnings);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      record: this.sanitizeRecord(record, reportType)
    };
  }

  // Validate field type
  validateFieldType(value, expectedType, fieldName) {
    const errors = [];
    const warnings = [];

    switch (expectedType) {
      case 'string':
        if (typeof value !== 'string') {
          // Try to convert to string
          if (value !== null && value !== undefined) {
            warnings.push(`Field '${fieldName}' converted from ${typeof value} to string`);
          } else {
            errors.push(`Field '${fieldName}' must be a string`);
          }
        }
        break;

      case 'number':
        const numValue = parseFloat(value);
        if (isNaN(numValue)) {
          errors.push(`Field '${fieldName}' must be a valid number`);
        }
        break;

      case 'integer':
        const intValue = parseInt(value);
        if (isNaN(intValue) || intValue !== parseFloat(value)) {
          errors.push(`Field '${fieldName}' must be a valid integer`);
        }
        break;

      case 'date':
        const dateValue = new Date(value);
        if (isNaN(dateValue.getTime())) {
          errors.push(`Field '${fieldName}' must be a valid date`);
        } else {
          // Check if date is reasonable (not too far in past/future)
          const now = new Date();
          const fiveYearsAgo = new Date(now.getFullYear() - 5, now.getMonth(), now.getDate());
          const oneYearFuture = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
          
          if (dateValue < fiveYearsAgo) {
            warnings.push(`Field '${fieldName}' date is more than 5 years old`);
          } else if (dateValue > oneYearFuture) {
            warnings.push(`Field '${fieldName}' date is more than 1 year in the future`);
          }
        }
        break;

      case 'boolean':
        if (typeof value !== 'boolean' && value !== 'true' && value !== 'false' && value !== 0 && value !== 1) {
          errors.push(`Field '${fieldName}' must be a boolean value`);
        }
        break;

      default:
        warnings.push(`Unknown type validation for field '${fieldName}': ${expectedType}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  // Validate field constraints
  validateFieldConstraints(value, constraints, fieldName) {
    const errors = [];
    const warnings = [];

    // Minimum value constraint
    if (constraints.min !== undefined) {
      const numValue = parseFloat(value);
      if (!isNaN(numValue) && numValue < constraints.min) {
        errors.push(`Field '${fieldName}' must be at least ${constraints.min}`);
      }
    }

    // Maximum value constraint
    if (constraints.max !== undefined) {
      const numValue = parseFloat(value);
      if (!isNaN(numValue) && numValue > constraints.max) {
        errors.push(`Field '${fieldName}' must be at most ${constraints.max}`);
      }
    }

    // Enum constraint
    if (constraints.enum && Array.isArray(constraints.enum)) {
      if (!constraints.enum.includes(value)) {
        errors.push(`Field '${fieldName}' must be one of: ${constraints.enum.join(', ')}`);
      }
    }

    // Pattern constraint
    if (constraints.pattern && constraints.pattern instanceof RegExp) {
      if (!constraints.pattern.test(String(value))) {
        errors.push(`Field '${fieldName}' does not match required pattern`);
      }
    }

    // Length constraints
    if (constraints.minLength !== undefined) {
      if (String(value).length < constraints.minLength) {
        errors.push(`Field '${fieldName}' must be at least ${constraints.minLength} characters long`);
      }
    }

    if (constraints.maxLength !== undefined) {
      if (String(value).length > constraints.maxLength) {
        errors.push(`Field '${fieldName}' must be at most ${constraints.maxLength} characters long`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  // Validate business logic rules
  validateBusinessLogic(record, reportType) {
    const errors = [];
    const warnings = [];

    switch (reportType) {
      case REPORT_TYPES.LIQUIDATIONS:
        // Recovery amount should not exceed liquidation amount
        if (record.recovery_amount && record.liquidation_amount) {
          const recovery = parseFloat(record.recovery_amount);
          const liquidation = parseFloat(record.liquidation_amount);
          
          if (!isNaN(recovery) && !isNaN(liquidation) && recovery > liquidation) {
            errors.push('Recovery amount cannot exceed liquidation amount');
          }
        }
        break;

      case REPORT_TYPES.CALL_CENTER:
        // Long duration calls with low satisfaction should be flagged
        if (record.duration_minutes && record.satisfaction_score) {
          const duration = parseFloat(record.duration_minutes);
          const satisfaction = parseInt(record.satisfaction_score);
          
          if (!isNaN(duration) && !isNaN(satisfaction)) {
            if (duration > 30 && satisfaction <= 2) {
              warnings.push('Long call duration with low satisfaction score');
            }
          }
        }
        break;

      case REPORT_TYPES.ARREARS:
        // High overdue days with low outstanding amount might be data quality issue
        if (record.days_overdue && record.outstanding_amount) {
          const days = parseInt(record.days_overdue);
          const amount = parseFloat(record.outstanding_amount);
          
          if (!isNaN(days) && !isNaN(amount)) {
            if (days > 90 && amount < 100) {
              warnings.push('High overdue days with very low outstanding amount');
            }
          }
        }
        break;

      case REPORT_TYPES.COMPLAINTS:
        // Critical complaints should be resolved quickly
        if (record.severity && record.days_to_resolve && record.status) {
          const days = parseInt(record.days_to_resolve);
          
          if (!isNaN(days) && record.severity === 'Critical' && days > 7 && record.status === 'Resolved') {
            warnings.push('Critical complaint took more than 7 days to resolve');
          }
        }
        break;
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  // Validate batch of records
  validateBatch(records, reportType, options = {}) {
    const {
      stopOnError = false,
      maxErrors = 100,
      progressCallback = null
    } = options;

    const results = {
      totalRecords: records.length,
      validRecords: [],
      invalidRecords: [],
      warnings: [],
      summary: {
        valid: 0,
        invalid: 0,
        totalErrors: 0,
        totalWarnings: 0
      }
    };

    for (let i = 0; i < records.length; i++) {
      // Progress callback
      if (progressCallback && i % 100 === 0) {
        progressCallback({
          current: i,
          total: records.length,
          valid: results.summary.valid,
          invalid: results.summary.invalid
        });
      }

      const validation = this.validateRecord(records[i], reportType, options);
      
      if (validation.isValid) {
        results.validRecords.push({
          index: i,
          record: validation.record,
          warnings: validation.warnings
        });
        results.summary.valid++;
      } else {
        results.invalidRecords.push({
          index: i,
          record: records[i],
          errors: validation.errors,
          warnings: validation.warnings
        });
        results.summary.invalid++;
        results.summary.totalErrors += validation.errors.length;
      }

      results.summary.totalWarnings += validation.warnings.length;

      // Stop on error if requested
      if (stopOnError && !validation.isValid) {
        break;
      }

      // Stop if max errors reached
      if (results.summary.totalErrors >= maxErrors) {
        results.truncated = true;
        break;
      }
    }

    // Final progress callback
    if (progressCallback) {
      progressCallback({
        current: results.totalRecords,
        total: results.totalRecords,
        valid: results.summary.valid,
        invalid: results.summary.invalid,
        completed: true
      });
    }

    return results;
  }

  // Sanitize and format record
  sanitizeRecord(record, reportType) {
    const sanitized = { ...record };
    const rules = this.validationRules[reportType];

    if (!rules) return sanitized;

    // Type conversions and sanitization
    for (const [field, value] of Object.entries(sanitized)) {
      if (value === undefined || value === null || value === '') {
        continue;
      }

      if (rules.types && rules.types[field]) {
        switch (rules.types[field]) {
          case 'string':
            sanitized[field] = String(value).trim();
            break;
          case 'number':
            const numValue = parseFloat(value);
            if (!isNaN(numValue)) {
              sanitized[field] = numValue;
            }
            break;
          case 'integer':
            const intValue = parseInt(value);
            if (!isNaN(intValue)) {
              sanitized[field] = intValue;
            }
            break;
          case 'date':
            const dateValue = new Date(value);
            if (!isNaN(dateValue.getTime())) {
              sanitized[field] = dateValue.toISOString().split('T')[0]; // YYYY-MM-DD format
            }
            break;
          case 'boolean':
            if (typeof value === 'string') {
              sanitized[field] = value.toLowerCase() === 'true';
            } else {
              sanitized[field] = Boolean(value);
            }
            break;
        }
      }
    }

    return sanitized;
  }

  // Add custom validator
  addCustomValidator(name, validatorFunction) {
    this.customValidators.set(name, validatorFunction);
  }

  // Remove custom validator
  removeCustomValidator(name) {
    return this.customValidators.delete(name);
  }

  // Validate with custom validator
  validateWithCustom(record, validatorName, options = {}) {
    const validator = this.customValidators.get(validatorName);
    if (!validator) {
      throw new Error(`Custom validator '${validatorName}' not found`);
    }

    return validator(record, options);
  }

  // Get validation schema for report type
  getValidationSchema(reportType) {
    return this.validationRules[reportType] || null;
  }

  // Update validation rules
  updateValidationRules(reportType, rules) {
    this.validationRules[reportType] = {
      ...this.validationRules[reportType],
      ...rules
    };
  }

  // Validate file format before processing
  validateFileFormat(file, expectedType = 'csv') {
    const errors = [];
    const warnings = [];

    // Check file existence
    if (!file) {
      errors.push('No file provided');
      return { isValid: false, errors, warnings };
    }

    // Check file size (max 50MB)
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      errors.push(`File size (${formatters.formatFileSize(file.size)}) exceeds maximum allowed size (${formatters.formatFileSize(maxSize)})`);
    }

    // Check file type
    const allowedTypes = {
      csv: ['text/csv', 'application/csv', 'text/plain'],
      excel: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel'],
      json: ['application/json', 'text/json']
    };

    const allowedExtensions = {
      csv: ['.csv', '.txt'],
      excel: ['.xlsx', '.xls'],
      json: ['.json']
    };

    if (expectedType && allowedTypes[expectedType]) {
      const fileName = file.name.toLowerCase();
      const fileExtension = fileName.substring(fileName.lastIndexOf('.'));
      
      const validMimeType = allowedTypes[expectedType].includes(file.type);
      const validExtension = allowedExtensions[expectedType].includes(fileExtension);

      if (!validMimeType && !validExtension) {
        errors.push(`Invalid file type. Expected ${expectedType.toUpperCase()} file`);
      } else if (!validMimeType) {
        warnings.push('File MIME type may not be correctly set, but extension is valid');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  // Generate validation report
  generateValidationReport(validationResults, reportType) {
    const report = {
      reportType,
      timestamp: new Date().toISOString(),
      summary: validationResults.summary,
      validationRules: this.validationRules[reportType],
      details: {
        validRecords: validationResults.validRecords.length,
        invalidRecords: validationResults.invalidRecords.length,
        errorBreakdown: {},
        warningBreakdown: {}
      }
    };

    // Analyze error patterns
    validationResults.invalidRecords.forEach(invalid => {
      invalid.errors.forEach(error => {
        report.details.errorBreakdown[error] = (report.details.errorBreakdown[error] || 0) + 1;
      });
    });

    // Analyze warning patterns
    [...validationResults.validRecords, ...validationResults.invalidRecords].forEach(record => {
      if (record.warnings) {
        record.warnings.forEach(warning => {
          report.details.warningBreakdown[warning] = (report.details.warningBreakdown[warning] || 0) + 1;
        });
      }
    });

    return report;
  }

  // Get validation statistics
  getValidationStats() {
    return {
      supportedReportTypes: Object.keys(this.validationRules),
      customValidators: Array.from(this.customValidators.keys()),
      validationRulesSummary: Object.entries(this.validationRules).map(([type, rules]) => ({
        type,
        requiredFields: rules.required.length,
        typedFields: Object.keys(rules.types || {}).length,
        constrainedFields: Object.keys(rules.constraints || {}).length
      }))
    };
  }
}

// Create and export singleton instance
const validationService = new ValidationService();
export default validationService; 
