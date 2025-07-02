// src/config/reportConfig.js - COMPLETE WORKING VERSION

import { REPORT_TYPES } from '../utils/constants';

export const REPORT_CONFIG = {
  [REPORT_TYPES.LENDING_VOLUME]: {
    title: 'Lending Volume',
    description: 'Track loan origination volumes and customer activity',
    icon: '💰',
    color: '#2563eb',
    dataFile: 'lending-volume.json',
    fields: {
      customer_id: { label: 'Customer ID', type: 'string', required: true },
      funded_app_count: { label: 'Funded App Count', type: 'number', required: true },
      tier_name: { label: 'Lead Source', type: 'category', required: false },
      stage: { label: 'Current Stage', type: 'category', required: true },
      stage_date: { label: 'Stage Date', type: 'date', required: true },
      payment_status: { label: 'Payment Status', type: 'category', required: false },
      funded_date: { label: 'Funded Date', type: 'date', required: false },
      last_payment_date: { label: 'Last Payment Date', type: 'date', required: false },
      issued_amount: { label: 'Issued Amount', type: 'currency', required: true },
      total_due: { label: 'Total Due', type: 'currency', required: false },
      payment: { label: 'Payment Amount', type: 'currency', required: false }
    },
    kpis: [
      { key: 'total_issued', label: 'Total Issued Amount', format: 'currency' },
      { key: 'avg_loan_size', label: 'Average Loan Size', format: 'currency' },
      { key: 'funded_count', label: 'Funded Applications', format: 'number' },
      { key: 'conversion_rate', label: 'Funding Conversion Rate', format: 'percentage' }
    ],
    charts: ['funding_trend', 'stage_breakdown', 'lead_source_performance', 'payment_status_distribution']
  },

  [REPORT_TYPES.ARREARS]: {
    title: 'Arrears Analysis',
    description: 'Monitor overdue accounts and payment behavior (excluding Funded and Repaid)',
    icon: '⚠️',
    color: '#dc2626',
    dataFile: 'arrears.json',
    fields: {
      customer_id: { label: 'Customer ID', type: 'string', required: true },
      funded_app_count: { label: 'Funded App Count', type: 'number', required: true },
      tier_name: { label: 'Lead Source', type: 'category', required: false },
      stage: { label: 'Current Stage', type: 'category', required: true },
      stage_date: { label: 'Stage Date', type: 'date', required: true },
      payment_status: { label: 'Payment Status', type: 'category', required: true },
      funded_date: { label: 'Funded Date', type: 'date', required: false },
      last_payment_date: { label: 'Last Payment Date', type: 'date', required: false },
      issued_amount: { label: 'Issued Amount', type: 'currency', required: true },
      total_due: { label: 'Total Due', type: 'currency', required: true },
      payment: { label: 'Payment Amount', type: 'currency', required: false }
    },
    kpis: [
      { key: 'total_arrears', label: 'Total Arrears Amount', format: 'currency' },
      { key: 'arrears_accounts', label: 'Accounts in Arrears', format: 'number' },
      { key: 'avg_days_since_payment', label: 'Avg Days Since Last Payment', format: 'number' },
      { key: 'arrears_rate', label: 'Arrears Rate', format: 'percentage' }
    ],
    charts: ['arrears_trend', 'payment_status_breakdown', 'stage_analysis', 'aging_analysis']
  },

  [REPORT_TYPES.LIQUIDATIONS]: {
    title: 'Liquidations Analysis',
    description: 'Track liquidation performance and recovery rates',
    icon: '🔄',
    color: '#7c3aed',
    dataFile: 'liquidations.json',
    fields: {
      funded_year: { label: 'Funded Year', type: 'number', required: true },
      funded_month: { label: 'Funded Month', type: 'number', required: true },
      funded: { label: 'Total Funded Amount', type: 'currency', required: true },
      collected: { label: 'Collected (Not DMP/IVA)', type: 'currency', required: true },
      actual_liquidation_rate: { label: 'Actual Liquidation Rate', type: 'percentage', required: true },
      future_scheduled: { label: 'Future Scheduled Payments', type: 'currency', required: false },
      dmp_iva_collected: { label: 'DMP/IVA Collected', type: 'currency', required: false },
      all_together: { label: 'Total Combined Collected', type: 'currency', required: true },
      forecast_liquidation_rate: { label: 'Forecast Liquidation Rate', type: 'percentage', required: false },
      total_due_not_scheduled: { label: 'Outstanding Not Scheduled', type: 'currency', required: false }
    },
    kpis: [
      { key: 'total_funded', label: 'Total Funded', format: 'currency' },
      { key: 'total_collected', label: 'Total Collected', format: 'currency' },
      { key: 'avg_liquidation_rate', label: 'Average Liquidation Rate', format: 'percentage' },
      { key: 'recovery_efficiency', label: 'Recovery Efficiency', format: 'percentage' }
    ],
    charts: ['liquidation_trend', 'recovery_performance', 'vintage_analysis', 'collection_breakdown']
  },

  [REPORT_TYPES.CALL_CENTER]: {
    title: 'Call Center Performance',
    description: 'Monitor call center metrics across multiple data sources',
    icon: '📞',
    color: '#059669',
    dataFile: 'call-center.json',
    // Multiple file structure for call center
    fileStructures: {
      report1: {
        name: 'Call Details',
        fields: {
          call_id: { label: 'Call ID', type: 'string', required: true },
          date_time: { label: 'Date/Time', type: 'datetime', required: true },
          agent_name: { label: 'Agent Name', type: 'string', required: true },
          answered_date_time: { label: 'Answered Date/Time', type: 'datetime', required: false },
          from_number: { label: 'From Number', type: 'string', required: false },
          disposition: { label: 'Disposition', type: 'category', required: true },
          talk_time: { label: 'Talk Time (seconds)', type: 'number', required: false }
        }
      },
      report2: {
        name: 'Agent Performance',
        fields: {
          phone_numbers: { label: 'Phone Numbers', type: 'string', required: true },
          total_calls: { label: 'Total Calls', type: 'number', required: true },
          total_call_duration: { label: 'Total Call Duration', type: 'number', required: true },
          inbound_calls: { label: 'Inbound Calls', type: 'number', required: true },
          inbound_call_duration: { label: 'Inbound Call Duration', type: 'number', required: true },
          outbound_calls: { label: 'Outbound Calls', type: 'number', required: true },
          outbound_call_duration: { label: 'Outbound Call Duration', type: 'number', required: true },
          missed_calls: { label: 'Missed Calls', type: 'number', required: true }
        }
      },
      report3: {
        name: 'Call Statistics',
        fields: {
          call_id: { label: 'Call ID', type: 'string', required: true },
          date_time_earliest: { label: 'Date/Time (Earliest)', type: 'datetime', required: true },
          duration: { label: 'Duration', type: 'number', required: true },
          initial_direction: { label: 'Initial Direction', type: 'category', required: true },
          inbound: { label: 'Inbound Count', type: 'number', required: false },
          outbound: { label: 'Outbound Count', type: 'number', required: false }
        }
      },
      report4: {
        name: 'First Call Resolution',
        fields: {
          date: { label: 'Date', type: 'date', required: true },
          fcr: { label: 'First Call Resolution Count', type: 'number', required: true }
        }
      }
    },
    // Default fields for validation (use report1 as default)
    fields: {
      call_id: { label: 'Call ID', type: 'string', required: true },
      date_time: { label: 'Date/Time', type: 'datetime', required: true },
      agent_name: { label: 'Agent Name', type: 'string', required: true },
      answered_date_time: { label: 'Answered Date/Time', type: 'datetime', required: false },
      from_number: { label: 'From Number', type: 'string', required: false },
      disposition: { label: 'Disposition', type: 'category', required: true },
      talk_time: { label: 'Talk Time (seconds)', type: 'number', required: false }
    },
    kpis: [
      { key: 'total_calls', label: 'Total Calls', format: 'number' },
      { key: 'answer_rate', label: 'Answer Rate', format: 'percentage' },
      { key: 'avg_talk_time', label: 'Average Talk Time', format: 'time' },
      { key: 'fcr_rate', label: 'First Call Resolution Rate', format: 'percentage' }
    ],
    charts: ['call_volume_trend', 'agent_performance', 'disposition_breakdown', 'fcr_trend']
  },

  [REPORT_TYPES.COMPLAINTS]: {
    title: 'Complaints Analysis',
    description: 'Track customer complaints and resolution performance',
    icon: '📋',
    color: '#ea580c',
    dataFile: 'complaints.json',
    fields: {
      customer_id: { label: 'Customer ID', type: 'string', required: true },
      count: { label: 'Complaint Count', type: 'number', required: true },
      received_date: { label: 'Received Date', type: 'date', required: true },
      resolved_date: { label: 'Resolved Date', type: 'date', required: false },
      days_to_resolve: { label: 'Days to Resolve', type: 'number', required: false },
      category: { label: 'Category', type: 'category', required: true },
      decision: { label: 'Resolution Decision', type: 'category', required: false }
    },
    kpis: [
      { key: 'total_complaints', label: 'Total Complaints', format: 'number' },
      { key: 'avg_resolution_time', label: 'Avg Resolution Time (days)', format: 'number' },
      { key: 'resolution_rate', label: 'Resolution Rate', format: 'percentage' },
      { key: 'repeat_customers', label: 'Repeat Complaint Customers', format: 'number' }
    ],
    charts: ['complaint_trend', 'category_breakdown', 'resolution_performance', 'repeat_analysis']
  }
};

export const REPORT_CONFIGS = REPORT_CONFIG;

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