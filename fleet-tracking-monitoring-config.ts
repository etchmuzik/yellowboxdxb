/**
 * Real-time Fleet Tracking Monitoring Configuration
 * Integrates with Yellow Box fleet management and monitoring systems
 */

import { BikeTrackerService, BikeLocation } from './yellowboxdxb-main/src/services/bikeTrackerService';
import { NotificationService } from './yellowboxdxb-main/src/services/notificationService';

interface FleetMonitoringConfig {
  geofencing: {
    enabled: boolean;
    zones: GeofenceZone[];
    alertRadius: number; // in meters
  };
  alerting: {
    offlineThreshold: number; // minutes
    lowBatteryThreshold: number; // percentage
    speedLimitThreshold: number; // km/h
    inactivityThreshold: number; // minutes
  };
  monitoring: {
    updateInterval: number; // milliseconds
    batchSize: number;
    retryAttempts: number;
  };
}

interface GeofenceZone {
  id: string;
  name: string;
  type: 'delivery' | 'restricted' | 'emergency';
  coordinates: {
    lat: number;
    lng: number;
  };
  radius: number; // meters
  active: boolean;
}

interface FleetAlert {
  id: string;
  riderId: string;
  riderName: string;
  type: 'geofence' | 'offline' | 'battery' | 'speed' | 'emergency' | 'inactivity';
  severity: 'info' | 'warning' | 'critical';
  message: string;
  location?: {
    lat: number;
    lng: number;
    district?: string;
  };
  timestamp: Date;
  acknowledged: boolean;
  resolvedAt?: Date;
}

export class FleetTrackingMonitoringService {
  private config: FleetMonitoringConfig;
  private activeAlerts: Map<string, FleetAlert> = new Map();
  private monitoringInterval?: NodeJS.Timeout;
  private webhookEndpoint = 'https://n8n.srv924607.hstgr.cloud/webhook/monitoring-webhook';

  constructor(config: FleetMonitoringConfig) {
    this.config = config;
    this.initializeDefaultConfig();
  }

  /**
   * Initialize with default Dubai fleet monitoring configuration
   */
  private initializeDefaultConfig(): void {
    this.config = {
      geofencing: {
        enabled: true,
        zones: [
          {
            id: 'downtown-delivery',
            name: 'Downtown Dubai Delivery Zone',
            type: 'delivery',
            coordinates: { lat: 25.1972, lng: 55.2744 },
            radius: 5000,
            active: true
          },
          {
            id: 'marina-delivery',
            name: 'Dubai Marina Delivery Zone',
            type: 'delivery',
            coordinates: { lat: 25.0701, lng: 55.1397 },
            radius: 3000,
            active: true
          },
          {
            id: 'deira-delivery',
            name: 'Deira Delivery Zone',
            type: 'delivery',
            coordinates: { lat: 25.2788, lng: 55.3242 },
            radius: 4000,
            active: true
          },
          {
            id: 'restricted-airport',
            name: 'Airport Restricted Zone',
            type: 'restricted',
            coordinates: { lat: 25.2532, lng: 55.3657 },
            radius: 2000,
            active: true
          }
        ],
        alertRadius: 500
      },
      alerting: {
        offlineThreshold: 15, // 15 minutes
        lowBatteryThreshold: 20, // 20%
        speedLimitThreshold: 80, // 80 km/h
        inactivityThreshold: 30 // 30 minutes
      },
      monitoring: {
        updateInterval: 30000, // 30 seconds
        batchSize: 50,
        retryAttempts: 3
      },
      ...this.config
    };
  }

  /**
   * Start fleet monitoring
   */
  async startMonitoring(): Promise<void> {
    console.log('🚚 Starting Fleet Tracking Monitoring...');

    // Subscribe to real-time location updates
    BikeTrackerService.subscribeToLocations((locations: BikeLocation[]) => {
      this.processLocationUpdates(locations);
    });

    // Start periodic monitoring checks
    this.startPeriodicChecks();

    console.log('✅ Fleet Tracking Monitoring started');
  }

