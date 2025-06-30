import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import useFilters from '../hooks/useFilters';
import useLocalStorage from '../hooks/useLocalStorage';
import { useDataContext } from './DataContext';
import { FILTER_PRESETS } from '../utils/constants';

// Initial filter state
const initialFilterState = {
  globalFilters: {
    dateRange: { start: null, end: null, preset: 'all' },
    search: '',
    quickFilters: []
  },
  reportFilters: {
    'lending-volume': {},
    'arrears': {},
    'liquidations': {},
    'call-center': {},
    'complaints': {}
  },
  activeFilters: {
    count: 0,
    summary: []
  },
  savedFilterSets: new Map(),
  filterMode: 'individual', // 'individual' or 'global'
  autoApply: true,
  filterHistory: [],
  quickFilterOptions: {
    'lending-volume': ['high-volume', 'new-applications', 'approved-only'],
    'arrears': ['overdue-30', 'overdue-60', 'overdue-90', 'high-risk'],
    'liquidations': ['in-progress', 'completed', 'high-recovery'],
    'call-center': ['high-wait-time', 'low-satisfaction', 'peak-hours'],
    'complaints': ['unresolved', 'urgent', 'recent']
  }
};

// Action types
const FILTER_ACTIONS = {
  SET_GLOBAL_FILTER: 'SET_GLOBAL_FILTER',
  SET_REPORT_FILTER: 'SET_REPORT_FILTER',
  CLEAR_GLOBAL_FILTERS: 'CLEAR_GLOBAL_FILTERS',
  CLEAR_REPORT_FILTERS: 'CLEAR_REPORT_FILTERS',
  CLEAR_ALL_FILTERS: 'CLEAR_ALL_FILTERS',
  SET_FILTER_MODE: 'SET_FILTER_MODE',
  SET_AUTO_APPLY: 'SET_AUTO_APPLY',
  UPDATE_ACTIVE_COUNT: 'UPDATE_ACTIVE_COUNT',
  SAVE_FILTER_SET: 'SAVE_FILTER_SET',
  LOAD_FILTER_SET: 'LOAD_FILTER_SET',
  DELETE_FILTER_SET: 'DELETE_FILTER_SET',
  ADD_QUICK_FILTER: 'ADD_QUICK_FILTER',
  REMOVE_QUICK_FILTER: 'REMOVE_QUICK_FILTER',
  ADD_TO_HISTORY: 'ADD_TO_HISTORY',
  SYNC_HOOK_FILTERS: 'SYNC_HOOK_FILTERS'
};

