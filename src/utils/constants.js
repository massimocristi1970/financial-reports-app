// src/utils/constants.js

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
  TIMESTAMP: 'YYYY-MM-DD HH:mm:ss'
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

// Default filter values
export const DEFAULT_FILTERS = {
  dateRange: {
    start: null,
    end: null,
    preset: 'last_30_days'
  },
  productType: 'all',
  region: 'all',
  status: 'all'
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

// CSV column mappings (common variations)
export const COLUMN_MAPPINGS = {
  date: ['date', 'Date', 'DATE', 'transaction_date', 'reporting_date'],
  amount: ['amount', 'Amount', 'AMOUNT', 'loan_amount', 'value', 'Value'],
  product_type: ['product_type', 'Product Type', 'PRODUCT_TYPE', 'product', 'Product'],
  account_id: ['account_id', 'Account ID', 'ACCOUNT_ID', 'account', 'Account'],
  region: ['region', 'Region', 'REGION', 'area', 'Area'],
  status: ['status', 'Status', 'STATUS', 'state', 'State']
};

// Data validation rules
export const VALIDATION_RULES = {
  required: (value) => value !== null && value !== undefined && value !== '',
  isNumber: (value) => !isNaN(parseFloat(value)) && isFinite(value),
  isDate: (value) => !isNaN(Date.parse(value)),
  isPositive: (value) => parseFloat(value) >= 0,
  isPercentage: (value) => parseFloat(value) >= 0 && parseFloat(value) <= 100,
  maxLength: (value, length) => value.toString().length <= length
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

// Chart defaults
export const CHART_DEFAULTS = {
  HEIGHT: 400,
  ANIMATION_DURATION: 1000,
  POINT_RADIUS: 4,
  LINE_WIDTH: 2,
  GRID_COLOR: 'rgba(0, 0, 0, 0.1)',
  FONT_SIZE: 12
};

// Table defaults
export const TABLE_DEFAULTS = {
  PAGE_SIZE: 25,
  PAGE_SIZE_OPTIONS: [10, 25, 50, 100],
  SORT_DIRECTION: 'desc',
  SORT_FIELD: 'date'
};

// API endpoints (for future server integration)
export const API_ENDPOINTS = {
  BASE_URL: process.env.REACT_APP_API_URL || '',
  DATA: '/api/data',
  UPLOAD: '/api/upload',
  EXPORT: '/api/export',
  HEALTH: '/api/health'
};

// Loading states
export const LOADING_STATES = {
  IDLE: 'idle',
  LOADING: 'loading',
  SUCCESS: 'success',
  ERROR: 'error'
};

// Export formats
export const EXPORT_FORMATS = {
  CSV: 'csv',
  EXCEL: 'xlsx',
  PDF: 'pdf',
  JSON: 'json'
};

// Notification types
export const NOTIFICATION_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info'
};

// Arrears aging buckets
export const ARREARS_BUCKETS = {
  CURRENT: { min: 0, max: 0, label: 'Current' },
  BUCKET_1_30: { min: 1, max: 30, label: '1-30 days' },
  BUCKET_31_60: { min: 31, max: 60, label: '31-60 days' },
  BUCKET_61_90: { min: 61, max: 90, label: '61-90 days' },
  BUCKET_90_PLUS: { min: 91, max: Infinity, label: '90+ days' }
};

// Call center service level thresholds
export const SERVICE_LEVEL_THRESHOLDS = {
  EXCELLENT: 95,
  GOOD: 85,
  ACCEPTABLE: 75,
  POOR: 60
};

// Complaint severity levels
export const COMPLAINT_SEVERITY = {
  LOW: 'Low',
  MEDIUM: 'Medium', 
  HIGH: 'High',
  CRITICAL: 'Critical'
};

// Report types based on existing DB_CONFIG.STORES
export const REPORT_TYPES = {
  LENDING_VOLUME: 'lending-volume',
  ARREARS: 'arrears', 
  LIQUIDATIONS: 'liquidations',
  CALL_CENTER: 'call-center',
  COMPLAINTS: 'complaints'
};

// Filter presets using existing DATE_PRESETS
export const FILTER_PRESETS = DATE_PRESETS;

// Product types array
export const PRODUCT_TYPES = [
  'Personal Loan',
  'Mortgage', 
  'Credit Card',
  'Business Loan',
  'Auto Loan'
];

// Regions array
export const REGIONS = [
  'North',
  'South',
  'East', 
  'West',
  'Central'
];


export default {
  STORAGE_KEYS,
  DB_CONFIG,
  DATE_FORMATS,
  FILE_CONSTRAINTS,
  FORMATS,
  DEFAULT_FILTERS,
  DATE_PRESETS,
  COLUMN_MAPPINGS,
  VALIDATION_RULES,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  CHART_DEFAULTS,
  TABLE_DEFAULTS,
  API_ENDPOINTS,
  LOADING_STATES,
  EXPORT_FORMATS,
  NOTIFICATION_TYPES,
  ARREARS_BUCKETS,
  SERVICE_LEVEL_THRESHOLDS,
  COMPLAINT_SEVERITY
}; 
