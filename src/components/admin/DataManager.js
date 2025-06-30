// src/components/admin/DataManager.js
import React, { useState, useEffect } from 'react';
import { 
  getAllDataFromIndexedDB, 
  deleteDataFromIndexedDB, 
  clearAllData,
  getDataMetadata 
} from '../../utils/indexedDBHelper';
import { exportToCSV, exportToJSON } from '../../utils/formatters';
import { REPORT_TYPES } from '../../utils/constants';
import { formatDate, formatNumber } from '../../utils/formatters';

const DataManager = ({ 
  onDataChange,
  className = ""
}) => {
  const [dataState, setDataState] = useState({
    datasets: [],
    isLoading: true,
    selectedDatasets: [],
    showDeleteConfirm: false,
    deleteTarget: null,
    isExporting: false,
    exportProgress: 0
  });

  // Load data on component mount
  useEffect(() => {
    loadDatasets();
  }, []);

  const loadDatasets = async () => {
    setDataState(prev => ({ ...prev, isLoading: true }));
    
    try {
      const datasets = [];
      
      // Get data for each report type
      for (const reportType of Object.keys(REPORT_TYPES)) {
        try {
          const metadata = await getDataMetadata(reportType);
          if (metadata) {
            const data = await getAllDataFromIndexedDB(reportType);
            datasets.push({
              reportType,
              name: REPORT_TYPES[reportType].name,
              recordCount: data?.length || 0,
              lastModified: metadata.lastModified || new Date().toISOString(),
              uploadedAt: metadata.uploadedAt || new Date().toISOString(),
              fileSize: metadata.fileSize || 0,
              fileName: metadata.fileName || 'Unknown',
              hasData: data && data.length > 0
            });
          }
        } catch (error) {
          console.warn(`Error loading ${reportType}:`, error);
        }
      }

      setDataState(prev => ({
        ...prev,
        datasets,
        isLoading: false,
        selectedDatasets: []
      }));

    } catch (error) {
      console.error('Error loading datasets:', error);
      setDataState(prev => ({
        ...prev,
        isLoading: false,
        datasets: []
      }));
    }
  };

  const handleDatasetSelect = (reportType, isSelected) => {
    setDataState(prev => ({
      ...prev,
      selectedDatasets: isSelected 
        ? [...prev.selectedDatasets, reportType]
        : prev.selectedDatasets.filter(type => type !== reportType)
    }));
  };

  const handleSelectAll = () => {
    const datasetsWithData = dataState.datasets.filter(d => d.hasData);
    const allSelected = datasetsWithData.length > 0 && 
      datasetsWithData.every(d => dataState.selectedDatasets.includes(d.reportType));
    
    setDataState(prev => ({
      ...prev,
      selectedDatasets: allSelected ? [] : datasetsWithData.map(d => d.reportType)
    }));
  };

  const handleDeleteClick = (reportType = null) => {
    setDataState(prev => ({
      ...prev,
      showDeleteConfirm: true,
      deleteTarget: reportType
    }));
  };

  const handleDeleteConfirm = async () => {
    try {
      if (dataState.deleteTarget) {
        // Delete specific dataset
        await deleteDataFromIndexedDB(dataState.deleteTarget);
      } else if (dataState.selectedDatasets.length > 0) {
        // Delete selected datasets
        for (const reportType of dataState.selectedDatasets) {
          await deleteDataFromIndexedDB(reportType);
        }
      } else {
        // Delete all data
        await clearAllData();
      }

      setDataState(prev => ({
        ...prev,
        showDeleteConfirm: false,
        deleteTarget: null,
        selectedDatasets: []
      }));

      // Reload datasets
      await loadDatasets();
      
      // Notify parent of data change
      onDataChange?.();

    } catch (error) {
      console.error('Error deleting data:', error);
      alert('Error deleting data. Please try again.');
    }
  };

  const handleDeleteCancel = () => {
    setDataState(prev => ({
      ...prev,
      showDeleteConfirm: false,
      deleteTarget: null
    }));
  };

  const handleExport = async (format = 'csv') => {
    if (dataState.selectedDatasets.length === 0) return;

    setDataState(prev => ({
      ...prev,
      isExporting: true,
      exportProgress: 0
    }));

    try {
      const exportData = {};
      const totalDatasets = dataState.selectedDatasets.length;

      for (let i = 0; i < totalDatasets; i++) {
        const reportType = dataState.selectedDatasets[i];
        const data = await getAllDataFromIndexedDB(reportType);
        exportData[reportType] = data;
        
        const progress = Math.round(((i + 1) / totalDatasets) * 100);
        setDataState(prev => ({ ...prev, exportProgress: progress }));
      }

      // Generate export file
      if (format === 'csv') {
        // Export each dataset as separate CSV
        for (const [reportType, data] of Object.entries(exportData)) {
          const filename = `${reportType}-${formatDate(new Date(), 'YYYY-MM-DD')}.csv`;
          exportToCSV(data, filename);
        }
      } else if (format === 'json') {
        // Export all data as single JSON file
        const filename = `financial-reports-${formatDate(new Date(), 'YYYY-MM-DD')}.json`;
        exportToJSON(exportData, filename);
      }

      setDataState(prev => ({
        ...prev,
        isExporting: false,
        exportProgress: 0
      }));

    } catch (error) {
      console.error('Export error:', error);
      alert('Error exporting data. Please try again.');
      setDataState(prev => ({
        ...prev,
        isExporting: false,
        exportProgress: 0
      }));
    }
  };

  const getTotalRecords = () => {
    return dataState.datasets.reduce((total, dataset) => total + dataset.recordCount, 0);
  };

  const getTotalSize = () => {
    const totalBytes = dataState.datasets.reduce((total, dataset) => total + dataset.fileSize, 0);
    return totalBytes > 0 ? `${(totalBytes / 1024).toFixed(1)} KB` : 'Unknown';
  };

  const getSelectedCount = () => dataState.selectedDatasets.length;

  if (dataState.isLoading) {
    return (
      <div className={`data-manager loading ${className}`}>
        <div className="loading-content">
          <div className="loading-spinner">⏳</div>
          <div className="loading-text">Loading datasets...</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`data-manager ${className}`}>
      {/* Header */}
      <div className="manager-header">
        <div className="header-info">
          <h3>Data Management</h3>
          <p>Manage your uploaded datasets and export data</p>
        </div>
        
        <div className="header-stats">
          <div className="stat-item">
            <span className="stat-label">Datasets:</span>
            <span className="stat-value">{dataState.datasets.filter(d => d.hasData).length}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Total Records:</span>
            <span className="stat-value">{formatNumber(getTotalRecords())}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Total Size:</span>
            <span className="stat-value">{getTotalSize()}</span>
          </div>
        </div>
      </div>

      {/* Actions Bar */}
      <div className="actions-bar">
        <div className="selection-actions">
          <button
            onClick={handleSelectAll}
            className="select-all-btn"
            disabled={dataState.datasets.filter(d => d.hasData).length === 0}
          >
            {dataState.selectedDatasets.length === dataState.datasets.filter(d => d.hasData).length && 
             dataState.datasets.filter(d => d.hasData).length > 0 ? 'Deselect All' : 'Select All'}
          </button>
          
          {getSelectedCount() > 0 && (
            <span className="selection-count">
              {getSelectedCount()} selected
            </span>
          )}
        </div>

        <div className="action-buttons">
          {getSelectedCount() > 0 && (
            <>
              <button
                onClick={() => handleExport('csv')}
                disabled={dataState.isExporting}
                className="export-btn csv"
              >
                Export CSV
              </button>
              <button
                onClick={() => handleExport('json')}
                disabled={dataState.isExporting}
                className="export-btn json"
              >
                Export JSON
              </button>
              <button
                onClick={() => handleDeleteClick()}
                className="delete-btn"
              >
                Delete Selected
              </button>
            </>
          )}
          
          <button
            onClick={() => handleDeleteClick()}
            className="delete-all-btn"
            disabled={dataState.datasets.filter(d => d.hasData).length === 0}
          >
            Clear All Data
          </button>
        </div>
      </div>

      {/* Export Progress */}
      {dataState.isExporting && (
        <div className="export-progress">
          <div className="progress-label">
            Exporting... {dataState.exportProgress}%
          </div>
          <div className="progress-bar">
            <div 
              className="progress-fill"
              style={{ width: `${dataState.exportProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Datasets Table */}
      <div className="datasets-table">
        {dataState.datasets.length > 0 ? (
          <table className="data-table">
            <thead>
              <tr>
                <th className="select-col">
                  <input
                    type="checkbox"
                    checked={dataState.datasets.filter(d => d.hasData).length > 0 && 
                            dataState.datasets.filter(d => d.hasData).every(d => 
                              dataState.selectedDatasets.includes(d.reportType))}
                    onChange={handleSelectAll}
                    disabled={dataState.datasets.filter(d => d.hasData).length === 0}
                  />
                </th>
                <th>Report Type</th>
                <th>Records</th>
                <th>File Name</th>
                <th>Last Modified</th>
                <th>Size</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {dataState.datasets.map(dataset => (
                <tr key={dataset.reportType} className={dataset.hasData ? '' : 'no-data'}>
                  <td className="select-col">
                    {dataset.hasData && (
                      <input
                        type="checkbox"
                        checked={dataState.selectedDatasets.includes(dataset.reportType)}
                        onChange={(e) => handleDatasetSelect(dataset.reportType, e.target.checked)}
                      />
                    )}
                  </td>
                  <td className="report-type-col">
                    <div className="report-info">
                      <span className="report-name">{dataset.name}</span>
                      <span className="report-code">({dataset.reportType})</span>
                    </div>
                  </td>
                  <td className="records-col">
                    {dataset.hasData ? formatNumber(dataset.recordCount) : '—'}
                  </td>
                  <td className="filename-col">
                    {dataset.hasData ? dataset.fileName : '—'}
                  </td>
                  <td className="modified-col">
                    {dataset.hasData ? formatDate(dataset.lastModified) : '—'}
                  </td>
                  <td className="size-col">
                    {dataset.hasData && dataset.fileSize > 0 ? 
                      `${(dataset.fileSize / 1024).toFixed(1)} KB` : '—'}
                  </td>
                  <td className="actions-col">
                    {dataset.hasData && (
                      <button
                        onClick={() => handleDeleteClick(dataset.reportType)}
                        className="delete-single-btn"
                        title="Delete this dataset"
                      >
                        🗑️
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="empty-state">
            <div className="empty-icon">📊</div>
            <div className="empty-text">No datasets found</div>
            <div className="empty-hint">Upload some CSV files to get started</div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {dataState.showDeleteConfirm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h4>Confirm Delete</h4>
            </div>
            <div className="modal-body">
              <p>
                {dataState.deleteTarget 
                  ? `Are you sure you want to delete the ${REPORT_TYPES[dataState.deleteTarget]?.name} dataset?`
                  : dataState.selectedDatasets.length > 0
                    ? `Are you sure you want to delete ${dataState.selectedDatasets.length} selected datasets?`
                    : 'Are you sure you want to delete ALL datasets?'
                }
              </p>
              <p className="warning-text">This action cannot be undone.</p>
            </div>
            <div className="modal-actions">
              <button
                onClick={handleDeleteCancel}
                className="cancel-btn"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="confirm-delete-btn"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .data-manager {
          background: #fff;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          overflow: hidden;
        }

        .data-manager.loading {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 400px;
        }

        .loading-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }

        .loading-spinner {
          font-size: 24px;
        }

        .loading-text {
          color: #718096;
          font-size: 14px;
        }

        .manager-header {
          background: #f8fafc;
          border-bottom: 1px solid #e2e8f0;
          padding: 20px 24px;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }

        .header-info h3 {
          margin: 0 0 4px 0;
          font-size: 18px;
          font-weight: 600;
          color: #2d3748;
        }

        .header-info p {
          margin: 0;
          color: #718096;
          font-size: 14px;
        }

        .header-stats {
          display: flex;
          gap: 24px;
        }

        .stat-item {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 2px;
        }

        .stat-label {
          font-size: 12px;
          color: #718096;
        }

        .stat-value {
          font-size: 16px;
          font-weight: 600;
          color: #2d3748;
        }

        .actions-bar {
          background: #fff;
          border-bottom: 1px solid #e2e8f0;
          padding: 16px 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .selection-actions {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .select-all-btn {
          background: none;
          border: 1px solid #cbd5e0;
          color: #4a5568;
          padding: 8px 16px;
          border-radius: 4px;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .select-all-btn:hover:not(:disabled) {
          background: #f7fafc;
          border-color: #a0aec0;
        }

        .select-all-btn:disabled {
          color: #a0aec0;
          border-color: #e2e8f0;
          cursor: not-allowed;
        }

        .selection-count {
          font-size: 14px;
          color: #718096;
          font-weight: 500;
        }

        .action-buttons {
          display: flex;
          gap: 8px;
        }

        .export-btn {
          background: #3182ce;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          font-size: 14px;
          cursor: pointer;
          transition: background 0.2s;
        }

        .export-btn:hover:not(:disabled) {
          background: #2c5aa0;
        }

        .export-btn:disabled {
          background: #a0aec0;
          cursor: not-allowed;
        }

        .export-btn.json {
          background: #805ad5;
        }

        .export-btn.json:hover:not(:disabled) {
          background: #6b46c1;
        }

        .delete-btn {
          background: #e53e3e;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          font-size: 14px;
          cursor: pointer;
          transition: background 0.2s;
        }

        .delete-btn:hover {
          background: #c53030;
        }

        .delete-all-btn {
          background: none;
          border: 1px solid #e53e3e;
          color: #e53e3e;
          padding: 8px 16px;
          border-radius: 4px;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .delete-all-btn:hover:not(:disabled) {
          background: #e53e3e;
          color: white;
        }

        .delete-all-btn:disabled {
          color: #a0aec0;
          border-color: #e2e8f0;
          cursor: not-allowed;
        }

        .export-progress {
          background: #f7fafc;
          border-bottom: 1px solid #e2e8f0;
          padding: 16px 24px;
        }

        .progress-label {
          font-size: 14px;
          color: #4a5568;
          margin-bottom: 8px;
        }

        .progress-bar {
          width: 100%;
          height: 6px;
          background: #e2e8f0;
          border-radius: 3px;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          background: #3182ce;
          border-radius: 3px;
          transition: width 0.3s ease;
        }

        .datasets-table {
          flex: 1;
          overflow: auto;
        }

        .data-table {
          width: 100%;
          border-collapse: collapse;
        }

        .data-table th {
          background: #f8fafc;
          border-bottom: 1px solid #e2e8f0;
          padding: 12px 16px;
          text-align: left;
          font-size: 13px;
          font-weight: 600;
          color: #4a5568;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .data-table td {
          border-bottom: 1px solid #f1f5f9;
          padding: 16px;
          font-size: 14px;
          color: #2d3748;
        }

        .data-table tr.no-data {
          opacity: 0.5;
        }

        .data-table tr:hover:not(.no-data) {
          background: #f7fafc;
        }

        .select-col {
          width: 40px;
          text-align: center;
        }

        .report-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .report-name {
          font-weight: 500;
        }

        .report-code {
          font-size: 12px;
          color: #718096;
        }

        .records-col, .size-col {
          text-align: right;
          font-weight: 500;
        }

        .modified-col {
          color: #718096;
          font-size: 13px;
        }

        .actions-col {
          width: 60px;
          text-align: center;
        }

        .delete-single-btn {
          background: none;
          border: none;
          font-size: 16px;
          cursor: pointer;
          padding: 4px;
          border-radius: 4px;
          transition: background 0.2s;
        }

        .delete-single-btn:hover {
          background: #fed7d7;
        }

        .empty-state {
          padding: 60px 20px;
          text-align: center;
          color: #718096;
        }

        .empty-icon {
          font-size: 48px;
          margin-bottom: 16px;
          opacity: 0.5;
        }

        .empty-text {
          font-size: 18px;
          font-weight: 500;
          margin-bottom: 8px;
          color: #4a5568;
        }

        .empty-hint {
          font-size: 14px;
        }

        /* Modal Styles */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .modal-content {
          background: #fff;
          border-radius: 8px;
          max-width: 400px;
          width: 90%;
          margin: 20px;
        }

        .modal-header {
          border-bottom: 1px solid #e2e8f0;
          padding: 20px 24px 16px;
        }

        .modal-header h4 {
          margin: 0;
          font-size: 18px;
          font-weight: 600;
          color: #2d3748;
        }

        .modal-body {
          padding: 20px 24px;
        }

        .modal-body p {
          margin: 0 0 12px 0;
          color: #4a5568;
          line-height: 1.5;
        }

        .warning-text {
          font-size: 13px;
          color: #e53e3e;
          font-weight: 500;
        }

        .modal-actions {
          border-top: 1px solid #e2e8f0;
          padding: 16px 24px;
          display: flex;
          gap: 12px;
          justify-content: flex-end;
        }

        .cancel-btn {
          background: none;
          border: 1px solid #cbd5e0;
          color: #4a5568;
          padding: 8px 16px;
          border-radius: 4px;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .cancel-btn:hover {
          background: #f7fafc;
          border-color: #a0aec0;
        }

        .confirm-delete-btn {
          background: #e53e3e;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          font-size: 14px;
          cursor: pointer;
          transition: background 0.2s;
        }

        .confirm-delete-btn:hover {
          background: #c53030;
        }

        /* Responsive Design */
        @media (max-width: 768px) {
          .manager-header {
            flex-direction: column;
            gap: 16px;
            align-items: stretch;
          }

          .header-stats {
            justify-content: space-between;
          }

          .actions-bar {
            flex-direction: column;
            gap: 12px;
            align-items: stretch;
          }

          .action-buttons {
            flex-wrap: wrap;
          }

          .data-table {
            font-size: 13px;
          }

          .data-table th,
          .data-table td {
            padding: 8px 12px;
          }

          .stat-item {
            align-items: center;
          }
        }

        @media (max-width: 480px) {
          .manager-header {
            padding: 16px;
          }

          .actions-bar {
            padding: 12px 16px;
          }

          .header-stats {
            flex-direction: column;
            gap: 8px;
          }

          .action-buttons {
            flex-direction: column;
          }

          .export-btn, .delete-btn, .delete-all-btn {
            width: 100%;
          }

          .modal-content {
            margin: 16px;
            width: calc(100% - 32px);
          }

          .modal-header, .modal-body, .modal-actions {
            padding: 16px;
          }

          .modal-actions {
            flex-direction: column;
          }

          .cancel-btn, .confirm-delete-btn {
            width: 100%;
          }

          /* Hide some columns on mobile */
          .data-table .size-col,
          .data-table .modified-col {
            display: none;
          }
        }
      `}</style>
    </div>
  );
};

export default DataManager; 
