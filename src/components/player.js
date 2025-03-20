import React, { useRef, useState, useEffect } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { PointerLockControls } from '@react-three/drei';
import * as THREE from 'three';
import useGameStore from '../store';
import Projectiles from './projectiles';

const Player = () => {
  const { camera, gl } = useThree();
  const playerRef = useRef();
  const [isMoving, setIsMoving] = useState(false);
  const [isRotating, setIsRotating] = useState(false);
  const [queuedMove, setQueuedMove] = useState(null);
  const [queuedTurn, setQueuedTurn] = useState(null);
  const [currentRotation, setCurrentRotation] = useState(0);

  const { 
    equippedMagic, 
    learnedMagic, 
    setEquippedMagic, 
    addProjectile, 
    projectiles, 
    tileSize,
    setPlayerPosition,
    godMode,
    playerSpawnPoint,
    dungeon,
    moveDirection, // Add this state to control movement direction from the app
    rotateDirection // Add this state to control rotation direction from the app
  } = useGameStore();

  const turnSpeed = Math.PI / 2;
  const moveDuration = 300; // ms
  const rotateDuration = 300; // ms
  const moveSpeed = tileSize; // Adjust movement speed as needed

  useEffect(() => {
    if (!equippedMagic) {
      const defaultMagic = Object.keys(learnedMagic)[0];
      setEquippedMagic(defaultMagic);
    }
  }, [equippedMagic, learnedMagic, setEquippedMagic]);

  // Set the starting position based on playerSpawnPoint
  useEffect(() => {
    if (playerSpawnPoint && playerRef.current) {
      playerRef.current.position.set(playerSpawnPoint.x * tileSize, 1.5, playerSpawnPoint.z * tileSize);
      camera.position.set(playerSpawnPoint.x * tileSize, 1.5, playerSpawnPoint.z * tileSize);
  
      // Set initial rotation to be 180 degrees flipped
      const initialRotation = Math.PI;
      setCurrentRotation(initialRotation);
  
      playerRef.current.rotation.y = initialRotation;
      camera.rotation.set(0, initialRotation, 0);
    }
  }, [playerSpawnPoint, camera]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.repeat) return; // Prevent holding the key from causing continuous spam
    
      if (godMode) {
        const direction = new THREE.Vector3();
        camera.getWorldDirection(direction); // Get forward direction
    
        switch (event.key) {
          case 'w': // Move forward
            playerRef.current.position.addScaledVector(direction, moveSpeed);
            camera.position.addScaledVector(direction, moveSpeed);
            break;
          case 's': // Move backward
            playerRef.current.position.addScaledVector(direction, -moveSpeed);
            camera.position.addScaledVector(direction, -moveSpeed);
            break;
          case 'a': // Move left
            playerRef.current.position.x -= moveSpeed;
            camera.position.x -= moveSpeed;
            break;
          case 'd': // Move right
            playerRef.current.position.x += moveSpeed;
            camera.position.x += moveSpeed;
            break;
          case 'ArrowUp': // Move up
            playerRef.current.position.y += moveSpeed;
            camera.position.y += moveSpeed; // Sync camera with player
            break;
          case 'ArrowDown': // Move down
            playerRef.current.position.y -= moveSpeed;
            camera.position.y -= moveSpeed;
            break;
        }
      } else {
        // Regular movement when godMode is OFF
        switch (event.key) {
          case 'w':
            queueMove(movePlayerForward);
            break;
          case 's':
            queueMove(movePlayerBackward);
            break;
          case 'a':
            queueTurn(rotateLeft);
            break;
          case 'd':
            queueTurn(rotateRight);
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [equippedMagic, learnedMagic, setEquippedMagic, isMoving, isRotating, godMode]);

  const movePlayerY = (direction) => {
    const moveStep = 1; // Adjust as needed
    playerRef.current.position.y += direction * moveStep;
    camera.position.y += direction * moveStep; // Sync camera with player
  };

  const queueMove = (moveFunction) => {
    if (isMoving) {
      setQueuedMove(() => moveFunction);
    } else {
      moveFunction();
    }
  };

  const queueTurn = (turnFunction) => {
    if (isRotating) {
      setQueuedTurn(() => turnFunction);
    } else {
      turnFunction();
    }
  };

  const movePlayerForward = () => {
    if (isMoving || isRotating) return;
    movePlayer(new THREE.Vector3(0, 0, -1));
  };

  const movePlayerBackward = () => {
    if (isMoving || isRotating) return;
    movePlayer(new THREE.Vector3(0, 0, 1));
  };

  const movePlayer = (direction) => {
    setIsMoving(true);
  
    // Calculate movement vector
    const moveVector = direction.applyEuler(new THREE.Euler(0, currentRotation, 0)).multiplyScalar(tileSize);
    const targetPosition = playerRef.current.position.clone().add(moveVector);
  
    // Convert world coordinates to map coordinates
    const targetX = Math.round(targetPosition.x / tileSize);
    const targetZ = Math.round(targetPosition.z / tileSize);
  
    // Check if the target tile is a floor tile (0)
    if (dungeon[targetX]?.[targetZ] !== 0) {
      setIsMoving(false); // Cancel movement if tile is not walkable
      return;
    }
  
    const startTime = performance.now();
    const animate = () => {
      const elapsed = performance.now() - startTime;
      const alpha = Math.min(elapsed / moveDuration, 1);
      playerRef.current.position.lerpVectors(playerRef.current.position, targetPosition, alpha);
      camera.position.copy(playerRef.current.position);
  
      if (alpha < 1) {
        requestAnimationFrame(animate);
      } else {
        setIsMoving(false);
        setPlayerPosition({ x: targetX, z: targetZ });
  
        // Process queued moves
        if (queuedMove) {
          const nextMove = queuedMove;
          setQueuedMove(null);
          nextMove();
        }
      }
    };
    animate();
  };
  
  const rotateLeft = () => {
    if (isRotating || isMoving) return;
    rotatePlayer(turnSpeed);
  };

  const rotateRight = () => {
    if (isRotating || isMoving) return;
    rotatePlayer(-turnSpeed);
  };

  const rotatePlayer = (angle) => {
    setIsRotating(true);
    const targetRotation = currentRotation + angle;
    const startTime = performance.now();

    const animateRotation = () => {
      const elapsed = performance.now() - startTime;
      const alpha = Math.min(elapsed / rotateDuration, 1);
      setCurrentRotation(THREE.MathUtils.lerp(currentRotation, targetRotation, alpha));
      camera.rotation.y = currentRotation;

      if (alpha < 1) {
        requestAnimationFrame(animateRotation);
      } else {
        setIsRotating(false);
        setCurrentRotation(targetRotation);
        if (queuedTurn) {
          const nextTurn = queuedTurn;
          setQueuedTurn(null);
          nextTurn();
        }
      }
    };
    animateRotation();
  };

  useFrame(() => {
    if (playerRef.current && !godMode) {
      camera.position.copy(playerRef.current.position);
      camera.rotation.set(0, currentRotation, 0);
    }
  });

  // Handle mobile button movement states
  useEffect(() => {
    if (moveDirection) {
      switch (moveDirection) {
        case 'forward':
          queueMove(movePlayerForward);
          break;
        case 'backward':
          queueMove(movePlayerBackward);
          break;
        default:
          break;
      }
    }

    if (rotateDirection) {
      switch (rotateDirection) {
        case 'left':
          queueTurn(rotateLeft);
          break;
        case 'right':
          queueTurn(rotateRight);
          break;
        default:
          break;
      }
    }
  }, [moveDirection, rotateDirection]);

  return (
    <>
      {/* Enable pointer lock when godMode is on */}
      {godMode && <PointerLockControls args={[camera, gl.domElement]} />}
      
      <mesh ref={playerRef} position={[0, 1.5, 0]}>
        <boxGeometry args={[1, 2, 1]} />
        <meshStandardMaterial color="orange" />
      </mesh>

      {projectiles.map((proj) => (
        <Projectiles key={proj.id} projectile={proj} />
      ))}
    </>
  );
};

export default Player;
