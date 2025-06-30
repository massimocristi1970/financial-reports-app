import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import useData from '../hooks/useData';
import { REPORT_TYPES } from '../utils/constants';

// Initial state
const initialState = {
  reports: {
    'lending-volume': { data: [], loading: false, error: null, lastUpdated: null },
    'arrears': { data: [], loading: false, error: null, lastUpdated: null },
    'liquidations': { data: [], loading: false, error: null, lastUpdated: null },
    'call-center': { data: [], loading: false, error: null, lastUpdated: null },
    'complaints': { data: [], loading: false, error: null, lastUpdated: null }
  },
  activeReport: 'lending-volume',
  globalLoading: false,
  syncStatus: 'idle', // idle, syncing, success, error
  lastGlobalSync: null,
  dataStats: {
    totalRecords: 0,
    totalReports: 0,
    oldestRecord: null,
    newestRecord: null,
    storageUsed: 0
  }
};

// Action types
const DATA_ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  SET_DATA: 'SET_DATA',
  SET_ERROR: 'SET_ERROR',
  SET_ACTIVE_REPORT: 'SET_ACTIVE_REPORT',
  UPDATE_RECORD: 'UPDATE_RECORD',
  DELETE_RECORD: 'DELETE_RECORD',
  CLEAR_REPORT: 'CLEAR_REPORT',
  SET_GLOBAL_LOADING: 'SET_GLOBAL_LOADING',
  SET_SYNC_STATUS: 'SET_SYNC_STATUS',
  UPDATE_STATS: 'UPDATE_STATS',
  RESET_STATE: 'RESET_STATE'
};

// Reducer function
const dataReducer = (state, action) => {
  switch (action.type) {
    case DATA_ACTIONS.SET_LOADING:
      return {
        ...state,
        reports: {
          ...state.reports,
          [action.reportType]: {
            ...state.reports[action.reportType],
            loading: action.loading
          }
        }
      };

    case DATA_ACTIONS.SET_DATA:
      return {
        ...state,
        reports: {
          ...state.reports,
          [action.reportType]: {
            ...state.reports[action.reportType],
            data: action.data,
            loading: false,
            error: null,
            lastUpdated: action.timestamp || Date.now()
          }
        }
      };

    case DATA_ACTIONS.SET_ERROR:
      return {
        ...state,
        reports: {
          ...state.reports,
          [action.reportType]: {
            ...state.reports[action.reportType],
            error: action.error,
            loading: false
          }
        }
      };

    case DATA_ACTIONS.SET_ACTIVE_REPORT:
      return {
        ...state,
        activeReport: action.reportType
      };

    case DATA_ACTIONS.UPDATE_RECORD:
      return {
        ...state,
        reports: {
          ...state.reports,
          [action.reportType]: {
            ...state.reports[action.reportType],
            data: state.reports[action.reportType].data.map(record =>
              record.id === action.record.id ? { ...record, ...action.record } : record
            ),
            lastUpdated: Date.now()
          }
        }
      };

    case DATA_ACTIONS.DELETE_RECORD:
      return {
        ...state,
        reports: {
          ...state.reports,
          [action.reportType]: {
            ...state.reports[action.reportType],
            data: state.reports[action.reportType].data.filter(record =>
              !action.recordIds.includes(record.id)
            ),
            lastUpdated: Date.now()
          }
        }
      };

    case DATA_ACTIONS.CLEAR_REPORT:
      return {
        ...state,
        reports: {
          ...state.reports,
          [action.reportType]: {
            data: [],
            loading: false,
            error: null,
            lastUpdated: Date.now()
          }
        }
      };

    case DATA_ACTIONS.SET_GLOBAL_LOADING:
      return {
        ...state,
        globalLoading: action.loading
      };

    case DATA_ACTIONS.SET_SYNC_STATUS:
      return {
        ...state,
        syncStatus: action.status,
        lastGlobalSync: action.status === 'success' ? Date.now() : state.lastGlobalSync
      };

    case DATA_ACTIONS.UPDATE_STATS:
      return {
        ...state,
        dataStats: {
          ...state.dataStats,
          ...action.stats
        }
      };

    case DATA_ACTIONS.RESET_STATE:
      return {
        ...initialState,
        activeReport: state.activeReport
      };

    default:
      return state;
  }
};

// Create context
const DataContext = createContext();

// Custom hook to use the DataContext
export const useDataContext = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useDataContext must be used within a DataProvider');
  }
  return context;
};

