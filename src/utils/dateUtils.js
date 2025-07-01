// src/utils/dateUtils.js
import { DATE_PRESETS } from './constants';

// Get date range based on preset
export const getDateRangeFromPreset = (preset) => {
  const today = new Date();
  const endDate = new Date(today);
  let startDate = new Date(today);

  switch (preset) {
    case 'last_7_days':
      startDate.setDate(today.getDate() - 7);
      break;
    case 'last_30_days':
      startDate.setDate(today.getDate() - 30);
      break;
    case 'last_90_days':
      startDate.setDate(today.getDate() - 90);
      break;
    case 'last_6_months':
      startDate.setMonth(today.getMonth() - 6);
      break;
    case 'last_year':
      startDate.setFullYear(today.getFullYear() - 1);
      break;
    case 'year_to_date':
      startDate = new Date(today.getFullYear(), 0, 1);
      break;
    case 'current_month':
      startDate = new Date(today.getFullYear(), today.getMonth(), 1);
      break;
    case 'previous_month':
      startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      endDate = new Date(today.getFullYear(), today.getMonth(), 0);
      break;
    default:
      startDate.setDate(today.getDate() - 30);
  }

  return {
    start: formatDateForInput(startDate),
    end: formatDateForInput(endDate)
  };
};

// Format date for HTML input (YYYY-MM-DD)
export const formatDateForInput = (date) => {
  if (!date) return '';
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toISOString().split('T')[0];
};

// Parse date from various formats
export const parseDate = (dateString) => {
  if (!dateString) return null;
  
  // Try different date formats
  const formats = [
    // ISO format
    /^(\d{4})-(\d{2})-(\d{2})$/,
    // UK format DD/MM/YYYY
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/,
    // US format MM/DD/YYYY
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/,
    // DD-MM-YYYY
    /^(\d{1,2})-(\d{1,2})-(\d{4})$/
  ];

  // Try ISO format first
  if (formats[0].test(dateString)) {
    return new Date(dateString);
  }

  // Try DD/MM/YYYY format
  const ukMatch = dateString.match(formats[1]);
  if (ukMatch) {
    const [, day, month, year] = ukMatch;
    return new Date(year, month - 1, day);
  }

  // Try DD-MM-YYYY format
  const dashMatch = dateString.match(formats[3]);
  if (dashMatch) {
    const [, day, month, year] = dashMatch;
    return new Date(year, month - 1, day);
  }

  // Fallback to standard Date parsing
  const parsed = new Date(dateString);
  return isNaN(parsed.getTime()) ? null : parsed;
};

// Check if date is valid
export const isValidDate = (date) => {
  const dateObj = typeof date === 'string' ? parseDate(date) : date;
  return dateObj instanceof Date && !isNaN(dateObj.getTime());
};

// Get date range for chart grouping
export const getChartDateRange = (data, groupBy = 'day') => {
  if (!data || data.length === 0) return [];

  const dates = data
    .map(item => item.date)
    .filter(date => date)
    .map(date => new Date(date))
    .sort((a, b) => a - b);

  if (dates.length === 0) return [];

  const startDate = dates[0];
  const endDate = dates[dates.length - 1];
  const dateRange = [];

  let currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    switch (groupBy) {
      case 'day':
        dateRange.push(new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + 1);
        break;
      case 'week':
        dateRange.push(new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + 7);
        break;
      case 'month':
        dateRange.push(new Date(currentDate));
        currentDate.setMonth(currentDate.getMonth() + 1);
        break;
      case 'quarter':
        dateRange.push(new Date(currentDate));
        currentDate.setMonth(currentDate.getMonth() + 3);
        break;
      case 'year':
        dateRange.push(new Date(currentDate));
        currentDate.setFullYear(currentDate.getFullYear() + 1);
        break;
      default:
        dateRange.push(new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + 1);
    }
  }

  return dateRange;
};

// Group data by date periods
export const groupDataByDatePeriod = (data, period = 'day') => {
  const grouped = {};

  data.forEach(item => {
    if (!item.date) return;

    const date = new Date(item.date);
    let key;

    switch (period) {
      case 'day':
        key = date.toISOString().split('T')[0];
        break;
      case 'week':
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toISOString().split('T')[0];
        break;
      case 'month':
        key = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
        break;
      case 'quarter':
        const quarter = Math.floor(date.getMonth() / 3) + 1;
        key = `${date.getFullYear()}-Q${quarter}`;
        break;
      case 'year':
        key = date.getFullYear().toString();
        break;
      default:
        key = date.toISOString().split('T')[0];
    }

    if (!grouped[key]) {
      grouped[key] = [];
    }
    grouped[key].push(item);
  });

  return grouped;
};

// Calculate business days between dates
export const getBusinessDaysBetween = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  let businessDays = 0;

  const currentDate = new Date(start);
  while (currentDate <= end) {
    const dayOfWeek = currentDate.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Not Sunday (0) or Saturday (6)
      businessDays++;
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return businessDays;
};

