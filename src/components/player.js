import React, { useRef, useState, useEffect } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import useGameStore from '../store'; 
import Projectiles from './projectiles';

const Player = () => {
  const { camera } = useThree();
  const playerRef = useRef();
  const [isMoving, setIsMoving] = useState(false);
  const [isRotating, setIsRotating] = useState(false);
  const [queuedMove, setQueuedMove] = useState(null);
  const [queuedTurn, setQueuedTurn] = useState(null);
  const [currentRotation, setCurrentRotation] = useState(0);

  const turnSpeed = Math.PI / 2;
  const moveDuration = 300; // ms
  const rotateDuration = 300; // ms

  const { equippedMagic, learnedMagic, setEquippedMagic, addProjectile, projectiles, tileSize } = useGameStore();

  useEffect(() => {
    if (!equippedMagic) {
      const defaultMagic = Object.keys(learnedMagic)[0];
      setEquippedMagic(defaultMagic);
    }
  }, [equippedMagic, learnedMagic, setEquippedMagic]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.repeat) return; // Prevent holding the key from causing continuous spam

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
    };

    const handleMouseClick = (event) => {
      if (event.button === 0 && equippedMagic) shootProjectile();
    };

    const handleScroll = (event) => {
      const magicKeys = Object.keys(learnedMagic);
      const currentIndex = magicKeys.indexOf(equippedMagic);
      let newIndex = currentIndex + (event.deltaY > 0 ? 1 : -1);
      if (newIndex >= magicKeys.length) newIndex = 0;
      if (newIndex < 0) newIndex = magicKeys.length - 1;
      setEquippedMagic(magicKeys[newIndex]);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('mousedown', handleMouseClick);
    window.addEventListener('wheel', handleScroll);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('mousedown', handleMouseClick);
      window.removeEventListener('wheel', handleScroll);
    };
  }, [equippedMagic, learnedMagic, setEquippedMagic, isMoving, isRotating]);

  // Queues movement actions to avoid issues when holding keys
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
    const moveVector = direction.applyEuler(new THREE.Euler(0, currentRotation, 0)).multiplyScalar(tileSize);
    const targetPosition = playerRef.current.position.clone().add(moveVector);

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
        setCurrentRotation(targetRotation); // Ensure it snaps exactly to 90-degree increments

        if (queuedTurn) {
          const nextTurn = queuedTurn;
          setQueuedTurn(null);
          nextTurn();
        }
      }
    };
    animateRotation();
  };

  const shootProjectile = () => {
    const forward = new THREE.Vector3();
    camera.getWorldDirection(forward);
    const startPosition = playerRef.current.position.clone();
    startPosition.y -= 0.5;
    const travelSpeed = learnedMagic[equippedMagic]?.travelSpeed || 0.2;

    addProjectile({
      id: Date.now(),
      type: equippedMagic,
      position: startPosition.clone(),
      velocity: forward.multiplyScalar(travelSpeed),
    });
  };

  useFrame(() => {
    if (playerRef.current) {
      camera.position.copy(playerRef.current.position);
      camera.rotation.set(0, currentRotation, 0);
    }
  });

  return (
    <>
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
