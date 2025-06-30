// src/components/dashboards/LiquidationsDashboard.js
import React, { useState, useEffect } from 'react';
import KPICard, { CurrencyKPICard, PercentageKPICard } from '../charts/KPICard';
import LineChart from '../charts/LineChart';
import BarChart from '../charts/BarChart';
import PieChart from '../charts/PieChart';
import TrendChart from '../charts/TrendChart';
import DataTable from '../common/DataTable';
import { REPORT_CONFIG } from '../../config/reportConfig';

const LiquidationsDashboard = ({ data, dateRange, filters, onFilterChange }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [processedData, setProcessedData] = useState(null);

  const reportConfig = REPORT_CONFIG['liquidations'];

  // Process liquidations data
  useEffect(() => {
    if (!data || data.length === 0) {
      setProcessedData(null);
      return;
    }

    try {
      setIsLoading(true);

      // Calculate KPIs
      const totalRecovered = data.reduce((sum, record) => sum + (record.recovered_amount || 0), 0);
      const totalWrittenOff = data.reduce((sum, record) => sum + (record.written_off_amount || 0), 0);
      const totalLossAmount = data.reduce((sum, record) => sum + (record.loss_amount || 0), 0);
      const totalCases = data.length;
      const recoveryRate = totalRecovered / (totalRecovered + totalLossAmount) * 100;
      const avgRecoveryTime = data.reduce((sum, record) => sum + (record.recovery_days || 0), 0) / totalCases;

      // Recovery status analysis
      const recoveredCases = data.filter(record => record.status === 'recovered').length;
      const writeOffCases = data.filter(record => record.status === 'written-off').length;
      const inProgressCases = data.filter(record => record.status === 'in-progress').length;

      // Previous period comparison (mock)
      const previousRecoveryRate = recoveryRate * 0.92; // Mock improvement
      const previousRecovered = totalRecovered * 0.88;

      // Time series data
      const monthlyData = data.reduce((acc, record) => {
        const month = new Date(record.liquidation_date || record.date).toISOString().substr(0, 7);
        if (!acc[month]) {
          acc[month] = { 
            recovered: 0, 
            writtenOff: 0, 
            cases: 0,
            inProgress: 0,
            totalLoss: 0
          };
        }
        acc[month].recovered += record.recovered_amount || 0;
        acc[month].writtenOff += record.written_off_amount || 0;
        acc[month].totalLoss += record.loss_amount || 0;
        acc[month].cases += 1;
        if (record.status === 'in-progress') acc[month].inProgress += 1;
        return acc;
      }, {});

      const timeSeriesLabels = Object.keys(monthlyData).sort();
      const recoveredData = timeSeriesLabels.map(month => monthlyData[month].recovered);
      const writtenOffData = timeSeriesLabels.map(month => monthlyData[month].writtenOff);
      const recoveryRateData = timeSeriesLabels.map(month => {
        const total = monthlyData[month].recovered + monthlyData[month].totalLoss;
        return total > 0 ? (monthlyData[month].recovered / total) * 100 : 0;
      });

      // Product analysis
      const productData = data.reduce((acc, record) => {
        const product = record.product || 'Unknown';
        if (!acc[product]) {
          acc[product] = { 
            recovered: 0, 
            writtenOff: 0, 
            cases: 0, 
            totalLoss: 0,
            recoveryRate: 0 
          };
        }
        acc[product].recovered += record.recovered_amount || 0;
        acc[product].writtenOff += record.written_off_amount || 0;
        acc[product].totalLoss += record.loss_amount || 0;
        acc[product].cases += 1;
        return acc;
      }, {});

      // Calculate recovery rates for products
      Object.keys(productData).forEach(product => {
        const total = productData[product].recovered + productData[product].totalLoss;
        productData[product].recoveryRate = total > 0 ? 
          (productData[product].recovered / total) * 100 : 0;
      });

      // Recovery method analysis
      const recoveryMethods = data.reduce((acc, record) => {
        const method = record.recovery_method || 'Unknown';
        if (!acc[method]) {
          acc[method] = { amount: 0, cases: 0 };
        }
        acc[method].amount += record.recovered_amount || 0;
        acc[method].cases += 1;
        return acc;
      }, {});

      // Status distribution
      const statusData = {
        'Recovered': recoveredCases,
        'Written Off': writeOffCases,
        'In Progress': inProgressCases,
        'Legal Action': data.filter(r => r.status === 'legal-action').length
      };

      // Recovery time buckets
      const recoveryTimeBuckets = {
        '0-30 days': data.filter(r => (r.recovery_days || 0) <= 30).length,
        '31-90 days': data.filter(r => (r.recovery_days || 0) > 30 && (r.recovery_days || 0) <= 90).length,
        '91-180 days': data.filter(r => (r.recovery_days || 0) > 90 && (r.recovery_days || 0) <= 180).length,
        '180+ days': data.filter(r => (r.recovery_days || 0) > 180).length
      };

      setProcessedData({
        kpis: {
          totalRecovered,
          totalWrittenOff,
          totalLossAmount,
          recoveryRate,
          avgRecoveryTime,
          totalCases,
          previousRecoveryRate,
          previousRecovered
        },
        timeSeries: {
          labels: timeSeriesLabels,
          recovered: recoveredData,
          writtenOff: writtenOffData,
          recoveryRate: recoveryRateData
        },
        products: productData,
        recoveryMethods,
        statusData,
        recoveryTimeBuckets,
        rawData: data
      });

    } catch (err) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, [data, dateRange, filters]);

  // Chart data preparation
  const getRecoveryTrendChartData = () => ({
    labels: processedData?.timeSeries.labels.map(label => 
      new Date(label + '-01').toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
    ) || [],
    datasets: [
      {
        label: 'Recovered Amount',
        data: processedData?.timeSeries.recovered || [],
        borderColor: '#28a745',
        backgroundColor: '#28a74520',
        fill: true
      },
      {
        label: 'Written Off',
        data: processedData?.timeSeries.writtenOff || [],
        borderColor: '#dc3545',
        backgroundColor: '#dc354520',
        fill: true
      }
    ]
  });

  const getRecoveryRateChartData = () => ({
    labels: processedData?.timeSeries.labels.map(label => 
      new Date(label + '-01').toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
    ) || [],
    datasets: [{
      label: 'Recovery Rate (%)',
      data: processedData?.timeSeries.recoveryRate || [],
      borderColor: '#007bff',
      backgroundColor: '#007bff20',
      fill: true
    }]
  });

  const getProductRecoveryChartData = () => ({
    labels: Object.keys(processedData?.products || {}),
    datasets: [{
      label: 'Recovery Rate (%)',
      data: Object.values(processedData?.products || {}).map(p => p.recoveryRate),
      backgroundColor: '#28a745'
    }]
  });

  const getRecoveryMethodsChartData = () => ({
    labels: Object.keys(processedData?.recoveryMethods || {}),
    datasets: [{
      label: 'Recovery Amount',
      data: Object.values(processedData?.recoveryMethods || {}).map(m => m.amount),
      backgroundColor: [
        '#007bff', '#28a745', '#ffc107', '#dc3545', '#6f42c1'
      ]
    }]
  });

  const getStatusChartData = () => ({
    labels: Object.keys(processedData?.statusData || {}),
    datasets: [{
      label: 'Cases',
      data: Object.values(processedData?.statusData || {}),
      backgroundColor: [
        '#28a745', '#dc3545', '#ffc107', '#17a2b8'
      ]
    }]
  });

  const getRecoveryTimeChartData = () => ({
    labels: Object.keys(processedData?.recoveryTimeBuckets || {}),
    datasets: [{
      label: 'Cases',
      data: Object.values(processedData?.recoveryTimeBuckets || {}),
      backgroundColor: [
        '#28a745', '#ffc107', '#fd7e14', '#dc3545'
      ]
    }]
  });

  // Table columns
  const tableColumns = [
    { key: 'case_id', header: 'Case ID', width: '120px' },
    { key: 'customer_name', header: 'Customer', width: '150px' },
    { key: 'product', header: 'Product', width: '100px' },
    { key: 'original_amount', header: 'Original', type: 'currency', align: 'right', width: '120px' },
    { key: 'recovered_amount', header: 'Recovered', type: 'currency', align: 'right', width: '120px' },
    { key: 'loss_amount', header: 'Loss', type: 'currency', align: 'right', width: '120px' },
    { key: 'recovery_days', header: 'Days', type: 'number', align: 'right', width: '80px' },
    { key: 'status', header: 'Status', width: '100px' }
  ];

  if (isLoading) {
    return (
      <div className="dashboard-container">
        <div className="dashboard-loading">
          <div className="loading-spinner"></div>
          <div className="loading-text">Loading liquidations dashboard...</div>
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
          <h3>No Liquidations Data Available</h3>
          <p>Please upload liquidations data to view this dashboard.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container liquidations-dashboard">
      
      {/* KPI Cards */}
      <div className="dashboard-section">
        <div className="kpi-grid">
          <CurrencyKPICard
            title="Total Recovered"
            value={processedData.kpis.totalRecovered}
            previousValue={processedData.kpis.previousRecovered}
            icon="💰"
            status="success"
          />
          <PercentageKPICard
            title="Recovery Rate"
            value={processedData.kpis.recoveryRate}
            previousValue={processedData.kpis.previousRecoveryRate}
            icon="📈"
            target={75}
            status={processedData.kpis.recoveryRate >= 75 ? "success" : "warning"}
          />
          <CurrencyKPICard
            title="Total Loss"
            value={processedData.kpis.totalLossAmount}
            icon="📉"
            status="danger"
          />
          <KPICard
            title="Avg Recovery Time"
            value={processedData.kpis.avgRecoveryTime}
            format="number"
            subtitle="days"
            icon="⏱️"
            status="normal"
          />
        </div>
      </div>

      {/* Main Trend Charts */}
      <div className="dashboard-section">
        <div className="charts-grid">
          <div className="chart-container-wrapper">
            <LineChart
              data={getRecoveryTrendChartData()}
              title="Recovery vs Write-off Trend"
              formatType="currency"
              height={300}
              showLegend={true}
            />
          </div>
          <div className="chart-container-wrapper">
            <TrendChart
              data={getRecoveryRateChartData()}
              title="Recovery Rate Trend"
              formatType="percentage"
              height={300}
              showTrendLine={true}
            />
          </div>
        </div>
      </div>

      {/* Analysis Charts */}
      <div className="dashboard-section">
        <div className="charts-grid">
          <div className="chart-container-wrapper">
            <BarChart
              data={getProductRecoveryChartData()}
              title="Recovery Rate by Product"
              formatType="percentage"
              height={300}
            />
          </div>
          <div className="chart-container-wrapper">
            <PieChart
              data={getRecoveryMethodsChartData()}
              title="Recovery by Method"
              formatType="currency"
              height={300}
              variant="doughnut"
            />
          </div>
        </div>
      </div>

      {/* Status and Time Analysis */}
      <div className="dashboard-section">
        <div className="charts-grid">
          <div className="chart-container-wrapper">
            <PieChart
              data={getStatusChartData()}
              title="Case Status Distribution"
              formatType="number"
              height={300}
            />
          </div>
          <div className="chart-container-wrapper">
            <BarChart
              data={getRecoveryTimeChartData()}
              title="Recovery Time Analysis"
              formatType="number"
              height={300}
              orientation="horizontal"
            />
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="dashboard-section">
        <div className="table-container-wrapper full-width">
          <DataTable
            data={processedData.rawData
              .sort((a, b) => (b.recovered_amount || 0) - (a.recovered_amount || 0))
              .slice(0, 100)
            }
            columns={tableColumns}
            title="Recent Liquidation Cases"
            pageSize={10}
            showSearch={true}
            showExport={true}
          />
        </div>
      </div>

    </div>
  );
};

export default LiquidationsDashboard; 
