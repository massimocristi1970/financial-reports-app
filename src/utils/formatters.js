// src/utils/formatters.js
import { FORMATS } from './constants';

// Currency formatter
export const formatCurrency = (value, options = {}) => {
  if (value === null || value === undefined || isNaN(value)) {
    return '£0';
  }
  
  const defaultOptions = {
    ...FORMATS.CURRENCY,
    ...options
  };
  
  return new Intl.NumberFormat('en-GB', defaultOptions).format(value);
};

// Percentage formatter
export const formatPercentage = (value, options = {}) => {
  if (value === null || value === undefined || isNaN(value)) {
    return '0%';
  }
  
  const defaultOptions = {
    ...FORMATS.PERCENTAGE,
    ...options
  };
  
  // Assume value is already in percentage format (e.g., 25 for 25%)
  return new Intl.NumberFormat('en-GB', defaultOptions).format(value / 100);
};

// Number formatter
export const formatNumber = (value, options = {}) => {
  if (value === null || value === undefined || isNaN(value)) {
    return '0';
  }
  
  const defaultOptions = {
    ...FORMATS.NUMBER,
    ...options
  };
  
  return new Intl.NumberFormat('en-GB', defaultOptions).format(value);
};

// Large number formatter (K, M, B)
export const formatLargeNumber = (value, options = {}) => {
  if (value === null || value === undefined || isNaN(value)) {
    return '0';
  }
  
  const absValue = Math.abs(value);
  let formattedValue;
  let suffix = '';
  
  if (absValue >= 1000000000) {
    formattedValue = value / 1000000000;
    suffix = 'B';
  } else if (absValue >= 1000000) {
    formattedValue = value / 1000000;
    suffix = 'M';
  } else if (absValue >= 1000) {
    formattedValue = value / 1000;
    suffix = 'K';
  } else {
    formattedValue = value;
  }
  
  const defaultOptions = {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
    ...options
  };
  
  const formatted = new Intl.NumberFormat('en-GB', defaultOptions).format(formattedValue);
  return formatted + suffix;
};

// Time formatter (seconds to minutes:seconds)
export const formatTime = (seconds) => {
  if (seconds === null || seconds === undefined || isNaN(seconds)) {
    return '0:00';
  }
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

// Duration formatter (days, hours, minutes)
export const formatDuration = (days) => {
  if (days === null || days === undefined || isNaN(days)) {
    return '0 days';
  }
  
  const wholeDays = Math.floor(days);
  const hours = Math.floor((days - wholeDays) * 24);
  
  if (wholeDays === 0 && hours === 0) {
    return '< 1 hour';
  }
  
  if (wholeDays === 0) {
    return `${hours} hour${hours !== 1 ? 's' : ''}`;
  }
  
  if (hours === 0) {
    return `${wholeDays} day${wholeDays !== 1 ? 's' : ''}`;
  }
  
  return `${wholeDays} day${wholeDays !== 1 ? 's' : ''}, ${hours} hour${hours !== 1 ? 's' : ''}`;
};

// Date formatter
export const formatDate = (date, format = 'DD/MM/YYYY') => {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) {
    return '';
  }
  
  const day = dateObj.getDate().toString().padStart(2, '0');
  const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
  const year = dateObj.getFullYear();
  
  switch (format) {
    case 'DD/MM/YYYY':
      return `${day}/${month}/${year}`;
    case 'MM/DD/YYYY':
      return `${month}/${day}/${year}`;
    case 'YYYY-MM-DD':
      return `${year}-${month}-${day}`;
    case 'DD MMM YYYY':
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                     'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `${day} ${months[dateObj.getMonth()]} ${year}`;
    case 'MMM YYYY':
      const monthsLong = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                         'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `${monthsLong[dateObj.getMonth()]} ${year}`;
    default:
      return `${day}/${month}/${year}`;
  }
};

// Relative date formatter (e.g., "2 days ago", "in 3 hours")
export const formatRelativeDate = (date) => {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - dateObj.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffSeconds < 60) {
    return 'just now';
  } else if (diffMinutes < 60) {
    return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
  } else if (diffHours < 24) {
    return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  } else if (diffDays < 7) {
    return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
  } else if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `${weeks} week${weeks !== 1 ? 's' : ''} ago`;
  } else if (diffDays < 365) {
    const months = Math.floor(diffDays / 30);
    return `${months} month${months !== 1 ? 's' : ''} ago`;
  } else {
    const years = Math.floor(diffDays / 365);
    return `${years} year${years !== 1 ? 's' : ''} ago`;
  }
};

