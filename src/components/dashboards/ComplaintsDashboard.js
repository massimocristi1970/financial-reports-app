// src/components/dashboards/ComplaintsDashboard.js
import React, { useState, useEffect } from 'react';
import KPICard, { PercentageKPICard } from '../charts/KPICard';
import LineChart from '../charts/LineChart';
import BarChart from '../charts/BarChart';
import PieChart from '../charts/PieChart';
import TrendChart from '../charts/TrendChart';
import DataTable from '../common/DataTable';
import { REPORT_CONFIG } from '../../config/reportConfig';

const ComplaintsDashboard = ({ data, dateRange, filters, onFilterChange }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [processedData, setProcessedData] = useState(null);

  const reportConfig = REPORT_CONFIG['complaints'];

  // Process complaints data
  useEffect(() => {
    if (!data || data.length === 0) {
      setProcessedData(null);
      return;
    }

    try {
      setIsLoading(true);

      // Calculate KPIs
      const totalComplaints = data.length;
      const resolvedComplaints = data.filter(record => record.status === 'resolved').length;
      const pendingComplaints = data.filter(record => record.status === 'pending').length;
      const escalatedComplaints = data.filter(record => record.escalated === true).length;
      
      const resolutionRate = (resolvedComplaints / totalComplaints) * 100;
      const escalationRate = (escalatedComplaints / totalComplaints) * 100;
      
      // Calculate average resolution time
      const resolvedWithTime = data.filter(record => 
        record.status === 'resolved' && record.resolution_time
      );
      const avgResolutionTime = resolvedWithTime.length > 0 ? 
        resolvedWithTime.reduce((sum, record) => sum + record.resolution_time, 0) / resolvedWithTime.length : 0;

      // SLA compliance (target: resolve within 5 days)
      const slaTarget = 5; // days
      const withinSLA = resolvedWithTime.filter(record => record.resolution_time <= slaTarget).length;
      const slaCompliance = resolvedWithTime.length > 0 ? (withinSLA / resolvedWithTime.length) * 100 : 0;

      // Previous period comparison (mock)
      const previousResolutionRate = resolutionRate * 0.93;
      const previousSlaCompliance = slaCompliance * 0.88;

      // Time series data
      const monthlyData = data.reduce((acc, record) => {
        const month = new Date(record.complaint_date || record.date).toISOString().substr(0, 7);
        if (!acc[month]) {
          acc[month] = { 
            total: 0, 
            resolved: 0, 
            escalated: 0,
            pending: 0,
            totalResolutionTime: 0,
            resolvedCount: 0
          };
        }
        acc[month].total += 1;
        if (record.status === 'resolved') {
          acc[month].resolved += 1;
          acc[month].resolvedCount += 1;
          acc[month].totalResolutionTime += record.resolution_time || 0;
        }
        if (record.status === 'pending') acc[month].pending += 1;
        if (record.escalated) acc[month].escalated += 1;
        return acc;
      }, {});

      const timeLabels = Object.keys(monthlyData).sort();
      const complaintsVolumeData = timeLabels.map(month => monthlyData[month].total);
      const resolutionRateData = timeLabels.map(month => 
        monthlyData[month].total > 0 ? (monthlyData[month].resolved / monthlyData[month].total) * 100 : 0
      );
      const avgResolutionTimeData = timeLabels.map(month => 
        monthlyData[month].resolvedCount > 0 ? 
          monthlyData[month].totalResolutionTime / monthlyData[month].resolvedCount : 0
      );

      // Complaint categories analysis
      const categories = data.reduce((acc, record) => {
        const category = record.category || 'Unknown';
        if (!acc[category]) {
          acc[category] = { count: 0, resolved: 0, escalated: 0, totalTime: 0 };
        }
        acc[category].count += 1;
        if (record.status === 'resolved') acc[category].resolved += 1;
        if (record.escalated) acc[category].escalated += 1;
        acc[category].totalTime += record.resolution_time || 0;
        return acc;
      }, {});

      // Priority analysis
      const priorities = data.reduce((acc, record) => {
        const priority = record.priority || 'Medium';
        if (!acc[priority]) {
          acc[priority] = { count: 0, resolved: 0, avgTime: 0 };
        }
        acc[priority].count += 1;
        if (record.status === 'resolved') acc[priority].resolved += 1;
        return acc;
      }, {});

      // Source analysis
      const sources = data.reduce((acc, record) => {
        const source = record.source || 'Unknown';
        if (!acc[source]) {
          acc[source] = { count: 0, escalated: 0 };
        }
        acc[source].count += 1;
        if (record.escalated) acc[source].escalated += 1;
        return acc;
      }, {});

      // Status distribution
      const statusData = {
        'Resolved': resolvedComplaints,
        'Pending': pendingComplaints,
        'In Progress': data.filter(r => r.status === 'in-progress').length,
        'Escalated': escalatedComplaints
      };

      // Satisfaction scores (if available)
      const satisfactionData = data.filter(record => record.satisfaction_score)
        .reduce((acc, record) => {
          const score = record.satisfaction_score;
          if (score >= 4) acc.satisfied += 1;
          else if (score >= 3) acc.neutral += 1;
          else acc.unsatisfied += 1;
          acc.total += 1;
          return acc;
        }, { satisfied: 0, neutral: 0, unsatisfied: 0, total: 0 });

      setProcessedData({
        kpis: {
          totalComplaints,
          resolutionRate,
          escalationRate,
          avgResolutionTime,
          slaCompliance,
          pendingComplaints,
          previousResolutionRate,
          previousSlaCompliance
        },
        timeSeries: {
          labels: timeLabels,
          volume: complaintsVolumeData,
          resolutionRate: resolutionRateData,
          avgResolutionTime: avgResolutionTimeData
        },
        categories,
        priorities,
        sources,
        statusData,
        satisfactionData,
        rawData: data
      });

    } catch (err) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, [data, dateRange, filters]);

  // Chart data preparation
  const getComplaintsVolumeChartData = () => ({
    labels: processedData?.timeSeries.labels.map(label => 
      new Date(label + '-01').toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
    ) || [],
    datasets: [{
      label: 'Total Complaints',
      data: processedData?.timeSeries.volume || [],
      borderColor: '#dc3545',
      backgroundColor: '#dc354520',
      fill: true
    }]
  });

  const getResolutionRateChartData = () => ({
    labels: processedData?.timeSeries.labels.map(label => 
      new Date(label + '-01').toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
    ) || [],
    datasets: [{
      label: 'Resolution Rate (%)',
      data: processedData?.timeSeries.resolutionRate || [],
      borderColor: '#28a745',
      backgroundColor: '#28a74520',
      fill: true
    }]
  });

  const getResolutionTimeChartData = () => ({
    labels: processedData?.timeSeries.labels.map(label => 
      new Date(label + '-01').toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
    ) || [],
    datasets: [{
      label: 'Avg Resolution Time (days)',
      data: processedData?.timeSeries.avgResolutionTime || [],
      borderColor: '#ffc107',
      backgroundColor: '#ffc10720',
      fill: true
    }]
  });

  const getCategoriesChartData = () => ({
    labels: Object.keys(processedData?.categories || {}),
    datasets: [{
      label: 'Complaint Count',
      data: Object.values(processedData?.categories || {}).map(cat => cat.count),
      backgroundColor: [
        '#dc3545', '#ffc107', '#28a745', '#007bff', '#6f42c1', '#fd7e14'
      ]
    }]
  });

  const getResolutionRateByCategoryChartData = () => ({
    labels: Object.keys(processedData?.categories || {}),
    datasets: [{
      label: 'Resolution Rate (%)',
      data: Object.values(processedData?.categories || {}).map(cat => 
        cat.count > 0 ? (cat.resolved / cat.count) * 100 : 0
      ),
      backgroundColor: '#28a745'
    }]
  });

  const getPriorityChartData = () => ({
    labels: Object.keys(processedData?.priorities || {}),
    datasets: [{
      label: 'Complaints by Priority',
      data: Object.values(processedData?.priorities || {}).map(p => p.count),
      backgroundColor: {
        'High': '#dc3545',
        'Medium': '#ffc107',
        'Low': '#28a745'
      }
    }]
  });

  const getSourcesChartData = () => ({
    labels: Object.keys(processedData?.sources || {}),
    datasets: [{
      label: 'Complaints by Source',
      data: Object.values(processedData?.sources || {}).map(s => s.count),
      backgroundColor: [
        '#007bff', '#28a745', '#ffc107', '#dc3545', '#17a2b8'
      ]
    }]
  });

  const getStatusChartData = () => ({
    labels: Object.keys(processedData?.statusData || {}),
    datasets: [{
      label: 'Status Count',
      data: Object.values(processedData?.statusData || {}),
      backgroundColor: [
        '#28a745', '#ffc107', '#007bff', '#dc3545'
      ]
    }]
  });

  // Table columns
  const tableColumns = [
    { key: 'complaint_id', header: 'ID', width: '100px' },
    { key: 'customer_name', header: 'Customer', width: '150px' },
    { key: 'category', header: 'Category', width: '120px' },
    { key: 'priority', header: 'Priority', width: '80px' },
    { key: 'source', header: 'Source', width: '100px' },
    { key: 'status', header: 'Status', width: '100px' },
    { key: 'complaint_date', header: 'Date', type: 'date', width: '100px' },
    { key: 'resolution_time', header: 'Days', type: 'number', align: 'right', width: '80px' }
  ];

  if (isLoading) {
    return (
      <div className="dashboard-container">
        <div className="dashboard-loading">
          <div className="loading-spinner"></div>
          <div className="loading-text">Loading complaints dashboard...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-container">
        <div className="dashboard-error">
          <h3>Error Loading Dashboard</h3>
          <p>{error.message}</p>
        </div>
      </div>
    );
  }

  if (!processedData) {
    return (
      <div className="dashboard-container">
        <div className="dashboard-no-data">
          <h3>No Complaints Data Available</h3>
          <p>Please upload complaints data to view this dashboard.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container complaints-dashboard">
      
      {/* KPI Cards */}
      <div className="dashboard-section">
        <div className="kpi-grid">
          <KPICard
            title="Total Complaints"
            value={processedData.kpis.totalComplaints}
            format="number"
            icon="📝"
            status="normal"
          />
          <PercentageKPICard
            title="Resolution Rate"
            value={processedData.kpis.resolutionRate}
            previousValue={processedData.kpis.previousResolutionRate}
            icon="✅"
            target={95}
            status={processedData.kpis.resolutionRate >= 95 ? "success" : "warning"}
          />
          <PercentageKPICard
            title="SLA Compliance"
            value={processedData.kpis.slaCompliance}
            previousValue={processedData.kpis.previousSlaCompliance}
            icon="⏱️"
            target={85}
            status={processedData.kpis.slaCompliance >= 85 ? "success" : "warning"}
          />
          <KPICard
            title="Avg Resolution Time"
            value={processedData.kpis.avgResolutionTime}
            format="number"
            subtitle="days"
            icon="📊"
            status={processedData.kpis.avgResolutionTime <= 3 ? "success" : "warning"}
          />
        </div>
      </div>

      {/* Main Trends */}
      <div className="dashboard-section">
        <div className="charts-grid">
          <div className="chart-container-wrapper">
            <TrendChart
              data={getComplaintsVolumeChartData()}
              title="Complaints Volume Trend"
              formatType="number"
              height={300}
              showTrendLine={true}
            />
          </div>
          <div className="chart-container-wrapper">
            <LineChart
              data={getResolutionRateChartData()}
              title="Resolution Rate Trend"
              formatType="percentage"
              height={300}
              fill={true}
            />
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="dashboard-section">
        <div className="charts-grid">
          <div className="chart-container-wrapper">
            <LineChart
              data={getResolutionTimeChartData()}
              title="Average Resolution Time"
              formatType="number"
              height={300}
              fill={true}
            />
          </div>
          <div className="chart-container-wrapper">
            <PieChart
              data={getStatusChartData()}
              title="Status Distribution"
              formatType="number"
              height={300}
              variant="doughnut"
            />
          </div>
        </div>
      </div>

      {/* Category Analysis */}
      <div className="dashboard-section">
        <div className="charts-grid">
          <div className="chart-container-wrapper">
            <PieChart
              data={getCategoriesChartData()}
              title="Complaints by Category"
              formatType="number"
              height={300}
            />
          </div>
          <div className="chart-container-wrapper">
            <BarChart
              data={getResolutionRateByCategoryChartData()}
              title="Resolution Rate by Category"
              formatType="percentage"
              height={300}
            />
          </div>
        </div>
      </div>

      {/* Source and Priority Analysis */}
      <div className="dashboard-section">
        <div className="charts-grid">
          <div className="chart-container-wrapper">
            <BarChart
              data={getPriorityChartData()}
              title="Complaints by Priority"
              formatType="number"
              height={300}
            />
          </div>
          <div className="chart-container-wrapper">
            <BarChart
              data={getSourcesChartData()}
              title="Complaints by Source"
              formatType="number"
              height={300}
              orientation="horizontal"
            />
          </div>
        </div>
      </div>

      {/* Complaints Table */}
      <div className="dashboard-section">
        <div className="table-container-wrapper full-width">
          <DataTable
            data={processedData.rawData
              .sort((a, b) => new Date(b.complaint_date || b.date) - new Date(a.complaint_date || a.date))
              .slice(0, 100)
            }
            columns={tableColumns}
            title="Recent Complaints"
            pageSize={10}
            showSearch={true}
            showExport={true}
          />
        </div>
      </div>

    </div>
  );
};

export default ComplaintsDashboard; 
