// src/components/charts/PieChart.js
import React, { useRef, useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js';
import { Doughnut, Pie } from 'react-chartjs-2';
import { CHART_CONFIG } from '../../config/chartConfig';
import { formatCurrency, formatNumber, formatPercentage } from '../../utils/formatters';

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend);

const PieChart = ({
  data,
  title,
  height = 400,
  variant = 'pie', // 'pie' or 'doughnut'
  showLegend = true,
  showLabels = true,
  formatType = 'number',
  colors = CHART_CONFIG.colors.primary,
  onSegmentClick,
  cutout = variant === 'doughnut' ? '50%' : '0%',
  isLoading = false,
  error = null,
  centerText = null // For doughnut charts
}) => {
  const chartRef = useRef(null);
  const [chartInstance, setChartInstance] = useState(null);

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

  // Calculate percentages for labels
  const calculatePercentage = (value, total) => {
    return ((value / total) * 100).toFixed(1);
  };

  const total = data?.datasets?.[0]?.data?.reduce((sum, value) => sum + value, 0) || 0;

  // Chart configuration
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: cutout,
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
        position: 'right',
        labels: {
          usePointStyle: true,
          color: CHART_CONFIG.colors.text,
          generateLabels: function(chart) {
            const data = chart.data;
            if (data.labels.length && data.datasets.length) {
              return data.labels.map((label, i) => {
                const value = data.datasets[0].data[i];
                const percentage = calculatePercentage(value, total);
                
                return {
                  text: showLabels ? 
                    `${label}: ${formatValue(value)} (${percentage}%)` : 
                    label,
                  fillStyle: data.datasets[0].backgroundColor[i],
                  strokeStyle: data.datasets[0].borderColor?.[i] || '#fff',
                  lineWidth: 2,
                  index: i
                };
              });
            }
            return [];
          }
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
            const label = context.label || '';
            const value = context.parsed;
            const percentage = calculatePercentage(value, total);
            return `${label}: ${formatValue(value)} (${percentage}%)`;
          }
        }
      }
    },
    onClick: (event, elements) => {
      if (elements.length > 0 && onSegmentClick) {
        const index = elements[0].index;
        const value = data.datasets[0].data[index];
        const label = data.labels[index];
        const percentage = calculatePercentage(value, total);
        
        onSegmentClick({
          index,
          value,
          label,
          percentage
        });
      }
    }
  };

  // Process chart data
  const processedData = {
    ...data,
    datasets: data.datasets?.map((dataset, datasetIndex) => ({
      ...dataset,
      backgroundColor: dataset.backgroundColor || colors,
      borderColor: dataset.borderColor || Array(data.labels?.length || 0).fill('#fff'),
      borderWidth: dataset.borderWidth || 2,
      hoverBorderWidth: dataset.hoverBorderWidth || 3,
      hoverBorderColor: '#fff'
    })) || []
  };

  useEffect(() => {
    if (chartRef.current) {
      setChartInstance(chartRef.current);
    }
  }, []);

  // Custom plugin for center text in doughnut charts
  const centerTextPlugin = {
    id: 'centerText',
    beforeDraw: (chart) => {
      if (variant === 'doughnut' && centerText) {
        const { ctx, chartArea } = chart;
        const centerX = (chartArea.left + chartArea.right) / 2;
        const centerY = (chartArea.top + chartArea.bottom) / 2;

        ctx.save();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        if (typeof centerText === 'string') {
          ctx.font = 'bold 16px Arial';
          ctx.fillStyle = CHART_CONFIG.colors.text;
          ctx.fillText(centerText, centerX, centerY);
        } else if (centerText.value !== undefined) {
          // Multi-line center text
          ctx.font = 'bold 20px Arial';
          ctx.fillStyle = CHART_CONFIG.colors.text;
          ctx.fillText(formatValue(centerText.value), centerX, centerY - 10);
          
          ctx.font = '12px Arial';
          ctx.fillStyle = CHART_CONFIG.colors.textSecondary;
          ctx.fillText(centerText.label || 'Total', centerX, centerY + 15);
        }
        ctx.restore();
      }
    }
  };

  // Register the plugin
  ChartJS.register(centerTextPlugin);

  // Loading state
  if (isLoading) {
    return (
      <div className="chart-container pie-chart-container" style={{ height }}>
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
      <div className="chart-container pie-chart-container" style={{ height }}>
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
  if (!data || !data.datasets || !data.datasets[0]?.data?.length) {
    return (
      <div className="chart-container pie-chart-container" style={{ height }}>
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

  const ChartComponent = variant === 'doughnut' ? Doughnut : Pie;

  return (
    <div className="chart-container pie-chart-container" style={{ height }}>
      <ChartComponent 
        ref={chartRef}
        data={processedData} 
        options={chartOptions}
        plugins={centerText ? [centerTextPlugin] : []}
      />
    </div>
  );
};

// Specialized Pie Charts
export const DoughnutChart = (props) => (
  <PieChart {...props} variant="doughnut" cutout="50%" />
);

export default PieChart; 
