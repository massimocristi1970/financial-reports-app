// src/components/admin/DataUploader.js
import React, { useState, useRef, useCallback } from 'react';
import FileValidator from './FileValidator';
import { REPORT_TYPES } from '../../utils/constants';
import { saveDataToIndexedDB } from '../../utils/indexedDBHelper';
import { processCSVFile } from '../../utils/csvProcessor';

const DataUploader = ({ 
  onUploadComplete,
  onUploadProgress,
  defaultReportType = null,
  allowedTypes = Object.values(REPORT_TYPES),
  maxFileSize = 10 * 1024 * 1024, // 10MB
  className = ""
}) => {
  const [uploadState, setUploadState] = useState({
    file: null,
    reportType: defaultReportType || '',
    isUploading: false,
    uploadProgress: 0,
    validationResult: null,
    error: null,
    success: false
  });

  const fileInputRef = useRef(null);
  const dropZoneRef = useRef(null);

  // Handle file selection
  const handleFileSelect = useCallback((file) => {
    // Validate file type
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setUploadState(prev => ({
        ...prev,
        error: 'Please select a CSV file',
        file: null
      }));
      return;
    }

    // Validate file size
    if (file.size > maxFileSize) {
      setUploadState(prev => ({
        ...prev,
        error: `File size must be less than ${Math.round(maxFileSize / 1024 / 1024)}MB`,
        file: null
      }));
      return;
    }

    setUploadState(prev => ({
      ...prev,
      file,
      error: null,
      success: false,
      validationResult: null
    }));
  }, [maxFileSize]);

  // Handle file input change
  const handleFileInputChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  // Handle drag and drop
  const handleDrop = useCallback((event) => {
    event.preventDefault();
    event.stopPropagation();
    
    const files = Array.from(event.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  const handleDragOver = useCallback((event) => {
    event.preventDefault();
    event.stopPropagation();
  }, []);

  const handleDragEnter = useCallback((event) => {
    event.preventDefault();
    event.stopPropagation();
  }, []);

  // Handle report type change
  const handleReportTypeChange = (reportType) => {
    setUploadState(prev => ({
      ...prev,
      reportType,
      validationResult: null,
      error: null
    }));
  };

  // Handle validation results
  const handleValidation = (validationResult) => {
    setUploadState(prev => ({
      ...prev,
      validationResult,
      error: validationResult.isValid === false ? 'File validation failed' : null
    }));
  };

  // Handle upload
  const handleUpload = async () => {
    if (!uploadState.file || !uploadState.reportType) {
      setUploadState(prev => ({
        ...prev,
        error: 'Please select a file and report type'
      }));
      return;
    }

    if (!uploadState.validationResult?.isValid) {
      setUploadState(prev => ({
        ...prev,
        error: 'Please fix validation errors before uploading'
      }));
      return;
    }

    setUploadState(prev => ({
      ...prev,
      isUploading: true,
      uploadProgress: 0,
      error: null
    }));

    try {
      // Process CSV file
      setUploadState(prev => ({ ...prev, uploadProgress: 25 }));
      onUploadProgress?.(25);

      const processedData = await processCSVFile(uploadState.file, uploadState.reportType);
      
      setUploadState(prev => ({ ...prev, uploadProgress: 50 }));
      onUploadProgress?.(50);

      // Save to IndexedDB
      await saveDataToIndexedDB(uploadState.reportType, processedData);
      
      setUploadState(prev => ({ ...prev, uploadProgress: 75 }));
      onUploadProgress?.(75);

      // Complete
      setUploadState(prev => ({
        ...prev,
        uploadProgress: 100,
        isUploading: false,
        success: true
      }));

      onUploadProgress?.(100);
      onUploadComplete?.({
        reportType: uploadState.reportType,
        fileName: uploadState.file.name,
        recordCount: processedData.length,
        uploadedAt: new Date().toISOString()
      });

    } catch (error) {
      setUploadState(prev => ({
        ...prev,
        isUploading: false,
        uploadProgress: 0,
        error: `Upload failed: ${error.message}`
      }));
      onUploadProgress?.(0);
    }
  };

  // Clear file selection
  const handleClear = () => {
    setUploadState({
      file: null,
      reportType: uploadState.reportType,
      isUploading: false,
      uploadProgress: 0,
      validationResult: null,
      error: null,
      success: false
    });
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Trigger file picker
  const triggerFilePicker = () => {
    fileInputRef.current?.click();
  };

	const getReportDisplayName = (reportTypeValue) => {
		// Find the key that matches this value
		const reportKey = Object.keys(REPORT_TYPES).find(
		key => REPORT_TYPES[key] === reportTypeValue
	);
  
	// Convert key to display name (e.g., "LENDING_VOLUME" -> "Lending Volume")
	if (reportKey) {
		return reportKey
		.split('_')
		.map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
		.join(' ');
	}
  
	return reportTypeValue;
	};

  const canUpload = uploadState.file && 
                   uploadState.reportType && 
                   uploadState.validationResult?.isValid && 
                   !uploadState.isUploading;

  return (
    <div className={`data-uploader ${className}`}>
      <div className="uploader-header">
        <h3>Upload Data File</h3>
        <p>Select a CSV file and report type to upload data to the dashboard</p>
      </div>

      {/* Report Type Selection */}
      <div className="report-type-section">
        <label className="section-label">Report Type</label>
        <select
          value={uploadState.reportType}
          onChange={(e) => handleReportTypeChange(e.target.value)}
          className="report-type-select"
          disabled={uploadState.isUploading}
        >
          <option value="">Select report type...</option>
          {allowedTypes.map(reportTypeValue => (
			<option key={reportTypeValue} value={reportTypeValue}>
				{getReportDisplayName(reportTypeValue)}
			</option>
			))}
        </select>
      </div>

      {/* File Upload Section */}
      <div className="file-upload-section">
        <label className="section-label">CSV File</label>
        
        {/* Drop Zone */}
        <div
          ref={dropZoneRef}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragEnter={handleDragEnter}
          onClick={triggerFilePicker}
          className={`drop-zone ${uploadState.file ? 'has-file' : ''} ${uploadState.isUploading ? 'uploading' : ''}`}
        >
          {uploadState.file ? (
            <div className="file-info">
              <div className="file-icon">📄</div>
              <div className="file-details">
                <div className="file-name">{uploadState.file.name}</div>
                <div className="file-meta">
                  {(uploadState.file.size / 1024).toFixed(1)} KB • {uploadState.file.type || 'text/csv'}
                </div>
              </div>
              {!uploadState.isUploading && (
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClear();
                  }}
                  className="remove-file-btn"
                  title="Remove file"
                >
                  ×
                </button>
              )}
            </div>
          ) : (
            <div className="drop-zone-content">
              <div className="upload-icon">📁</div>
              <div className="upload-text">
                <strong>Click to browse</strong> or drag and drop your CSV file here
              </div>
              <div className="upload-hint">
                Maximum file size: {Math.round(maxFileSize / 1024 / 1024)}MB
              </div>
            </div>
          )}
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileInputChange}
          style={{ display: 'none' }}
          disabled={uploadState.isUploading}
        />
      </div>

      {/* File Validation */}
      {uploadState.file && uploadState.reportType && (
        <div className="validation-section">
          <FileValidator
            file={uploadState.file}
            reportType={uploadState.reportType}
            onValidation={handleValidation}
            autoValidate={true}
          />
        </div>
      )}

      {/* Upload Progress */}
      {uploadState.isUploading && (
        <div className="progress-section">
          <div className="progress-label">
            Uploading... {uploadState.uploadProgress}%
          </div>
          <div className="progress-bar">
            <div 
              className="progress-fill"
              style={{ width: `${uploadState.uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Error Message */}
      {uploadState.error && (
        <div className="error-message">
          <span className="error-icon">❌</span>
          <span className="error-text">{uploadState.error}</span>
        </div>
      )}

      {/* Success Message */}
      {uploadState.success && (
        <div className="success-message">
          <span className="success-icon">✅</span>
          <span className="success-text">
            File uploaded successfully! Data is now available in the dashboard.
          </span>
        </div>
      )}

      {/* Upload Button */}
      <div className="upload-actions">
        <button
          onClick={handleUpload}
          disabled={!canUpload}
          className="upload-btn"
        >
          {uploadState.isUploading ? 'Uploading...' : 'Upload Data'}
        </button>
        
        {uploadState.file && !uploadState.isUploading && (
          <button
            onClick={handleClear}
            className="clear-btn"
          >
            Clear
          </button>
        )}
      </div>

      <style jsx>{`
        .data-uploader {
          background: #fff;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .uploader-header {
          text-align: center;
        }

        .uploader-header h3 {
          margin: 0 0 8px 0;
          font-size: 20px;
          font-weight: 600;
          color: #2d3748;
        }

        .uploader-header p {
          margin: 0;
          color: #718096;
          font-size: 14px;
        }

        .section-label {
          display: block;
          font-weight: 600;
          font-size: 14px;
          color: #2d3748;
          margin-bottom: 8px;
        }

        .report-type-select {
          width: 100%;
          padding: 10px 12px;
          border: 1px solid #cbd5e0;
          border-radius: 6px;
          font-size: 14px;
          background: #fff;
          transition: border-color 0.2s;
        }

        .report-type-select:focus {
          outline: none;
          border-color: #3182ce;
          box-shadow: 0 0 0 3px rgba(49, 130, 206, 0.1);
        }

        .report-type-select:disabled {
          background: #f7fafc;
          color: #a0aec0;
        }

        .drop-zone {
          border: 2px dashed #cbd5e0;
          border-radius: 8px;
          padding: 40px 20px;
          text-align: center;
          cursor: pointer;
          transition: all 0.2s;
          background: #fafafa;
          min-height: 120px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .drop-zone:hover {
          border-color: #3182ce;
          background: #f7fafc;
        }

        .drop-zone.has-file {
          border-color: #38a169;
          background: #f0fff4;
          border-style: solid;
        }

        .drop-zone.uploading {
          pointer-events: none;
          opacity: 0.7;
        }

        .drop-zone-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }

        .upload-icon {
          font-size: 32px;
          opacity: 0.7;
        }

        .upload-text {
          font-size: 16px;
          color: #4a5568;
        }

        .upload-hint {
          font-size: 13px;
          color: #718096;
        }

        .file-info {
          display: flex;
          align-items: center;
          gap: 16px;
          width: 100%;
          max-width: 400px;
          padding: 16px;
          background: #fff;
          border-radius: 6px;
          border: 1px solid #e2e8f0;
        }

        .file-icon {
          font-size: 24px;
          flex-shrink: 0;
        }

        .file-details {
          flex: 1;
          text-align: left;
        }

        .file-name {
          font-size: 14px;
          font-weight: 600;
          color: #2d3748;
          margin-bottom: 4px;
        }

        .file-meta {
          font-size: 12px;
          color: #718096;
        }

        .remove-file-btn {
          background: #e53e3e;
          color: white;
          border: none;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          font-size: 16px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.2s;
          flex-shrink: 0;
        }

        .remove-file-btn:hover {
          background: #c53030;
        }

        .progress-section {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .progress-label {
          font-size: 14px;
          font-weight: 500;
          color: #4a5568;
        }

        .progress-bar {
          width: 100%;
          height: 8px;
          background: #e2e8f0;
          border-radius: 4px;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          background: #3182ce;
          border-radius: 4px;
          transition: width 0.3s ease;
        }

        .error-message {
          background: #fed7d7;
          border: 1px solid #feb2b2;
          color: #c53030;
          padding: 12px 16px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .error-icon {
          font-size: 16px;
          flex-shrink: 0;
        }

        .error-text {
          font-size: 14px;
        }

        .success-message {
          background: #c6f6d5;
          border: 1px solid #9ae6b4;
          color: #276749;
          padding: 12px 16px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .success-icon {
          font-size: 16px;
          flex-shrink: 0;
        }

        .success-text {
          font-size: 14px;
        }

        .upload-actions {
          display: flex;
          gap: 12px;
          justify-content: center;
          padding-top: 8px;
        }

        .upload-btn {
          background: #3182ce;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.2s;
          min-width: 120px;
        }

        .upload-btn:hover:not(:disabled) {
          background: #2c5aa0;
        }

        .upload-btn:disabled {
          background: #a0aec0;
          cursor: not-allowed;
        }

        .clear-btn {
          background: none;
          border: 1px solid #cbd5e0;
          color: #4a5568;
          padding: 12px 24px;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .clear-btn:hover {
          background: #f7fafc;
          border-color: #a0aec0;
        }

        /* Responsive Design */
        @media (max-width: 768px) {
          .data-uploader {
            padding: 20px;
          }

          .drop-zone {
            padding: 30px 16px;
            min-height: 100px;
          }

          .upload-icon {
            font-size: 28px;
          }

          .upload-text {
            font-size: 15px;
          }

          .file-info {
            padding: 12px;
            gap: 12px;
          }

          .upload-actions {
            flex-direction: column;
          }

          .upload-btn, .clear-btn {
            width: 100%;
          }
        }

        @media (max-width: 480px) {
          .data-uploader {
            padding: 16px;
          }

          .uploader-header h3 {
            font-size: 18px;
          }

          .drop-zone {
            padding: 24px 12px;
          }

          .file-info {
            flex-direction: column;
            text-align: center;
            gap: 8px;
          }

          .remove-file-btn {
            align-self: center;
          }
        }
      `}</style>
    </div>
  );
};

export default DataUploader;