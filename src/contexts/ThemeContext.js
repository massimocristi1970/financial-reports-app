import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';

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
    },
    spacing: {
      xs: '0.25rem',
      sm: '0.5rem',
      md: '1rem',
      lg: '1.5rem',
      xl: '2rem',
      xxl: '3rem'
    },
    borderRadius: {
      sm: '0.25rem',
      md: '0.375rem',
      lg: '0.5rem',
      xl: '0.75rem',
      full: '9999px'
    },
    shadows: {
      sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
      md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
      lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
      xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)'
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
    },
    spacing: {
      xs: '0.25rem',
      sm: '0.5rem',
      md: '1rem',
      lg: '1.5rem',
      xl: '2rem',
      xxl: '3rem'
    },
    borderRadius: {
      sm: '0.25rem',
      md: '0.375rem',
      lg: '0.5rem',
      xl: '0.75rem',
      full: '9999px'
    },
    shadows: {
      sm: '0 1px 2px 0 rgb(0 0 0 / 0.3)',
      md: '0 4px 6px -1px rgb(0 0 0 / 0.4), 0 2px 4px -2px rgb(0 0 0 / 0.4)',
      lg: '0 10px 15px -3px rgb(0 0 0 / 0.4), 0 4px 6px -4px rgb(0 0 0 / 0.4)',
      xl: '0 20px 25px -5px rgb(0 0 0 / 0.4), 0 8px 10px -6px rgb(0 0 0 / 0.4)'
    }
  },
  blue: {
    name: 'blue',
    colors: {
      primary: '#1e40af',
      primaryHover: '#1d4ed8',
      secondary: '#64748b',
      accent: '#0ea5e9',
      background: '#f0f9ff',
      surface: '#ffffff',
      surfaceHover: '#dbeafe',
      border: '#bfdbfe',
      text: '#1e293b',
      textSecondary: '#475569',
      textMuted: '#64748b',
      success: '#059669',
      warning: '#d97706',
      error: '#dc2626',
      info: '#0284c7'
    },
    spacing: {
      xs: '0.25rem',
      sm: '0.5rem',
      md: '1rem',
      lg: '1.5rem',
      xl: '2rem',
      xxl: '3rem'
    },
    borderRadius: {
      sm: '0.25rem',
      md: '0.375rem',
      lg: '0.5rem',
      xl: '0.75rem',
      full: '9999px'
    },
    shadows: {
      sm: '0 1px 2px 0 rgb(59 130 246 / 0.1)',
      md: '0 4px 6px -1px rgb(59 130 246 / 0.15), 0 2px 4px -2px rgb(59 130 246 / 0.1)',
      lg: '0 10px 15px -3px rgb(59 130 246 / 0.15), 0 4px 6px -4px rgb(59 130 246 / 0.1)',
      xl: '0 20px 25px -5px rgb(59 130 246 / 0.15), 0 8px 10px -6px rgb(59 130 246 / 0.1)'
    }
  }
};

// Initial state
const initialState = {
  currentTheme: 'light',
  customThemes: new Map(),
  preferences: {
    fontSize: 'medium', // small, medium, large
    density: 'comfortable', // compact, comfortable, spacious
    animations: true,
    highContrast: false,
    reducedMotion: false,
    autoTheme: true // Auto switch based on system preference
  },
  breakpoints: {
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
    xxl: 1536
  },
  componentSettings: {
    charts: {
      colorScheme: 'default', // default, colorblind, monochrome
      gridLines: true,
      animations: true
    },
    tables: {
      stripedRows: true,
      hoverEffects: true,
      compactMode: false
    },
    navigation: {
      collapsed: false,
      position: 'left' // left, top, right
    }
  }
};

