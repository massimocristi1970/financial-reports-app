// src/components/dashboards/OverviewDashboard.js
import React, { useState, useEffect } from 'react';
import KPICard, { CurrencyKPICard, PercentageKPICard } from '../charts/KPICard';
import LineChart from '../charts/LineChart';
import BarChart from '../charts/BarChart';
import PieChart from '../charts/PieChart';
import { REPORT_CONFIG } from '../../config/reportConfig';

const OverviewDashboard = ({ allData, dateRange, filters, onNavigate }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [processedData, setProcessedData] = useState(null);

  // Process data from all report types
  useEffect(() => {
    if (!allData || Object.keys(allData).length === 0) {
      setProcessedData(null);
      return;
    }

    try {
      setIsLoading(true);

      // Extract data from each report type
      const lendingData = allData['lending-volume'] || [];
      const arrearsData = allData['arrears'] || [];
      const liquidationsData = allData['liquidations'] || [];
      const callCenterData = allData['call-center'] || [];
      const complaintsData = allData['complaints'] || [];

      // Calculate high-level KPIs
      const totalLendingVolume = lendingData.reduce((sum, record) => sum + (record.amount || 0), 0);
      const totalApplications = lendingData.length;
      const totalArrears = arrearsData.reduce((sum, record) => sum + (record.arrears_amount || 0), 0);
      const arrearsRate = arrearsData.length > 0 ? 
        (arrearsData.filter(r => (r.arrears_amount || 0) > 0).length / arrearsData.length) * 100 : 0;
      
      const totalRecovered = liquidationsData.reduce((sum, record) => sum + (record.recovered_amount || 0), 0);
      const recoveryRate = liquidationsData.length > 0 ? 
        (liquidationsData.filter(r => r.status === 'recovered').length / liquidationsData.length) * 100 : 0;
      
      const totalCalls = callCenterData.length;
      const callAnswerRate = callCenterData.length > 0 ? 
        (callCenterData.filter(r => r.status === 'answered').length / callCenterData.length) * 100 : 0;
      
      const totalComplaints = complaintsData.length;
      const complaintResolutionRate = complaintsData.length > 0 ? 
        (complaintsData.filter(r => r.status === 'resolved').length / complaintsData.length) * 100 : 0;

      // Previous period comparisons (mock for demo)
      const previousLendingVolume = totalLendingVolume * 0.87;
      const previousArrearsRate = arrearsRate * 1.05;
      const previousRecoveryRate = recoveryRate * 0.96;

      // Time series data (combine monthly data from all sources)
      const timeSeriesData = {};
      
      // Process lending data by month
      lendingData.forEach(record => {
        const month = new Date(record.date).toISOString().substr(0, 7);
        if (!timeSeriesData[month]) {
          timeSeriesData[month] = {
            lending: 0, arrears: 0, recovered: 0, calls: 0, complaints: 0
          };
        }
        timeSeriesData[month].lending += record.amount || 0;
      });

      // Process other data types similarly
      arrearsData.forEach(record => {
        const month = new Date(record.date || record.reporting_date).toISOString().substr(0, 7);
        if (!timeSeriesData[month]) {
          timeSeriesData[month] = {
            lending: 0, arrears: 0, recovered: 0, calls: 0, complaints: 0
          };
        }
        timeSeriesData[month].arrears += record.arrears_amount || 0;
      });

      liquidationsData.forEach(record => {
        const month = new Date(record.liquidation_date || record.date).toISOString().substr(0, 7);
        if (!timeSeriesData[month]) {
          timeSeriesData[month] = {
            lending: 0, arrears: 0, recovered: 0, calls: 0, complaints: 0
          };
        }
        timeSeriesData[month].recovered += record.recovered_amount || 0;
      });

      callCenterData.forEach(record => {
        const month = new Date(record.call_time || record.date).toISOString().substr(0, 7);
        if (!timeSeriesData[month]) {
          timeSeriesData[month] = {
            lending: 0, arrears: 0, recovered: 0, calls: 0, complaints: 0
          };
        }
        timeSeriesData[month].calls += 1;
      });

      complaintsData.forEach(record => {
        const month = new Date(record.complaint_date || record.date).toISOString().substr(0, 7);
        if (!timeSeriesData[month]) {
          timeSeriesData[month] = {
            lending: 0, arrears: 0, recovered: 0, calls: 0, complaints: 0
          };
        }
        timeSeriesData[month].complaints += 1;
      });

      const timeLabels = Object.keys(timeSeriesData).sort();

      // Product performance across all areas
      const productPerformance = {};
      const products = [...new Set([
        ...lendingData.map(r => r.product),
        ...arrearsData.map(r => r.product),
        ...liquidationsData.map(r => r.product)
      ].filter(Boolean))];

      products.forEach(product => {
        const lendingVolume = lendingData
          .filter(r => r.product === product)
          .reduce((sum, r) => sum + (r.amount || 0), 0);
        
        const arrearsAmount = arrearsData
          .filter(r => r.product === product)
          .reduce((sum, r) => sum + (r.arrears_amount || 0), 0);
        
        const recoveredAmount = liquidationsData
          .filter(r => r.product === product)
          .reduce((sum, r) => sum + (r.recovered_amount || 0), 0);

        productPerformance[product] = {
          lending: lendingVolume,
          arrears: arrearsAmount,
          recovered: recoveredAmount
        };
      });

      // Regional analysis
      const regionalData = {};
      const regions = [...new Set([
        ...lendingData.map(r => r.region),
        ...arrearsData.map(r => r.region),
        ...liquidationsData.map(r => r.region)
      ].filter(Boolean))];

      regions.forEach(region => {
        const applications = lendingData.filter(r => r.region === region).length;
        const arrearsAccounts = arrearsData.filter(r => r.region === region && (r.arrears_amount || 0) > 0).length;
        const totalAccounts = arrearsData.filter(r => r.region === region).length;
        
        regionalData[region] = {
          applications,
          arrearsRate: totalAccounts > 0 ? (arrearsAccounts / totalAccounts) * 100 : 0
        };
      });

      // Data availability status
      const dataStatus = {
        'Lending Volume': lendingData.length > 0,
        'Arrears': arrearsData.length > 0,
        'Liquidations': liquidationsData.length > 0,
        'Call Center': callCenterData.length > 0,
        'Complaints': complaintsData.length > 0
      };

      setProcessedData({
        kpis: {
          totalLendingVolume,
          totalApplications,
          totalArrears,
          arrearsRate,
          totalRecovered,
          recoveryRate,
          totalCalls,
          callAnswerRate,
          totalComplaints,
          complaintResolutionRate,
          previousLendingVolume,
          previousArrearsRate,
          previousRecoveryRate
        },
        timeSeries: {
          labels: timeLabels,
          data: timeSeriesData
        },
        productPerformance,
        regionalData,
        dataStatus,
        dataCounts: {
          lending: lendingData.length,
          arrears: arrearsData.length,
          liquidations: liquidationsData.length,
          calls: callCenterData.length,
          complaints: complaintsData.length
        }
      });

    } catch (err) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, [allData, dateRange, filters]);

  // Chart data preparation
  const getBusinessVolumeChartData = () => {
    const labels = processedData?.timeSeries.labels.map(label => 
      new Date(label + '-01').toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
    ) || [];
    
    return {
      labels,
      datasets: [
        {
          label: 'Lending Volume',
          data: processedData?.timeSeries.labels.map(month => 
            processedData.timeSeries.data[month]?.lending || 0
          ) || [],
          borderColor: '#007bff',
          backgroundColor: '#007bff20',
          fill: true
        },
        {
          label: 'Arrears Amount',
          data: processedData?.timeSeries.labels.map(month => 
            processedData.timeSeries.data[month]?.arrears || 0
          ) || [],
          borderColor: '#dc3545',
          backgroundColor: '#dc354520',
          fill: true
        }
      ]
    };
  };

  const getOperationalVolumeChartData = () => {
    const labels = processedData?.timeSeries.labels.map(label => 
      new Date(label + '-01').toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
    ) || [];
    
    return {
      labels,
      datasets: [
        {
          label: 'Call Volume',
          data: processedData?.timeSeries.labels.map(month => 
            processedData.timeSeries.data[month]?.calls || 0
          ) || [],
          borderColor: '#28a745',
          backgroundColor: '#28a745'
        },
        {
          label: 'Complaints',
          data: processedData?.timeSeries.labels.map(month => 
            processedData.timeSeries.data[month]?.complaints || 0
          ) || [],
          borderColor: '#ffc107',
          backgroundColor: '#ffc107'
        }
      ]
    };
  };

  const getProductPerformanceChartData = () => ({
    labels: Object.keys(processedData?.productPerformance || {}),
    datasets: [{
      label: 'Lending Volume',
      data: Object.values(processedData?.productPerformance || {}).map(p => p.lending),
      backgroundColor: '#007bff'
    }]
  });

  const getRegionalChartData = () => ({
    labels: Object.keys(processedData?.regionalData || {}),
    datasets: [{
      label: 'Applications',
      data: Object.values(processedData?.regionalData || {}).map(r => r.applications),
      backgroundColor: '#28a745'
    }]
  });

  const getDataStatusChartData = () => ({
    labels: Object.keys(processedData?.dataStatus || {}),
    datasets: [{
      label: 'Data Available',
      data: Object.values(processedData?.dataStatus || {}).map(status => status ? 1 : 0),
      backgroundColor: Object.values(processedData?.dataStatus || {}).map(status => 
        status ? '#28a745' : '#dc3545'
      )
    }]
  });

  if (isLoading) {
    return (
      <div className="dashboard-container">
        <div className="dashboard-loading">
          <div className="loading-spinner"></div>
          <div className="loading-text">Loading overview dashboard...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-container">
        <div className="dashboard-error">
          <h3>Error Loading Overview</h3>
          <p>{error.message}</p>
        </div>
      </div>
    );
  }

  if (!processedData) {
    return (
      <div className="dashboard-container">
        <div className="dashboard-no-data">
          <h3>Welcome to Financial Reports Dashboard</h3>
          <p>Upload data to begin viewing your reports and analytics.</p>
          <div className="data-status-grid">
            <div className="data-status-card">
              <h4>📊 Available Reports</h4>
              <ul>
                <li>Lending Volume Analysis</li>
                <li>Arrears Management</li>
                <li>Liquidations & Recovery</li>
                <li>Call Center Performance</li>
                <li>Customer Complaints</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container overview-dashboard">
      
      {/* Executive KPI Summary */}
      <div className="dashboard-section">
        <h2 className="section-title">Executive Summary</h2>
        <div className="kpi-grid large">
          <CurrencyKPICard
            title="Total Lending Volume"
            value={processedData.kpis.totalLendingVolume}
            previousValue={processedData.kpis.previousLendingVolume}
            icon="💰"
            status="success"
            onClick={() => onNavigate?.('/lending-volume')}
          />
          <PercentageKPICard
            title="Arrears Rate"
            value={processedData.kpis.arrearsRate}
            previousValue={processedData.kpis.previousArrearsRate}
            icon="⚠️"
            target={5}
            status={processedData.kpis.arrearsRate <= 5 ? "success" : "danger"}
            onClick={() => onNavigate?.('/arrears')}
          />
          <PercentageKPICard
			title="Recovery Rate"
			value={processedData.kpis.recoveryRate}
			previousValue={processedData.kpis.previousRecoveryRate}
			icon="📈"
			target={75}
			status={processedData.kpis.recoveryRate >= 75 ? "success" : "warning"}
			onClick={() => onNavigate?.('/liquidations')}
		  />
				</div>
			</div>
			</div>
		);
		};

		export default OverviewDashboard;