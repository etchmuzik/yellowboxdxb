import { supabase } from '@/config/supabase';

// Define metadata types for better type safety
export interface ActivityMetadata {
  targetId?: string;
  targetType?: string;
  amount?: number;
  riderId?: string;
  reason?: string;
  newStatus?: string;
  bikeId?: string;
  documentType?: string;
  category?: string;
  expenseId?: string;
  riderName?: string;
  oldStatus?: string;
  [key: string]: string | number | boolean | undefined;
}

export interface Activity {
  id: string;
  type: ActivityType;
  action: string;
  description: string;
  timestamp: string;
  userId?: string;
  userEmail?: string;
  userName?: string;
  targetId?: string;
  targetType?: string;
  metadata?: ActivityMetadata;
  ipAddress?: string;
}

export type ActivityType = 
  | 'auth'
  | 'rider'
  | 'expense'
  | 'document'
  | 'budget'
  | 'bike'
  | 'system';

export const getRecentActivities = async (limitCount: number = 20): Promise<Activity[]> => {
  try {
    const { data, error } = await supabase
      .from('activity_logs')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(limitCount);

    if (error) throw error;

    return (data || []).map(activity => ({
      id: activity.id,
      type: activity.type,
      action: activity.action,
      description: activity.description,
      timestamp: activity.timestamp,
      userId: activity.user_id,
      userEmail: activity.user_email,
      userName: activity.user_name,
      targetId: activity.target_id,
      targetType: activity.target_type,
      metadata: activity.metadata,
      ipAddress: activity.ip_address
    }));
  } catch (error) {
    console.error('Error fetching activities:', error);
    return [];
  }
};

// Core activity logging function
export const logActivity = async (
  type: ActivityType,
  action: string,
  description: string,
  metadata?: ActivityMetadata
): Promise<void> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    const userEmail = user?.email || 'system';

    // Get user display name from metadata or fallback
    const userName = user?.user_metadata?.full_name ||
      localStorage.getItem('userDisplayName') ||
      userEmail;

    const { error } = await supabase
      .from('activity_logs')
      .insert({
        type,
        action,
        description,
        timestamp: new Date().toISOString(),
        user_id: user?.id || 'system',
        user_email: userEmail,
        user_name: userName,
        target_id: metadata?.targetId,
        target_type: metadata?.targetType,
        metadata: metadata || {},
        ip_address: 'web-client' // In production, get from request headers
      });

    if (error) throw error;
  } catch (error) {
    console.error('Error logging activity:', error);
    // Don't throw - logging should not break the app
  }
};

// Specific activity loggers
export const logAuthActivity = async (
  action: 'login' | 'logout' | 'password-reset' | 'role-change',
  userId: string,
  userEmail: string
) => {
  await logActivity(
    'auth',
    action,
    `User ${userEmail} ${action === 'login' ? 'logged in' : action === 'logout' ? 'logged out' : `performed ${action}`}`,
    { targetId: userId, targetType: 'user' }
  );
};

export const logExpenseActivity = async (
  action: 'create' | 'approve' | 'reject' | 'update',
  expenseId: string,
  amount: number,
  riderId?: string,
  reason?: string
) => {
  const descriptions: Record<string, string> = {
    create: `Created expense of AED ${amount}`,
    approve: `Approved expense of AED ${amount}`,
    reject: `Rejected expense of AED ${amount}${reason ? ` - Reason: ${reason}` : ''}`,
    update: `Updated expense #${expenseId}`
  };

  await logActivity(
    'expense',
    action,
    descriptions[action],
    { 
      targetId: expenseId, 
      targetType: 'expense',
      amount,
      riderId,
      reason 
    }
  );
};

export const logRiderActivity = async (
  action: 'create' | 'update-status' | 'assign-bike' | 'unassign-bike' | 'update-profile',
  riderId: string,
  details: Partial<ActivityMetadata> = {}
) => {
  const descriptions: Record<string, string> = {
    'create': `Created new rider application`,
    'update-status': `Updated rider status to ${details.newStatus}`,
    'assign-bike': `Assigned bike ${details.bikeId} to rider`,
    'unassign-bike': `Unassigned bike from rider`,
    'update-profile': `Updated rider profile`
  };

  await logActivity(
    'rider',
    action,
    descriptions[action],
    { 
      targetId: riderId, 
      targetType: 'rider',
      ...details 
    }
  );
};

export const logDocumentActivity = async (
  action: 'upload' | 'verify' | 'reject' | 'delete',
  documentType: string,
  riderId: string
) => {
  await logActivity(
    'document',
    action,
    `${action === 'upload' ? 'Uploaded' : action === 'verify' ? 'Verified' : action === 'reject' ? 'Rejected' : 'Deleted'} ${documentType}`,
    { 
      targetId: riderId, 
      targetType: 'rider',
      documentType 
    }
  );
};

export const logBudgetActivity = async (
  action: 'allocate' | 'update' | 'exceed-warning',
  category: string,
  amount: number
) => {
  await logActivity(
    'budget',
    action,
    `${action === 'allocate' ? 'Allocated' : action === 'update' ? 'Updated' : 'Warning:'} budget for ${category}: AED ${amount}`,
    { 
      category,
      amount 
    }
  );
};

// Get activities by type
export const getActivitiesByType = async (
  type: ActivityType,
  limitCount: number = 50
): Promise<Activity[]> => {
  try {
    const { data, error } = await supabase
      .from('activity_logs')
      .select('*')
      .eq('type', type)
      .order('timestamp', { ascending: false })
      .limit(limitCount);

    if (error) throw error;

    return (data || []).map(activity => ({
      id: activity.id,
      type: activity.type,
      action: activity.action,
      description: activity.description,
      timestamp: activity.timestamp,
      userId: activity.user_id,
      userEmail: activity.user_email,
      userName: activity.user_name,
      targetId: activity.target_id,
      targetType: activity.target_type,
      metadata: activity.metadata,
      ipAddress: activity.ip_address
    }));
  } catch (error) {
    console.error('Error fetching activities by type:', error);
    return [];
  }
};

// Get activities for a specific user
export const getUserActivities = async (
  userId: string,
  limitCount: number = 50
): Promise<Activity[]> => {
  try {
    const { data, error } = await supabase
      .from('activity_logs')
      .select('*')
      .eq('user_id', userId)
      .order('timestamp', { ascending: false })
      .limit(limitCount);

    if (error) throw error;

    return (data || []).map(activity => ({
      id: activity.id,
      type: activity.type,
      action: activity.action,
      description: activity.description,
      timestamp: activity.timestamp,
      userId: activity.user_id,
      userEmail: activity.user_email,
      userName: activity.user_name,
      targetId: activity.target_id,
      targetType: activity.target_type,
      metadata: activity.metadata,
      ipAddress: activity.ip_address
    }));
  } catch (error) {
    console.error('Error fetching user activities:', error);
    return [];
  }
};