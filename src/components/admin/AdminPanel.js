// src/components/admin/AdminPanel.js
import React, { useState, useEffect } from 'react';
import DataUploader from './DataUploader';
import DataManager from './DataManager';
import { REPORT_TYPES } from '../../utils/constants';

const AdminPanel = ({ 
  onDataChange,
  userRole = 'admin',
  className = ""
}) => {
  const [activeTab, setActiveTab] = useState('upload');
  const [uploadStats, setUploadStats] = useState({
    totalUploads: 0,
    lastUpload: null,
    dataSize: 0
  });
  const [notifications, setNotifications] = useState([]);

  // Check user permissions
  const hasUploadPermission = ['admin', 'uploader'].includes(userRole);
  const hasManagePermission = ['admin'].includes(userRole);

  useEffect(() => {
    // Set default tab based on permissions
    if (!hasUploadPermission && hasManagePermission) {
      setActiveTab('manage');
    } else if (!hasManagePermission && hasUploadPermission) {
      setActiveTab('upload');
    }
  }, [hasUploadPermission, hasManagePermission]);

  const handleUploadComplete = (uploadInfo) => {
    // Update stats
    setUploadStats(prev => ({
      totalUploads: prev.totalUploads + 1,
      lastUpload: uploadInfo.uploadedAt,
      dataSize: prev.dataSize + (uploadInfo.fileSize || 0)
    }));

    // Add notification
    addNotification({
      type: 'success',
      message: `Successfully uploaded ${uploadInfo.fileName} with ${uploadInfo.recordCount} records`,
      timestamp: new Date().toISOString()
    });

    // Notify parent component
    onDataChange?.(uploadInfo);

    // Switch to manage tab after successful upload
    if (hasManagePermission) {
      setActiveTab('manage');
    }
  };

  const handleDataChange = () => {
    // Refresh any cached data
    onDataChange?.();
    
    addNotification({
      type: 'info',
      message: 'Data has been updated',
      timestamp: new Date().toISOString()
    });
  };

  const addNotification = (notification) => {
    const id = Date.now();
    setNotifications(prev => [...prev, { ...notification, id }]);
    
    // Auto-remove notification after 5 seconds
    setTimeout(() => {
      removeNotification(id);
    }, 5000);
  };

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const tabs = [
    {
      key: 'upload',
      label: 'Upload Data',
      icon: '📤',
      component: DataUploader,
      enabled: hasUploadPermission
    },
    {
      key: 'manage',
      label: 'Manage Data',
      icon: '🗂️',
      component: DataManager,
      enabled: hasManagePermission
    }
  ].filter(tab => tab.enabled);

  if (tabs.length === 0) {
    return (
      <div className={`admin-panel no-access ${className}`}>
        <div className="no-access-content">
          <div className="no-access-icon">🔒</div>
          <h3>Access Denied</h3>
          <p>You don't have permission to access the admin panel.</p>
        </div>
      </div>
    );
  }

  const ActiveComponent = tabs.find(tab => tab.key === activeTab)?.component;

  return (
    <div className={`admin-panel ${className}`}>
      {/* Header */}
      <div className="admin-header">
        <div className="header-content">
          <div className="header-title">
            <h2>Admin Panel</h2>
            <p>Manage your financial reporting data</p>
          </div>
          
          <div className="header-stats">
            <div className="stat-card">
              <div className="stat-icon">📊</div>
              <div className="stat-content">
                <div className="stat-value">{Object.keys(REPORT_TYPES).length}</div>
                <div className="stat-label">Report Types</div>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon">📤</div>
              <div className="stat-content">
                <div className="stat-value">{uploadStats.totalUploads}</div>
                <div className="stat-label">Total Uploads</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="admin-nav">
        <div className="nav-tabs">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`nav-tab ${activeTab === tab.key ? 'active' : ''}`}
            >
              <span className="tab-icon">{tab.icon}</span>
              <span className="tab-label">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content Area */}
      <div className="admin-content">
        {ActiveComponent && (
          <ActiveComponent
            onUploadComplete={activeTab === 'upload' ? handleUploadComplete : undefined}
            onDataChange={activeTab === 'manage' ? handleDataChange : undefined}
          />
        )}
      </div>

      {/* Notifications */}
      {notifications.length > 0 && (
        <div className="notifications">
          {notifications.map(notification => (
            <div 
              key={notification.id}
              className={`notification ${notification.type}`}
            >
              <div className="notification-content">
                <span className="notification-icon">
                  {notification.type === 'success' ? '✅' : 
                   notification.type === 'error' ? '❌' : 'ℹ️'}
                </span>
                <span className="notification-message">
                  {notification.message}
                </span>
              </div>
              <button
                onClick={() => removeNotification(notification.id)}
                className="notification-close"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      <style jsx>{`
        .admin-panel {
          background: #f8fafc;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
        }

        .admin-panel.no-access {
          align-items: center;
          justify-content: center;
        }

        .no-access-content {
          text-align: center;
          padding: 40px;
          background: #fff;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
          max-width: 400px;
        }

        .no-access-icon {
          font-size: 48px;
          margin-bottom: 16px;
        }

        .no-access-content h3 {
          margin: 0 0 8px 0;
          color: #2d3748;
          font-size: 20px;
        }

        .no-access-content p {
          margin: 0;
          color: #718096;
        }

        .admin-header {
          background: #fff;
          border-bottom: 1px solid #e2e8f0;
          padding: 24px 32px;
        }

        .header-content {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          max-width: 1200px;
          margin: 0 auto;
        }

        .header-title h2 {
          margin: 0 0 4px 0;
          font-size: 24px;
          font-weight: 700;
          color: #1a202c;
        }

        .header-title p {
          margin: 0;
          color: #718096;
          font-size: 16px;
        }

        .header-stats {
          display: flex;
          gap: 16px;
        }

        .stat-card {
          background: #f7fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 16px;
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 120px;
        }

        .stat-icon {
          font-size: 24px;
        }

        .stat-content {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .stat-value {
          font-size: 20px;
          font-weight: 700;
          color: #2d3748;
        }

        .stat-label {
          font-size: 12px;
          color: #718096;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .admin-nav {
          background: #fff;
          border-bottom: 1px solid #e2e8f0;
          padding: 0 32px;
        }

        .nav-tabs {
          display: flex;
          max-width: 1200px;
          margin: 0 auto;
        }

        .nav-tab {
          background: none;
          border: none;
          padding: 16px 24px;
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          border-bottom: 3px solid transparent;
          transition: all 0.2s;
          font-size: 14px;
          font-weight: 500;
          color: #718096;
        }

        .nav-tab:hover {
          color: #4a5568;
          background: #f7fafc;
        }

        .nav-tab.active {
          color: #3182ce;
          border-bottom-color: #3182ce;
          background: #f7fafc;
        }

        .tab-icon {
          font-size: 16px;
        }

        .admin-content {
          flex: 1;
          padding: 32px;
          max-width: 1200px;
          margin: 0 auto;
          width: 100%;
          box-sizing: border-box;
        }

        .notifications {
          position: fixed;
          top: 20px;
          right: 20px;
          z-index: 1000;
          display: flex;
          flex-direction: column;
          gap: 12px;
          max-width: 400px;
        }

        .notification {
          background: #fff;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 16px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
          animation: slideIn 0.3s ease-out;
        }

        .notification.success {
          border-left: 4px solid #38a169;
          background: #f0fff4;
        }

        .notification.error {
          border-left: 4px solid #e53e3e;
          background: #fff5f5;
        }

        .notification.info {
          border-left: 4px solid #3182ce;
          background: #f7fafc;
        }

        .notification-content {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          flex: 1;
        }

        .notification-icon {
          font-size: 16px;
          flex-shrink: 0;
          margin-top: 2px;
        }

        .notification-message {
          font-size: 14px;
          color: #2d3748;
          line-height: 1.4;
        }

        .notification-close {
          background: none;
          border: none;
          color: #a0aec0;
          font-size: 18px;
          cursor: pointer;
          padding: 0;
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          transition: all 0.2s;
          flex-shrink: 0;
        }

        .notification-close:hover {
          background: #edf2f7;
          color: #4a5568;
        }

        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        /* Responsive Design */
        @media (max-width: 1024px) {
          .admin-header {
            padding: 20px 24px;
          }

          .admin-nav {
            padding: 0 24px;
          }

          .admin-content {
            padding: 24px;
          }

          .header-content {
            flex-direction: column;
            gap: 20px;
            align-items: stretch;
          }

          .header-stats {
            justify-content: space-around;
          }
        }

        @media (max-width: 768px) {
          .admin-header {
            padding: 16px 20px;
          }

          .admin-nav {
            padding: 0 20px;
          }

          .admin-content {
            padding: 20px;
          }

          .header-title h2 {
            font-size: 20px;
          }

          .header-title p {
            font-size: 14px;
          }

          .nav-tabs {
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
          }

          .nav-tab {
            white-space: nowrap;
            padding: 12px 20px;
          }

          .stat-card {
            padding: 12px;
            min-width: 100px;
          }

          .stat-value {
            font-size: 18px;
          }

          .notifications {
            top: 16px;
            right: 16px;
            left: 16px;
            max-width: none;
          }
        }

        @media (max-width: 480px) {
          .admin-header {
            padding: 12px 16px;
          }

          .admin-nav {
            padding: 0 16px;
          }

          .admin-content {
            padding: 16px;
          }

          .header-stats {
            flex-direction: column;
            gap: 12px;
          }

          .stat-card {
            justify-content: center;
          }

          .nav-tab {
            padding: 10px 16px;
            font-size: 13px;
          }

          .tab-icon {
            font-size: 14px;
          }

          .notification {
            padding: 12px;
          }

          .notification-message {
            font-size: 13px;
          }
        }
      `}</style>
    </div>
  );
};

export default AdminPanel; 