// Reducer function
const filterReducer = (state, action) => {
  switch (action.type) {
    case FILTER_ACTIONS.SET_GLOBAL_FILTER:
      return {
        ...state,
        globalFilters: {
          ...state.globalFilters,
          [action.filterType]: action.value
        }
      };

    case FILTER_ACTIONS.SET_REPORT_FILTER:
      return {
        ...state,
        reportFilters: {
          ...state.reportFilters,
          [action.reportType]: {
            ...state.reportFilters[action.reportType],
            [action.filterType]: action.value
          }
        }
      };

    case FILTER_ACTIONS.CLEAR_GLOBAL_FILTERS:
      return {
        ...state,
        globalFilters: {
          dateRange: { start: null, end: null, preset: 'all' },
          search: '',
          quickFilters: []
        }
      };

    case FILTER_ACTIONS.CLEAR_REPORT_FILTERS:
      return {
        ...state,
        reportFilters: {
          ...state.reportFilters,
          [action.reportType]: {}
        }
      };

    case FILTER_ACTIONS.CLEAR_ALL_FILTERS:
      return {
        ...state,
        globalFilters: {
          dateRange: { start: null, end: null, preset: 'all' },
          search: '',
          quickFilters: []
        },
        reportFilters: Object.keys(state.reportFilters).reduce((acc, key) => {
          acc[key] = {};
          return acc;
        }, {})
      };

    case FILTER_ACTIONS.SET_FILTER_MODE:
      return {
        ...state,
        filterMode: action.mode
      };

    case FILTER_ACTIONS.SET_AUTO_APPLY:
      return {
        ...state,
        autoApply: action.autoApply
      };

    case FILTER_ACTIONS.UPDATE_ACTIVE_COUNT:
      return {
        ...state,
        activeFilters: {
          count: action.count,
          summary: action.summary
        }
      };

    case FILTER_ACTIONS.SAVE_FILTER_SET:
      return {
        ...state,
        savedFilterSets: new Map(state.savedFilterSets).set(action.name, {
          globalFilters: { ...state.globalFilters },
          reportFilters: { ...state.reportFilters },
          savedAt: Date.now()
        })
      };

    case FILTER_ACTIONS.LOAD_FILTER_SET:
      const filterSet = state.savedFilterSets.get(action.name);
      if (!filterSet) return state;
      
      return {
        ...state,
        globalFilters: { ...filterSet.globalFilters },
        reportFilters: { ...filterSet.reportFilters }
      };

    case FILTER_ACTIONS.DELETE_FILTER_SET:
      const newSavedSets = new Map(state.savedFilterSets);
      newSavedSets.delete(action.name);
      return {
        ...state,
        savedFilterSets: newSavedSets
      };

    case FILTER_ACTIONS.ADD_QUICK_FILTER:
      return {
        ...state,
        globalFilters: {
          ...state.globalFilters,
          quickFilters: [...state.globalFilters.quickFilters, action.filter]
        }
      };

    case FILTER_ACTIONS.REMOVE_QUICK_FILTER:
      return {
        ...state,
        globalFilters: {
          ...state.globalFilters,
          quickFilters: state.globalFilters.quickFilters.filter(f => f !== action.filter)
        }
      };

    case FILTER_ACTIONS.ADD_TO_HISTORY:
      return {
        ...state,
        filterHistory: [
          {
            timestamp: Date.now(),
            globalFilters: { ...state.globalFilters },
            reportFilters: { ...state.reportFilters },
            reportType: action.reportType
          },
          ...state.filterHistory.slice(0, 9) // Keep last 10
        ]
      };

    default:
      return state;
  }
};

// Create context
const FilterContext = createContext();

// Custom hook to use the FilterContext
export const useFilterContext = () => {
  const context = useContext(FilterContext);
  if (!context) {
    throw new Error('useFilterContext must be used within a FilterProvider');
  }
  return context;
};

