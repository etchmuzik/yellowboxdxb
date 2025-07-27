# MCP Server Integration Guide for Yellow Box Web App

This guide explains how to integrate the MCP (Message Communication Protocol) server with the Yellow Box web application for real-time features.

## Quick Start

### 1. Install Socket.IO Client

```bash
npm install socket.io-client
```

### 2. Create MCP Service

Create a new file `src/services/mcpService.ts`:

```typescript
import { io, Socket } from 'socket.io-client';
import { auth } from './firebase/auth';

class MCPService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  async connect(): Promise<void> {
    // Get Firebase ID token
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated');
    }

    const token = await user.getIdToken();

    // Connect to MCP server
    this.socket = io(import.meta.env.VITE_MCP_SERVER_URL || 'http://localhost:3000', {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Connected to MCP server');
      this.reconnectAttempts = 0;
      
      // Subscribe to relevant rooms based on user role
      const user = auth.currentUser;
      if (user) {
        this.subscribeToRooms();
      }
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Disconnected from MCP server:', reason);
    });

    this.socket.on('error', (error) => {
      console.error('MCP connection error:', error);
    });

    // Handle real-time events
    this.socket.on('event', (event) => {
      this.handleEvent(event);
    });

    this.socket.on('notification', (notification) => {
      this.handleNotification(notification);
    });
  }

  private subscribeToRooms(): void {
    if (!this.socket) return;

    const rooms = ['tracking']; // Add more rooms as needed
    
    // Add role-specific rooms
    const userRole = localStorage.getItem('userRole');
    if (userRole === 'admin' || userRole === 'operations') {
      rooms.push('rider-updates', 'expense-updates');
    }

    this.socket.emit('subscribe', rooms);
  }

  private handleEvent(event: any): void {
    // Dispatch events to appropriate handlers
    switch (event.type) {
      case 'rider:location:update':
        // Update map markers
        window.dispatchEvent(new CustomEvent('mcp:location:update', { detail: event.payload }));
        break;
      
      case 'expense:approved':
      case 'expense:rejected':
        // Refresh expense list
        window.dispatchEvent(new CustomEvent('mcp:expense:update', { detail: event.payload }));
        break;
      
      case 'rider:status:changed':
        // Update rider status in UI
        window.dispatchEvent(new CustomEvent('mcp:rider:update', { detail: event.payload }));
        break;
    }
  }

  private handleNotification(notification: any): void {
    // Show toast notification
    window.dispatchEvent(new CustomEvent('mcp:notification', { detail: notification }));
  }

  // Send location update (for riders)
  sendLocationUpdate(data: {
    bikeId: string;
    latitude: number;
    longitude: number;
    speed?: number;
    heading?: number;
  }): void {
    if (!this.socket) return;
    this.socket.emit('location:update', data);
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

export const mcpService = new MCPService();
```

### 3. Update Environment Variables

Add to your `.env` file:

```env
VITE_MCP_SERVER_URL=http://localhost:3000
```

For production:
```env
VITE_MCP_SERVER_URL=https://mcp-server-xxxxx-uc.a.run.app
```

### 4. Initialize MCP Connection

In your `App.tsx` or auth context:

```typescript
import { mcpService } from './services/mcpService';

// After successful authentication
useEffect(() => {
  if (user) {
    mcpService.connect().catch(console.error);
    
    return () => {
      mcpService.disconnect();
    };
  }
}, [user]);
```

### 5. Integrate with Components

#### Real-time Location Tracking

In `BikeTrackerContent.tsx`:

```typescript
useEffect(() => {
  const handleLocationUpdate = (event: CustomEvent) => {
    const { riderId, location } = event.detail;
    
    // Update rider location on map
    setRiderLocations(prev => ({
      ...prev,
      [riderId]: location
    }));
  };

  window.addEventListener('mcp:location:update', handleLocationUpdate);
  
  return () => {
    window.removeEventListener('mcp:location:update', handleLocationUpdate);
  };
}, []);
```

#### Real-time Notifications

In `NotificationContext.tsx`:

```typescript
useEffect(() => {
  const handleNotification = (event: CustomEvent) => {
    const notification = event.detail;
    
    // Add to notification list
    addNotification({
      id: notification.id,
      title: notification.title,
      message: notification.message,
      type: notification.type,
      timestamp: new Date(),
    });
    
    // Show toast
    toast({
      title: notification.title,
      description: notification.message,
      variant: notification.type === 'error' ? 'destructive' : 'default',
    });
  };

  window.addEventListener('mcp:notification', handleNotification);
  
  return () => {
    window.removeEventListener('mcp:notification', handleNotification);
  };
}, []);
```

#### Expense Updates

In `ExpenseApprovalList.tsx`:

```typescript
useEffect(() => {
  const handleExpenseUpdate = (event: CustomEvent) => {
    const { expenseId, status } = event.detail;
    
    // Refresh expense list
    queryClient.invalidateQueries(['expenses']);
    
    // Show notification
    toast({
      title: `Expense ${status}`,
      description: `Expense ${expenseId} has been ${status}`,
    });
  };

  window.addEventListener('mcp:expense:update', handleExpenseUpdate);
  
  return () => {
    window.removeEventListener('mcp:expense:update', handleExpenseUpdate);
  };
}, [queryClient]);
```

## Advanced Features

### 1. Connection Status Indicator

Create a component to show MCP connection status:

```typescript
const ConnectionStatus: React.FC = () => {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const checkConnection = () => {
      setIsConnected(mcpService.isConnected());
    };

    checkConnection();
    const interval = setInterval(checkConnection, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`flex items-center gap-2 ${isConnected ? 'text-green-500' : 'text-red-500'}`}>
      <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
      <span className="text-xs">
        {isConnected ? 'Connected' : 'Disconnected'}
      </span>
    </div>
  );
};
```

### 2. Rider Location Broadcasting

For the rider mobile app:

```typescript
// In RiderDashboard component
const broadcastLocation = useCallback(() => {
  if (navigator.geolocation && bikeId) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        mcpService.sendLocationUpdate({
          bikeId,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          speed: position.coords.speed || undefined,
          heading: position.coords.heading || undefined,
        });
      },
      (error) => console.error('Location error:', error),
      { enableHighAccuracy: true }
    );
  }
}, [bikeId]);

// Broadcast location every 30 seconds
useEffect(() => {
  if (isActiveRider) {
    const interval = setInterval(broadcastLocation, 30000);
    return () => clearInterval(interval);
  }
}, [isActiveRider, broadcastLocation]);
```

### 3. Admin Real-time Dashboard

```typescript
// In AdminDashboard
useEffect(() => {
  // Subscribe to admin-specific events
  const handleRiderUpdate = (event: CustomEvent) => {
    // Update dashboard metrics
    refetchRiderStats();
  };

  const handleExpenseUpdate = (event: CustomEvent) => {
    // Update expense metrics
    refetchExpenseStats();
  };

  window.addEventListener('mcp:rider:update', handleRiderUpdate);
  window.addEventListener('mcp:expense:update', handleExpenseUpdate);

  return () => {
    window.removeEventListener('mcp:rider:update', handleRiderUpdate);
    window.removeEventListener('mcp:expense:update', handleExpenseUpdate);
  };
}, []);
```

## Testing

### 1. Test Connection

```typescript
// In browser console
import { mcpService } from './services/mcpService';

// Check connection
console.log('Connected:', mcpService.isConnected());

// Test location update (for riders)
mcpService.sendLocationUpdate({
  bikeId: 'test-bike-123',
  latitude: 25.2048,
  longitude: 55.2708,
  speed: 15.5
});
```

### 2. Simulate Events

Use the test client provided with MCP server:

```bash
cd mcp-server
node test-client.js
```

## Troubleshooting

### Connection Issues

1. **Check MCP server is running**
   ```bash
   curl http://localhost:3000/health
   ```

2. **Verify Firebase token**
   - Check browser console for auth errors
   - Ensure Firebase Auth is properly configured

3. **CORS errors**
   - Verify MCP server CORS settings include your app URL
   - Check `.env` SOCKET_IO_CORS_ORIGIN value

### Event Not Received

1. **Check room subscriptions**
   - Verify user is subscribed to correct rooms
   - Check server logs for subscription confirmations

2. **Verify event routing**
   - Check MCP server logs for event processing
   - Ensure event handlers are registered

### Performance Issues

1. **Optimize event frequency**
   - Throttle location updates
   - Batch multiple updates

2. **Use selective updates**
   - Only subscribe to necessary rooms
   - Filter events client-side

## Production Checklist

- [ ] Update `VITE_MCP_SERVER_URL` to production URL
- [ ] Configure SSL/TLS for WebSocket connections
- [ ] Set up monitoring for connection health
- [ ] Implement retry logic for failed connections
- [ ] Add connection status to user interface
- [ ] Test with high latency/poor network conditions
- [ ] Configure proper CORS origins
- [ ] Set up error tracking for WebSocket errors
- [ ] Implement graceful degradation without real-time features
- [ ] Load test with expected concurrent users

## Next Steps

1. **Enhance Security**
   - Implement message encryption
   - Add request signing
   - Set up rate limiting per user

2. **Add Features**
   - Presence indicators
   - Typing indicators for chat
   - File upload progress

3. **Optimize Performance**
   - Implement message compression
   - Use binary protocols for location data
   - Add client-side caching