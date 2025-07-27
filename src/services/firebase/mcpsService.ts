import { db } from '@/config/firebase';
import { collection, addDoc, updateDoc, doc, getDoc, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import axios from 'axios';

export interface MCPSMessage {
  id?: string;
  riderId: string;
  riderPhone: string;
  channel: 'whatsapp' | 'sms' | 'email';
  type: 'expense_approved' | 'expense_rejected' | 'document_verified' | 'document_rejected' | 
        'status_update' | 'bike_assigned' | 'training_reminder' | 'custom';
  content: string;
  status: 'pending' | 'sent' | 'delivered' | 'failed';
  sentAt?: Date;
  deliveredAt?: Date;
  error?: string;
  metadata?: Record<string, any>;
}

export interface MCPSConfig {
  ultramsgInstance?: string;
  ultramsgToken?: string;
  twilioAccountSid?: string;
  twilioAuthToken?: string;
  twilioPhoneNumber?: string;
  n8nWebhookUrl?: string;
  defaultChannel: 'whatsapp' | 'sms';
}

class MCPSService {
  private config: MCPSConfig = {
    defaultChannel: 'whatsapp',
    n8nWebhookUrl: import.meta.env.VITE_N8N_WEBHOOK_URL || 'https://n8n.srv924607.hstgr.cloud/webhook/yellowbox-mcps'
  };

  async sendMessage(message: Omit<MCPSMessage, 'id' | 'status' | 'sentAt'>): Promise<string> {
    try {
      // Save message to Firestore
      const messageDoc = await addDoc(collection(db, 'mcps_messages'), {
        ...message,
        status: 'pending',
        sentAt: new Date(),
        createdAt: new Date()
      });

      // Send via n8n webhook for processing
      if (this.config.n8nWebhookUrl) {
        await this.sendViaWebhook(messageDoc.id, message);
      } else {
        // Fallback to direct sending
        await this.sendDirect(messageDoc.id, message);
      }

      return messageDoc.id;
    } catch (error) {
      console.error('Error sending MCPS message:', error);
      throw error;
    }
  }

  private async sendViaWebhook(messageId: string, message: Omit<MCPSMessage, 'id' | 'status' | 'sentAt'>) {
    try {
      const response = await axios.post(this.config.n8nWebhookUrl!, {
        messageId,
        ...message,
        timestamp: new Date().toISOString()
      });

      if (response.data.success) {
        await this.updateMessageStatus(messageId, 'sent');
      } else {
        await this.updateMessageStatus(messageId, 'failed', response.data.error);
      }
    } catch (error: any) {
      await this.updateMessageStatus(messageId, 'failed', error.message);
      throw error;
    }
  }

  private async sendDirect(messageId: string, message: Omit<MCPSMessage, 'id' | 'status' | 'sentAt'>) {
    try {
      if (message.channel === 'whatsapp' && this.config.ultramsgInstance && this.config.ultramsgToken) {
        await this.sendWhatsApp(message.riderPhone, message.content);
        await this.updateMessageStatus(messageId, 'sent');
      } else if (message.channel === 'sms' && this.config.twilioAccountSid) {
        await this.sendSMS(message.riderPhone, message.content);
        await this.updateMessageStatus(messageId, 'sent');
      } else {
        throw new Error(`Channel ${message.channel} not configured`);
      }
    } catch (error: any) {
      await this.updateMessageStatus(messageId, 'failed', error.message);
      throw error;
    }
  }

  private async sendWhatsApp(phone: string, message: string) {
    if (!this.config.ultramsgInstance || !this.config.ultramsgToken) {
      throw new Error('UltraMsg not configured');
    }

    const response = await axios.post(
      `https://api.ultramsg.com/${this.config.ultramsgInstance}/messages/chat`,
      {
        token: this.config.ultramsgToken,
        to: phone,
        body: message
      }
    );

    if (!response.data.sent) {
      throw new Error('WhatsApp message failed to send');
    }
  }

  private async sendSMS(phone: string, message: string) {
    if (!this.config.twilioAccountSid || !this.config.twilioAuthToken) {
      throw new Error('Twilio not configured');
    }

    // Twilio implementation would go here
    console.log('SMS sending not implemented yet');
  }

  private async updateMessageStatus(messageId: string, status: MCPSMessage['status'], error?: string) {
    const messageRef = doc(db, 'mcps_messages', messageId);
    const updateData: any = { status, updatedAt: new Date() };
    
    if (status === 'delivered') {
      updateData.deliveredAt = new Date();
    }
    
    if (error) {
      updateData.error = error;
    }

    await updateDoc(messageRef, updateData);
  }

  async sendExpenseNotification(riderId: string, expenseId: string, status: 'approved' | 'rejected', reason?: string) {
    const rider = await this.getRiderDetails(riderId);
    if (!rider || !rider.phone) return;

    const content = status === 'approved' 
      ? `Your expense submission has been approved! Check your Yellow Box app for details.`
      : `Your expense submission has been rejected. Reason: ${reason || 'Please contact finance team'}`;

    return this.sendMessage({
      riderId,
      riderPhone: rider.phone,
      channel: 'whatsapp',
      type: status === 'approved' ? 'expense_approved' : 'expense_rejected',
      content,
      metadata: { expenseId, reason }
    });
  }

  async sendDocumentNotification(riderId: string, documentType: string, status: 'verified' | 'rejected', reason?: string) {
    const rider = await this.getRiderDetails(riderId);
    if (!rider || !rider.phone) return;

    const content = status === 'verified'
      ? `Your ${documentType} has been verified successfully!`
      : `Your ${documentType} was rejected. Reason: ${reason || 'Please resubmit with clear photo'}`;

    return this.sendMessage({
      riderId,
      riderPhone: rider.phone,
      channel: 'whatsapp',
      type: status === 'verified' ? 'document_verified' : 'document_rejected',
      content,
      metadata: { documentType, reason }
    });
  }

  async sendStatusUpdate(riderId: string, newStatus: string, additionalInfo?: string) {
    const rider = await this.getRiderDetails(riderId);
    if (!rider || !rider.phone) return;

    const content = `Your application status has been updated to: ${newStatus}. ${additionalInfo || ''}`;

    return this.sendMessage({
      riderId,
      riderPhone: rider.phone,
      channel: 'whatsapp',
      type: 'status_update',
      content,
      metadata: { newStatus }
    });
  }

  async sendBikeAssignmentNotification(riderId: string, bikeDetails: any) {
    const rider = await this.getRiderDetails(riderId);
    if (!rider || !rider.phone) return;

    const content = `Congratulations! You've been assigned bike ${bikeDetails.registrationNumber}. Please collect it from the office.`;

    return this.sendMessage({
      riderId,
      riderPhone: rider.phone,
      channel: 'whatsapp',
      type: 'bike_assigned',
      content,
      metadata: { bikeDetails }
    });
  }

  private async getRiderDetails(riderId: string) {
    try {
      const riderDoc = await getDoc(doc(db, 'riders', riderId));
      if (riderDoc.exists()) {
        return riderDoc.data();
      }
      return null;
    } catch (error) {
      console.error('Error fetching rider details:', error);
      return null;
    }
  }

  async getMessageHistory(riderId: string, limit: number = 50) {
    const q = query(
      collection(db, 'mcps_messages'),
      where('riderId', '==', riderId),
      orderBy('sentAt', 'desc'),
      limit(limit)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as MCPSMessage));
  }

  updateConfig(config: Partial<MCPSConfig>) {
    this.config = { ...this.config, ...config };
  }
}

export const mcpsService = new MCPSService();