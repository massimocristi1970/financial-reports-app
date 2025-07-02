// src/components/common/Navigation.js
import { useNavigate } from 'react-router-dom';
import React, { useState } from 'react';
import { REPORT_CONFIG } from '../../config/reportConfig';

const Navigation = ({ currentPath }) => {
	const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const navigationItems = [
    {
      id: 'overview',
      label: 'Overview',
      icon: '📊',
      path: '/',
      description: 'Dashboard overview'
    },
    ...Object.entries(REPORT_CONFIG).map(([key, config]) => ({
      id: key,
      label: config.title,
      icon: config.icon || '📈',
      path: `/${key}`,
      description: config.description
    })),
    {
      id: 'admin',
      label: 'Data Management',
      icon: '⚙️',
      path: '/admin',
      description: 'Upload and manage data'
    }
  ];

  const handleNavigate = (item) => {
    navigate(item.path);
    };

  const toggleCollapsed = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <nav className={`navigation ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="nav-header">
        <button 
          className="nav-toggle"
          onClick={toggleCollapsed}
          title={isCollapsed ? 'Expand Navigation' : 'Collapse Navigation'}
        >
          {isCollapsed ? '▶️' : '◀️'}
        </button>
        {!isCollapsed && <span className="nav-title">Reports</span>}
      </div>
      
      <div className="nav-content">
        <ul className="nav-list">
          {navigationItems.map((item) => (
            <li key={item.id} className="nav-item">
              <button
                className={`nav-link ${currentPath === item.path ? 'active' : ''}`}
                onClick={() => handleNavigate(item)}
                title={isCollapsed ? item.label : item.description}
              >
                <span className="nav-icon">{item.icon}</span>
                {!isCollapsed && (
                  <div className="nav-text">
                    <span className="nav-label">{item.label}</span>
                    <span className="nav-description">{item.description}</span>
                  </div>
                )}
              </button>
            </li>
          ))}
        </ul>
      </div>
      
      <div className="nav-footer">
        {!isCollapsed && (
          <div className="nav-info">
            <small>Financial Reports v{process.env.REACT_APP_VERSION || '1.0.0'}</small>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation; 
