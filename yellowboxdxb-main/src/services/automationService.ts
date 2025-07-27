/**
 * Automation Service for Yellow Box
 * Handles integration with n8n workflows and data synchronization
 */

import { httpsCallable } from 'firebase/functions';
import { functions } from '../config/firebase';

// n8n webhook configuration
const N8N_WEBHOOK_URL = import.meta.env.VITE_N8N_WEBHOOK_URL || '';
const WEBHOOK_SECRET = import.meta.env.VITE_N8N_WEBHOOK_SECRET || '';

export interface SyncPayload {
  type: 'rider' | 'expense' | 'document' | 'user' | 'manual_sync';
  id: string;
  action: 'created' | 'updated' | 'deleted' | 'manual_sync';
  data?: any;
  collection?: string;
  metadata?: Record<string, any>;
}

export interface AutomationStatus {
  success: boolean;
  message: string;
  timestamp: string;
  error?: string;
}

/**
 * Automation Service Class
 * Provides methods for triggering n8n workflows and managing data sync
 */
export class AutomationService {
  private static instance: AutomationService;
  
  private constructor() {}
  
  public static getInstance(): AutomationService {
    if (!AutomationService.instance) {
      AutomationService.instance = new AutomationService();
    }
    return AutomationService.instance;
  }
  
