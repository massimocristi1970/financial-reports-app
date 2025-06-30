// src/components/dashboards/LendingDashboard.js
import React, { useState, useEffect } from 'react';
import KPICard, { CurrencyKPICard, CountKPICard } from '../charts/KPICard';
import LineChart from '../charts/LineChart';
import BarChart from '../charts/BarChart';
import PieChart from '../charts/PieChart';
import TrendChart from '../charts/TrendChart';
import DataTable from '../common/DataTable';
import { REPORT_CONFIG } from '../../config/reportConfig';
import { formatCurrency, formatNumber } from '../../utils/formatters';

const LendingDashboard = ({ data, dateRange, filters, onFilterChange }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [processedData, setProcessedData] = useState(null);

  const reportConfig = REPORT_CONFIG['lending-volume'];

  // Process raw data for dashboard
  useEffect(() => {
    if (!data || data.length === 0) {
      setProcessedData(null);
      return;
    }

    try {
      setIsLoading(true);
      
      // Calculate KPIs
      const totalVolume = data.reduce((sum, record) => sum + (record.amount || 0), 0);
      const totalApplications = data.length;
      const avgLoanSize = totalVolume / totalApplications;
      const approvalRate = data.filter(record => record.status === 'approved').length / totalApplications * 100;

      // Previous period comparison (mock for now)
      const previousVolume = totalVolume * 0.85; // Mock 15% growth
      const previousApplications = totalApplications * 0.92; // Mock 8% growth

      // Group by month for time series
      const monthlyData = data.reduce((acc, record) => {
        const month = new Date(record.date).toISOString().substr(0, 7);
        if (!acc[month]) {
          acc[month] = { volume: 0, count: 0, approved: 0 };
        }
        acc[month].volume += record.amount || 0;
        acc[month].count += 1;
        if (record.status === 'approved') acc[month].approved += 1;
        return acc;
      }, {});

      const timeSeriesLabels = Object.keys(monthlyData).sort();
      const volumeData = timeSeriesLabels.map(month => monthlyData[month].volume);
      const countData = timeSeriesLabels.map(month => monthlyData[month].count);
      const approvalData = timeSeriesLabels.map(month => 
        (monthlyData[month].approved / monthlyData[month].count) * 100
      );

      // Group by product type
      const productData = data.reduce((acc, record) => {
        const product = record.product || 'Unknown';
        if (!acc[product]) {
          acc[product] = { volume: 0, count: 0 };
        }
        acc[product].volume += record.amount || 0;
        acc[product].count += 1;
        return acc;
      }, {});

      // Group by region
      const regionData = data.reduce((acc, record) => {
        const region = record.region || 'Unknown';
        if (!acc[region]) {
          acc[region] = { volume: 0, count: 0 };
        }
        acc[region].volume += record.amount || 0;
        acc[region].count += 1;
        return acc;
      }, {});

      setProcessedData({
        kpis: {
          totalVolume,
          totalApplications,
          avgLoanSize,
          approvalRate,
          previousVolume,
          previousApplications
        },
        timeSeries: {
          labels: timeSeriesLabels,
          volume: volumeData,
          count: countData,
          approval: approvalData
        },
        products: productData,
        regions: regionData,
        rawData: data
      });

    } catch (err) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, [data, dateRange, filters]);

  // Prepare chart data
  const getVolumeChartData = () => ({
    labels: processedData?.timeSeries.labels.map(label => 
      new Date(label + '-01').toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
    ) || [],
    datasets: [{
      label: 'Lending Volume',
      data: processedData?.timeSeries.volume || [],
      borderColor: '#007bff',
      backgroundColor: '#007bff20',
      fill: true
    }]
  });

  const getApplicationsChartData = () => ({
    labels: processedData?.timeSeries.labels.map(label => 
      new Date(label + '-01').toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
    ) || [],
    datasets: [{
      label: 'Applications',
      data: processedData?.timeSeries.count || [],
      borderColor: '#28a745',
      backgroundColor: '#28a745'
    }]
  });

  const getApprovalRateChartData = () => ({
    labels: processedData?.timeSeries.labels.map(label => 
      new Date(label + '-01').toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
    ) || [],
    datasets: [{
      label: 'Approval Rate',
      data: processedData?.timeSeries.approval || [],
      borderColor: '#ffc107',
      backgroundColor: '#ffc10720',
      fill: true
    }]
  });

  const getProductChartData = () => ({
    labels: Object.keys(processedData?.products || {}),
    datasets: [{
      label: 'Volume by Product',
      data: Object.values(processedData?.products || {}).map(p => p.volume),
      backgroundColor: [
        '#007bff', '#28a745', '#ffc107', '#dc3545', '#6f42c1', '#fd7e14'
      ]
    }]
  });

  const getRegionChartData = () => ({
    labels: Object.keys(processedData?.regions || {}),
    datasets: [{
      label: 'Applications by Region',
      data: Object.values(processedData?.regions || {}).map(r => r.count),
      backgroundColor: [
        '#17a2b8', '#e83e8c', '#6c757d', '#343a40', '#007bff', '#28a745'
      ]
    }]
  });

  // Table columns configuration
  const tableColumns = [
    { key: 'date', header: 'Date', type: 'date', width: '100px' },
    { key: 'application_id', header: 'Application ID', width: '120px' },
    { key: 'customer_name', header: 'Customer', width: '150px' },
    { key: 'product', header: 'Product', width: '120px' },
    { key: 'amount', header: 'Amount', type: 'currency', align: 'right', width: '120px' },
    { key: 'status', header: 'Status', width: '100px' },
    { key: 'region', header: 'Region', width: '100px' }
  ];

  if (isLoading) {
    return (
      <div className="dashboard-container">
        <div className="dashboard-loading">
          <div className="loading-spinner"></div>
          <div className="loading-text">Loading lending dashboard...</div>
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
          <h3>No Lending Data Available</h3>
          <p>Please upload lending volume data to view this dashboard.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container lending-dashboard">
      
      {/* KPI Cards Row */}
      <div className="dashboard-section">
        <div className="kpi-grid">
          <CurrencyKPICard
            title="Total Lending Volume"
            value={processedData.kpis.totalVolume}
            previousValue={processedData.kpis.previousVolume}
            icon="💰"
            status="success"
          />
          <CountKPICard
            title="Total Applications"
            value={processedData.kpis.totalApplications}
            previousValue={processedData.kpis.previousApplications}
            icon="📄"
            status="normal"
          />
          <CurrencyKPICard
            title="Average Loan Size"
            value={processedData.kpis.avgLoanSize}
            icon="📊"
            status="normal"
          />
          <KPICard
            title="Approval Rate"
            value={processedData.kpis.approvalRate}
            format="percentage"
            icon="✅"
            target={85}
            status={processedData.kpis.approvalRate >= 85 ? "success" : "warning"}
          />
        </div>
      </div>

      {/* Main Charts Row */}
      <div className="dashboard-section">
        <div className="charts-grid">
          <div className="chart-container-wrapper">
            <TrendChart
              data={getVolumeChartData()}
              title="Lending Volume Trend"
              formatType="currency"
              height={300}
              showTrendLine={true}
            />
          </div>
          <div className="chart-container-wrapper">
            <BarChart
              data={getApplicationsChartData()}
              title="Monthly Applications"
              formatType="number"
              height={300}
            />
          </div>
        </div>
      </div>

      {/* Secondary Charts Row */}
      <div className="dashboard-section">
        <div className="charts-grid">
          <div className="chart-container-wrapper">
            <LineChart
              data={getApprovalRateChartData()}
              title="Approval Rate Trend"
              formatType="percentage"
              height={300}
              fill={true}
            />
          </div>
          <div className="chart-container-wrapper">
            <PieChart
              data={getProductChartData()}
              title="Volume by Product Type"
              formatType="currency"
              height={300}
              variant="doughnut"
              centerText={{
                value: processedData.kpis.totalVolume,
                label: "Total Volume"
              }}
            />
          </div>
        </div>
      </div>

      {/* Analysis and Table Row */}
      <div className="dashboard-section">
        <div className="analysis-grid">
          <div className="chart-container-wrapper">
            <BarChart
              data={getRegionChartData()}
              title="Applications by Region"
              formatType="number"
              height={300}
              orientation="horizontal"
            />
          </div>
          <div className="table-container-wrapper">
            <DataTable
              data={processedData.rawData.slice(0, 100)} // Show recent 100 records
              columns={tableColumns}
              title="Recent Applications"
              pageSize={10}
              showSearch={true}
              showExport={true}
            />
          </div>
        </div>
      </div>

    </div>
  );
};

export default LendingDashboard; 
