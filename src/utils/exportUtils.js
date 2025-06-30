// src/utils/exportUtils.js
import { formatTableCell } from './formatters';
import { REPORT_CONFIG } from '../config/reportConfig';

// Export data as CSV
export const exportToCSV = (data, filename = 'export', reportType = null) => {
  if (!data || data.length === 0) {
    throw new Error('No data to export');
  }

  // Get column configuration if report type is provided
  const config = reportType ? REPORT_CONFIG[reportType] : null;
  
  // Determine columns to export
  let columns;
  if (config) {
    columns = Object.entries(config.fields).map(([key, field]) => ({
      key,
      label: field.label,
      type: field.type
    }));
  } else {
    // Use all available columns from data
    const allKeys = new Set();
    data.forEach(row => {
      Object.keys(row).forEach(key => {
        if (!key.startsWith('_')) { // Exclude internal fields
          allKeys.add(key);
        }
      });
    });
    
    columns = Array.from(allKeys).map(key => ({
      key,
      label: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      type: 'string'
    }));
  }

  // Create CSV header
  const headers = columns.map(col => `"${col.label}"`).join(',');
  
  // Create CSV rows
  const rows = data.map(row => {
    return columns.map(col => {
      const value = row[col.key];
      let formattedValue;
      
      if (config) {
        formattedValue = formatTableCell(value, col.type);
      } else {
        formattedValue = value?.toString() || '';
      }
      
      // Escape quotes and wrap in quotes
      return `"${formattedValue.toString().replace(/"/g, '""')}"`;
    }).join(',');
  });

  // Combine header and rows
  const csvContent = [headers, ...rows].join('\n');
  
  // Create and download file
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(blob, `${filename}.csv`);
  
  return {
    success: true,
    rowCount: data.length,
    columnCount: columns.length
  };
};

// Export data as JSON
export const exportToJSON = (data, filename = 'export') => {
  if (!data) {
    throw new Error('No data to export');
  }

  const jsonContent = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
  downloadBlob(blob, `${filename}.json`);
  
  return {
    success: true,
    size: jsonContent.length
  };
};

// Export chart as image (requires canvas element)
export const exportChartAsImage = (chartElement, filename = 'chart', format = 'png') => {
  return new Promise((resolve, reject) => {
    try {
      // Get the canvas element from the chart
      const canvas = chartElement.querySelector('canvas');
      if (!canvas) {
        throw new Error('Chart canvas not found');
      }

      // Convert canvas to blob
      canvas.toBlob((blob) => {
        if (blob) {
          downloadBlob(blob, `${filename}.${format}`);
          resolve({
            success: true,
            format: format,
            size: blob.size
          });
        } else {
          reject(new Error('Failed to create image blob'));
        }
      }, `image/${format}`);
      
    } catch (error) {
      reject(error);
    }
  });
};