// Action types
const THEME_ACTIONS = {
  SET_THEME: 'SET_THEME',
  SET_PREFERENCE: 'SET_PREFERENCE',
  SET_COMPONENT_SETTING: 'SET_COMPONENT_SETTING',
  ADD_CUSTOM_THEME: 'ADD_CUSTOM_THEME',
  REMOVE_CUSTOM_THEME: 'REMOVE_CUSTOM_THEME',
  RESET_PREFERENCES: 'RESET_PREFERENCES',
  IMPORT_THEME_CONFIG: 'IMPORT_THEME_CONFIG'
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

    case THEME_ACTIONS.SET_COMPONENT_SETTING:
      return {
        ...state,
        componentSettings: {
          ...state.componentSettings,
          [action.component]: {
            ...state.componentSettings[action.component],
            [action.setting]: action.value
          }
        }
      };

    case THEME_ACTIONS.ADD_CUSTOM_THEME:
      return {
        ...state,
        customThemes: new Map(state.customThemes).set(action.name, action.theme)
      };

    case THEME_ACTIONS.REMOVE_CUSTOM_THEME:
      const newCustomThemes = new Map(state.customThemes);
      newCustomThemes.delete(action.name);
      return {
        ...state,
        customThemes: newCustomThemes
      };

    case THEME_ACTIONS.RESET_PREFERENCES:
      return {
        ...state,
        preferences: initialState.preferences,
        componentSettings: initialState.componentSettings
      };

    case THEME_ACTIONS.IMPORT_THEME_CONFIG:
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
    preferences: initialState.preferences,
    componentSettings: initialState.componentSettings,
    customThemes: {}
  });

  // Get current theme object
  const getCurrentTheme = useCallback(() => {
    // Check custom themes first
    if (state.customThemes.has(state.currentTheme)) {
      return state.customThemes.get(state.currentTheme);
    }
    
    // Fallback to built-in themes
    return themes[state.currentTheme] || themes.light;
  }, [state.currentTheme, state.customThemes]);

  // Set theme
  const setTheme = useCallback((themeName) => {
    dispatch({ type: THEME_ACTIONS.SET_THEME, theme: themeName });
    setSavedThemeConfig(prev => ({ ...prev, currentTheme: themeName }));
  }, [setSavedThemeConfig]);

  // Set preference
  const setPreference = useCallback((key, value) => {
    dispatch({ type: THEME_ACTIONS.SET_PREFERENCE, key, value });
    setSavedThemeConfig(prev => ({
      ...prev,
      preferences: { ...prev.preferences, [key]: value }
    }));
  }, [setSavedThemeConfig]);

  // Set component setting
  const setComponentSetting = useCallback((component, setting, value) => {
    dispatch({ 
      type: THEME_ACTIONS.SET_COMPONENT_SETTING, 
      component, 
      setting, 
      value 
    });
    setSavedThemeConfig(prev => ({
      ...prev,
      componentSettings: {
        ...prev.componentSettings,
        [component]: {
          ...prev.componentSettings[component],
          [setting]: value
        }
      }
    }));
  }, [setSavedThemeConfig]);

  // Add custom theme
  const addCustomTheme = useCallback((name, themeConfig) => {
    dispatch({ 
      type: THEME_ACTIONS.ADD_CUSTOM_THEME, 
      name, 
      theme: themeConfig 
    });
    setSavedThemeConfig(prev => ({
      ...prev,
      customThemes: { ...prev.customThemes, [name]: themeConfig }
    }));
  }, [setSavedThemeConfig]);

  // Remove custom theme
  const removeCustomTheme = useCallback((name) => {
    dispatch({ type: THEME_ACTIONS.REMOVE_CUSTOM_THEME, name });
    setSavedThemeConfig(prev => {
      const newCustomThemes = { ...prev.customThemes };
      delete newCustomThemes[name];
      return { ...prev, customThemes: newCustomThemes };
    });
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

  // Disable auto theme
  const disableAutoTheme = useCallback(() => {
    setPreference('autoTheme', false);
  }, [setPreference]);

  // Get CSS variables for current theme
  const getCSSVariables = useCallback(() => {
    const theme = getCurrentTheme();
    const variables = {};
    
    // Colors
    Object.entries(theme.colors).forEach(([key, value]) => {
      variables[`--color-${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`] = value;
    });
    
    // Spacing
    Object.entries(theme.spacing).forEach(([key, value]) => {
      variables[`--spacing-${key}`] = value;
    });
    
    // Border radius
    Object.entries(theme.borderRadius).forEach(([key, value]) => {
      variables[`--radius-${key}`] = value;
    });
    
    // Shadows
    Object.entries(theme.shadows).forEach(([key, value]) => {
      variables[`--shadow-${key}`] = value;
    });
    
    // Font size adjustments
    const fontSizeMultiplier = {
      small: 0.875,
      medium: 1,
      large: 1.125
    }[state.preferences.fontSize];
    
    variables['--font-size-multiplier'] = fontSizeMultiplier;
    
    // Density adjustments
    const densityMultiplier = {
      compact: 0.75,
      comfortable: 1,
      spacious: 1.25
    }[state.preferences.density];
    
    variables['--density-multiplier'] = densityMultiplier;
    
    return variables;
  }, [getCurrentTheme, state.preferences]);

  // Apply CSS variables to document root
  const applyCSSVariables = useCallback(() => {
    const variables = getCSSVariables();
    const root = document.documentElement;
    
    Object.entries(variables).forEach(([property, value]) => {
      root.style.setProperty(property, value);
    });
  }, [getCSSVariables]);

  // Get chart color palette
  const getChartColors = useCallback(() => {
    const theme = getCurrentTheme();
    const colorScheme = state.componentSettings.charts.colorScheme;
    
    const palettes = {
      default: [
        theme.colors.primary,
        theme.colors.accent,
        theme.colors.success,
        theme.colors.warning,
        theme.colors.error,
        theme.colors.info,
        theme.colors.secondary
      ],
      colorblind: [
        '#1f77b4', '#ff7f0e', '#2ca02c', '#d62728',
        '#9467bd', '#8c564b', '#e377c2', '#7f7f7f'
      ],
      monochrome: [
        theme.colors.text,
        theme.colors.textSecondary,
        theme.colors.textMuted,
        theme.colors.border,
        theme.colors.surface,
        theme.colors.surfaceHover
      ]
    };
    
    return palettes[colorScheme] || palettes.default;
  }, [getCurrentTheme, state.componentSettings.charts.colorScheme]);

  // Get responsive breakpoint
  const getBreakpoint = useCallback(() => {
    const width = window.innerWidth;
    
    if (width >= state.breakpoints.xxl) return 'xxl';
    if (width >= state.breakpoints.xl) return 'xl';
    if (width >= state.breakpoints.lg) return 'lg';
    if (width >= state.breakpoints.md) return 'md';
    if (width >= state.breakpoints.sm) return 'sm';
    return 'xs';
  }, [state.breakpoints]);

  // Export theme configuration
  const exportThemeConfig = useCallback(() => {
    return {
      currentTheme: state.currentTheme,
      preferences: state.preferences,
      componentSettings: state.componentSettings,
      customThemes: Object.fromEntries(state.customThemes),
      exportedAt: new Date().toISOString()
    };
  }, [state]);

  // Import theme configuration
  const importThemeConfig = useCallback((config) => {
    try {
      const { customThemes, ...restConfig } = config;
      
      // Convert custom themes back to Map
      const customThemesMap = new Map(Object.entries(customThemes || {}));
      
      dispatch({
        type: THEME_ACTIONS.IMPORT_THEME_CONFIG,
        config: {
          ...restConfig,
          customThemes: customThemesMap
        }
      });
      
      setSavedThemeConfig(config);
      return true;
    } catch (error) {
      console.error('Failed to import theme config:', error);
      return false;
    }
  }, [setSavedThemeConfig]);

  // Reset all preferences
  const resetPreferences = useCallback(() => {
    dispatch({ type: THEME_ACTIONS.RESET_PREFERENCES });
    setSavedThemeConfig(prev => ({
      ...prev,
      preferences: initialState.preferences,
      componentSettings: initialState.componentSettings
    }));
  }, [setSavedThemeConfig]);

  // Apply CSS variables when theme changes
  useEffect(() => {
    applyCSSVariables();
  }, [applyCSSVariables]);

  // Load saved theme configuration on mount
  useEffect(() => {
    if (savedThemeConfig.currentTheme) {
      dispatch({ type: THEME_ACTIONS.SET_THEME, theme: savedThemeConfig.currentTheme });
    }
    
    if (savedThemeConfig.preferences) {
      Object.entries(savedThemeConfig.preferences).forEach(([key, value]) => {
        dispatch({ type: THEME_ACTIONS.SET_PREFERENCE, key, value });
      });
    }
    
    if (savedThemeConfig.componentSettings) {
      Object.entries(savedThemeConfig.componentSettings).forEach(([component, settings]) => {
        Object.entries(settings).forEach(([setting, value]) => {
          dispatch({ 
            type: THEME_ACTIONS.SET_COMPONENT_SETTING, 
            component, 
            setting, 
            value 
          });
        });
      });
    }
    
    if (savedThemeConfig.customThemes) {
      Object.entries(savedThemeConfig.customThemes).forEach(([name, theme]) => {
        dispatch({ type: THEME_ACTIONS.ADD_CUSTOM_THEME, name, theme });
      });
    }
  }, [savedThemeConfig]);

  // Handle auto theme preference
  useEffect(() => {
    if (state.preferences.autoTheme) {
      return enableAutoTheme();
    }
  }, [state.preferences.autoTheme, enableAutoTheme]);

  // Context value
  const contextValue = {
    // Current state
    currentTheme: state.currentTheme,
    theme: getCurrentTheme(),
    preferences: state.preferences,
    componentSettings: state.componentSettings,
    customThemes: Array.from(state.customThemes.keys()),
    breakpoints: state.breakpoints,
    
    // Theme management
    setTheme,
    toggleTheme,
    availableThemes: [...Object.keys(themes), ...Array.from(state.customThemes.keys())],
    
    // Preferences
    setPreference,
    resetPreferences,
    
    // Component settings
    setComponentSetting,
    
    // Custom themes
    addCustomTheme,
    removeCustomTheme,
    
    // Auto theme
    enableAutoTheme,
    disableAutoTheme,
    
    // Utilities
    getCSSVariables,
    applyCSSVariables,
    getChartColors,
    getBreakpoint,
    
    // Import/Export
    exportThemeConfig,
    importThemeConfig,
    
    // Helper functions
    isDarkTheme: () => {
      const theme = getCurrentTheme();
      return theme.name === 'dark' || theme.colors.background === '#0f172a';
    },
    isHighContrast: () => state.preferences.highContrast,
    isAnimationsEnabled: () => state.preferences.animations && !state.preferences.reducedMotion,
    
	// Responsive utilities
	// Responsive utilities
isBreakpoint: (breakpoint) => getBreakpoint()
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};
