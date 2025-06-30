import { useState, useCallback } from 'react';
import { formatCurrency, formatDate, formatPercentage } from '../utils/formatters';

const useExport = () => {
  const [exporting, setExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);

  // Convert data to CSV format
  const convertToCSV = useCallback((data, columns = null) => {
    if (!data || data.length === 0) {
      throw new Error('No data to export');
    }

    // Determine columns to export
    const exportColumns = columns || Object.keys(data[0]);
    
    // Create CSV header
    const header = exportColumns.join(',');
    
    // Create CSV rows
    const rows = data.map(item => {
      return exportColumns.map(column => {
        let value = item[column] || '';
        
        // Handle different data types
        if (typeof value === 'object' && value !== null) {
          value = JSON.stringify(value);
        } else if (typeof value === 'string' && value.includes(',')) {
          value = `"${value.replace(/"/g, '""')}"`;
        }
        
        return value;
      }).join(',');
    });
    
    return [header, ...rows].join('\n');
  }, []);

  // Format data for export based on report type
  const formatDataForExport = useCallback((data, reportType, includeCalculated = true) => {
    if (!data || data.length === 0) return [];

    return data.map(item => {
      const formatted = { ...item };
      
      // Format common fields
      if (formatted.date) {
        formatted.date = formatDate(formatted.date);
      }
      if (formatted.created_date) {
        formatted.created_date = formatDate(formatted.created_date);
      }
      if (formatted.updated_date) {
        formatted.updated_date = formatDate(formatted.updated_date);
      }

      // Format currency fields
      const currencyFields = ['amount', 'value', 'loan_amount', 'balance', 'payment_amount'];
      currencyFields.forEach(field => {
        if (formatted[field] !== undefined && formatted[field] !== null) {
          formatted[field] = formatCurrency(formatted[field]);
        }
      });

      // Format percentage fields
      const percentageFields = ['rate', 'interest_rate', 'fee_rate'];
      percentageFields.forEach(field => {
        if (formatted[field] !== undefined && formatted[field] !== null) {
          formatted[field] = formatPercentage(formatted[field]);
        }
      });

      // Add calculated fields based on report type
      if (includeCalculated) {
        switch (reportType) {
          case 'lending-volume':
            if (item.loan_amount && item.applications) {
              formatted.average_loan_size = formatCurrency(item.loan_amount / item.applications);
            }
            break;
          case 'arrears':
            if (item.current_balance && item.original_amount) {
              formatted.arrears_percentage = formatPercentage(
                (item.current_balance / item.original_amount) * 100
              );
            }
            break;
          case 'liquidations':
            if (item.recovered_amount && item.debt_amount) {
              formatted.recovery_rate = formatPercentage(
                (item.recovered_amount / item.debt_amount) * 100
              );
            }
            break;
          case 'call-center':
            if (item.calls_handled && item.calls_received) {
              formatted.answer_rate = formatPercentage(
                (item.calls_handled / item.calls_received) * 100
              );
            }
            break;
          case 'complaints':
            if (item.resolved_date && item.received_date) {
              const days = Math.ceil(
                (new Date(item.resolved_date) - new Date(item.received_date)) / (1000 * 60 * 60 * 24)
              );
              formatted.resolution_days = days;
            }
            break;
        }
      }

      return formatted;
    });
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
        columns = null,
        includeCalculated = true,
        chunkSize = 1000
      } = options;

      // Format data for export
      const formattedData = formatDataForExport(data, reportType, includeCalculated);
      setProgress(25);

      // Convert to CSV in chunks for large datasets
      let csvContent = '';
      const totalChunks = Math.ceil(formattedData.length / chunkSize);

      for (let i = 0; i < totalChunks; i++) {
        const chunk = formattedData.slice(i * chunkSize, (i + 1) * chunkSize);
        const chunkCSV = convertToCSV(chunk, columns);
        
        if (i === 0) {
          csvContent = chunkCSV;
        } else {
          // Skip header for subsequent chunks
          csvContent += '\n' + chunkCSV.split('\n').slice(1).join('\n');
        }
        
        setProgress(25 + (50 * (i + 1)) / totalChunks);
      }

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
  }, [convertToCSV, formatDataForExport]);

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
        includeMetadata = true,
        prettyPrint = true
      } = options;

      // Format data for export
      const formattedData = formatDataForExport(data, reportType, includeCalculated);
      setProgress(30);

      // Create export object
      const exportObject = {
        data: formattedData,
        ...(includeMetadata && {
          metadata: {
            exportDate: new Date().toISOString(),
            reportType,
            recordCount: formattedData.length,
            version: '1.0'
          }
        })
      };
      setProgress(60);

      // Convert to JSON string
      const jsonString = JSON.stringify(
        exportObject, 
        null, 
        prettyPrint ? 2 : 0
      );
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

  // Export to Excel (XLSX)
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
      // Dynamic import for xlsx library
      const XLSX = await import('xlsx');
      setProgress(10);

      const {
        includeCalculated = true,
        sheetName = 'Export Data',
        includeCharts = false
      } = options;

      // Format data for export
      const formattedData = formatDataForExport(data, reportType, includeCalculated);
      setProgress(30);

      // Create workbook and worksheet
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(formattedData);
      setProgress(50);

      // Add some basic styling
      const range = XLSX.utils.decode_range(worksheet['!ref']);
      
      // Style header row
      for (let col = range.s.c; col <= range.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
        if (!worksheet[cellAddress]) continue;
        worksheet[cellAddress].s = {
          font: { bold: true },
          fill: { fgColor: { rgb: 'EEEEEE' } }
        };
      }
      setProgress(70);

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
      setProgress(85);

      // Generate Excel file
      const excelBuffer = XLSX.write(workbook, { 
        bookType: 'xlsx', 
        type: 'array',
        cellStyles: true
      });
      setProgress(95);

      // Create and download file
      const blob = new Blob([excelBuffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8'
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

      return { success: true, recordCount: formattedData.length };

    } catch (err) {
      setError(`Excel export failed: ${err.message}`);
      return { success: false, error: err.message };
    } finally {
      setExporting(false);
      setTimeout(() => setProgress(0), 2000);
    }
  }, [formatDataForExport]);

  // Export chart data as image
  const exportChartImage = useCallback(async (chartRef, filename = 'chart.png', options = {}) => {
    setExporting(true);
    setError(null);
    setProgress(0);

    try {
      const {
        format = 'png',
        quality = 0.8,
        backgroundColor = '#ffffff'
      } = options;

      if (!chartRef || !chartRef.current) {
        throw new Error('Chart reference not available');
      }

      setProgress(25);

      // Get chart canvas
      const canvas = chartRef.current.canvas || chartRef.current;
      if (!canvas) {
        throw new Error('Canvas not found in chart reference');
      }

      setProgress(50);

      // Convert to blob
      return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (!blob) {
            reject(new Error('Failed to create image blob'));
            return;
          }

          setProgress(75);

          // Create and download file
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

          resolve({ success: true });
          
          setExporting(false);
          setTimeout(() => setProgress(0), 2000);
        }, `image/${format}`, quality);
      });

    } catch (err) {
      setError(`Chart export failed: ${err.message}`);
      setExporting(false);
      return { success: false, error: err.message };
    }
  }, []);

  // Export multiple sheets to Excel
  const exportMultiSheetExcel = useCallback(async (
    sheets, 
    filename = 'multi-export.xlsx',
    options = {}
  ) => {
    setExporting(true);
    setError(null);
    setProgress(0);

    try {
      // Dynamic import for xlsx library
      const XLSX = await import('xlsx');
      setProgress(10);

      const { includeCalculated = true } = options;

      // Create workbook
      const workbook = XLSX.utils.book_new();
      const totalSheets = sheets.length;

      for (let i = 0; i < totalSheets; i++) {
        const { data, name, reportType } = sheets[i];
        
        // Format data for export
        const formattedData = formatDataForExport(data, reportType, includeCalculated);
        
        // Create worksheet
        const worksheet = XLSX.utils.json_to_sheet(formattedData);
        
        // Add worksheet to workbook
        XLSX.utils.book_append_sheet(workbook, worksheet, name || `Sheet${i + 1}`);
        
        setProgress(10 + (70 * (i + 1)) / totalSheets);
      }

      setProgress(85);

      // Generate Excel file
      const excelBuffer = XLSX.write(workbook, { 
        bookType: 'xlsx', 
        type: 'array',
        cellStyles: true
      });
      setProgress(95);

      // Create and download file
      const blob = new Blob([excelBuffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8'
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

      const totalRecords = sheets.reduce((sum, sheet) => sum + sheet.data.length, 0);
      return { success: true, recordCount: totalRecords, sheetCount: totalSheets };

    } catch (err) {
      setError(`Multi-sheet export failed: ${err.message}`);
      return { success: false, error: err.message };
    } finally {
      setExporting(false);
      setTimeout(() => setProgress(0), 2000);
    }
  }, [formatDataForExport]);

  // Export summary report
  const exportSummaryReport = useCallback(async (
    data,
    reportType,
    filters = {},
    filename = 'summary-report.json'
  ) => {
    setExporting(true);
    setError(null);
    setProgress(0);

    try {
      setProgress(20);

      // Calculate summary statistics
      const totalRecords = data.length;
      const dateRange = data.length > 0 ? {
        start: Math.min(...data.map(item => new Date(item.date || item.created_date).getTime())),
        end: Math.max(...data.map(item => new Date(item.date || item.created_date).getTime()))
      } : null;

      setProgress(40);

      // Calculate type-specific metrics
      let metrics = {};
      switch (reportType) {
        case 'lending-volume':
          metrics = {
            totalApplications: data.reduce((sum, item) => sum + (item.applications || 0), 0),
            totalAmount: data.reduce((sum, item) => sum + (item.loan_amount || 0), 0),
            averageLoanSize: data.length > 0 ? 
              data.reduce((sum, item) => sum + (item.loan_amount || 0), 0) / totalRecords : 0
          };
          break;
        case 'arrears':
          metrics = {
            totalArrears: data.reduce((sum, item) => sum + (item.current_balance || 0), 0),
            averageArrears: data.length > 0 ? 
              data.reduce((sum, item) => sum + (item.current_balance || 0), 0) / totalRecords : 0,
            accounts30Plus: data.filter(item => (item.days_overdue || 0) >= 30).length
          };
          break;
        case 'liquidations':
          metrics = {
            totalDebt: data.reduce((sum, item) => sum + (item.debt_amount || 0), 0),
            totalRecovered: data.reduce((sum, item) => sum + (item.recovered_amount || 0), 0),
            recoveryRate: data.length > 0 ? 
              (data.reduce((sum, item) => sum + (item.recovered_amount || 0), 0) / 
               data.reduce((sum, item) => sum + (item.debt_amount || 0), 0)) * 100 : 0
          };
          break;
        case 'call-center':
          metrics = {
            totalCalls: data.reduce((sum, item) => sum + (item.calls_received || 0), 0),
            callsHandled: data.reduce((sum, item) => sum + (item.calls_handled || 0), 0),
            averageWaitTime: data.length > 0 ? 
              data.reduce((sum, item) => sum + (item.avg_wait_time || 0), 0) / totalRecords : 0
          };
          break;
        case 'complaints':
          const resolvedComplaints = data.filter(item => item.status === 'resolved');
          metrics = {
            totalComplaints: totalRecords,
            resolvedComplaints: resolvedComplaints.length,
            resolutionRate: totalRecords > 0 ? (resolvedComplaints.length / totalRecords) * 100 : 0,
            averageResolutionTime: resolvedComplaints.length > 0 ? 
              resolvedComplaints.reduce((sum, item) => {
                const days = (new Date(item.resolved_date) - new Date(item.received_date)) / (1000 * 60 * 60 * 24);
                return sum + days;
              }, 0) / resolvedComplaints.length : 0
          };
          break;
      }

      setProgress(70);

      // Create summary report
      const summaryReport = {
        reportInfo: {
          type: reportType,
          generatedAt: new Date().toISOString(),
          totalRecords,
          dateRange: dateRange ? {
            start: new Date(dateRange.start).toISOString(),
            end: new Date(dateRange.end).toISOString()
          } : null,
          filters
        },
        metrics,
        data: formatDataForExport(data, reportType, true)
      };

      setProgress(85);

      // Export as JSON
      const jsonString = JSON.stringify(summaryReport, null, 2);
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

      return { success: true, recordCount: totalRecords };

    } catch (err) {
      setError(`Summary report export failed: ${err.message}`);
      return { success: false, error: err.message };
    } finally {
      setExporting(false);
      setTimeout(() => setProgress(0), 2000);
    }
  }, [formatDataForExport]);

  // Clear export state
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // Export state
    exporting,
    progress,
    error,
    
    // Export functions
    exportCSV,
    exportJSON,
    exportExcel,
    exportChartImage,
    exportMultiSheetExcel,
    exportSummaryReport,
    
    // Utilities
    convertToCSV,
    formatDataForExport,
    clearError
  };
};

export default useExport; 
