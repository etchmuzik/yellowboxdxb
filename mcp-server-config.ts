/**
 * MCP Server Configuration for Yellow Box Fleet Management
 * Comprehensive configuration for real-time bidirectional communication
 */

export interface MCPServerConfig {
  server: {
    port: number;
    host: string;
    cors: {
      origins: string[];
      credentials: boolean;
    };
  };
  
  websocket: {
    port: number;
    heartbeatInterval: number;
    reconnectTimeout: number;
    maxConnections: number;
  };
  
  sse: {
    endpoint: string;
    maxConnections: number;
    keepAliveInterval: number;
    timeout: number;
  };
  
  eventRouting: {
    defaultPriority: 'low' | 'medium' | 'high' | 'critical';
    retryAttempts: number;
    batchSize: number;
    processingTimeout: number;
  };
  
  integrations: {
    firebase: FirebaseConfig;
    n8n: N8NConfig;
    messaging: MessagingConfig;
  };
  
  security: {
    authentication: 'firebase' | 'jwt' | 'api-key';
    rateLimiting: RateLimitConfig;
    encryption: EncryptionConfig;
  };
  
  monitoring: {
    healthCheckInterval: number;
    metricsCollection: boolean;
    alerting: AlertingConfig;
  };
}

export interface FirebaseConfig {
  projectId: string;
  privateKey: string;
  clientEmail: string;
  databaseURL: string;
  collections: {
    riders: string;
    expenses: string;
    documents: string;
    bikes: string;
    locations: string;
    mcpMessages: string;
  };
}

export interface N8NConfig {
  baseUrl: string;
  webhookUrl: string;
  apiKey?: string;
  workflows: {
    riderSync: string;
    expenseProcessing: string;
    documentVerification: string;
    bikeTracking: string;
    monitoring: string;
  };
  retryPolicy: {
    attempts: number;
    backoffMs: number;
    maxBackoffMs: number;
  };
  timeout: number;
}

export interface MessagingConfig {
  whatsapp: {
    provider: 'ultramsg' | 'twilio';
    apiUrl: string;
    instanceId?: string;
    token: string;
  };
  sms: {
    provider: 'twilio' | 'aws-sns';
    accountSid?: string;
    authToken?: string;
    fromNumber: string;
  };
  email: {
    provider: 'sendgrid' | 'aws-ses';
    apiKey: string;
    fromEmail: string;
  };
}

export interface RateLimitConfig {
  websocket: {
    connectionsPerUser: number;
    messagesPerMinute: number;
    burstLimit: number;
  };
  api: {
    requestsPerMinute: number;
    burstLimit: number;
    windowMs: number;
  };
  notifications: {
    perUser: {
      perMinute: number;
      perHour: number;
      perDay: number;
    };
  };
}

export interface EncryptionConfig {
  websocketTLS: boolean;
  messageEncryption: boolean;
  keyRotationInterval: number;
  algorithm: string;
  keyLength: number;
}

export interface AlertingConfig {
  channels: ('email' | 'webhook' | 'slack')[];
  thresholds: {
    connectionFailureRate: number;
    errorRate: number;
    responseTime: number;
    queueSize: number;
  };
  cooldownPeriod: number;
}

// Production Configuration
export const PRODUCTION_MCP_CONFIG: MCPServerConfig = {
  server: {
    port: 3001,
    host: '0.0.0.0',
    cors: {
      origins: [
        'https://yellowbox-fleet.com',
        'https://admin.yellowbox-fleet.com',
        'https://ops.yellowbox-fleet.com'
      ],
      credentials: true
    }
  },
  
  websocket: {
    port: 3001,
    heartbeatInterval: 30000, // 30 seconds
    reconnectTimeout: 5000,   // 5 seconds
    maxConnections: 1000
  },
  
  sse: {
    endpoint: '/sse',
    maxConnections: 500,
    keepAliveInterval: 30000, // 30 seconds
    timeout: 300000 // 5 minutes
  },
  
  eventRouting: {
    defaultPriority: 'medium',
    retryAttempts: 3,
    batchSize: 100,
    processingTimeout: 30000 // 30 seconds
  },
  
  integrations: {
    firebase: {
      projectId: process.env.FIREBASE_PROJECT_ID || 'yellowbox-8e0e6',
      privateKey: process.env.FIREBASE_PRIVATE_KEY || '',
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL || '',
      databaseURL: process.env.FIREBASE_DATABASE_URL || '',
      collections: {
        riders: 'riders',
        expenses: 'expenses',
        documents: 'rider_documents',
        bikes: 'bikes',
        locations: 'locations',
        mcpMessages: 'mcp_messages'
      }
    },
    
    n8n: {
      baseUrl: 'https://n8n.srv924607.hstgr.cloud',
      webhookUrl: 'https://n8n.srv924607.hstgr.cloud/webhook/yellowbox-sync',
      workflows: {
        riderSync: 'yellowbox-sync',
        expenseProcessing: 'expense-workflow',
        documentVerification: 'document-workflow',
        bikeTracking: 'bike-tracking',
        monitoring: 'monitoring-workflow'
      },
      retryPolicy: {
        attempts: 3,
        backoffMs: 1000,
        maxBackoffMs: 10000
      },
      timeout: 30000
    },
    
    messaging: {
      whatsapp: {
        provider: 'ultramsg',
        apiUrl: 'https://api.ultramsg.com',
        instanceId: process.env.ULTRAMSG_INSTANCE_ID || '',
        token: process.env.ULTRAMSG_TOKEN || ''
      },
      sms: {
        provider: 'twilio',
        accountSid: process.env.TWILIO_ACCOUNT_SID || '',
        authToken: process.env.TWILIO_AUTH_TOKEN || '',
        fromNumber: process.env.TWILIO_FROM_NUMBER || ''
      },
      email: {
        provider: 'sendgrid',
        apiKey: process.env.SENDGRID_API_KEY || '',
        fromEmail: 'noreply@yellowbox-fleet.com'
      }
    }
  },
  
  security: {
    authentication: 'firebase',
    rateLimiting: {
      websocket: {
        connectionsPerUser: 5,
        messagesPerMinute: 100,
        burstLimit: 20
      },
      api: {
        requestsPerMinute: 1000,
        burstLimit: 100,
        windowMs: 60000
      },
      notifications: {
        perUser: {
          perMinute: 10,
          perHour: 100,
          perDay: 500
        }
      }
    },
    encryption: {
      websocketTLS: true,
      messageEncryption: true,
      keyRotationInterval: 86400000, // 24 hours
      algorithm: 'aes-256-gcm',
      keyLength: 32
    }
  },
  
  monitoring: {
    healthCheckInterval: 30000, // 30 seconds
    metricsCollection: true,
    alerting: {
      channels: ['email', 'webhook'],
      thresholds: {
        connectionFailureRate: 0.05, // 5%
        errorRate: 0.01, // 1%
        responseTime: 5000, // 5 seconds
        queueSize: 1000
      },
      cooldownPeriod: 300000 // 5 minutes
    }
  }
};

