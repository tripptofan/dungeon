import React, { useRef, useEffect, useCallback } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import useGameStore from '../store';

const Player = () => {
  const { camera } = useThree();
  const playerRef = useRef();
  const directionRef = useRef(new THREE.Vector3());

  const { 
    tileSize,
    setPlayerPosition, 
    sceneLoaded, 
    setSceneLoaded,
    setLoadingFade
  } = useGameStore();

  const moveSpeed = 3;
  const forward = useRef(false);
  const backward = useRef(false);

  // Memoized key event handler to prevent unnecessary re-creations
  const handleKeyDown = useCallback((event) => {
    switch (event.key) {
      case 'w':
        forward.current = true;
        break;
      case 's':
        backward.current = true;
        break;
    }
  }, []);

  const handleKeyUp = useCallback((event) => {
    switch (event.key) {
      case 'w':
        forward.current = false;
        break;
      case 's':
        backward.current = false;
        break;
    }
  }, []);

  // Initial setup with memoized callback
  const initializePlayerAndCamera = useCallback(() => {
    if (playerRef.current) {
      const initialPosition = 1 * tileSize;
      
      playerRef.current.position.set(initialPosition, 2, initialPosition);
      playerRef.current.rotation.set(0, Math.PI, 0);

      camera.position.set(initialPosition, 2, initialPosition);
      camera.rotation.set(0, Math.PI, 0);
    }
  }, [tileSize, camera]);

  // Setup event listeners
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // Initialize player and camera
    initializePlayerAndCamera();

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp, initializePlayerAndCamera]);

  // Optimize frame rendering with useFrame
  useFrame(() => {
    if (!playerRef.current) return;

    // Get camera direction more efficiently
    camera.getWorldDirection(directionRef.current);
    directionRef.current.y = 0;
    directionRef.current.normalize();

    // Movement logic
    if (forward.current) {
      playerRef.current.position.add(
        directionRef.current.clone().multiplyScalar(moveSpeed * 0.05)
      );
    }

    if (backward.current) {
      playerRef.current.position.add(
        directionRef.current.clone().multiplyScalar(-moveSpeed * 0.05)
      );
    }

    // Update player position in store
    const { x, y, z } = playerRef.current.position;
    setPlayerPosition({ x, y, z });

    // Align camera with player
    camera.position.copy(playerRef.current.position);
    camera.rotation.copy(playerRef.current.rotation);

    // Scene loading logic
    if (!sceneLoaded) {
      console.log('player');
      setSceneLoaded(true);
      setLoadingFade(true);
    }
  });

  return (
    <mesh ref={playerRef} position={[1 * tileSize, 2, tileSize]}>
      <boxGeometry args={[1, 2, 1]} />
      <meshStandardMaterial color="orange" />
    </mesh>
  );
};

export default React.memo(Player);