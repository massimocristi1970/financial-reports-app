import { useState, useEffect, useCallback } from 'react';

const useLocalStorage = (key, initialValue = null) => {
  // State to store our value
  const [storedValue, setStoredValue] = useState(() => {
    try {
      // Get from local storage by key
      const item = window.localStorage.getItem(key);
      // Parse stored json or if none return initialValue
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      // If error also return initialValue
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // Return a wrapped version of useState's setter function that
  // persists the new value to localStorage
  const setValue = useCallback((value) => {
    try {
      setLoading(true);
      setError(null);
      
      // Allow value to be a function so we have the same API as useState
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      
      // Save state
      setStoredValue(valueToStore);
      
      // Save to local storage
      if (valueToStore === null || valueToStore === undefined) {
        window.localStorage.removeItem(key);
      } else {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
      
      setLoading(false);
    } catch (error) {
      // A more advanced implementation would restore the previous value
      console.error(`Error setting localStorage key "${key}":`, error);
      setError(error.message);
      setLoading(false);
    }
  }, [key, storedValue]);

  // Remove item from localStorage
  const removeValue = useCallback(() => {
    try {
      setLoading(true);
      setError(null);
      
      window.localStorage.removeItem(key);
      setStoredValue(initialValue);
      
      setLoading(false);
    } catch (error) {
      console.error(`Error removing localStorage key "${key}":`, error);
      setError(error.message);
      setLoading(false);
    }
  }, [key, initialValue]);

  // Check if key exists in localStorage
  const hasValue = useCallback(() => {
    try {
      return window.localStorage.getItem(key) !== null;
    } catch (error) {
      console.error(`Error checking localStorage key "${key}":`, error);
      return false;
    }
  }, [key]);

  // Get raw value from localStorage (without JSON parsing)
  const getRawValue = useCallback(() => {
    try {
      return window.localStorage.getItem(key);
    } catch (error) {
      console.error(`Error getting raw localStorage key "${key}":`, error);
      return null;
    }
  }, [key]);

  // Set raw value to localStorage (without JSON stringifying)
  const setRawValue = useCallback((value) => {
    try {
      setLoading(true);
      setError(null);
      
      if (value === null || value === undefined) {
        window.localStorage.removeItem(key);
      } else {
        window.localStorage.setItem(key, value);
      }
      
      // Update state with parsed value
      try {
        setStoredValue(value ? JSON.parse(value) : initialValue);
      } catch {
        setStoredValue(value);
      }
      
      setLoading(false);
    } catch (error) {
      console.error(`Error setting raw localStorage key "${key}":`, error);
      setError(error.message);
      setLoading(false);
    }
  }, [key, initialValue]);

  // Get size of stored value in bytes
  const getSize = useCallback(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? new Blob([item]).size : 0;
    } catch (error) {
      console.error(`Error getting size of localStorage key "${key}":`, error);
      return 0;
    }
  }, [key]);

  // Clear error state
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    value: storedValue,
    setValue,
    removeValue,
    hasValue,
    getRawValue,
    setRawValue,
    getSize,
    loading,
    error,
    clearError
  };
};

// Hook for managing multiple localStorage keys
const useLocalStorageState = (initialState = {}) => {
  const [state, setState] = useState(() => {
    const savedState = {};
    
    Object.keys(initialState).forEach(key => {
      try {
        const item = window.localStorage.getItem(key);
        savedState[key] = item ? JSON.parse(item) : initialState[key];
      } catch (error) {
        console.warn(`Error reading localStorage key "${key}":`, error);
        savedState[key] = initialState[key];
      }
    });
    
    return savedState;
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState({});

  // Update a specific key
  const updateKey = useCallback((key, value) => {
    try {
      setLoading(prev => ({ ...prev, [key]: true }));
      setErrors(prev => ({ ...prev, [key]: null }));
      
      const valueToStore = value instanceof Function ? value(state[key]) : value;
      
      // Update state
      setState(prev => ({ ...prev, [key]: valueToStore }));
      
      // Save to localStorage
      if (valueToStore === null || valueToStore === undefined) {
        window.localStorage.removeItem(key);
      } else {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
      
      setLoading(prev => ({ ...prev, [key]: false }));
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
      setErrors(prev => ({ ...prev, [key]: error.message }));
      setLoading(prev => ({ ...prev, [key]: false }));
    }
  }, [state]);

  // Update multiple keys at once
  const updateMultiple = useCallback((updates) => {
    Object.entries(updates).forEach(([key, value]) => {
      updateKey(key, value);
    });
  }, [updateKey]);

  // Remove a specific key
  const removeKey = useCallback((key) => {
    try {
      setLoading(prev => ({ ...prev, [key]: true }));
      setErrors(prev => ({ ...prev, [key]: null }));
      
      window.localStorage.removeItem(key);
      setState(prev => {
        const newState = { ...prev };
        delete newState[key];
        return newState;
      });
      
      setLoading(prev => ({ ...prev, [key]: false }));
    } catch (error) {
      console.error(`Error removing localStorage key "${key}":`, error);
      setErrors(prev => ({ ...prev, [key]: error.message }));
      setLoading(prev => ({ ...prev, [key]: false }));
    }
  }, []);

  // Clear all managed keys
  const clearAll = useCallback(() => {
    Object.keys(state).forEach(key => {
      removeKey(key);
    });
  }, [state, removeKey]);

  return {
    state,
    updateKey,
    updateMultiple,
    removeKey,
    clearAll,
    loading,
    errors
  };
};

// Hook for managing localStorage with expiration
const useLocalStorageWithExpiry = (key, initialValue = null, ttlMs = 24 * 60 * 60 * 1000) => {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      if (!item) return initialValue;
      
      const parsedItem = JSON.parse(item);
      
      // Check if item has expiry
      if (parsedItem.expiry && Date.now() > parsedItem.expiry) {
        window.localStorage.removeItem(key);
        return initialValue;
      }
      
      return parsedItem.value || initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const setValue = useCallback((value, customTtl = ttlMs) => {
    try {
      setLoading(true);
      setError(null);
      
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      
      setStoredValue(valueToStore);
      
      if (valueToStore === null || valueToStore === undefined) {
        window.localStorage.removeItem(key);
      } else {
        const itemWithExpiry = {
          value: valueToStore,
          expiry: customTtl ? Date.now() + customTtl : null
        };
        window.localStorage.setItem(key, JSON.stringify(itemWithExpiry));
      }
      
      setLoading(false);
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
      setError(error.message);
      setLoading(false);
    }
  }, [key, storedValue, ttlMs]);

  const removeValue = useCallback(() => {
    try {
      setLoading(true);
      setError(null);
      
      window.localStorage.removeItem(key);
      setStoredValue(initialValue);
      
      setLoading(false);
    } catch (error) {
      console.error(`Error removing localStorage key "${key}":`, error);
      setError(error.message);
      setLoading(false);
    }
  }, [key, initialValue]);

  const isExpired = useCallback(() => {
    try {
      const item = window.localStorage.getItem(key);
      if (!item) return true;
      
      const parsedItem = JSON.parse(item);
      return parsedItem.expiry && Date.now() > parsedItem.expiry;
    } catch (error) {
      console.error(`Error checking expiry for localStorage key "${key}":`, error);
      return true;
    }
  }, [key]);

  const getTimeToExpiry = useCallback(() => {
    try {
      const item = window.localStorage.getItem(key);
      if (!item) return 0;
      
      const parsedItem = JSON.parse(item);
      if (!parsedItem.expiry) return Infinity;
      
      return Math.max(0, parsedItem.expiry - Date.now());
    } catch (error) {
      console.error(`Error getting time to expiry for localStorage key "${key}":`, error);
      return 0;
    }
  }, [key]);

  const refreshExpiry = useCallback((newTtl = ttlMs) => {
    if (storedValue !== null && storedValue !== undefined) {
      setValue(storedValue, newTtl);
    }
  }, [storedValue, setValue, ttlMs]);

  return {
    value: storedValue,
    setValue,
    removeValue,
    isExpired,
    getTimeToExpiry,
    refreshExpiry,
    loading,
    error
  };
};

// Hook for localStorage utilities
const useLocalStorageUtils = () => {
  const [totalSize, setTotalSize] = useState(0);
  const [keyCount, setKeyCount] = useState(0);

  // Calculate total localStorage usage
  const calculateUsage = useCallback(() => {
    try {
      let total = 0;
      let count = 0;
      
      for (let key in window.localStorage) {
        if (window.localStorage.hasOwnProperty(key)) {
          total += window.localStorage.getItem(key).length + key.length;
          count++;
        }
      }
      
      setTotalSize(total);
      setKeyCount(count);
      
      return { totalSize: total, keyCount: count };
    } catch (error) {
      console.error('Error calculating localStorage usage:', error);
      return { totalSize: 0, keyCount: 0 };
    }
  }, []);

  // Get all keys with a specific prefix
  const getKeysByPrefix = useCallback((prefix) => {
    try {
      const keys = [];
      for (let key in window.localStorage) {
        if (window.localStorage.hasOwnProperty(key) && key.startsWith(prefix)) {
          keys.push(key);
        }
      }
      return keys;
    } catch (error) {
      console.error('Error getting keys by prefix:', error);
      return [];
    }
  }, []);

  // Clear all keys with a specific prefix
  const clearByPrefix = useCallback((prefix) => {
    try {
      const keysToRemove = getKeysByPrefix(prefix);
      keysToRemove.forEach(key => {
        window.localStorage.removeItem(key);
      });
      return keysToRemove.length;
    } catch (error) {
      console.error('Error clearing keys by prefix:', error);
      return 0;
    }
  }, [getKeysByPrefix]);

  // Export all localStorage data
  const exportAll = useCallback(() => {
    try {
      const data = {};
      for (let key in window.localStorage) {
        if (window.localStorage.hasOwnProperty(key)) {
          try {
            data[key] = JSON.parse(window.localStorage.getItem(key));
          } catch {
            data[key] = window.localStorage.getItem(key);
          }
        }
      }
      return data;
    } catch (error) {
      console.error('Error exporting localStorage data:', error);
      return {};
    }
  }, []);

  // Import localStorage data
  const importAll = useCallback((data, overwrite = false) => {
    try {
      let imported = 0;
      let skipped = 0;
      
      Object.entries(data).forEach(([key, value]) => {
        if (!overwrite && window.localStorage.getItem(key) !== null) {
          skipped++;
          return;
        }
        
        try {
          window.localStorage.setItem(key, JSON.stringify(value));
          imported++;
        } catch (error) {
          console.warn(`Failed to import key "${key}":`, error);
        }
      });
      
      return { imported, skipped };
    } catch (error) {
      console.error('Error importing localStorage data:', error);
      return { imported: 0, skipped: 0 };
    }
  }, []);

  // Check if localStorage is available
  const isAvailable = useCallback(() => {
    try {
      const test = '__localStorage_test__';
      window.localStorage.setItem(test, 'test');
      window.localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }, []);

  useEffect(() => {
    calculateUsage();
  }, [calculateUsage]);

  return {
    totalSize,
    keyCount,
    calculateUsage,
    getKeysByPrefix,
    clearByPrefix,
    exportAll,
    importAll,
    isAvailable
  };
};

export default useLocalStorage;
export { useLocalStorageState, useLocalStorageWithExpiry, useLocalStorageUtils }; 