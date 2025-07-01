// src/config/chartConfig.js

export const CHART_COLORS = {
  primary: '#2563eb',
  secondary: '#7c3aed', 
  success: '#059669',
  warning: '#ea580c',
  danger: '#dc2626',
  info: '#0891b2',
  light: '#64748b',
  dark: '#1e293b'
};

export const CHART_PALETTE = [
  '#2563eb', '#7c3aed', '#059669', '#ea580c', '#dc2626', 
  '#0891b2', '#64748b', '#f59e0b', '#8b5cf6', '#06b6d4'
];

export const DEFAULT_CHART_OPTIONS = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top',
      labels: {
        usePointStyle: true,
        padding: 20,
        font: {
          size: 12
        }
      }
    },
    tooltip: {
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      titleColor: '#fff',
      bodyColor: '#fff',
      borderColor: '#374151',
      borderWidth: 1,
      cornerRadius: 8,
      displayColors: true
    }
  },
  scales: {
    x: {
      grid: {
        display: false
      },
      ticks: {
        font: {
          size: 11
        }
      }
    },
    y: {
      grid: {
        color: 'rgba(0, 0, 0, 0.1)'
      },
      ticks: {
        font: {
          size: 11
        }
      }
    }
  }
};

export const CHART_TYPES = {
  LINE: 'line',
  BAR: 'bar',
  PIE: 'pie',
  DOUGHNUT: 'doughnut',
  AREA: 'area'
};

export const CHART_CONFIGS = {
  // Lending Volume Charts
  lending_trend: {
    type: CHART_TYPES.LINE,
    title: 'Lending Volume Trend',
    xAxis: 'date',
    yAxis: 'amount',
    options: {
      ...DEFAULT_CHART_OPTIONS,
      scales: {
        ...DEFAULT_CHART_OPTIONS.scales,
        y: {
          ...DEFAULT_CHART_OPTIONS.scales.y,
          ticks: {
            callback: function(value) {
              return new Intl.NumberFormat('en-GB', {
                style: 'currency',
                currency: 'GBP',
                minimumFractionDigits: 0
              }).format(value);
            }
          }
        }
      }
    }
  },

  product_breakdown: {
    type: CHART_TYPES.PIE,
    title: 'Lending by Product Type',
    groupBy: 'product_type',
    aggregateBy: 'amount',
    options: DEFAULT_CHART_OPTIONS
  },

  regional_distribution: {
    type: CHART_TYPES.BAR,
    title: 'Lending by Region',
    groupBy: 'region',
    aggregateBy: 'amount',
    options: DEFAULT_CHART_OPTIONS
  },

  // Arrears Charts
  arrears_trend: {
    type: CHART_TYPES.LINE,
    title: 'Arrears Trend',
    xAxis: 'date',
    yAxis: 'arrears_amount',
    options: {
      ...DEFAULT_CHART_OPTIONS,
      scales: {
        ...DEFAULT_CHART_OPTIONS.scales,
        y: {
          ...DEFAULT_CHART_OPTIONS.scales.y,
          ticks: {
            callback: function(value) {
              return new Intl.NumberFormat('en-GB', {
                style: 'currency',
                currency: 'GBP'
              }).format(value);
            }
          }
        }
      }
    }
  },

  aging_analysis: {
    type: CHART_TYPES.BAR,
    title: 'Arrears Aging Analysis',
    groupBy: 'days_overdue_bucket',
    aggregateBy: 'arrears_amount',
    options: DEFAULT_CHART_OPTIONS
  },

  product_performance: {
    type: CHART_TYPES.BAR,
    title: 'Arrears by Product',
    groupBy: 'product_type',
    aggregateBy: 'arrears_amount',
    options: DEFAULT_CHART_OPTIONS
  },

  // Liquidations Charts
  liquidation_trend: {
    type: CHART_TYPES.LINE,
    title: 'Liquidation Volume Trend',
    xAxis: 'date',
    yAxis: 'liquidation_amount',
    options: DEFAULT_CHART_OPTIONS
  },

  recovery_analysis: {
    type: CHART_TYPES.LINE,
    title: 'Recovery Rate Trend',
    xAxis: 'date',
    yAxis: 'recovery_rate',
    options: {
      ...DEFAULT_CHART_OPTIONS,
      scales: {
        ...DEFAULT_CHART_OPTIONS.scales,
        y: {
          ...DEFAULT_CHART_OPTIONS.scales.y,
          ticks: {
            callback: function(value) {
              return value + '%';
            }
          },
          min: 0,
          max: 100
        }
      }
    }
  },

  type_breakdown: {
    type: CHART_TYPES.DOUGHNUT,
    title: 'Liquidations by Type',
    groupBy: 'liquidation_type',
    aggregateBy: 'liquidation_amount',
    options: DEFAULT_CHART_OPTIONS
  },

  // Call Center Charts
  call_volume_trend: {
    type: CHART_TYPES.LINE,
    title: 'Daily Call Volume',
    xAxis: 'date',
    yAxis: 'calls_received',
    options: DEFAULT_CHART_OPTIONS
  },

  service_level_trend: {
    type: CHART_TYPES.LINE,
    title: 'Service Level Trend',
    xAxis: 'date',
    yAxis: 'service_level',
    options: {
      ...DEFAULT_CHART_OPTIONS,
      scales: {
        ...DEFAULT_CHART_OPTIONS.scales,
        y: {
          ...DEFAULT_CHART_OPTIONS.scales.y,
          ticks: {
            callback: function(value) {
              return value + '%';
            }
          },
          min: 0,
          max: 100
        }
      }
    }
  },

  performance_metrics: {
    type: CHART_TYPES.BAR,
    title: 'Call Center Performance Metrics',
    multiSeries: true,
    metrics: ['avg_wait_time', 'avg_handle_time', 'first_call_resolution'],
    options: DEFAULT_CHART_OPTIONS
  },

  // Complaints Charts
  complaint_trend: {
    type: CHART_TYPES.LINE,
    title: 'Daily Complaints Volume',
    xAxis: 'date',
    yAxis: 'complaint_count',
    options: DEFAULT_CHART_OPTIONS
  },

  complaint_type_breakdown: {
    type: CHART_TYPES.PIE,
    title: 'Complaints by Type',
    groupBy: 'complaint_type',
    aggregateBy: 'count',
    options: DEFAULT_CHART_OPTIONS
  },

  resolution_performance: {
    type: CHART_TYPES.BAR,
    title: 'Average Resolution Time by Type',
    groupBy: 'complaint_type',
    aggregateBy: 'resolution_time',
    options: {
      ...DEFAULT_CHART_OPTIONS,
      scales: {
        ...DEFAULT_CHART_OPTIONS.scales,
        y: {
          ...DEFAULT_CHART_OPTIONS.scales.y,
          ticks: {
            callback: function(value) {
              return value + ' days';
            }
          }
        }
      }
    }
  }
};

export const KPI_FORMATS = {
  currency: (value) => new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value),
  
  percentage: (value) => new Intl.NumberFormat('en-GB', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1
  }).format(value / 100),
  
  number: (value) => new Intl.NumberFormat('en-GB').format(value),
  
  time: (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
};

export default CHART_CONFIGS; 

// Add this export (aliases your existing CHART_CONFIGS)
export const CHART_CONFIG = CHART_CONFIGS;
