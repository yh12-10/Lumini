
import { useEffect, useRef, useCallback } from 'react';

export const useInactivity = (timeout: number = 1800000) => { // Default 30 mins
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const onInactive = useCallback(() => {
    // Reload to refresh state and clear memory
    window.location.reload();
  }, []);

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(onInactive, timeout);
  }, [timeout, onInactive]);

  useEffect(() => {
    // Events that indicate activity
    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'];
    
    // Throttled handler to prevent performance issues
    let lastTrigger = 0;
    const handleEvent = () => {
      const now = Date.now();
      if (now - lastTrigger > 1000) { // Only reset once per second max
        resetTimer();
        lastTrigger = now;
      }
    };

    events.forEach(event => document.addEventListener(event, handleEvent, { passive: true }));
    resetTimer(); // Initialize

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      events.forEach(event => document.removeEventListener(event, handleEvent));
    };
  }, [resetTimer]);
};
