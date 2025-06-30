// src/components/charts/KPICard.js
import React from 'react';
import { formatCurrency, formatPercentage, formatNumber } from '../../utils/formatters';

const KPICard = ({
  title,
  value,
  previousValue,
  format = 'number',
  icon,
  trend = 'neutral',
  subtitle,
  target,
  status = 'normal',
  onClick,
  isLoading = false,
  size = 'medium'
}) => {
  // Format value based on type
  const formatValue = (val) => {
    if (val === null || val === undefined || isNaN(val)) return 'N/A';
    
    switch (format) {
      case 'currency':
        return formatCurrency(val);
      case 'percentage':
        return formatPercentage(val);
      case 'number':
      default:
        return formatNumber(val);
    }
  };

  // Calculate change from previous value
  const calculateChange = () => {
    if (!previousValue || !value || isNaN(previousValue) || isNaN(value)) {
      return { change: 0, changePercent: 0, direction: 'neutral' };
    }

    const change = value - previousValue;
    const changePercent = (change / previousValue) * 100;
    const direction = change > 0 ? 'up' : change < 0 ? 'down' : 'neutral';

    return { change, changePercent, direction };
  };

  const { change, changePercent, direction } = calculateChange();

  // Determine trend icon
  const getTrendIcon = () => {
    switch (direction) {
      case 'up':
        return '📈';
      case 'down':
        return '📉';
      default:
        return '➡️';
    }
  };

  // Determine status color
  const getStatusClass = () => {
    if (status === 'success') return 'kpi-success';
    if (status === 'warning') return 'kpi-warning';
    if (status === 'danger') return 'kpi-danger';
    return 'kpi-normal';
  };

  // Check if target is met
  const isTargetMet = target && value >= target;

  const cardClasses = [
    'kpi-card',
    `kpi-${size}`,
    getStatusClass(),
    direction !== 'neutral' ? `kpi-trend-${direction}` : '',
    onClick ? 'kpi-clickable' : '',
    isLoading ? 'kpi-loading' : ''
  ].filter(Boolean).join(' ');

  if (isLoading) {
    return (
      <div className={cardClasses}>
        <div className="kpi-loading-content">
          <div className="kpi-loading-spinner"></div>
          <div className="kpi-loading-text">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={cardClasses}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <div className="kpi-header">
        {icon && <div className="kpi-icon">{icon}</div>}
        <div className="kpi-title-section">
          <h3 className="kpi-title">{title}</h3>
          {subtitle && <p className="kpi-subtitle">{subtitle}</p>}
        </div>
      </div>

      <div className="kpi-value-section">
        <div className="kpi-main-value">
          {formatValue(value)}
        </div>

        {previousValue && (
          <div className="kpi-change">
            <span className={`kpi-trend kpi-trend-${direction}`}>
              {getTrendIcon()}
              <span className="kpi-change-value">
                {formatValue(Math.abs(change))}
              </span>
              <span className="kpi-change-percent">
                ({Math.abs(changePercent).toFixed(1)}%)
              </span>
            </span>
          </div>
        )}
      </div>

      {target && (
        <div className="kpi-target">
          <div className="kpi-target-label">Target: {formatValue(target)}</div>
          <div className={`kpi-target-status ${isTargetMet ? 'met' : 'not-met'}`}>
            {isTargetMet ? '✅ Target Met' : '⚠️ Below Target'}
          </div>
          <div className="kpi-progress-bar">
            <div 
              className="kpi-progress-fill"
              style={{ width: `${Math.min((value / target) * 100, 100)}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

// Specialized KPI Cards
export const CurrencyKPICard = (props) => (
  <KPICard {...props} format="currency" />
);

export const PercentageKPICard = (props) => (
  <KPICard {...props} format="percentage" />
);

export const CountKPICard = (props) => (
  <KPICard {...props} format="number" />
);

export default KPICard; 
