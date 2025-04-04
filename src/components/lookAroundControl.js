import React, { useEffect, useRef } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import useGameStore from '../store';

const LookAroundControl = () => {
  const { camera, gl } = useThree();
  const isDragging = useRef(false);
  const startX = useRef(0);
  const currentRotation = useRef(0);
  const targetRotation = useRef(0);
  const originalRotation = useRef(new THREE.Euler());
  const originalCameraPosition = useRef(new THREE.Vector3());
  
  // Get mobile state from store
  const isMobile = useGameStore(state => state.isMobile);
  const isMovingCamera = useGameStore(state => state.isMovingCamera);
  const cameraShaking = useGameStore(state => state.cameraShaking);
  
  // NEW: Get item-related state to determine if we should disable look-around
  const currentExperienceIndex = useGameStore(state => state.currentExperienceIndex);
  const experiences = useGameStore(state => state.experienceScript.experiences);
  const itemAnimationPhase = useGameStore(state => state.itemAnimationPhase);
  const showMessageOverlay = useGameStore(state => state.showMessageOverlay);
  
  // Maximum rotation angle in radians (90 degrees = π/2)
  const MAX_ROTATION = Math.PI / 2;
  // Rotation speed factor
  const ROTATION_SENSITIVITY = 0.005;
  // Return to center speed
  const RETURN_SPEED = 0.1;
  
  // Store original camera rotation and position when component mounts
  useEffect(() => {
    originalRotation.current.copy(camera.rotation);
    originalCameraPosition.current.copy(camera.position);
  }, [camera]);

  // Determine if current experience is an item that could be clickable
  const isItemExperience = React.useMemo(() => {
    if (currentExperienceIndex >= 0 && currentExperienceIndex < experiences.length) {
      const experience = experiences[currentExperienceIndex];
      return experience.type === 'item';
    }
    return false;
  }, [currentExperienceIndex, experiences]);

  // NEW: Determine if look-around should be disabled
  const shouldDisableLookAround = React.useMemo(() => {
    // Always disable during camera shaking
    if (cameraShaking.isShaking) return true;
    
    // Disable when item is clickable or being acquired
    if (isItemExperience && (itemAnimationPhase === 'clickable' || itemAnimationPhase === 'acquiring')) {
      return true;
    }
    
    // Disable when message overlay is showing (for better experience)
    if (showMessageOverlay) return true;
    
    // Disable during camera movement
    if (isMovingCamera) return true;
    
    return false;
  }, [cameraShaking.isShaking, isItemExperience, itemAnimationPhase, showMessageOverlay, isMovingCamera]);

  // Set up event listeners
  useEffect(() => {
    if (!isMobile) return; // Only use touch controls on mobile
    
    const handlePointerDown = (event) => {
      // NEW: Skip if look-around should be disabled
      if (shouldDisableLookAround) {
        console.log("Look-around disabled during item interaction");
        return;
      }
      
      // Prevent default to avoid unwanted scrolling or clicking
      event.preventDefault();
      
      isDragging.current = true;
      startX.current = event.clientX || (event.touches && event.touches[0] ? event.touches[0].clientX : 0);
      
      // Remember the current rotation as starting point
      currentRotation.current = targetRotation.current;
    };
    
    const handlePointerMove = (event) => {
      if (!isDragging.current) return;
      
      // NEW: Skip if look-around should be disabled (cancel any in-progress drag)
      if (shouldDisableLookAround) {
        isDragging.current = false;
        return;
      }
      
      // Prevent default to avoid unwanted scrolling
      event.preventDefault();
      
      // Get current X position from the appropriate event property
      const currentX = event.clientX || (event.touches && event.touches[0] ? event.touches[0].clientX : 0);
      
      // Calculate drag distance
      const deltaX = currentX - startX.current;
      
      // Calculate new target rotation (negative deltaX = positive rotation = look right)
      const newRotation = currentRotation.current - deltaX * ROTATION_SENSITIVITY;
      
      // Clamp rotation to limits
      targetRotation.current = Math.max(-MAX_ROTATION, Math.min(MAX_ROTATION, newRotation));
    };
    
    const handlePointerUp = () => {
      isDragging.current = false;
    };
    
    const handleTouchStart = (event) => {
      if (event.touches.length === 1) {
        handlePointerDown({
          preventDefault: () => event.preventDefault(),
          touches: event.touches
        });
      }
    };
    
    const handleTouchMove = (event) => {
      if (event.touches.length === 1) {
        handlePointerMove({
          preventDefault: () => event.preventDefault(),
          touches: event.touches
        });
      }
    };
    
    const handleTouchEnd = () => {
      handlePointerUp();
    };
    
    // Add event listeners
    const canvas = gl.domElement;
    
    // Use non-passive event listeners to allow preventDefault
    const options = { passive: false };
    
    // Mouse events
    canvas.addEventListener('pointerdown', handlePointerDown, options);
    window.addEventListener('pointermove', handlePointerMove, options);
    window.addEventListener('pointerup', handlePointerUp);
    
    // Touch events
    canvas.addEventListener('touchstart', handleTouchStart, options);
    window.addEventListener('touchmove', handleTouchMove, options);
    window.addEventListener('touchend', handleTouchEnd);
    
    // Cleanup
    return () => {
      canvas.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      
      canvas.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [gl, isMobile, shouldDisableLookAround]);
  
  // Handle the camera rotation in animation frame
  useFrame((state, delta) => {
    // Skip if camera is shaking
    if (cameraShaking.isShaking) {
      // Reset target rotation when camera is shaking
      targetRotation.current = 0;
      return;
    }
    
    // NEW: If look-around should be disabled, gradually return to center
    if (shouldDisableLookAround) {
      targetRotation.current *= (1 - RETURN_SPEED * 2); // Faster return to center
    }
    // If not dragging, gradually return to center
    else if (!isDragging.current && Math.abs(targetRotation.current) > 0.01) {
      targetRotation.current *= (1 - RETURN_SPEED);
    }
    
    // Apply rotation to Y axis only
    // Preserve the original X and Z rotation
    const newRotationY = originalRotation.current.y + targetRotation.current;
    camera.rotation.y = newRotationY;
  });
  
  // No visual component
  return null;
};

export default React.memo(LookAroundControl);