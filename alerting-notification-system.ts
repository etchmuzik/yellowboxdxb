/**
 * Comprehensive Alerting and Notification System
 * Handles multi-channel alerts for Yellow Box monitoring
 */

import { NotificationService } from './yellowboxdxb-main/src/services/notificationService';

interface AlertChannel {
  type: 'email' | 'sms' | 'webhook' | 'slack' | 'teams' | 'push';
  enabled: boolean;
  config: Record<string, any>;
  priority: number; // 1-5, 1 being highest
}

interface AlertRule {
  id: string;
  name: string;
  description: string;
  condition: AlertCondition;
  severity: 'info' | 'warning' | 'critical';
  channels: string[]; // Channel IDs
  throttle: number; // Minutes between repeated alerts
  enabled: boolean;
}

interface AlertCondition {
  metric: string;
  operator: '>' | '<' | '==' | '!=' | '>=' | '<=';
  value: number | string;
  timeWindow?: number; // Minutes
}

interface Alert {
  id: string;
  ruleId: string;
  severity: 'info' | 'warning' | 'critical';
  title: string;
  message: string;
  timestamp: Date;
  data: Record<string, any>;
  acknowledged: boolean;
  resolved: boolean;
  acknowledgedBy?: string;
  resolvedBy?: string;
  acknowledgedAt?: Date;
  resolvedAt?: Date;
}

export class AlertingNotificationSystem {
  private channels: Map<string, AlertChannel> = new Map();
  private rules: Map<string, AlertRule> = new Map();
  private activeAlerts: Map<string, Alert> = new Map();
  private alertHistory: Alert[] = [];
  private throttleTracker: Map<string, Date> = new Map();

  constructor() {
    this.initializeDefaultChannels();
    this.initializeDefaultRules();
  }

  /**
   * Initialize default notification channels
   */
  private initializeDefaultChannels(): void {
    // Email channel
    this.channels.set('email-ops', {
      type: 'email',
      enabled: true,
      config: {
        recipients: ['operations@yellowbox.ae', 'alerts@yellowbox.ae'],
        smtpServer: 'smtp.gmail.com',
        port: 587,
        secure: true,
        template: 'alert-template'
      },
      priority: 2
    });

    // SMS channel for critical alerts
    this.channels.set('sms-critical', {
      type: 'sms',
      enabled: true,
      config: {
        provider: 'twilio',
        numbers: ['+971501234567', '+971509876543'],
        apiKey: 'TWILIO_API_KEY_PLACEHOLDER'
      },
      priority: 1
    });

    // Webhook to N8N monitoring system
    this.channels.set('webhook-n8n', {
      type: 'webhook',
      enabled: true,
      config: {
        url: 'https://n8n.srv924607.hstgr.cloud/webhook/monitoring-webhook',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer N8N_WEBHOOK_TOKEN'
        }
      },
      priority: 1
    });

    // Slack integration
    this.channels.set('slack-alerts', {
      type: 'slack',
      enabled: true,
      config: {
        webhookUrl: 'https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK',
        channel: '#yellowbox-alerts',
        username: 'YellowBox Monitor'
      },
      priority: 2
    });

    // Microsoft Teams
    this.channels.set('teams-alerts', {
      type: 'teams',
      enabled: false,
      config: {
        webhookUrl: 'https://outlook.office.com/webhook/YOUR/TEAMS/WEBHOOK'
      },
      priority: 3
    });

