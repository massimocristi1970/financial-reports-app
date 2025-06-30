// src/config/reportConfig.js

export const REPORT_TYPES = {
  LENDING_VOLUME: 'lending-volume',
  ARREARS: 'arrears', 
  LIQUIDATIONS: 'liquidations',
  CALL_CENTER: 'call-center',
  COMPLAINTS: 'complaints'
};

export const REPORT_CONFIG = {
  [REPORT_TYPES.LENDING_VOLUME]: {
    title: 'Lending Volume',
    description: 'Track loan origination volumes and trends',
    icon: '💰',
    color: '#2563eb',
    dataFile: 'lending-volume.json',
    fields: {
      date: { label: 'Date', type: 'date', required: true },
      amount: { label: 'Loan Amount', type: 'currency', required: true },
      product_type: { label: 'Product Type', type: 'category', required: true },
      region: { label: 'Region', type: 'category', required: false },
      channel: { label: 'Channel', type: 'category', required: false },
      loan_count: { label: 'Number of Loans', type: 'number', required: false }
    },
    kpis: [
      { key: 'total_volume', label: 'Total Volume', format: 'currency' },
      { key: 'avg_loan_size', label: 'Average Loan Size', format: 'currency' },
      { key: 'loan_count', label: 'Total Loans', format: 'number' },
      { key: 'growth_rate', label: 'Growth Rate', format: 'percentage' }
    ],
    charts: ['trend', 'product_breakdown', 'regional_distribution']
  },

  [REPORT_TYPES.ARREARS]: {
    title: 'Arrears Analysis',
    description: 'Monitor overdue accounts and payment behavior',
    icon: '⚠️',
    color: '#dc2626',
    dataFile: 'arrears.json',
    fields: {
      date: { label: 'Date', type: 'date', required: true },
      account_id: { label: 'Account ID', type: 'string', required: true },
      arrears_amount: { label: 'Arrears Amount', type: 'currency', required: true },
      days_overdue: { label: 'Days Overdue', type: 'number', required: true },
      product_type: { label: 'Product Type', type: 'category', required: false },
      customer_segment: { label: 'Customer Segment', type: 'category', required: false },
      balance: { label: 'Outstanding Balance', type: 'currency', required: false }
    },
    kpis: [
      { key: 'total_arrears', label: 'Total Arrears', format: 'currency' },
      { key: 'arrears_rate', label: 'Arrears Rate', format: 'percentage' },
      { key: 'avg_days_overdue', label: 'Avg Days Overdue', format: 'number' },
      { key: 'account_count', label: 'Accounts in Arrears', format: 'number' }
    ],
    charts: ['arrears_trend', 'aging_analysis', 'product_performance']
  },

  [REPORT_TYPES.LIQUIDATIONS]: {
    title: 'Liquidations',
    description: 'Track liquidation activities and recovery rates',
    icon: '🔄',
    color: '#7c3aed',
    dataFile: 'liquidations.json',
    fields: {
      date: { label: 'Date', type: 'date', required: true },
      account_id: { label: 'Account ID', type: 'string', required: true },
      liquidation_amount: { label: 'Liquidation Amount', type: 'currency', required: true },
      recovery_rate: { label: 'Recovery Rate', type: 'percentage', required: true },
      liquidation_type: { label: 'Liquidation Type', type: 'category', required: false },
      time_to_liquidation: { label: 'Time to Liquidation (days)', type: 'number', required: false }
    },
    kpis: [
      { key: 'total_liquidations', label: 'Total Liquidations', format: 'currency' },
      { key: 'avg_recovery_rate', label: 'Average Recovery Rate', format: 'percentage' },
      { key: 'liquidation_count', label: 'Number of Liquidations', format: 'number' },
      { key: 'avg_time_to_liquidation', label: 'Avg Time to Liquidation', format: 'number' }
    ],
    charts: ['liquidation_trend', 'recovery_analysis', 'type_breakdown']
  },

  [REPORT_TYPES.CALL_CENTER]: {
    title: 'Call Center Performance',
    description: 'Monitor call center metrics and customer service levels',
    icon: '📞',
    color: '#059669',
    dataFile: 'call-center.json',
    fields: {
      date: { label: 'Date', type: 'date', required: true },
      calls_received: { label: 'Calls Received', type: 'number', required: true },
      calls_answered: { label: 'Calls Answered', type: 'number', required: true },
      avg_wait_time: { label: 'Average Wait Time (seconds)', type: 'number', required: true },
      avg_handle_time: { label: 'Average Handle Time (seconds)', type: 'number', required: false },
      first_call_resolution: { label: 'First Call Resolution Rate', type: 'percentage', required: false },
      customer_satisfaction: { label: 'Customer Satisfaction Score', type: 'number', required: false }
    },
    kpis: [
      { key: 'service_level', label: 'Service Level', format: 'percentage' },
      { key: 'avg_wait_time', label: 'Average Wait Time', format: 'time' },
      { key: 'call_volume', label: 'Daily Call Volume', format: 'number' },
      { key: 'first_call_resolution', label: 'First Call Resolution', format: 'percentage' }
    ],
    charts: ['call_volume_trend', 'service_level_trend', 'performance_metrics']
  },

  [REPORT_TYPES.COMPLAINTS]: {
    title: 'Complaints Analysis',
    description: 'Track customer complaints and resolution performance',
    icon: '📋',
    color: '#ea580c',
    dataFile: 'complaints.json',
    fields: {
      date: { label: 'Date', type: 'date', required: true },
      complaint_id: { label: 'Complaint ID', type: 'string', required: true },
      complaint_type: { label: 'Complaint Type', type: 'category', required: true },
      status: { label: 'Status', type: 'category', required: true },
      resolution_time: { label: 'Resolution Time (days)', type: 'number', required: false },
      severity: { label: 'Severity', type: 'category', required: false },
      channel: { label: 'Channel', type: 'category', required: false }
    },
    kpis: [
      { key: 'total_complaints', label: 'Total Complaints', format: 'number' },
      { key: 'avg_resolution_time', label: 'Avg Resolution Time', format: 'number' },
      { key: 'resolution_rate', label: 'Resolution Rate', format: 'percentage' },
      { key: 'complaints_per_1000', label: 'Complaints per 1000 customers', format: 'number' }
    ],
    charts: ['complaint_trend', 'type_breakdown', 'resolution_performance']
  }
};

