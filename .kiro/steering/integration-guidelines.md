# Yellow Box Integration Guidelines

## Overview
This document provides guidelines for integrating new features, third-party services, and external systems into the Yellow Box platform.

## Integration Principles

### 1. Loose Coupling
- Use interfaces for external dependencies
- Implement adapter patterns
- Avoid direct third-party SDK imports in business logic
- Enable easy swapping of providers

### 2. Error Resilience
- Implement circuit breakers
- Add retry mechanisms
- Provide fallback options
- Log integration failures

### 3. Security First
- Never expose API keys in frontend
- Use environment variables
- Implement request signing
- Validate all external data

## Common Integration Patterns

### 1. Service Adapter Pattern
```typescript
// Define interface
interface PaymentGateway {
  processPayment(amount: number, currency: string): Promise<PaymentResult>;
  refundPayment(transactionId: string): Promise<RefundResult>;
  getTransactionStatus(transactionId: string): Promise<TransactionStatus>;
}

// Implement adapter
class StripeAdapter implements PaymentGateway {
  private stripe: Stripe;
  
  constructor(apiKey: string) {
    this.stripe = new Stripe(apiKey);
  }
  
  async processPayment(amount: number, currency: string): Promise<PaymentResult> {
    try {
      const intent = await this.stripe.paymentIntents.create({
        amount: amount * 100,
        currency,
      });
      return {
        success: true,
        transactionId: intent.id,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

// Use in application
const paymentGateway = new StripeAdapter(process.env.STRIPE_API_KEY);
```

### 2. Event-Driven Integration
```typescript
// Event emitter for integrations
class IntegrationEventBus {
  private events = new EventEmitter();
  
  emit(event: IntegrationEvent): void {
    this.events.emit(event.type, event.data);
  }
  
  on(eventType: string, handler: (data: any) => void): void {
    this.events.on(eventType, handler);
  }
}

// Usage
integrationBus.on('expense.approved', async (expense) => {
  await accountingSystem.syncExpense(expense);
  await notificationService.sendApprovalEmail(expense);
});
```

### 3. Webhook Handler Pattern
```typescript
// Generic webhook handler
abstract class WebhookHandler {
  abstract validate(headers: Headers, body: string): boolean;
  abstract process(data: any): Promise<void>;
  
  async handle(request: Request): Promise<Response> {
    const body = await request.text();
    
    if (\!this.validate(request.headers, body)) {
      return new Response('Invalid signature', { status: 401 });
    }
    
    try {
      const data = JSON.parse(body);
      await this.process(data);
      return new Response('OK', { status: 200 });
    } catch (error) {
      console.error('Webhook processing failed:', error);
      return new Response('Processing failed', { status: 500 });
    }
  }
}

// Specific implementation
class StripeWebhookHandler extends WebhookHandler {
  validate(headers: Headers, body: string): boolean {
    const signature = headers.get('stripe-signature');
    return stripe.webhooks.verifySignature(body, signature, webhookSecret);
  }
  
  async process(data: any): Promise<void> {
    switch (data.type) {
      case 'payment_intent.succeeded':
        await this.handlePaymentSuccess(data);
        break;
      case 'payment_intent.failed':
        await this.handlePaymentFailure(data);
        break;
    }
  }
}
```

## External Service Integrations

### 1. Payment Gateway (Stripe/PayPal)
```typescript
// Configuration
const paymentConfig = {
  provider: process.env.PAYMENT_PROVIDER || 'stripe',
  apiKey: process.env.PAYMENT_API_KEY,
  webhookSecret: process.env.PAYMENT_WEBHOOK_SECRET,
  currency: 'AED',
  sandbox: process.env.NODE_ENV \!== 'production',
};

// Integration checklist
// □ Set up webhook endpoints
// □ Implement idempotency keys
// □ Handle currency conversion
// □ Add payment method storage
// □ Implement refund logic
```

### 2. SMS Gateway (Twilio/TextLocal)
```typescript
// SMS service interface
interface SMSService {
  sendSMS(to: string, message: string): Promise<SMSResult>;
  sendBulkSMS(recipients: string[], message: string): Promise<BulkSMSResult>;
  getDeliveryStatus(messageId: string): Promise<DeliveryStatus>;
}

// Implementation
class TwilioSMSService implements SMSService {
  private client: Twilio;
  
  constructor(accountSid: string, authToken: string) {
    this.client = new Twilio(accountSid, authToken);
  }
  
  async sendSMS(to: string, message: string): Promise<SMSResult> {
    const result = await this.client.messages.create({
      body: message,
      to: this.formatPhoneNumber(to),
      from: process.env.TWILIO_PHONE_NUMBER,
    });
    
    return {
      success: true,
      messageId: result.sid,
      cost: result.price,
    };
  }
  
  private formatPhoneNumber(phone: string): string {
    // UAE phone number formatting
    return phone.startsWith('+971') ? phone : `+971${phone}`;
  }
}
```

