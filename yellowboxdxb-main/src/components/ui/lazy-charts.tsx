import React, { Suspense, lazy } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Lazy load the charts component
const SpendChartsComponent = lazy(() => import('@/components/dashboard/SpendCharts').then(module => ({
  default: module.SpendCharts
})));

// Loading component for charts
const ChartLoader = () => (
  <div className="flex items-center justify-center h-64">
    <div className="flex flex-col items-center space-y-2">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-600"></div>
      <p className="text-sm text-muted-foreground">Loading charts...</p>
    </div>
  </div>
);

// Wrapper component with suspense
export const LazySpendCharts: React.FC = () => {
  return (
    <Suspense fallback={<ChartLoader />}>
      <SpendChartsComponent />
    </Suspense>
  );
};

export default LazySpendCharts;