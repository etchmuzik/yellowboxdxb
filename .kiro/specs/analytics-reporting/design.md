# Analytics & Reporting System Design

## Overview

The Analytics & Reporting System is designed as a comprehensive business intelligence platform that aggregates data from all Yellow Box modules (riders, expenses, fleet tracking, documents) to provide actionable insights. The system uses React Query for data caching, Chart.js for visualizations, and implements a service-oriented architecture with real-time data processing capabilities.

## Architecture

### High-Level Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Dashboard     │    │   Analytics     │    │   Data Sources  │
│   Components    │◄──►│   Service       │◄──►│   (Firestore)   │
│                 │    │   Layer         │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Chart         │    │   Report        │    │   Background    │
│   Components    │    │   Generator     │    │   Jobs          │
│                 │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Component Architecture
- **AnalyticsDashboard**: Main container with tabs and metric cards
- **ExpenseTrendsChart**: Time-series visualization for expense data
- **RiderMetricsTable**: Performance metrics and KPI display
- **CategoryAnalysisChart**: Pie/bar charts for category breakdowns
- **ReportGenerator**: Automated report creation and scheduling
- **KPIDashboard**: Executive-level summary metrics

### Service Layer
- **analyticsService**: Core analytics calculations and data aggregation
- **reportService**: Report generation and export functionality
- **chartDataService**: Data transformation for visualization components
- **alertService**: Budget monitoring and notification system

## Components and Interfaces

### Core Data Models

```typescript
interface AnalyticsMetrics {
  totalExpenses: number;
  totalRiders: number;
  averageCostPerRider: number;
  averageOnboardingTime: number;
  budgetUtilization: number;
  activeRiders: number;
  completionRate: number;
}

interface ExpenseTrend {
  month: string;
  totalSpent: number;
  budgetAllocated: number;
  categoryBreakdown: CategorySpend[];
  riderCount: number;
  averagePerRider: number;
}

interface CategorySpend {
  category: string;
  amount: number;
  percentage: number;
  trend: 'up' | 'down' | 'stable';
  budgetLimit?: number;
}

interface RiderMetrics {
  riderId: string;
  riderName: string;
  totalSpent: number;
  onboardingStage: string;
  timeToComplete: number;
  testResults: TestMetrics;
  efficiency: 'High' | 'Medium' | 'Low';
  documentsCompliance: number;
}

interface TestMetrics {
  theoryPassRate: number;
  roadPassRate: number;
  medicalPassRate: number;
  averageAttempts: number;
}

interface FleetAnalytics {
  totalDistance: number;
  averageSpeed: number;
  idleTime: number;
  districtCoverage: DistrictMetrics[];
  performanceScore: number;
}

interface DistrictMetrics {
  district: string;
  riderCount: number;
  averageDeliveryTime: number;
  coverage: number;
}
```

### Component Interfaces

```typescript
interface AnalyticsDashboardProps {
  timeRange: '3' | '6' | '12';
  userRole: UserRole;
  onTimeRangeChange: (range: string) => void;
}

interface ExpenseTrendsChartProps {
  data: ExpenseTrend[];
  loading: boolean;
  height?: number;
  showBudgetLine?: boolean;
}

interface RiderMetricsTableProps {
  data: RiderMetrics[];
  loading: boolean;
  onRiderClick: (riderId: string) => void;
  sortBy: keyof RiderMetrics;
  sortOrder: 'asc' | 'desc';
}

interface ReportGeneratorProps {
  reportTypes: ReportType[];
  onGenerateReport: (type: ReportType, params: ReportParams) => Promise<void>;
  scheduledReports: ScheduledReport[];
}
```

## Data Models

### Analytics Collections

#### analytics_cache
```typescript
{
  id: string;
  type: 'expense_trends' | 'rider_metrics' | 'fleet_analytics';
  timeRange: string;
  data: any;
  generatedAt: Timestamp;
  expiresAt: Timestamp;
}
```

#### budget_alerts
```typescript
{
  id: string;
  category: string;
  threshold: number;
  currentSpend: number;
  alertLevel: 'warning' | 'critical';
  recipients: string[];
  lastTriggered: Timestamp;
  active: boolean;
}
```

#### scheduled_reports
```typescript
{
  id: string;
  name: string;
  type: ReportType;
  schedule: string; // cron expression
  recipients: string[];
  parameters: ReportParams;
  lastRun: Timestamp;
  nextRun: Timestamp;
  active: boolean;
}
```

#### kpi_snapshots
```typescript
{
  id: string;
  date: string; // YYYY-MM-DD
  metrics: AnalyticsMetrics;
  trends: {
    expenseGrowth: number;
    riderGrowth: number;
    efficiencyChange: number;
  };
  createdAt: Timestamp;
}
```

## Error Handling

