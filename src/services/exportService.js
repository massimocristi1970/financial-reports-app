// src/services/exportService.js
import * as XLSX from 'xlsx';
import { formatters } from '../utils/formatters';
import { REPORT_TYPES, EXPORT_FORMATS } from '../utils/constants';

class ExportService {
  constructor() {
    this.exportQueue = [];
    this.isProcessing = false;
    this.progressCallbacks = new Map();
  }

  // Export data to CSV format
  async exportToCSV(data, options = {}) {
    try {
      const {
        filename = 'export.csv',
        headers = null,
        delimiter = ',',
        includeHeaders = true,
        reportType = null
      } = options;

      // Validate data
      if (!Array.isArray(data) || data.length === 0) {
        throw new Error('No data available for export');
      }

      // Prepare headers
      const finalHeaders = headers || Object.keys(data[0]);
      
      // Format data rows
      const formattedData = data.map(row => 
        finalHeaders.map(header => {
          const value = row[header];
          return this.formatCellValue(value, header, reportType);
        })
      );

      // Build CSV content
      let csvContent = '';
      
      if (includeHeaders) {
        csvContent += finalHeaders.map(header => this.escapeCSVValue(header)).join(delimiter) + '\n';
      }
      
      csvContent += formattedData
        .map(row => row.map(cell => this.escapeCSVValue(cell)).join(delimiter))
        .join('\n');

      // Create and download file
      await this.downloadFile(csvContent, filename, 'text/csv');

      return {
        success: true,
        filename,
        recordCount: data.length,
        format: 'CSV'
      };
    } catch (error) {
      console.error('CSV export error:', error);
      throw new Error(`CSV export failed: ${error.message}`);
    }
  }

  // Export data to Excel format
  async exportToExcel(data, options = {}) {
    try {
      const {
        filename = 'export.xlsx',
        sheetName = 'Data',
        includeHeaders = true,
        reportType = null,
        multiSheet = false
      } = options;

      // Handle multi-sheet export
      if (multiSheet && typeof data === 'object' && !Array.isArray(data)) {
        return await this.exportMultiSheetExcel(data, options);
      }

      // Validate single sheet data
      if (!Array.isArray(data) || data.length === 0) {
        throw new Error('No data available for export');
      }

      // Create workbook and worksheet
      const workbook = XLSX.utils.book_new();
      const worksheet = this.createWorksheet(data, { includeHeaders, reportType });
      
      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

      // Apply styling if supported
      this.applyExcelStyling(workbook, worksheet, reportType);

      // Generate Excel file
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      
      await this.downloadBlob(blob, filename);

      return {
        success: true,
        filename,
        recordCount: data.length,
        format: 'Excel',
        sheets: 1
      };
    } catch (error) {
      console.error('Excel export error:', error);
      throw new Error(`Excel export failed: ${error.message}`);
    }
  }

  // Export multiple sheets to Excel
  async exportMultiSheetExcel(sheetsData, options = {}) {
    try {
      const { filename = 'multi-report.xlsx' } = options;
      const workbook = XLSX.utils.book_new();
      let totalRecords = 0;

      for (const [sheetName, sheetData] of Object.entries(sheetsData)) {
        if (Array.isArray(sheetData) && sheetData.length > 0) {
          const worksheet = this.createWorksheet(sheetData, {
            includeHeaders: true,
            reportType: sheetName
          });
          
          XLSX.utils.book_append_sheet(workbook, worksheet, this.sanitizeSheetName(sheetName));
          totalRecords += sheetData.length;
        }
      }

      if (workbook.SheetNames.length === 0) {
        throw new Error('No valid data sheets to export');
      }

      // Generate Excel file
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      
      await this.downloadBlob(blob, filename);

      return {
        success: true,
        filename,
        recordCount: totalRecords,
        format: 'Excel',
        sheets: workbook.SheetNames.length
      };
    } catch (error) {
      console.error('Multi-sheet Excel export error:', error);
      throw new Error(`Multi-sheet Excel export failed: ${error.message}`);
    }
  }

  // Export data to JSON format
  async exportToJSON(data, options = {}) {
    try {
      const {
        filename = 'export.json',
        pretty = true,
        metadata = null
      } = options;

      // Validate data
      if (!data) {
        throw new Error('No data available for export');
      }

      // Prepare export object
      const exportData = {
        timestamp: new Date().toISOString(),
        recordCount: Array.isArray(data) ? data.length : Object.keys(data).length,
        data: data
      };

      // Add metadata if provided
      if (metadata) {
        exportData.metadata = metadata;
      }

      // Convert to JSON string
      const jsonContent = JSON.stringify(exportData, null, pretty ? 2 : 0);

      // Create and download file
      await this.downloadFile(jsonContent, filename, 'application/json');

      return {
        success: true,
        filename,
        recordCount: exportData.recordCount,
        format: 'JSON'
      };
    } catch (error) {
      console.error('JSON export error:', error);
      throw new Error(`JSON export failed: ${error.message}`);
    }
  }

