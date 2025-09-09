import ExcelJS from 'exceljs';

class ExportService {
  constructor() {
    this.supportedFormats = ['json', 'csv', 'excel', 'xlsx'];
    this.maxFileSize = 50 * 1024 * 1024; // 50MB limit
  }

  // Validate export data
  validateData(data, format) {
    if (!data) {
      throw new Error('No data provided for export');
    }

    if (!this.supportedFormats.includes(format.toLowerCase())) {
      throw new Error(`Unsupported format: ${format}`);
    }

    // Size validation for large datasets
    const dataSize = JSON.stringify(data).length;
    if (dataSize > this.maxFileSize) {
      throw new Error(`Data size exceeds maximum limit of ${this.maxFileSize / (1024 * 1024)}MB`);
    }

    return true;
  }

  // Format cell values for Excel
  formatCellValue(value, columnKey = '', reportType = null) {
    if (value === null || value === undefined) {
      return '';
    }

    // Handle dates
    if (value instanceof Date) {
      return value;
    }

    // Handle date strings
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        return date;
      }
    }

    // Handle numbers
    if (typeof value === 'number') {
      return value;
    }

    // Handle booleans
    if (typeof value === 'boolean') {
      return value;
    }

    // Handle arrays and objects
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }

    return String(value);
  }

  // Download blob helper
  async downloadBlob(blob, filename) {
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  }

  // Export data to Excel format using ExcelJS
  async exportToExcel(data, options = {}) {
    try {
      const {
        filename = 'export.xlsx',
        sheetName = 'Data',
        includeHeaders = true,
        reportType = null,
        multiSheet = false,
        styling = true
      } = options;

      this.validateData(data, 'excel');

      // Handle multi-sheet export
      if (multiSheet && typeof data === 'object' && !Array.isArray(data)) {
        return await this.exportMultiSheetExcel(data, options);
      }

      // Validate single sheet data
      if (!Array.isArray(data) || data.length === 0) {
        throw new Error('No data available for export');
      }

      // Create workbook and worksheet
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet(sheetName);

      // Get headers from first row
      const headers = Object.keys(data[0]);
      
      if (includeHeaders) {
        // Add header row
        worksheet.addRow(headers);
        
        if (styling) {
          // Style header row
          const headerRow = worksheet.getRow(1);
          headerRow.font = { bold: true };
          headerRow.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE0E0E0' }
          };
          
          // Set column widths
          headers.forEach((header, index) => {
            const column = worksheet.getColumn(index + 1);
            column.width = Math.max(header.length + 2, 12);
          });
        }
      }

      // Add data rows
      data.forEach(row => {
        const rowData = headers.map(header => 
          this.formatCellValue(row[header], header, reportType)
        );
        worksheet.addRow(rowData);
      });

      // Apply additional styling if enabled
      if (styling) {
        this.applyExcelStyling(worksheet, reportType);
      }

      // Generate Excel buffer
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      
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
      const { 
        filename = 'multi-report.xlsx',
        styling = true 
      } = options;
      
      const workbook = new ExcelJS.Workbook();
      let totalRecords = 0;

      for (const [sheetName, sheetData] of Object.entries(sheetsData)) {
        if (Array.isArray(sheetData) && sheetData.length > 0) {
          const worksheet = workbook.addWorksheet(this.sanitizeSheetName(sheetName));
          
          // Get headers
          const headers = Object.keys(sheetData[0]);
          
          // Add header row
          worksheet.addRow(headers);
          
          // Style headers
          if (styling) {
            const headerRow = worksheet.getRow(1);
            headerRow.font = { bold: true };
            headerRow.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFE0E0E0' }
            };
          }
          
          // Add data rows
          sheetData.forEach(row => {
            const rowData = headers.map(header => 
              this.formatCellValue(row[header], header, sheetName)
            );
            worksheet.addRow(rowData);
          });

          if (styling) {
            this.applyExcelStyling(worksheet, sheetName);
          }
          
          totalRecords += sheetData.length;
        }
      }

      if (workbook.worksheets.length === 0) {
        throw new Error('No valid data sheets to export');
      }

      // Generate Excel buffer
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      
      await this.downloadBlob(blob, filename);

      return {
        success: true,
        filename,
        recordCount: totalRecords,
        format: 'Excel',
        sheets: workbook.worksheets.length
      };
    } catch (error) {
      console.error('Multi-sheet Excel export error:', error);
      throw new Error(`Multi-sheet Excel export failed: ${error.message}`);
    }
  }

  // Apply Excel styling
  applyExcelStyling(worksheet, reportType = null) {
    try {
      // Auto-fit columns
      worksheet.columns.forEach(column => {
        let maxLength = 0;
        column.eachCell({ includeEmpty: false }, cell => {
          const cellLength = cell.value ? cell.value.toString().length : 0;
          if (cellLength > maxLength) {
            maxLength = cellLength;
          }
        });
        column.width = Math.min(Math.max(maxLength + 2, 12), 50);
      });

      // Apply borders to all cells with data
      const range = worksheet.actualCellCount;
      if (range) {
        worksheet.eachRow((row, rowNumber) => {
          row.eachCell((cell) => {
            cell.border = {
              top: { style: 'thin' },
              left: { style: 'thin' },
              bottom: { style: 'thin' },
              right: { style: 'thin' }
            };
          });
        });
      }

      // Apply number formatting for numeric columns
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber > 1) { // Skip header row
          row.eachCell((cell, colNumber) => {
            if (typeof cell.value === 'number') {
              // Check if it's a currency or percentage column
              const header = worksheet.getRow(1).getCell(colNumber).value;
              if (header && typeof header === 'string') {
                if (header.toLowerCase().includes('price') || 
                    header.toLowerCase().includes('cost') ||
                    header.toLowerCase().includes('amount')) {
                  cell.numFmt = '"$"#,##0.00';
                } else if (header.toLowerCase().includes('percent') || 
                          header.toLowerCase().includes('rate')) {
                  cell.numFmt = '0.00%';
                } else {
                  cell.numFmt = '#,##0.00';
                }
              }
            }
          });
        }
      });

    } catch (error) {
      console.warn('Styling application failed:', error.message);
    }
  }

  // Sanitize sheet name for Excel
  sanitizeSheetName(name) {
    return name
      .replace(/[\\\/\[\]:*?]/g, '_')
      .substring(0, 31);
  }

  // Export data to JSON format
  async exportToJSON(data, options = {}) {
    try {
      const {
        filename = 'export.json',
        pretty = true,
        metadata = null
      } = options;

      this.validateData(data, 'json');

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
      const blob = new Blob([jsonContent], { 
        type: 'application/json;charset=utf-8;' 
      });
      
      await this.downloadBlob(blob, filename);

      return {
        success: true,
        filename,
        recordCount: Array.isArray(data) ? data.length : Object.keys(data).length,
        format: 'JSON'
      };
    } catch (error) {
      console.error('JSON export error:', error);
      throw new Error(`JSON export failed: ${error.message}`);
    }
  }

  // Export data to CSV format
  async exportToCSV(data, options = {}) {
    try {
      const {
        filename = 'export.csv',
        delimiter = ',',
        includeHeaders = true
      } = options;

      this.validateData(data, 'csv');

      if (!Array.isArray(data) || data.length === 0) {
        throw new Error('No data available for CSV export');
      }

      const headers = Object.keys(data[0]);
      let csvContent = '';

      // Add headers
      if (includeHeaders) {
        csvContent += headers.join(delimiter) + '\n';
      }

      // Add data rows
      data.forEach(row => {
        const rowData = headers.map(header => {
          let value = row[header];
          
          // Handle nulls and undefined
          if (value === null || value === undefined) {
            return '';
          }
          
          // Convert objects to JSON strings
          if (typeof value === 'object') {
            value = JSON.stringify(value);
          }
          
          // Escape quotes and wrap in quotes if needed
          value = String(value);
          if (value.includes(delimiter) || value.includes('"') || value.includes('\n')) {
            value = `"${value.replace(/"/g, '""')}"`;
          }
          
          return value;
        });
        
        csvContent += rowData.join(delimiter) + '\n';
      });

      // Create and download file
      const blob = new Blob([csvContent], { 
        type: 'text/csv;charset=utf-8;' 
      });
      
      await this.downloadBlob(blob, filename);

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

  // Generic export method
  async export(data, format, options = {}) {
    const normalizedFormat = format.toLowerCase();
    
    switch (normalizedFormat) {
      case 'excel':
      case 'xlsx':
        return await this.exportToExcel(data, options);
      case 'json':
        return await this.exportToJSON(data, options);
      case 'csv':
        return await this.exportToCSV(data, options);
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  // Batch export multiple datasets
  async batchExport(exportJobs, options = {}) {
    try {
      const {
        continueOnError = true,
        progressCallback = null
      } = options;

      const results = [];
      let completedJobs = 0;

      for (const job of exportJobs) {
        try {
          if (progressCallback) {
            progressCallback({
              current: completedJobs,
              total: exportJobs.length,
              currentJob: job
            });
          }

          const result = await this.export(job.data, job.format, job.options || {});
          results.push(result);
          completedJobs++;

        } catch (error) {
          console.error(`Batch export job failed:`, error);
          
          const errorResult = {
            success: false,
            error: error.message,
            job: job
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
}

export default new ExportService();