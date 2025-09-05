// src/contexts/ThemeContext.js - FIXED VERSION
import React, { createContext, useContext, useReducer, useCallback, useEffect, useMemo } from 'react';

// Create a minimal useLocalStorage hook if it doesn't exist
const useLocalStorage = (key, defaultValue) => {
  const [value, setValue] = React.useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return defaultValue;
    }
  });

  const setStoredValue = useCallback((newValue) => {
    try {
      setValue(newValue);
      window.localStorage.setItem(key, JSON.stringify(newValue));
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error);
    }
  }, [key]);

  return { value, setValue: setStoredValue };
};

// Theme definitions
const themes = {
  light: {
    name: 'light',
    colors: {
      primary: '#2563eb',
      primaryHover: '#1d4ed8',
      secondary: '#64748b',
      accent: '#0ea5e9',
      background: '#ffffff',
      surface: '#f8fafc',
      surfaceHover: '#f1f5f9',
      border: '#e2e8f0',
      text: '#1e293b',
      textSecondary: '#475569',
      textMuted: '#94a3b8',
      success: '#059669',
      warning: '#d97706',
      error: '#dc2626',
      info: '#0284c7'
    }
  },
  dark: {
    name: 'dark',
    colors: {
      primary: '#3b82f6',
      primaryHover: '#2563eb',
      secondary: '#64748b',
      accent: '#0ea5e9',
      background: '#0f172a',
      surface: '#1e293b',
      surfaceHover: '#334155',
      border: '#334155',
      text: '#f8fafc',
      textSecondary: '#cbd5e1',
      textMuted: '#64748b',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      info: '#06b6d4'
    }
  }
};

// Initial state
const initialState = {
  currentTheme: 'light',
  preferences: {
    autoTheme: false
  }
};

// Action types
const THEME_ACTIONS = {
  SET_THEME: 'SET_THEME',
  SET_PREFERENCE: 'SET_PREFERENCE',
  INITIALIZE_THEME: 'INITIALIZE_THEME'
};

// Reducer function
const themeReducer = (state, action) => {
  switch (action.type) {
    case THEME_ACTIONS.SET_THEME:
      return {
        ...state,
        currentTheme: action.theme
      };

    case THEME_ACTIONS.SET_PREFERENCE:
      return {
        ...state,
        preferences: {
          ...state.preferences,
          [action.key]: action.value
        }
      };

    case THEME_ACTIONS.INITIALIZE_THEME:
      return {
        ...state,
        ...action.config
      };

    default:
      return state;
  }
};

// Create context
const ThemeContext = createContext();

// Custom hook to use the ThemeContext
export const useThemeContext = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useThemeContext must be used within a ThemeProvider');
  }
  return context;
};

// ThemeProvider component
export const ThemeProvider = ({ children }) => {
  const [state, dispatch] = useReducer(themeReducer, initialState);
  
  // Persistent storage for theme preferences
  const { value: savedThemeConfig, setValue: setSavedThemeConfig } = useLocalStorage('theme-config', {
    currentTheme: 'light',
    preferences: { autoTheme: false }
  });

  // Initialize theme from localStorage only once on mount
  useEffect(() => {
    if (savedThemeConfig.currentTheme && savedThemeConfig.currentTheme !== state.currentTheme) {
      dispatch({ 
        type: THEME_ACTIONS.INITIALIZE_THEME, 
        config: {
          currentTheme: savedThemeConfig.currentTheme,
          preferences: savedThemeConfig.preferences || { autoTheme: false }
        }
      });
    }
  }, []); // Only run on mount

  // Get current theme object (memoized to prevent recreating)
  const getCurrentTheme = useMemo(() => {
    return themes[state.currentTheme] || themes.light;
  }, [state.currentTheme]);

  // Set theme function
  const setTheme = useCallback((themeName) => {
    dispatch({ type: THEME_ACTIONS.SET_THEME, theme: themeName });
    setSavedThemeConfig(prev => ({ ...prev, currentTheme: themeName }));
  }, [setSavedThemeConfig]);

  // Set preference function
  const setPreference = useCallback((key, value) => {
    dispatch({ type: THEME_ACTIONS.SET_PREFERENCE, key, value });
    setSavedThemeConfig(prev => ({
      ...prev,
      preferences: { ...prev.preferences, [key]: value }
    }));
  }, [setSavedThemeConfig]);

  // Toggle between light and dark theme
  const toggleTheme = useCallback(() => {
    const newTheme = state.currentTheme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
  }, [state.currentTheme, setTheme]);

  // Auto theme based on system preference
  const enableAutoTheme = useCallback(() => {
    setPreference('autoTheme', true);
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => {
      setTheme(e.matches ? 'dark' : 'light');
    };
    
    // Set initial theme
    handleChange(mediaQuery);
    
    // Listen for changes
    mediaQuery.addEventListener('change', handleChange);
    
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [setTheme, setPreference]);

  // Apply CSS variables to document root
  const applyCSSVariables = useCallback(() => {
    const theme = getCurrentTheme;
    const root = document.documentElement;
    
    // Apply theme colors as CSS variables
    Object.entries(theme.colors).forEach(([key, value]) => {
      const cssVar = `--color-${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
      root.style.setProperty(cssVar, value);
    });

    // Set theme class on body
    document.body.className = `${state.currentTheme}-theme`;
    document.body.setAttribute('data-theme', state.currentTheme);
  }, [getCurrentTheme, state.currentTheme]);

  // Apply CSS variables when theme changes (stable dependency)
  useEffect(() => {
    applyCSSVariables();
  }, [state.currentTheme]); // Only depend on currentTheme, not the function

  // Handle auto theme preference
  useEffect(() => {
    let cleanup;
    if (state.preferences.autoTheme) {
      cleanup = enableAutoTheme();
    }
    return cleanup;
  }, [state.preferences.autoTheme, enableAutoTheme]);

  // Stable context value (memoized)
  const contextValue = useMemo(() => ({
    // Current state
    currentTheme: state.currentTheme,
    theme: getCurrentTheme,
    preferences: state.preferences,
    
    // Theme management
    setTheme,
    toggleTheme,
    availableThemes: Object.keys(themes),
    
    // Preferences
    setPreference,
    
    // Auto theme
    enableAutoTheme,
    
    // Utilities
    applyCSSVariables,
    
    // Helper functions
    isDarkTheme: () => state.currentTheme === 'dark',
    isAutoTheme: () => state.preferences.autoTheme
  }), [
    state.currentTheme,
    state.preferences,
    getCurrentTheme,
    setTheme,
    toggleTheme,
    setPreference,
    enableAutoTheme,
    applyCSSVariables
  ]);

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};