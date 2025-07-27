// Test client for Yellow Box MCP Server
const io = require('socket.io-client');
const axios = require('axios');

// Configuration
const SERVER_URL = process.env.MCP_SERVER_URL || 'http://localhost:3000';
const AUTH_TOKEN = process.env.AUTH_TOKEN || 'your-test-token';

// Color codes for output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

console.log(`${colors.blue}Yellow Box MCP Server Test Client${colors.reset}`);
console.log('=================================\n');

// Test REST API
async function testRestAPI() {
  console.log(`${colors.yellow}Testing REST API...${colors.reset}`);
  
  try {
    // Test health endpoint
    const healthResponse = await axios.get(`${SERVER_URL}/health`);
    console.log(`${colors.green}✓ Health check passed${colors.reset}`, healthResponse.data);
    
    // Test event submission (will fail without auth)
    try {
      await axios.post(`${SERVER_URL}/api/events`, {
        type: 'system:notification',
        source: 'test-client',
        payload: { message: 'Test event' }
      }, {
        headers: {
          'Authorization': `Bearer ${AUTH_TOKEN}`
        }
      });
      console.log(`${colors.green}✓ Event submission passed${colors.reset}`);
    } catch (error) {
      console.log(`${colors.red}✗ Event submission failed (expected without valid auth)${colors.reset}`);
    }
    
  } catch (error) {
    console.error(`${colors.red}REST API test failed:${colors.reset}`, error.message);
  }
}

// Test WebSocket connection
function testWebSocket() {
  console.log(`\n${colors.yellow}Testing WebSocket connection...${colors.reset}`);
  
  const socket = io(SERVER_URL, {
    auth: {
      token: AUTH_TOKEN
    },
    transports: ['websocket', 'polling']
  });

  socket.on('connect', () => {
    console.log(`${colors.green}✓ WebSocket connected${colors.reset}`);
    console.log(`  Socket ID: ${socket.id}`);
    
    // Subscribe to test rooms
    socket.emit('subscribe', ['test-room', 'tracking']);
  });

  socket.on('subscribed', (rooms) => {
    console.log(`${colors.green}✓ Subscribed to rooms:${colors.reset}`, rooms);
    
    // Send test location update
    if (socket.auth && socket.auth.role === 'rider') {
      socket.emit('location:update', {
        bikeId: 'test-bike-123',
        latitude: 25.2048,
        longitude: 55.2708,
        speed: 15.5,
        heading: 180
      });
    }
  });

  socket.on('event', (event) => {
    console.log(`${colors.blue}Event received:${colors.reset}`, event);
  });

  socket.on('notification', (notification) => {
    console.log(`${colors.blue}Notification received:${colors.reset}`, notification);
  });

  socket.on('error', (error) => {
    console.error(`${colors.red}WebSocket error:${colors.reset}`, error);
  });

  socket.on('connect_error', (error) => {
    console.error(`${colors.red}Connection error:${colors.reset}`, error.message);
  });

  socket.on('disconnect', (reason) => {
    console.log(`${colors.yellow}Disconnected:${colors.reset}`, reason);
  });

  // Test admin namespace
  const adminSocket = io(`${SERVER_URL}/admin`, {
    auth: {
      token: AUTH_TOKEN
    }
  });

  adminSocket.on('connect', () => {
    console.log(`${colors.green}✓ Admin namespace connected${colors.reset}`);
  });

  adminSocket.on('connect_error', (error) => {
    console.log(`${colors.yellow}Admin connection failed (expected without admin role)${colors.reset}`);
  });

  // Test tracking namespace
  const trackingSocket = io(`${SERVER_URL}/tracking`, {
    auth: {
      token: AUTH_TOKEN
    }
  });

  trackingSocket.on('connect', () => {
    console.log(`${colors.green}✓ Tracking namespace connected${colors.reset}`);
  });

  // Keep connection alive for 30 seconds
  setTimeout(() => {
    console.log(`\n${colors.yellow}Test completed. Closing connections...${colors.reset}`);
    socket.disconnect();
    adminSocket.disconnect();
    trackingSocket.disconnect();
    process.exit(0);
  }, 30000);
}

// Run tests
async function runTests() {
  console.log(`Server URL: ${SERVER_URL}`);
  console.log(`Auth Token: ${AUTH_TOKEN.substring(0, 20)}...`);
  console.log();
  
  await testRestAPI();
  testWebSocket();
}

runTests().catch(console.error);

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log(`\n${colors.yellow}Shutting down test client...${colors.reset}`);
  process.exit(0);
});