  /**
   * Stop fleet monitoring
   */
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
    }
    console.log('⏹️ Fleet Tracking Monitoring stopped');
  }

  /**
   * Start periodic monitoring checks
   */
  private startPeriodicChecks(): void {
    this.monitoringInterval = setInterval(async () => {
      await this.performMonitoringChecks();
    }, this.config.monitoring.updateInterval);

    // Initial check
    this.performMonitoringChecks();
  }

  /**
   * Process real-time location updates
   */
  private async processLocationUpdates(locations: BikeLocation[]): Promise<void> {
    for (const location of locations) {
      await this.checkLocationAlerts(location);
    }

    // Send batch update to monitoring system
    await this.sendFleetStatusUpdate(locations);
  }

  /**
   * Check for location-based alerts
   */
  private async checkLocationAlerts(location: BikeLocation): Promise<void> {
    // Check geofencing alerts
    if (this.config.geofencing.enabled) {
      await this.checkGeofenceAlerts(location);
    }

    // Check offline status
    await this.checkOfflineAlert(location);

    // Check battery level
    await this.checkBatteryAlert(location);

    // Check speed violations
    await this.checkSpeedAlert(location);

    // Check inactivity
    await this.checkInactivityAlert(location);
  }

  /**
   * Check geofence violations
   */
  private async checkGeofenceAlerts(location: BikeLocation): Promise<void> {
    for (const zone of this.config.geofencing.zones) {
      if (!zone.active) continue;

      const distance = this.calculateDistance(
        location.latitude,
        location.longitude,
        zone.coordinates.lat,
        zone.coordinates.lng
      );

      const isInZone = distance <= zone.radius;
      const alertKey = `geofence-${zone.id}-${location.riderId}`;

      if (zone.type === 'restricted' && isInZone) {
        await this.createAlert({
          id: alertKey,
          riderId: location.riderId,
          riderName: location.riderName,
          type: 'geofence',
          severity: 'critical',
          message: `Rider entered restricted zone: ${zone.name}`,
          location: {
            lat: location.latitude,
            lng: location.longitude,
            district: location.district
          },
          timestamp: new Date(),
          acknowledged: false
        });
      } else if (zone.type === 'delivery' && !isInZone) {
        await this.createAlert({
          id: alertKey,
          riderId: location.riderId,
          riderName: location.riderName,
          type: 'geofence',
          severity: 'warning',
          message: `Rider outside delivery zone: ${zone.name}`,
          location: {
            lat: location.latitude,
            lng: location.longitude,
            district: location.district
          },
          timestamp: new Date(),
          acknowledged: false
        });
      }
    }
  }

  /**
   * Check offline status
   */
  private async checkOfflineAlert(location: BikeLocation): Promise<void> {
    const now = new Date();
    const lastUpdate = new Date(location.lastUpdate);
    const minutesOffline = (now.getTime() - lastUpdate.getTime()) / (1000 * 60);

    if (minutesOffline > this.config.alerting.offlineThreshold) {
      const alertKey = `offline-${location.riderId}`;
      
      await this.createAlert({
        id: alertKey,
        riderId: location.riderId,
        riderName: location.riderName,
        type: 'offline',
        severity: 'critical',
        message: `Rider offline for ${Math.round(minutesOffline)} minutes`,
        location: {
          lat: location.latitude,
          lng: location.longitude,
          district: location.district
        },
        timestamp: new Date(),
        acknowledged: false
      });
    }
  }

  /**
   * Check battery alerts
   */
  private async checkBatteryAlert(location: BikeLocation): Promise<void> {
    if (location.battery && location.battery < this.config.alerting.lowBatteryThreshold) {
      const alertKey = `battery-${location.riderId}`;
      
      await this.createAlert({
        id: alertKey,
        riderId: location.riderId,
        riderName: location.riderName,
        type: 'battery',
        severity: location.battery < 10 ? 'critical' : 'warning',
        message: `Low battery: ${location.battery}%`,
        location: {
          lat: location.latitude,
          lng: location.longitude,
          district: location.district
        },
        timestamp: new Date(),
        acknowledged: false
      });
    }
  }

  /**
   * Check speed violations
   */
  private async checkSpeedAlert(location: BikeLocation): Promise<void> {
    if (location.speed > this.config.alerting.speedLimitThreshold) {
      const alertKey = `speed-${location.riderId}`;
      
      await this.createAlert({
        id: alertKey,
        riderId: location.riderId,
        riderName: location.riderName,
        type: 'speed',
        severity: 'warning',
        message: `Speed violation: ${location.speed} km/h`,
        location: {
          lat: location.latitude,
          lng: location.longitude,
          district: location.district
        },
        timestamp: new Date(),
        acknowledged: false
      });
    }
  }

  /**
   * Check inactivity
   */
  private async checkInactivityAlert(location: BikeLocation): Promise<void> {
    if (location.status === 'Idle') {
      const now = new Date();
      const lastUpdate = new Date(location.lastUpdate);
      const minutesInactive = (now.getTime() - lastUpdate.getTime()) / (1000 * 60);

      if (minutesInactive > this.config.alerting.inactivityThreshold) {
        const alertKey = `inactivity-${location.riderId}`;
        
        await this.createAlert({
          id: alertKey,
          riderId: location.riderId,
          riderName: location.riderName,
          type: 'inactivity',
          severity: 'info',
          message: `Rider inactive for ${Math.round(minutesInactive)} minutes`,
          location: {
            lat: location.latitude,
            lng: location.longitude,
            district: location.district
          },
          timestamp: new Date(),
          acknowledged: false
        });
      }
    }
  }

  /**
   * Create and manage alert
   */
  private async createAlert(alert: FleetAlert): Promise<void> {
    const existingAlert = this.activeAlerts.get(alert.id);
    
    // Don't create duplicate alerts within 5 minutes
    if (existingAlert && 
        (Date.now() - existingAlert.timestamp.getTime()) < 5 * 60 * 1000) {
      return;
    }

    this.activeAlerts.set(alert.id, alert);

    // Send notifications based on severity
    await this.sendAlertNotification(alert);

    // Send to monitoring system
    await this.sendAlertToMonitoring(alert);

    console.log(`🚨 Fleet Alert: ${alert.type} - ${alert.message}`);
  }

  /**
   * Send alert notification
   */
  private async sendAlertNotification(alert: FleetAlert): Promise<void> {
    try {
      const roles = alert.severity === 'critical' 
        ? ['Admin', 'Operations'] 
        : ['Operations'];

      await NotificationService.sendToRoles(roles, {
        type: 'system',
        title: `Fleet Alert: ${alert.type.toUpperCase()}`,
        message: alert.message,
        actionUrl: `/bike-tracker?highlight=${alert.riderId}`,
        metadata: {
          alertId: alert.id,
          riderId: alert.riderId,
          severity: alert.severity,
          location: alert.location
        }
      });
    } catch (error) {
      console.error('Failed to send alert notification:', error);
    }
  }

  /**
   * Send alert to monitoring system
   */
  private async sendAlertToMonitoring(alert: FleetAlert): Promise<void> {
    try {
      const response = await fetch(this.webhookEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          operation: 'fleet_alert',
          data: alert,
          timestamp: new Date().toISOString()
        })
      });

      if (!response.ok) {
        console.error('Failed to send alert to monitoring system:', response.status);
      }
    } catch (error) {
      console.error('Error sending alert to monitoring system:', error);
    }
  }

  /**
   * Send fleet status update
   */
  private async sendFleetStatusUpdate(locations: BikeLocation[]): Promise<void> {
    try {
      const fleetStatus = {
        timestamp: new Date().toISOString(),
        totalRiders: locations.length,
        activeRiders: locations.filter(l => l.status === 'Active').length,
        idleRiders: locations.filter(l => l.status === 'Idle').length,
        offlineRiders: locations.filter(l => l.status === 'Offline').length,
        averageSpeed: this.calculateAverageSpeed(locations),
        locations: locations.map(l => ({
          riderId: l.riderId,
          lat: l.latitude,
          lng: l.longitude,
          status: l.status,
          speed: l.speed,
          battery: l.battery,
          district: l.district,
          lastUpdate: l.lastUpdate
        }))
      };

      const response = await fetch(this.webhookEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          operation: 'fleet_status_update',
          data: fleetStatus,
          timestamp: new Date().toISOString()
        })
      });

      if (!response.ok) {
        console.error('Failed to send fleet status update:', response.status);
      }
    } catch (error) {
      console.error('Error sending fleet status update:', error);
    }
  }

  /**
   * Perform periodic monitoring checks
   */
  private async performMonitoringChecks(): Promise<void> {
    try {
      // Check for stale alerts to clear
      await this.clearStaleAlerts();

      // Generate fleet health metrics
      await this.generateFleetMetrics();

      console.log('📊 Periodic fleet monitoring check completed');
    } catch (error) {
      console.error('Error in periodic monitoring checks:', error);
    }
  }

  /**
   * Clear stale alerts
   */
  private async clearStaleAlerts(): Promise<void> {
    const now = Date.now();
    const staleThreshold = 30 * 60 * 1000; // 30 minutes

    for (const [alertId, alert] of this.activeAlerts.entries()) {
      if (now - alert.timestamp.getTime() > staleThreshold) {
        this.activeAlerts.delete(alertId);
      }
    }
  }

  /**
   * Generate fleet metrics
   */
  private async generateFleetMetrics(): Promise<void> {
    const metrics = {
      timestamp: new Date().toISOString(),
      activeAlerts: this.activeAlerts.size,
      alertsByType: this.getAlertsByType(),
      alertsBySeverity: this.getAlertsBySeverity()
    };

    // Send metrics to monitoring system
    await this.sendFleetMetrics(metrics);
  }

  /**
   * Get alerts by type
   */
  private getAlertsByType(): Record<string, number> {
    const alertsByType: Record<string, number> = {};
    
    for (const alert of this.activeAlerts.values()) {
      alertsByType[alert.type] = (alertsByType[alert.type] || 0) + 1;
    }

    return alertsByType;
  }

  /**
   * Get alerts by severity
   */
  private getAlertsBySeverity(): Record<string, number> {
    const alertsBySeverity: Record<string, number> = {};
    
    for (const alert of this.activeAlerts.values()) {
      alertsBySeverity[alert.severity] = (alertsBySeverity[alert.severity] || 0) + 1;
    }

    return alertsBySeverity;
  }

  /**
   * Send fleet metrics
   */
  private async sendFleetMetrics(metrics: any): Promise<void> {
    try {
      const response = await fetch(this.webhookEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          operation: 'fleet_metrics',
          data: metrics,
          timestamp: new Date().toISOString()
        })
      });

      if (!response.ok) {
        console.error('Failed to send fleet metrics:', response.status);
      }
    } catch (error) {
      console.error('Error sending fleet metrics:', error);
    }
  }

  /**
   * Calculate distance between two coordinates (Haversine formula)
   */
  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lng2 - lng1) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
  }

  /**
   * Calculate average speed
   */
  private calculateAverageSpeed(locations: BikeLocation[]): number {
    const activeLocations = locations.filter(l => l.status === 'Active' && l.speed > 0);
    if (activeLocations.length === 0) return 0;

    const totalSpeed = activeLocations.reduce((sum, l) => sum + l.speed, 0);
    return Math.round(totalSpeed / activeLocations.length);
  }

  /**
   * Get active alerts
   */
  getActiveAlerts(): FleetAlert[] {
    return Array.from(this.activeAlerts.values());
  }

  /**
   * Acknowledge alert
   */
  async acknowledgeAlert(alertId: string): Promise<boolean> {
    const alert = this.activeAlerts.get(alertId);
    if (alert) {
      alert.acknowledged = true;
      return true;
    }
    return false;
  }

  /**
   * Resolve alert
   */
  async resolveAlert(alertId: string): Promise<boolean> {
    const alert = this.activeAlerts.get(alertId);
    if (alert) {
      alert.resolvedAt = new Date();
      this.activeAlerts.delete(alertId);
      return true;
    }
    return false;
  }
}

// Export types and service
export { FleetMonitoringConfig, GeofenceZone, FleetAlert };
export default FleetTrackingMonitoringService;