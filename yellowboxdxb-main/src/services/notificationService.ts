import { collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { User } from '@/types';

interface NotificationData {
  type: 'expense' | 'document' | 'rider' | 'system';
  title: string;
  message: string;
  userId: string;
  metadata?: Record<string, any>;
  actionUrl?: string;
}

export class NotificationService {
  // Send notification to a specific user
  static async sendToUser(userId: string, notification: Omit<NotificationData, 'userId'>): Promise<void> {
    try {
      await addDoc(collection(db, 'notifications'), {
        ...notification,
        userId,
        read: false,
        timestamp: serverTimestamp(),
        createdAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  }

  // Send notification to users with specific roles
  static async sendToRole(role: User['role'], notification: Omit<NotificationData, 'userId'>): Promise<void> {
    try {
      // Get all users with the specified role
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('role', '==', role));
      const snapshot = await getDocs(q);

      // Send notification to each user
      const promises = snapshot.docs.map(doc => 
        this.sendToUser(doc.id, notification)
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
    // Notify Finance team
    await this.sendToRole('Finance', {
      type: 'expense',
      title: 'New Expense Submitted',
      message: `A new expense of AED ${amount} has been submitted for approval.`,
      actionUrl: `/expenses?highlight=${expenseId}`,
      metadata: { expenseId, riderId, amount }
    });
  }

  static async notifyExpenseApproved(expenseId: string, riderId: string, amount: number): Promise<void> {
    // Notify the rider
    await this.sendToUser(riderId, {
      type: 'expense',
      title: 'Expense Approved',
      message: `Your expense of AED ${amount} has been approved.`,
      actionUrl: `/rider-dashboard`,
      metadata: { expenseId, amount }
    });
  }

  static async notifyExpenseRejected(expenseId: string, riderId: string, amount: number, reason: string): Promise<void> {
    // Notify the rider
    await this.sendToUser(riderId, {
      type: 'expense',
      title: 'Expense Rejected',
      message: `Your expense of AED ${amount} has been rejected. Reason: ${reason}`,
      actionUrl: `/rider-dashboard`,
      metadata: { expenseId, amount, reason }
    });
  }

  // Document-related notifications
  static async notifyDocumentExpiring(riderId: string, documentType: string, daysUntilExpiry: number): Promise<void> {
    // Notify the rider
    await this.sendToUser(riderId, {
      type: 'document',
      title: 'Document Expiring Soon',
      message: `Your ${documentType} will expire in ${daysUntilExpiry} days. Please upload a new one.`,
      actionUrl: `/profile`,
      metadata: { documentType, daysUntilExpiry }
    });

    // Also notify Operations
    await this.sendToRole('Operations', {
      type: 'document',
      title: 'Rider Document Expiring',
      message: `A rider's ${documentType} will expire in ${daysUntilExpiry} days.`,
      actionUrl: `/riders/${riderId}`,
      metadata: { riderId, documentType, daysUntilExpiry }
    });
  }

  static async notifyDocumentUploaded(riderId: string, documentType: string): Promise<void> {
    // Notify Operations for verification
    await this.sendToRole('Operations', {
      type: 'document',
      title: 'New Document Uploaded',
      message: `A rider has uploaded a new ${documentType} for verification.`,
      actionUrl: `/riders/${riderId}`,
      metadata: { riderId, documentType }
    });
  }

  // Rider status notifications
  static async notifyRiderStatusChanged(riderId: string, riderName: string, newStatus: string): Promise<void> {
    // Notify relevant teams based on status
    const notification = {
      type: 'rider' as const,
      title: 'Rider Status Updated',
      message: `${riderName}'s status has been updated to ${newStatus}.`,
      actionUrl: `/riders/${riderId}`,
      metadata: { riderId, riderName, newStatus }
    };

    if (newStatus === 'Active') {
      // Notify all teams when a rider becomes active
      await this.sendToRoles(['Admin', 'Operations', 'Finance'], notification);
    } else {
      // Notify Operations for other status changes
      await this.sendToRole('Operations', notification);
    }
  }

  // System notifications
  static async notifyBudgetExceeded(category: string, currentSpend: number, budgetLimit: number): Promise<void> {
    await this.sendToRoles(['Admin', 'Finance'], {
      type: 'system',
      title: 'Budget Exceeded',
      message: `The ${category} budget has been exceeded. Current spend: AED ${currentSpend}, Limit: AED ${budgetLimit}`,
      actionUrl: `/reports`,
      metadata: { category, currentSpend, budgetLimit }
    });
  }

  static async notifyNewRiderApplication(riderId: string, riderName: string): Promise<void> {
    await this.sendToRole('Operations', {
      type: 'rider',
      title: 'New Rider Application',
      message: `${riderName} has submitted a new application.`,
      actionUrl: `/riders/${riderId}`,
      metadata: { riderId, riderName }
    });
  }
}