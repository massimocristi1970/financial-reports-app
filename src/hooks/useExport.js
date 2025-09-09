import { useState, useCallback } from 'react';
import ExcelJS from 'exceljs';

export const useExport = () => {
  const [exporting, setExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);

  // Helper function to format data for export
  const formatDataForExport = useCallback((data, reportType = null, includeCalculated = true) => {
    if (!Array.isArray(data)) {
      throw new Error('Data must be an array for export');
    }

    return data.map(item => {
      const formatted = { ...item };
      
      // Remove internal fields if not including calculated
      if (!includeCalculated) {
        Object.keys(formatted).forEach(key => {
          if (key.startsWith('_') || key.startsWith('$')) {
            delete formatted[key];
          }
        });
      }

      // Format dates
      Object.keys(formatted).forEach(key => {
        if (formatted[key] instanceof Date) {
          formatted[key] = formatted[key].toISOString().split('T')[0];
        }
      });

      return formatted;
    });
  }, []);

  // Export to JSON
  const exportJSON = useCallback(async (
    data, 
    filename = 'export.json', 
    reportType = null,
    options = {}
  ) => {
    setExporting(true);
    setError(null);
    setProgress(0);

    try {
      const {
        includeCalculated = true,
        pretty = true,
        metadata = null
      } = options;

      setProgress(20);

      // Format data for export
      const formattedData = formatDataForExport(data, reportType, includeCalculated);
      setProgress(40);

      // Prepare export object
      const exportData = {
        timestamp: new Date().toISOString(),
        recordCount: formattedData.length,
        reportType,
        data: formattedData
      };

      if (metadata) {
        exportData.metadata = metadata;
      }

      setProgress(60);

      // Convert to JSON string
      const jsonString = JSON.stringify(exportData, null, pretty ? 2 : 0);
      setProgress(80);

      // Create and download file
      const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
      setProgress(100);

      return { success: true, recordCount: formattedData.length };

    } catch (err) {
      setError(`JSON export failed: ${err.message}`);
      return { success: false, error: err.message };
    } finally {
      setExporting(false);
      setTimeout(() => setProgress(0), 2000);
    }
  }, [formatDataForExport]);

  // Export to Excel (XLSX) using ExcelJS
  const exportExcel = useCallback(async (
    data, 
    filename = 'export.xlsx', 
    reportType = null,
    options = {}
  ) => {
    setExporting(true);
    setError(null);
    setProgress(0);

    try {
      const {
        includeCalculated = true,
        sheetName = 'Export Data',
        includeCharts = false,
        styling = true,
        multiSheet = false
      } = options;

      setProgress(10);

      // Format data for export
      const formattedData = formatDataForExport(data, reportType, includeCalculated);
      setProgress(30);

      // Handle multi-sheet export
      if (multiSheet && typeof formattedData === 'object' && !Array.isArray(formattedData)) {
        return await exportMultiSheetExcel(formattedData, filename, options);
      }

      // Create workbook and worksheet
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet(sheetName);
      setProgress(40);

      // Get headers from first row
      if (formattedData.length === 0) {
        throw new Error('No data to export');
      }

      const headers = Object.keys(formattedData[0]);
      
      // Add header row
      worksheet.addRow(headers);
      setProgress(50);

      // Style header row
      if (styling) {
        const headerRow = worksheet.getRow(1);
        headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        headerRow.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF4472C4' }
        };
        
        // Set column widths
        headers.forEach((header, index) => {
          const column = worksheet.getColumn(index + 1);
          column.width = Math.max(header.length + 2, 12);
        });
      }

      setProgress(60);

      // Add data rows
      formattedData.forEach((row, index) => {
        const rowData = headers.map(header => {
          const value = row[header];
          
          // Handle different data types
          if (value === null || value === undefined) {
            return '';
          }
          
          if (value instanceof Date) {
            return value;
          }
          
          if (typeof value === 'object') {
            return JSON.stringify(value);
          }
          
          return value;
        });
        
        worksheet.addRow(rowData);
        
        // Update progress for large datasets
        if (index % 100 === 0) {
          setProgress(60 + (index / formattedData.length) * 20);
        }
      });

      setProgress(80);

      // Apply additional styling
      if (styling) {
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

        // Add borders
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

        // Format number cells
        worksheet.eachRow((row, rowNumber) => {
          if (rowNumber > 1) { // Skip header row
            row.eachCell((cell, colNumber) => {
              if (typeof cell.value === 'number') {
                const header = worksheet.getRow(1).getCell(colNumber).value;
                if (header && typeof header === 'string') {
                  if (header.toLowerCase().includes('price') || 
                      header.toLowerCase().includes('cost') ||
                      header.toLowerCase().includes('amount')) {
                    cell.numFmt = '"$"#,##0.00';
                  } else if (header.toLowerCase().includes('percent')) {
                    cell.numFmt = '0.00%';
                  } else {
                    cell.numFmt = '#,##0.00';
                  }
                }
              }
            });
          }
        });
      }

      setProgress(90);

      // Generate Excel buffer and download
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
      setProgress(100);

      return { 
        success: true, 
        recordCount: formattedData.length,
        sheets: 1
      };

    } catch (err) {
      setError(`Excel export failed: ${err.message}`);
      return { success: false, error: err.message };
    } finally {
      setExporting(false);
      setTimeout(() => setProgress(0), 2000);
    }
  }, [formatDataForExport]);

  // Export multi-sheet Excel
  const exportMultiSheetExcel = useCallback(async (
    sheetsData,
    filename = 'multi-sheet-export.xlsx',
    options = {}
  ) => {
    try {
      const { styling = true } = options;
      
      const workbook = new ExcelJS.Workbook();
      let totalRecords = 0;

      setProgress(20);

      for (const [sheetName, sheetData] of Object.entries(sheetsData)) {
        if (Array.isArray(sheetData) && sheetData.length > 0) {
          const worksheet = workbook.addWorksheet(sheetName.substring(0, 31));
          
          const headers = Object.keys(sheetData[0]);
          worksheet.addRow(headers);
          
          // Style headers
          if (styling) {
            const headerRow = worksheet.getRow(1);
            headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
            headerRow.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FF4472C4' }
            };
          }
          
          // Add data
          sheetData.forEach(row => {
            const rowData = headers.map(header => row[header] || '');
            worksheet.addRow(rowData);
          });

          totalRecords += sheetData.length;
        }
      }

      setProgress(70);

      // Generate and download
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);

      return { 
        success: true, 
        recordCount: totalRecords,
        sheets: workbook.worksheets.length
      };

    } catch (err) {
      throw new Error(`Multi-sheet Excel export failed: ${err.message}`);
    }
  }, []);

  // Export to CSV
  const exportCSV = useCallback(async (
    data, 
    filename = 'export.csv', 
    reportType = null,
    options = {}
  ) => {
    setExporting(true);
    setError(null);
    setProgress(0);

    try {
      const {
        includeCalculated = true,
        delimiter = ',',
        includeHeaders = true
      } = options;

      setProgress(20);

      const formattedData = formatDataForExport(data, reportType, includeCalculated);
      
      if (formattedData.length === 0) {
        throw new Error('No data to export');
      }

      setProgress(40);

      const headers = Object.keys(formattedData[0]);
      let csvContent = '';

      // Add headers
      if (includeHeaders) {
        csvContent += headers.join(delimiter) + '\n';
      }

      setProgress(60);

      // Add data rows
      formattedData.forEach((row, index) => {
        const rowData = headers.map(header => {
          let value = row[header];
          
          if (value === null || value === undefined) {
            return '';
          }
          
          if (typeof value === 'object') {
            value = JSON.stringify(value);
          }
          
          value = String(value);
          if (value.includes(delimiter) || value.includes('"') || value.includes('\n')) {
            value = `"${value.replace(/"/g, '""')}"`;
          }
          
          return value;
        });
        
        csvContent += rowData.join(delimiter) + '\n';
        
        if (index % 100 === 0) {
          setProgress(60 + (index / formattedData.length) * 20);
        }
      });

      setProgress(80);

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
      setProgress(100);

      return { success: true, recordCount: formattedData.length };

    } catch (err) {
      setError(`CSV export failed: ${err.message}`);
      return { success: false, error: err.message };
    } finally {
      setExporting(false);
      setTimeout(() => setProgress(0), 2000);
    }
  }, [formatDataForExport]);

  // Generic export function
  const exportData = useCallback(async (data, format, filename, reportType = null, options = {}) => {
    switch (format.toLowerCase()) {
      case 'excel':
      case 'xlsx':
        return await exportExcel(data, filename, reportType, options);
      case 'json':
        return await exportJSON(data, filename, reportType, options);
      case 'csv':
        return await exportCSV(data, filename, reportType, options);
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }, [exportExcel, exportJSON, exportCSV]);

  return {
    exporting,
    progress,
    error,
    exportData,
    exportExcel,
    exportJSON,
    exportCSV,
    exportMultiSheetExcel
  };
};