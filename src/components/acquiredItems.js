import React, { useRef, useEffect, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import useGameStore from '../store';

import OutlinedLantern from './outlinedLantern';
import OutlinedSword from './outlinedSword';

// Static array to store refs to all acquired items for outlining
export const acquiredItemRefs = [];

// Base position configuration for acquired items (will be adjusted based on aspect ratio)
const ACQUIRED_ITEMS_CONFIG = {
  "Lantern": {
    position: new THREE.Vector3(-0.3, -0.45, -1.1),
    rotation: new THREE.Euler(0, (-Math.PI / 2) * 0.7, 0),
    scale: 0.15,
    bobAmount: 0.02,
    bobSpeed: 1.5,
    minXPos: -0.3,    // For very narrow viewport
    maxXPos: -0.5,    // For wide viewport
    viewportFactor: 0.15  // How much to adjust based on aspect ratio
  },
  "Toy Wooden Sword": {
    position: new THREE.Vector3(0.4, -0.5, -1.1), // Resting position
    rotation: new THREE.Euler(-Math.PI / 8, 0, (Math.PI / 4) * 0.1), // Resting rotation
    scale: 0.2,
    bobAmount: 0.015,
    bobSpeed: 1.2,
    minXPos: 0.4,     // For very narrow viewport
    maxXPos: 0.6,     // For wide viewport
    viewportFactor: 0.18  // How much to adjust based on aspect ratio
  }
};

// Define all sword and lantern animation positions/rotations
const SWORD_POSITIONS = {
  resting: new THREE.Vector3(0.4, -0.5, -1.1),
  raised: new THREE.Vector3(0.4, 5, 2),
  swung: new THREE.Vector3(-3, -2, -2.1)
};

const SWORD_ROTATIONS = {
  resting: new THREE.Euler(-Math.PI / 80, 0, (Math.PI / 4) * -.1),
  raised: new THREE.Euler(-Math.PI / 50 * -3, 0, (Math.PI / 4) * -.2),
  swung: new THREE.Euler(Math.PI * -.4, .6, (Math.PI / 4) * -.1)
};

// Synchronize LANTERN_POSITIONS.resting with the initial position from ACQUIRED_ITEMS_CONFIG
const LANTERN_POSITIONS = {
  resting: ACQUIRED_ITEMS_CONFIG["Lantern"].position.clone(),
  active: new THREE.Vector3(-0.6, -0.45, -1.1)
};

// Individual acquired item component that renders regardless of overlay state
const AcquiredItem = ({ item }) => {
  const groupRef = useRef();
  const { camera, viewport, size } = useThree();
  const [adjustedConfig, setAdjustedConfig] = useState(null);
  const [isExiting, setIsExiting] = useState(false);
  const [isRemoved, setIsRemoved] = useState(false);
  const exitAnimRef = useRef({ progress: 0 });
  
  // Get render order constants from store
  const renderOrder = useGameStore(state => state.renderOrder);
  
  // Get camera shake state and force visible flag from the store
  const cameraShakingState = useGameStore(state => state.cameraShaking);
  const cameraShaking = cameraShakingState.isShaking;
  const forceVisible = useGameStore(state => state.forceItemsVisible);
  const showOverlay = useGameStore(state => 
    state.showMessageOverlay || state.showActionOverlay
  );
  
  // Get sword swing state
  const swordSwinging = useGameStore(state => state.swordSwinging);
  const swingDirection = useGameStore(state => state.swingDirection);
  const swingProgress = useGameStore(state => state.swingProgress);
  const swingType = useGameStore(state => state.swingType || 'default');
  const updateSwordSwing = useGameStore(state => state.updateSwordSwing);
  const overlayVisible = useGameStore(state => state.showMessageOverlay);
  
  // Get chest opened state
  const chestOpened = useGameStore(state => state.chestOpened);
  
  // Track exit animation when chest is opened
  useEffect(() => {
    if (chestOpened && !isExiting && item.name === "Toy Wooden Sword") {
      setIsExiting(true);
      exitAnimRef.current.progress = 0;
    }
  }, [chestOpened, isExiting, item.name]);
  
  // Add ref to the static array when mounted, remove when unmounted
  useEffect(() => {
    if (groupRef.current && !isRemoved) {
      acquiredItemRefs.push(groupRef.current);
    }
    
    return () => {
      const index = acquiredItemRefs.indexOf(groupRef.current);
      if (index !== -1) {
        acquiredItemRefs.splice(index, 1);
      }
    };
  }, [item.name, isRemoved]);
  
  // Get base config for this item
  const baseConfig = ACQUIRED_ITEMS_CONFIG[item.name] || {
    position: new THREE.Vector3(0, -0.5, -1),
    rotation: new THREE.Euler(0, 0, 0),
    scale: 0.2,
    bobAmount: 0.02,
    bobSpeed: 1,
    minXPos: 0,
    maxXPos: 0,
    viewportFactor: 0
  };

  // Track head bob parameters
  const headBobRef = useRef({
    timer: 0,
    stepCounter: 0,
    isMoving: false,
    lastPosition: new THREE.Vector3(),
    bobPaused: false,
    pauseTimer: 0
  });

  // Calculate adjusted position based on viewport dimensions
  useEffect(() => {
    // Get the current aspect ratio
    const aspectRatio = size.width / size.height;
    
    // Create a deep copy of the base config
    const newConfig = { ...baseConfig };
    newConfig.position = baseConfig.position.clone();
    newConfig.rotation = new THREE.Euler(
      baseConfig.rotation.x,
      baseConfig.rotation.y,
      baseConfig.rotation.z
    );
    
    // Standard aspect ratio around 16:9 (1.78)
    const standardAspect = 1.78;
    
    // Calculate adjustment factor
    let aspectFactor = Math.min(Math.max(aspectRatio / standardAspect, 0.5), 2);
    
    // Start with the base position value from the config
    const baseXPosition = baseConfig.position.x;
    
    // Calculate adjusted X position based on whether this is a left or right item
    if (baseXPosition < 0) {
      // Left-side item (like lantern)
      newConfig.position.x = THREE.MathUtils.lerp(
        baseXPosition,
        baseConfig.maxXPos,
        aspectFactor - 0.5
      );
    } else {
      // Right-side item (like sword)
      newConfig.position.x = THREE.MathUtils.lerp(
        baseXPosition,
        baseConfig.maxXPos,
        aspectFactor - 0.5
      );
    }
    
    setAdjustedConfig(newConfig);
  }, [size.width, size.height, baseConfig, item.name]);

  // useFrame for handling exit animation
  useFrame((state, delta) => {
    // Skip if already removed from scene
    if (isRemoved) return;
    
    // Process exit animation when sword is exiting
    if (isExiting) {
      // Increase exit animation progress
      exitAnimRef.current.progress += delta * 0.5;
      
      // If animation is complete, remove from scene
      if (exitAnimRef.current.progress >= 1) {
        setIsRemoved(true);
        return;
      }
    }
  });

  // useFrame for rendering and animation
  useFrame((state, delta) => {
    if (!groupRef.current || !adjustedConfig || isRemoved) return;
    
    // Determine which render order to use
    const currentRenderOrder = renderOrder.ACQUIRED_ITEMS;
    
    // Set render order on group
    if (groupRef.current.renderOrder !== currentRenderOrder) {
      groupRef.current.renderOrder = currentRenderOrder;
    }
    
    // Update render order and material settings for all child meshes
    if (!groupRef.current.userData.orderApplied) {
      groupRef.current.traverse(child => {
        if (child.isMesh) {
          child.renderOrder = currentRenderOrder;
          
          if (child.material) {
            const updateMaterial = (material) => {
              if (!material.transparent) {
                material.depthTest = true;
                material.depthWrite = true;
                material.opacity = 1.0;
              } 
              else if (material.transparent) {
                material.depthTest = true;
                material.depthWrite = true;
              }
            };
            
            if (Array.isArray(child.material)) {
              child.material.forEach(mat => updateMaterial(mat));
            } else {
              updateMaterial(child.material);
            }
          }
        }
      });
      
      groupRef.current.userData.orderApplied = true;
    }
    
    // Ensure visibility during message overlay and when forceVisible is true
    if ((forceVisible || overlayVisible) && !groupRef.current.visible) {
      groupRef.current.visible = true;
    }
    
    // Set extremely high renderOrder when overlay is visible to ensure items appear on top
    if (overlayVisible) {
      // Set renderOrder higher than the message overlay
      groupRef.current.renderOrder = renderOrder.ACQUIRED_ITEMS;
      
      // Ensure child meshes also have high renderOrder
      groupRef.current.traverse(child => {
        if (child.isMesh) {
          child.renderOrder = renderOrder.ACQUIRED_ITEMS;
          
          if (child.material) {
            // Make a copy of the material if we haven't done so already
            if (!child.userData.originalMaterial) {
              child.userData.originalMaterial = child.material.clone();
              child.userData.overlayMode = false;
            }
            
            // Only update material settings when overlay mode changes
            if (!child.userData.overlayMode) {
              child.userData.overlayMode = true;
              
              // Ensure materials render on top of overlay
              if (Array.isArray(child.material)) {
                child.material.forEach(mat => {
                  mat.depthTest = false;
                });
              } else {
                child.material.depthTest = false;
              }
            }
          }
        }
      });
    } 
    else if (groupRef.current.userData.overlayMode) {
      // Reset renderOrder when overlay is hidden
      groupRef.current.renderOrder = renderOrderValue;
      
      // Reset child mesh settings
      groupRef.current.traverse(child => {
        if (child.isMesh) {
          child.renderOrder = renderOrderValue;
          
          // Restore original material depth settings
          if (child.userData.originalMaterial && child.userData.overlayMode) {
            child.userData.overlayMode = false;
            
            // Restore original depth test settings
            if (Array.isArray(child.material)) {
              child.material.forEach((mat, i) => {
                if (Array.isArray(child.userData.originalMaterial)) {
                  mat.depthTest = child.userData.originalMaterial[i].depthTest;
                }
              });
            } else if (child.userData.originalMaterial) {
              child.material.depthTest = child.userData.originalMaterial.depthTest;
            }
          }
        }
      });
      
      groupRef.current.userData.overlayMode = false;
    }

    // Ensure the item stays relative to the camera
    groupRef.current.position.copy(camera.position);
    groupRef.current.rotation.copy(camera.rotation);
    
    // Apply the configured position offset (in camera space)
    const config = adjustedConfig || baseConfig;
    const posOffset = config.position.clone();
    
    // Apply exit animation when chest is opened and this is the sword
    if (isExiting) {
      const exitProgress = exitAnimRef.current.progress;
      const eased = easeInBack(exitProgress);
      
      // Move sword down and behind the player during exit
      const exitOffsetY = -1.5 * eased;
      const exitOffsetZ = 2 * eased;
      
      posOffset.y += exitOffsetY;
      posOffset.z += exitOffsetZ;
      
      // Optionally rotate the sword as it exits
      const exitRotX = Math.PI * 0.5 * eased;
      
      // Apply rotation in the next rotation application section
      config.rotation.x = exitRotX;
      
      // Fade out the sword
      groupRef.current.traverse(child => {
        if (child.isMesh && child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach(mat => {
              if (mat.transparent) {
                mat.opacity = Math.max(0, 1 - eased);
              }
            });
          } else if (child.material.transparent) {
            child.material.opacity = Math.max(0, 1 - eased);
          }
        }
      });
    }

    // Apply shake effect if camera shake is active
    if (cameraShaking) {
      const intensityValue = cameraShakingState.intensity || 0.5;
      const shakeIntensity = intensityValue * 1.0;
      
      const offsetX = (Math.random() * 2 - 1) * shakeIntensity * 0.08;
      const offsetY = (Math.random() * 2 - 1) * shakeIntensity * 0.08;
      const offsetZ = (Math.random() * 2 - 1) * shakeIntensity * 0.04;
      
      posOffset.x += offsetX;
      posOffset.y += offsetY;
      posOffset.z += offsetZ;
    }

    // Handle head bobbing (but not during shake or exit)
    if ((cameraShaking || isExiting) && !headBobRef.current.bobPaused) {
      headBobRef.current.bobPaused = true;
      headBobRef.current.pauseTimer = 0;
    } 
    else if (!cameraShaking && !isExiting && headBobRef.current.bobPaused) {
      // Add a pause timer to gradually resume bobbing after shake
      headBobRef.current.pauseTimer += delta;
      if (headBobRef.current.pauseTimer > 1.0) {
        headBobRef.current.bobPaused = false;
      }
    }

    // Get player movement state
    const playerPosition = new THREE.Vector3(
      camera.position.x, 
      camera.position.y, 
      camera.position.z
    );
    
    // Check if player is moving by comparing current and last position
    const distanceMovedSq = headBobRef.current.lastPosition.distanceToSquared(playerPosition);
    const isMoving = distanceMovedSq > 0.0001;
    
    // Update movement detection
    headBobRef.current.isMoving = isMoving;
    headBobRef.current.lastPosition.copy(playerPosition);
    
    // Update bob timer based on movement and pause state - only if not shaking
    if (!headBobRef.current.bobPaused && !cameraShaking) {
      if (isMoving) {
        // Increase timer when moving (speed proportional to movement)
        headBobRef.current.timer += delta * 10 * Math.min(1, Math.sqrt(distanceMovedSq) * 20);
        headBobRef.current.stepCounter += delta * 8;
      } else {
        // When not moving, slow down and normalize the bobbing
        headBobRef.current.timer += delta * 0.5;
        
        // Gradual step counter reduction when stationary
        if (headBobRef.current.stepCounter > 0) {
          headBobRef.current.stepCounter = Math.max(0, headBobRef.current.stepCounter - delta * 3);
        }
      }
    }
    
    // Add bobbing only if not paused, not shaking, and not exiting
    if (!cameraShaking && !headBobRef.current.bobPaused && !isExiting) {
      // Add subtle bobbing effect (vertical)
      const basicBob = Math.sin(state.clock.elapsedTime * config.bobSpeed) * config.bobAmount;
      
      // Add head-bob like effect when moving
      const stepBob = Math.sin(headBobRef.current.timer * 1.5) * 0.015 * Math.min(1, headBobRef.current.stepCounter);
      const sideBob = Math.cos(headBobRef.current.timer * 0.75) * 0.008 * Math.min(1, headBobRef.current.stepCounter);
      
      // Combine the basic item bob with the head bob effect
      posOffset.y += basicBob + stepBob;
      posOffset.x += sideBob;
    }
    
    // Apply position offset in local space
    groupRef.current.translateX(posOffset.x);
    groupRef.current.translateY(posOffset.y);
    groupRef.current.translateZ(posOffset.z);
    
    // Apply custom rotation - separate from position offsets
    let rotX = config.rotation.x;
    let rotY = config.rotation.y;
    let rotZ = config.rotation.z;
    
    // Add rotation shake if camera is shaking and not exiting
    if (cameraShaking && !isExiting) {
      const intensityValue = cameraShakingState.intensity || 0.5;
      const shakeIntensity = intensityValue * 1.2;
      
      rotX += (Math.random() * 2 - 1) * shakeIntensity * 0.08;
      rotZ += (Math.random() * 2 - 1) * shakeIntensity * 0.08;
    } 
    // Add subtle rotation variation based on movement (if not paused, not shaking, and not exiting)
    else if (!headBobRef.current.bobPaused && !isExiting) {
      const tiltAmount = 0.01 * Math.min(1, headBobRef.current.stepCounter);
      const movementTilt = Math.sin(headBobRef.current.timer * 2) * tiltAmount;
      
      rotX += movementTilt;
      rotZ += (movementTilt * 0.5);
    }
    
    // Apply all rotations
    groupRef.current.rotateX(rotX);
    groupRef.current.rotateY(rotY);
    groupRef.current.rotateZ(rotZ);
  });

  // Add another useFrame for updating the sword swing animation
  useFrame((state, delta) => {
    // If this isn't the sword, we don't need to process swing animation
    if (item.name !== "Toy Wooden Sword") return;
    
    // Always update the swing animation progress in store
    if (swordSwinging) {
      updateSwordSwing(delta);
    }
  });

  // Helper functions for sword swing animation

  // Calculate sword position based on swing progress
  const calculateSwordSwingPosition = (progress) => {
    if (!swordSwinging) {
      return [
        SWORD_POSITIONS.resting.x,
        SWORD_POSITIONS.resting.y,
        SWORD_POSITIONS.resting.z
      ];
    }
    
    // Animation timing configuration
    const raisePhaseEnd = 0.25;
    const swingPhaseEnd = 0.65;
    const returnPhaseStart = 0.85;
    
    // Animation speed factors
    const raiseSpeed = 0.7;
    const swingSpeed = 0.6;
    const returnSpeed = 0.5;
    
    // Calculate current position
    let currentPosition = new THREE.Vector3();
    
    if (progress < raisePhaseEnd) {
      // Phase 1: Raising the sword (0% to 25%)
      const phaseProgress = Math.min(1, (progress / raisePhaseEnd) * raiseSpeed);
      const easedProgress = easeOutBack(phaseProgress);
      
      currentPosition.lerpVectors(
        SWORD_POSITIONS.resting,
        SWORD_POSITIONS.raised,
        easedProgress
      );
    } 
    else if (progress < swingPhaseEnd) {
      // Phase 2: Swinging the sword (25% to 85%)
      const phaseProgress = Math.min(1, ((progress - raisePhaseEnd) / (swingPhaseEnd - raisePhaseEnd)) * swingSpeed);
      const easedProgress = easeOutQuint(phaseProgress);
      
      currentPosition.lerpVectors(
        SWORD_POSITIONS.raised,
        SWORD_POSITIONS.swung,
        easedProgress
      );
    }
    else {
      // Phase 3: Return to resting position (85% to 100%)
      const phaseProgress = Math.min(1, ((progress - returnPhaseStart) / (1 - returnPhaseStart)) * returnSpeed);
      const easedProgress = easeInOutCubic(phaseProgress);
      
      currentPosition.lerpVectors(
        SWORD_POSITIONS.swung,
        SWORD_POSITIONS.resting,
        easedProgress
      );
    }
    
    return [currentPosition.x, currentPosition.y, currentPosition.z];
  };

  // Calculate sword rotation based on swing progress
  const calculateSwordSwingRotation = (progress) => {
    if (!swordSwinging) {
      return [
        SWORD_ROTATIONS.resting.x,
        SWORD_ROTATIONS.resting.y,
        SWORD_ROTATIONS.resting.z
      ];
    }
    
    // Use the same animation phases as the position calculation
    const raisePhaseEnd = 0.25;
    const swingPhaseEnd = 0.85;
    const returnPhaseStart = 0.85;
    
    // Animation speed factors
    const raiseSpeed = 0.7;
    const swingSpeed = 0.6;
    const returnSpeed = 0.5;
    
    // Calculate current rotation
    let x, y, z;
    
    if (progress < raisePhaseEnd) {
      // Phase 1: Raising the sword (0% to 25%)
      const phaseProgress = Math.min(1, (progress / raisePhaseEnd) * raiseSpeed);
      const easedProgress = easeOutBack(phaseProgress);
      
      // Lerp between resting and raised rotations
      x = THREE.MathUtils.lerp(SWORD_ROTATIONS.resting.x, SWORD_ROTATIONS.raised.x, easedProgress);
      y = THREE.MathUtils.lerp(SWORD_ROTATIONS.resting.y, SWORD_ROTATIONS.raised.y, easedProgress);
      z = THREE.MathUtils.lerp(SWORD_ROTATIONS.resting.z, SWORD_ROTATIONS.raised.z, easedProgress);
    } 
    else if (progress < swingPhaseEnd) {
      // Phase 2: Swinging the sword (25% to 85%)
      const phaseProgress = Math.min(1, ((progress - raisePhaseEnd) / (swingPhaseEnd - raisePhaseEnd)) * swingSpeed);
      const easedProgress = easeOutQuint(phaseProgress);
      
      // Lerp between raised and swung rotations
      x = THREE.MathUtils.lerp(SWORD_ROTATIONS.raised.x, SWORD_ROTATIONS.swung.x, easedProgress);
      y = THREE.MathUtils.lerp(SWORD_ROTATIONS.raised.y, SWORD_ROTATIONS.swung.y, easedProgress);
      z = THREE.MathUtils.lerp(SWORD_ROTATIONS.raised.z, SWORD_ROTATIONS.swung.z, easedProgress);
    }
    else {
      // Phase 3: Return to resting position (85% to 100%)
      const phaseProgress = Math.min(1, ((progress - returnPhaseStart) / (1 - returnPhaseStart)) * returnSpeed);
      const easedProgress = easeInOutCubic(phaseProgress);
      
      // Lerp between swung and resting rotations
      x = THREE.MathUtils.lerp(SWORD_ROTATIONS.swung.x, SWORD_ROTATIONS.resting.x, easedProgress);
      y = THREE.MathUtils.lerp(SWORD_ROTATIONS.swung.y, SWORD_ROTATIONS.resting.y, easedProgress);
      z = THREE.MathUtils.lerp(SWORD_ROTATIONS.swung.z, SWORD_ROTATIONS.resting.z, easedProgress);
    }
    
    return [x, y, z];
  };

  // Calculate lantern movement during sword swing
  const calculateLanternPosition = (progress) => {
    // Return null to use the default position regardless of sword swinging state
    return null;
  };

  // Easing functions for more natural animation
  const easeOutCubic = (x) => {
    return 1 - Math.pow(1 - x, 3);
  };

  const easeOutQuint = (x) => {
    return 1 - Math.pow(1 - x, 5);
  };
  
  const easeInOutCubic = (x) => {
    return x < 0.5 
      ? 4 * x * x * x 
      : 1 - Math.pow(-2 * x + 2, 3) / 2;
  };

  // Add a new easing function with overshoot for the raising phase
  const easeOutBack = (x) => {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
  };

  // Add a new easing function for the exit animation
  const easeInBack = (x) => {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return c3 * x * x * x - c1 * x * x;
  };

  // Add this easing function if it doesn't already exist in your code
  const easeInCubic = (x) => {
    return x * x * x;
  };

  // Render the appropriate model based on item type
  const renderItemModel = () => {
    // Use adjustedConfig if available, otherwise fall back to baseConfig
    const config = adjustedConfig || baseConfig;
  
    switch(item.name) {
      case 'Lantern':
        // Calculate lantern position during sword swing
        const lanternPosition = calculateLanternPosition(swingProgress);
        
        return (
          <group scale={[config.scale, config.scale, config.scale]}>
            <group position={lanternPosition || [0, 0, 0]}>
              <OutlinedLantern 
                outlineThickness={0.05} 
                emissiveIntensity={0.4}
                lightIntensity={9}
                renderOrder={renderOrder.ACQUIRED_ITEMS}
              />
            </group>
          </group>
        );
      case 'Toy Wooden Sword':
        return (
          <group scale={[config.scale, config.scale, config.scale]}>
            <group
              rotation={calculateSwordSwingRotation(swingProgress)}
              position={calculateSwordSwingPosition(swingProgress)}
            >
              <group position={[0, -0.2, 0]}>
                <OutlinedSword 
                  outlineThickness={0.05} 
                  renderOrder={renderOrder.ACQUIRED_ITEMS}
                />
              </group>
            </group>
          </group>
        );
      default:
        return (
          <group scale={[0.2, 0.2, 0.2]}>
            <mesh scale={[1.1, 1.1, 1.1]} renderOrder={1}>
              <boxGeometry />
              <meshBasicMaterial 
                color="#FFFFFF" 
                side={THREE.BackSide} 
                depthTest={true} 
              />
            </mesh>
            
            <mesh renderOrder={2}>
              <boxGeometry />
              <meshStandardMaterial color={item.color || 'white'} />
            </mesh>
          </group>
        );
    }
  };

  // Calculate render order - higher when forced visible
  const renderOrderValue = forceVisible ? renderOrder.ACQUIRED_ITEMS : renderOrder.ACQUIRED_ITEMS - 1000;

  // Don't render if the item has been removed
  if (isRemoved) return null;

  return (
    <group 
      ref={groupRef} 
      renderOrder={renderOrderValue}
      userData={{ overlayMode: false }}
    >
      {renderItemModel()}
    </group>
  );
};

// Component to display all acquired items
const AcquiredItems = () => {
  const inventory = useGameStore(state => state.inventory);
  const forceItemsVisible = useGameStore(state => state.forceItemsVisible);
  const showItemDisplay = useGameStore(state => state.showItemDisplay);
  const showMessageOverlay = useGameStore(state => state.showMessageOverlay);
  const { size } = useThree();
  const updateViewportSize = useGameStore.getState().updateViewportSize;

  // Update viewport size in store if needed
  useEffect(() => {
    if (updateViewportSize) {
      updateViewportSize({
        width: size.width,
        height: size.height,
        aspectRatio: size.width / size.height
      });
    }
  }, [size, updateViewportSize]);

  return (
    <>
      {inventory.map((item, index) => (
        <AcquiredItem 
          key={`acquired-${item.name}-${index}`} 
          item={item}
        />
      ))}
    </>
  );
};

export default React.memo(AcquiredItems);