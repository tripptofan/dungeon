import React, { useRef, useEffect, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import useGameStore from '../store';
import { Model as Lantern } from './lantern';
import { Model as WoodenSword } from './woodenSword';

// Base position configuration for acquired items (will be adjusted based on aspect ratio)
const ACQUIRED_ITEMS_CONFIG = {
  "Lantern": {
    // These are base values that will be modified based on viewport
    position: new THREE.Vector3(-0.2, -0.25, -0.8), // Left side
    rotation: new THREE.Euler(0, (-Math.PI / 2) * 0.7, 0),
    scale: 0.15,
    bobAmount: 0.02,
    bobSpeed: 1.5,
    // Position adjustment factors
    minXPos: -0.2,    // For very narrow viewport
    maxXPos: -0.5,    // For wide viewport
    viewportFactor: 0.15  // How much to adjust based on aspect ratio
  },
  "Toy Wooden Sword": {
    position: new THREE.Vector3(0.28, -0.3, -1), // Right side
    rotation: new THREE.Euler(-Math.PI / 8, 0, (Math.PI / 4) * 0.3), // Point forward and slightly up
    scale: 0.2,
    bobAmount: 0.015,
    bobSpeed: 1.2,
    // Position adjustment factors
    minXPos: 0.2,     // For very narrow viewport
    maxXPos: 0.5,     // For wide viewport
    viewportFactor: 0.15  // How much to adjust based on aspect ratio
  }
};

// Individual acquired item component that renders regardless of overlay state
const AcquiredItem = ({ item }) => {
  const groupRef = useRef();
  const { camera, viewport, size } = useThree();
  const [adjustedConfig, setAdjustedConfig] = useState(null);
  
  // Get camera shake state and force visible flag from the store
  const cameraShaking = useGameStore(state => state.cameraShaking.isShaking);
  const forceVisible = useGameStore(state => state.forceItemsVisible);
  const showOverlay = useGameStore(state => 
    state.showMessageOverlay || state.showActionOverlay
  );
  
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
    
    // Adjust X position based on aspect ratio
    // We want items to move further from center as the screen gets wider
    // and closer to center as the screen gets narrower
    
    // Standard aspect ratio around 16:9 (1.78)
    const standardAspect = 1.78;
    
    // Calculate adjustment factor
    let aspectFactor = Math.min(Math.max(aspectRatio / standardAspect, 0.5), 2);
    
    // Calculate adjusted X position based on whether this is a left or right item
    if (baseConfig.position.x < 0) {
      // Left-side item (like lantern)
      newConfig.position.x = THREE.MathUtils.lerp(
        baseConfig.minXPos,
        baseConfig.maxXPos,
        aspectFactor - 0.5
      );
    } else {
      // Right-side item (like sword)
      newConfig.position.x = THREE.MathUtils.lerp(
        baseConfig.minXPos,
        baseConfig.maxXPos,
        aspectFactor - 0.5
      );
    }
    
    console.log(`Adjusted ${item.name} position for aspect ratio ${aspectRatio.toFixed(2)}: X=${newConfig.position.x.toFixed(2)}`);
    
    setAdjustedConfig(newConfig);
  }, [size.width, size.height, baseConfig, item.name]);

  // Log when item is rendered
  useEffect(() => {
    console.log(`Acquired item ${item.name} mounted`);
  }, [item.name]);

  // Log when force visible changes
  useEffect(() => {
    if (forceVisible) {
      console.log(`${item.name} is in force visible mode`);
    }
  }, [forceVisible, item.name]);

  // useFrame must NOT be called conditionally - this is a React hooks rule
  useFrame((state, delta) => {
    if (!groupRef.current || !adjustedConfig) return;

    // If during camera shake, update pause status
    if (cameraShaking && !headBobRef.current.bobPaused) {
      console.log(`Pausing bob for ${item.name} due to camera shake`);
      headBobRef.current.bobPaused = true;
      headBobRef.current.pauseTimer = 0;
    } 
    else if (!cameraShaking && headBobRef.current.bobPaused) {
      // Add a pause timer to gradually resume bobbing after shake
      headBobRef.current.pauseTimer += delta;
      if (headBobRef.current.pauseTimer > 1.0) { // 1 second delay
        console.log(`Resuming bob for ${item.name} after camera shake`);
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
    const isMoving = distanceMovedSq > 0.0001; // Small threshold to detect movement
    
    // Update movement detection
    headBobRef.current.isMoving = isMoving;
    headBobRef.current.lastPosition.copy(playerPosition);
    
    // Update bob timer based on movement and pause state
    if (!headBobRef.current.bobPaused) {
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
    
    // Ensure the item stays relative to the camera
    groupRef.current.position.copy(camera.position);
    groupRef.current.rotation.copy(camera.rotation);
    
    // Apply the configured position offset (in camera space)
    // Use adjustedConfig if available, otherwise use defaults
    const config = adjustedConfig || baseConfig;
    const posOffset = config.position.clone();
    
    // Add bobbing only if not paused
    if (!headBobRef.current.bobPaused) {
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
    
    // Add subtle rotation variation based on movement (if not paused)
    if (!headBobRef.current.bobPaused) {
      const tiltAmount = 0.01 * Math.min(1, headBobRef.current.stepCounter);
      const movementTilt = Math.sin(headBobRef.current.timer * 2) * tiltAmount;
      
      // Apply custom rotation for the item
      groupRef.current.rotateX(config.rotation.x + movementTilt);
      groupRef.current.rotateY(config.rotation.y);
      groupRef.current.rotateZ(config.rotation.z + (movementTilt * 0.5));
    } else {
      // Just apply base rotation when paused
      groupRef.current.rotateX(config.rotation.x);
      groupRef.current.rotateY(config.rotation.y);
      groupRef.current.rotateZ(config.rotation.z);
    }
  });

  // Render the appropriate model based on item type
  const renderItemModel = () => {
    // Use adjustedConfig if available, otherwise fall back to baseConfig
    const config = adjustedConfig || baseConfig;

    // IMPORTANT: Item-specific rendering that handles special cases
    switch (item.name) {
      case 'Lantern':
        return (
          <group scale={[config.scale, config.scale, config.scale]}>
            <Lantern />
            {/* Enhanced light setup for visibility during overlays */}
            <pointLight 
              color="#ff9930" 
              intensity={15} 
              distance={8} 
              decay={1.5} 
              position={[0, 0.2, 0]}
              castShadow
            />
            {/* Additional always-on ambient light for the lantern */}
            <pointLight 
              color="#ffcc77" 
              intensity={10} 
              distance={3} 
              decay={1.5} 
              position={[0, 0.2, 0]}
            />
            {/* Extra visual glow element */}
            <mesh position={[0, 0.2, 0]}>
              <sphereGeometry args={[0.2, 8, 8]} />
              <meshBasicMaterial 
                color="#ffcc77" 
                transparent 
                opacity={0.5} 
                toneMapped={false} // Important to keep it bright
              />
            </mesh>
          </group>
        );
      case 'Toy Wooden Sword':
        return (
          <group scale={[config.scale, config.scale, config.scale]}>
            <WoodenSword />
          </group>
        );
      default:
        // Fallback to box for unknown items
        return (
          <mesh scale={[0.2, 0.2, 0.2]}>
            <boxGeometry />
            <meshStandardMaterial color={item.color || 'white'} />
          </mesh>
        );
    }
  };

  // Calculate render order - higher when forced visible
  const renderOrderValue = forceVisible ? 3000 : 2000;

  // Make items render at a very high renderOrder to ensure they're drawn last
  // This helps with overlay issues
  return (
    <group ref={groupRef} renderOrder={renderOrderValue}>
      {renderItemModel()}
    </group>
  );
};

// Component to display all acquired items
const AcquiredItems = () => {
  const inventory = useGameStore(state => state.inventory);
  const forceItemsVisible = useGameStore(state => state.forceItemsVisible);
  const { size } = useThree();
  
  // Log component rendering for debugging
  useEffect(() => {
    console.log(`AcquiredItems rendering: Inventory size ${inventory.length}, Force visible: ${forceItemsVisible}`);
    
    // For debugging, list all items in inventory
    if (inventory.length > 0) {
      console.log(`Inventory contains: ${inventory.map(item => item.name).join(', ')}`);
    }
  }, [inventory, forceItemsVisible]);
  
  // Update viewport size in store if needed
  useEffect(() => {
    const updateViewportSize = useGameStore.getState().updateViewportSize;
    if (updateViewportSize) {
      updateViewportSize({
        width: size.width,
        height: size.height,
        aspectRatio: size.width / size.height
      });
    }
  }, [size]);
  
  // Always render if forceItemsVisible is true, otherwise check inventory
  if (inventory.length === 0 && !forceItemsVisible) return null;
  
  return (
    <>
      {/* Render all items in inventory */}
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