import { useEffect, useRef, useState } from "react";

type UseInactivityMonitorOptions = {
  timeout: number; // milliseconds
  onInactive: () => void;
  onActive?: () => void; // Called when user becomes active again after being inactive
  enabled?: boolean;
};

/**
 * Hook to monitor user inactivity (no mouse movement or clicks)
 * Triggers callback after specified timeout of inactivity
 */
export const useInactivityMonitor = ({
  timeout,
  onInactive,
  onActive,
  enabled = true,
}: UseInactivityMonitorOptions) => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isActive, setIsActive] = useState(true);
  const wasInactiveRef = useRef(false);
  
  // Store callbacks in refs to avoid recreating the effect
  const onInactiveRef = useRef(onInactive);
  const onActiveRef = useRef(onActive);
  const enabledRef = useRef(enabled);

  // Update refs when callbacks change
  useEffect(() => {
    onInactiveRef.current = onInactive;
    onActiveRef.current = onActive;
    enabledRef.current = enabled;
  }, [onInactive, onActive, enabled]);

  const resetTimer = () => {
    if (!enabledRef.current) {
      // Clear timer if disabled
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      return;
    }

    // Don't trigger onActive - we want the bubble to stay visible
    // Only reset the inactive state if it was set
    if (wasInactiveRef.current) {
      wasInactiveRef.current = false;
      // Optionally call onActive if provided, but don't use it to hide bubble
      if (onActiveRef.current) {
        onActiveRef.current();
      }
    }

    setIsActive(true);
    
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout
    timeoutRef.current = setTimeout(() => {
      setIsActive(false);
      wasInactiveRef.current = true;
      if (onInactiveRef.current) {
        onInactiveRef.current();
      }
    }, timeout);
  };

  useEffect(() => {
    // Clear any existing timer when enabled state changes
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    if (!enabled) {
      // If disabled, reset inactive state
      wasInactiveRef.current = false;
      setIsActive(true);
      return;
    }

    // Reset timer on any user activity
    const handleActivity = () => {
      resetTimer();
    };

    // Listen to mouse movement, clicks, keyboard, and scroll
    window.addEventListener("mousemove", handleActivity, { passive: true });
    window.addEventListener("mousedown", handleActivity, { passive: true });
    window.addEventListener("keydown", handleActivity, { passive: true });
    window.addEventListener("scroll", handleActivity, { passive: true, capture: true });
    window.addEventListener("touchstart", handleActivity, { passive: true });

    // Start the timer
    resetTimer();

    // Cleanup
    return () => {
      window.removeEventListener("mousemove", handleActivity);
      window.removeEventListener("mousedown", handleActivity);
      window.removeEventListener("keydown", handleActivity);
      window.removeEventListener("scroll", handleActivity, true);
      window.removeEventListener("touchstart", handleActivity);
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [enabled, timeout]); // Only depend on enabled and timeout, not callbacks

  return { isActive };
};
