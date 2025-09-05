// src/components/common/Layout.js - DEBUG VERSION
import React from 'react';
import { useLocation, Link, Outlet } from 'react-router-dom';

const Layout = () => {
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Overview', icon: '📊' },
    { path: '/lending-volume', label: 'Lending', icon: '💰' },
    { path: '/arrears', label: 'Arrears', icon: '⚠️' },
    { path: '/liquidations', label: 'Liquidations', icon: '🔄' },
    { path: '/call-center', label: 'Call Center', icon: '📞' },
    { path: '/complaints', label: 'Complaints', icon: '📋' },
    { path: '/admin', label: 'Data Management', icon: '⚙️' },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg-secondary)' }}>
      {/* Sidebar */}
      <nav style={{ 
        width: '250px', 
        backgroundColor: 'var(--bg-card)', 
        padding: '20px',
        borderRight: '1px solid var(--border-primary)'
      }}>
        <h2 style={{ color: 'var(--text-primary)', marginBottom: '20px' }}>
          Financial Reports
        </h2>
        
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {navItems.map((item) => (
            <li key={item.path} style={{ marginBottom: '10px' }}>
              <Link
                to={item.path}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 15px',
                  borderRadius: '6px',
                  textDecoration: 'none',
                  color: location.pathname === item.path ? 'white' : 'var(--text-primary)',
                  backgroundColor: location.pathname === item.path ? 'var(--color-primary)' : 'transparent',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  if (location.pathname !== item.path) {
                    e.target.style.backgroundColor = 'var(--bg-secondary)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (location.pathname !== item.path) {
                    e.target.style.backgroundColor = 'transparent';
                  }
                }}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
        
        <div style={{ 
          marginTop: '20px', 
          padding: '15px', 
          backgroundColor: 'var(--bg-secondary)', 
          borderRadius: '6px' 
        }}>
          <p style={{ 
            color: 'var(--text-secondary)', 
            fontSize: '14px', 
            margin: 0 
          }}>
            Current path: {location.pathname}
          </p>
        </div>
      </nav>

      {/* Main Content */}
      <main style={{ 
        flex: 1, 
        padding: '20px',
        backgroundColor: 'var(--bg-secondary)',
        color: 'var(--text-primary)'
      }}>
        <div style={{
          backgroundColor: 'var(--bg-card)',
          borderRadius: '8px',
          padding: '20px',
          minHeight: '500px'
        }}>
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;