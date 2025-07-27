import { User } from "@/types";

/**
 * Get the default route for a user based on their role
 */
export const getDefaultRouteForRole = (role: User['role']): string => {
  const roleRoutes: Record<User['role'], string> = {
    'Admin': '/',
    'Operations': '/', 
    'Finance': '/',
    'Rider-Applicant': '/profile'
  };
  
  return roleRoutes[role] || '/';
};

/**
 * Check if a user can access a specific route based on their role
 */
export const canAccessRoute = (role: User['role'], path: string): boolean => {
  // Define accessible routes for each role
  const roleAccessMap: Record<User['role'], string[]> = {
    'Admin': [
      '/', '/reports', '/riders', '/expenses', '/visas', 
      '/settings', '/activity', '/notifications', '/bike-tracker', '/profile'
    ],
    'Operations': [
      '/', '/reports', '/riders', '/settings', '/activity', 
      '/notifications', '/bike-tracker', '/profile'
    ],
    'Finance': [
      '/', '/reports', '/riders', '/expenses', '/visas', 
      '/settings', '/notifications', '/profile'
    ],
    'Rider-Applicant': [
      '/', '/profile', '/notifications', '/settings'
    ]
  };
  
  const accessibleRoutes = roleAccessMap[role] || [];
  
  // Check if the path starts with any of the accessible routes
  return accessibleRoutes.some(route => 
    path === route || path.startsWith(route + '/')
  );
};