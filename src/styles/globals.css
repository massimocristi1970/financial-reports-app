// create-sample-data.js
// Run this script to create sample data files in public/data directory

const fs = require('fs');
const path = require('path');

// Sample data generators
const generateLendingVolume = () => {
  const data = [];
  const startDate = new Date('2024-01-01');
  
  for (let i = 0; i < 50; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + (i * 2));
    
    data.push({
      CustomerID: `CUST${String(100000 + i).padStart(6, '0')}`,
      Count: Math.floor(Math.random() * 3) + 1,
      StageDate: date.toISOString().split('T')[0],
      IssuedAmount: Math.floor(Math.random() * 40000) + 5000,
      TierName: ['Premium', 'Standard', 'Basic'][Math.floor(Math.random() * 3)],
      Stage: ['Active', 'Pending', 'Completed'][Math.floor(Math.random() * 3)],
      PaymentStatus: ['Current', 'Late', 'Paid'][Math.floor(Math.random() * 3)]
    });
  }
  return data;
};

const generateArrears = () => {
  const data = [];
  const startDate = new Date('2024-01-01');
  
  for (let i = 0; i < 25; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + (i * 3));
    
    data.push({
      CustomerID: `CUST${String(100000 + i).padStart(6, '0')}`,
      Count: Math.floor(Math.random() * 2) + 1,
      StageDate: date.toISOString().split('T')[0],
      IssuedAmount: Math.floor(Math.random() * 30000) + 5000,
      TierName: ['Premium', 'Standard', 'Basic'][Math.floor(Math.random() * 3)],
      Stage: ['Arrears_30', 'Arrears_60', 'Arrears_90'][Math.floor(Math.random() * 3)],
      PaymentStatus: 'Late'
    });
  }
  return data;
};

const generateLiquidations = () => {
  const data = [];
  
  for (let i = 0; i < 12; i++) {
    const funded = Math.floor(Math.random() * 500000) + 200000;
    const collected = Math.floor(funded * (0.6 + Math.random() * 0.3));
    
    data.push({
      funded_year: 2024,
      funded_month: i + 1,
      funded: funded,
      collected: collected,
      actual_liquidation_rate: Math.round((collected / funded) * 100),
      future_scheduled: Math.floor(funded * 0.1),
      dmp_iva_collected: Math.floor(collected * 0.1),
      all_together: collected + Math.floor(funded * 0.05),
      forecast_liquidation_rate: Math.round(((collected + funded * 0.05) / funded) * 100),
      total_due_not_scheduled: Math.floor((funded - collected) * 0.2)
    });
  }
  return data;
};

const generateCallCenter = () => {
  const data = [];
  const agents = ['John Smith', 'Sarah Johnson', 'Mike Wilson', 'Emma Davis', 'Tom Brown'];
  const dispositions = ['Resolved', 'Transferred', 'Callback', 'Voicemail'];
  
  for (let i = 0; i < 100; i++) {
    const date = new Date('2024-01-01');
    date.setDate(date.getDate() + Math.floor(i / 10));
    date.setHours(9 + Math.floor(Math.random() * 8));
    date.setMinutes(Math.floor(Math.random() * 60));
    date.setSeconds(Math.floor(Math.random() * 60));
    
    const answered = new Date(date);
    answered.setSeconds(answered.getSeconds() + Math.floor(Math.random() * 30));
    
    data.push({
      call_id: `CALL${String(i + 1).padStart(6, '0')}`,
      date_time: date.toISOString().replace('T', ' ').split('.')[0],
      agent_name: agents[Math.floor(Math.random() * agents.length)],
      answered_date_time: answered.toISOString().replace('T', ' ').split('.')[0],
      from_number: `+44${Math.floor(Math.random() * 1000000000)}`,
      disposition: dispositions[Math.floor(Math.random() * dispositions.length)],
      talk_time: Math.floor(Math.random() * 600) + 30
    });
  }
  return data;
};

const generateComplaints = () => {
  const data = [];
  const categories = ['Service Quality', 'Billing', 'Technical', 'Product', 'Staff Behavior'];
  const decisions = ['Resolved', 'Upheld', 'Rejected', 'Pending'];
  
  for (let i = 0; i < 30; i++) {
    const receivedDate = new Date('2024-01-01');
    receivedDate.setDate(receivedDate.getDate() + (i * 2));
    
    const daysToResolve = Math.floor(Math.random() * 14) + 1;
    const resolvedDate = new Date(receivedDate);
    resolvedDate.setDate(resolvedDate.getDate() + daysToResolve);
    
    data.push({
      CustomerID: `CUST${String(100000 + i).padStart(6, '0')}`,
      count: 1,
      received_date: receivedDate.toISOString().split('T')[0],
      resolved_date: resolvedDate.toISOString().split('T')[0],
      days_to_resolve: daysToResolve,
      category: categories[Math.floor(Math.random() * categories.length)],
      decision: decisions[Math.floor(Math.random() * decisions.length)]
    });
  }
  return data;
};

// Main function to create all data files
const createSampleData = () => {
  console.log('Creating sample data files...');
  
  // Create public/data directory if it doesn't exist
  const dataDir = path.join('public', 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
    console.log('✅ Created public/data directory');
  }
  
  // Generate and save each data file
  const dataFiles = {
    'lending-volume.json': generateLendingVolume(),
    'arrears.json': generateArrears(),
    'liquidations.json': generateLiquidations(),
    'call-center.json': generateCallCenter(),
    'complaints.json': generateComplaints()
  };
  
  Object.entries(dataFiles).forEach(([filename, data]) => {
    const filePath = path.join(dataDir, filename);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    console.log(`✅ Created ${filename} with ${data.length} records`);
  });
  
  console.log('🎉 All sample data files created successfully!');
  console.log('You can now restart your React app to see the dashboards load with data.');
};

// Run the script
if (require.main === module) {
  createSampleData();
}

module.exports = { createSampleData };