// src/utils/constants.js - FIXED VERSION

// Data storage keys
export const STORAGE_KEYS = {
  USER_PREFERENCES: 'financial_reports_preferences',
  CACHED_DATA: 'financial_reports_cache',
  LAST_UPDATE: 'financial_reports_last_update',
  FILTER_STATE: 'financial_reports_filters',
  DASHBOARD_STATE: 'financial_reports_dashboard'
};

// IndexedDB configuration
export const DB_CONFIG = {
  NAME: 'FinancialReportsDB',
  VERSION: 1,
  STORES: {
    LENDING: 'lending-volume',
    ARREARS: 'arrears',
    LIQUIDATIONS: 'liquidations',
    CALL_CENTER: 'call-center',
    COMPLAINTS: 'complaints',
    METADATA: 'metadata'
  }
};

// Date formats
export const DATE_FORMATS = {
  DISPLAY: 'DD/MM/YYYY',
  API: 'YYYY-MM-DD',
  CHART: 'MMM YYYY',
  TIMESTAMP: 'YYYY-MM-DD HH:mm:ss',
  DATETIME: 'DD/MM/YYYY HH:mm'
};

// File upload constraints
export const FILE_CONSTRAINTS = {
  MAX_SIZE: 50 * 1024 * 1024, // 50MB
  ALLOWED_TYPES: ['.csv', '.xlsx', '.xls'],
  MAX_ROWS: 100000
};

// Currency and number formats
export const FORMATS = {
  CURRENCY: {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  },
  PERCENTAGE: {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 2
  },
  NUMBER: {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }
};

// Updated report types to match your structure
export const REPORT_TYPES = {
  LENDING_VOLUME: 'lending-volume',
  ARREARS: 'arrears', 
  LIQUIDATIONS: 'liquidations',
  CALL_CENTER: 'call-center',
  COMPLAINTS: 'complaints'
};

