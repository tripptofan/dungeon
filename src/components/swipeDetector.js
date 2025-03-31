import { useEffect } from "react";
import useGameStore from "../store";

// Component to detect swipe gestures and trigger sword swinging
const SwipeDetector = () => {
  const startSwordSwing = useGameStore(state => state.startSwordSwing);
  const hasSword = useGameStore(state => 
    state.inventory.some(item => item.name === "Toy Wooden Sword")
  );
  const showOverlay = useGameStore(state => 
    state.showMessageOverlay || state.showActionOverlay
  );
  const swordSwinging = useGameStore(state => state.swordSwinging);
  
  useEffect(() => {
    // Touch tracking variables
    let touchStartX = 0;
    let touchStartY = 0;
    let touchEndX = 0;
    let touchEndY = 0;
    let isTouching = false;
    let minSwipeDistance = 50; // Minimum distance to trigger a swipe
    
    // Mouse tracking variables
    let mouseStartX = 0;
    let mouseStartY = 0;
    let mouseEndX = 0;
    let mouseEndY = 0;
    let isMouseDown = false;
    
    // Touch handlers
    const handleTouchStart = (e) => {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
      isTouching = true;
    };
    
    const handleTouchMove = (e) => {
      if (!isTouching) return;
      touchEndX = e.touches[0].clientX;
      touchEndY = e.touches[0].clientY;
    };
    
    const handleTouchEnd = (e) => {
      if (!isTouching) return;
      isTouching = false;
      
      // Calculate swipe distance and direction
      const deltaX = touchEndX - touchStartX;
      const deltaY = touchEndY - touchStartY;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      
      // Only trigger if it's a significant swipe
      if (distance >= minSwipeDistance) {
        // Don't start swing if showing overlay or already swinging
        if (!showOverlay && hasSword && !swordSwinging) {
          startSwordSwing({ x: deltaX, y: deltaY });
        }
      }
    };
    
    // Mouse handlers (for desktop testing)
    const handleMouseDown = (e) => {
      mouseStartX = e.clientX;
      mouseStartY = e.clientY;
      isMouseDown = true;
    };
    
    const handleMouseMove = (e) => {
      if (!isMouseDown) return;
      mouseEndX = e.clientX;
      mouseEndY = e.clientY;
    };
    
    const handleMouseUp = (e) => {
      if (!isMouseDown) return;
      isMouseDown = false;
      
      // Calculate swipe distance and direction
      const deltaX = mouseEndX - mouseStartX;
      const deltaY = mouseEndY - mouseStartY;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      
      // Only trigger if it's a significant swipe
      if (distance >= minSwipeDistance) {
        // Don't start swing if showing overlay or already swinging
        if (!showOverlay && hasSword && !swordSwinging) {
          startSwordSwing({ x: deltaX, y: deltaY });
        }
      }
    };
    
    // Add event listeners
    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: true });
    document.addEventListener('touchend', handleTouchEnd);
    
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    // Clean up
    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
      
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [hasSword, showOverlay, swordSwinging, startSwordSwing]);
  
  // This component doesn't render anything
  return null;
};

export default SwipeDetector;