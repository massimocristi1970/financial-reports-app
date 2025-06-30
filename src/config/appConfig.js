// src/config/appConfig.js

export const APP_CONFIG = {
  name: 'Financial Reports Dashboard',
  version: '1.0.0',
  description: 'Comprehensive financial reporting and analytics platform',
  
  // Data refresh settings
  dataRefreshInterval: 300000, // 5 minutes in milliseconds
  
  // Export settings
  exports: {
    dateFormat: 'DD/MM/YYYY',
    defaultFilename: 'financial-report',
    supportedFormats: ['pdf', 'csv', 'excel']
  },
  
  // UI settings
  ui: {
    theme: 'light',
    sidebarCollapsed: false,
    defaultDateRange: 90, // days
    itemsPerPage: 25,
    chartAnimationDuration: 1000
  },
  
  // IndexedDB settings
  database: {
    name: 'FinancialReportsDB',
    version: 1,
    stores: [
      'lending-volume',
      'arrears',
      'liquidations', 
      'call-center',
      'complaints',
      'metadata'
    ]
  },
  
  // Data validation rules
  validation: {
    maxFileSize: 50 * 1024 * 1024, // 50MB
    allowedFileTypes: ['.csv', '.xlsx', '.xls'],
    requiredFields: {
      'lending-volume': ['date', 'amount', 'product_type'],
      'arrears': ['date', 'account_id', 'arrears_amount', 'days_overdue'],
      'liquidations': ['date', 'account_id', 'liquidation_amount', 'recovery_rate'],
      'call-center': ['date', 'calls_received', 'calls_answered', 'avg_wait_time'],
      'complaints': ['date', 'complaint_type', 'status', 'resolution_time']
    }
  }
};

export default APP_CONFIG; 
