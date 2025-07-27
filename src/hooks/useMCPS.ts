import { useState, useCallback } from 'react';
import { mcpsService, MCPSMessage } from '@/services/firebase/mcpsService';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export function useMCPS() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const sendMessage = useMutation({
    mutationFn: (message: Omit<MCPSMessage, 'id' | 'status' | 'sentAt'>) => 
      mcpsService.sendMessage(message),
    onSuccess: () => {
      toast({
        title: 'Message sent',
        description: 'Notification has been sent successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['mcps-messages'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to send message',
        description: error.message || 'Please try again later',
        variant: 'destructive',
      });
    },
  });

  const sendExpenseNotification = useCallback(
    async (riderId: string, expenseId: string, status: 'approved' | 'rejected', reason?: string) => {
      try {
        await mcpsService.sendExpenseNotification(riderId, expenseId, status, reason);
        toast({
          title: 'Notification sent',
          description: `Expense ${status} notification sent to rider`,
        });
      } catch (error: any) {
        toast({
          title: 'Notification failed',
          description: error.message || 'Failed to send notification',
          variant: 'destructive',
        });
      }
    },
    [toast]
  );

  const sendDocumentNotification = useCallback(
    async (riderId: string, documentType: string, status: 'verified' | 'rejected', reason?: string) => {
      try {
        await mcpsService.sendDocumentNotification(riderId, documentType, status, reason);
        toast({
          title: 'Notification sent',
          description: `Document ${status} notification sent to rider`,
        });
      } catch (error: any) {
        toast({
          title: 'Notification failed',
          description: error.message || 'Failed to send notification',
          variant: 'destructive',
        });
      }
    },
    [toast]
  );

  const sendStatusUpdate = useCallback(
    async (riderId: string, newStatus: string, additionalInfo?: string) => {
      try {
        await mcpsService.sendStatusUpdate(riderId, newStatus, additionalInfo);
        toast({
          title: 'Status update sent',
          description: 'Rider has been notified of the status change',
        });
      } catch (error: any) {
        toast({
          title: 'Notification failed',
          description: error.message || 'Failed to send notification',
          variant: 'destructive',
        });
      }
    },
    [toast]
  );

  const sendBikeAssignment = useCallback(
    async (riderId: string, bikeDetails: any) => {
      try {
        await mcpsService.sendBikeAssignmentNotification(riderId, bikeDetails);
        toast({
          title: 'Assignment notification sent',
          description: 'Rider has been notified about bike assignment',
        });
      } catch (error: any) {
        toast({
          title: 'Notification failed',
          description: error.message || 'Failed to send notification',
          variant: 'destructive',
        });
      }
    },
    [toast]
  );

  return {
    sendMessage,
    sendExpenseNotification,
    sendDocumentNotification,
    sendStatusUpdate,
    sendBikeAssignment,
  };
}

export function useMCPSHistory(riderId: string) {
  return useQuery({
    queryKey: ['mcps-messages', riderId],
    queryFn: () => mcpsService.getMessageHistory(riderId),
    enabled: !!riderId,
  });
}