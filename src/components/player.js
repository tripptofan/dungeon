import React, { useRef, useEffect, useState } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import useGameStore from '../store';
import MessageService from '../utils/messageService';

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
  const headBobRef = useRef({
    timer: 0,
    bobHeight: 0,
  });
  
  // Get state from the store
  const tileSize = useGameStore(state => state.tileSize);
  const setPlayerPosition = useGameStore(state => state.setPlayerPosition);
  const sceneLoaded = useGameStore(state => state.sceneLoaded);
  const isMovingCamera = useGameStore(state => state.isMovingCamera);
  const targetCameraPosition = useGameStore(state => state.targetCameraPosition);
  const moveSpeed = useGameStore(state => state.moveSpeed);
  const stopCameraMovement = useGameStore(state => state.stopCameraMovement);
  const cameraShaking = useGameStore(state => state.cameraShaking);
  
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
    
    // Handle camera movement to target position
    if (isMovingCamera && targetCameraPosition) {
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
        const zMovement = step;
        playerRef.current.position.z += zMovement;
        
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
        
        // Get current experience data
        const experienceIndex = useGameStore.getState().currentExperienceIndex;
        const experiences = useGameStore.getState().experienceScript.experiences;
        
        if (experienceIndex >= 0 && experienceIndex < experiences.length) {
          const currentExperience = experiences[experienceIndex];
          
          // IMPROVED: Block all item clicks and set animation phase to 'hidden'
          // This ensures items cannot be acquired before their message overlay
          if (currentExperience.type === 'item') {
            useGameStore.getState().setBlockItemClicks(true);
            useGameStore.getState().setItemAnimationPhase('hidden');
            
            console.log("Arrived at item experience - disabling item clicks until message dismissed");
          }
          
          // Handle different experience types
          if (currentExperience.type === 'item') {
            // IMPORTANT: Force acquired items to remain visible at all times
            const inventory = useGameStore.getState().inventory;
            const isSwordExperience = currentExperience.item.name === "Toy Wooden Sword";
            
            // For item experiences, show the item text
            setTimeout(() => {
              // Use the MessageService instead of direct store actions
              const options = {
                preserveItemVisibility: true,
                forceSwordVisibility: isSwordExperience
              };
              
              MessageService.showMessage(currentExperience.item.text, options);
            }, 100); // Very short delay for better feel
          } else if (currentExperience.type === 'shake') {
            // Start the camera shake
            useGameStore.getState().startCameraShake(
              currentExperience.shakeConfig,
              () => {
                // After shake completes, show the message using MessageService
                setTimeout(() => {
                  MessageService.showMessage(currentExperience.shakeConfig.message, {
                    preserveItemVisibility: true
                  });
                }, 500); // Short delay after shake completes
              }
            );
          } else if (currentExperience.type === 'enemy') {
            // Block clicks on the enemy until message is shown and dismissed
            useGameStore.getState().setEnemyClickable(false);
            
            // Show enemy message
            setTimeout(() => {
              MessageService.showEnemyMessage();
            }, 100);
          } else if (currentExperience.type === 'chest') {
            // Show chest message
            setTimeout(() => {
              MessageService.showChestMessage();
            }, 100);
          }
        }
        
        // Force a render
        invalidate();
      }
    } else {
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
    }
  });

  return (
    <mesh 
      ref={playerRef} 
      position={[INITIAL_POSITION_MULTIPLIER * tileSize, PLAYER_HEIGHT, tileSize]}
      onUpdate={() => invalidate()}
    >
      <boxGeometry args={[1, PLAYER_HEIGHT, 1]} />
      <meshStandardMaterial color="orange" transparent opacity={0.0} /> {/* Make player invisible */}
    </mesh>
  );
};

export default React.memo(Player);