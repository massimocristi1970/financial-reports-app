// src/components/common/LoadingSpinner.js
import React from 'react';

const LoadingSpinner = ({ 
  message = 'Loading...', 
  size = 'medium',
  variant = 'default' 
}) => {
  const sizeClass = {
    small: 'spinner-small',
    medium: 'spinner-medium',
    large: 'spinner-large'
  }[size];

  const variantClass = {
    default: 'spinner-default',
    primary: 'spinner-primary',
    secondary: 'spinner-secondary'
  }[variant];

  return (
    <div className={`loading-spinner ${sizeClass} ${variantClass}`}>
      <div className="spinner">
        <div className="spinner-ring"></div>
        <div className="spinner-ring"></div>
        <div className="spinner-ring"></div>
        <div className="spinner-ring"></div>
      </div>
      {message && (
        <div className="loading-message">
          {message}
        </div>
      )}
    </div>
  );
};

// Alternative simple spinner for inline use
export const InlineSpinner = ({ size = 16 }) => (
  <div className="inline-spinner" style={{ width: size, height: size }}>
    <div className="spinner-simple"></div>
  </div>
);

// Progress spinner with percentage
export const ProgressSpinner = ({ progress = 0, message = 'Processing...' }) => (
  <div className="progress-spinner">
    <div className="progress-circle">
      <svg viewBox="0 0 100 100" className="progress-svg">
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke="#e0e0e0"
          strokeWidth="8"
        />
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke="#007bff"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={`${progress * 2.83} 283`}
          transform="rotate(-90 50 50)"
        />
      </svg>
      <div className="progress-text">
        {Math.round(progress)}%
      </div>
    </div>
    <div className="progress-message">{message}</div>
  </div>
);

export default LoadingSpinner; 
