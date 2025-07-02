// src/services/validationService.js - CORRECT VERSION for your actual data structure
import { 
  REPORT_TYPES, 
  VALIDATION_RULES, 
  LOAN_STAGES, 
  PAYMENT_STATUSES,
  LEAD_SOURCES,
  CALL_DISPOSITIONS,
  CALL_DIRECTIONS,
  COMPLAINT_CATEGORIES,
  COMPLAINT_DECISIONS
} from '../utils/constants';

class ValidationService {
  constructor() {
    this.validationRules = this.initializeValidationRules();
    this.customValidators = new Map();
  }

  // Initialize validation rules for YOUR actual data structure
  initializeValidationRules() {
    return {
      [REPORT_TYPES.LENDING_VOLUME]: {
        required: ['customer_id', 'stage', 'stage_date', 'issued_amount'],
        types: {
          customer_id: 'string',
          funded_app_count: 'integer',
          tier_name: 'string',
          stage: 'string',
          stage_date: 'date',
          payment_status: 'string',
          funded_date: 'date',
          last_payment_date: 'date',
          issued_amount: 'number',
          total_due: 'number',
          payment: 'number'
        },
        constraints: {
          funded_app_count: { min: 0, max: 1000 },
          issued_amount: { min: 0, max: 10000000 },
          total_due: { min: 0, max: 10000000 },
          payment: { min: 0, max: 10000000 },
          stage: { enum: LOAN_STAGES },
          payment_status: { enum: PAYMENT_STATUSES },
          tier_name: { enum: LEAD_SOURCES }
        }
      },

      [REPORT_TYPES.ARREARS]: {
        required: ['customer_id', 'stage', 'stage_date', 'payment_status', 'issued_amount', 'total_due'],
        types: {
          customer_id: 'string',
          funded_app_count: 'integer',
          tier_name: 'string',
          stage: 'string',
          stage_date: 'date',
          payment_status: 'string',
          funded_date: 'date',
          last_payment_date: 'date',
          issued_amount: 'number',
          total_due: 'number',
          payment: 'number'
        },
        constraints: {
          funded_app_count: { min: 0, max: 1000 },
          issued_amount: { min: 0, max: 10000000 },
          total_due: { min: 0, max: 10000000 },
          payment: { min: 0, max: 10000000 },
          stage: { 
            enum: LOAN_STAGES.filter(stage => 
              !['Funded', 'Repaid'].includes(stage)
            ) 
          },
          payment_status: { enum: PAYMENT_STATUSES },
          tier_name: { enum: LEAD_SOURCES }
        }
      },

      [REPORT_TYPES.LIQUIDATIONS]: {
        required: ['funded_year', 'funded_month', 'funded', 'collected', 'actual_liquidation_rate', 'all_together'],
        types: {
          funded_year: 'integer',
          funded_month: 'integer',
          funded: 'number',
          collected: 'number',
          actual_liquidation_rate: 'percentage',
          future_scheduled: 'number',
          dmp_iva_collected: 'number',
          all_together: 'number',
          forecast_liquidation_rate: 'percentage',
          total_due_not_scheduled: 'number'
        },
        constraints: {
          funded_year: { min: 2000, max: 2030 },
          funded_month: { min: 1, max: 12 },
          funded: { min: 0, max: 100000000 },
          collected: { min: 0, max: 100000000 },
          actual_liquidation_rate: { min: 0, max: 100 },
          forecast_liquidation_rate: { min: 0, max: 100 },
          future_scheduled: { min: 0, max: 100000000 },
          dmp_iva_collected: { min: 0, max: 100000000 },
          all_together: { min: 0, max: 100000000 },
          total_due_not_scheduled: { min: 0, max: 100000000 }
        }
      },

      [REPORT_TYPES.CALL_CENTER]: {
        // Call Center has multiple file structures, so we define validation for each
        report1: {
          required: ['call_id', 'date_time', 'agent_name', 'disposition'],
          types: {
            call_id: 'string',
            date_time: 'datetime',
            agent_name: 'string',
            answered_date_time: 'datetime',
            from_number: 'string',
            disposition: 'string',
            talk_time: 'number'
          },
          constraints: {
            disposition: { enum: CALL_DISPOSITIONS },
            talk_time: { min: 0, max: 7200 }, // Max 2 hours
            call_id: { pattern: /^[A-Za-z0-9-_]+$/ }
          }
        },
        report2: {
          required: ['phone_numbers', 'total_calls', 'total_call_duration', 'inbound_calls', 'outbound_calls'],
          types: {
            phone_numbers: 'string',
            total_calls: 'integer',
            total_call_duration: 'number',
            inbound_calls: 'integer',
            inbound_call_duration: 'number',
            outbound_calls: 'integer',
            outbound_call_duration: 'number',
            missed_calls: 'integer'
          },
          constraints: {
            total_calls: { min: 0, max: 10000 },
            inbound_calls: { min: 0, max: 10000 },
            outbound_calls: { min: 0, max: 10000 },
            missed_calls: { min: 0, max: 10000 },
            total_call_duration: { min: 0, max: 1000000 },
            inbound_call_duration: { min: 0, max: 1000000 },
            outbound_call_duration: { min: 0, max: 1000000 }
          }
        },
        report3: {
          required: ['call_id', 'date_time_earliest', 'duration', 'initial_direction'],
          types: {
            call_id: 'string',
            date_time_earliest: 'datetime',
            duration: 'number',
            initial_direction: 'string',
            inbound: 'integer',
            outbound: 'integer'
          },
          constraints: {
            initial_direction: { enum: CALL_DIRECTIONS },
            duration: { min: 0, max: 7200 },
            inbound: { min: 0, max: 100 },
            outbound: { min: 0, max: 100 },
            call_id: { pattern: /^[A-Za-z0-9-_]+$/ }
          }
        },
        report4: {
          required: ['date', 'fcr'],
          types: {
            date: 'date',
            fcr: 'integer'
          },
          constraints: {
            fcr: { min: 0, max: 10000 }
          }
        }
      },

      [REPORT_TYPES.COMPLAINTS]: {
        required: ['customer_id', 'received_date', 'category'],
        types: {
          customer_id: 'string',
          count: 'integer',
          received_date: 'date',
          resolved_date: 'date',
          days_to_resolve: 'integer',
          category: 'string',
          decision: 'string'
        },
        constraints: {
          count: { min: 1, max: 100 },
          days_to_resolve: { min: 0, max: 365 },
          category: { enum: COMPLAINT_CATEGORIES },
          decision: { enum: COMPLAINT_DECISIONS }
        }
      }
    };
  }