// Check if date is weekend
export const isWeekend = (date) => {
  const dayOfWeek = new Date(date).getDay();
  return dayOfWeek === 0 || dayOfWeek === 6;
};

// Get quarter from date
export const getQuarter = (date) => {
  const month = new Date(date).getMonth();
  return Math.floor(month / 3) + 1;
};

// Get week number of year
export const getWeekNumber = (date) => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
};

// Get fiscal year (assuming April to March)
export const getFiscalYear = (date, fiscalYearStart = 4) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = d.getMonth() + 1;
  
  return month >= fiscalYearStart ? year : year - 1;
};

// Generate date labels for charts
export const generateDateLabels = (startDate, endDate, period = 'day') => {
  const labels = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  let current = new Date(start);
  
  while (current <= end) {
    switch (period) {
      case 'day':
        labels.push(current.toISOString().split('T')[0]);
        current.setDate(current.getDate() + 1);
        break;
      case 'week':
        labels.push(`Week ${getWeekNumber(current)}, ${current.getFullYear()}`);
        current.setDate(current.getDate() + 7);
        break;
      case 'month':
        labels.push(`${current.getFullYear()}-${(current.getMonth() + 1).toString().padStart(2, '0')}`);
        current.setMonth(current.getMonth() + 1);
        break;
      case 'quarter':
        labels.push(`Q${getQuarter(current)} ${current.getFullYear()}`);
        current.setMonth(current.getMonth() + 3);
        break;
      case 'year':
        labels.push(current.getFullYear().toString());
        current.setFullYear(current.getFullYear() + 1);
        break;
      default:
        labels.push(current.toISOString().split('T')[0]);
        current.setDate(current.getDate() + 1);
    }
  }
  
  return labels;
};

// Calculate date difference in various units
export const getDateDifference = (startDate, endDate, unit = 'days') => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffMs = end.getTime() - start.getTime();
  
  switch (unit) {
    case 'milliseconds':
      return diffMs;
    case 'seconds':
      return Math.floor(diffMs / 1000);
    case 'minutes':
      return Math.floor(diffMs / (1000 * 60));
    case 'hours':
      return Math.floor(diffMs / (1000 * 60 * 60));
    case 'days':
      return Math.floor(diffMs / (1000 * 60 * 60 * 24));
    case 'weeks':
      return Math.floor(diffMs / (1000 * 60 * 60 * 24 * 7));
    case 'months':
      return (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
    case 'years':
      return end.getFullYear() - start.getFullYear();
    default:
      return Math.floor(diffMs / (1000 * 60 * 60 * 24));
  }
};

// Get start and end of period
export const getPeriodBounds = (date, period = 'month') => {
  const d = new Date(date);
  let start, end;
  
  switch (period) {
    case 'day':
      start = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      end = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);
      break;
    case 'week':
      start = new Date(d.getFullYear(), d.getMonth(), d.getDate() - d.getDay());
      end = new Date(d.getFullYear(), d.getMonth(), d.getDate() - d.getDay() + 7);
      break;
    case 'month':
      start = new Date(d.getFullYear(), d.getMonth(), 1);
      end = new Date(d.getFullYear(), d.getMonth() + 1, 1);
      break;
    case 'quarter':
      const quarter = getQuarter(d);
      const quarterStart = (quarter - 1) * 3;
      start = new Date(d.getFullYear(), quarterStart, 1);
      end = new Date(d.getFullYear(), quarterStart + 3, 1);
      break;
    case 'year':
      start = new Date(d.getFullYear(), 0, 1);
      end = new Date(d.getFullYear() + 1, 0, 1);
      break;
    default:
      start = new Date(d.getFullYear(), d.getMonth(), 1);
      end = new Date(d.getFullYear(), d.getMonth() + 1, 1);
  }
  
  return { start, end };
};

// Additional exports for compatibility
export const formatDate = (date, format = 'DD/MM/YYYY') => {
  if (!date) return '';
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(dateObj.getTime())) return '';
  
  const day = dateObj.getDate().toString().padStart(2, '0');
  const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
  const year = dateObj.getFullYear();
  
  return format === 'YYYY-MM-DD' ? `${year}-${month}-${day}` : `${day}/${month}/${year}`;
};

export const isWithinDateRange = (date, start, end) => {
  const d = new Date(date);
  const startDate = new Date(start);
  const endDate = new Date(end);
  return d >= startDate && d <= endDate;
};

// Export all utilities
export default {
  getDateRangeFromPreset,
  formatDateForInput,
  parseDate,
  isValidDate,
  getChartDateRange,
  groupDataByDatePeriod,
  getBusinessDaysBetween,
  isWeekend,
  getQuarter,
  getWeekNumber,
  getFiscalYear,
  generateDateLabels,
  getDateDifference,
  getPeriodBounds
};
