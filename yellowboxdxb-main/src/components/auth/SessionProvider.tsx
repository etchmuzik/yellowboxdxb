import { ReactNode } from 'react';
import { useSessionTimeout } from '@/hooks/use-session-timeout';

export function SessionProvider({ children }: { children: ReactNode }) {
  // Initialize session timeout management
  useSessionTimeout();
  
  return <>{children}</>;
}