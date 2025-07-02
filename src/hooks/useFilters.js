import { useState, useCallback, useEffect, useMemo } from 'react';
import { isWithinDateRange, formatDateForFilter } from '../utils/dateUtils';
import { FILTER_PRESETS, PRODUCT_TYPES, REGIONS } from '../utils/constants';

const useFilters = (data = [], reportType = null) => {
  const [filters, setFilters] = useState({
    dateRange: {
      start: null,
      end: null,
      preset: 'all'
    },
    products: [],
    regions: [],
    status: [],
    amount: {
      min: null,
      max: null
    },
    search: '',
    customFilters: new Map()
  });

  const [savedFilters, setSavedFilters] = useState(new Map());
  const [activeFilterCount, setActiveFilterCount] = useState(0);

  // Apply date range filter
  const applyDateFilter = useCallback((item) => {
    if (!filters.dateRange.start || !filters.dateRange.end) return true;
    
    const itemDate = item.date || item.created_date || item.timestamp;
    if (!itemDate) return true;

    return isWithinDateRange(
      new Date(itemDate),
      filters.dateRange.start,
      filters.dateRange.end
    );
  }, [filters.dateRange]);

  // Apply product filter
  const applyProductFilter = useCallback((item) => {
    if (filters.products.length === 0) return true;
    
    const itemProduct = item.product || item.product_type || item.loan_type;
    return filters.products.includes(itemProduct);
  }, [filters.products]);

  // Apply region filter
  const applyRegionFilter = useCallback((item) => {
    if (filters.regions.length === 0) return true;
    
    const itemRegion = item.region || item.state || item.location;
    return filters.regions.includes(itemRegion);
  }, [filters.regions]);

  // Apply status filter
  const applyStatusFilter = useCallback((item) => {
    if (filters.status.length === 0) return true;
    
    const itemStatus = item.status || item.state || item.condition;
    return filters.status.includes(itemStatus);
  }, [filters.status]);

  // Apply amount filter
  const applyAmountFilter = useCallback((item) => {
    const { min, max } = filters.amount;
    if (min === null && max === null) return true;
    
    const amount = parseFloat(item.amount || item.value || item.loan_amount || 0);
    
    if (min !== null && amount < min) return false;
    if (max !== null && amount > max) return false;
    
    return true;
  }, [filters.amount]);

  // Apply search filter
  const applySearchFilter = useCallback((item) => {
    if (!filters.search.trim()) return true;
    
    const searchTerm = filters.search.toLowerCase().trim();
    const searchableFields = [
      'name', 'description', 'reference', 'id', 'customer_name',
      'account_number', 'loan_id', 'complaint_type', 'agent_name'
    ];
    
    return searchableFields.some(field => {
      const value = item[field];
      return value && value.toString().toLowerCase().includes(searchTerm);
    });
  }, [filters.search]);

  // Apply custom filters
  const applyCustomFilters = useCallback((item) => {
    if (filters.customFilters.size === 0) return true;
    
    for (const [key, value] of filters.customFilters) {
      if (Array.isArray(value)) {
        if (value.length > 0 && !value.includes(item[key])) return false;
      } else if (value !== null && value !== undefined) {
        if (item[key] !== value) return false;
      }
    }
    
    return true;
  }, [filters.customFilters]);

  // Main filter function
  const filteredData = useMemo(() => {
    if (!data || data.length === 0) return [];

    return data.filter(item => {
      return (
        applyDateFilter(item) &&
        applyProductFilter(item) &&
        applyRegionFilter(item) &&
        applyStatusFilter(item) &&
        applyAmountFilter(item) &&
        applySearchFilter(item) &&
        applyCustomFilters(item)
      );
    });
  }, [
    data,
    applyDateFilter,
    applyProductFilter,
    applyRegionFilter,
    applyStatusFilter,
    applyAmountFilter,
    applySearchFilter,
    applyCustomFilters
  ]);

  // Update date range
  const setDateRange = useCallback((start, end, preset = 'custom') => {
    setFilters(prev => ({
      ...prev,
      dateRange: { start, end, preset }
    }));
  }, []);

  // Set date preset
  const setDatePreset = useCallback((preset) => {
    const presetConfig = FILTER_PRESETS[preset];
    if (!presetConfig) return;

    const { start, end } = presetConfig.getDateRange();
    setDateRange(start, end, preset);
  }, [setDateRange]);

  // Update product filters
  const setProductFilters = useCallback((products) => {
    setFilters(prev => ({
      ...prev,
      products: Array.isArray(products) ? products : [products]
    }));
  }, []);

  // Update region filters
  const setRegionFilters = useCallback((regions) => {
    setFilters(prev => ({
      ...prev,
      regions: Array.isArray(regions) ? regions : [regions]
    }));
  }, []);

  // Update status filters
  const setStatusFilters = useCallback((status) => {
    setFilters(prev => ({
      ...prev,
      status: Array.isArray(status) ? status : [status]
    }));
  }, []);

  // Update amount range
  const setAmountRange = useCallback((min, max) => {
    setFilters(prev => ({
      ...prev,
      amount: { min, max }
    }));
  }, []);

  // Update search term
  const setSearch = useCallback((search) => {
    setFilters(prev => ({
      ...prev,
      search: search || ''
    }));
  }, []);

  // Add custom filter
  const addCustomFilter = useCallback((key, value) => {
    setFilters(prev => ({
      ...prev,
      customFilters: new Map(prev.customFilters).set(key, value)
    }));
  }, []);

  // Remove custom filter
  const removeCustomFilter = useCallback((key) => {
    setFilters(prev => {
      const newCustomFilters = new Map(prev.customFilters);
      newCustomFilters.delete(key);
      return {
        ...prev,
        customFilters: newCustomFilters
      };
    });
  }, []);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setFilters({
      dateRange: {
        start: null,
        end: null,
        preset: 'all'
      },
      products: [],
      regions: [],
      status: [],
      amount: {
        min: null,
        max: null
      },
      search: '',
      customFilters: new Map()
    });
  }, []);

  // Clear specific filter type
  const clearFilterType = useCallback((type) => {
    setFilters(prev => {
      const newFilters = { ...prev };
      
      switch (type) {
        case 'date':
          newFilters.dateRange = { start: null, end: null, preset: 'all' };
          break;
        case 'products':
          newFilters.products = [];
          break;
        case 'regions':
          newFilters.regions = [];
          break;
        case 'status':
          newFilters.status = [];
          break;
        case 'amount':
          newFilters.amount = { min: null, max: null };
          break;
        case 'search':
          newFilters.search = '';
          break;
        case 'custom':
          newFilters.customFilters = new Map();
          break;
        default:
          break;
      }
      
      return newFilters;
    });
  }, []);

  // Save current filter state
  const saveFilterState = useCallback((name) => {
    if (!name) return false;
    
    setSavedFilters(prev => new Map(prev).set(name, {
      ...filters,
      customFilters: new Map(filters.customFilters), // Deep copy Map
      savedAt: Date.now()
    }));
    
    return true;
  }, [filters]);

  // Load saved filter state
  const loadFilterState = useCallback((name) => {
    const savedFilter = savedFilters.get(name);
    if (!savedFilter) return false;
    
    setFilters({
      ...savedFilter,
      customFilters: new Map(savedFilter.customFilters) // Deep copy Map
    });
    
    return true;
  }, [savedFilters]);

  // Delete saved filter
  const deleteSavedFilter = useCallback((name) => {
    setSavedFilters(prev => {
      const newSaved = new Map(prev);
      newSaved.delete(name);
      return newSaved;
    });
  }, []);

  // Get available filter options from data
  const getFilterOptions = useCallback(() => {
    if (!data || data.length === 0) {
      return {
        products: PRODUCT_TYPES,
        regions: REGIONS,
        status: [],
        dateRange: { min: null, max: null },
        amountRange: { min: 0, max: 0 }
      };
    }

    const products = [...new Set(data.map(item => 
      item.product || item.product_type || item.loan_type
    ).filter(Boolean))];

    const regions = [...new Set(data.map(item => 
      item.region || item.state || item.location
    ).filter(Boolean))];

    const status = [...new Set(data.map(item => 
      item.status || item.state || item.condition
    ).filter(Boolean))];

    const dates = data
      .map(item => new Date(item.date || item.created_date || item.timestamp))
      .filter(date => !isNaN(date.getTime()))
      .sort();

    const amounts = data
      .map(item => parseFloat(item.amount || item.value || item.loan_amount || 0))
      .filter(amount => !isNaN(amount))
      .sort((a, b) => a - b);

    return {
      products,
      regions,
      status,
      dateRange: dates.length > 0 ? {
        min: dates[0],
        max: dates[dates.length - 1]
      } : { min: null, max: null },
      amountRange: amounts.length > 0 ? {
        min: amounts[0],
        max: amounts[amounts.length - 1]
      } : { min: 0, max: 0 }
    };
  }, [data]);

  // Get filter summary
  const getFilterSummary = useCallback(() => {
    const summary = [];
    
    if (filters.dateRange.preset !== 'all') {
      summary.push(`Date: ${filters.dateRange.preset}`);
    }
    
    if (filters.products.length > 0) {
      summary.push(`Products: ${filters.products.length} selected`);
    }
    
    if (filters.regions.length > 0) {
      summary.push(`Regions: ${filters.regions.length} selected`);
    }
    
    if (filters.status.length > 0) {
      summary.push(`Status: ${filters.status.length} selected`);
    }
    
    if (filters.amount.min !== null || filters.amount.max !== null) {
      summary.push('Amount range applied');
    }
    
    if (filters.search.trim()) {
      summary.push(`Search: "${filters.search}"`);
    }
    
    if (filters.customFilters.size > 0) {
      summary.push(`Custom: ${filters.customFilters.size} filters`);
    }
    
    return summary;
  }, [filters]);

  // Calculate active filter count
  useEffect(() => {
    let count = 0;
    
    if (filters.dateRange.preset !== 'all') count++;
    if (filters.products.length > 0) count++;
    if (filters.regions.length > 0) count++;
    if (filters.status.length > 0) count++;
    if (filters.amount.min !== null || filters.amount.max !== null) count++;
    if (filters.search.trim()) count++;
    count += filters.customFilters.size;
    
    setActiveFilterCount(count);
  }, [filters]);

  return {
    // Filter state
    filters,
    filteredData,
    activeFilterCount,
    
    // Date filters
    setDateRange,
    setDatePreset,
    
    // Category filters
    setProductFilters,
    setRegionFilters,
    setStatusFilters,
    
    // Range filters
    setAmountRange,
    
    // Text search
    setSearch,
    
    // Custom filters
    addCustomFilter,
    removeCustomFilter,
    
    // Filter management
    clearFilters,
    clearFilterType,
    
    // Saved filters
    saveFilterState,
    loadFilterState,
    deleteSavedFilter,
    savedFilters: Array.from(savedFilters.keys()),
    
    // Utilities
    getFilterOptions,
    getFilterSummary,
    
    // Statistics
    originalCount: data?.length || 0,
    filteredCount: filteredData.length,
    filterRatio: data?.length ? (filteredData.length / data.length) : 0
  };
};

export default useFilters; 