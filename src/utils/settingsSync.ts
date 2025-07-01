
// Settings keys used in localStorage
const SETTINGS_KEYS = {
  GOOGLE_MAPS_API_KEY: "yellowbox-google-maps-api-key",
  CATEGORIES: "yellowbox-expense-categories",
  MONTHLY_BUDGET: "yellowbox-monthly-budget",
  ALERT_THRESHOLD: "yellowbox-alert-threshold",
  NOTIFICATION_PREFERENCES: "yellowbox-notification-preferences",
};

// Interface for all settings
export interface UserSettings {
  apiKeys: {
    googleMaps: string | null;
  };
  categories: string[];
  budget: {
    monthly: number;
    alertThreshold: number;
  };
  notifications: {
    email: boolean;
    sms: boolean;
    inApp: boolean;
  };
}

// Get all settings from localStorage
export const getAllSettings = (): UserSettings => {
  // Default settings
  const defaultSettings: UserSettings = {
    apiKeys: {
      googleMaps: null,
    },
    categories: [
      "Visa Fees",
      "RTA Tests",
      "Medical",
      "Residency ID",
      "Training",
      "Uniform",
      "Other"
    ],
    budget: {
      monthly: 30000,
      alertThreshold: 80,
    },
    notifications: {
      email: true,
      sms: true,
      inApp: true,
    }
  };

  try {
    // Get settings from localStorage
    const googleMapsApiKey = localStorage.getItem(SETTINGS_KEYS.GOOGLE_MAPS_API_KEY);
    const categoriesJson = localStorage.getItem(SETTINGS_KEYS.CATEGORIES);
    const monthlyBudget = localStorage.getItem(SETTINGS_KEYS.MONTHLY_BUDGET);
    const alertThreshold = localStorage.getItem(SETTINGS_KEYS.ALERT_THRESHOLD);
    const notificationPreferencesJson = localStorage.getItem(SETTINGS_KEYS.NOTIFICATION_PREFERENCES);
    
    // Parse and merge with defaults
    return {
      apiKeys: {
        googleMaps: googleMapsApiKey || defaultSettings.apiKeys.googleMaps,
      },
      categories: categoriesJson ? JSON.parse(categoriesJson) : defaultSettings.categories,
      budget: {
        monthly: monthlyBudget ? Number(monthlyBudget) : defaultSettings.budget.monthly,
        alertThreshold: alertThreshold ? Number(alertThreshold) : defaultSettings.budget.alertThreshold,
      },
      notifications: notificationPreferencesJson 
        ? JSON.parse(notificationPreferencesJson) 
        : defaultSettings.notifications,
    };
  } catch (error) {
    console.error("Error retrieving settings:", error);
    return defaultSettings;
  }
};

// Apply settings to localStorage
export const applySettings = (settings: UserSettings): boolean => {
  try {
    // Set API keys
    if (settings.apiKeys.googleMaps) {
      localStorage.setItem(SETTINGS_KEYS.GOOGLE_MAPS_API_KEY, settings.apiKeys.googleMaps);
    }
    
    // Set categories
    localStorage.setItem(SETTINGS_KEYS.CATEGORIES, JSON.stringify(settings.categories));
    
    // Set budget settings
    localStorage.setItem(SETTINGS_KEYS.MONTHLY_BUDGET, settings.budget.monthly.toString());
    localStorage.setItem(SETTINGS_KEYS.ALERT_THRESHOLD, settings.budget.alertThreshold.toString());
    
    // Set notification preferences
    localStorage.setItem(SETTINGS_KEYS.NOTIFICATION_PREFERENCES, JSON.stringify(settings.notifications));
    
    return true;
  } catch (error) {
    console.error("Error applying settings:", error);
    return false;
  }
};

// Export settings as a JSON file
export const exportSettings = () => {
  const settings = getAllSettings();
  const settingsJson = JSON.stringify(settings, null, 2);
  const blob = new Blob([settingsJson], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  
  const downloadLink = document.createElement("a");
  downloadLink.href = url;
  downloadLink.download = "yellowbox-settings.json";
  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);
  URL.revokeObjectURL(url);
};

// Import settings from a JSON file
export const importSettings = (file: File): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        const settings = JSON.parse(event.target?.result as string) as UserSettings;
        const success = applySettings(settings);
        resolve(success);
      } catch (error) {
        console.error("Error parsing settings file:", error);
        reject(error);
      }
    };
    
    reader.onerror = (error) => {
      console.error("Error reading settings file:", error);
      reject(error);
    };
    
    reader.readAsText(file);
  });
};