// Create PDF report (basic implementation)
export const exportToPDF = async (reportData, filename = 'report') => {
  // This would require a PDF library like jsPDF
  // For now, we'll create a simple HTML-to-print solution
  
  const printWindow = window.open('', '_blank');
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${reportData.title || 'Financial Report'}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        .header { margin-bottom: 30px; }
        .kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 20px 0; }
        .kpi-card { border: 1px solid #ddd; padding: 15px; text-align: center; }
        .kpi-value { font-size: 24px; font-weight: bold; }
        .kpi-label { color: #666; margin-top: 5px; }
        @media print {
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${reportData.title || 'Financial Report'}</h1>
        <p>Generated on: ${new Date().toLocaleDateString()}</p>
        ${reportData.dateRange ? `<p>Period: ${reportData.dateRange.start} to ${reportData.dateRange.end}</p>` : ''}
      </div>
      
      ${reportData.kpis ? generateKPISection(reportData.kpis) : ''}
      ${reportData.data ? generateTableSection(reportData.data, reportData.reportType) : ''}
      
      <div class="no-print" style="margin-top: 30px;">
        <button onclick="window.print()">Print Report</button>
        <button onclick="window.close()">Close</button>
      </div>
    </body>
    </html>
  `;

  printWindow.document.write(htmlContent);
  printWindow.document.close();
  
  return {
    success: true,
    message: 'PDF report opened in new window for printing'
  };
};

// Generate KPI section for PDF
const generateKPISection = (kpis) => {
  const kpiCards = Object.entries(kpis).map(([key, value]) => `
    <div class="kpi-card">
      <div class="kpi-value">${formatTableCell(value, 'number')}</div>
      <div class="kpi-label">${key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</div>
    </div>
  `).join('');

  return `
    <div class="kpi-section">
      <h2>Key Performance Indicators</h2>
      <div class="kpi-grid">
        ${kpiCards}
      </div>
    </div>
  `;
};

// Generate table section for PDF
const generateTableSection = (data, reportType) => {
  if (!data || data.length === 0) return '';

  const config = reportType ? REPORT_CONFIG[reportType] : null;
  let columns;

  if (config) {
    columns = Object.entries(config.fields).map(([key, field]) => ({
      key,
      label: field.label,
      type: field.type
    }));
  } else {
    const allKeys = new Set();
    data.slice(0, 5).forEach(row => {
      Object.keys(row).forEach(key => {
        if (!key.startsWith('_')) {
          allKeys.add(key);
        }
      });
    });
    
    columns = Array.from(allKeys).map(key => ({
      key,
      label: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      type: 'string'
    }));
  }

  const headers = columns.map(col => `<th>${col.label}</th>`).join('');
  const rows = data.slice(0, 50).map(row => {
    const cells = columns.map(col => {
      const value = row[col.key];
      const formattedValue = config ? formatTableCell(value, col.type) : (value?.toString() || '');
      return `<td>${formattedValue}</td>`;
    }).join('');
    return `<tr>${cells}</tr>`;
  }).join('');

  return `
    <div class="table-section">
      <h2>Data Sample (First 50 records)</h2>
      <table>
        <thead>
          <tr>${headers}</tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
      ${data.length > 50 ? `<p><em>Showing 50 of ${data.length} total records</em></p>` : ''}
    </div>
  `;
};

// Download blob helper function
const downloadBlob = (blob, filename) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Clean up the URL object
  window.URL.revokeObjectURL(url);
};

// Export filtered data based on current filters
export const exportFilteredData = async (reportType, filters = {}, format = 'csv', filename = null) => {
  try {
    // This would integrate with dataManager to get filtered data
    // For now, it's a placeholder that would work with the dataManager
    const dataManager = await import('./dataManager');
    const data = await dataManager.default.getReportData(reportType, filters);
    
    const defaultFilename = `${reportType}_${new Date().toISOString().split('T')[0]}`;
    const finalFilename = filename || defaultFilename;
    
    switch (format.toLowerCase()) {
      case 'csv':
        return exportToCSV(data, finalFilename, reportType);
      case 'json':
        return exportToJSON(data, finalFilename);
      case 'pdf':
        const reportData = {
          title: `${reportType.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} Report`,
          data,
          reportType,
          dateRange: filters.dateRange,
          kpis: await dataManager.default.getKPIData(reportType, filters.dateRange)
        };
        return exportToPDF(reportData, finalFilename);
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  } catch (error) {
    throw new Error(`Export failed: ${error.message}`);
  }
};

// Bulk export all reports
export const exportAllReports = async (format = 'json', includeMetadata = true) => {
  try {
    const dataManager = await import('./dataManager');
    const allData = await dataManager.default.exportData();
    
    if (includeMetadata) {
      const stats = await dataManager.default.getDashboardStats();
      allData.statistics = stats;
    }
    
    const filename = `financial_reports_backup_${new Date().toISOString().split('T')[0]}`;
    
    switch (format.toLowerCase()) {
      case 'json':
        return exportToJSON(allData, filename);
      default:
        throw new Error(`Bulk export only supports JSON format`);
    }
  } catch (error) {
    throw new Error(`Bulk export failed: ${error.message}`);
  }
};

// Export utilities object
export default {
  exportToCSV,
  exportToJSON,
  exportToPDF,
  exportChartAsImage,
  exportFilteredData,
  exportAllReports
}; 
