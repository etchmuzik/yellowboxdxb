import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/config/supabase';
import { useAuth } from '@/hooks/use-auth';
import { toast } from 'sonner';
import type { RealtimeChannel } from '@supabase/supabase-js';

export interface Notification {
  id: string;
  type: 'expense' | 'document' | 'rider' | 'system';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  userId: string;
  metadata?: Record<string, any>;
  actionUrl?: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  createNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { currentUser } = useAuth();

  // Subscribe to notifications using Supabase Realtime
  useEffect(() => {
    if (!currentUser?.id) return;

    let channel: RealtimeChannel;

    // Fetch initial notifications
    const fetchNotifications = async () => {
      try {
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', currentUser.id)
          .order('timestamp', { ascending: false })
          .limit(50);

        if (error) {
          console.error('Error fetching notifications:', error);
          return;
        }

        const newNotifications: Notification[] = (data || []).map((item: any) => ({
          id: item.id,
          type: item.type,
          title: item.title,
          message: item.message,
          timestamp: new Date(item.timestamp),
          read: item.read || false,
          userId: item.user_id,
          metadata: item.metadata,
          actionUrl: item.action_url
        }));

        // Check for new notifications and show toast
        const currentIds = new Set(notifications.map(n => n.id));
        newNotifications.forEach(notification => {
          if (!currentIds.has(notification.id) && !notification.read) {
            toast(notification.title, {
              description: notification.message,
              action: notification.actionUrl ? {
                label: 'View',
                onClick: () => window.location.href = notification.actionUrl!
              } : undefined
            });
          }
        });

        setNotifications(newNotifications);
      } catch (error) {
        console.error('Error in fetchNotifications:', error);
      }
    };

    // Fetch initial data
    fetchNotifications();

    // Set up real-time subscription
    channel = supabase
      .channel(`notifications-${currentUser.id}`)
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${currentUser.id}`
        },
        (payload) => {
          console.log('Notification change detected:', payload.eventType);
          // Re-fetch notifications on any change
          fetchNotifications();
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Successfully subscribed to notifications');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('Error subscribing to notifications');
        }
      });

    return () => {
      console.log('Unsubscribing from notifications');
      supabase.removeChannel(channel);
    };
  }, [currentUser?.id]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({
          read: true,
          read_at: new Date().toISOString()
        })
        .eq('id', notificationId);

      if (error) {
        console.error('Error marking notification as read:', error);
      }
    } catch (error) {
      console.error('Error in markAsRead:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      if (!currentUser?.id) return;

      const { error } = await supabase
        .from('notifications')
        .update({
          read: true,
          read_at: new Date().toISOString()
        })
        .eq('user_id', currentUser.id)
        .eq('read', false);

      if (error) {
        console.error('Error marking all notifications as read:', error);
      }
    } catch (error) {
      console.error('Error in markAllAsRead:', error);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({
          deleted: true,
          deleted_at: new Date().toISOString()
        })
        .eq('id', notificationId);

      if (error) {
        console.error('Error deleting notification:', error);
      }
    } catch (error) {
      console.error('Error in deleteNotification:', error);
    }
  };

  const createNotification = async (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .insert({
          type: notification.type,
          title: notification.title,
          message: notification.message,
          user_id: notification.userId,
          metadata: notification.metadata,
          action_url: notification.actionUrl,
          read: false,
          timestamp: new Date().toISOString(),
          created_at: new Date().toISOString()
        });

      if (error) {
        console.error('Error creating notification:', error);
      }
    } catch (error) {
      console.error('Error in createNotification:', error);
    }
  };

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      markAsRead,
      markAllAsRead,
      deleteNotification,
      createNotification
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}