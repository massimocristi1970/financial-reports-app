// src/components/common/ErrorBoundary.js
import React from 'react';

// LoadingSpinner components
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

// Proper ErrorBoundary class component
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // You can log the error to an error reporting service here
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, () => this.setState({ hasError: false, error: null, errorInfo: null }));
      }
      
      return (
        <div className="error-boundary">
          <div className="error-content">
            <h2>⚠️ Something went wrong</h2>
            <p>We're sorry, but something unexpected happened.</p>
            <details className="error-details">
              <summary>Error details</summary>
              <pre>{this.state.error && this.state.error.toString()}</pre>
              <pre>{this.state.errorInfo.componentStack}</pre>
            </details>
            <button 
              onClick={() => this.setState({ hasError: false, error: null, errorInfo: null })}
              className="retry-button"
            >
              Try again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default LoadingSpinner;