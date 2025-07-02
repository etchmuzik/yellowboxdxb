
import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';
import { UserRole } from '@/types';

interface RequireAuthProps {
  children: React.ReactNode;
  fallbackPath?: string;
}

const RequireAuth = ({ children, fallbackPath }: RequireAuthProps) => {
  const { isAuthenticated, loading, currentUser } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      // Redirect to login page if not authenticated
      navigate('/login', { state: { from: location } });
    } else if (!loading && isAuthenticated && currentUser && fallbackPath) {
      // If user is authenticated but on a generic protected route,
      // redirect to their role-specific dashboard
      const isGenericRoute = location.pathname === '/' || location.pathname === '';
      if (isGenericRoute) {
        const roleRedirects: Record<UserRole, string> = {
          'Admin': '/',
          'Operations': '/operations-dashboard',
          'Finance': '/finance-dashboard',
          'Rider-Applicant': '/rider-dashboard'
        };
        const targetPath = roleRedirects[currentUser.role] || fallbackPath;
        if (targetPath !== location.pathname) {
          navigate(targetPath, { replace: true });
        }
      }
    }
  }, [isAuthenticated, loading, location, navigate, currentUser, fallbackPath]);

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  // Only render children if authenticated
  return isAuthenticated ? <>{children}</> : null;
};

export default RequireAuth;