// File size formatter
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Phone number formatter
export const formatPhoneNumber = (phoneNumber) => {
  if (!phoneNumber) return '';
  
  // Remove all non-numeric characters
  const cleaned = phoneNumber.replace(/\D/g, '');
  
  // UK mobile format
  if (cleaned.length === 11 && cleaned.startsWith('07')) {
    return `${cleaned.slice(0, 5)} ${cleaned.slice(5, 8)} ${cleaned.slice(8)}`;
  }
  
  // UK landline format
  if (cleaned.length === 11 && cleaned.startsWith('01')) {
    return `${cleaned.slice(0, 5)} ${cleaned.slice(5, 8)} ${cleaned.slice(8)}`;
  }
  
  return phoneNumber;
};

// Account ID formatter (for privacy)
export const formatAccountId = (accountId, showFull = false) => {
  if (!accountId) return '';
  
  if (showFull) {
    return accountId;
  }
  
  // Show only last 4 characters
  if (accountId.length > 4) {
    return '***' + accountId.slice(-4);
  }
  
  return accountId;
};

// Status formatter with color coding
export const formatStatus = (status) => {
  if (!status) return { text: 'Unknown', color: 'gray' };
  
  const statusLower = status.toLowerCase();
  
  const statusMap = {
    'active': { text: 'Active', color: 'green' },
    'inactive': { text: 'Inactive', color: 'gray' },
    'pending': { text: 'Pending', color: 'yellow' },
    'resolved': { text: 'Resolved', color: 'green' },
    'open': { text: 'Open', color: 'blue' },
    'closed': { text: 'Closed', color: 'gray' },
    'overdue': { text: 'Overdue', color: 'red' },
    'current': { text: 'Current', color: 'green' },
    'arrears': { text: 'In Arrears', color: 'red' },
    'liquidated': { text: 'Liquidated', color: 'purple' },
    'approved': { text: 'Approved', color: 'green' },
    'rejected': { text: 'Rejected', color: 'red' },
    'processing': { text: 'Processing', color: 'blue' }
  };
  
  return statusMap[statusLower] || { text: status, color: 'gray' };
};

// Trend formatter (up/down with percentage)
export const formatTrend = (currentValue, previousValue) => {
  if (previousValue === 0 || previousValue === null || previousValue === undefined) {
    return { direction: 'neutral', percentage: 0, text: 'No change' };
  }
  
  const change = currentValue - previousValue;
  const percentage = (change / previousValue) * 100;
  
  if (Math.abs(percentage) < 0.01) {
    return { direction: 'neutral', percentage: 0, text: 'No change' };
  }
  
  const direction = change > 0 ? 'up' : 'down';
  const text = `${Math.abs(percentage).toFixed(1)}% ${direction}`;
  
  return { direction, percentage: Math.abs(percentage), text };
};

// Risk level formatter
export const formatRiskLevel = (score) => {
  if (score === null || score === undefined) {
    return { level: 'Unknown', color: 'gray', text: 'Unknown Risk' };
  }
  
  if (score >= 80) {
    return { level: 'High', color: 'red', text: 'High Risk' };
  } else if (score >= 60) {
    return { level: 'Medium', color: 'yellow', text: 'Medium Risk' };
  } else if (score >= 40) {
    return { level: 'Low', color: 'blue', text: 'Low Risk' };
  } else {
    return { level: 'Very Low', color: 'green', text: 'Very Low Risk' };
  }
};

// Compact number formatter for charts
export const formatChartNumber = (value) => {
  if (Math.abs(value) >= 1000000) {
    return formatLargeNumber(value);
  }
  return formatNumber(value);
};

// Table cell formatter based on data type
export const formatTableCell = (value, type, options = {}) => {
  switch (type) {
    case 'currency':
      return formatCurrency(value, options);
    case 'percentage':
      return formatPercentage(value, options);
    case 'number':
      return formatNumber(value, options);
    case 'date':
      return formatDate(value, options.format);
    case 'time':
      return formatTime(value);
    case 'duration':
      return formatDuration(value);
    case 'fileSize':
      return formatFileSize(value);
    case 'phone':
      return formatPhoneNumber(value);
    case 'accountId':
      return formatAccountId(value, options.showFull);
    case 'status':
      return formatStatus(value);
    default:
      return value?.toString() || '';
  }
};

// Export utility object with all formatters
export default {
  currency: formatCurrency,
  percentage: formatPercentage,
  number: formatNumber,
  largeNumber: formatLargeNumber,
  time: formatTime,
  duration: formatDuration,
  date: formatDate,
  relativeDate: formatRelativeDate,
  fileSize: formatFileSize,
  phoneNumber: formatPhoneNumber,
  accountId: formatAccountId,
  status: formatStatus,
  trend: formatTrend,
  riskLevel: formatRiskLevel,
  chartNumber: formatChartNumber,
  tableCell: formatTableCell
}; 