  /**
   * Trigger n8n webhook directly (fallback method)
   */
  private async triggerWebhook(payload: SyncPayload): Promise<AutomationStatus> {
    if (!N8N_WEBHOOK_URL) {
      console.warn('n8n webhook URL not configured');
      return {
        success: false,
        message: 'Webhook URL not configured',
        timestamp: new Date().toISOString(),
        error: 'Missing N8N_WEBHOOK_URL environment variable'
      };
    }
    
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      if (WEBHOOK_SECRET) {
        headers['X-Webhook-Secret'] = WEBHOOK_SECRET;
      }
      
      const response = await fetch(N8N_WEBHOOK_URL, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          ...payload,
          timestamp: new Date().toISOString(),
          source: 'yellow_box_app'
        })
      });
      
      if (response.ok) {
        return {
          success: true,
          message: 'Webhook triggered successfully',
          timestamp: new Date().toISOString()
        };
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Webhook trigger failed:', error);
      return {
        success: false,
        message: 'Failed to trigger webhook',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  /**
   * Sync rider data to n8n/Google Sheets
   */
  async syncRiderData(
    riderId: string, 
    action: 'created' | 'updated' | 'deleted', 
    riderData?: any
  ): Promise<AutomationStatus> {
    const payload: SyncPayload = {
      type: 'rider',
      id: riderId,
      action,
      data: riderData,
      collection: 'riders',
      metadata: riderData ? {
        name: riderData.name || 'Unknown',
        status: riderData.status || 'Unknown',
        email: riderData.email || 'No email'
      } : undefined
    };
    
    return await this.triggerWebhook(payload);
  }
  
  /**
   * Sync expense data to n8n/Google Sheets
   */
  async syncExpenseData(
    expenseId: string, 
    action: 'created' | 'updated' | 'deleted', 
    expenseData?: any
  ): Promise<AutomationStatus> {
    const payload: SyncPayload = {
      type: 'expense',
      id: expenseId,
      action,
      data: expenseData,
      collection: 'expenses',
      metadata: expenseData ? {
        riderId: expenseData.riderId || 'Unknown',
        amount: expenseData.amount || 0,
        category: expenseData.category || 'Unknown',
        status: expenseData.status || 'Unknown'
      } : undefined
    };
    
    return await this.triggerWebhook(payload);
  }
  
  /**
   * Sync document data to n8n/Google Sheets
   */
  async syncDocumentData(
    documentId: string, 
    action: 'created' | 'updated' | 'deleted', 
    documentData?: any
  ): Promise<AutomationStatus> {
    const payload: SyncPayload = {
      type: 'document',
      id: documentId,
      action,
      data: documentData,
      collection: 'documents',
      metadata: documentData ? {
        riderId: documentData.riderId || 'Unknown',
        type: documentData.type || 'Unknown',
        status: documentData.status || 'Unknown',
        expiryDate: documentData.expiryDate || null
      } : undefined
    };
    
    return await this.triggerWebhook(payload);
  }
  
  /**
   * Trigger manual sync for specific collection
   */
  async triggerManualSync(collection: string): Promise<AutomationStatus> {
    try {
      const manualSync = httpsCallable(functions, 'manualSync');
      const result = await manualSync({ collection, action: 'manual_sync' });
      
      return {
        success: true,
        message: `Manual sync triggered for ${collection}`,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Manual sync failed:', error);
      return {
        success: false,
        message: 'Failed to trigger manual sync',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  /**
   * Check application health status
   */
  async checkHealthStatus(): Promise<any> {
    try {
      const healthCheck = httpsCallable(functions, 'healthCheck');
      const result = await healthCheck();
      return result.data;
    } catch (error) {
      console.error('Health check failed:', error);
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  /**
   * Get automation status and statistics
   */
  async getAutomationStats(): Promise<{
    webhooksEnabled: boolean;
    lastSync: string | null;
    totalSyncs: number;
    failedSyncs: number;
  }> {
    // This would typically fetch from a monitoring collection
    // For now, return basic status
    return {
      webhooksEnabled: !!N8N_WEBHOOK_URL,
      lastSync: localStorage.getItem('lastAutomationSync'),
      totalSyncs: parseInt(localStorage.getItem('totalAutomationSyncs') || '0'),
      failedSyncs: parseInt(localStorage.getItem('failedAutomationSyncs') || '0')
    };
  }
  
  /**
   * Update automation statistics
   */
  private updateStats(success: boolean): void {
    const totalSyncs = parseInt(localStorage.getItem('totalAutomationSyncs') || '0') + 1;
    const failedSyncs = parseInt(localStorage.getItem('failedAutomationSyncs') || '0') + (success ? 0 : 1);
    
    localStorage.setItem('totalAutomationSyncs', totalSyncs.toString());
    localStorage.setItem('failedAutomationSyncs', failedSyncs.toString());
    localStorage.setItem('lastAutomationSync', new Date().toISOString());
  }
}

// Export singleton instance
export const automationService = AutomationService.getInstance();

/**
 * React Hook for automation status
 */
export const useAutomation = () => {
  const [status, setStatus] = React.useState<{
    isEnabled: boolean;
    lastSync: string | null;
    isLoading: boolean;
  }>({
    isEnabled: false,
    lastSync: null,
    isLoading: true
  });
  
  React.useEffect(() => {
    const checkStatus = async () => {
      try {
        const stats = await automationService.getAutomationStats();
        setStatus({
          isEnabled: stats.webhooksEnabled,
          lastSync: stats.lastSync,
          isLoading: false
        });
      } catch (error) {
        console.error('Failed to check automation status:', error);
        setStatus(prev => ({ ...prev, isLoading: false }));
      }
    };
    
    checkStatus();
  }, []);
  
  const triggerManualSync = async (collection: string) => {
    const result = await automationService.triggerManualSync(collection);
    if (result.success) {
      setStatus(prev => ({ ...prev, lastSync: result.timestamp }));
    }
    return result;
  };
  
  return {
    ...status,
    triggerManualSync,
    checkHealth: automationService.checkHealthStatus
  };
};

/**
 * Utility functions for integration with existing services
 */
export const withAutomation = <T extends (...args: any[]) => Promise<any>>(
  originalFunction: T,
  syncConfig: {
    type: 'rider' | 'expense' | 'document';
    action: 'created' | 'updated' | 'deleted';
    getIdFromResult?: (result: any) => string;
    getDataFromArgs?: (args: any[]) => any;
  }
): T => {
  return (async (...args: any[]) => {
    try {
      const result = await originalFunction(...args);
      
      // Trigger automation sync
      const id = syncConfig.getIdFromResult ? 
        syncConfig.getIdFromResult(result) : 
        result?.id || args[0];
      
      const data = syncConfig.getDataFromArgs ? 
        syncConfig.getDataFromArgs(args) : 
        args[0];
      
      // Async sync (don't wait for completion)
      switch (syncConfig.type) {
        case 'rider':
          automationService.syncRiderData(id, syncConfig.action, data);
          break;
        case 'expense':
          automationService.syncExpenseData(id, syncConfig.action, data);
          break;
        case 'document':
          automationService.syncDocumentData(id, syncConfig.action, data);
          break;
      }
      
      return result;
    } catch (error) {
      console.error('Function with automation failed:', error);
      throw error;
    }
  }) as T;
};

export default automationService;