import { getPerformance } from 'firebase/performance';
import { app } from '@/config/firebase';
import { env, isProduction } from '@/config/environment';

let performance: any = null;

export function initializePerformanceMonitoring(): void {
  if (!env.features.performanceMonitoring) {
    console.log('Performance monitoring disabled');
    return;
  }

  try {
    performance = getPerformance(app);
    console.log('Firebase Performance Monitoring initialized');
  } catch (error) {
    console.error('Failed to initialize performance monitoring:', error);
  }
}

// Custom trace for measuring specific operations
export async function traceOperation<T>(
  name: string,
  operation: () => Promise<T>
): Promise<T> {
  if (!performance || !isProduction) {
    return operation();
  }

  const trace = performance.trace(name);
  trace.start();

  try {
    const result = await operation();
    trace.putMetric('success', 1);
    return result;
  } catch (error) {
    trace.putMetric('error', 1);
    throw error;
  } finally {
    trace.stop();
  }
}

// Network request monitoring
export async function traceNetworkRequest<T>(
  url: string,
  method: string,
  operation: () => Promise<T>
): Promise<T> {
  if (!performance || !isProduction) {
    return operation();
  }

  const trace = performance.trace(`${method}_${new URL(url).pathname}`);
  trace.putAttribute('url', url);
  trace.putAttribute('method', method);
  trace.start();

  const startTime = performance.now();

  try {
    const result = await operation();
    const duration = performance.now() - startTime;
    
    trace.putMetric('response_time', Math.round(duration));
    trace.putMetric('success', 1);
    trace.putAttribute('http_response_code', '200');
    
    return result;
  } catch (error: any) {
    const duration = performance.now() - startTime;
    
    trace.putMetric('response_time', Math.round(duration));
    trace.putMetric('error', 1);
    trace.putAttribute('http_response_code', error.code || '500');
    
    throw error;
  } finally {
    trace.stop();
  }
}

// Page load performance metrics
export function reportWebVitals(): void {
  if (!isProduction || typeof window === 'undefined') return;

  // First Contentful Paint (FCP)
  const paintObserver = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (entry.name === 'first-contentful-paint') {
        console.log('FCP:', entry.startTime);
        if (performance) {
          const trace = performance.trace('web_vitals');
          trace.putMetric('fcp', Math.round(entry.startTime));
          trace.stop();
        }
      }
    }
  });
  paintObserver.observe({ entryTypes: ['paint'] });

  // Largest Contentful Paint (LCP)
  const lcpObserver = new PerformanceObserver((list) => {
    const entries = list.getEntries();
    const lastEntry = entries[entries.length - 1];
    console.log('LCP:', lastEntry.startTime);
    if (performance) {
      const trace = performance.trace('web_vitals');
      trace.putMetric('lcp', Math.round(lastEntry.startTime));
      trace.stop();
    }
  });
  lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

  // Cumulative Layout Shift (CLS)
  let clsValue = 0;
  const clsObserver = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (!(entry as any).hadRecentInput) {
        clsValue += (entry as any).value;
      }
    }
    console.log('CLS:', clsValue);
  });
  clsObserver.observe({ entryTypes: ['layout-shift'] });

  // First Input Delay (FID)
  const fidObserver = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      const delay = entry.processingStart - entry.startTime;
      console.log('FID:', delay);
      if (performance) {
        const trace = performance.trace('web_vitals');
        trace.putMetric('fid', Math.round(delay));
        trace.stop();
      }
    }
  });
  fidObserver.observe({ entryTypes: ['first-input'] });
}

// Custom metrics
export function recordMetric(name: string, value: number, attributes?: Record<string, string>): void {
  if (!performance || !isProduction) return;

  const trace = performance.trace('custom_metrics');
  trace.putMetric(name, value);
  
  if (attributes) {
    Object.entries(attributes).forEach(([key, val]) => {
      trace.putAttribute(key, val);
    });
  }
  
  trace.stop();
}

// User timing API wrapper
export function mark(name: string): void {
  if (typeof window !== 'undefined' && window.performance) {
    window.performance.mark(name);
  }
}

export function measure(name: string, startMark: string, endMark?: string): void {
  if (typeof window !== 'undefined' && window.performance) {
    try {
      window.performance.measure(name, startMark, endMark);
      const measures = window.performance.getEntriesByName(name, 'measure');
      const measure = measures[measures.length - 1];
      
      if (measure && performance) {
        recordMetric(name, Math.round(measure.duration));
      }
    } catch (error) {
      console.error('Performance measurement error:', error);
    }
  }
}