import React, { useRef, useEffect, useState } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import useGameStore from '../store';

const Player = () => {
  const { camera, gl, scene, invalidate } = useThree();
  const playerRef = useRef();
  const [initialized, setInitialized] = useState(false);
  
  const tileSize = useGameStore(state => state.tileSize);
  const setPlayerPosition = useGameStore(state => state.setPlayerPosition);
  const sceneLoaded = useGameStore(state => state.sceneLoaded);
  
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
  
  // Keep camera synchronized with player position
  useFrame(() => {
    if (!playerRef.current || !initialized) return;
    
    // Sync camera position with player
    camera.position.copy(playerRef.current.position);
  });

  return (
    <mesh 
      ref={playerRef} 
      position={[1 * tileSize, 2, tileSize]}
      onUpdate={() => invalidate()}
    >
      <boxGeometry args={[1, 2, 1]} />
      <meshStandardMaterial color="orange" transparent opacity={0.7} />
    </mesh>
  );
};

export default React.memo(Player);