    // Push notifications
    this.channels.set('push-mobile', {
      type: 'push',
      enabled: true,
      config: {
        fcmServerKey: 'FCM_SERVER_KEY_PLACEHOLDER',
        topics: ['yellowbox-alerts', 'fleet-monitoring']
      },
      priority: 2
    });
  }

  /**
   * Initialize default alert rules
   */
  private initializeDefaultRules(): void {
    // Web app health alerts
    this.rules.set('web-app-critical', {
      id: 'web-app-critical',
      name: 'Web App Critical Error',
      description: 'Web application is returning 5xx errors or is offline',
      condition: {
        metric: 'web_app_status_code',
        operator: '>=',
        value: 500
      },
      severity: 'critical',
      channels: ['email-ops', 'sms-critical', 'webhook-n8n', 'slack-alerts'],
      throttle: 5,
      enabled: true
    });

    this.rules.set('web-app-slow', {
      id: 'web-app-slow',
      name: 'Web App Performance Degradation',
      description: 'Web application response time is unusually high',
      condition: {
        metric: 'web_app_response_time',
        operator: '>',
        value: 10000,
        timeWindow: 5
      },
      severity: 'warning',
      channels: ['email-ops', 'webhook-n8n', 'slack-alerts'],
      throttle: 15,
      enabled: true
    });

    // Fleet tracking alerts
    this.rules.set('rider-offline', {
      id: 'rider-offline',
      name: 'Rider Offline',
      description: 'Rider has been offline for extended period',
      condition: {
        metric: 'rider_offline_minutes',
        operator: '>',
        value: 15
      },
      severity: 'warning',
      channels: ['email-ops', 'webhook-n8n', 'push-mobile'],
      throttle: 30,
      enabled: true
    });

    this.rules.set('emergency-geofence', {
      id: 'emergency-geofence',
      name: 'Emergency Geofence Violation',
      description: 'Rider entered restricted or emergency zone',
      condition: {
        metric: 'geofence_violation',
        operator: '==',
        value: 'restricted'
      },
      severity: 'critical',
      channels: ['email-ops', 'sms-critical', 'webhook-n8n', 'slack-alerts'],
      throttle: 0, // No throttling for emergency alerts
      enabled: true
    });

    // System health alerts
    this.rules.set('firebase-connectivity', {
      id: 'firebase-connectivity',
      name: 'Firebase Connectivity Issue',
      description: 'Firebase services are experiencing connectivity issues',
      condition: {
        metric: 'firebase_status',
        operator: '!=',
        value: 'healthy'
      },
      severity: 'critical',
      channels: ['email-ops', 'webhook-n8n', 'slack-alerts'],
      throttle: 10,
      enabled: true
    });

    this.rules.set('n8n-webhook-failure', {
      id: 'n8n-webhook-failure',
      name: 'N8N Webhook Failure',
      description: 'N8N webhook endpoint is not responding',
      condition: {
        metric: 'webhook_status_code',
        operator: '!=',
        value: 200
      },
      severity: 'warning',
      channels: ['email-ops', 'slack-alerts'],
      throttle: 20,
      enabled: true
    });
  }

  /**
   * Process monitoring data and trigger alerts
   */
  async processMonitoringData(data: Record<string, any>): Promise<void> {
    for (const [ruleId, rule] of this.rules.entries()) {
      if (!rule.enabled) continue;

      const shouldAlert = await this.evaluateRule(rule, data);
      if (shouldAlert) {
        await this.triggerAlert(rule, data);
      }
    }
  }

  /**
   * Evaluate alert rule against monitoring data
   */
  private async evaluateRule(rule: AlertRule, data: Record<string, any>): Promise<boolean> {
    const { condition } = rule;
    const metricValue = this.extractMetricValue(condition.metric, data);

    if (metricValue === undefined) {
      return false;
    }

    // Check throttling
    const lastAlertTime = this.throttleTracker.get(rule.id);
    if (lastAlertTime && rule.throttle > 0) {
      const minutesSinceLastAlert = (Date.now() - lastAlertTime.getTime()) / (1000 * 60);
      if (minutesSinceLastAlert < rule.throttle) {
        return false;
      }
    }

    // Evaluate condition
    return this.evaluateCondition(condition, metricValue);
  }

  /**
   * Extract metric value from monitoring data
   */
  private extractMetricValue(metric: string, data: Record<string, any>): any {
    const keys = metric.split('.');
    let value = data;

    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = value[key];
      } else {
        return undefined;
      }
    }

    return value;
  }

  /**
   * Evaluate condition against value
   */
  private evaluateCondition(condition: AlertCondition, value: any): boolean {
    const { operator, value: expectedValue } = condition;

    switch (operator) {
      case '>':
        return Number(value) > Number(expectedValue);
      case '<':
        return Number(value) < Number(expectedValue);
      case '>=':
        return Number(value) >= Number(expectedValue);
      case '<=':
        return Number(value) <= Number(expectedValue);
      case '==':
        return value === expectedValue;
      case '!=':
        return value !== expectedValue;
      default:
        return false;
    }
  }

  /**
   * Trigger alert
   */
  private async triggerAlert(rule: AlertRule, data: Record<string, any>): Promise<void> {
    const alert: Alert = {
      id: `${rule.id}-${Date.now()}`,
      ruleId: rule.id,
      severity: rule.severity,
      title: rule.name,
      message: this.generateAlertMessage(rule, data),
      timestamp: new Date(),
      data,
      acknowledged: false,
      resolved: false
    };

    // Store alert
    this.activeAlerts.set(alert.id, alert);
    this.alertHistory.push(alert);

    // Update throttle tracker
    this.throttleTracker.set(rule.id, new Date());

    // Send notifications
    await this.sendNotifications(alert, rule.channels);

    console.log(`🚨 Alert triggered: ${alert.title} (${alert.severity})`);
  }

  /**
   * Generate alert message
   */
  private generateAlertMessage(rule: AlertRule, data: Record<string, any>): string {
    const { condition } = rule;
    const metricValue = this.extractMetricValue(condition.metric, data);
    
    let message = `${rule.description}\n\n`;
    message += `Condition: ${condition.metric} ${condition.operator} ${condition.value}\n`;
    message += `Current Value: ${metricValue}\n`;
    message += `Timestamp: ${new Date().toISOString()}\n`;

    // Add relevant context data
    if (data.target) {
      message += `Target: ${data.target}\n`;
    }
    if (data.url) {
      message += `URL: ${data.url}\n`;
    }
    if (data.riderId) {
      message += `Rider ID: ${data.riderId}\n`;
    }
    if (data.location) {
      message += `Location: ${data.location.district || 'Unknown'}\n`;
    }

    return message;
  }

  /**
   * Send notifications through specified channels
   */
  private async sendNotifications(alert: Alert, channelIds: string[]): Promise<void> {
    const channels = channelIds
      .map(id => ({ id, channel: this.channels.get(id) }))
      .filter(c => c.channel && c.channel.enabled)
      .sort((a, b) => a.channel!.priority - b.channel!.priority);

    for (const { id, channel } of channels) {
      try {
        await this.sendNotificationToChannel(alert, channel!);
        console.log(`📤 Notification sent via ${channel!.type} (${id})`);
      } catch (error) {
        console.error(`❌ Failed to send notification via ${channel!.type} (${id}):`, error);
      }
    }
  }

  /**
   * Send notification to specific channel
   */
  private async sendNotificationToChannel(alert: Alert, channel: AlertChannel): Promise<void> {
    switch (channel.type) {
      case 'email':
        await this.sendEmailNotification(alert, channel);
        break;
      case 'sms':
        await this.sendSMSNotification(alert, channel);
        break;
      case 'webhook':
        await this.sendWebhookNotification(alert, channel);
        break;
      case 'slack':
        await this.sendSlackNotification(alert, channel);
        break;
      case 'teams':
        await this.sendTeamsNotification(alert, channel);
        break;
      case 'push':
        await this.sendPushNotification(alert, channel);
        break;
      default:
        console.warn(`Unknown channel type: ${channel.type}`);
    }
  }

  /**
   * Send email notification
   */
  private async sendEmailNotification(alert: Alert, channel: AlertChannel): Promise<void> {
    // Integration with email service (e.g., SendGrid, SMTP)
    const emailData = {
      to: channel.config.recipients,
      subject: `${alert.severity.toUpperCase()}: ${alert.title}`,
      html: this.generateEmailHTML(alert),
      text: alert.message
    };

    // This would integrate with your email service
    console.log('📧 Email notification prepared:', emailData);
  }

  /**
   * Send SMS notification
   */
  private async sendSMSNotification(alert: Alert, channel: AlertChannel): Promise<void> {
    // Integration with SMS service (e.g., Twilio)
    const smsData = {
      to: channel.config.numbers,
      body: `${alert.severity.toUpperCase()}: ${alert.title}\n${alert.message.substring(0, 150)}...`
    };

    // This would integrate with your SMS service
    console.log('📱 SMS notification prepared:', smsData);
  }

  /**
   * Send webhook notification
   */
  private async sendWebhookNotification(alert: Alert, channel: AlertChannel): Promise<void> {
    const payload = {
      operation: 'alert_notification',
      alert: {
        id: alert.id,
        severity: alert.severity,
        title: alert.title,
        message: alert.message,
        timestamp: alert.timestamp.toISOString(),
        data: alert.data
      },
      timestamp: new Date().toISOString()
    };

    const response = await fetch(channel.config.url, {
      method: channel.config.method || 'POST',
      headers: channel.config.headers || {},
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Webhook failed with status: ${response.status}`);
    }
  }

  /**
   * Send Slack notification
   */
  private async sendSlackNotification(alert: Alert, channel: AlertChannel): Promise<void> {
    const color = {
      'info': '#36a64f',
      'warning': '#ff9500',
      'critical': '#ff0000'
    }[alert.severity];

    const slackPayload = {
      channel: channel.config.channel,
      username: channel.config.username,
      attachments: [{
        color,
        title: alert.title,
        text: alert.message,
        fields: [
          {
            title: 'Severity',
            value: alert.severity.toUpperCase(),
            short: true
          },
          {
            title: 'Timestamp',
            value: alert.timestamp.toISOString(),
            short: true
          }
        ],
        footer: 'Yellow Box Monitoring',
        ts: Math.floor(alert.timestamp.getTime() / 1000)
      }]
    };

    const response = await fetch(channel.config.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(slackPayload)
    });

    if (!response.ok) {
      throw new Error(`Slack notification failed with status: ${response.status}`);
    }
  }

  /**
   * Send Teams notification
   */
  private async sendTeamsNotification(alert: Alert, channel: AlertChannel): Promise<void> {
    const teamsPayload = {
      '@type': 'MessageCard',
      '@context': 'http://schema.org/extensions',
      themeColor: {
        'info': '0076D7',
        'warning': 'FF8C00',
        'critical': 'FF0000'
      }[alert.severity],
      summary: alert.title,
      sections: [{
        activityTitle: alert.title,
        activitySubtitle: `Severity: ${alert.severity.toUpperCase()}`,
        activityImage: 'https://example.com/yellowbox-icon.png',
        text: alert.message,
        facts: [
          { name: 'Timestamp', value: alert.timestamp.toISOString() },
          { name: 'Alert ID', value: alert.id }
        ]
      }]
    };

    const response = await fetch(channel.config.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(teamsPayload)
    });

    if (!response.ok) {
      throw new Error(`Teams notification failed with status: ${response.status}`);
    }
  }

  /**
   * Send push notification
   */
  private async sendPushNotification(alert: Alert, channel: AlertChannel): Promise<void> {
    // Integration with Firebase Cloud Messaging
    const pushData = {
      notification: {
        title: alert.title,
        body: alert.message.substring(0, 100),
        icon: '/icons/alert-icon.png',
        badge: '/icons/badge-icon.png'
      },
      data: {
        alertId: alert.id,
        severity: alert.severity,
        timestamp: alert.timestamp.toISOString()
      },
      topics: channel.config.topics
    };

    // This would integrate with FCM
    console.log('📲 Push notification prepared:', pushData);
  }

  /**
   * Generate email HTML template
   */
  private generateEmailHTML(alert: Alert): string {
    const severityColor = {
      'info': '#2196F3',
      'warning': '#FF9800',
      'critical': '#F44336'
    }[alert.severity];

    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: ${severityColor}; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">${alert.severity.toUpperCase()} ALERT</h1>
        </div>
        <div style="padding: 20px; background-color: #f5f5f5;">
          <h2 style="color: #333; margin-top: 0;">${alert.title}</h2>
          <div style="background-color: white; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <pre style="white-space: pre-wrap; font-family: Arial, sans-serif;">${alert.message}</pre>
          </div>
          <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666;">
            <p>Alert ID: ${alert.id}</p>
            <p>Timestamp: ${alert.timestamp.toISOString()}</p>
            <p>This is an automated alert from Yellow Box Monitoring System.</p>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Acknowledge alert
   */
  async acknowledgeAlert(alertId: string, acknowledgedBy: string): Promise<boolean> {
    const alert = this.activeAlerts.get(alertId);
    if (alert && !alert.acknowledged) {
      alert.acknowledged = true;
      alert.acknowledgedBy = acknowledgedBy;
      alert.acknowledgedAt = new Date();

      // Send acknowledgment notification
      await this.sendAcknowledgmentNotification(alert);
      
      console.log(`✅ Alert acknowledged: ${alertId} by ${acknowledgedBy}`);
      return true;
    }
    return false;
  }

  /**
   * Resolve alert
   */
  async resolveAlert(alertId: string, resolvedBy: string): Promise<boolean> {
    const alert = this.activeAlerts.get(alertId);
    if (alert) {
      alert.resolved = true;
      alert.resolvedBy = resolvedBy;
      alert.resolvedAt = new Date();

      // Remove from active alerts
      this.activeAlerts.delete(alertId);

      // Send resolution notification
      await this.sendResolutionNotification(alert);
      
      console.log(`🔧 Alert resolved: ${alertId} by ${resolvedBy}`);
      return true;
    }
    return false;
  }

  /**
   * Send acknowledgment notification
   */
  private async sendAcknowledgmentNotification(alert: Alert): Promise<void> {
    // Send low-priority notification about acknowledgment
    const notification = {
      title: `Alert Acknowledged: ${alert.title}`,
      message: `Alert ${alert.id} has been acknowledged by ${alert.acknowledgedBy}`,
      severity: 'info' as const
    };

    // Use webhook channel for tracking
    const webhookChannel = this.channels.get('webhook-n8n');
    if (webhookChannel) {
      await this.sendWebhookNotification({
        ...alert,
        title: notification.title,
        message: notification.message,
        severity: notification.severity
      }, webhookChannel);
    }
  }

  /**
   * Send resolution notification
   */
  private async sendResolutionNotification(alert: Alert): Promise<void> {
    // Send low-priority notification about resolution
    const notification = {
      title: `Alert Resolved: ${alert.title}`,
      message: `Alert ${alert.id} has been resolved by ${alert.resolvedBy}`,
      severity: 'info' as const
    };

    // Use webhook channel for tracking
    const webhookChannel = this.channels.get('webhook-n8n');
    if (webhookChannel) {
      await this.sendWebhookNotification({
        ...alert,
        title: notification.title,
        message: notification.message,
        severity: notification.severity
      }, webhookChannel);
    }
  }

  /**
   * Get active alerts
   */
  getActiveAlerts(): Alert[] {
    return Array.from(this.activeAlerts.values()).sort((a, b) => 
      b.timestamp.getTime() - a.timestamp.getTime()
    );
  }

  /**
   * Get alert history
   */
  getAlertHistory(limit: number = 100): Alert[] {
    return this.alertHistory
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  /**
   * Get alert statistics
   */
  getAlertStatistics(): Record<string, number> {
    const stats = {
      total: this.alertHistory.length,
      active: this.activeAlerts.size,
      acknowledged: 0,
      resolved: 0,
      critical: 0,
      warning: 0,
      info: 0
    };

    for (const alert of this.alertHistory) {
      if (alert.acknowledged) stats.acknowledged++;
      if (alert.resolved) stats.resolved++;
      stats[alert.severity]++;
    }

    return stats;
  }

  /**
   * Add custom alert rule
   */
  addAlertRule(rule: AlertRule): void {
    this.rules.set(rule.id, rule);
  }

  /**
   * Remove alert rule
   */
  removeAlertRule(ruleId: string): boolean {
    return this.rules.delete(ruleId);
  }

  /**
   * Add notification channel
   */
  addNotificationChannel(id: string, channel: AlertChannel): void {
    this.channels.set(id, channel);
  }

  /**
   * Remove notification channel
   */
  removeNotificationChannel(id: string): boolean {
    return this.channels.delete(id);
  }
}

// Export types and service
export { AlertChannel, AlertRule, AlertCondition, Alert };
export default AlertingNotificationSystem;