// Navigation configuration
export const NAVIGATION_CONFIG = [
  {
    path: '/',
    label: 'Overview',
    icon: '📊',
    component: 'OverviewDashboard'
  },
  {
    path: '/lending',
    label: 'Lending Volume',
    icon: '💰',
    component: 'LendingDashboard',
    reportType: REPORT_TYPES.LENDING_VOLUME
  },
  {
    path: '/arrears',
    label: 'Arrears',
    icon: '⚠️',
    component: 'ArrearsDashboard',
    reportType: REPORT_TYPES.ARREARS
  },
  {
    path: '/liquidations',
    label: 'Liquidations',
    icon: '🔄',
    component: 'LiquidationsDashboard',
    reportType: REPORT_TYPES.LIQUIDATIONS
  },
  {
    path: '/call-center',
    label: 'Call Center',
    icon: '📞',
    component: 'CallCenterDashboard',
    reportType: REPORT_TYPES.CALL_CENTER
  },
  {
    path: '/complaints',
    label: 'Complaints',
    icon: '📋',
    component: 'ComplaintsDashboard',
    reportType: REPORT_TYPES.COMPLAINTS
  },
  {
    path: '/admin',
    label: 'Data Management',
    icon: '⚙️',
    component: 'AdminPanel',
    adminOnly: true
  }
];

export default REPORT_CONFIG; 
