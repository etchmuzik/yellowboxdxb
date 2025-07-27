import { env, isProduction } from '@/config/environment';

export interface SecurityHeaders {
  [key: string]: string;
}

export function generateSecurityHeaders(): SecurityHeaders {
  const headers: SecurityHeaders = {
    // Prevent clickjacking attacks
    'X-Frame-Options': 'DENY',
    
    // Prevent MIME type sniffing
    'X-Content-Type-Options': 'nosniff',
    
    // Enable browser XSS protection
    'X-XSS-Protection': '1; mode=block',
    
    // Control referrer information
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    
    // Permissions Policy (formerly Feature Policy)
    'Permissions-Policy': [
      'camera=()',
      'microphone=()',
      'payment=()',
      'usb=()',
      'geolocation=(self)',
      'accelerometer=()',
      'gyroscope=()'
    ].join(', '),
  };

  // HSTS (HTTP Strict Transport Security) - only in production
  if (isProduction && env.security.httpsRedirect) {
    headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains; preload';
  }

  return headers;
}

export function generateCSP(): string {
  const cspDirectives: Record<string, string[]> = {
    'default-src': ["'self'"],
    
    'script-src': [
      "'self'",
      "'unsafe-inline'", // Required for Vite in dev, should be removed in production with nonce
      "'unsafe-eval'", // Required for some libraries, try to remove
      'https://apis.google.com',
      'https://www.gstatic.com',
      'https://www.googletagmanager.com',
      'https://www.google-analytics.com',
      'https://*.firebaseapp.com',
      'https://*.firebaseio.com',
      env.sentry?.dsn ? 'https://*.sentry.io' : '',
    ].filter(Boolean),
    
    'style-src': [
      "'self'",
      "'unsafe-inline'", // Required for styled components
      'https://fonts.googleapis.com',
    ],
    
    'font-src': [
      "'self'",
      'https://fonts.gstatic.com',
      'data:',
    ],
    
    'img-src': [
      "'self'",
      'data:',
      'blob:',
      'https://*.googleapis.com',
      'https://*.gstatic.com',
      'https://*.firebasestorage.googleapis.com',
      'https://maps.googleapis.com',
      'https://maps.gstatic.com',
    ],
    
    'connect-src': [
      "'self'",
      'https://*.googleapis.com',
      'https://*.firebaseapp.com',
      'https://*.firebaseio.com',
      'https://identitytoolkit.googleapis.com',
      'https://securetoken.googleapis.com',
      'https://firebasestorage.googleapis.com',
      'https://firestore.googleapis.com',
      'https://www.google-analytics.com',
      'https://maps.googleapis.com',
      'wss://*.firebaseio.com',
      env.sentry?.dsn ? 'https://*.sentry.io' : '',
      env.firebase.functionsUrl || '',
    ].filter(Boolean),
    
    'frame-src': [
      "'self'",
      'https://*.firebaseapp.com',
    ],
    
    'object-src': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
    'frame-ancestors': ["'none'"],
    'upgrade-insecure-requests': isProduction ? [''] : [],
  };

  // Add report URI if configured
  if (env.security.cspReportUri) {
    cspDirectives['report-uri'] = [env.security.cspReportUri];
  }

  // Generate CSP string
  return Object.entries(cspDirectives)
    .filter(([_, values]) => values.length > 0)
    .map(([directive, values]) => `${directive} ${values.join(' ')}`)
    .join('; ');
}

// For use with meta tags in HTML
export function getSecurityMetaTags(): Array<{ name: string; content: string }> {
  const tags = [];

  if (env.security.enableCSP) {
    tags.push({
      name: 'Content-Security-Policy',
      content: generateCSP(),
    });
  }

  return tags;
}

// For Firebase Hosting headers configuration
export function getFirebaseHostingHeaders(): Array<{ source: string; headers: Array<{ key: string; value: string }> }> {
  const securityHeaders = generateSecurityHeaders();
  const headers = Object.entries(securityHeaders).map(([key, value]) => ({ key, value }));

  if (env.security.enableCSP) {
    headers.push({
      key: 'Content-Security-Policy',
      value: generateCSP(),
    });
  }

  return [
    {
      source: '**',
      headers,
    },
    {
      source: '**/*.@(js|css|map)',
      headers: [
        {
          key: 'Cache-Control',
          value: 'public, max-age=31536000, immutable',
        },
      ],
    },
    {
      source: '**/*.@(jpg|jpeg|gif|png|svg|webp|ico)',
      headers: [
        {
          key: 'Cache-Control',
          value: 'public, max-age=86400',
        },
      ],
    },
  ];
}