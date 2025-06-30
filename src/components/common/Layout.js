// src/components/common/Layout.js
import React, { useState, useEffect } from 'react';
import Header from './Header';
import Navigation from './Navigation';
import LoadingSpinner from './LoadingSpinner';
import ErrorBoundary from './ErrorBoundary';

const Layout = ({ 
  children, 
  currentPath = '/', 
  currentReport = null,
  isLoading = false,
  error = null,
  onNavigate,
  showUploadButton = false,
  onUploadClick
}) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
      if (window.innerWidth <= 768) {
        setSidebarCollapsed(true);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleNavigate = (path, item) => {
    if (isMobile) {
      setSidebarCollapsed(true);
    }
    if (onNavigate) {
      onNavigate(path, item);
    }
  };

  if (error) {
    return (
      <div className="layout error-layout">
        <Header currentReport={currentReport} />
        <div className="error-container">
          <div className="error-message">
            <h3>⚠️ Something went wrong</h3>
            <p>{error.message || 'An unexpected error occurred'}</p>
            <button 
              className="retry-button"
              onClick={() => window.location.reload()}
            >
              Reload Page
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`layout ${sidebarCollapsed ? 'sidebar-collapsed' : ''} ${isMobile ? 'mobile' : ''}`}>
      <Header 
        currentReport={currentReport}
        showUploadButton={showUploadButton}
        onUploadClick={onUploadClick}
      />
      
      <div className="layout-body">
        <Navigation 
          currentPath={currentPath}
          onNavigate={handleNavigate}
        />
        
        <main className="main-content">
          <ErrorBoundary>
            {isLoading ? (
              <div className="loading-container">
                <LoadingSpinner message="Loading dashboard..." />
              </div>
            ) : (
              <div className="content-wrapper">
                {children}
              </div>
            )}
          </ErrorBoundary>
        </main>
      </div>
      
      {isMobile && !sidebarCollapsed && (
        <div 
          className="mobile-overlay"
          onClick={() => setSidebarCollapsed(true)}
        />
      )}
    </div>
  );
};

export default Layout; 
