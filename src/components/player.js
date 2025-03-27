import React, { useRef, useEffect, useState } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import useGameStore from '../store';

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
  
  // Set up initial position
  useEffect(() => {
    if (!playerRef.current || initialized) return;
    
    console.log("Initializing player position");
    const initialPosition = 1 * tileSize;
    
    // Set player position and rotation
    playerRef.current.position.set(initialPosition, 2, initialPosition);
    playerRef.current.rotation.set(0, Math.PI, 0);
    
    // Set camera position and rotation
    camera.position.set(initialPosition, 2, initialPosition);
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
      y: 2,
      z: initialPosition
    });
  }, [camera, tileSize, setPlayerPosition, initialized, invalidate]);
  
  // Force render when scene is loaded
  useEffect(() => {
    if (sceneLoaded && initialized) {
      console.log("Scene loaded, forcing render");
      gl.render(scene, camera);
      invalidate();
    }
  }, [sceneLoaded, initialized, gl, scene, camera, invalidate]);
  
  // Handle camera movement and head bobbing
  useFrame((state, delta) => {
    if (!playerRef.current || !initialized) return;
    
    // Handle camera movement to target position
    if (isMovingCamera && targetCameraPosition) {
      const currentPos = playerRef.current.position.clone();
      const targetPos = new THREE.Vector3(
        targetCameraPosition.x,
        targetCameraPosition.y,
        targetCameraPosition.z
      );
      
      // Calculate direction and distance
      const direction = targetPos.clone().sub(currentPos).normalize();
      const distance = currentPos.distanceTo(targetPos);
      
      // Move if not at destination
      if (distance > 0.1) {
        // Update the head bob timer when moving
        headBobRef.current.timer += delta * 10; // Control bob speed
        
        // Calculate the bobbing using a sine wave (0.05 for subtle effect)
        const bobAmount = Math.sin(headBobRef.current.timer) * 0.05;
        headBobRef.current.bobHeight = bobAmount;
        
        // Calculate movement with smooth easing as we approach target
        // Slower movement
        const step = Math.min(moveSpeed * (1 + distance * 0.05), distance);
        
        // Apply movement to the player
        const movement = direction.multiplyScalar(step);
        playerRef.current.position.add(movement);
        
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
        playerRef.current.position.copy(targetPos);
        camera.position.copy(targetPos);
        
        // Reset head bob
        headBobRef.current.bobHeight = 0;
        
        // Update position in store
        setPlayerPosition({
          x: targetPos.x,
          y: targetPos.y,
          z: targetPos.z
        });
        
        // Stop movement
        stopCameraMovement();
        
        // Force a render
        invalidate();
      }
    } else {
      // When not moving, smoothly reset any remaining head bob
      if (Math.abs(headBobRef.current.bobHeight) > 0.001) {
        // Reduce bob height gradually
        headBobRef.current.bobHeight *= 0.8;
        
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
        // Ensure camera and player are in sync
        camera.position.copy(playerRef.current.position);
      }
    }
  });

  return (
    <mesh 
      ref={playerRef} 
      position={[1 * tileSize, 2, tileSize]}
      onUpdate={() => invalidate()}
    >
      <boxGeometry args={[1, 2, 1]} />
      <meshStandardMaterial color="orange" transparent opacity={0.0} /> {/* Make player invisible */}
    </mesh>
  );
};

export default React.memo(Player);