### 3. Email Service (SendGrid/Mailgun)
```typescript
// Email templates
enum EmailTemplate {
  WELCOME = 'welcome',
  EXPENSE_APPROVED = 'expense-approved',
  DOCUMENT_EXPIRY = 'document-expiry',
  PASSWORD_RESET = 'password-reset',
}

// Email service
class EmailService {
  async sendEmail(template: EmailTemplate, to: string, data: any): Promise<void> {
    const html = await this.renderTemplate(template, data);
    
    await sendgrid.send({
      to,
      from: 'noreply@yellowbox.ae',
      subject: this.getSubject(template),
      html,
    });
  }
  
  private async renderTemplate(template: EmailTemplate, data: any): Promise<string> {
    // Use handlebars or similar for template rendering
    const templateFile = await fs.readFile(`templates/${template}.hbs`, 'utf-8');
    return handlebars.compile(templateFile)(data);
  }
}
```

### 4. Maps & Geocoding (Google Maps)
```typescript
// Maps service wrapper
class MapsService {
  private loader: Loader;
  
  constructor(apiKey: string) {
    this.loader = new Loader({
      apiKey,
      version: 'weekly',
      libraries: ['places', 'geometry', 'drawing'],
    });
  }
  
  async geocodeAddress(address: string): Promise<Coordinates> {
    const google = await this.loader.load();
    const geocoder = new google.maps.Geocoder();
    
    const result = await geocoder.geocode({ address });
    if (result.results.length === 0) {
      throw new Error('Address not found');
    }
    
    return {
      lat: result.results[0].geometry.location.lat(),
      lng: result.results[0].geometry.location.lng(),
    };
  }
  
  async calculateRoute(origin: Coordinates, destination: Coordinates): Promise<Route> {
    const google = await this.loader.load();
    const directionsService = new google.maps.DirectionsService();
    
    const result = await directionsService.route({
      origin,
      destination,
      travelMode: google.maps.TravelMode.DRIVING,
      optimizeWaypoints: true,
    });
    
    return {
      distance: result.routes[0].legs[0].distance.value,
      duration: result.routes[0].legs[0].duration.value,
      polyline: result.routes[0].overview_polyline,
    };
  }
}
```

### 5. Cloud Storage (Firebase Storage)
```typescript
// Storage abstraction
class StorageService {
  async uploadFile(
    path: string,
    file: File,
    metadata?: UploadMetadata
  ): Promise<string> {
    const storageRef = ref(storage, path);
    
    // Add security metadata
    const secureMetadata = {
      ...metadata,
      uploadedBy: auth.currentUser?.uid,
      uploadedAt: new Date().toISOString(),
      contentType: file.type,
    };
    
    const snapshot = await uploadBytes(storageRef, file, {
      customMetadata: secureMetadata,
    });
    
    return getDownloadURL(snapshot.ref);
  }
  
  async deleteFile(path: string): Promise<void> {
    const storageRef = ref(storage, path);
    await deleteObject(storageRef);
  }
  
  async generateSignedUrl(path: string, expiresIn: number): Promise<string> {
    // For sensitive documents
    const storageRef = ref(storage, path);
    return getDownloadURL(storageRef); // Firebase handles signing
  }
}
```

## API Integration Standards

### 1. RESTful API Integration
```typescript
// Base API client
class APIClient {
  constructor(
    private baseURL: string,
    private apiKey: string
  ) {}
  
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    
    if (\!response.ok) {
      throw new APIError(response.status, await response.text());
    }
    
    return response.json();
  }
  
  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }
  
  async post<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
}
```

### 2. GraphQL Integration
```typescript
// GraphQL client setup
import { GraphQLClient } from 'graphql-request';

const graphQLClient = new GraphQLClient(process.env.GRAPHQL_ENDPOINT, {
  headers: {
    authorization: `Bearer ${process.env.GRAPHQL_TOKEN}`,
  },
});

// Query example
const GET_RIDER_QUERY = gql`
  query GetRider($id: ID\!) {
    rider(id: $id) {
      id
      name
      status
      expenses {
        id
        amount
        status
      }
    }
  }
`;

// Usage
const getRiderData = async (riderId: string) => {
  try {
    const data = await graphQLClient.request(GET_RIDER_QUERY, { id: riderId });
    return data.rider;
  } catch (error) {
    console.error('GraphQL error:', error);
    throw new Error('Failed to fetch rider data');
  }
};
```