  // Validate a single record against report type rules
  validateRecord(record, reportType, subType = null) {
    const errors = [];
    const warnings = [];

    try {
      // Get validation rules for the report type
      let rules;
      if (reportType === REPORT_TYPES.CALL_CENTER && subType) {
        rules = this.validationRules[reportType][subType];
      } else {
        rules = this.validationRules[reportType];
      }

      if (!rules) {
        errors.push(`No validation rules found for report type: ${reportType}`);
        return { isValid: false, errors, warnings };
      }

      // Check required fields
      if (rules.required) {
        rules.required.forEach(field => {
          if (!VALIDATION_RULES.required(record[field])) {
            errors.push(`Required field '${field}' is missing or empty`);
          }
        });
      }

      // Check data types and constraints
      Object.keys(record).forEach(field => {
        const value = record[field];
        
        if (value === null || value === undefined || value === '') {
          return; // Skip empty values for non-required fields
        }

        // Type validation
        if (rules.types && rules.types[field]) {
          const expectedType = rules.types[field];
          
          switch (expectedType) {
            case 'string':
              if (typeof value !== 'string') {
                errors.push(`Field '${field}' must be a string`);
              }
              break;
            case 'number':
              if (!VALIDATION_RULES.isNumber(value)) {
                errors.push(`Field '${field}' must be a valid number`);
              }
              break;
            case 'integer':
              if (!Number.isInteger(Number(value))) {
                errors.push(`Field '${field}' must be an integer`);
              }
              break;
            case 'date':
              if (!VALIDATION_RULES.isDate(value)) {
                errors.push(`Field '${field}' must be a valid date`);
              }
              break;
            case 'datetime':
              if (!VALIDATION_RULES.isDate(value)) {
                errors.push(`Field '${field}' must be a valid date/time`);
              }
              break;
            case 'percentage':
              if (!VALIDATION_RULES.isNumber(value) || !VALIDATION_RULES.isPercentage(value)) {
                errors.push(`Field '${field}' must be a valid percentage (0-100)`);
              }
              break;
          }
        }

        // Constraint validation
        if (rules.constraints && rules.constraints[field]) {
          const constraints = rules.constraints[field];
          
          if (constraints.min !== undefined && Number(value) < constraints.min) {
            errors.push(`Field '${field}' must be at least ${constraints.min}`);
          }
          
          if (constraints.max !== undefined && Number(value) > constraints.max) {
            errors.push(`Field '${field}' must be at most ${constraints.max}`);
          }
          
          if (constraints.enum && !constraints.enum.includes(value)) {
            warnings.push(`Field '${field}' value '${value}' is not in expected list: ${constraints.enum.join(', ')}`);
          }
          
          if (constraints.pattern && !constraints.pattern.test(value)) {
            errors.push(`Field '${field}' format is invalid`);
          }
        }
      });

      // Business rule validation
      const businessRuleResult = this.validateBusinessRules(record, reportType, subType);
      errors.push(...businessRuleResult.errors);
      warnings.push(...businessRuleResult.warnings);

    } catch (error) {
      errors.push(`Validation error: ${error.message}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  // Validate business rules specific to each report type
  validateBusinessRules(record, reportType, subType = null) {
    const errors = [];
    const warnings = [];

    switch (reportType) {
      case REPORT_TYPES.LENDING_VOLUME:
      case REPORT_TYPES.ARREARS:
        // Check if funded date is after stage date
        if (record.funded_date && record.stage_date) {
          const fundedDate = new Date(record.funded_date);
          const stageDate = new Date(record.stage_date);
          if (fundedDate < stageDate) {
            warnings.push('Funded date is before stage date');
          }
        }
        
        // Check if total due is greater than issued amount for active loans
        if (record.total_due && record.issued_amount && record.stage !== 'Repaid') {
          if (Number(record.total_due) < Number(record.issued_amount)) {
            warnings.push('Total due is less than issued amount for active loan');
          }
        }
        break;

      case REPORT_TYPES.LIQUIDATIONS:
        // Check if collected amount is reasonable compared to funded amount
        if (record.collected && record.funded) {
          const collectionRate = (Number(record.collected) / Number(record.funded)) * 100;
          if (collectionRate > 100) {
            warnings.push('Collection rate exceeds 100% of funded amount');
          }
        }
        
        // Check if actual rate matches calculated rate
        if (record.collected && record.funded && record.actual_liquidation_rate) {
          const calculatedRate = (Number(record.collected) / Number(record.funded)) * 100;
          const actualRate = Number(record.actual_liquidation_rate);
          if (Math.abs(calculatedRate - actualRate) > 1) {
            warnings.push('Actual liquidation rate does not match calculated rate');
          }
        }
        break;

      case REPORT_TYPES.CALL_CENTER:
        if (subType === 'report1') {
          // Check if answered time is after call time
          if (record.answered_date_time && record.date_time) {
            const answerTime = new Date(record.answered_date_time);
            const callTime = new Date(record.date_time);
            if (answerTime < callTime) {
              errors.push('Answered time cannot be before call time');
            }
          }
          
          // Check if disposition matches talk time
          if (record.disposition === 'Answered' && (!record.talk_time || Number(record.talk_time) === 0)) {
            warnings.push('Answered call should have talk time greater than 0');
          }
        }
        
        if (subType === 'report2') {
          // Check if total calls equals inbound + outbound
          const totalCalls = Number(record.total_calls) || 0;
          const inboundCalls = Number(record.inbound_calls) || 0;
          const outboundCalls = Number(record.outbound_calls) || 0;
          
          if (totalCalls !== (inboundCalls + outboundCalls)) {
            warnings.push('Total calls does not equal sum of inbound and outbound calls');
          }
        }
        break;

      case REPORT_TYPES.COMPLAINTS:
        // Check if resolved date is after received date
        if (record.resolved_date && record.received_date) {
          const resolvedDate = new Date(record.resolved_date);
          const receivedDate = new Date(record.received_date);
          if (resolvedDate < receivedDate) {
            errors.push('Resolved date cannot be before received date');
          }
          
          // Check if days to resolve matches date difference
          if (record.days_to_resolve) {
            const actualDays = Math.floor((resolvedDate - receivedDate) / (1000 * 60 * 60 * 24));
            const recordedDays = Number(record.days_to_resolve);
            if (Math.abs(actualDays - recordedDays) > 1) {
              warnings.push('Days to resolve does not match date difference');
            }
          }
        }
        
        // Check if resolved complaints have a decision
        if (record.resolved_date && !record.decision) {
          warnings.push('Resolved complaints should have a decision');
        }
        break;
    }

    return { errors, warnings };
  }

  // Validate entire dataset
  validateDataset(data, reportType, subType = null) {
    const results = {
      isValid: true,
      totalRecords: data.length,
      validRecords: 0,
      invalidRecords: 0,
      errors: [],
      warnings: [],
      recordErrors: []
    };

    data.forEach((record, index) => {
      const validation = this.validateRecord(record, reportType, subType);
      
      if (validation.isValid) {
        results.validRecords++;
      } else {
        results.invalidRecords++;
        results.isValid = false;
        results.recordErrors.push({
          rowIndex: index + 1,
          errors: validation.errors,
          warnings: validation.warnings
        });
      }
      
      // Collect all errors and warnings
      results.errors.push(...validation.errors);
      results.warnings.push(...validation.warnings);
    });

    return results;
  }

  // Sanitize and normalize data
  sanitizeData(data, reportType, subType = null) {
    return data.map(record => {
      const sanitized = {};
      
      Object.keys(record).forEach(field => {
        let value = record[field];
        
        // Skip empty values
        if (value === null || value === undefined || value === '') {
          sanitized[field] = null;
          return;
        }

        // Get field type
        let rules;
        if (reportType === REPORT_TYPES.CALL_CENTER && subType) {
          rules = this.validationRules[reportType][subType];
        } else {
          rules = this.validationRules[reportType];
        }

        const fieldType = rules?.types?.[field];

        // Sanitize based on type
        switch (fieldType) {
          case 'string':
            sanitized[field] = String(value).trim();
            break;
          case 'number':
          case 'integer':
            const numValue = Number(value);
            sanitized[field] = isNaN(numValue) ? null : numValue;
            break;
          case 'percentage':
            const pctValue = Number(value);
            sanitized[field] = isNaN(pctValue) ? null : Math.min(100, Math.max(0, pctValue));
            break;
          case 'date':
          case 'datetime':
            const dateValue = new Date(value);
            if (!isNaN(dateValue.getTime())) {
              sanitized[field] = dateValue.toISOString();
            } else {
              sanitized[field] = null;
            }
            break;
          default:
            sanitized[field] = value;
        }
      });

      return sanitized;
    });
  }

  // Get validation schema for report type
  getValidationSchema(reportType, subType = null) {
    if (reportType === REPORT_TYPES.CALL_CENTER && subType) {
      return this.validationRules[reportType]?.[subType] || null;
    }
    return this.validationRules[reportType] || null;
  }

  // Add custom validator
  addCustomValidator(name, validatorFunction) {
    this.customValidators.set(name, validatorFunction);
  }

  // Remove custom validator
  removeCustomValidator(name) {
    return this.customValidators.delete(name);
  }
}

// Create singleton instance
const validationService = new ValidationService();

export default validationService;

// Export individual functions for convenience
export const validateRecord = (record, reportType, subType) => 
  validationService.validateRecord(record, reportType, subType);
  
export const validateDataset = (data, reportType, subType) => 
  validationService.validateDataset(data, reportType, subType);
  
export const sanitizeData = (data, reportType, subType) => 
  validationService.sanitizeData(data, reportType, subType);
  
export const getValidationSchema = (reportType, subType) => 
  validationService.getValidationSchema(reportType, subType);