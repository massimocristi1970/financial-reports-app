// src/services/dataService.js
import { openDB } from 'idb';
import { csvProcessor } from '../utils/csvProcessor';
import { indexedDBHelper } from '../utils/indexedDBHelper';
import { REPORT_TYPES, API_ENDPOINTS } from '../utils/constants';

class DataService {
  constructor() {
    this.dbName = 'FinancialReportsDB';
    this.dbVersion = 1;
    this.cache = new Map();
    this.cacheExpiry = 5 * 60 * 1000; // 5 minutes
  }

  // Initialize the service
  async initialize() {
    try {
      await this.initializeDatabase();
      await this.loadInitialData();
      return { success: true };
    } catch (error) {
      console.error('DataService initialization failed:', error);
      return { success: false, error: error.message };
    }
  }

  // Database initialization
  async initializeDatabase() {
    return await indexedDBHelper.initDB();
  }

  // Load initial sample data if no data exists
  async loadInitialData() {
    const hasData = await this.hasExistingData();
    if (!hasData) {
      await this.loadSampleData();
    }
  }

  // Check if database has existing data
  async hasExistingData() {
    try {
      for (const reportType of Object.values(REPORT_TYPES)) {
        const data = await indexedDBHelper.getData(reportType);
        if (data && data.length > 0) {
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('Error checking existing data:', error);
      return false;
    }
  }

  // Load sample data from public/data directory
  async loadSampleData() {
    const promises = Object.values(REPORT_TYPES).map(async (reportType) => {
      try {
        const response = await fetch(`/data/${reportType}.json`);
        if (response.ok) {
          const data = await response.json();
          await this.saveData(reportType, data);
        }
      } catch (error) {
        console.warn(`Could not load sample data for ${reportType}:`, error);
      }
    });

    await Promise.allSettled(promises);
  }

  // Get data with caching
  async getData(reportType, options = {}) {
    const cacheKey = `${reportType}_${JSON.stringify(options)}`;
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheExpiry) {
        return cached.data;
      }
    }

    try {
      let data = await indexedDBHelper.getData(reportType);
      
      // Apply filters if provided
      if (options.filters) {
        data = this.applyFilters(data, options.filters);
      }

      // Apply sorting if provided
      if (options.sort) {
        data = this.applySorting(data, options.sort);
      }

      // Apply pagination if provided
      if (options.pagination) {
        data = this.applyPagination(data, options.pagination);
      }

      // Cache the result
      this.cache.set(cacheKey, {
        data,
        timestamp: Date.now()
      });

      return data;
    } catch (error) {
      console.error(`Error getting data for ${reportType}:`, error);
      throw new Error(`Failed to retrieve ${reportType} data`);
    }
  }

  // Save data to IndexedDB
  async saveData(reportType, data) {
    try {
      // Validate data structure
      if (!Array.isArray(data)) {
        throw new Error('Data must be an array');
      }

      await indexedDBHelper.saveData(reportType, data);
      
      // Clear related cache entries
      this.clearCacheForReportType(reportType);
      
      return { success: true, recordCount: data.length };
    } catch (error) {
      console.error(`Error saving data for ${reportType}:`, error);
      throw new Error(`Failed to save ${reportType} data: ${error.message}`);
    }
  }

  // Update specific records
  async updateRecords(reportType, updates) {
    try {
      const currentData = await indexedDBHelper.getData(reportType);
      const updatedData = currentData.map(record => {
        const update = updates.find(u => u.id === record.id);
        return update ? { ...record, ...update } : record;
      });

      await this.saveData(reportType, updatedData);
      return { success: true, updatedCount: updates.length };
    } catch (error) {
      console.error(`Error updating records for ${reportType}:`, error);
      throw new Error(`Failed to update ${reportType} records`);
    }
  }

  // Delete records
  async deleteRecords(reportType, recordIds) {
    try {
      const currentData = await indexedDBHelper.getData(reportType);
      const filteredData = currentData.filter(record => !recordIds.includes(record.id));
      
      await this.saveData(reportType, filteredData);
      return { success: true, deletedCount: recordIds.length };
    } catch (error) {
      console.error(`Error deleting records for ${reportType}:`, error);
      throw new Error(`Failed to delete ${reportType} records`);
    }
  }

  // Process CSV file upload
  async processCSVUpload(file, reportType, options = {}) {
    try {
      const processedData = await csvProcessor.processFile(file, {
        reportType,
        ...options
      });

      if (processedData.errors.length > 0) {
        return {
          success: false,
          errors: processedData.errors,
          validRecords: processedData.validData.length,
          totalRecords: processedData.totalRecords
        };
      }

      // Save processed data
      await this.saveData(reportType, processedData.validData);

      return {
        success: true,
        recordCount: processedData.validData.length,
        totalRecords: processedData.totalRecords,
        skippedRecords: processedData.skippedRecords
      };
    } catch (error) {
      console.error('CSV processing error:', error);
      throw new Error(`Failed to process CSV file: ${error.message}`);
    }
  }