// CSV column mappings (your actual column variations)
export const COLUMN_MAPPINGS = {
  // Lending Volume & Arrears fields
  customer_id: ['CustomerID', 'Customer ID', 'customer_id', 'customerId'],
  funded_app_count: ['FundedAppCount', 'Funded App Count', 'funded_app_count'],
  tier_name: ['TierName', 'Tier Name', 'tier_name', 'Lead Source'],
  stage: ['Stage', 'stage', 'Current Stage'],
  stage_date: ['StageDate', 'Stage Date', 'stage_date'],
  payment_status: ['PaymentStatus', 'Payment Status', 'payment_status'],
  funded_date: ['FundedDate', 'Funded Date', 'funded_date'],
  last_payment_date: ['LastPaymentDate', 'Last Payment Date', 'last_payment_date'],
  issued_amount: ['IssuedAmount', 'Issued Amount', 'issued_amount'],
  total_due: ['TotalDue', 'Total Due', 'total_due'],
  payment: ['Payment', 'payment', 'Payment Amount'],

  // Liquidations fields
  funded_year: ['FundedYear', 'Funded Year', 'funded_year'],
  funded_month: ['FundedMonth', 'Funded Month', 'funded_month'],
  funded: ['Funded', 'funded', 'Total Funded'],
  collected: ['Collected', 'collected', 'Total Collected'],
  actual_liquidation_rate: ['Actual Liquidation rate %', 'Actual Liquidation Rate', 'actual_liquidation_rate'],
  future_scheduled: ['FutureScheduled', 'Future Scheduled', 'future_scheduled'],
  dmp_iva_collected: ['DMP/IVA', 'DMP IVA', 'dmp_iva_collected'],
  all_together: ['AllTogether', 'All Together', 'all_together'],
  forecast_liquidation_rate: ['Forecast Liquidation rate %', 'Forecast Liquidation Rate', 'forecast_liquidation_rate'],
  total_due_not_scheduled: ['TotalDueNotScheduled', 'Total Due Not Scheduled', 'total_due_not_scheduled'],

  // Call Center Report 1 fields
  call_id: ['Call ID', 'CallID', 'call_id'],
  date_time: ['Date/Time', 'DateTime', 'date_time'],
  agent_name: ['Agent Name', 'AgentName', 'agent_name'],
  answered_date_time: ['Answered Date/Time', 'AnsweredDateTime', 'answered_date_time'],
  from_number: ['From', 'from', 'From Number'],
  disposition: ['Disposition', 'disposition'],
  talk_time: ['Talk Time', 'TalkTime', 'talk_time'],

  // Call Center Report 2 fields
  phone_numbers: ['Phone Numbers', 'PhoneNumbers', 'phone_numbers'],
  total_calls: ['Total Calls', 'TotalCalls', 'total_calls'],
  total_call_duration: ['Total Call Duration', 'TotalCallDuration', 'total_call_duration'],
  inbound_calls: ['Inbound Calls', 'InboundCalls', 'inbound_calls'],
  inbound_call_duration: ['Inbound Call Duration', 'InboundCallDuration', 'inbound_call_duration'],
  outbound_calls: ['Outbound Calls', 'OutboundCalls', 'outbound_calls'],
  outbound_call_duration: ['Outbound Call Duration', 'OutboundCallDuration', 'outbound_call_duration'],
  missed_calls: ['Missed Calls', 'MissedCalls', 'missed_calls'],

  // Call Center Report 3 fields
  date_time_earliest: ['Date/Time (earliest)', 'DateTime (earliest)', 'date_time_earliest'],
  duration: ['Duration', 'duration'],
  initial_direction: ['Initial Direction', 'InitialDirection', 'initial_direction'],
  inbound: ['Inbound', 'inbound'],
  outbound: ['Outbound', 'outbound'],

  // Call Center Report 4 fields
  date: ['Date', 'date'],
  fcr: ['FCR', 'fcr', 'First Call Resolution'],

  // Complaints fields
  count: ['Count', 'count', 'Complaint Count'],
  received_date: ['ReceivedDate', 'Received Date', 'received_date'],
  resolved_date: ['ResolvedDate', 'Resolved Date', 'resolved_date'],
  days_to_resolve: ['DaysToResolve', 'Days To Resolve', 'days_to_resolve'],
  category: ['Category', 'category', 'Complaint Category'],
  decision: ['Decision', 'decision', 'Resolution Decision']
};

// Data validation rules - FIXED THE SYNTAX ERROR
export const VALIDATION_RULES = {
  required: (value) => value !== null && value !== undefined && value !== '',
  isNumber: (value) => !isNaN(parseFloat(value)) && isFinite(value),
  isDate: (value) => !isNaN(Date.parse(value)),
  isPositive: (value) => parseFloat(value) >= 0,
  isPercentage: (value) => parseFloat(value) >= 0 && parseFloat(value) <= 100,
  maxLength: (value, length) => value.toString().length <= length,
  isCustomerId: (value) => /^[A-Za-z0-9]+$/.test(value), // Alphanumeric customer IDs
  isCallId: (value) => /^[A-Za-z0-9-_]+$/.test(value), // Call IDs can have hyphens/underscores
  isPhoneNumber: (value) => /^[\d\s\-\+\(\)]+$/.test(value) // Basic phone number validation
};

// Stage categories for lending/arrears
export const LOAN_STAGES = [
  'Application',
  'Underwriting',
  'Approved',
  'Funded',
  'Active',
  'Arrears',
  'Default',
  'Repaid',
  'Written Off'
];

// Payment status categories
export const PAYMENT_STATUSES = [
  'Current',
  'Late',
  'Missed',
  'Default',
  'Settled',
  'Written Off'
];

// Lead sources/Tier names
export const LEAD_SOURCES = [
  'Direct',
  'Broker',
  'Online',
  'Referral',
  'Marketing Campaign',
  'Social Media',
  'Other'
];

