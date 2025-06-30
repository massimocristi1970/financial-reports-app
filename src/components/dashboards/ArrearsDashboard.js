// src/components/dashboards/ArrearsDashboard.js
import React, { useState, useEffect } from 'react';
import KPICard, { CurrencyKPICard, PercentageKPICard } from '../charts/KPICard';
import LineChart from '../charts/LineChart';
import BarChart from '../charts/BarChart';
import PieChart from '../charts/PieChart';
import TrendChart from '../charts/TrendChart';
import DataTable from '../common/DataTable';
import { REPORT_CONFIG } from '../../config/reportConfig';

const ArrearsDashboard = ({ data, dateRange, filters, onFilterChange }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [processedData, setProcessedData] = useState(null);

  const reportConfig = REPORT_CONFIG['arrears'];

  // Process arrears data
  useEffect(() => {
    if (!data || data.length === 0) {
      setProcessedData(null);
      return;
    }

    try {
      setIsLoading(true);

      // Calculate KPIs
      const totalArrears = data.reduce((sum, record) => sum + (record.arrears_amount || 0), 0);
      const totalAccounts = data.length;
      const arrearsAccounts = data.filter(record => (record.arrears_amount || 0) > 0).length;
      const arrearsRate = (arrearsAccounts / totalAccounts) * 100;
      const avgArrearsAmount = totalArrears / arrearsAccounts;
      
      // Days in arrears analysis
      const over30Days = data.filter(record => (record.days_in_arrears || 0) > 30).length;
      const over60Days = data.filter(record => (record.days_in_arrears || 0) > 60).length;
      const over90Days = data.filter(record => (record.days_in_arrears || 0) > 90).length;

      // Previous period comparison (mock)
      const previousArrearsRate = arrearsRate * 0.95; // Mock improvement
      const previousTotalArrears = totalArrears * 1.1; // Mock reduction

      // Time series data
      const monthlyData = data.reduce((acc, record) => {
        const month = new Date(record.date || record.reporting_date).toISOString().substr(0, 7);
        if (!acc[month]) {
          acc[month] = { 
            totalArrears: 0, 
            accounts: 0, 
            arrearsAccounts: 0,
            over30: 0,
            over60: 0,
            over90: 0
          };
        }
        acc[month].totalArrears += record.arrears_amount || 0;
        acc[month].accounts += 1;
        if ((record.arrears_amount || 0) > 0) acc[month].arrearsAccounts += 1;
        if ((record.days_in_arrears || 0) > 30) acc[month].over30 += 1;
        if ((record.days_in_arrears || 0) > 60) acc[month].over60 += 1;
        if ((record.days_in_arrears || 0) > 90) acc[month].over90 += 1;
        return acc;
      }, {});

      const timeSeriesLabels = Object.keys(monthlyData).sort();
      const arrearsAmountData = timeSeriesLabels.map(month => monthlyData[month].totalArrears);
      const arrearsRateData = timeSeriesLabels.map(month => 
        (monthlyData[month].arrearsAccounts / monthlyData[month].accounts) * 100
      );

      // Product analysis
      const productData = data.reduce((acc, record) => {
        const product = record.product || 'Unknown';
        if (!acc[product]) {
          acc[product] = { arrears: 0, accounts: 0, arrearsAccounts: 0 };
        }
        acc[product].arrears += record.arrears_amount || 0;
        acc[product].accounts += 1;
        if ((record.arrears_amount || 0) > 0) acc[product].arrearsAccounts += 1;
        return acc;
      }, {});

      // Age bucket analysis
      const ageBuckets = {
        '1-30 days': data.filter(r => (r.days_in_arrears || 0) >= 1 && (r.days_in_arrears || 0) <= 30).length,
        '31-60 days': data.filter(r => (r.days_in_arrears || 0) >= 31 && (r.days_in_arrears || 0) <= 60).length,
        '61-90 days': data.filter(r => (r.days_in_arrears || 0) >= 61 && (r.days_in_arrears || 0) <= 90).length,
        '90+ days': data.filter(r => (r.days_in_arrears || 0) > 90).length
      };

      // Region analysis
      const regionData = data.reduce((acc, record) => {
        const region = record.region || 'Unknown';
        if (!acc[region]) {
          acc[region] = { arrears: 0, accounts: 0, rate: 0 };
        }
        acc[region].arrears += record.arrears_amount || 0;
        acc[region].accounts += 1;
        return acc;
      }, {});

      // Calculate rates for regions
      Object.keys(regionData).forEach(region => {
        const arrearsCount = data.filter(r => 
          (r.region || 'Unknown') === region && (r.arrears_amount || 0) > 0
        ).length;
        regionData[region].rate = (arrearsCount / regionData[region].accounts) * 100;
      });

      setProcessedData({
        kpis: {
          totalArrears,
          arrearsRate,
          avgArrearsAmount,
          over30Days,
          over60Days,
          over90Days,
          previousArrearsRate,
          previousTotalArrears
        },
        timeSeries: {
          labels: timeSeriesLabels,
          arrearsAmount: arrearsAmountData,
          arrearsRate: arrearsRateData
        },
        products: productData,
        ageBuckets,
        regions: regionData,
        rawData: data
      });

    } catch (err) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, [data, dateRange, filters]);

  // Chart data preparation
  const getArrearsAmountChartData = () => ({
    labels: processedData?.timeSeries.labels.map(label => 
      new Date(label + '-01').toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
    ) || [],
    datasets: [{
      label: 'Total Arrears Amount',
      data: processedData?.timeSeries.arrearsAmount || [],
      borderColor: '#dc3545',
      backgroundColor: '#dc354520',
      fill: true
    }]
  });

  const getArrearsRateChartData = () => ({
    labels: processedData?.timeSeries.labels.map(label => 
      new Date(label + '-01').toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
    ) || [],
    datasets: [{
      label: 'Arrears Rate (%)',
      data: processedData?.timeSeries.arrearsRate || [],
      borderColor: '#ffc107',
      backgroundColor: '#ffc10720',
      fill: true
    }]
  });

  const getProductArrearsChartData = () => ({
    labels: Object.keys(processedData?.products || {}),
    datasets: [{
      label: 'Arrears Rate by Product (%)',
      data: Object.values(processedData?.products || {}).map(p => 
        (p.arrearsAccounts / p.accounts) * 100
      ),
      backgroundColor: '#dc3545'
    }]
  });

  const getAgeBucketsChartData = () => ({
    labels: Object.keys(processedData?.ageBuckets || {}),
    datasets: [{
      label: 'Accounts in Arrears',
      data: Object.values(processedData?.ageBuckets || {}),
      backgroundColor: [
        '#ffc107', '#fd7e14', '#dc3545', '#6f42c1'
      ]
    }]
  });

  const getRegionChartData = () => ({
    labels: Object.keys(processedData?.regions || {}),
    datasets: [{
      label: 'Arrears Rate (%)',
      data: Object.values(processedData?.regions || {}).map(r => r.rate),
      backgroundColor: '#17a2b8'
    }]
  });

  // Table columns
  const tableColumns = [
    { key: 'account_id', header: 'Account ID', width: '120px' },
    { key: 'customer_name', header: 'Customer', width: '150px' },
    { key: 'product', header: 'Product', width: '100px' },
    { key: 'outstanding_balance', header: 'Balance', type: 'currency', align: 'right', width: '120px' },
    { key: 'arrears_amount', header: 'Arrears', type: 'currency', align: 'right', width: '120px' },
    { key: 'days_in_arrears', header: 'Days', type: 'number', align: 'right', width: '80px' },
    { key: 'region', header: 'Region', width: '100px' }
  ];

  if (isLoading) {
    return (
      <div className="dashboard-container">
        <div className="dashboard-loading">
          <div className="loading-spinner"></div>
          <div className="loading-text">Loading arrears dashboard...</div>
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
          <h3>No Arrears Data Available</h3>
          <p>Please upload arrears data to view this dashboard.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container arrears-dashboard">
      
      {/* KPI Cards */}
      <div className="dashboard-section">
        <div className="kpi-grid">
          <CurrencyKPICard
            title="Total Arrears"
            value={processedData.kpis.totalArrears}
            previousValue={processedData.kpis.previousTotalArrears}
            icon="⚠️"
            status="danger"
          />
          <PercentageKPICard
            title="Arrears Rate"
            value={processedData.kpis.arrearsRate}
            previousValue={processedData.kpis.previousArrearsRate}
            icon="📊"
            target={5}
            status={processedData.kpis.arrearsRate <= 5 ? "success" : "warning"}
          />
          <CurrencyKPICard
            title="Avg Arrears Amount"
            value={processedData.kpis.avgArrearsAmount}
            icon="💰"
            status="normal"
          />
          <KPICard
            title="90+ Days Overdue"
            value={processedData.kpis.over90Days}
            format="number"
            icon="🚨"
            status="danger"
          />
        </div>
      </div>

      {/* Trend Charts */}
      <div className="dashboard-section">
        <div className="charts-grid">
          <div className="chart-container-wrapper">
            <TrendChart
              data={getArrearsAmountChartData()}
              title="Arrears Amount Trend"
              formatType="currency"
              height={300}
              showTrendLine={true}
              showConfidenceBands={true}
            />
          </div>
          <div className="chart-container-wrapper">
            <LineChart
              data={getArrearsRateChartData()}
              title="Arrears Rate Trend"
              formatType="percentage"
              height={300}
              fill={true}
            />
          </div>
        </div>
      </div>

      {/* Analysis Charts */}
      <div className="dashboard-section">
        <div className="charts-grid">
          <div className="chart-container-wrapper">
            <BarChart
              data={getProductArrearsChartData()}
              title="Arrears Rate by Product"
              formatType="percentage"
              height={300}
            />
          </div>
          <div className="chart-container-wrapper">
            <PieChart
              data={getAgeBucketsChartData()}
              title="Arrears Age Analysis"
              formatType="number"
              height={300}
              variant="doughnut"
            />
          </div>
        </div>
      </div>

      {/* Regional Analysis and Table */}
      <div className="dashboard-section">
        <div className="analysis-grid">
          <div className="chart-container-wrapper">
            <BarChart
              data={getRegionChartData()}
              title="Arrears Rate by Region"
              formatType="percentage"
              height={300}
              orientation="horizontal"
            />
          </div>
          <div className="table-container-wrapper">
            <DataTable
              data={processedData.rawData
                .filter(record => (record.arrears_amount || 0) > 0)
                .sort((a, b) => (b.arrears_amount || 0) - (a.arrears_amount || 0))
                .slice(0, 100)
              }
              columns={tableColumns}
              title="Top Arrears Accounts"
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

export default ArrearsDashboard; 
