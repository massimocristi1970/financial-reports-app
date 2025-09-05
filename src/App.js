import React, { Suspense, lazy, useEffect } from 'react'; // ADD useEffect HERE
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { DataProvider } from './contexts/DataContext';
import { FilterProvider } from './contexts/FilterContext';
import { ThemeProvider } from './contexts/ThemeContext';
import Layout from './components/common/Layout';
import LoadingSpinner from './components/common/LoadingSpinner';
import './App.css';

// Lazy load dashboard components for better performance
const OverviewDashboard = lazy(() => import('./components/dashboards/OverviewDashboard'));
const LendingDashboard = lazy(() => import('./components/dashboards/LendingDashboard'));
const ArrearsDashboard = lazy(() => import('./components/dashboards/ArrearsDashboard'));
const LiquidationsDashboard = lazy(() => import('./components/dashboards/LiquidationsDashboard'));
const CallCenterDashboard = lazy(() => import('./components/dashboards/CallCenterDashboard'));
const ComplaintsDashboard = lazy(() => import('./components/dashboards/ComplaintsDashboard'));
const AdminPanel = lazy(() => import('./components/admin/AdminPanel'));

// Route loading component
const RouteLoader = ({ children }) => (
  <Suspense fallback={
    <div className="route-loading">
      <LoadingSpinner />
      <p>Loading dashboard...</p>
    </div>
  }>
    {children}
  </Suspense>
);

// Protected route wrapper for admin functionality
const ProtectedRoute = ({ children, requiresAdmin = false }) => {
  const isAuthenticated = true;
  const isAdmin = true;
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (requiresAdmin && !isAdmin) {
    return <Navigate to="/" replace />;
  }
  
  return children;
};

// App error fallback component
const AppErrorFallback = ({ error, resetErrorBoundary }) => (
  <div className="app-error-fallback">
    <div className="error-container">
      <h1>Something went wrong</h1>
      <p>We're sorry, but something unexpected happened.</p>
      <details className="error-details">
        <summary>Error details</summary>
        <pre>{error.message}</pre>
      </details>
      <div className="error-actions">
        <button onClick={resetErrorBoundary} className="btn btn-primary">
          Try again
        </button>
        <button onClick={() => window.location.reload()} className="btn btn-secondary">
          Reload page
        </button>
      </div>
    </div>
  </div>
);

function App() {
  // ADD THE useEffect HERE, INSIDE THE App FUNCTION:
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleThemeChange = (e) => {
      document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light');
    };
    
    handleThemeChange(mediaQuery);
    mediaQuery.addEventListener('change', handleThemeChange);
    
    return () => mediaQuery.removeEventListener('change', handleThemeChange);
  }, []);

  return (
    <ErrorBoundary fallback={AppErrorFallback}>
      <ThemeProvider>
        <DataProvider>
          <FilterProvider>
            <Router basename={process.env.NODE_ENV === 'production' ? '/dashboard' : ''}>
              <Layout>
                <Routes>
                  {/* ... all your routes stay the same ... */}
                </Routes>
              </Layout>
            </Router>
          </FilterProvider>
        </DataProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;