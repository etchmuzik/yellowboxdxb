# YELLOWBOX Fleet Management Dashboard

A comprehensive web-based dashboard for managing the YELLOWBOX delivery fleet in Dubai.

## Features

### Dashboard Overview
- **Real-time Statistics**: Total riders, active riders, monthly offboarding, and new hires
- **Interactive Charts**: 
  - Nationality distribution (Doughnut chart)
  - Zone-wise rider distribution (Bar chart)
  - Platform distribution - Talabat vs Keeta (Pie chart)
  - Monthly onboarding trends (Line chart)

### Fleet Roster
- Complete rider database with 120 riders
- Detailed information including:
  - Rider ID, Name, Talabat ID, Keeta ID
  - Zone assignment, Bike number
  - Nationality, Contact details
  - Email, Joining date, Status

### Advanced Filtering
- **Search**: Search by name, ID, bike number, or email
- **Zone Filter**: Filter riders by operational zone
- **Nationality Filter**: Filter by rider nationality
- **Status Filter**: View active or offboarded riders

### Activity Tracking
- **Recent Onboarding**: Latest 5 riders who joined the fleet
- **Recent Offboarding**: Latest 5 riders who left with reasons

### Data Import & Export
- **Import CSV**: Upload CSV files to add new riders to the fleet
  - Automatically detects column headers
  - Validates and parses rider data
  - Updates dashboard in real-time
  - Supports standard CSV format
- **Export CSV**: Download filtered data to CSV format
  - Exports currently filtered view
  - Includes all rider information for reporting
  - Timestamped filename for easy tracking

## Data Insights

### Current Fleet Statistics
- **Total Riders**: 120
- **Active Riders**: ~90 (includes Keeta movers)
- **Nationalities**: Pakistani, Indian, Egyptian, Bangladeshi, Nepali
- **Zones**: Jumeirah, Business Bay, Al Barsha, Deira, Downtown, Marina, Al Karama, and more
- **Platforms**: Talabat, Keeta, or both

### Key Metrics
- Multi-platform riders (Talabat + Keeta)
- Electric bicycle assignments
- Zone-wise distribution
- Monthly hiring trends

## Technology Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Charts**: Chart.js for data visualization
- **Design**: Responsive design with gradient themes
- **Data**: Parsed from YELLOWBOX OB CSV file

## File Structure

```
yellowboxblack/
├── index.html          # Main dashboard HTML
├── styles.css          # Dashboard styling
├── data.js            # Fleet data (parsed from CSV)
├── app.js             # Dashboard logic and interactions
├── YELLOWBOX OB .csv  # Original fleet data
└── README.md          # Documentation
```

## How to Use

1. **Open the Dashboard**
   - Simply open `index.html` in any modern web browser
   - No server or installation required

2. **Navigate the Dashboard**
   - View statistics at the top
   - Explore charts for visual insights
   - Use filters to find specific riders
   - Import or export data as needed

3. **Search and Filter**
   - Type in the search box to find riders
   - Use dropdown filters for zone, nationality, or status
   - Filters work together for precise results

4. **Import Data**
   - Click the "Import CSV" button
   - Select a CSV file with rider data
   - System automatically detects columns and imports riders
   - Dashboard updates immediately with new data

5. **Export Data**
   - Click the "Export CSV" button
   - CSV file downloads with current filtered view
   - Use for reporting or external analysis
   - Filename includes date for easy tracking

## Data Sources

The dashboard is built from the YELLOWBOX OB .csv file containing:
- **Riders Data**: 120+ rider records with complete details
- **Onboarding (OB)**: Training and onboarding status
- **Offboarding**: Termination and resignation records
- **New Hiring**: Recent recruitment data
- **Platform Transfers**: Talabat to Keeta migrations

## Features Highlights

### Visual Design
- Modern gradient color scheme (Purple/Blue/Green)
- Responsive layout for all screen sizes
- Smooth animations and hover effects
- Clean, professional interface
- Text-based stat icons for clarity

### Data Management
- Real-time filtering and search
- Status badges (Active/Offboarded)
- Sortable and scrollable tables
- Activity timeline

### Analytics
- Nationality breakdown
- Zone distribution analysis
- Platform usage statistics
- Hiring trend visualization

## CSV Import Format

The import feature accepts CSV files with the following columns (flexible header names):
- ID (optional - auto-generated if missing)
- Name (required)
- Talabat ID
- Keeta ID
- Zone
- Bike
- Nationality
- Phone
- Email
- Joining Date
- Status (active/offboarded)

**Example CSV:**
```
ID,Name,Talabat ID,Keeta ID,Zone,Bike,Nationality,Phone,Email,Joining Date,Status
70,John Doe,1234567,,Dubai,60830 DXB 2,Pakistani,501234567,john@example.com,11-15-2025,active
```

## Browser Compatibility

- Chrome (Recommended)
- Firefox
- Safari
- Edge
- Opera

## Future Enhancements

Potential features for future versions:
- Real-time data sync with backend API
- Document expiry alerts and notifications
- Performance metrics per rider
- Route optimization tools
- Mobile app version
- SMS/Email notifications
- Advanced reporting and analytics
- Bulk edit capabilities
- Data validation rules

## Support

For questions or issues with the dashboard, please contact the YELLOWBOX fleet management team.

---

**Last Updated**: November 2025  
**Version**: 1.1  
**Built for**: YELLOWBOX Delivery Services LLC, Dubai

## Changelog

### Version 1.1
- Removed emojis for cleaner professional look
- Added CSV import functionality
- Enhanced export to respect current filters
- Improved stat icon design with text labels
- Added success notifications for import/export
- Better CSV parsing with quoted value support

### Version 1.0
- Initial release with 69 riders
- Interactive charts and statistics
- Search and filter capabilities
- CSV export functionality
