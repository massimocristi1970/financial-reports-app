// src/components/charts/BarChart.js
import React, { useRef, useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { CHART_CONFIG } from '../../config/chartConfig';
import { formatCurrency, formatNumber, formatPercentage } from '../../utils/formatters';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const BarChart = ({
  data,
  title,
  height = 400,
  orientation = 'vertical', // 'vertical' or 'horizontal'
  showLegend = true,
  showGrid = true,
  stacked = false,
  formatType = 'number',
  colors = CHART_CONFIG.colors.primary,
  onBarClick,
  showValues = false,
  isLoading = false,
  error = null
}) => {
  const chartRef = useRef(null);
  const [chartInstance, setChartInstance] = useState(null);

  // Format tooltip and label values
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

  // Chart configuration
  const chartOptions = {
    indexAxis: orientation === 'horizontal' ? 'y' : 'x',
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
            const value = formatValue(context.parsed.y || context.parsed.x);
            return `${label}: ${value}`;
          }
        }
      },
      datalabels: showValues ? {
        display: true,
        color: CHART_CONFIG.colors.text,
        formatter: (value) => formatValue(value),
        anchor: 'end',
        align: 'top'
      } : false
    },
    scales: {
      x: {
        display: true,
        stacked: stacked,
        grid: {
          display: showGrid,
          color: CHART_CONFIG.colors.gridLines
        },
        ticks: {
          color: CHART_CONFIG.colors.text,
          callback: orientation === 'horizontal' ? 
            function(value) { return formatValue(value); } : 
            undefined
        }
      },
      y: {
        display: true,
        stacked: stacked,
        grid: {
          display: showGrid,
          color: CHART_CONFIG.colors.gridLines
        },
        ticks: {
          color: CHART_CONFIG.colors.text,
          callback: orientation === 'vertical' ? 
            function(value) { return formatValue(value); } : 
            undefined
        }
      }
    },
    onClick: (event, elements) => {
      if (elements.length > 0 && onBarClick) {
        const datasetIndex = elements[0].datasetIndex;
        const index = elements[0].index;
        const dataset = data.datasets[datasetIndex];
        const value = dataset.data[index];
        const label = data.labels[index];
        
        onBarClick({
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
      backgroundColor: dataset.backgroundColor || colors[index % colors.length],
      borderColor: dataset.borderColor || colors[index % colors.length],
      borderWidth: dataset.borderWidth || 1,
      borderRadius: dataset.borderRadius || 4,
      borderSkipped: false,
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
      <div className="chart-container bar-chart-container" style={{ height }}>
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
      <div className="chart-container bar-chart-container" style={{ height }}>
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
      <div className="chart-container bar-chart-container" style={{ height }}>
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
    <div className="chart-container bar-chart-container" style={{ height }}>
      <Bar 
        ref={chartRef}
        data={processedData} 
        options={chartOptions}
      />
    </div>
  );
};

// Specialized Bar Charts
export const HorizontalBarChart = (props) => (
  <BarChart {...props} orientation="horizontal" />
);

export const StackedBarChart = (props) => (
  <BarChart {...props} stacked={true} />
);

export default BarChart; 
