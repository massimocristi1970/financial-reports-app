# Financial Reports Dashboard

A comprehensive financial reporting and analytics platform built with React for tracking lending volumes, arrears, liquidations, call center performance, and customer complaints.

## 🚀 Getting Started

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

### Prerequisites

- Node.js (version 14 or higher)
- npm or yarn package manager

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd financial-reports-app
```

2. **Install dependencies**
```bash
npm install
```

3. **Install additional required packages**
```bash
npm install papaparse
```

### Available Scripts

In the project directory, you can run:

#### `npm start`

Runs the app in development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

#### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

#### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

## 📊 Features

### Report Types Supported

- **💰 Lending Volume** - Track loan origination volumes and trends
- **⚠️ Arrears Analysis** - Monitor overdue accounts and payment behavior  
- **🔄 Liquidations** - Track liquidation activities and recovery rates
- **📞 Call Center Performance** - Monitor call center metrics and service levels
- **📋 Complaints Analysis** - Track customer complaints and resolution performance

### Data Upload & Validation

- CSV file upload with automatic validation
- Flexible column mapping (handles various header formats)
- Real-time validation feedback
- Support for large files (up to 50MB)

### Analytics & Visualization

- Interactive dashboards for each report type
- KPI tracking and trend analysis
- Export capabilities (CSV, Excel, PDF)
- Date range filtering and advanced search

## 📁 Required Dependencies

### Core Dependencies

The application requires the following key packages:

```json
{
  "react": "^19.1.0",
  "react-dom": "^19.1.0",
  "react-scripts": "5.0.1",
  "papaparse": "^5.4.1"
}
```

### Additional Dependencies

- **Chart.js & react-chartjs-2** - For data visualization
- **React Router** - For navigation
- **Tailwind CSS** - For styling

## 🔧 CSV File Requirements

### File Format
- **Supported formats**: `.csv`, `.xlsx`, `.xls`
- **Maximum file size**: 50MB
- **Maximum rows**: 100,000

### Required Headers by Report Type

#### Lending Volume
```csv
customer_id,funded_app_count,tier_name,stage,stage_date,payment_status,funded_date,last_payment_date,issued_amount,total_due,payment
```

#### Arrears
```csv
customer_id,funded_app_count,tier_name,stage,stage_date,payment_status,funded_date,last_payment_date,issued_amount,total_due,payment
```

#### Liquidations
```csv
funded_year,funded_month,funded,collected,actual_liquidation_rate,future_scheduled,dmp_iva_collected,all_together,forecast_liquidation_rate,total_due_not_scheduled
```

#### Call Center (4 different report formats supported)
```csv
# Report 1: call_id,date_time,agent_name,answered_date_time,from_number,disposition,talk_time
# Report 2: phone_numbers,total_calls,total_call_duration,inbound_calls,inbound_call_duration,outbound_calls,outbound_call_duration,missed_calls
# Report 3: call_id,date_time_earliest,duration,initial_direction,inbound,outbound
# Report 4: date,fcr
```

#### Complaints
```csv
customer_id,count,received_date,resolved_date,days_to_resolve,category,decision
```

### Data Format Guidelines

- **Dates**: Use `YYYY-MM-DD` or `DD/MM/YYYY` format
- **Date/Time**: Use `YYYY-MM-DD HH:mm:ss` format
- **Numbers**: No commas, use decimal points for decimals
- **Percentages**: Just the number (e.g., `85.5` for 85.5%)
- **Currency**: Just the number (e.g., `5000.50`)

## 🗄️ Data Storage

The application uses **IndexedDB** for client-side data storage:
- No server required for basic functionality
- Data persists between browser sessions
- Automatic data validation and sanitization
- Export/import capabilities

## 🛠️ Development

### Project Structure

```
src/
├── components/          # React components
│   ├── admin/          # Admin panel components
│   ├── charts/         # Chart components
│   ├── filters/        # Filter components
│   └── layout/         # Layout components
├── config/             # Configuration files
├── contexts/           # React contexts
├── hooks/              # Custom React hooks
├── services/           # Business logic services
├── utils/              # Utility functions
└── styles/             # CSS and styling files
```

### Key Configuration Files

- `src/config/reportConfig.js` - Report type definitions and field configurations
- `src/utils/constants.js` - Application constants and column mappings
- `src/services/validationService.js` - Data validation logic

### Adding New Report Types

1. Add new report type to `REPORT_TYPES` in `constants.js`
2. Define field structure in `reportConfig.js`
3. Add column mappings for CSV headers
4. Update validation rules if needed

## 🚨 Troubleshooting

### Common Issues

1. **CSV Upload Fails**
   - Check file size (max 50MB)
   - Verify CSV headers match required format
   - Ensure file is properly formatted CSV

2. **Performance Issues with Large Files**
   - Consider splitting large files into smaller chunks
   - Close unnecessary browser tabs
   - Check available system memory

3. **Build Errors**
   - Run `npm install` to ensure all dependencies are installed
   - Clear npm cache: `npm cache clean --force`
   - Delete `node_modules` and run `npm install` again

## 📚 Learn More

- [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started)
- [React documentation](https://reactjs.org/)
- [Papa Parse documentation](https://www.papaparse.com/docs)
- [Chart.js documentation](https://www.chartjs.org/docs/)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.