  // Get data statistics
  async getDataStatistics(reportType) {
    try {
      const data = await indexedDBHelper.getData(reportType);
      
      if (!data || data.length === 0) {
        return {
          recordCount: 0,
          lastUpdated: null,
          dateRange: null,
          isEmpty: true
        };
      }

      // Calculate statistics
      const recordCount = data.length;
      const dates = data.map(record => new Date(record.date || record.created_date)).filter(d => !isNaN(d));
      const dateRange = dates.length > 0 ? {
        earliest: new Date(Math.min(...dates)),
        latest: new Date(Math.max(...dates))
      } : null;

      return {
        recordCount,
        lastUpdated: new Date(),
        dateRange,
        isEmpty: false,
        sampleRecord: data[0]
      };
    } catch (error) {
      console.error(`Error getting statistics for ${reportType}:`, error);
      return {
        recordCount: 0,
        lastUpdated: null,
        dateRange: null,
        isEmpty: true,
        error: error.message
      };
    }
  }

  // Apply filters to data
  applyFilters(data, filters) {
    return data.filter(record => {
      // Date range filter
      if (filters.dateRange) {
        const recordDate = new Date(record.date || record.created_date);
        if (filters.dateRange.start && recordDate < new Date(filters.dateRange.start)) {
          return false;
        }
        if (filters.dateRange.end && recordDate > new Date(filters.dateRange.end)) {
          return false;
        }
      }

      // Product filter
      if (filters.products && filters.products.length > 0) {
        if (!filters.products.includes(record.product_type || record.product)) {
          return false;
        }
      }

      // Region filter
      if (filters.regions && filters.regions.length > 0) {
        if (!filters.regions.includes(record.region || record.location)) {
          return false;
        }
      }

      // Status filter
      if (filters.status && filters.status.length > 0) {
        if (!filters.status.includes(record.status)) {
          return false;
        }
      }

      // Amount range filter
      if (filters.amountRange) {
        const amount = parseFloat(record.amount || record.value || 0);
        if (filters.amountRange.min && amount < filters.amountRange.min) {
          return false;
        }
        if (filters.amountRange.max && amount > filters.amountRange.max) {
          return false;
        }
      }

      return true;
    });
  }

  // Apply sorting to data
  applySorting(data, sort) {
    return [...data].sort((a, b) => {
      const aValue = a[sort.field];
      const bValue = b[sort.field];
      
      if (aValue === bValue) return 0;
      
      const comparison = aValue < bValue ? -1 : 1;
      return sort.direction === 'desc' ? -comparison : comparison;
    });
  }

  // Apply pagination to data
  applyPagination(data, pagination) {
    const start = (pagination.page - 1) * pagination.limit;
    const end = start + pagination.limit;
    
    return {
      data: data.slice(start, end),
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total: data.length,
        totalPages: Math.ceil(data.length / pagination.limit)
      }
    };
  }

  // Clear cache for specific report type
  clearCacheForReportType(reportType) {
    const keysToDelete = [];
    for (const key of this.cache.keys()) {
      if (key.startsWith(reportType)) {
        keysToDelete.push(key);
      }
    }
    keysToDelete.forEach(key => this.cache.delete(key));
  }

  // Clear all cache
  clearCache() {
    this.cache.clear();
  }

  // Get cache statistics
  getCacheStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
      memoryUsage: JSON.stringify(Array.from(this.cache.values())).length
    };
  }

  // Bulk operations
  async bulkOperation(operations) {
    const results = [];
    
    for (const operation of operations) {
      try {
        let result;
        switch (operation.type) {
          case 'save':
            result = await this.saveData(operation.reportType, operation.data);
            break;
          case 'update':
            result = await this.updateRecords(operation.reportType, operation.updates);
            break;
          case 'delete':
            result = await this.deleteRecords(operation.reportType, operation.recordIds);
            break;
          default:
            result = { success: false, error: `Unknown operation type: ${operation.type}` };
        }
        
        results.push({
          operation: operation.type,
          reportType: operation.reportType,
          ...result
        });
      } catch (error) {
        results.push({
          operation: operation.type,
          reportType: operation.reportType,
          success: false,
          error: error.message
        });
      }
    }

    return results;
  }

  // Health check
  async healthCheck() {
    try {
      const dbStatus = await indexedDBHelper.isHealthy();
      const cacheStatus = this.cache.size >= 0;
      
      return {
        healthy: dbStatus && cacheStatus,
        database: dbStatus,
        cache: cacheStatus,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        healthy: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}

// Create and export singleton instance
const dataService = new DataService();
export default dataService; 