// Development Configuration
export const DEVELOPMENT_MCP_CONFIG: MCPServerConfig = {
  ...PRODUCTION_MCP_CONFIG,
  server: {
    port: 3001,
    host: 'localhost',
    cors: {
      origins: ['http://localhost:8080', 'http://localhost:3000'],
      credentials: true
    }
  },
  websocket: {
    port: 3001,
    heartbeatInterval: 10000, // 10 seconds for dev
    reconnectTimeout: 2000,   // 2 seconds for dev
    maxConnections: 100
  },
  integrations: {
    ...PRODUCTION_MCP_CONFIG.integrations,
    n8n: {
      ...PRODUCTION_MCP_CONFIG.integrations.n8n,
      baseUrl: 'http://localhost:5678' // Local n8n instance
    }
  },
  security: {
    ...PRODUCTION_MCP_CONFIG.security,
    encryption: {
      ...PRODUCTION_MCP_CONFIG.security.encryption,
      websocketTLS: false // No TLS in development
    }
  }
};

// Event Type Definitions
export interface FleetEvent {
  id: string;
  type: 'rider_location' | 'expense_submitted' | 'document_uploaded' | 'bike_status' | 'alert' | 'system';
  priority: 'low' | 'medium' | 'high' | 'critical';
  payload: any;
  timestamp: Date;
  source: string;
  targetSubscribers?: string[];
  retryCount?: number;
  expiresAt?: Date;
}

export interface EventHandler {
  (event: FleetEvent): Promise<void>;
}

export interface EventSubscription {
  id: string;
  userId: string;
  eventTypes: string[];
  filters: Record<string, any>;
  channel: 'websocket' | 'sse' | 'webhook';
  createdAt: Date;
  active: boolean;
}

// Real-time Communication Interfaces
export interface WebSocketMessage {
  type: 'auth' | 'subscribe' | 'unsubscribe' | 'event' | 'heartbeat' | 'error';
  id?: string;
  token?: string;
  userId?: string;
  role?: string;
  eventTypes?: string[];
  filters?: Record<string, any>;
  payload?: any;
  error?: {
    code: number;
    message: string;
  };
}

export interface SSEMessage {
  id: string;
  event: string;
  data: any;
  retry?: number;
}

// Fleet-specific Interfaces
export interface RiderLocation {
  riderId: string;
  latitude: number;
  longitude: number;
  accuracy: number;
  speed?: number;
  heading?: number;
  timestamp: Date;
  batteryLevel?: number;
  isOnline: boolean;
}

export interface ExpenseUpdate {
  expenseId: string;
  riderId: string;
  status: 'pending' | 'approved' | 'rejected';
  amount: number;
  category: string;
  approvedBy?: string;
  rejectionReason?: string;
  timestamp: Date;
}

export interface DocumentUpdate {
  documentId: string;
  riderId: string;
  type: string;
  status: 'pending' | 'verified' | 'rejected';
  verifiedBy?: string;
  rejectionReason?: string;
  timestamp: Date;
}

export interface BikeUpdate {
  bikeId: string;
  riderId?: string;
  status: 'available' | 'assigned' | 'maintenance' | 'out_of_service';
  location?: {
    latitude: number;
    longitude: number;
  };
  batteryLevel?: number;
  maintenanceNeeded?: boolean;
  lastServiceDate?: Date;
  timestamp: Date;
}

export interface FleetAlert {
  id: string;
  type: 'geofence_violation' | 'maintenance_due' | 'expense_threshold' | 'security_incident';
  severity: 'info' | 'warning' | 'error' | 'critical';
  title: string;
  message: string;
  riderId?: string;
  bikeId?: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  timestamp: Date;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
}

export interface DashboardMetrics {
  timestamp: Date;
  activeRiders: number;
  totalRiders: number;
  activeBikes: number;
  totalBikes: number;
  pendingExpenses: number;
  totalExpensesToday: number;
  pendingDocuments: number;
  alerts: {
    total: number;
    critical: number;
    unacknowledged: number;
  };
  performance: {
    averageResponseTime: number;
    uptime: number;
    errorRate: number;
  };
}

export default PRODUCTION_MCP_CONFIG;