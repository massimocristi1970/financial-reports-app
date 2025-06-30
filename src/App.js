import React, { Suspense, lazy } from 'react';
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
  // In a real app, you'd check authentication here
  const isAuthenticated = true; // Replace with actual auth check
  const isAdmin = true; // Replace with actual admin check
  
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
  return (
    <ErrorBoundary fallback={AppErrorFallback}>
      <ThemeProvider>
        <DataProvider>
          <FilterProvider>
            <Router basename={process.env.NODE_ENV === 'production' ? '/financial-reports-app' : ''}>
              <div className="App">
                <Layout>
                  <main className="main-content">
                    <Routes>
                      {/* Default route - redirect to overview */}
                      <Route path="/" element={<Navigate to="/overview" replace />} />
                      
                      {/* Dashboard routes */}
                      <Route 
                        path="/overview" 
                        element={
                          <RouteLoader>
                            <OverviewDashboard />
                          </RouteLoader>
                        } 
                      />
                      
                      <Route 
                        path="/lending" 
                        element={
                          <RouteLoader>
                            <LendingDashboard />
                          </RouteLoader>
                        } 
                      />
                      
                      <Route 
                        path="/arrears" 
                        element={
                          <RouteLoader>
                            <ArrearsDashboard />
                          </RouteLoader>
                        } 
                      />
                      
                      <Route 
                        path="/liquidations" 
                        element={
                          <RouteLoader>
                            <LiquidationsDashboard />
                          </RouteLoader>
                        } 
                      />
                      
                      <Route 
                        path="/call-center" 
                        element={
                          <RouteLoader>
                            <CallCenterDashboard />
                          </RouteLoader>
                        } 
                      />
                      
                      <Route 
                        path="/complaints" 
                        element={
                          <RouteLoader>
                            <ComplaintsDashboard />
                          </RouteLoader>
                        } 
                      />
                      
                      {/* Admin route - protected */}
                      <Route 
                        path="/admin" 
                        element={
                          <ProtectedRoute requiresAdmin={true}>
                            <RouteLoader>
                              <AdminPanel />
                            </RouteLoader>
                          </ProtectedRoute>
                        } 
                      />
                      
                      {/* Catch-all route for 404s */}
                      <Route 
                        path="*" 
                        element={
                          <div className="not-found">
                            <h1>Page Not Found</h1>
                            <p>The page you're looking for doesn't exist.</p>
                            <button onClick={() => window.history.back()} className="btn btn-primary">
                              Go Back
                            </button>
                          </div>
                        } 
                      />
                    </Routes>
                  </main>
                </Layout>
              </div>
            </Router>
          </FilterProvider>
        </DataProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;