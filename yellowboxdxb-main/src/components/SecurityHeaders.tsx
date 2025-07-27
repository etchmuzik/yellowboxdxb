import { Helmet } from 'react-helmet';
import { getSecurityMetaTags } from '@/middleware/securityHeaders';
import { env } from '@/config/environment';

export function SecurityHeaders() {
  const metaTags = getSecurityMetaTags();

  return (
    <Helmet>
      {metaTags.map((tag, index) => (
        <meta key={index} httpEquiv={tag.name} content={tag.content} />
      ))}
      
      {/* Additional security-related meta tags */}
      <meta name="referrer" content="strict-origin-when-cross-origin" />
      
      {/* Disable browser features that might be security risks */}
      <meta httpEquiv="Permissions-Policy" content="camera=(), microphone=(), payment=(), usb=()" />
      
      {/* DNS prefetch for performance */}
      <link rel="dns-prefetch" href={`https://${env.firebase.authDomain}`} />
      <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
      <link rel="dns-prefetch" href="https://fonts.gstatic.com" />
      
      {/* Preconnect for critical domains */}
      <link rel="preconnect" href={`https://${env.firebase.authDomain}`} crossOrigin="anonymous" />
      <link rel="preconnect" href="https://firestore.googleapis.com" crossOrigin="anonymous" />
      <link rel="preconnect" href="https://identitytoolkit.googleapis.com" crossOrigin="anonymous" />
    </Helmet>
  );
}