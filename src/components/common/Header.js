// src/components/common/Header.js
import React from 'react';
import { APP_CONFIG } from '../../config/appConfig';

const Header = ({ currentReport, showUploadButton = false, onUploadClick }) => {
  const currentDate = new Date().toLocaleDateString('en-GB', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <header className="header">
      <div className="header-container">
        <div className="header-left">
          <div className="logo-section">
            <h1 className="app-title">{APP_CONFIG.appName}</h1>
            <span className="app-subtitle">{APP_CONFIG.appDescription}</span>
          </div>
        </div>
        
        <div className="header-center">
          {currentReport && (
            <div className="current-report">
              <h2 className="report-title">{currentReport.title}</h2>
              <span className="report-subtitle">{currentReport.description}</span>
            </div>
          )}
        </div>
        
        <div className="header-right">
          <div className="header-info">
            <span className="current-date">{currentDate}</span>
            {showUploadButton && (
              <button 
                className="upload-button"
                onClick={onUploadClick}
                title="Upload Data"
              >
                📁 Upload Data
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;