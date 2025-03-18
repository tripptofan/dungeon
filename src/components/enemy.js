import React, { useRef, useState, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import gsap from "gsap";
import useGameStore from "../store";
import HealthBar from "./healthBar";

const Enemy = () => {
  const enemyRef = useRef();
  const { spawnPoints, projectiles, tileSize, learnedMagic } = useGameStore();
  const [health, setHealth] = useState(100);

  const enemyRadius = 1.0; // Size of enemy hitbox
  const damageThreshold = enemyRadius * 2; // Threshold for collision detection

  const [isMoving, setIsMoving] = useState(false); // Track if enemy is moving
  const [currentTile, setCurrentTile] = useState({
    x: spawnPoints.enemy.x,
    z: spawnPoints.enemy.z,
  });

  const restTime = 2 + Math.random() * 3; // Random rest time between movements
  const moveDuration = 2; // Movement time in seconds

  const applyDamage = (damage) => {
    setHealth((prevHealth) => Math.max(0, prevHealth - damage));
  };

  const moveEnemyToTile = (targetX, targetZ) => {
    if (isMoving) return; // Prevent movement if already moving

    setIsMoving(true);

    // Calculate the movement direction
    const moveVector = new THREE.Vector3(targetX - currentTile.x, 0, targetZ - currentTile.z);
    const targetPosition = enemyRef.current.position.clone().add(moveVector);

    gsap.to(enemyRef.current.position, {
      x: targetX,
      z: targetZ,
      duration: moveDuration,
      ease: "power1.inOut",
      onComplete: () => {
        setIsMoving(false);
        setCurrentTile({ x: targetX, z: targetZ });

        // After moving, rest before moving again
        setTimeout(() => moveEnemyRandomly(), restTime * 1000);
      },
    });
  };

  const moveEnemyRandomly = () => {
    // Only allow horizontal or vertical movements (no diagonals)
    const directions = [
      { x: 1, z: 0 }, // Move right
      { x: -1, z: 0 }, // Move left
      { x: 0, z: 1 }, // Move forward
      { x: 0, z: -1 }, // Move backward
    ];

    // Pick a random direction from the available ones
    const randomDirection = directions[Math.floor(Math.random() * directions.length)];

    // Calculate target position (1 tile away)
    const targetX = currentTile.x + randomDirection.x * tileSize;
    const targetZ = currentTile.z + randomDirection.z * tileSize;

    // Only move to the next tile (no diagonals)
    if (Math.abs(targetX - currentTile.x) <= tileSize && Math.abs(targetZ - currentTile.z) <= tileSize) {
      moveEnemyToTile(targetX, targetZ);
    }
  };

  useEffect(() => {
    // Set initial position of the enemy at spawn point
    enemyRef.current.position.set(spawnPoints.enemy.x, spawnPoints.enemy.y, spawnPoints.enemy.z);

    // Start moving the enemy randomly after spawning
    moveEnemyRandomly();
  }, [spawnPoints.enemy]);

  const checkCollision = () => {
    if (!enemyRef.current || !projectiles || projectiles.length === 0) return;

    projectiles.forEach((projectile) => {
      const projectilePosition = new THREE.Vector3().copy(projectile.position);
      const enemyPosition = enemyRef.current.position;
      const distance = projectilePosition.distanceTo(enemyPosition);

      if (distance < enemyRadius + damageThreshold) {
        const projectileData = learnedMagic[projectile.type];
        if (projectileData) {
          applyDamage(projectileData.damage);
        }
        console.log("Hit!");
      }
    });
  };

  useFrame(() => {
    if (enemyRef.current) {
      enemyRef.current.position.y = spawnPoints.enemy.y + Math.sin(performance.now() * 0.002) * 0.1;
    }

    checkCollision(); // Ensure collision is checked on every frame
  });

  return (
    <>
      <mesh ref={enemyRef}>
        <sphereGeometry args={[enemyRadius, 32, 32]} />
        <meshStandardMaterial color="red" emissive="red" emissiveIntensity={0.5} />
      </mesh>

      {enemyRef.current && (
        <HealthBar enemyPosition={enemyRef.current.position} healthPercentage={health} />
      )}
    </>
  );
};

export default Enemy;
