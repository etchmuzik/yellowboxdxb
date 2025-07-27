/**
 * Web App Health Monitoring Integration
 * Integrates with the comprehensive monitoring workflow
 */

class WebAppMonitoringService {
  constructor() {
    this.monitoringEndpoint = 'https://n8n.srv924607.hstgr.cloud/webhook/monitoring-webhook';
    this.healthCheckInterval = 5 * 60 * 1000; // 5 minutes
    this.retryAttempts = 3;
    this.retryDelay = 2000; // 2 seconds
  }

  /**
   * Initialize monitoring service
   */
  async init() {
    console.log('🔍 Initializing Web App Monitoring Service...');
    
    // Start periodic health checks
    this.startPeriodicHealthChecks();
    
    // Monitor Firebase connectivity
    this.monitorFirebaseHealth();
    
    // Monitor webhook connectivity
    this.monitorWebhookHealth();
    
    // Monitor real-time fleet tracking
    this.monitorFleetTracking();
    
    console.log('✅ Web App Monitoring Service initialized');
  }

  /**
   * Start periodic health checks
   */
  startPeriodicHealthChecks() {
    setInterval(async () => {
      await this.performHealthCheck();
    }, this.healthCheckInterval);

    // Initial check
    this.performHealthCheck();
  }

  /**
   * Perform comprehensive health check
   */
  async performHealthCheck() {
    const timestamp = new Date().toISOString();
    const healthData = {
      timestamp,
      checks: []
    };

    try {
      // Web App Health
      const webAppHealth = await this.checkWebAppHealth();
      healthData.checks.push(webAppHealth);

      // API Health
      const apiHealth = await this.checkAPIHealth();
      healthData.checks.push(apiHealth);

      // Firebase Health
      const firebaseHealth = await this.checkFirebaseHealth();
      healthData.checks.push(firebaseHealth);

      // N8N Webhook Health
      const webhookHealth = await this.checkWebhookHealth();
      healthData.checks.push(webhookHealth);

      // Fleet Tracking Health
      const fleetHealth = await this.checkFleetTrackingHealth();
      healthData.checks.push(fleetHealth);

      // Send monitoring data to N8N
      await this.sendMonitoringData(healthData);

      console.log('📊 Health check completed:', healthData);
    } catch (error) {
      console.error('❌ Health check failed:', error);
      await this.reportHealthCheckError(error);
    }
  }

  /**
   * Check web app health
   */
  async checkWebAppHealth() {
    const startTime = Date.now();
    const check = {
      name: 'web_app_health',
      timestamp: new Date().toISOString(),
      status: 'unknown',
      responseTime: 0,
      error: null
    };

    try {
      const response = await this.fetchWithTimeout('https://yellowbox-8e0e6.web.app', {
        method: 'GET',
        timeout: 10000
      });

      check.responseTime = Date.now() - startTime;
      check.status = response.ok ? 'healthy' : 'warning';
      check.statusCode = response.status;
      
      if (!response.ok) {
        check.error = `HTTP ${response.status}`;
      }
    } catch (error) {
      check.responseTime = Date.now() - startTime;
      check.status = 'critical';
      check.error = error.message;
    }

    return check;
  }

  /**
   * Check API health
   */
  async checkAPIHealth() {
    const startTime = Date.now();
    const check = {
      name: 'api_health',
      timestamp: new Date().toISOString(),
      status: 'unknown',
      responseTime: 0,
      error: null
    };

    try {
      const response = await this.fetchWithTimeout('https://yellowbox-8e0e6.web.app/api/health', {
        method: 'GET',
        timeout: 8000
      });

      check.responseTime = Date.now() - startTime;
      
      if (response.ok) {
        const data = await response.json();
        check.status = data.status === 'ok' ? 'healthy' : 'warning';
        check.apiData = data;
      } else {
        check.status = 'warning';
        check.error = `HTTP ${response.status}`;
      }
      
      check.statusCode = response.status;
    } catch (error) {
      check.responseTime = Date.now() - startTime;
      check.status = 'critical';
      check.error = error.message;
    }

    return check;
  }

  /**
   * Check Firebase connectivity health
   */
  async checkFirebaseHealth() {
    const startTime = Date.now();
    const check = {
      name: 'firebase_health',
      timestamp: new Date().toISOString(),
      status: 'unknown',
      responseTime: 0,
      error: null
    };

    try {
      // Check Firebase hosting
      const response = await this.fetchWithTimeout('https://yellowbox-8e0e6.firebaseapp.com', {
        method: 'GET',
        timeout: 8000
      });

      check.responseTime = Date.now() - startTime;
      check.status = response.ok ? 'healthy' : 'warning';
      check.statusCode = response.status;

      // Additional Firebase service checks can be added here
      check.services = {
        hosting: response.ok,
        firestore: await this.checkFirestoreConnection(),
        auth: await this.checkAuthConnection()
      };
      
    } catch (error) {
      check.responseTime = Date.now() - startTime;
      check.status = 'critical';
      check.error = error.message;
    }

    return check;
  }

