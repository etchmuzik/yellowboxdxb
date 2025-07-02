import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';
import { UserRole } from '@/types';
import { toast } from '@/components/ui/use-toast';
import { useEffect } from 'react';
import RequireAuth from './RequireAuth';
import { PERMISSIONS } from '@/config/permissions';

interface RoleGuardProps {
  children: React.ReactNode;
  feature: string;
  category: 'navigation' | 'actions' | 'management';
  allowedRoles?: UserRole[];
  redirectTo?: string;
}

export default function RoleGuard({ 
  children, 
  feature, 
  category, 
  allowedRoles, 
  redirectTo 
}: RoleGuardProps) {
  const { currentUser, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  // Get allowed roles from permissions config if not explicitly provided
  const effectiveAllowedRoles = allowedRoles || 
    Object.entries(PERMISSIONS)
      .filter(([role, perms]) => perms[category]?.includes(feature))
      .map(([role]) => role as UserRole);

  useEffect(() => {
    if (!loading && currentUser && !effectiveAllowedRoles.includes(currentUser.role)) {
      toast({
        title: "Access Denied",
        description: `You don't have permission to access this page.`,
        variant: "destructive",
      });
    }
  }, [loading, currentUser, effectiveAllowedRoles]);

  if (!isAuthenticated) {
    // Let RequireAuth handle authentication
    return (
      <RequireAuth>
        {children}
      </RequireAuth>
    );
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!currentUser || !effectiveAllowedRoles.includes(currentUser.role)) {
    // User is authenticated but doesn't have the right role
    const roleRedirects: Record<UserRole, string> = {
      'Admin': '/',
      'Operations': '/operations-dashboard',
      'Finance': '/finance-dashboard',
      'Rider-Applicant': '/rider-dashboard'
    };

    const targetPath = redirectTo || roleRedirects[currentUser.role] || '/';
    return <Navigate to={targetPath} replace />;
  }

  // User has the right role, render children wrapped in RequireAuth
  return (
    <RequireAuth>
      {children}
    </RequireAuth>
  );
}