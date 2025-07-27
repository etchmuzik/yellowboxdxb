import { lazy, Suspense } from 'react';
import { Loader2 } from 'lucide-react';

// Loading component for charts
const ChartLoader = () => (
  <div className="flex items-center justify-center h-full min-h-[200px]">
    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
  </div>
);

// Loading component for maps
const MapLoader = () => (
  <div className="flex items-center justify-center h-full min-h-[400px] bg-muted rounded-lg">
    <div className="text-center">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto mb-2" />
      <p className="text-sm text-muted-foreground">Loading map...</p>
    </div>
  </div>
);

// Lazy load heavy components
export const LazySpendCharts = lazy(() => import('@/components/dashboard/SpendCharts').then(module => ({
  default: module.SpendCharts
})));

export const LazyBikeMap = lazy(() => import('@/components/bike-tracker/BikeMap'));

export const LazyLiveMapCard = lazy(() => import('@/components/bike-tracker/LiveMapCard'));

export const LazyMyBikeLocationCard = lazy(() => import('@/components/dashboard/rider/MyBikeLocationCard').then(module => ({
  default: module.MyBikeLocationCard
})));

// Wrapper components with built-in suspense
export const SpendChartsWithSuspense = () => (
  <Suspense fallback={<ChartLoader />}>
    <LazySpendCharts />
  </Suspense>
);

export const BikeMapWithSuspense = (props: any) => (
  <Suspense fallback={<MapLoader />}>
    <LazyBikeMap {...props} />
  </Suspense>
);

export const LiveMapCardWithSuspense = (props: any) => (
  <Suspense fallback={<MapLoader />}>
    <LazyLiveMapCard {...props} />
  </Suspense>
);

export const MyBikeLocationCardWithSuspense = (props: any) => (
  <Suspense fallback={<MapLoader />}>
    <LazyMyBikeLocationCard {...props} />
  </Suspense>
);