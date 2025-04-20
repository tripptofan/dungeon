import { useEffect } from 'react';

// A simple global FPS limiter that throttles requestAnimationFrame
const SimpleFpsLimiter = ({ targetFps = 60 }) => {
  useEffect(() => {
    // Only patch in browser environments
    if (typeof window === 'undefined') return;
  
    
    // Get original methods we need to patch
    const originalRAF = window.requestAnimationFrame;
    const originalCAF = window.cancelAnimationFrame;
    
    // Track time and request IDs
    let lastTimestamp = 0;
    const targetFrameTime = 1000 / targetFps;
    const pendingTimeouts = new Map();
    
    // Replacement for requestAnimationFrame
    const throttledRAF = (callback) => {
      const now = performance.now();
      const timeElapsed = now - lastTimestamp;
      
      // If we haven't reached our frame budget yet, delay the callback
      if (timeElapsed < targetFrameTime) {
        const timeToWait = targetFrameTime - timeElapsed;
        
        // Generate a unique ID for this request
        const timeoutId = setTimeout(() => {
          // When the timeout runs, update our timestamp
          lastTimestamp = performance.now();
          
          // Remove from pending timeouts map
          pendingTimeouts.delete(timeoutId);
          
          // Call the callback with the current timestamp
          callback(lastTimestamp);
        }, timeToWait);
        
        // Save the mapping for potential cancellation
        pendingTimeouts.set(timeoutId, timeoutId);
        return timeoutId;
      }
      
      // If we're already past our frame budget, run immediately
      lastTimestamp = now;
      return originalRAF(callback);
    };
    
    // Replacement for cancelAnimationFrame
    const throttledCAF = (id) => {
      // Check if this is a timeout we're managing
      if (pendingTimeouts.has(id)) {
        clearTimeout(id);
        pendingTimeouts.delete(id);
        return;
      }
      
      // Otherwise, pass through to original
      return originalCAF(id);
    };
    
    // Replace the browser functions
    window.requestAnimationFrame = throttledRAF;
    window.cancelAnimationFrame = throttledCAF;
    
    // Clean up when the component unmounts
    return () => {

      window.requestAnimationFrame = originalRAF;
      window.cancelAnimationFrame = originalCAF;
      
      // Clear any pending timeouts
      pendingTimeouts.forEach((id) => {
        clearTimeout(id);
      });
    };
  }, [targetFps]);
  
  return null;
};

export default SimpleFpsLimiter;