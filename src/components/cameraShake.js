import React, { useRef, useEffect } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import useGameStore from '../store';

const CameraShake = () => {
  const { camera, invalidate } = useThree();
  // Store both original position and rotation
  const originalPosition = useRef(new THREE.Vector3());
  const originalRotation = useRef(new THREE.Euler());
  const shakeConfig = useRef({
    intensity: 0,
    decay: 0.9,
    maxOffset: 0.2,
    duration: 0, // Current duration counter
    maxDuration: 0, // Total duration to shake for
    isActive: false,
    onComplete: null
  });

  // Get camera shake state from store
  const cameraShaking = useGameStore(state => state.cameraShaking);
  const stopCameraShake = useGameStore(state => state.stopCameraShake);

  // Store original camera position when shake starts
  useEffect(() => {
    if (cameraShaking.isShaking && !shakeConfig.current.isActive) {
      // Store original camera position AND rotation
      originalPosition.current.copy(camera.position);
      originalRotation.current.copy(camera.rotation);
      
      // Set shake configuration
      shakeConfig.current = {
        intensity: cameraShaking.intensity || 0.5,
        decay: cameraShaking.decay || 0.92,
        maxOffset: cameraShaking.maxOffset || 0.3,
        duration: 0,
        maxDuration: cameraShaking.duration || 3000, // Default 3 seconds
        isActive: true,
        onComplete: cameraShaking.onComplete
      };
    }
  }, [cameraShaking, camera]);

  // Handle the camera shake animation
  useFrame((state, delta) => {
    if (shakeConfig.current.isActive) {
      // Convert delta to milliseconds (assumes 60fps)
      const deltaMs = delta * 1000;
      
      // Update duration counter
      shakeConfig.current.duration += deltaMs;
      
      // Calculate intensity based on progress
      let currentIntensity = shakeConfig.current.intensity;
      
      // If we're past 80% of the shake duration, start reducing intensity more quickly
      if (shakeConfig.current.duration > shakeConfig.current.maxDuration * 0.8) {
        const remainingPortion = 1 - ((shakeConfig.current.duration - (shakeConfig.current.maxDuration * 0.8)) / 
                                      (shakeConfig.current.maxDuration * 0.2));
        currentIntensity = currentIntensity * remainingPortion;
      }
      
      // Generate random offsets based on intensity
      const offsetX = (Math.random() * 2 - 1) * currentIntensity * shakeConfig.current.maxOffset;
      const offsetY = (Math.random() * 2 - 1) * currentIntensity * shakeConfig.current.maxOffset;
      const offsetZ = (Math.random() * 2 - 1) * currentIntensity * shakeConfig.current.maxOffset;
      
      // Apply offsets to camera position
      camera.position.set(
        originalPosition.current.x + offsetX,
        originalPosition.current.y + offsetY,
        originalPosition.current.z + offsetZ
      );
      
      // Add subtle camera rotation shake for more impact
      // Make a temporary copy of original rotation to avoid accumulating rotation
      const tempRotation = originalRotation.current.clone();
      
      // Apply random rotation offsets to the original rotation
      const rotationIntensity = currentIntensity * 0.04; // Subtle rotation shake
      tempRotation.x += (Math.random() * 2 - 1) * rotationIntensity;
      tempRotation.z += (Math.random() * 2 - 1) * rotationIntensity;
      
      // Set camera rotation from our modified original rotation
      camera.rotation.copy(tempRotation);
      
      // Force a render update
      invalidate();
      
      // Check if shake duration has elapsed
      if (shakeConfig.current.duration >= shakeConfig.current.maxDuration) {
        // Reset camera to original position
        camera.position.copy(originalPosition.current);
        
        // Reset camera to the exact original rotation
        camera.rotation.copy(originalRotation.current);
        
        invalidate();
        
        // Reset shake config
        shakeConfig.current.isActive = false;
        
        // Notify store that shaking has completed
        stopCameraShake();
        
        // Call onComplete callback if provided
        if (typeof shakeConfig.current.onComplete === 'function') {
          shakeConfig.current.onComplete();
        }
      }
    }
  });

  // This component doesn't render anything
  return null;
};

export default CameraShake;