/**
 * Role-based permissions configuration
 * Centralized permission management for the Yellow Box application
 */

export const PERMISSIONS = {
  // Settings Page Permissions
  settings: {
    budget: ['Admin', 'Finance'],
    notifications: ['Admin', 'Operations', 'Finance', 'Rider-Applicant'],
    categories: ['Admin'], // Only Admin can manage expense categories
    bikes: ['Admin', 'Operations'], // Admin and Operations manage bikes
    apiKeys: ['Admin'], // Only Admin should access API keys
    sync: ['Admin'], // Only Admin should access sync settings
    personal: ['Rider-Applicant'], // Only riders see personal settings
  },

  // Main Navigation Permissions
  navigation: {
    dashboard: ['Admin', 'Operations', 'Finance'],
    riders: ['Admin', 'Operations', 'Finance'],
    expenses: ['Admin', 'Operations', 'Finance'],
    visas: ['Admin', 'Finance'],
    bikeTracker: ['Admin', 'Operations'],
    activity: ['Admin', 'Operations'],
    reports: ['Admin', 'Operations', 'Finance'],
    notifications: ['Admin', 'Operations', 'Finance', 'Rider-Applicant'],
    settings: ['Admin', 'Operations', 'Finance', 'Rider-Applicant'],
    profile: ['Admin', 'Operations', 'Finance', 'Rider-Applicant'],
  },

  // Feature-level Permissions
  features: {
    // Expense Management
    createExpense: ['Admin', 'Operations'],
    approveExpense: ['Admin', 'Finance'],
    viewExpenses: ['Admin', 'Operations', 'Finance'],
    deleteExpense: ['Admin'],

    // Rider Management
    createRider: ['Admin', 'Operations'],
    updateRider: ['Admin', 'Operations'],
    viewRiders: ['Admin', 'Operations', 'Finance'],
    deleteRider: ['Admin'],

    // Document Management
    uploadDocuments: ['Admin', 'Operations', 'Rider-Applicant'],
    viewDocuments: ['Admin', 'Operations', 'Finance'],
    deleteDocuments: ['Admin'],

    // Budget Management
    setBudget: ['Admin', 'Finance'],
    viewBudget: ['Admin', 'Finance', 'Operations'],

    // Bike Management
    assignBike: ['Admin', 'Operations'],
    trackBike: ['Admin', 'Operations'],
    updateBikeStatus: ['Admin', 'Operations'],
  }
};

/**
 * Check if a role has permission for a specific feature
 */
export function hasPermission(userRole: string, feature: string, category: keyof typeof PERMISSIONS): boolean {
  const permissions = PERMISSIONS[category];
  if (!permissions || !permissions[feature]) {
    return false;
  }
  return permissions[feature].includes(userRole);
}

/**
 * Get all permitted features for a role in a category
 */
export function getPermittedFeatures(userRole: string, category: keyof typeof PERMISSIONS): string[] {
  const permissions = PERMISSIONS[category];
  if (!permissions) return [];
  
  return Object.keys(permissions).filter(feature => 
    permissions[feature].includes(userRole)
  );
}