// Call dispositions
export const CALL_DISPOSITIONS = [
  'Answered',
  'Abandoned',
  'Forwarded',
  'Busy',
  'No Answer',
  'Voicemail'
];

// Call directions
export const CALL_DIRECTIONS = [
  'Inbound',
  'Outbound'
];

// Complaint categories
export const COMPLAINT_CATEGORIES = [
  'Payment Issues',
  'Customer Service',
  'Product Complaint',
  'Process Complaint',
  'Billing Dispute',
  'Data Protection',
  'Other'
];

// Complaint decisions
export const COMPLAINT_DECISIONS = [
  'Upheld',
  'Partially Upheld',
  'Not Upheld',
  'Withdrawn',
  'Referred',
  'Pending'
];

// Default filter values
export const DEFAULT_FILTERS = {
  dateRange: {
    start: null,
    end: null,
    preset: 'last_30_days'
  },
  stage: 'all',
  paymentStatus: 'all',
  leadSource: 'all',
  category: 'all'
};

// Date range presets
export const DATE_PRESETS = {
  last_7_days: {
    label: 'Last 7 days',
    days: 7
  },
  last_30_days: {
    label: 'Last 30 days', 
    days: 30
  },
  last_90_days: {
    label: 'Last 90 days',
    days: 90
  },
  last_6_months: {
    label: 'Last 6 months',
    days: 180
  },
  last_year: {
    label: 'Last year',
    days: 365
  },
  year_to_date: {
    label: 'Year to date',
    type: 'ytd'
  },
  custom: {
    label: 'Custom range',
    type: 'custom'
  }
};

// Error messages
export const ERROR_MESSAGES = {
  FILE_TOO_LARGE: 'File size exceeds maximum limit of 50MB',
  INVALID_FILE_TYPE: 'Please upload a CSV or Excel file',
  REQUIRED_FIELD_MISSING: 'Required field is missing or empty',
  INVALID_DATE_FORMAT: 'Invalid date format. Expected DD/MM/YYYY or YYYY-MM-DD',
  INVALID_NUMBER: 'Invalid number format',
  DUPLICATE_RECORDS: 'Duplicate records found in upload',
  NO_DATA_FOUND: 'No valid data found in file',
  NETWORK_ERROR: 'Network error occurred. Please try again.',
  STORAGE_ERROR: 'Error saving data. Please check browser storage.',
  EXPORT_ERROR: 'Error generating export file'
};

// Success messages
export const SUCCESS_MESSAGES = {
  DATA_UPLOADED: 'Data uploaded successfully',
  DATA_SAVED: 'Data saved successfully',
  EXPORT_GENERATED: 'Export file generated successfully',
  SETTINGS_SAVED: 'Settings saved successfully'
};

// Missing exports that useFilters.js needs
export const FILTER_PRESETS = DATE_PRESETS; // Alias for compatibility

// Product types (keeping for backward compatibility)
export const PRODUCT_TYPES = [
  'Personal Loan',
  'Mortgage', 
  'Credit Card',
  'Business Loan',
  'Auto Loan'
];

// Regions (keeping for backward compatibility)
export const REGIONS = [
  'North',
  'South',
  'East', 
  'West',
  'Central'
];

// Export default object with all constants
export default {
  COLUMN_MAPPINGS,
  REPORT_TYPES,
  VALIDATION_RULES,
  LOAN_STAGES,
  PAYMENT_STATUSES,
  LEAD_SOURCES,
  CALL_DISPOSITIONS,
  CALL_DIRECTIONS,
  COMPLAINT_CATEGORIES,
  COMPLAINT_DECISIONS,
  STORAGE_KEYS,
  DB_CONFIG,
  DATE_FORMATS,
  FILE_CONSTRAINTS,
  FORMATS,
  DEFAULT_FILTERS,
  DATE_PRESETS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  FILTER_PRESETS,
  PRODUCT_TYPES,
  REGIONS
};