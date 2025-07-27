import { db } from '@/config/firebase';
import { collection, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';

interface WebhookPayload {
  timestamp: string;
  source: string;
  type: string;
  data: any;
}

interface WebhookConfig {
  url: string;
  enabled: boolean;
  events: string[];
}

class WebhookService {
  private webhookUrl: string;
  private enabled: boolean;
  private logCollection = 'webhook_logs';

  constructor() {
    // Replace with your actual n8n webhook URL
    this.webhookUrl = import.meta.env.VITE_N8N_WEBHOOK_URL || 'https://n8n.srv924607.hstgr.cloud/webhook/YOUR_WEBHOOK_PATH';
    this.enabled = import.meta.env.VITE_WEBHOOK_ENABLED === 'true';
  }

  /**
   * Send data to n8n webhook
   */
  async sendToWebhook(eventType: string, eventData: any): Promise<void> {
    if (!this.enabled) {
      console.log('Webhook disabled, skipping:', eventType);
      return;
    }

    const payload: WebhookPayload = {
      timestamp: new Date().toISOString(),
      source: 'yellow-box',
      type: eventType,
      data: eventData
    };

    try {
      const response = await fetch(this.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      // Log webhook activity
      await this.logWebhookActivity({
        eventType,
        payload,
        success: response.ok,
        statusCode: response.status,
        timestamp: serverTimestamp()
      });

      if (!response.ok) {
        throw new Error(`Webhook failed: ${response.status}`);
      }

      console.log(`✅ Webhook sent: ${eventType}`);
    } catch (error) {
      console.error('❌ Webhook error:', error);
      
      // Log failed webhook
      await this.logWebhookActivity({
        eventType,
        payload,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: serverTimestamp()
      });
    }
  }

  /**
   * Log webhook activity to Firestore
   */
  private async logWebhookActivity(data: any): Promise<void> {
    try {
      await addDoc(collection(db, this.logCollection), data);
    } catch (error) {
      console.error('Failed to log webhook activity:', error);
    }
  }

  /**
   * Rider Events
   */
  async onRiderRegistered(riderId: string, riderData: any): Promise<void> {
    await this.sendToWebhook('rider.registered', {
      riderId,
      ...riderData,
      registeredAt: new Date().toISOString()
    });
  }

  async onRiderStatusChanged(riderId: string, oldStatus: string, newStatus: string): Promise<void> {
    await this.sendToWebhook('rider.status_changed', {
      riderId,
      oldStatus,
      newStatus,
      changedAt: new Date().toISOString()
    });
  }

  async onRiderDocumentUploaded(riderId: string, documentType: string): Promise<void> {
    await this.sendToWebhook('rider.document_uploaded', {
      riderId,
      documentType,
      uploadedAt: new Date().toISOString()
    });
  }

  /**
   * Expense Events
   */
  async onExpenseSubmitted(expenseId: string, expenseData: any): Promise<void> {
    await this.sendToWebhook('expense.submitted', {
      expenseId,
      ...expenseData,
      submittedAt: new Date().toISOString()
    });
  }

  async onExpenseApproved(expenseId: string, approvedBy: string): Promise<void> {
    await this.sendToWebhook('expense.approved', {
      expenseId,
      approvedBy,
      approvedAt: new Date().toISOString()
    });
  }

  async onExpenseRejected(expenseId: string, rejectedBy: string, reason: string): Promise<void> {
    await this.sendToWebhook('expense.rejected', {
      expenseId,
      rejectedBy,
      reason,
      rejectedAt: new Date().toISOString()
    });
  }

  /**
   * Bike Events
   */
  async onBikeAssigned(bikeId: string, riderId: string): Promise<void> {
    await this.sendToWebhook('bike.assigned', {
      bikeId,
      riderId,
      assignedAt: new Date().toISOString()
    });
  }

  async onBikeUnassigned(bikeId: string, riderId: string): Promise<void> {
    await this.sendToWebhook('bike.unassigned', {
      bikeId,
      riderId,
      unassignedAt: new Date().toISOString()
    });
  }

  async onBikeMaintenanceRequired(bikeId: string, issue: string): Promise<void> {
    await this.sendToWebhook('bike.maintenance_required', {
      bikeId,
      issue,
      reportedAt: new Date().toISOString()
    });
  }

  /**
   * Finance Events
   */
  async onBudgetAllocated(month: string, amount: number, allocatedBy: string): Promise<void> {
    await this.sendToWebhook('finance.budget_allocated', {
      month,
      amount,
      allocatedBy,
      allocatedAt: new Date().toISOString()
    });
  }

  /**
   * System Events
   */
  async onUserLoggedIn(userId: string, userRole: string): Promise<void> {
    await this.sendToWebhook('system.user_logged_in', {
      userId,
      userRole,
      loggedInAt: new Date().toISOString()
    });
  }

  async onCriticalError(error: string, context: any): Promise<void> {
    await this.sendToWebhook('system.critical_error', {
      error,
      context,
      occurredAt: new Date().toISOString()
    });
  }

  /**
   * Test webhook connection
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.sendToWebhook('system.test', {
        message: 'Testing webhook connection',
        timestamp: new Date().toISOString()
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Update webhook configuration
   */
  setWebhookUrl(url: string): void {
    this.webhookUrl = url;
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  getConfig(): WebhookConfig {
    return {
      url: this.webhookUrl,
      enabled: this.enabled,
      events: [
        'rider.registered',
        'rider.status_changed',
        'rider.document_uploaded',
        'expense.submitted',
        'expense.approved',
        'expense.rejected',
        'bike.assigned',
        'bike.unassigned',
        'bike.maintenance_required',
        'finance.budget_allocated',
        'system.user_logged_in',
        'system.critical_error'
      ]
    };
  }
}

// Export singleton instance
export const webhookService = new WebhookService();