## Testing Integrations

### 1. Mock External Services
```typescript
// Mock service for testing
class MockPaymentGateway implements PaymentGateway {
  async processPayment(amount: number): Promise<PaymentResult> {
    // Simulate different scenarios based on amount
    if (amount === 0) {
      return { success: false, error: 'Invalid amount' };
    }
    if (amount > 10000) {
      return { success: false, error: 'Amount too high' };
    }
    return {
      success: true,
      transactionId: `mock_${Date.now()}`,
    };
  }
}

// Dependency injection
const paymentGateway = process.env.NODE_ENV === 'test'
  ? new MockPaymentGateway()
  : new StripeAdapter(process.env.STRIPE_API_KEY);
```

### 2. Integration Test Setup
```typescript
// Integration test example
describe('Payment Integration', () => {
  let paymentService: PaymentService;
  
  beforeEach(() => {
    // Use test API keys
    paymentService = new PaymentService({
      apiKey: process.env.STRIPE_TEST_API_KEY,
      webhookSecret: process.env.STRIPE_TEST_WEBHOOK_SECRET,
    });
  });
  
  it('should process payment successfully', async () => {
    const result = await paymentService.processPayment({
      amount: 100,
      currency: 'AED',
      description: 'Test payment',
    });
    
    expect(result.success).toBe(true);
    expect(result.transactionId).toBeDefined();
  });
  
  it('should handle payment failure', async () => {
    // Use card number that triggers failure
    const result = await paymentService.processPayment({
      amount: 100,
      currency: 'AED',
      cardNumber: '4000000000000002',
    });
    
    expect(result.success).toBe(false);
    expect(result.error).toContain('declined');
  });
});
```

## Monitoring & Logging

### 1. Integration Health Checks
```typescript
// Health check endpoint
app.get('/health/integrations', async (req, res) => {
  const checks = await Promise.allSettled([
    checkFirebase(),
    checkStripe(),
    checkTwilio(),
    checkGoogleMaps(),
  ]);
  
  const results = checks.map((check, index) => ({
    service: ['firebase', 'stripe', 'twilio', 'maps'][index],
    status: check.status === 'fulfilled' ? 'healthy' : 'unhealthy',
    error: check.status === 'rejected' ? check.reason : null,
  }));
  
  const allHealthy = results.every(r => r.status === 'healthy');
  
  res.status(allHealthy ? 200 : 503).json({
    status: allHealthy ? 'healthy' : 'degraded',
    services: results,
    timestamp: new Date().toISOString(),
  });
});
```

### 2. Integration Metrics
```typescript
// Metric collection
class IntegrationMetrics {
  private metrics = new Map<string, Metric>();
  
  recordRequest(service: string, duration: number, success: boolean): void {
    const key = `${service}_${success ? 'success' : 'failure'}`;
    const metric = this.metrics.get(key) || { count: 0, totalDuration: 0 };
    
    metric.count++;
    metric.totalDuration += duration;
    
    this.metrics.set(key, metric);
  }
  
  getMetrics(): IntegrationStats {
    const stats: IntegrationStats = {};
    
    this.metrics.forEach((metric, key) => {
      const [service, status] = key.split('_');
      
      if (\!stats[service]) {
        stats[service] = {
          totalRequests: 0,
          successRate: 0,
          averageLatency: 0,
        };
      }
      
      stats[service].totalRequests += metric.count;
      if (status === 'success') {
        stats[service].successRate = metric.count / stats[service].totalRequests;
      }
      stats[service].averageLatency = metric.totalDuration / metric.count;
    });
    
    return stats;
  }
}
```

## Best Practices Checklist

### Before Integration
- [ ] Evaluate multiple providers
- [ ] Check API rate limits
- [ ] Review pricing structure
- [ ] Test in sandbox environment
- [ ] Plan for migration strategy

### During Integration
- [ ] Use environment variables
- [ ] Implement proper error handling
- [ ] Add comprehensive logging
- [ ] Create integration tests
- [ ] Document configuration

### After Integration
- [ ] Monitor performance
- [ ] Set up alerts
- [ ] Review security
- [ ] Update documentation
- [ ] Train support team

## Common Pitfalls to Avoid

1. **Tight Coupling**
   - Don't import SDKs directly in components
   - Always use service abstractions

2. **Missing Error Handling**
   - Always handle network failures
   - Implement proper fallbacks

3. **Security Issues**
   - Never commit API keys
   - Validate webhook signatures

4. **Performance Problems**
   - Cache API responses
   - Implement request batching

5. **Poor Testing**
   - Test failure scenarios
   - Use sandbox environments
EOF < /dev/null