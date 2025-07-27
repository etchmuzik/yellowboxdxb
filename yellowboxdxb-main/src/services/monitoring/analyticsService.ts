import { getAnalytics, logEvent, setUserId, setUserProperties, Analytics } from 'firebase/analytics';
import { app } from '@/config/firebase';
import { env, isProduction } from '@/config/environment';

let analytics: Analytics | null = null;

export function initializeAnalytics(): void {
  if (!env.features.analytics) {
    console.log('Analytics disabled');
    return;
  }

  if (!env.firebase.measurementId) {
    console.log('Firebase Measurement ID not configured');
    return;
  }

  try {
    analytics = getAnalytics(app);
    console.log('Firebase Analytics initialized');
  } catch (error) {
    console.error('Failed to initialize analytics:', error);
  }
}

// User identification
export function identifyUser(userId: string, properties?: Record<string, any>): void {
  if (!analytics || !isProduction) return;

  try {
    setUserId(analytics, userId);
    
    if (properties) {
      setUserProperties(analytics, properties);
    }
  } catch (error) {
    console.error('Failed to identify user:', error);
  }
}

// Page view tracking
export function trackPageView(pageName: string, properties?: Record<string, any>): void {
  if (!analytics) return;

  try {
    logEvent(analytics, 'page_view', {
      page_title: pageName,
      page_location: window.location.href,
      page_path: window.location.pathname,
      ...properties,
    });
  } catch (error) {
    console.error('Failed to track page view:', error);
  }
}

// Custom event tracking
export function trackEvent(eventName: string, properties?: Record<string, any>): void {
  if (!analytics) return;

  try {
    logEvent(analytics, eventName, properties);
  } catch (error) {
    console.error('Failed to track event:', error);
  }
}

// Predefined events for Yellow Box
export const YellowBoxEvents = {
  // Authentication
  login: (method: string) => trackEvent('login', { method }),
  logout: () => trackEvent('logout'),
  signUp: (method: string) => trackEvent('sign_up', { method }),
  
  // Rider Management
  riderCreated: (riderId: string) => trackEvent('rider_created', { rider_id: riderId }),
  riderStatusUpdated: (riderId: string, newStatus: string) => 
    trackEvent('rider_status_updated', { rider_id: riderId, new_status: newStatus }),
  riderDocumentUploaded: (riderId: string, documentType: string) =>
    trackEvent('rider_document_uploaded', { rider_id: riderId, document_type: documentType }),
  
  // Expense Management
  expenseSubmitted: (riderId: string, amount: number, category: string) =>
    trackEvent('expense_submitted', { 
      rider_id: riderId, 
      value: amount, 
      currency: 'AED',
      category 
    }),
  expenseApproved: (expenseId: string, amount: number) =>
    trackEvent('expense_approved', { 
      expense_id: expenseId, 
      value: amount,
      currency: 'AED'
    }),
  expenseRejected: (expenseId: string, reason: string) =>
    trackEvent('expense_rejected', { expense_id: expenseId, reason }),
  
  // Bike Management
  bikeAssigned: (bikeId: string, riderId: string) =>
    trackEvent('bike_assigned', { bike_id: bikeId, rider_id: riderId }),
  bikeStatusChanged: (bikeId: string, newStatus: string) =>
    trackEvent('bike_status_changed', { bike_id: bikeId, new_status: newStatus }),
  
  // Budget Management
  budgetCreated: (month: string, totalBudget: number) =>
    trackEvent('budget_created', { 
      month, 
      value: totalBudget,
      currency: 'AED'
    }),
  budgetUpdated: (month: string, newBudget: number) =>
    trackEvent('budget_updated', { 
      month, 
      value: newBudget,
      currency: 'AED'
    }),
  
  // Reports
  reportGenerated: (reportType: string) =>
    trackEvent('report_generated', { report_type: reportType }),
  reportDownloaded: (reportType: string, format: string) =>
    trackEvent('report_downloaded', { report_type: reportType, format }),
  
  // Errors
  error: (errorType: string, errorMessage: string) =>
    trackEvent('app_error', { error_type: errorType, error_message: errorMessage }),
};

// E-commerce tracking for expense transactions
export function trackExpenseTransaction(
  transactionId: string,
  riderId: string,
  amount: number,
  category: string
): void {
  if (!analytics || !isProduction) return;

  try {
    logEvent(analytics, 'purchase', {
      transaction_id: transactionId,
      value: amount,
      currency: 'AED',
      items: [{
        item_id: category,
        item_name: category,
        item_category: 'expense',
        price: amount,
        quantity: 1,
      }],
      user_id: riderId,
    });
  } catch (error) {
    console.error('Failed to track expense transaction:', error);
  }
}

// Screen tracking for mobile views
export function trackScreenView(screenName: string, screenClass?: string): void {
  if (!analytics) return;

  try {
    logEvent(analytics, 'screen_view', {
      firebase_screen: screenName,
      firebase_screen_class: screenClass || screenName,
    });
  } catch (error) {
    console.error('Failed to track screen view:', error);
  }
}

// Timing events
export function trackTiming(category: string, variable: string, value: number): void {
  if (!analytics) return;

  try {
    logEvent(analytics, 'timing_complete', {
      name: variable,
      value: Math.round(value),
      event_category: category,
    });
  } catch (error) {
    console.error('Failed to track timing:', error);
  }
}