  // Export chart as image
  async exportChartImage(chartRef, options = {}) {
    try {
      const {
        filename = 'chart.png',
        format = 'png',
        quality = 0.9,
        backgroundColor = '#ffffff'
      } = options;

      if (!chartRef || !chartRef.current) {
        throw new Error('Chart reference not available');
      }

      // Get chart canvas
      const canvas = chartRef.current.canvas || chartRef.current.querySelector('canvas');
      if (!canvas) {
        throw new Error('Chart canvas not found');
      }

      // Create a new canvas with background color
      const exportCanvas = document.createElement('canvas');
      const ctx = exportCanvas.getContext('2d');
      
      exportCanvas.width = canvas.width;
      exportCanvas.height = canvas.height;

      // Fill background
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);

      // Draw chart
      ctx.drawImage(canvas, 0, 0);

      // Convert to blob
      return new Promise((resolve, reject) => {
        exportCanvas.toBlob(async (blob) => {
          try {
            await this.downloadBlob(blob, filename);
            resolve({
              success: true,
              filename,
              format: format.toUpperCase(),
              dimensions: {
                width: exportCanvas.width,
                height: exportCanvas.height
              }
            });
          } catch (error) {
            reject(error);
          }
        }, `image/${format}`, quality);
      });
    } catch (error) {
      console.error('Chart image export error:', error);
      throw new Error(`Chart image export failed: ${error.message}`);
    }
  }

  // Export filtered data with applied filters info
  async exportFilteredData(data, filters, options = {}) {
    try {
      const {
        format = 'csv',
        includeFilterInfo = true,
        reportType = null
      } = options;

      // Prepare metadata about applied filters
      const filterMetadata = includeFilterInfo ? {
        appliedFilters: filters,
        exportDate: new Date().toISOString(),
        originalRecordCount: data.originalCount || data.length,
        filteredRecordCount: data.length
      } : null;

      // Choose export method based on format
      switch (format.toLowerCase()) {
        case 'csv':
          return await this.exportToCSV(data, { ...options, reportType });
        case 'excel':
        case 'xlsx':
          return await this.exportToExcel(data, { ...options, reportType });
        case 'json':
          return await this.exportToJSON(data, { 
            ...options, 
            metadata: filterMetadata 
          });
        default:
          throw new Error(`Unsupported export format: ${format}`);
      }
    } catch (error) {
      console.error('Filtered data export error:', error);
      throw new Error(`Filtered data export failed: ${error.message}`);
    }
  }

  // Batch export multiple reports
  async batchExport(exportJobs, options = {}) {
    try {
      const {
        progressCallback = null,
        continueOnError = true
      } = options;

      const results = [];
      let completedJobs = 0;

      for (const job of exportJobs) {
        try {
          // Update progress
          if (progressCallback) {
            progressCallback({
              current: completedJobs,
              total: exportJobs.length,
              currentJob: job.name || job.reportType
            });
          }

          // Execute export job
          let result;
          switch (job.format.toLowerCase()) {
            case 'csv':
              result = await this.exportToCSV(job.data, job.options);
              break;
            case 'excel':
            case 'xlsx':
              result = await this.exportToExcel(job.data, job.options);
              break;
            case 'json':
              result = await this.exportToJSON(job.data, job.options);
              break;
            default:
              throw new Error(`Unsupported format: ${job.format}`);
          }

          results.push({
            job: job.name || job.reportType,
            ...result
          });

          completedJobs++;
        } catch (error) {
          const errorResult = {
            job: job.name || job.reportType,
            success: false,
            error: error.message
          };

          results.push(errorResult);

          if (!continueOnError) {
            throw error;
          }

          completedJobs++;
        }
      }

      // Final progress update
      if (progressCallback) {
        progressCallback({
          current: completedJobs,
          total: exportJobs.length,
          completed: true
        });
      }

      return {
        success: true,
        completedJobs,
        totalJobs: exportJobs.length,
        results
      };
    } catch (error) {
      console.error('Batch export error:', error);
      throw new Error(`Batch export failed: ${error.message}`);
    }
  }

  // Helper method to create worksheet
  createWorksheet(data, options = {}) {
    const { includeHeaders = true, reportType = null } = options;

    // Format data for Excel
    const formattedData = data.map(row => {
      const formattedRow = {};
      for (const [key, value] of Object.entries(row)) {
        formattedRow[key] = this.formatCellValue(value, key, reportType);
      }
      return formattedRow;
    });

    // Create worksheet
    const worksheet = XLSX.utils.json_to_sheet(formattedData, {
      header: includeHeaders ? Object.keys(data[0]) : undefined
    });

    // Set column widths
    const columnWidths = this.calculateColumnWidths(data);
    worksheet['!cols'] = columnWidths;

    return worksheet;
  }

  // Apply Excel styling
  applyExcelStyling(workbook, worksheet, reportType) {
    // Basic styling - this would need a more advanced Excel library for full styling
    if (worksheet['!ref']) {
      const range = XLSX.utils.decode_range(worksheet['!ref']);
      
      // Style header row
      for (let col = range.s.c; col <= range.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
        if (worksheet[cellAddress]) {
          worksheet[cellAddress].s = {
            font: { bold: true },
            fill: { fgColor: { rgb: 'CCCCCC' } }
          };
        }
      }
    }
  }

  // Calculate optimal column widths
  calculateColumnWidths(data) {
    if (!data.length) return [];

    const widths = {};
    const headers = Object.keys(data[0]);

    // Initialize with header lengths
    headers.forEach(header => {
      widths[header] = header.length;
    });

    // Check data lengths
    data.forEach(row => {
      headers.forEach(header => {
        const cellValue = String(row[header] || '');
        widths[header] = Math.max(widths[header], cellValue.length);
      });
    });

    // Convert to Excel format and cap at reasonable max width
    return headers.map(header => ({
      wch: Math.min(Math.max(widths[header], 10), 50)
    }));
  }

  // Format cell value based on column type
  formatCellValue(value, columnName, reportType) {
    if (value === null || value === undefined) {
      return '';
    }

    // Date formatting
    if (columnName.includes('date') || columnName.includes('Date')) {
      return formatters.formatDate(value);
    }

    // Currency formatting
    if (columnName.includes('amount') || columnName.includes('value') || 
        columnName.includes('price') || columnName.includes('cost')) {
      const numValue = parseFloat(value);
      return isNaN(numValue) ? value : formatters.formatCurrency(numValue);
    }

    // Percentage formatting
    if (columnName.includes('rate') || columnName.includes('percent')) {
      const numValue = parseFloat(value);
      return isNaN(numValue) ? value : formatters.formatPercent(numValue);
    }

    // Number formatting
    if (typeof value === 'number') {
      return formatters.formatNumber(value);
    }

    return String(value);
  }

  // Escape CSV values
  escapeCSVValue(value) {
    const stringValue = String(value);
    
    // If value contains comma, quote, or newline, wrap in quotes and escape quotes
    if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
      return `"${stringValue.replace(/"/g, '""')}"`;
    }
    
    return stringValue;
  }

  // Sanitize sheet names for Excel
  sanitizeSheetName(name) {
    // Excel sheet name restrictions
    return name
      .replace(/[\/\\\?\*\[\]]/g, '_') // Replace invalid characters
      .substring(0, 31); // Max length 31 characters
  }

  // Download file helper
  async downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    await this.downloadBlob(blob, filename);
  }

  // Download blob helper
  async downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up object URL
    setTimeout(() => URL.revokeObjectURL(url), 100);
  }

  // Get supported export formats
  getSupportedFormats() {
    return [
      { value: 'csv', label: 'CSV', extension: '.csv' },
      { value: 'excel', label: 'Excel', extension: '.xlsx' },
      { value: 'json', label: 'JSON', extension: '.json' }
    ];
  }

  // Validate export options
  validateExportOptions(data, format, options = {}) {
    const errors = [];

    // Check data
    if (!data || (Array.isArray(data) && data.length === 0)) {
      errors.push('No data available for export');
    }

    // Check format
    const supportedFormats = ['csv', 'excel', 'xlsx', 'json'];
    if (!supportedFormats.includes(format.toLowerCase())) {
      errors.push(`Unsupported export format: ${format}`);
    }

    // Check filename
    if (options.filename && !/^[^<>:"/\\|?*]+$/.test(options.filename)) {
      errors.push('Invalid characters in filename');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Get export statistics
  getExportStats() {
    return {
      queueSize: this.exportQueue.length,
      isProcessing: this.isProcessing,
      supportedFormats: this.getSupportedFormats()
    };
  }
}

// Create and export singleton instance
const exportService = new ExportService();
export default exportService; 
