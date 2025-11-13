import { useEffect, useRef, useState } from 'react';
import { useAuth } from './use-auth';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { logAuthActivity } from '@/services/activityService';

const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
const WARNING_TIME = 5 * 60 * 1000; // 5 minutes before timeout
const STORAGE_KEY = 'lastActivityTime';

export function useSessionTimeout() {
  const { logout, isAuthenticated, currentUser } = useAuth();
  const navigate = useNavigate();
  const [showWarning, setShowWarning] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const warningRef = useRef<NodeJS.Timeout>();

  // Update last activity time
  const updateActivity = () => {
    if (isAuthenticated) {
      localStorage.setItem(STORAGE_KEY, Date.now().toString());
      resetTimers();
    }
  };

  // Reset timeout timers
  const resetTimers = () => {
    // Clear existing timers
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (warningRef.current) clearTimeout(warningRef.current);
    setShowWarning(false);

    // Set warning timer
    warningRef.current = setTimeout(() => {
      setShowWarning(true);
      toast.warning('Session Expiring Soon', {
        description: 'Your session will expire in 5 minutes due to inactivity.',
        duration: 10000,
        action: {
          label: 'Stay Logged In',
          onClick: () => {
            updateActivity();
            toast.success('Session extended');
          }
        }
      });
    }, SESSION_TIMEOUT - WARNING_TIME);

    // Set logout timer
    timeoutRef.current = setTimeout(async () => {
      if (currentUser) {
        await logAuthActivity('logout', currentUser.id, currentUser.email);
      }
      await logout();
      navigate('/login');
      toast.error('Session Expired', {
        description: 'You have been logged out due to inactivity.',
      });
    }, SESSION_TIMEOUT);
  };

  // Setup activity listeners
  useEffect(() => {
    if (!isAuthenticated) return;

    // Events that reset the timer
    const events = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
      'click',
    ];

    // Throttle activity updates to once per minute
    let lastUpdate = 0;
    const throttledUpdate = () => {
      const now = Date.now();
      if (now - lastUpdate > 60000) { // 1 minute
        lastUpdate = now;
        updateActivity();
      }
    };

    // Add event listeners
    events.forEach(event => {
      document.addEventListener(event, throttledUpdate);
    });

    // Check for existing session on mount
    const lastActivity = localStorage.getItem(STORAGE_KEY);
    if (lastActivity) {
      const timeSinceActivity = Date.now() - parseInt(lastActivity);
      if (timeSinceActivity > SESSION_TIMEOUT) {
        // Session already expired
        logout();
        navigate('/login');
        toast.error('Session Expired', {
          description: 'Your previous session has expired.',
        });
      } else {
        // Resume session
        resetTimers();
      }
    } else {
      // New session
      updateActivity();
    }

    // Handle visibility change (tab switching)
    const handleVisibilityChange = () => {
      if (!document.hidden && isAuthenticated) {
        const lastActivity = localStorage.getItem(STORAGE_KEY);
        if (lastActivity) {
          const timeSinceActivity = Date.now() - parseInt(lastActivity);
          if (timeSinceActivity > SESSION_TIMEOUT) {
            logout();
            navigate('/login');
            toast.error('Session Expired', {
              description: 'Your session expired while you were away.',
            });
          }
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, throttledUpdate);
      });
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (warningRef.current) clearTimeout(warningRef.current);
    };
  }, [isAuthenticated, currentUser, logout, navigate]);

  // Clear activity on logout
  useEffect(() => {
    if (!isAuthenticated) {
      localStorage.removeItem(STORAGE_KEY);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (warningRef.current) clearTimeout(warningRef.current);
      setShowWarning(false);
    }
  }, [isAuthenticated]);

  return {
    showWarning,
    extendSession: updateActivity
  };
}