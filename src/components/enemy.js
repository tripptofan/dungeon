import React, { useRef, useEffect, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import useGameStore from '../store';

const Enemy = () => {
  const enemyRef = useRef();
  const [isVisible, setIsVisible] = useState(false);
  const [isRising, setIsRising] = useState(false);
  const [animationStarted, setAnimationStarted] = useState(false);
  const [enemyPosition, setEnemyPosition] = useState(null);
  const { camera } = useThree();
  
  // Get relevant state from the store
  const currentExperienceIndex = useGameStore(state => state.currentExperienceIndex);
  const experiences = useGameStore(state => state.experienceScript.experiences);
  const isMovingCamera = useGameStore(state => state.isMovingCamera);
  const playerPosition = useGameStore(state => state.playerPosition);
  const handleEnemyClick = useGameStore(state => state.handleEnemyClick);
  const swordSwinging = useGameStore(state => state.swordSwinging);
  const debugMode = useGameStore(state => state.debugMode);
  
  // For debug mode, force enemy to be visible
  useEffect(() => {
    if (debugMode) {
      console.log("Debug mode enabled - forcing enemy visibility");
      
      // Position the enemy directly in front of the camera
      const cameraDir = new THREE.Vector3(0, 0, -1);
      cameraDir.applyQuaternion(camera.quaternion);
      cameraDir.multiplyScalar(5); // 5 units in front of camera
      
      const debugPosition = {
        x: camera.position.x + cameraDir.x,
        y: camera.position.y, // Same height as camera
        z: camera.position.z + cameraDir.z
      };
      
      console.log("Debug enemy position:", debugPosition);
      
      setEnemyPosition(debugPosition);
      setIsVisible(true);
      
      // Set enemy as clickable
      useGameStore.getState().setEnemyClickable(true);
    }
  }, [camera, debugMode]);
  
  // Determine if this is the enemy encounter experience
  const isEnemyExperience = currentExperienceIndex >= 0 && 
    currentExperienceIndex < experiences.length && 
    experiences[currentExperienceIndex].type === 'enemy';
  
  // Calculate enemy position based on player position and experience data
  useEffect(() => {
    if (isEnemyExperience && !isMovingCamera) {
      const experience = experiences[currentExperienceIndex];
      
      // Debug output
      console.log("Enemy experience triggered!");
      console.log("Current experience index:", currentExperienceIndex);
      console.log("Player position:", playerPosition);
      
      // Position the enemy directly in front of player for guaranteed visibility
      const newPosition = {
        x: playerPosition.x,
        y: -5, // Start below the floor
        z: playerPosition.z + 4 // 4 units in front of the player
      };
      
      console.log("Setting enemy position to:", newPosition);
      
      setEnemyPosition(newPosition);
      setIsVisible(true);
      
      // Start the rising animation after a short delay
      setTimeout(() => {
        console.log("Starting enemy rising animation");
        setIsRising(true);
        setAnimationStarted(true);
      }, 500);
    } else {
      if (isEnemyExperience) {
        console.log("Enemy experience active but camera is moving - waiting");
      }
      setIsVisible(false);
      setIsRising(false);
      setAnimationStarted(false);
    }
  }, [currentExperienceIndex, experiences, isMovingCamera, isEnemyExperience, playerPosition]);
  
  // Handle the rising animation
  useFrame((state, delta) => {
    if (!enemyRef.current || !isVisible || !enemyPosition) return;
    
    // Update position
    enemyRef.current.position.x = enemyPosition.x;
    enemyRef.current.position.z = enemyPosition.z;
    
    if (isRising) {
      // Rise up from below the floor to a standing position
      const targetY = 3.0; // Higher final height (center of rectangle)
      const riseSpeed = 0.08; // Faster rise speed
      
      if (enemyRef.current.position.y < targetY) {
        // Move upward
        enemyRef.current.position.y += riseSpeed;
        console.log("Enemy rising, current Y:", enemyRef.current.position.y);
      } else {
        // Reached target height, stop rising
        setIsRising(false);
        
        // Show the message overlay once the enemy has risen
        if (animationStarted) {
          setAnimationStarted(false);
          
          // Set enemy to be clickable right away for testing
          useGameStore.getState().setEnemyClickable(true);
          console.log("Enemy ready for interaction!");
          
          // Wait a moment before showing the message
          setTimeout(() => {
            useGameStore.getState().setShowMessageOverlay(true);
            useGameStore.getState().setMessageBoxVisible(true);
            useGameStore.getState().setCurrentMessage("Not all problems can be solved with words....");
            useGameStore.getState().setTypingInProgress(true);
          }, 500);
        }
      }
    }
    
    // Handle sword swing animation hit detection
    if (swordSwinging) {
      const swingProgress = useGameStore.getState().swingProgress;
      
      // When swing is halfway through, detect hit
      if (swingProgress > 0.3 && swingProgress < 0.6 && !useGameStore.getState().enemyHit) {
        useGameStore.getState().setEnemyHit(true);
        
        // Apply hit effects to the enemy (for now, just change color)
        if (enemyRef.current.material) {
          enemyRef.current.material.color.set(0xFF0000); // Bright red on hit
          
          // Slowly fade out after hit
          setTimeout(() => {
            if (enemyRef.current && enemyRef.current.visible) {
              // Start decreasing opacity
              useGameStore.getState().startEnemyFadeOut();
            }
          }, 300);
        }
      }
    }
    
    // Handle fade out animation
    const isFadingOut = useGameStore.getState().enemyFadingOut;
    if (isFadingOut && enemyRef.current.material) {
      // Reduce opacity
      enemyRef.current.material.opacity -= 0.02;
      
      // When fully transparent, hide the enemy
      if (enemyRef.current.material.opacity <= 0) {
        setIsVisible(false);
        useGameStore.getState().completeEnemyFadeOut();
        
        // Move to the next experience
        setTimeout(() => {
          useGameStore.getState().progressExperience();
        }, 500);
      }
    }
  });
  
  // Don't render if not visible
  if (!isVisible || !enemyPosition) return null;
  
  // Calculate if enemy is clickable
  const enemyClickable = useGameStore.getState().enemyClickable && 
                        !useGameStore.getState().showMessageOverlay;
  
  // Create a red rectangle enemy
  return (
    <group>
      {/* Main enemy mesh - ENLARGED and BRIGHTER for better visibility */}
      <mesh 
        ref={enemyRef}
        position={[enemyPosition.x, enemyPosition.y, enemyPosition.z]}
        onClick={(e) => {
          console.log("Enemy clicked!");
          e.stopPropagation();
          if (enemyClickable && !useGameStore.getState().enemyHit) {
            console.log("Triggering enemy click handler");
            handleEnemyClick();
          } else {
            console.log("Enemy not clickable or already hit:", 
              {clickable: enemyClickable, hit: useGameStore.getState().enemyHit});
          }
        }}
      >
        <boxGeometry args={[3, 6, 1]} /> {/* LARGER dimensions */}
        <meshStandardMaterial 
          color="#ff0000" /* BRIGHTER red */
          transparent={true} 
          opacity={1.0}
          emissive="#ff5555"
          emissiveIntensity={1.0} /* Increased intensity */
        />
      </mesh>
      
      {/* Add a more obvious glow effect for better visibility */}
      <mesh 
        position={[enemyPosition.x, enemyPosition.y, enemyPosition.z - 0.2]}
        onClick={(e) => {
          console.log("Enemy glow clicked!");
          e.stopPropagation();
          if (enemyClickable && !useGameStore.getState().enemyHit) {
            handleEnemyClick();
          }
        }}
      >
        <boxGeometry args={[3.5, 6.5, 0.1]} />
        <meshBasicMaterial 
          color="#ffff00" /* Bright yellow glow */
          transparent={true} 
          opacity={0.4}
        />
      </mesh>
    </group>
  );
};

export default React.memo(Enemy);