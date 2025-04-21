import React, { useRef, useEffect, useState } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import useGameStore from '../store';
import MessageService from '../utils/messageService';
import { trackPortalEntry } from '../utils/GoogleAnalytics';

// Constants for player movement
const INITIAL_POSITION_MULTIPLIER = 1;
const PLAYER_HEIGHT = 2;
const MOVEMENT_THRESHOLD = 0.1;
const BOBBING_SCALE = 0.05;
const BOB_RESET_FACTOR = 0.8;
const BOB_MINIMUM = 0.001;

const Player = () => {
  const { camera, gl, scene, invalidate } = useThree();
  const playerRef = useRef();
  const [initialized, setInitialized] = useState(false);
  
  // Head bobbing state
  const headBobRef = useRef({ timer: 0, bobHeight: 0 });
  
  // Create a ref for fade animation timing
  const fadeStartTimeRef = useRef(null);
  
  // Get state from the store
  const {
    tileSize,
    setPlayerPosition,
    sceneLoaded,
    isMovingCamera,
    targetCameraPosition,
    moveSpeed,
    stopCameraMovement,
    cameraShaking,
    movingToDoor,
    doorPosition,
    fadingToBlack,
    updateBlackScreenOpacity,
    startFadeToBlack,
    experienceScript: { experiences }
  } = useGameStore();
  
  // Set up initial position
  useEffect(() => {
    if (!playerRef.current || initialized) return;
    
    const initialPosition = INITIAL_POSITION_MULTIPLIER * tileSize;
    
    // Set player position and rotation
    playerRef.current.position.set(initialPosition, PLAYER_HEIGHT, initialPosition);
    playerRef.current.rotation.set(0, Math.PI, 0);
    
    // Set camera position and rotation
    camera.position.set(initialPosition, PLAYER_HEIGHT, initialPosition);
    camera.rotation.set(0, Math.PI, 0);
    
    // Explicitly tell Three.js to update matrices
    playerRef.current.updateMatrixWorld();
    camera.updateMatrixWorld();
    
    // Force a render
    invalidate();
    
    // Mark as initialized
    setInitialized(true);
    
    // Update position in store
    setPlayerPosition({
      x: initialPosition,
      y: PLAYER_HEIGHT,
      z: initialPosition
    });
  }, [camera, tileSize, setPlayerPosition, initialized, invalidate]);
  
  // Force render when scene is loaded
  useEffect(() => {
    if (sceneLoaded && initialized) {
      gl.render(scene, camera);
      invalidate();
    }
  }, [sceneLoaded, initialized, gl, scene, camera, invalidate]);
  
  // Handle camera movement and head bobbing
  useFrame((state, delta) => {
    if (!playerRef.current || !initialized) return;
    
    // Don't process movement if camera is shaking
    if (cameraShaking.isShaking) return;
    
    // Handle door movement when door is clicked
    if (movingToDoor && doorPosition) {
      const currentPos = playerRef.current.position.clone();
      
      // Calculate vector to door - with 2 units earlier detection
      const targetPos = new THREE.Vector3(
        doorPosition.x,
        currentPos.y,
        doorPosition.z - 4 // Trigger 2 units before the actual door position
      );
      
      // Calculate distance to modified target position
      const distanceVector = targetPos.clone().sub(currentPos);
      const distance = distanceVector.length();
      
      // Move if not at adjusted position yet
      if (distance > 0.1) {
        // Calculate direction vector
        const direction = distanceVector.normalize();
        
        // Update head bob timer and effects
        headBobRef.current.timer += delta * 10;
        const bobAmount = Math.sin(headBobRef.current.timer) * BOBBING_SCALE;
        headBobRef.current.bobHeight = bobAmount;
        
        // Calculate movement step
        const step = Math.min(moveSpeed * 1.5, distance); // Move faster toward door
        
        // Apply movement in the direction of the door
        playerRef.current.position.add(direction.multiplyScalar(step));
        
        // Update camera position with head bob
        camera.position.set(
          playerRef.current.position.x,
          playerRef.current.position.y + bobAmount,
          playerRef.current.position.z
        );
        
        // Update store
        setPlayerPosition({
          x: playerRef.current.position.x,
          y: playerRef.current.position.y,
          z: playerRef.current.position.z
        });
        
        // Force render
        invalidate();
      } 
      else if (!fadingToBlack) {
        // Player has reached the adjusted position before the door, set portalEntered to true
        useGameStore.getState().setPortalEntered(true);
        // Start fade to white
        startFadeToBlack();
        fadeStartTimeRef.current = performance.now();
        
        // Track portal entry in Google Analytics
        trackPortalEntry();
      }
    }
      
    // Handle fade to black animation
    if (fadingToBlack && fadeStartTimeRef.current) {
      const elapsed = performance.now() - fadeStartTimeRef.current;
      // Much shorter fade duration when entering portal (500ms instead of 2000ms)
      const fadeDuration = useGameStore.getState().portalEntered ? 500 : 2000; 
      
      // Calculate opacity (0 to 1)
      const newOpacity = Math.min(1, elapsed / fadeDuration);
      updateBlackScreenOpacity(newOpacity);
      
      // Force render
      invalidate();
    }
      
    // Handle camera movement to target position
    if (isMovingCamera && targetCameraPosition) {
      handleCameraMovement(delta);
    } else {
      handleHeadBobReset();
    }
  });

  // Handle camera movement to target position
  const handleCameraMovement = (delta) => {
    const currentPos = playerRef.current.position.clone();
    const targetPos = new THREE.Vector3(
      currentPos.x,  // Keep X position constant
      targetCameraPosition.y,
      targetCameraPosition.z
    );
    
    // Calculate distance to target (only in Z direction)
    const distance = Math.abs(targetPos.z - currentPos.z);
    
    // Move if not at destination
    if (distance > MOVEMENT_THRESHOLD) {
      // Update the head bob timer when moving
      headBobRef.current.timer += delta * 10; // Control bob speed
      
      // Calculate the bobbing using a sine wave
      const bobAmount = Math.sin(headBobRef.current.timer) * BOBBING_SCALE;
      headBobRef.current.bobHeight = bobAmount;
      
      // Use constant movement speed regardless of distance
      const step = Math.min(moveSpeed, distance);
      
      // Always move POSITIVE Z direction (up the track)
      playerRef.current.position.z += step;
      
      // Apply position to camera with head bob offset
      camera.position.set(
        playerRef.current.position.x,
        playerRef.current.position.y + bobAmount,
        playerRef.current.position.z
      );
      
      // Update position in store (without the bob height)
      setPlayerPosition({
        x: playerRef.current.position.x,
        y: playerRef.current.position.y,
        z: playerRef.current.position.z
      });
      
      // Force a render
      invalidate();
    } else {
      // Snap to exact position when close enough
      playerRef.current.position.z = targetPos.z;
      camera.position.z = targetPos.z;
      
      // Reset head bob
      headBobRef.current.bobHeight = 0;
      // Stop movement
      stopCameraMovement();
      // Update position in store
      setPlayerPosition({
        x: playerRef.current.position.x,
        y: playerRef.current.position.y,
        z: targetPos.z
      });
      
      handleExperienceTrigger();
      
      // Force a render
      invalidate();
    }
  };
  
  // Handle resetting head bob when not moving
  const handleHeadBobReset = () => {
    // When not moving, smoothly reset any remaining head bob
    if (Math.abs(headBobRef.current.bobHeight) > BOB_MINIMUM) {
      // Reduce bob height gradually
      headBobRef.current.bobHeight *= BOB_RESET_FACTOR;
      
      // Apply diminishing head bob to camera only
      camera.position.y = playerRef.current.position.y + headBobRef.current.bobHeight;
      
      // Force a render
      invalidate();
    } else if (headBobRef.current.bobHeight !== 0) {
      // Reset to exactly zero when very small
      headBobRef.current.bobHeight = 0;
      camera.position.y = playerRef.current.position.y;
      
      // Force a render
      invalidate();
    } else {
      // Ensure camera and player are in sync when not shaking
      if (!cameraShaking.isShaking) {
        camera.position.copy(playerRef.current.position);
      }
    }
  };
  
  // Handle triggering appropriate experience events when reaching destination
  const handleExperienceTrigger = () => {
    const store = useGameStore.getState();
    const experienceIndex = store.currentExperienceIndex;
    
    if (experienceIndex >= 0 && experienceIndex < experiences.length) {
      const currentExperience = experiences[experienceIndex];
      
      // Handle different experience types
      if (currentExperience.type === 'item') {
        // Check if this is the sword experience
        const isSwordExperience = currentExperience.item.name === "Toy Wooden Sword";
        
        // Show the item text after a short delay
        setTimeout(() => {
          // Use the MessageService with appropriate options
          const options = {
            preserveItemVisibility: true,
            forceSwordVisibility: isSwordExperience
          };
          
          MessageService.showMessage(currentExperience.item.text, options);
        }, 100);
      } else if (currentExperience.type === 'shake') {
        // Start the camera shake
        store.startCameraShake(
          currentExperience.shakeConfig,
          () => {
            // After shake completes, show the message using MessageService
            setTimeout(() => {
              MessageService.showMessage(currentExperience.shakeConfig.message, {
                preserveItemVisibility: true
              });
            }, 500);
          }
        );
      }
    }
  };

  return (
    <mesh 
      ref={playerRef} 
      position={[INITIAL_POSITION_MULTIPLIER * tileSize, PLAYER_HEIGHT, tileSize]}
      onUpdate={() => invalidate()}
    >
      <boxGeometry args={[1, PLAYER_HEIGHT, 1]} />
      <meshStandardMaterial color="orange" transparent opacity={0.0} />
    </mesh>
  );
};

export default React.memo(Player);