// src/utils/dataManager.js
import { processCSV } from './csvProcessor';
import { 
  initDB, 
  saveData, 
  getData, 
  updateData, 
  getDataByDateRange,
  getDBStats,
  exportAllData 
} from './indexedDBHelper';
import { DB_CONFIG, SUCCESS_MESSAGES, ERROR_MESSAGES } from './constants';
import { REPORT_CONFIG } from '../config/reportConfig';

class DataManager {
  constructor() {
    this.isInitialized = false;
  }

  // Initialize the data manager
  async init() {
    if (this.isInitialized) return;
    
    try {
      await initDB();
      this.isInitialized = true;
    } catch (error) {
      throw new Error(`Failed to initialize data manager: ${error.message}`);
    }
  }

  // Upload and process CSV data
  async uploadData(file, reportType) {
    await this.init();
    
    try {
      // Process the CSV file
      const processingResult = await processCSV(file, reportType);
      
      if (!processingResult.success) {
        return {
          success: false,
          error: processingResult.error,
          errors: processingResult.errors,
          warnings: processingResult.warnings
        };
      }

      // Get the store name for this report type
      const storeName = this.getStoreName(reportType);
      
      // Save processed data to IndexedDB
      const saveResult = await updateData(storeName, processingResult.data);
      
      // Update metadata
      await this.updateMetadata(reportType, {
        lastUpdate: new Date().toISOString(),
        recordCount: processingResult.data.length,
        fileName: file.name,
        fileSize: file.size,
        stats: processingResult.stats
      });

      return {
        success: true,
        message: SUCCESS_MESSAGES.DATA_UPLOADED,
        data: processingResult.data,
        stats: processingResult.stats,
        saveResult,
        errors: processingResult.errors,
        warnings: processingResult.warnings
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Get data for a specific report with optional filters
  async getReportData(reportType, filters = {}) {
    await this.init();
    
    try {
      const storeName = this.getStoreName(reportType);
      
      // If date range filter is specified, use optimized date range query
      if (filters.dateRange && filters.dateRange.start && filters.dateRange.end) {
        const data = await getDataByDateRange(
          storeName, 
          filters.dateRange.start, 
          filters.dateRange.end
        );
        
        // Apply remaining filters
        const otherFilters = { ...filters };
        delete otherFilters.dateRange;
        
        return this.applyAdditionalFilters(data, otherFilters);
      }
      
      // Get all data with filters
      return await getData(storeName, filters);
      
    } catch (error) {
      throw new Error(`Failed to get report data: ${error.message}`);
    }
  }

  // Get aggregated data for KPIs
  async getKPIData(reportType, dateRange = null) {
    await this.init();
    
    try {
      const filters = dateRange ? { dateRange } : {};
      const data = await this.getReportData(reportType, filters);
      
      return this.calculateKPIs(reportType, data);
      
    } catch (error) {
      throw new Error(`Failed to calculate KPIs: ${error.message}`);
    }
  }

  // Get chart data for a specific chart
  async getChartData(reportType, chartType, filters = {}) {
    await this.init();
    
    try {
      const data = await this.getReportData(reportType, filters);
      return this.prepareChartData(reportType, chartType, data);
      
    } catch (error) {
      throw new Error(`Failed to get chart data: ${error.message}`);
    }
  }

  // Calculate KPIs based on report type
  calculateKPIs(reportType, data) {
    const config = REPORT_CONFIG[reportType];
    const kpis = {};

    switch (reportType) {
      case 'lending-volume':
        kpis.total_volume = data.reduce((sum, record) => sum + (record.amount || 0), 0);
        kpis.loan_count = data.length;
        kpis.avg_loan_size = kpis.loan_count > 0 ? kpis.total_volume / kpis.loan_count : 0;
        kpis.growth_rate = this.calculateGrowthRate(data, 'amount');
        break;

      case 'arrears':
        kpis.total_arrears = data.reduce((sum, record) => sum + (record.arrears_amount || 0), 0);
        kpis.account_count = new Set(data.map(r => r.account_id)).size;
        kpis.avg_days_overdue = data.length > 0 ? 
          data.reduce((sum, record) => sum + (record.days_overdue || 0), 0) / data.length : 0;
        kpis.arrears_rate = this.calculateArrearsRate(data);
        break;

      case 'liquidations':
        kpis.total_liquidations = data.reduce((sum, record) => sum + (record.liquidation_amount || 0), 0);
        kpis.liquidation_count = data.length;
        kpis.avg_recovery_rate = data.length > 0 ?
          data.reduce((sum, record) => sum + (record.recovery_rate || 0), 0) / data.length : 0;
        kpis.avg_time_to_liquidation = data.length > 0 ?
          data.reduce((sum, record) => sum + (record.time_to_liquidation || 0), 0) / data.length : 0;
        break;

      case 'call-center':
        kpis.call_volume = data.reduce((sum, record) => sum + (record.calls_received || 0), 0);
        kpis.service_level = this.calculateServiceLevel(data);
        kpis.avg_wait_time = data.length > 0 ?
          data.reduce((sum, record) => sum + (record.avg_wait_time || 0), 0) / data.length : 0;
        kpis.first_call_resolution = data.length > 0 ?
          data.reduce((sum, record) => sum + (record.first_call_resolution || 0), 0) / data.length : 0;
        break;

      case 'complaints':
        kpis.total_complaints = data.length;
        kpis.avg_resolution_time = data.length > 0 ?
          data.reduce((sum, record) => sum + (record.resolution_time || 0), 0) / data.length : 0;
        kpis.resolution_rate = this.calculateResolutionRate(data);
        kpis.complaints_per_1000 = this.calculateComplaintsPerThousand(data);
        break;

      default:
        break;
    }

    return kpis;
  }

  // Prepare data for charts
  prepareChartData(reportType, chartType, data) {
    switch (chartType) {
      case 'trend':
        return this.prepareTrendData(data);
      
      case 'product_breakdown':
        return this.prepareGroupedData(data, 'product_type', 'amount');
      
      case 'regional_distribution':
        return this.prepareGroupedData(data, 'region', 'amount');
      
      case 'arrears_trend':
        return this.prepareTrendData(data, 'arrears_amount');
      
      case 'aging_analysis':
        return this.prepareGroupedData(data, 'days_overdue_bucket', 'arrears_amount');
      
      case 'complaint_trend':
        return this.prepareComplaintTrend(data);
      
      case 'type_breakdown':
        return this.prepareGroupedData(data, 'complaint_type');
      
      default:
        return this.prepareTrendData(data);
    }
  }

  // Helper functions for chart data preparation
  prepareTrendData(data, valueField = 'amount') {
    const groupedByDate = data.reduce((acc, record) => {
      const date = record.date;
      if (!acc[date]) {
        acc[date] = 0;
      }
      acc[date] += record[valueField] || 0;
      return acc;
    }, {});

    const sortedDates = Object.keys(groupedByDate).sort();
    
    return {
      labels: sortedDates,
      datasets: [{
        label: valueField,
        data: sortedDates.map(date => groupedByDate[date]),
        borderColor: 'rgb(37, 99, 235)',
        backgroundColor: 'rgba(37, 99, 235, 0.1)',
        tension: 0.1
      }]
    };
  }

  prepareGroupedData(data, groupField, valueField = null) {
    const grouped = data.reduce((acc, record) => {
      const key = record[groupField] || 'Unknown';
      if (!acc[key]) {
        acc[key] = valueField ? 0 : 0;
      }
      acc[key] += valueField ? (record[valueField] || 0) : 1;
      return acc;
    }, {});

    return {
      labels: Object.keys(grouped),
      datasets: [{
        data: Object.values(grouped),
        backgroundColor: [
          '#2563eb', '#7c3aed', '#059669', '#ea580c', '#dc2626',
          '#0891b2', '#64748b', '#f59e0b', '#8b5cf6', '#06b6d4'
        ]
      }]
    };
  }

  prepareComplaintTrend(data) {
    const dailyCounts = data.reduce((acc, record) => {
      const date = record.date;
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {});

    const sortedDates = Object.keys(dailyCounts).sort();
    
    return {
      labels: sortedDates,
      datasets: [{
        label: 'Daily Complaints',
        data: sortedDates.map(date => dailyCounts[date]),
        borderColor: 'rgb(234, 88, 12)',
        backgroundColor: 'rgba(234, 88, 12, 0.1)',
        tension: 0.1
      }]
    };
  }

  // Helper calculation functions
  calculateGrowthRate(data, field) {
    // Calculate month-over-month growth rate
    if (data.length < 2) return 0;
    
    const sortedData = data.sort((a, b) => new Date(a.date) - new Date(b.date));
    const currentMonth = sortedData[sortedData.length - 1][field] || 0;
    const previousMonth = sortedData[sortedData.length - 2][field] || 0;
    
    return previousMonth > 0 ? ((currentMonth - previousMonth) / previousMonth) * 100 : 0;
  }

  calculateArrearsRate(data) {
    // This would need total loan portfolio data to calculate properly
    // For now, return a placeholder calculation
    return data.length > 0 ? (data.length / 1000) * 100 : 0;
  }

  calculateServiceLevel(data) {
    if (data.length === 0) return 0;
    
    const totalReceived = data.reduce((sum, record) => sum + (record.calls_received || 0), 0);
    const totalAnswered = data.reduce((sum, record) => sum + (record.calls_answered || 0), 0);
    
    return totalReceived > 0 ? (totalAnswered / totalReceived) * 100 : 0;
  }

  calculateResolutionRate(data) {
    if (data.length === 0) return 0;
    
    const resolvedCount = data.filter(record => 
      record.status && record.status.toLowerCase().includes('resolved')
    ).length;
    
    return (resolvedCount / data.length) * 100;
  }

  calculateComplaintsPerThousand(data) {
    // This would need customer base data to calculate properly
    // For now, return a placeholder calculation
    return data.length > 0 ? (data.length / 10000) * 1000 : 0;
  }

  // Utility functions
  getStoreName(reportType) {
    const storeMapping = {
      'lending-volume': DB_CONFIG.STORES.LENDING,
      'arrears': DB_CONFIG.STORES.ARREARS,
      'liquidations': DB_CONFIG.STORES.LIQUIDATIONS,
      'call-center': DB_CONFIG.STORES.CALL_CENTER,
      'complaints': DB_CONFIG.STORES.COMPLAINTS
    };
    
    return storeMapping[reportType];
  }

  applyAdditionalFilters(data, filters) {
    return data.filter(record => {
      return Object.entries(filters).every(([field, value]) => {
        if (value === null || value === undefined || value === 'all') {
          return true;
        }
        return record[field] === value;
      });
    });
  }

  async updateMetadata(reportType, metadata) {
    try {
      const existing = await getData(DB_CONFIG.STORES.METADATA, { reportType });
      const metadataRecord = {
        _id: `metadata_${reportType}`,
        reportType,
        ...metadata,
        updatedAt: new Date().toISOString()
      };
      
      await updateData(DB_CONFIG.STORES.METADATA, [metadataRecord]);
    } catch (error) {
      console.warn('Failed to update metadata:', error);
    }
  }

  // Get all stats for dashboard overview
  async getDashboardStats() {
    await this.init();
    
    try {
      const dbStats = await getDBStats();
      const metadata = await getData(DB_CONFIG.STORES.METADATA);
      
      return {
        database: dbStats,
        metadata: metadata.reduce((acc, record) => {
          acc[record.reportType] = record;
          return acc;
        }, {})
      };
    } catch (error) {
      throw new Error(`Failed to get dashboard stats: ${error.message}`);
    }
  }

  // Export all data
  async exportData() {
    await this.init();
    return await exportAllData();
  }
}

// Create singleton instance
const dataManager = new DataManager();

export default dataManager; 
