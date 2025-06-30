import { useState, useEffect, useCallback, useRef } from 'react';
import { loadData, saveData, clearData } from '../utils/indexedDBHelper';
import { processCSV, validateData } from '../utils/csvProcessor';
import { REPORT_TYPES, DATA_SOURCES } from '../utils/constants';

const useData = (reportType = null) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [cache, setCache] = useState(new Map());
  const abortControllerRef = useRef(null);

  // Data fetching with caching
  const fetchData = useCallback(async (type = reportType, forceRefresh = false) => {
    if (!type) return;

    const cacheKey = `${type}_${Date.now()}`;
    
    // Check cache first
    if (!forceRefresh && cache.has(type)) {
      const cachedData = cache.get(type);
      if (Date.now() - cachedData.timestamp < 5 * 60 * 1000) { // 5 minute cache
        setData(cachedData.data);
        setLastUpdated(cachedData.timestamp);
        return cachedData.data;
      }
    }

    setLoading(true);
    setError(null);

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    try {
      let result = [];

      // Try to load from IndexedDB first
      const cachedData = await loadData(type);
      if (cachedData && cachedData.length > 0 && !forceRefresh) {
        result = cachedData;
      } else {
        // Fallback to sample data or API
        const response = await fetch(`/data/${type}.json`, {
          signal: abortControllerRef.current.signal
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch ${type} data: ${response.statusText}`);
        }
        
        result = await response.json();
        
        // Save to IndexedDB for future use
        await saveData(type, result);
      }

      // Validate and process data
      const validatedData = validateData(result, type);
      
      // Update cache
      setCache(prev => new Map(prev).set(type, {
        data: validatedData,
        timestamp: Date.now()
      }));

      setData(validatedData);
      setLastUpdated(Date.now());
      setLoading(false);
      
      return validatedData;

    } catch (err) {
      if (err.name !== 'AbortError') {
        setError(err.message);
        setLoading(false);
      }
      return [];
    }
  }, [reportType, cache]);

  // Upload new data
  const uploadData = useCallback(async (file, type) => {
    setLoading(true);
    setError(null);

    try {
      const csvData = await processCSV(file);
      const validatedData = validateData(csvData, type);

      // Save to IndexedDB
      await saveData(type, validatedData);

      // Update cache
      setCache(prev => new Map(prev).set(type, {
        data: validatedData,
        timestamp: Date.now()
      }));

      if (type === reportType) {
        setData(validatedData);
        setLastUpdated(Date.now());
      }

      setLoading(false);
      return { success: true, recordCount: validatedData.length };

    } catch (err) {
      setError(`Upload failed: ${err.message}`);
      setLoading(false);
      return { success: false, error: err.message };
    }
  }, [reportType]);

  // Update specific records
  const updateData = useCallback(async (updates, type = reportType) => {
    if (!type || !updates) return;

    setLoading(true);
    try {
      const currentData = await loadData(type) || [];
      let updatedData;

      if (Array.isArray(updates)) {
        // Bulk update
        updatedData = [...currentData, ...updates];
      } else {
        // Single update
        const index = currentData.findIndex(item => item.id === updates.id);
        if (index >= 0) {
          updatedData = [...currentData];
          updatedData[index] = { ...updatedData[index], ...updates };
        } else {
          updatedData = [...currentData, updates];
        }
      }

      const validatedData = validateData(updatedData, type);
      await saveData(type, validatedData);

      // Update cache
      setCache(prev => new Map(prev).set(type, {
        data: validatedData,
        timestamp: Date.now()
      }));

      if (type === reportType) {
        setData(validatedData);
        setLastUpdated(Date.now());
      }

      setLoading(false);
      return validatedData;

    } catch (err) {
      setError(`Update failed: ${err.message}`);
      setLoading(false);
      return null;
    }
  }, [reportType]);

  // Delete data
  const deleteData = useCallback(async (ids, type = reportType) => {
    if (!type || !ids) return;

    setLoading(true);
    try {
      const currentData = await loadData(type) || [];
      const idsToDelete = Array.isArray(ids) ? ids : [ids];
      
      const filteredData = currentData.filter(item => !idsToDelete.includes(item.id));
      await saveData(type, filteredData);

      // Update cache
      setCache(prev => new Map(prev).set(type, {
        data: filteredData,
        timestamp: Date.now()
      }));

      if (type === reportType) {
        setData(filteredData);
        setLastUpdated(Date.now());
      }

      setLoading(false);
      return filteredData;

    } catch (err) {
      setError(`Delete failed: ${err.message}`);
      setLoading(false);
      return null;
    }
  }, [reportType]);

  // Clear all data for a report type
  const clearReportData = useCallback(async (type = reportType) => {
    if (!type) return;

    setLoading(true);
    try {
      await clearData(type);
      
      // Clear cache
      setCache(prev => {
        const newCache = new Map(prev);
        newCache.delete(type);
        return newCache;
      });

      if (type === reportType) {
        setData([]);
        setLastUpdated(Date.now());
      }

      setLoading(false);
      return true;

    } catch (err) {
      setError(`Clear failed: ${err.message}`);
      setLoading(false);
      return false;
    }
  }, [reportType]);

  // Get data statistics
  const getDataStats = useCallback(() => {
    if (!data || data.length === 0) {
      return {
        totalRecords: 0,
        dateRange: null,
        lastUpdated,
        memoryUsage: 0
      };
    }

    const dates = data
      .map(item => item.date || item.created_date || item.timestamp)
      .filter(Boolean)
      .map(date => new Date(date))
      .sort();

    return {
      totalRecords: data.length,
      dateRange: dates.length > 0 ? {
        start: dates[0],
        end: dates[dates.length - 1]
      } : null,
      lastUpdated,
      memoryUsage: JSON.stringify(data).length
    };
  }, [data, lastUpdated]);

  // Prefetch related data
  const prefetchData = useCallback(async (types) => {
    const typesToFetch = Array.isArray(types) ? types : [types];
    
    return Promise.allSettled(
      typesToFetch.map(type => fetchData(type))
    );
  }, [fetchData]);

  // Load initial data
  useEffect(() => {
    if (reportType) {
      fetchData(reportType);
    }

    // Cleanup function
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [reportType, fetchData]);

  // Auto-refresh data every 10 minutes
  useEffect(() => {
    if (!reportType) return;

    const interval = setInterval(() => {
      fetchData(reportType, true);
    }, 10 * 60 * 1000);

    return () => clearInterval(interval);
  }, [reportType, fetchData]);

  return {
    // Data state
    data,
    loading,
    error,
    lastUpdated,
    
    // Data operations
    fetchData,
    uploadData,
    updateData,
    deleteData,
    clearReportData,
    
    // Utilities
    getDataStats,
    prefetchData,
    
    // Cache management
    cache: cache.size,
    clearCache: () => setCache(new Map())
  };
};

export default useData; 
