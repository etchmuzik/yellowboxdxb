
import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';
import { UserRole } from '@/types';

interface RequireAuthProps {
  children: React.ReactNode;
  fallbackPath?: string;
  roles?: string[];
}

const RequireAuth = ({ children, fallbackPath, roles }: RequireAuthProps) => {
  const { isAuthenticated, loading, currentUser } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      // Redirect to login page if not authenticated
      navigate('/login', { state: { from: location } });
    }
  }, [isAuthenticated, loading, location, navigate]);

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  // Check if user is authenticated
  if (!isAuthenticated) {
    return null;
  }

  // Check role-based access if roles are specified
  if (roles && roles.length > 0 && currentUser) {
    const userRole = currentUser.role;
    
    if (!roles.includes(userRole)) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-red-600 mb-2">Access Denied</h2>
            <p className="text-gray-600">You don't have permission to access this page.</p>
          </div>
        </div>
      );
    }
  }

  // Render children if all checks pass
  return <>{children}</>;
};

export default RequireAuth;