### Analytics Error Types
```typescript
enum AnalyticsErrorType {
  DATA_AGGREGATION_ERROR = 'DATA_AGGREGATION_ERROR',
  CHART_RENDERING_ERROR = 'CHART_RENDERING_ERROR',
  REPORT_GENERATION_ERROR = 'REPORT_GENERATION_ERROR',
  EXPORT_ERROR = 'EXPORT_ERROR',
  CACHE_ERROR = 'CACHE_ERROR',
  PERMISSION_DENIED = 'PERMISSION_DENIED'
}
```

### Error Handling Strategy
- **Data Loading**: Graceful degradation with cached data fallback
- **Chart Rendering**: Error boundaries with fallback components
- **Report Generation**: Retry mechanism with exponential backoff
- **Export Operations**: Progress tracking with cancellation support

## Testing Strategy

### Unit Testing
- **Analytics Service**: Data aggregation and calculation logic
- **Chart Components**: Data transformation and rendering
- **Report Generator**: Template processing and export functionality
- **Alert System**: Threshold monitoring and notification logic

### Integration Testing
- **Dashboard Loading**: End-to-end data flow from Firestore to charts
- **Report Generation**: Complete report creation and export workflow
- **Real-time Updates**: Live data updates and cache invalidation
- **Permission Testing**: Role-based access to analytics features

### Performance Testing
- **Large Dataset Handling**: Performance with 1000+ riders and expenses
- **Chart Rendering**: Smooth animations and responsive interactions
- **Export Performance**: Large report generation and download speeds
- **Cache Efficiency**: Data caching and invalidation strategies

### Test Coverage Goals
- Analytics Service: 95% coverage
- Chart Components: 85% coverage
- Report Generation: 90% coverage
- Critical Analytics Paths: 100% coverage

## Security Considerations

### Data Access Control
- Role-based analytics permissions (Admin, Finance, Operations)
- Sensitive data masking for unauthorized users
- Audit logging for analytics access and report generation
- Data export restrictions based on user roles

### Report Security
- Secure report storage with access controls
- Encrypted report transmission for email delivery
- Report access logging and retention policies
- Watermarking for sensitive reports

## Performance Optimization

### Data Caching Strategy
```typescript
interface CacheStrategy {
  expenseTrends: {
    ttl: 1800; // 30 minutes
    refreshTrigger: 'expense_update';
  };
  riderMetrics: {
    ttl: 3600; // 1 hour
    refreshTrigger: 'rider_stage_change';
  };
  fleetAnalytics: {
    ttl: 300; // 5 minutes
    refreshTrigger: 'location_update';
  };
}
```

### Chart Optimization
- Lazy loading for heavy chart components
- Data sampling for large datasets
- Virtual scrolling for metric tables
- Debounced filter updates

### Report Generation Optimization
- Background processing for large reports
- Template caching and reuse
- Incremental data processing
- Parallel export operations

## Visualization Strategy

### Chart Types and Use Cases
```typescript
interface ChartConfig {
  expenseTrends: {
    type: 'line';
    features: ['zoom', 'tooltip', 'legend'];
    responsive: true;
  };
  categoryBreakdown: {
    type: 'doughnut';
    features: ['tooltip', 'legend', 'animation'];
    responsive: true;
  };
  riderProgress: {
    type: 'bar';
    features: ['tooltip', 'zoom', 'filter'];
    responsive: true;
  };
  fleetHeatmap: {
    type: 'scatter';
    features: ['tooltip', 'zoom', 'cluster'];
    responsive: true;
  };
}
```

### Responsive Design
- Mobile-optimized chart layouts
- Touch-friendly interactions
- Adaptive data density
- Progressive disclosure for complex metrics

## Real-time Updates

### Data Synchronization
- Firestore real-time listeners for live metrics
- WebSocket connections for fleet tracking data
- Optimistic updates for better UX
- Conflict resolution for concurrent updates

### Update Strategies
```typescript
interface UpdateStrategy {
  highFrequency: {
    interval: 30000; // 30 seconds
    triggers: ['location_update', 'expense_approval'];
  };
  mediumFrequency: {
    interval: 300000; // 5 minutes
    triggers: ['rider_stage_change', 'document_upload'];
  };
  lowFrequency: {
    interval: 1800000; // 30 minutes
    triggers: ['budget_update', 'report_schedule'];
  };
}
```

## Alert and Notification System

### Alert Types
```typescript
interface AlertConfig {
  budgetThreshold: {
    warning: 80; // 80% of budget
    critical: 95; // 95% of budget
    recipients: ['finance_team'];
  };
  onboardingDelay: {
    warning: 21; // 21 days
    critical: 30; // 30 days
    recipients: ['operations_team'];
  };
  documentExpiry: {
    warning: 30; // 30 days before expiry
    critical: 7; // 7 days before expiry
    recipients: ['operations_team', 'rider'];
  };
}
```

### Notification Delivery
- Email notifications with HTML templates
- In-app notifications with real-time updates
- SMS alerts for critical issues
- Slack/Teams integration for team notifications