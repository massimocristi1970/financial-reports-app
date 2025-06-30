// src/components/charts/LineChart.js
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

const LineChart = ({
  data,
  title,
  height = 400,
  showLegend = true,
  showGrid = true,
  smooth = true,
  fill = false,
  formatType = 'number',
  colors = CHART_CONFIG.colors.primary,
  onPointClick,
  isLoading = false,
  error = null
}) => {
  const chartRef = useRef(null);
  const [chartInstance, setChartInstance] = useState(null);

  // Format tooltip values
  const formatTooltipValue = (value) => {
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
            const value = formatTooltipValue(context.parsed.y);
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
            return formatTooltipValue(value);
          }
        }
      }
    },
    elements: {
      line: {
        tension: smooth ? 0.4 : 0,
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

  // Process chart data
  const processedData = {
    ...data,
    datasets: data.datasets?.map((dataset, index) => ({
      ...dataset,
      borderColor: dataset.borderColor || colors[index % colors.length],
      backgroundColor: fill 
        ? (dataset.backgroundColor || `${colors[index % colors.length]}20`)
        : (dataset.backgroundColor || colors[index % colors.length]),
      fill: fill,
      pointBackgroundColor: '#fff',
      pointBorderColor: dataset.borderColor || colors[index % colors.length],
      pointHoverBackgroundColor: dataset.borderColor || colors[index % colors.length],
      pointHoverBorderColor: '#fff'
    })) || []
  };

  useEffect(() => {
    if (chartRef.current) {
      setChartInstance(chartRef.current);
    }
  }, []);

  // Loading state
  if (isLoading) {
    return (
      <div className="chart-container line-chart-container" style={{ height }}>
        <div className="chart-loading">
          <div className="chart-loading-spinner"></div>
          <div className="chart-loading-text">Loading chart data...</div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="chart-container line-chart-container" style={{ height }}>
        <div className="chart-error">
          <div className="chart-error-icon">⚠️</div>
          <div className="chart-error-message">
            <h4>Chart Error</h4>
            <p>{error.message || 'Failed to load chart data'}</p>
          </div>
        </div>
      </div>
    );
  }

  // No data state
  if (!data || !data.datasets || data.datasets.length === 0) {
    return (
      <div className="chart-container line-chart-container" style={{ height }}>
        <div className="chart-no-data">
          <div className="chart-no-data-icon">📊</div>
          <div className="chart-no-data-message">
            <h4>No Data Available</h4>
            <p>No data to display in this chart</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="chart-container line-chart-container" style={{ height }}>
      <Line 
        ref={chartRef}
        data={processedData} 
        options={chartOptions}
      />
    </div>
  );
};

export default LineChart; 