// FilterProvider component
export const FilterProvider = ({ children }) => {
  const [state, dispatch] = useReducer(filterReducer, initialFilterState);
  const { reports, activeReport, getCurrentReportData } = useDataContext();
  
  // Persistent storage for filter preferences
  const { value: savedPreferences, setValue: setSavedPreferences } = useLocalStorage('filter-preferences', {
    filterMode: 'individual',
    autoApply: true,
    savedSets: {}
  });

  // Individual filter hooks for each report
  const currentReportData = getCurrentReportData();
  const filterHook = useFilters(currentReportData, activeReport);

  // Apply global filters to current report hook
  useEffect(() => {
    if (state.filterMode === 'global' && state.autoApply) {
      // Apply global date range
      if (state.globalFilters.dateRange.start && state.globalFilters.dateRange.end) {
        filterHook.setDateRange(
          state.globalFilters.dateRange.start,
          state.globalFilters.dateRange.end,
          state.globalFilters.dateRange.preset
        );
      }

      // Apply global search
      if (state.globalFilters.search) {
        filterHook.setSearch(state.globalFilters.search);
      }
    }
  }, [state.globalFilters, state.filterMode, state.autoApply, filterHook]);

  // Set global date range
  const setGlobalDateRange = useCallback((start, end, preset = 'custom') => {
    dispatch({
      type: FILTER_ACTIONS.SET_GLOBAL_FILTER,
      filterType: 'dateRange',
      value: { start, end, preset }
    });
  }, []);

  // Set global search
  const setGlobalSearch = useCallback((search) => {
    dispatch({
      type: FILTER_ACTIONS.SET_GLOBAL_FILTER,
      filterType: 'search',
      value: search
    });
  }, []);

  // Set report-specific filter
  const setReportFilter = useCallback((reportType, filterType, value) => {
    dispatch({
      type: FILTER_ACTIONS.SET_REPORT_FILTER,
      reportType,
      filterType,
      value
    });
  }, []);

  // Apply quick filter
  const applyQuickFilter = useCallback((filterType, reportType = activeReport) => {
    const quickFilterConfig = getQuickFilterConfig(filterType, reportType);
    if (!quickFilterConfig) return;

    // Apply the quick filter configuration
    Object.entries(quickFilterConfig).forEach(([type, value]) => {
      switch (type) {
        case 'dateRange':
          if (state.filterMode === 'global') {
            setGlobalDateRange(value.start, value.end, value.preset);
          } else {
            filterHook.setDateRange(value.start, value.end, value.preset);
          }
          break;
        case 'products':
          filterHook.setProductFilters(value);
          break;
        case 'status':
          filterHook.setStatusFilters(value);
          break;
        case 'amount':
          filterHook.setAmountRange(value.min, value.max);
          break;
        default:
          filterHook.addCustomFilter(type, value);
          break;
      }
    });

    // Add to quick filters list
    dispatch({
      type: FILTER_ACTIONS.ADD_QUICK_FILTER,
      filter: filterType
    });
  }, [activeReport, state.filterMode, setGlobalDateRange, filterHook]);

  // Remove quick filter
  const removeQuickFilter = useCallback((filterType) => {
    dispatch({
      type: FILTER_ACTIONS.REMOVE_QUICK_FILTER,
      filter: filterType
    });
  }, []);

  // Get quick filter configuration
  const getQuickFilterConfig = useCallback((filterType, reportType) => {
    const configs = {
      'high-volume': {
        amount: { min: 100000, max: null }
      },
      'new-applications': {
        dateRange: { 
          start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), 
          end: new Date(), 
          preset: 'last-7-days' 
        }
      },
      'approved-only': {
        status: ['approved', 'funded']
      },
      'overdue-30': {
        days_overdue: { min: 30, max: null }
      },
      'overdue-60': {
        days_overdue: { min: 60, max: null }
      },
      'overdue-90': {
        days_overdue: { min: 90, max: null }
      },
      'high-risk': {
        risk_category: ['high', 'critical']
      },
      'in-progress': {
        status: ['in-progress', 'pending']
      },
      'completed': {
        status: ['completed', 'closed']
      },
      'high-recovery': {
        recovery_rate: { min: 0.7, max: null }
      },
      'high-wait-time': {
        avg_wait_time: { min: 300, max: null } // 5 minutes
      },
      'low-satisfaction': {
        satisfaction_score: { min: null, max: 3 }
      },
      'peak-hours': {
        hour: { min: 9, max: 17 }
      },
      'unresolved': {
        status: ['open', 'pending', 'investigating']
      },
      'urgent': {
        priority: ['urgent', 'high']
      },
      'recent': {
        dateRange: { 
          start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), 
          end: new Date(), 
          preset: 'last-30-days' 
        }
      }
    };

    return configs[filterType];
  }, []);

  // Clear all filters
  const clearAllFilters = useCallback(() => {
    dispatch({ type: FILTER_ACTIONS.CLEAR_ALL_FILTERS });
    filterHook.clearFilters();
  }, [filterHook]);

  // Clear global filters
  const clearGlobalFilters = useCallback(() => {
    dispatch({ type: FILTER_ACTIONS.CLEAR_GLOBAL_FILTERS });
  }, []);

  // Clear report filters
  const clearReportFilters = useCallback((reportType = activeReport) => {
    dispatch({ 
      type: FILTER_ACTIONS.CLEAR_REPORT_FILTERS, 
      reportType 
    });
    if (reportType === activeReport) {
      filterHook.clearFilters();
    }
  }, [activeReport, filterHook]);

  // Set filter mode
  const setFilterMode = useCallback((mode) => {
    dispatch({ type: FILTER_ACTIONS.SET_FILTER_MODE, mode });
    setSavedPreferences(prev => ({ ...prev, filterMode: mode }));
  }, [setSavedPreferences]);

  // Set auto apply
  const setAutoApply = useCallback((autoApply) => {
    dispatch({ type: FILTER_ACTIONS.SET_AUTO_APPLY, autoApply });
    setSavedPreferences(prev => ({ ...prev, autoApply }));
  }, [setSavedPreferences]);

  // Save filter set
  const saveFilterSet = useCallback((name) => {
    dispatch({ type: FILTER_ACTIONS.SAVE_FILTER_SET, name });
    
    // Also save to localStorage
    const currentSets = savedPreferences.savedSets || {};
    setSavedPreferences(prev => ({
      ...prev,
      savedSets: {
        ...currentSets,
        [name]: {
          globalFilters: { ...state.globalFilters },
          reportFilters: { ...state.reportFilters },
          savedAt: Date.now()
        }
      }
    }));
  }, [state.globalFilters, state.reportFilters, savedPreferences.savedSets, setSavedPreferences]);

  // Load filter set
  const loadFilterSet = useCallback((name) => {
    dispatch({ type: FILTER_ACTIONS.LOAD_FILTER_SET, name });
    
    // Add to history
    dispatch({
      type: FILTER_ACTIONS.ADD_TO_HISTORY,
      reportType: activeReport
    });
  }, [activeReport]);

  // Delete filter set
  const deleteFilterSet = useCallback((name) => {
    dispatch({ type: FILTER_ACTIONS.DELETE_FILTER_SET, name });
    
    // Remove from localStorage
    const currentSets = { ...savedPreferences.savedSets };
    delete currentSets[name];
    setSavedPreferences(prev => ({
      ...prev,
      savedSets: currentSets
    }));
  }, [savedPreferences.savedSets, setSavedPreferences]);

  // Get combined filters for current report
  const getCombinedFilters = useCallback(() => {
    const reportFilters = state.reportFilters[activeReport] || {};
    const globalFilters = state.filterMode === 'global' ? state.globalFilters : {};
    
    return {
      ...globalFilters,
      ...reportFilters
    };
  }, [state.reportFilters, state.globalFilters, state.filterMode, activeReport]);

  // Get filtered data for current report
  const getFilteredData = useCallback(() => {
    if (state.filterMode === 'global') {
      // Use filter hook with global filters applied
      return filterHook.filteredData;
    } else {
      // Use filter hook with individual report filters
      return filterHook.filteredData;
    }
  }, [state.filterMode, filterHook.filteredData]);

  // Get filter summary
  const getFilterSummary = useCallback(() => {
    const summary = [];
    
    // Global filters summary
    if (state.filterMode === 'global') {
      if (state.globalFilters.dateRange.preset !== 'all') {
        summary.push(`Date: ${state.globalFilters.dateRange.preset}`);
      }
      if (state.globalFilters.search) {
        summary.push(`Search: "${state.globalFilters.search}"`);
      }
      if (state.globalFilters.quickFilters.length > 0) {
        summary.push(`Quick: ${state.globalFilters.quickFilters.length} filters`);
      }
    }
    
    // Add filter hook summary
    const hookSummary = filterHook.getFilterSummary();
    summary.push(...hookSummary);
    
    return summary;
  }, [state.globalFilters, state.filterMode, filterHook]);

  // Calculate active filter count
  const calculateActiveFilterCount = useCallback(() => {
    let count = 0;
    
    // Global filters
    if (state.filterMode === 'global') {
      if (state.globalFilters.dateRange.preset !== 'all') count++;
      if (state.globalFilters.search.trim()) count++;
      count += state.globalFilters.quickFilters.length;
    }
    
    // Add filter hook count
    count += filterHook.activeFilterCount;
    
    return count;
  }, [state.globalFilters, state.filterMode, filterHook.activeFilterCount]);

  // Get available quick filters for current report
  const getAvailableQuickFilters = useCallback((reportType = activeReport) => {
    return state.quickFilterOptions[reportType] || [];
  }, [state.quickFilterOptions, activeReport]);

  // Export current filter state
  const exportFilterState = useCallback(() => {
    return {
      globalFilters: { ...state.globalFilters },
      reportFilters: { ...state.reportFilters },
      filterMode: state.filterMode,
      autoApply: state.autoApply,
      activeReport,
      timestamp: Date.now()
    };
  }, [state, activeReport]);

  // Import filter state
  const importFilterState = useCallback((filterState) => {
    try {
      if (filterState.globalFilters) {
        Object.entries(filterState.globalFilters).forEach(([type, value]) => {
          dispatch({
            type: FILTER_ACTIONS.SET_GLOBAL_FILTER,
            filterType: type,
            value
          });
        });
      }
      
      if (filterState.reportFilters) {
        Object.entries(filterState.reportFilters).forEach(([reportType, filters]) => {
          Object.entries(filters).forEach(([filterType, value]) => {
            dispatch({
              type: FILTER_ACTIONS.SET_REPORT_FILTER,
              reportType,
              filterType,
              value
            });
          });
        });
      }
      
      if (filterState.filterMode) {
        setFilterMode(filterState.filterMode);
      }
      
      if (typeof filterState.autoApply === 'boolean') {
        setAutoApply(filterState.autoApply);
      }
      
      return true;
    } catch (error) {
      console.error('Failed to import filter state:', error);
      return false;
    }
  }, [setFilterMode, setAutoApply]);

  // Update active filter count when state changes
  useEffect(() => {
    const count = calculateActiveFilterCount();
    const summary = getFilterSummary();
    
    dispatch({
      type: FILTER_ACTIONS.UPDATE_ACTIVE_COUNT,
      count,
      summary
    });
  }, [calculateActiveFilterCount, getFilterSummary]);

  // Sync with localStorage preferences on mount
  useEffect(() => {
    if (savedPreferences.filterMode) {
      dispatch({ type: FILTER_ACTIONS.SET_FILTER_MODE, mode: savedPreferences.filterMode });
    }
    if (typeof savedPreferences.autoApply === 'boolean') {
      dispatch({ type: FILTER_ACTIONS.SET_AUTO_APPLY, autoApply: savedPreferences.autoApply });
    }
    
    // Load saved filter sets
    if (savedPreferences.savedSets) {
      Object.entries(savedPreferences.savedSets).forEach(([name, filterSet]) => {
        dispatch({ type: FILTER_ACTIONS.SAVE_FILTER_SET, name });
      });
    }
  }, [savedPreferences]);

  // Context value
  const contextValue = {
    // State
    globalFilters: state.globalFilters,
    reportFilters: state.reportFilters,
    activeFilters: state.activeFilters,
    filterMode: state.filterMode,
    autoApply: state.autoApply,
    filterHistory: state.filterHistory,
    savedFilterSets: Array.from(state.savedFilterSets.keys()),

    // Global filter actions
    setGlobalDateRange,
    setGlobalSearch,
    clearGlobalFilters,

    // Report filter actions
    setReportFilter,
    clearReportFilters,

    // Quick filters
    applyQuickFilter,
    removeQuickFilter,
    getAvailableQuickFilters,

    // Filter management
    clearAllFilters,
    setFilterMode,
    setAutoApply,

    // Saved filter sets
    saveFilterSet,
    loadFilterSet,
    deleteFilterSet,

    // Data access
    getCombinedFilters,
    getFilteredData,
    getFilterSummary,

    // Utilities
    exportFilterState,
    importFilterState,

    // Filter hook integration
    filterHook: {
      filteredData: filterHook.filteredData,
      originalCount: filterHook.originalCount,
      filteredCount: filterHook.filteredCount,
      filterRatio: filterHook.filterRatio,
      setDateRange: filterHook.setDateRange,
      setDatePreset: filterHook.setDatePreset,
      setProductFilters: filterHook.setProductFilters,
      setRegionFilters: filterHook.setRegionFilters,
      setStatusFilters: filterHook.setStatusFilters,
      setAmountRange: filterHook.setAmountRange,
      setSearch: filterHook.setSearch,
      addCustomFilter: filterHook.addCustomFilter,
      removeCustomFilter: filterHook.removeCustomFilter,
      clearFilters: filterHook.clearFilters,
      clearFilterType: filterHook.clearFilterType,
      getFilterOptions: filterHook.getFilterOptions
    },

    // Statistics
    totalActiveFilters: state.activeFilters.count,
    hasActiveFilters: state.activeFilters.count > 0,
    isGlobalMode: state.filterMode === 'global'
  };

  return (
    <FilterContext.Provider value={contextValue}>
      {children}
    </FilterContext.Provider>
  );
};

export default FilterContext; 