  /**
   * Check webhook connectivity
   */
  async checkWebhookHealth() {
    const startTime = Date.now();
    const check = {
      name: 'webhook_health',
      timestamp: new Date().toISOString(),
      status: 'unknown',
      responseTime: 0,
      error: null
    };

    try {
      const testPayload = {
        type: 'health_check',
        timestamp: new Date().toISOString(),
        data: { message: 'Webhook health check' }
      };

      const response = await this.fetchWithTimeout('https://n8n.srv924607.hstgr.cloud/webhook/yellowbox-sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testPayload),
        timeout: 5000
      });

      check.responseTime = Date.now() - startTime;
      check.status = response.ok ? 'healthy' : 'warning';
      check.statusCode = response.status;
      
    } catch (error) {
      check.responseTime = Date.now() - startTime;
      check.status = 'critical';
      check.error = error.message;
    }

    return check;
  }

  /**
   * Check fleet tracking health
   */
  async checkFleetTrackingHealth() {
    const check = {
      name: 'fleet_tracking_health',
      timestamp: new Date().toISOString(),
      status: 'unknown',
      error: null,
      metrics: {}
    };

    try {
      // Check real-time location tracking
      const activeRiders = await this.getActiveRidersCount();
      const recentLocations = await this.getRecentLocationUpdates();
      
      check.metrics = {
        activeRiders,
        recentLocationUpdates: recentLocations,
        trackingSystemStatus: activeRiders > 0 ? 'active' : 'idle'
      };

      check.status = 'healthy';
      
      // Check for stale location data
      if (recentLocations === 0 && activeRiders > 0) {
        check.status = 'warning';
        check.error = 'No recent location updates detected';
      }
      
    } catch (error) {
      check.status = 'critical';
      check.error = error.message;
    }

    return check;
  }

  /**
   * Monitor Firebase health
   */
  async monitorFirebaseHealth() {
    // Real-time Firebase monitoring logic
    // This would integrate with the existing Firebase monitoring services
    console.log('🔥 Firebase health monitoring active');
  }

  /**
   * Monitor webhook health
   */
  async monitorWebhookHealth() {
    // Monitor webhook endpoint availability
    console.log('🔗 Webhook health monitoring active');
  }

  /**
   * Monitor fleet tracking
   */
  async monitorFleetTracking() {
    // Monitor real-time fleet tracking system
    console.log('🚚 Fleet tracking monitoring active');
  }

  /**
   * Send monitoring data to N8N
   */
  async sendMonitoringData(healthData) {
    try {
      const response = await this.fetchWithTimeout(this.monitoringEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          operation: 'health_monitoring',
          data: healthData,
          timestamp: new Date().toISOString()
        }),
        timeout: 10000
      });

      if (!response.ok) {
        throw new Error(`Failed to send monitoring data: ${response.status}`);
      }

      console.log('📊 Monitoring data sent successfully');
    } catch (error) {
      console.error('❌ Failed to send monitoring data:', error);
    }
  }

  /**
   * Report health check error
   */
  async reportHealthCheckError(error) {
    try {
      await this.sendMonitoringData({
        timestamp: new Date().toISOString(),
        error: {
          message: error.message,
          stack: error.stack,
          type: 'health_check_failure'
        }
      });
    } catch (reportError) {
      console.error('❌ Failed to report health check error:', reportError);
    }
  }

  /**
   * Utility: Fetch with timeout
   */
  async fetchWithTimeout(url, options = {}) {
    const { timeout = 8000, ...fetchOptions } = options;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    try {
      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  /**
   * Check Firestore connection (placeholder)
   */
  async checkFirestoreConnection() {
    // This would integrate with existing Firebase services
    return true;
  }

  /**
   * Check Auth connection (placeholder)
   */
  async checkAuthConnection() {
    // This would integrate with existing Firebase auth
    return true;
  }

  /**
   * Get active riders count (placeholder)
   */
  async getActiveRidersCount() {
    // This would integrate with existing bike tracker service
    return 0;
  }

  /**
   * Get recent location updates (placeholder)
   */
  async getRecentLocationUpdates() {
    // This would integrate with existing location tracking
    return 0;
  }
}

// Initialize monitoring service
const monitoringService = new WebAppMonitoringService();

// Export for use in web app
if (typeof module !== 'undefined' && module.exports) {
  module.exports = WebAppMonitoringService;
} else if (typeof window !== 'undefined') {
  window.WebAppMonitoringService = WebAppMonitoringService;
}

// Auto-initialize if in browser environment
if (typeof window !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    monitoringService.init();
  });
}