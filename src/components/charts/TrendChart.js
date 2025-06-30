// src/components/charts/TrendChart.js
import React, { useRef, useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { CHART_CONFIG } from '../../config/chartConfig';
import { formatCurrency, formatNumber, formatPercentage } from '../../utils/formatters';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const TrendChart = ({
  data,
  title,
  height = 400,
  showLegend = true,
  showGrid = true,
  showTrendLine = true,
  showConfidenceBands = false,
  formatType = 'number',
  colors = CHART_CONFIG.colors.primary,
  onPointClick,
  isLoading = false,
  error = null,
  timeframe = 'monthly' // 'daily', 'weekly', 'monthly', 'quarterly', 'yearly'
}) => {
  const chartRef = useRef(null);
  const [chartInstance, setChartInstance] = useState(null);
  const [trendData, setTrendData] = useState(null);

  // Format values
  const formatValue = (value) => {
    switch (formatType) {
      case 'currency':
        return formatCurrency(value);
      case 'percentage':
        return formatPercentage(value / 100);
      case 'number':
      default:
        return formatNumber(value);
    }
  };

  // Calculate trend line using linear regression
  const calculateTrendLine = (dataPoints) => {
    if (!dataPoints || dataPoints.length < 2) return null;

    const n = dataPoints.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;

    dataPoints.forEach((point, index) => {
      const x = index;
      const y = point;
      sumX += x;
      sumY += y;
      sumXY += x * y;
      sumXX += x * x;
    });

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    return dataPoints.map((_, index) => slope * index + intercept);
  };

  // Calculate moving average
  const calculateMovingAverage = (dataPoints, window = 3) => {
    if (!dataPoints || dataPoints.length < window) return dataPoints;

    return dataPoints.map((_, index, array) => {
      if (index < window - 1) return null;
      
      const slice = array.slice(index - window + 1, index + 1);
      return slice.reduce((sum, val) => sum + val, 0) / window;
    });
  };

  // Calculate confidence bands (simple standard deviation approach)
  const calculateConfidenceBands = (dataPoints, trendLine) => {
    if (!dataPoints || !trendLine) return null;

    const residuals = dataPoints.map((point, index) => point - trendLine[index]);
    const stdDev = Math.sqrt(
      residuals.reduce((sum, residual) => sum + residual * residual, 0) / residuals.length
    );

    return {
      upper: trendLine.map(point => point + 1.96 * stdDev), // 95% confidence
      lower: trendLine.map(point => point - 1.96 * stdDev)
    };
  };

  // Process data and calculate trend
  useEffect(() => {
    if (data && data.datasets && data.datasets.length > 0) {
      const primaryDataset = data.datasets[0];
      const dataPoints = primaryDataset.data;
      
      const trendLine = showTrendLine ? calculateTrendLine(dataPoints) : null;
      const movingAverage = calculateMovingAverage(dataPoints);
      const confidenceBands = showConfidenceBands && trendLine ? 
        calculateConfidenceBands(dataPoints, trendLine) : null;

      setTrendData({
        trendLine,
        movingAverage,
        confidenceBands
      });
    }
  }, [data, showTrendLine, showConfidenceBands]);

  // Chart configuration
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      title: {
        display: !!title,
        text: title,
        font: {
          size: 16,
          weight: 'bold'
        },
        color: CHART_CONFIG.colors.text
      },
      legend: {
        display: showLegend,
        position: 'top',
        labels: {
          usePointStyle: true,
          color: CHART_CONFIG.colors.text
        }
      },
      tooltip: {
        backgroundColor: CHART_CONFIG.colors.tooltipBg,
        titleColor: CHART_CONFIG.colors.text,
        bodyColor: CHART_CONFIG.colors.text,
        borderColor: CHART_CONFIG.colors.border,
        borderWidth: 1,
        callbacks: {
          label: function(context) {
            const label = context.dataset.label || '';
            const value = formatValue(context.parsed.y);
            return `${label}: ${value}`;
          }
        }
      }
    },
    scales: {
      x: {
        display: true,
        grid: {
          display: showGrid,
          color: CHART_CONFIG.colors.gridLines
        },
        ticks: {
          color: CHART_CONFIG.colors.text
        }
      },
      y: {
        display: true,
        grid: {
          display: showGrid,
          color: CHART_CONFIG.colors.gridLines
        },
        ticks: {
          color: CHART_CONFIG.colors.text,
          callback: function(value) {
            return formatValue(value);
          }
        }
      }
    },
    elements: {
      line: {
        tension: 0.1,
        borderWidth: 2
      },
      point: {
        radius: 4,
        hoverRadius: 6,
        borderWidth: 2,
        backgroundColor: '#fff'
      }
    },
    onClick: (event, elements) => {
      if (elements.length > 0 && onPointClick) {
        const datasetIndex = elements[0].datasetIndex;
        const index = elements[0].index;
        const dataset = data.datasets[datasetIndex];
        const value = dataset.data[index];
        const label = data.labels[index];
        
        onPointClick({
          datasetIndex,
          index,
          value,
          label,
          dataset: dataset.label
        });
      }
    }
  };

  // Process chart data with trend analysis
  const processedData = {
    ...data,
    datasets: [
      // Original datasets
      ...(data.datasets?.map((dataset, index) => ({
        ...dataset,
        borderColor: dataset.borderColor || colors[index % colors.length],
        backgroundColor: dataset.backgroundColor || `${colors[index % colors.length]}20`,
        fill: false,
        pointBackgroundColor: '#fff',
        pointBorderColor: dataset.borderColor || colors[index % colors.length],
        pointHoverBackgroundColor: dataset.borderColor || colors[index % colors.length],
        pointHoverBorderColor: '#fff'
      })) || []),
      
      // Trend line
      ...(showTrendLine && trendData?.trendLine ? [{
        label: 'Trend',
        data: trendData.trendLine,
        borderColor: CHART_CONFIG.colors.trend,
        backgroundColor: 'transparent',
        borderDash: [5, 5],
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 0,
        fill: false
      }] : []),

      // Moving average
      ...(trendData?.movingAverage ? [{
        label: 'Moving Average',
        data: trendData.movingAverage,
        borderColor: CHART_CONFIG.colors.secondary[0],
        backgroundColor: 'transparent',
        borderWidth: 1,
        pointRadius: 2,
        pointHoverRadius: 4,
        fill: false
      }] : []),

      // Confidence bands
      ...(showConfidenceBands && trendData?.confidenceBands ? [
        {
          label: 'Upper Confidence',
          data: trendData.confidenceBands.upper,
          borderColor: 'transparent',
          backgroundColor: `${CHART_CONFIG.colors.trend}10`,
          fill: '+1',
          pointRadius: 0,
          pointHoverRadius: 0
        },
        {
          label: 'Lower Confidence',
          data: trendData.confidenceBands.lower,
          borderColor: 'transparent',
          backgroundColor: `${CHART_CONFIG.colors.trend}10`,
          fill: false,
          pointRadius: 0,
          pointHoverRadius: 0
        }
      ] : [])
    ]
  };

  useEffect(() => {
    if (chartRef.current) {
      setChartInstance(chartRef.current);
    }
  }, []);

  // Loading state
  if (isLoading) {
    return (
      <div className="chart-container trend-chart-container" style={{ height }}>
        <div className="chart-loading">
          <div className="chart-loading-spinner"></div>
          <div className="chart-loading-text">Analyzing trends...</div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="chart-container trend-chart-container" style={{ height }}>
        <div className="chart-error">
          <div className="chart-error-icon">⚠️</div>
          <div className="chart-error-message">
            <h4>Chart Error</h4>
            <p>{error.message || 'Failed to load trend data'}</p>
          </div>
        </div>
      </div>
    );
  }

  // No data state
  if (!data || !data.datasets || data.datasets.length === 0) {
    return (
      <div className="chart-container trend-chart-container" style={{ height }}>
        <div className="chart-no-data">
          <div className="chart-no-data-icon">📈</div>
          <div className="chart-no-data-message">
            <h4>No Trend Data Available</h4>
            <p>No data to analyze trends</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="chart-container trend-chart-container" style={{ height }}>
      <Line 
        ref={chartRef}
        data={processedData} 
        options={chartOptions}
      />
      
      {/* Trend analysis summary */}
      {trendData && (
        <div className="trend-summary">
          <div className="trend-stats">
            {trendData.trendLine && (
              <div className="trend-stat">
                <span className="trend-label">Trend:</span>
                <span className={`trend-value ${
                  trendData.trendLine[trendData.trendLine.length - 1] > trendData.trendLine[0] 
                    ? 'positive' : 'negative'
                }`}>
                  {trendData.trendLine[trendData.trendLine.length - 1] > trendData.trendLine[0] 
                    ? '📈 Increasing' : '📉 Decreasing'}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TrendChart; 
