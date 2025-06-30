// src/utils/indexedDBHelper.js
import { DB_CONFIG, ERROR_MESSAGES } from './constants';

class IndexedDBHelper {
  constructor() {
    this.db = null;
    this.dbName = DB_CONFIG.NAME;
    this.dbVersion = DB_CONFIG.VERSION;
    this.stores = DB_CONFIG.STORES;
  }

  // Initialize database connection
  async init() {
    if (this.db) return this.db;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => {
        reject(new Error(`Failed to open database: ${request.error}`));
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        // Create object stores for each report type
        Object.values(this.stores).forEach(storeName => {
          if (!db.objectStoreNames.contains(storeName)) {
            const store = db.createObjectStore(storeName, { 
              keyPath: '_id',
              autoIncrement: false 
            });
            
            // Create indexes for common queries
            store.createIndex('date', 'date', { unique: false });
            store.createIndex('processed_date', '_processed_date', { unique: false });
            
            // Store-specific indexes
            if (storeName === this.stores.ARREARS) {
              store.createIndex('account_id', 'account_id', { unique: false });
              store.createIndex('days_overdue', 'days_overdue', { unique: false });
            }
            
            if (storeName === this.stores.LIQUIDATIONS) {
              store.createIndex('account_id', 'account_id', { unique: false });
              store.createIndex('recovery_rate', 'recovery_rate', { unique: false });
            }
            
            if (storeName === this.stores.COMPLAINTS) {
              store.createIndex('complaint_id', 'complaint_id', { unique: false });
              store.createIndex('complaint_type', 'complaint_type', { unique: false });
              store.createIndex('status', 'status', { unique: false });
            }
          }
        });
      };
    });
  }

  // Save data to a specific store
  async saveData(storeName, data) {
    await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      
      transaction.oncomplete = () => {
        resolve({ success: true, count: data.length });
      };
      
      transaction.onerror = () => {
        reject(new Error(`Failed to save data: ${transaction.error}`));
      };

      // Add each record
      data.forEach(record => {
        store.put(record);
      });
    });
  }

  // Get all data from a store
  async getData(storeName, filters = {}) {
    await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();
      
      request.onsuccess = () => {
        let data = request.result;
        
        // Apply filters
        if (Object.keys(filters).length > 0) {
          data = this.applyFilters(data, filters);
        }
        
        resolve(data);
      };
      
      request.onerror = () => {
        reject(new Error(`Failed to get data: ${request.error}`));
      };
    });
  }

  // Get data by date range
  async getDataByDateRange(storeName, startDate, endDate) {
    await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const index = store.index('date');
      
      const range = IDBKeyRange.bound(startDate, endDate);
      const request = index.getAll(range);
      
      request.onsuccess = () => {
        resolve(request.result);
      };
      
      request.onerror = () => {
        reject(new Error(`Failed to get data by date range: ${request.error}`));
      };
    });
  }

  // Update existing data (merge with existing records)
  async updateData(storeName, newData) {
    await this.init();
    
    // Get existing data
    const existingData = await this.getData(storeName);
    const existingIds = new Set(existingData.map(record => record._id));
    
    // Separate new records from updates
    const updates = [];
    const inserts = [];
    
    newData.forEach(record => {
      if (existingIds.has(record._id)) {
        updates.push(record);
      } else {
        inserts.push(record);
      }
    });
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      
      transaction.oncomplete = () => {
        resolve({ 
          success: true, 
          updated: updates.length, 
          inserted: inserts.length 
        });
      };
      
      transaction.onerror = () => {
        reject(new Error(`Failed to update data: ${transaction.error}`));
      };

      // Process all records
      [...updates, ...inserts].forEach(record => {
        store.put(record);
      });
    });
  }

  // Delete data by criteria
  async deleteData(storeName, criteria = {}) {
    await this.init();
    
    if (Object.keys(criteria).length === 0) {
      // Clear all data from store
      return this.clearStore(storeName);
    }
    
    // Get data matching criteria and delete
    const dataToDelete = await this.getData(storeName, criteria);
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      
      transaction.oncomplete = () => {
        resolve({ success: true, deleted: dataToDelete.length });
      };
      
      transaction.onerror = () => {
        reject(new Error(`Failed to delete data: ${transaction.error}`));
      };

      dataToDelete.forEach(record => {
        store.delete(record._id);
      });
    });
  }

  // Clear entire store
  async clearStore(storeName) {
    await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();
      
      request.onsuccess = () => {
        resolve({ success: true });
      };
      
      request.onerror = () => {
        reject(new Error(`Failed to clear store: ${request.error}`));
      };
    });
  }

  // Get database statistics
  async getStats() {
    await this.init();
    
    const stats = {};
    
    for (const [key, storeName] of Object.entries(this.stores)) {
      try {
        const data = await this.getData(storeName);
        stats[key] = {
          recordCount: data.length,
          lastUpdate: this.getLastUpdateDate(data),
          dateRange: this.getDateRange(data)
        };
      } catch (error) {
        stats[key] = { error: error.message };
      }
    }
    
    return stats;
  }

  // Export all data as JSON
  async exportAllData() {
    await this.init();
    
    const exportData = {};
    
    for (const [key, storeName] of Object.entries(this.stores)) {
      try {
        exportData[key] = await this.getData(storeName);
      } catch (error) {
        exportData[key] = { error: error.message };
      }
    }
    
    return {
      exported_at: new Date().toISOString(),
      database_version: this.dbVersion,
      data: exportData
    };
  }

  // Import data from JSON export
  async importData(exportData) {
    await this.init();
    
    const results = {};
    
    for (const [key, data] of Object.entries(exportData.data)) {
      if (data.error) {
        results[key] = { error: data.error };
        continue;
      }
      
      const storeName = this.stores[key];
      if (storeName && Array.isArray(data)) {
        try {
          const result = await this.saveData(storeName, data);
          results[key] = result;
        } catch (error) {
          results[key] = { error: error.message };
        }
      }
    }
    
    return results;
  }

  // Helper functions
  applyFilters(data, filters) {
    return data.filter(record => {
      return Object.entries(filters).every(([field, value]) => {
        if (value === null || value === undefined || value === 'all') {
          return true;
        }
        
        if (field === 'dateRange' && value.start && value.end) {
          const recordDate = new Date(record.date);
          return recordDate >= new Date(value.start) && recordDate <= new Date(value.end);
        }
        
        return record[field] === value;
      });
    });
  }

  getLastUpdateDate(data) {
    if (!data || data.length === 0) return null;
    
    const updateDates = data
      .map(record => record._processed_date)
      .filter(date => date)
      .sort()
      .reverse();
    
    return updateDates[0] || null;
  }

  getDateRange(data) {
    if (!data || data.length === 0) return null;
    
    const dates = data
      .map(record => record.date)
      .filter(date => date)
      .sort();
    
    return dates.length > 0 ? {
      earliest: dates[0],
      latest: dates[dates.length - 1]
    } : null;
  }

  // Close database connection
  close() {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}

// Create singleton instance
const dbHelper = new IndexedDBHelper();

// Export utility functions
export const initDB = () => dbHelper.init();
export const saveData = (storeName, data) => dbHelper.saveData(storeName, data);
export const getData = (storeName, filters) => dbHelper.getData(storeName, filters);
export const getDataByDateRange = (storeName, start, end) => dbHelper.getDataByDateRange(storeName, start, end);
export const updateData = (storeName, data) => dbHelper.updateData(storeName, data);
export const deleteData = (storeName, criteria) => dbHelper.deleteData(storeName, criteria);
export const clearStore = (storeName) => dbHelper.clearStore(storeName);
export const getDBStats = () => dbHelper.getStats();
export const exportAllData = () => dbHelper.exportAllData();
export const importData = (data) => dbHelper.importData(data);
export const closeDB = () => dbHelper.close();

export default dbHelper; 