// DataProvider component
export const DataProvider = ({ children }) => {
  const [state, dispatch] = useReducer(dataReducer, initialState);

  // Hook instances for each report type
  const lendingHook = useData('lending-volume');
  const arrearsHook = useData('arrears');
  const liquidationsHook = useData('liquidations');
  const callCenterHook = useData('call-center');
  const complaintsHook = useData('complaints');

  // Map report types to their hooks
  const getHookForReport = useCallback((reportType) => {
    switch (reportType) {
      case 'lending-volume': return lendingHook;
      case 'arrears': return arrearsHook;
      case 'liquidations': return liquidationsHook;
      case 'call-center': return callCenterHook;
      case 'complaints': return complaintsHook;
      default: return lendingHook;
    }
  }, [lendingHook, arrearsHook, liquidationsHook, callCenterHook, complaintsHook]);

  // Sync individual report data with context
  const syncReportData = useCallback((reportType, hookData) => {
    if (hookData.data && hookData.data !== state.reports[reportType]?.data) {
      dispatch({
        type: DATA_ACTIONS.SET_DATA,
        reportType,
        data: hookData.data,
        timestamp: hookData.lastUpdated
      });
    }

    if (hookData.loading !== state.reports[reportType]?.loading) {
      dispatch({
        type: DATA_ACTIONS.SET_LOADING,
        reportType,
        loading: hookData.loading
      });
    }

    if (hookData.error !== state.reports[reportType]?.error) {
      dispatch({
        type: DATA_ACTIONS.SET_ERROR,
        reportType,
        error: hookData.error
      });
    }
  }, [state.reports]);

  // Load data for a specific report
  const loadReport = useCallback(async (reportType, forceRefresh = false) => {
    const hook = getHookForReport(reportType);
    try {
      const data = await hook.fetchData(reportType, forceRefresh);
      return data;
    } catch (error) {
      dispatch({
        type: DATA_ACTIONS.SET_ERROR,
        reportType,
        error: error.message
      });
      return [];
    }
  }, [getHookForReport]);

  // Load all reports
  const loadAllReports = useCallback(async (forceRefresh = false) => {
    dispatch({ type: DATA_ACTIONS.SET_GLOBAL_LOADING, loading: true });
    dispatch({ type: DATA_ACTIONS.SET_SYNC_STATUS, status: 'syncing' });

    try {
      const promises = REPORT_TYPES.map(reportType => 
        loadReport(reportType, forceRefresh)
      );

      await Promise.allSettled(promises);
      
      dispatch({ type: DATA_ACTIONS.SET_SYNC_STATUS, status: 'success' });
    } catch (error) {
      dispatch({ type: DATA_ACTIONS.SET_SYNC_STATUS, status: 'error' });
    } finally {
      dispatch({ type: DATA_ACTIONS.SET_GLOBAL_LOADING, loading: false });
    }
  }, [loadReport]);

  // Upload data for a report
  const uploadReportData = useCallback(async (reportType, file) => {
    const hook = getHookForReport(reportType);
    try {
      const result = await hook.uploadData(file, reportType);
      if (result.success) {
        // Data will be synced automatically via useEffect
        return result;
      } else {
        dispatch({
          type: DATA_ACTIONS.SET_ERROR,
          reportType,
          error: result.error
        });
        return result;
      }
    } catch (error) {
      dispatch({
        type: DATA_ACTIONS.SET_ERROR,
        reportType,
        error: error.message
      });
      return { success: false, error: error.message };
    }
  }, [getHookForReport]);

  // Update record in a report
  const updateRecord = useCallback(async (reportType, record) => {
    const hook = getHookForReport(reportType);
    try {
      const updatedData = await hook.updateData(record, reportType);
      if (updatedData) {
        dispatch({
          type: DATA_ACTIONS.UPDATE_RECORD,
          reportType,
          record
        });
        return true;
      }
      return false;
    } catch (error) {
      dispatch({
        type: DATA_ACTIONS.SET_ERROR,
        reportType,
        error: error.message
      });
      return false;
    }
  }, [getHookForReport]);

  // Delete records from a report
  const deleteRecords = useCallback(async (reportType, recordIds) => {
    const hook = getHookForReport(reportType);
    try {
      const updatedData = await hook.deleteData(recordIds, reportType);
      if (updatedData) {
        dispatch({
          type: DATA_ACTIONS.DELETE_RECORD,
          reportType,
          recordIds: Array.isArray(recordIds) ? recordIds : [recordIds]
        });
        return true;
      }
      return false;
    } catch (error) {
      dispatch({
        type: DATA_ACTIONS.SET_ERROR,
        reportType,
        error: error.message
      });
      return false;
    }
  }, [getHookForReport]);

  // Clear all data for a report
  const clearReport = useCallback(async (reportType) => {
    const hook = getHookForReport(reportType);
    try {
      const result = await hook.clearReportData(reportType);
      if (result) {
        dispatch({
          type: DATA_ACTIONS.CLEAR_REPORT,
          reportType
        });
        return true;
      }
      return false;
    } catch (error) {
      dispatch({
        type: DATA_ACTIONS.SET_ERROR,
        reportType,
        error: error.message
      });
      return false;
    }
  }, [getHookForReport]);

  // Set active report
  const setActiveReport = useCallback((reportType) => {
    if (REPORT_TYPES.includes(reportType)) {
      dispatch({
        type: DATA_ACTIONS.SET_ACTIVE_REPORT,
        reportType
      });
    }
  }, []);

  // Get data statistics
  const calculateDataStats = useCallback(() => {
    const allData = Object.values(state.reports).reduce((acc, report) => {
      return acc.concat(report.data || []);
    }, []);

    if (allData.length === 0) {
      return {
        totalRecords: 0,
        totalReports: 0,
        oldestRecord: null,
        newestRecord: null,
        storageUsed: 0
      };
    }

    const dates = allData
      .map(record => new Date(record.date || record.created_date || record.timestamp))
      .filter(date => !isNaN(date.getTime()))
      .sort();

    const storageUsed = JSON.stringify(state.reports).length;

    return {
      totalRecords: allData.length,
      totalReports: Object.values(state.reports).filter(report => report.data.length > 0).length,
      oldestRecord: dates.length > 0 ? dates[0] : null,
      newestRecord: dates.length > 0 ? dates[dates.length - 1] : null,
      storageUsed
    };
  }, [state.reports]);

  // Get report summary
  const getReportSummary = useCallback((reportType) => {
    const report = state.reports[reportType];
    if (!report || !report.data) return null;

    const hook = getHookForReport(reportType);
    return hook.getDataStats();
  }, [state.reports, getHookForReport]);

  // Reset all data
  const resetAllData = useCallback(() => {
    dispatch({ type: DATA_ACTIONS.RESET_STATE });
  }, []);

  // Sync hook data with context state
  useEffect(() => {
    syncReportData('lending-volume', lendingHook);
  }, [lendingHook.data, lendingHook.loading, lendingHook.error, syncReportData]);

  useEffect(() => {
    syncReportData('arrears', arrearsHook);
  }, [arrearsHook.data, arrearsHook.loading, arrearsHook.error, syncReportData]);

  useEffect(() => {
    syncReportData('liquidations', liquidationsHook);
  }, [liquidationsHook.data, liquidationsHook.loading, liquidationsHook.error, syncReportData]);

  useEffect(() => {
    syncReportData('call-center', callCenterHook);
  }, [callCenterHook.data, callCenterHook.loading, callCenterHook.error, syncReportData]);

  useEffect(() => {
    syncReportData('complaints', complaintsHook);
  }, [complaintsHook.data, complaintsHook.loading, complaintsHook.error, syncReportData]);

  // Update data statistics
  useEffect(() => {
    const stats = calculateDataStats();
    dispatch({
      type: DATA_ACTIONS.UPDATE_STATS,
      stats
    });
  }, [calculateDataStats]);

  // Context value
  const contextValue = {
    // State
    reports: state.reports,
    activeReport: state.activeReport,
    globalLoading: state.globalLoading,
    syncStatus: state.syncStatus,
    lastGlobalSync: state.lastGlobalSync,
    dataStats: state.dataStats,

    // Actions
    loadReport,
    loadAllReports,
    uploadReportData,
    updateRecord,
    deleteRecords,
    clearReport,
    setActiveReport,
    resetAllData,

    // Utilities
    getReportSummary,
    calculateDataStats,

    // Getters
    getCurrentReportData: () => state.reports[state.activeReport]?.data || [],
    getCurrentReportLoading: () => state.reports[state.activeReport]?.loading || false,
    getCurrentReportError: () => state.reports[state.activeReport]?.error || null,
    isReportLoaded: (reportType) => (state.reports[reportType]?.data?.length || 0) > 0,
    hasAnyData: () => Object.values(state.reports).some(report => report.data.length > 0)
  };

  return (
    <DataContext.Provider value={contextValue}>
      {children}
    </DataContext.Provider>
  );
};

export default DataContext; 
