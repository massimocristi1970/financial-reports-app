// src/components/dashboards/CallCenterDashboard.js
import React, { useState, useEffect } from 'react';
import KPICard, { PercentageKPICard } from '../charts/KPICard';
import LineChart from '../charts/LineChart';
import BarChart from '../charts/BarChart';
import PieChart from '../charts/PieChart';
import TrendChart from '../charts/TrendChart';
import DataTable from '../common/DataTable';
import { REPORT_CONFIG } from '../../config/reportConfig';

const CallCenterDashboard = ({ data, dateRange, filters, onFilterChange }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [processedData, setProcessedData] = useState(null);

  const reportConfig = REPORT_CONFIG['call-center'];

  // Process call center data
  useEffect(() => {
    if (!data || data.length === 0) {
      setProcessedData(null);
      return;
    }

    try {
      setIsLoading(true);

      // Calculate KPIs
      const totalCalls = data.length;
      const answeredCalls = data.filter(record => record.status === 'answered').length;
      const abandonedCalls = data.filter(record => record.status === 'abandoned').length;
      const resolvedCalls = data.filter(record => record.resolution === 'resolved').length;
      
      const answerRate = (answeredCalls / totalCalls) * 100;
      const abandonmentRate = (abandonedCalls / totalCalls) * 100;
      const resolutionRate = (resolvedCalls / answeredCalls) * 100;
      
      const avgWaitTime = data.reduce((sum, record) => sum + (record.wait_time || 0), 0) / totalCalls;
      const avgCallDuration = data.filter(r => r.status === 'answered')
        .reduce((sum, record) => sum + (record.call_duration || 0), 0) / answeredCalls;

      // Service level (calls answered within target)
      const targetAnswerTime = 20; // 20 seconds
      const callsWithinSLA = data.filter(record => 
        record.status === 'answered' && (record.wait_time || 0) <= targetAnswerTime
      ).length;
      const serviceLevel = (callsWithinSLA / totalCalls) * 100;

      // Previous period comparison (mock)
      const previousAnswerRate = answerRate * 0.98;
      const previousServiceLevel = serviceLevel * 0.95;

      // Time series data by hour/day
      const timeData = data.reduce((acc, record) => {
        const time = new Date(record.call_time || record.date).toISOString().substr(0, 13); // Hour precision
        if (!acc[time]) {
          acc[time] = { 
            total: 0, 
            answered: 0, 
            abandoned: 0,
            resolved: 0,
            totalWaitTime: 0,
            totalDuration: 0
          };
        }
        acc[time].total += 1;
        if (record.status === 'answered') acc[time].answered += 1;
        if (record.status === 'abandoned') acc[time].abandoned += 1;
        if (record.resolution === 'resolved') acc[time].resolved += 1;
        acc[time].totalWaitTime += record.wait_time || 0;
        acc[time].totalDuration += record.call_duration || 0;
        return acc;
      }, {});

      const timeLabels = Object.keys(timeData).sort();
      const callVolumeData = timeLabels.map(time => timeData[time].total);
      const answerRateData = timeLabels.map(time => 
        timeData[time].total > 0 ? (timeData[time].answered / timeData[time].total) * 100 : 0
      );
      const avgWaitTimeData = timeLabels.map(time => 
        timeData[time].total > 0 ? timeData[time].totalWaitTime / timeData[time].total : 0
      );

      // Call type analysis
      const callTypes = data.reduce((acc, record) => {
        const type = record.call_type || 'Unknown';
        if (!acc[type]) {
          acc[type] = { count: 0, resolved: 0, totalDuration: 0 };
        }
        acc[type].count += 1;
        if (record.resolution === 'resolved') acc[type].resolved += 1;
        acc[type].totalDuration += record.call_duration || 0;
        return acc;
      }, {});

      // Agent performance
      const agentData = data.reduce((acc, record) => {
        const agent = record.agent_id || 'Unknown';
        if (!acc[agent]) {
          acc[agent] = { 
            calls: 0, 
            resolved: 0, 
            totalDuration: 0,
            totalWaitTime: 0
          };
        }
        acc[agent].calls += 1;
        if (record.resolution === 'resolved') acc[agent].resolved += 1;
        acc[agent].totalDuration += record.call_duration || 0;
        acc[agent].totalWaitTime += record.wait_time || 0;
        return acc;
      }, {});

      // Peak hours analysis
      const hourlyVolume = data.reduce((acc, record) => {
        const hour = new Date(record.call_time || record.date).getHours();
        acc[hour] = (acc[hour] || 0) + 1;
        return acc;
      }, {});

      setProcessedData({
        kpis: {
          totalCalls,
          answerRate,
          abandonmentRate,
          resolutionRate,
          avgWaitTime,
          avgCallDuration,
          serviceLevel,
          previousAnswerRate,
          previousServiceLevel
        },
        timeSeries: {
          labels: timeLabels,
          callVolume: callVolumeData,
          answerRate: answerRateData,
          avgWaitTime: avgWaitTimeData
        },
        callTypes,
        agentData,
        hourlyVolume,
        rawData: data
      });

    } catch (err) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, [data, dateRange, filters]);

  // Chart data preparation
  const getCallVolumeChartData = () => ({
    labels: processedData?.timeSeries.labels.map(label => 
      new Date(label + ':00:00Z').toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit'
      })
    ) || [],
    datasets: [{
      label: 'Call Volume',
      data: processedData?.timeSeries.callVolume || [],
      borderColor: '#007bff',
      backgroundColor: '#007bff20',
      fill: true
    }]
  });

  const getAnswerRateChartData = () => ({
    labels: processedData?.timeSeries.labels.map(label => 
      new Date(label + ':00:00Z').toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit'
      })
    ) || [],
    datasets: [{
      label: 'Answer Rate (%)',
      data: processedData?.timeSeries.answerRate || [],
      borderColor: '#28a745',
      backgroundColor: '#28a74520',
      fill: true
    }]
  });

  const getWaitTimeChartData = () => ({
    labels: processedData?.timeSeries.labels.map(label => 
      new Date(label + ':00:00Z').toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit'
      })
    ) || [],
    datasets: [{
      label: 'Avg Wait Time (seconds)',
      data: processedData?.timeSeries.avgWaitTime || [],
      borderColor: '#ffc107',
      backgroundColor: '#ffc10720',
      fill: true
    }]
  });

  const getCallTypesChartData = () => ({
    labels: Object.keys(processedData?.callTypes || {}),
    datasets: [{
      label: 'Call Count',
      data: Object.values(processedData?.callTypes || {}).map(type => type.count),
      backgroundColor: [
        '#007bff', '#28a745', '#ffc107', '#dc3545', '#6f42c1', '#fd7e14'
      ]
    }]
  });

  const getResolutionRateByTypeChartData = () => ({
    labels: Object.keys(processedData?.callTypes || {}),
    datasets: [{
      label: 'Resolution Rate (%)',
      data: Object.values(processedData?.callTypes || {}).map(type => 
        type.count > 0 ? (type.resolved / type.count) * 100 : 0
      ),
      backgroundColor: '#28a745'
    }]
  });

  const getHourlyVolumeChartData = () => {
    const hours = Array.from({ length: 24 }, (_, i) => i);
    return {
      labels: hours.map(h => `${h.toString().padStart(2, '0')}:00`),
      datasets: [{
        label: 'Calls by Hour',
        data: hours.map(h => processedData?.hourlyVolume[h] || 0),
        backgroundColor: '#17a2b8'
      }]
    };
  };

  // Table columns
  const tableColumns = [
    { key: 'call_id', header: 'Call ID', width: '120px' },
    { key: 'customer_phone', header: 'Phone', width: '120px' },
    { key: 'call_type', header: 'Type', width: '100px' },
    { key: 'agent_id', header: 'Agent', width: '80px' },
    { key: 'wait_time', header: 'Wait (s)', type: 'number', align: 'right', width: '80px' },
    { key: 'call_duration', header: 'Duration (s)', type: 'number', align: 'right', width: '100px' },
    { key: 'status', header: 'Status', width: '100px' },
    { key: 'resolution', header: 'Resolution', width: '100px' }
  ];

  if (isLoading) {
    return (
      <div className="dashboard-container">
        <div className="dashboard-loading">
          <div className="loading-spinner"></div>
          <div className="loading-text">Loading call center dashboard...</div>
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
          <h3>No Call Center Data Available</h3>
          <p>Please upload call center data to view this dashboard.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container call-center-dashboard">
      
      {/* KPI Cards */}
      <div className="dashboard-section">
        <div className="kpi-grid">
          <KPICard
            title="Total Calls"
            value={processedData.kpis.totalCalls}
            format="number"
            icon="📞"
            status="normal"
          />
          <PercentageKPICard
            title="Answer Rate"
            value={processedData.kpis.answerRate}
            previousValue={processedData.kpis.previousAnswerRate}
            icon="✅"
            target={90}
            status={processedData.kpis.answerRate >= 90 ? "success" : "warning"}
          />
          <PercentageKPICard
            title="Service Level"
            value={processedData.kpis.serviceLevel}
            previousValue={processedData.kpis.previousServiceLevel}
            icon="⏱️"
            target={80}
            status={processedData.kpis.serviceLevel >= 80 ? "success" : "warning"}
          />
          <KPICard
            title="Avg Wait Time"
            value={processedData.kpis.avgWaitTime}
            format="number"
            subtitle="seconds"
            icon="⏳"
            status={processedData.kpis.avgWaitTime <= 30 ? "success" : "warning"}
          />
        </div>
      </div>

      {/* Performance Trends */}
      <div className="dashboard-section">
        <div className="charts-grid">
          <div className="chart-container-wrapper">
            <TrendChart
              data={getCallVolumeChartData()}
              title="Call Volume Trend"
              formatType="number"
              height={300}
              showTrendLine={true}
            />
          </div>
          <div className="chart-container-wrapper">
            <LineChart
              data={getAnswerRateChartData()}
              title="Answer Rate Trend"
              formatType="percentage"
              height={300}
              fill={true}
            />
          </div>
        </div>
      </div>

      {/* Service Metrics */}
      <div className="dashboard-section">
        <div className="charts-grid">
          <div className="chart-container-wrapper">
            <LineChart
              data={getWaitTimeChartData()}
              title="Average Wait Time"
              formatType="number"
              height={300}
              fill={true}
            />
          </div>
          <div className="chart-container-wrapper">
            <BarChart
              data={getHourlyVolumeChartData()}
              title="Call Volume by Hour"
              formatType="number"
              height={300}
            />
          </div>
        </div>
      </div>

      {/* Analysis Charts */}
      <div className="dashboard-section">
        <div className="charts-grid">
          <div className="chart-container-wrapper">
            <PieChart
              data={getCallTypesChartData()}
              title="Call Type Distribution"
              formatType="number"
              height={300}
              variant="doughnut"
            />
          </div>
          <div className="chart-container-wrapper">
            <BarChart
              data={getResolutionRateByTypeChartData()}
              title="Resolution Rate by Call Type"
              formatType="percentage"
              height={300}
            />
          </div>
        </div>
      </div>

      {/* Call Details Table */}
      <div className="dashboard-section">
        <div className="table-container-wrapper full-width">
          <DataTable
            data={processedData.rawData
              .sort((a, b) => new Date(b.call_time || b.date) - new Date(a.call_time || a.date))
              .slice(0, 100)
            }
            columns={tableColumns}
            title="Recent Calls"
            pageSize={10}
            showSearch={true}
            showExport={true}
          />
        </div>
      </div>

    </div>
  );
};

export default CallCenterDashboard; 
