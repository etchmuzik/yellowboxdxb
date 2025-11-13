import { supabase } from '../../config/supabase';
import { User } from '../../types';

interface NotificationData {
  type: 'expense' | 'document' | 'rider' | 'system';
  title: string;
  message: string;
  userId: string;
  metadata?: Record<string, any>;
  actionUrl?: string;
}

export class NotificationSupabaseService {
  // Send notification to a specific user
  static async sendToUser(userId: string, notification: Omit<NotificationData, 'userId'>): Promise<void> {
    try {
      await supabase
        .from('notifications')
        .insert([{
          ...notification,
          user_id: userId,
          read: false,
          timestamp: new Date().toISOString(),
          created_at: new Date().toISOString()
        }]);
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  }

  // Send notification to users with specific roles
  static async sendToRole(role: User['role'], notification: Omit<NotificationData, 'userId'>): Promise<void> {
    try {
      // Get all users with the specified role
      const { data: users, error } = await supabase
        .from('users')
        .select('id')
        .eq('role', role);

      if (error) {
        console.error('Error fetching users by role:', error);
        return;
      }

      // Send notification to each user
      const promises = (users || []).map(user =>
        this.sendToUser(user.id, notification)
      );

      await Promise.all(promises);
    } catch (error) {
      console.error('Error sending notifications to role:', error);
    }
  }

  // Send notification to multiple roles
  static async sendToRoles(roles: User['role'][], notification: Omit<NotificationData, 'userId'>): Promise<void> {
    try {
      const promises = roles.map(role => this.sendToRole(role, notification));
      await Promise.all(promises);
    } catch (error) {
      console.error('Error sending notifications to roles:', error);
    }
  }

  // Expense-related notifications
  static async notifyExpenseSubmitted(expenseId: string, riderId: string, amount: number): Promise<void> {
    await this.sendToRole('Finance', {
      type: 'expense',
      title: 'New Expense Submitted',
      message: `A new expense of AED ${amount} has been submitted and requires approval`,
      metadata: { expenseId, riderId, amount },
      actionUrl: `/expenses/${expenseId}`
    });
  }

  static async notifyExpenseApproved(expenseId: string, riderId: string, amount: number): Promise<void> {
    await this.sendToUser(riderId, {
      type: 'expense',
      title: 'Expense Approved',
      message: `Your expense of AED ${amount} has been approved`,
      metadata: { expenseId, amount },
      actionUrl: `/expenses/${expenseId}`
    });
  }

  static async notifyExpenseRejected(expenseId: string, riderId: string, amount: number, reason: string): Promise<void> {
    await this.sendToUser(riderId, {
      type: 'expense',
      title: 'Expense Rejected',
      message: `Your expense of AED ${amount} has been rejected. Reason: ${reason}`,
      metadata: { expenseId, amount, reason },
      actionUrl: `/expenses/${expenseId}`
    });
  }

  // Document-related notifications
  static async notifyDocumentUploaded(documentId: string, riderId: string, documentType: string): Promise<void> {
    await this.sendToRole('Operations', {
      type: 'document',
      title: 'New Document Uploaded',
      message: `A new ${documentType} document has been uploaded and requires verification`,
      metadata: { documentId, riderId, documentType },
      actionUrl: `/documents/${documentId}`
    });
  }

  static async notifyDocumentVerified(documentId: string, riderId: string, documentType: string): Promise<void> {
    await this.sendToUser(riderId, {
      type: 'document',
      title: 'Document Verified',
      message: `Your ${documentType} document has been verified`,
      metadata: { documentId, documentType },
      actionUrl: `/documents`
    });
  }

  static async notifyDocumentRejected(documentId: string, riderId: string, documentType: string, reason: string): Promise<void> {
    await this.sendToUser(riderId, {
      type: 'document',
      title: 'Document Rejected',
      message: `Your ${documentType} document has been rejected. Reason: ${reason}`,
      metadata: { documentId, documentType, reason },
      actionUrl: `/documents`
    });
  }

  // Rider-related notifications
  static async notifyRiderStageChange(riderId: string, newStage: string, oldStage: string): Promise<void> {
    await this.sendToUser(riderId, {
      type: 'rider',
      title: 'Application Status Updated',
      message: `Your application stage has been updated from "${oldStage}" to "${newStage}"`,
      metadata: { riderId, newStage, oldStage },
      actionUrl: `/profile`
    });
  }

  static async notifyBikeAssigned(riderId: string, bikeId: string, bikeNumber: string): Promise<void> {
    await this.sendToUser(riderId, {
      type: 'rider',
      title: 'Bike Assigned',
      message: `Bike ${bikeNumber} has been assigned to you`,
      metadata: { riderId, bikeId, bikeNumber },
      actionUrl: `/profile`
    });
  }

  // System notifications
  static async notifySystemMaintenance(message: string): Promise<void> {
    await this.sendToRoles(['Admin', 'Operations', 'Finance'], {
      type: 'system',
      title: 'System Maintenance',
      message,
      metadata: {}
    });
  }

  // Get notifications for a user
  static async getUserNotifications(userId: string, limit: number = 50): Promise<any[]> {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }

    return data || [];
  }

  // Mark notification as read
  static async markAsRead(notificationId: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId);

    if (error) {
      console.error('Error marking notification as read:', error);
    }
  }

  // Mark all notifications as read for a user
  static async markAllAsRead(userId: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId)
      .eq('read', false);

    if (error) {
      console.error('Error marking all notifications as read:', error);
    }
  }
}
