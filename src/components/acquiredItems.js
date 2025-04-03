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
    // These are base values that will be modified based on viewport
    position: new THREE.Vector3(-0.2, -0.55, -0.7), // Left side, lowered position
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
    position: new THREE.Vector3(0.4, -0.5, -1.1), // Moved further right (from 0.28 to 0.4)
    rotation: new THREE.Euler(-Math.PI / 8, 0, (Math.PI / 4) * 0.3), // Point forward and slightly up
    scale: 0.2,
    bobAmount: 0.015,
    bobSpeed: 1.2,
    // Position adjustment factors
    minXPos: 0.4,     // For very narrow viewport (increased from 0.2 to 0.3)
    maxXPos: 0.6,     // For wide viewport (increased from 0.5 to 0.6)
    viewportFactor: 0.18  // How much to adjust based on aspect ratio
  }
};

// Individual acquired item component that renders regardless of overlay state
const AcquiredItem = ({ item }) => {
  const groupRef = useRef();
  const { camera, viewport, size } = useThree();
  const [adjustedConfig, setAdjustedConfig] = useState(null);
  
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
  
  // Add ref to the static array when mounted, remove when unmounted
  useEffect(() => {
    if (groupRef.current) {
      acquiredItemRefs.push(groupRef.current);
      console.log(`Added acquired ${item.name} to outline list, total: ${acquiredItemRefs.length}`);
    }
    
    return () => {
      const index = acquiredItemRefs.indexOf(groupRef.current);
      if (index !== -1) {
        acquiredItemRefs.splice(index, 1);
        console.log(`Removed acquired ${item.name} from outline list, remaining: ${acquiredItemRefs.length}`);
      }
    };
  }, [item.name]);
  
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
    
    setAdjustedConfig(newConfig);
  }, [size.width, size.height, baseConfig, item.name]);

  // useFrame must NOT be called conditionally - this is a React hooks rule
  useFrame((state, delta) => {
    if (!groupRef.current || !adjustedConfig) return;

    // IMPORTANT: Ensure visibility during message overlay and when forceVisible is true
    if (forceVisible && !groupRef.current.visible) {
      groupRef.current.visible = true;
    }

    // Ensure the item stays relative to the camera - this must happen regardless of shake or bob state
    groupRef.current.position.copy(camera.position);
    groupRef.current.rotation.copy(camera.rotation);
    
    // Apply the configured position offset (in camera space)
    // Use adjustedConfig if available, otherwise use defaults
    const config = adjustedConfig || baseConfig;
    const posOffset = config.position.clone();
    
    // IMPORTANT: Always process shake effect even if head bob is paused
    // Apply shake effect if camera shake is active
    if (cameraShaking) {
      // Generate random shake offsets - scale down for acquired items compared to camera
      // Get actual intensity from the shake state and apply a multiplier for items
      const intensityValue = cameraShakingState.intensity || 0.5;
      const shakeIntensity = intensityValue * 1.0; // Use full camera shake intensity for items for more visible effect
      
      // Apply more dramatic shake for visibility
      const offsetX = (Math.random() * 2 - 1) * shakeIntensity * 0.08;
      const offsetY = (Math.random() * 2 - 1) * shakeIntensity * 0.08;
      const offsetZ = (Math.random() * 2 - 1) * shakeIntensity * 0.04;
      
      // Add shake offsets to the position offset
      posOffset.x += offsetX;
      posOffset.y += offsetY;
      posOffset.z += offsetZ;
      
      // We'll apply rotation shake separately below
    }

    // Handle head bobbing (but not during shake)
    if (cameraShaking && !headBobRef.current.bobPaused) {
      headBobRef.current.bobPaused = true;
      headBobRef.current.pauseTimer = 0;
    } 
    else if (!cameraShaking && headBobRef.current.bobPaused) {
      // Add a pause timer to gradually resume bobbing after shake
      headBobRef.current.pauseTimer += delta;
      if (headBobRef.current.pauseTimer > 1.0) { // 1 second delay
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
    
    // Add bobbing only if not paused and not shaking
    if (!cameraShaking && !headBobRef.current.bobPaused) {
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
    
    // Add rotation shake if camera is shaking
    if (cameraShaking) {
      const intensityValue = cameraShakingState.intensity || 0.5;
      const shakeIntensity = intensityValue * 1.2; // Exaggerate rotation shake for more visible effect
      
      // Add random rotation shake - more dramatic for visibility
      rotX += (Math.random() * 2 - 1) * shakeIntensity * 0.08;
      rotZ += (Math.random() * 2 - 1) * shakeIntensity * 0.08;
    } 
    // Add subtle rotation variation based on movement (if not paused and not shaking)
    else if (!headBobRef.current.bobPaused) {
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

  // Calculate swing rotation based on direction, progress, and swing type
  const calculateSwordSwingRotation = (direction, progress, swingType) => {
    if (!swordSwinging) {
      return [0, 0, 0]; // Default rotation
    }
    
    // Check if this is a special slash animation
    if (swingType === 'slash') {
      // Use a specialized diagonal slash animation from top-right to bottom-left
      
      // Arc path for the slash
      // Start with sword raised and angled in top right
      // Swing through to bottom left with follow-through
      
      // Maximum rotation angles for slash (in radians) - more dramatic
      const maxRotX = -Math.PI * 0.4; // More angled downward
      const maxRotY = Math.PI * 0.9; // More significant horizontal component
      const maxRotZ = Math.PI * 0.6; // More twist during swing
      
      // Calculate starting positions (pre-swing) - more exaggerated wind-up
      const startRotX = Math.PI * 0.3; // Higher raised position
      const startRotY = -Math.PI * 0.4; // More angled to right side
      const startRotZ = -Math.PI * 0.2; // More twisted
      
      // Calculate the swing arc - combine pre-swing and full swing
      if (progress < 0.2) {
        // Initial wind-up (0-20% of animation)
        // Normalize progress to 0-1 range for this phase
        const phaseProgress = progress / 0.2;
        const windupEase = easeInQuad(phaseProgress);
        
        // Move to wind-up position
        const rotX = startRotX * windupEase;
        const rotY = startRotY * windupEase;
        const rotZ = startRotZ * windupEase;
        
        return [rotX, rotY, rotZ];
      } else {
        // Main swing (20-100% of animation)
        // Normalize progress to 0-1 range for this phase
        const phaseProgress = (progress - 0.2) / 0.8;
        const swingEase = easeOutQuint(phaseProgress);
        
        // Calculate a smooth arc from wind-up to follow-through
        const rotX = startRotX + (maxRotX - startRotX) * swingEase;
        const rotY = startRotY + (maxRotY - startRotY) * swingEase;
        const rotZ = startRotZ + (maxRotZ - startRotZ) * swingEase;
        
        return [rotX, rotY, rotZ];
      }
    } else {
      // Original swing animation logic for default swing
      // Extract direction components
      const { x, y } = direction;
      
      // Calculate swing angle based on direction
      // Use an easing function for the swing (ease-out)
      const easedProgress = easeOutCubic(progress);
      
      // Calculate the primary swing axis based on which direction is stronger
      const isHorizontalDominant = Math.abs(x) > Math.abs(y);
      
      // Maximum rotation angles in radians
      const maxRotationX = Math.PI * 1.5; // Up to 270 degrees rotation
      const maxRotationY = Math.PI * 1.5; // Up to 270 degrees rotation
      const maxRotationZ = Math.PI * 0.75; // Up to 135 degrees rotation for twist
      
      // Calculate direction weight - how much of each axis to use
      const xWeight = (Math.abs(y) / (Math.abs(x) + Math.abs(y) || 1));
      const yWeight = (Math.abs(x) / (Math.abs(x) + Math.abs(y) || 1));
      
      // Calculate current rotation based on progress
      // Use sin curve for natural swing motion with a longer follow-through
      const swingCurve = Math.sin(easedProgress * Math.PI) * (1 + easedProgress * 0.5);
      
      // Direction-aware rotation with more dramatic values
      // Sign of x/y determines swing direction (left/right or up/down)
      const rotX = isHorizontalDominant 
        ? -y * maxRotationX * 0.3 * swingCurve // Secondary axis when horizontal is dominant
        : -y * maxRotationX * swingCurve;      // Primary axis for vertical swipes
        
      const rotY = isHorizontalDominant
        ? x * maxRotationY * swingCurve        // Primary axis for horizontal swipes
        : x * maxRotationY * 0.3 * swingCurve; // Secondary axis when vertical is dominant
        
      // Add some twist for visual flair, more pronounced for diagonal swipes
      const diagonalFactor = Math.abs(x * y) / ((Math.abs(x) + Math.abs(y)) / 2 || 1);
      const rotZ = maxRotationZ * swingCurve * diagonalFactor * (x < 0 ? -1 : 1);
      
      return [rotX, rotY, rotZ];
    }
  };

  // Calculate swing position offset based on direction, progress, and type
  const calculateSwordSwingPosition = (direction, progress, swingType) => {
    if (!swordSwinging) {
      return [0, 0, 0]; // Default position
    }
    
    // Check if this is a special slash animation
    if (swingType === 'slash') {
      // Custom orbital path for the slash animation
      // We want the sword to move in an arc that:
      // 1. Starts from top-right
      // 2. Swings down and to the left in a curved path
      // 3. Returns to normal position
      
      if (progress < 0.2) {
        // Wind-up phase (0-20% of animation) - move to starting position
        // Normalize progress to 0-1 range for this phase
        const phaseProgress = progress / 0.2;
        const windupEase = easeInQuad(phaseProgress);
        
        // Starting position in top-right - more exaggerated
        const startX = 2.0;  // Further right
        const startY = 1.5;  // Higher up
        const startZ = -1.5; // More forward
        
        // Move to wind-up position
        const posX = startX * windupEase;
        const posY = startY * windupEase;
        const posZ = startZ * windupEase;
        
        return [posX, posY, posZ];
      } else {
        // Main swing phase (20-100% of animation)
        // Normalize progress to 0-1 range for this phase
        const phaseProgress = (progress - 0.2) / 0.8;
        
        // Calculate the orbital arc from top-right to bottom-left
        // Use parametric equations to define the arc
        
        // Start with wind-up position - more exaggerated
        const startX = 2.0;  // Further right
        const startY = 1.5;  // Higher up
        const startZ = -1.5; // More forward
        
        // End with extended follow-through position - more exaggerated
        const endX = -2.0;  // Further left
        const endY = -1.2;  // More down
        const endZ = -0.3;  // More forward
        
        // Use a stronger easing function for the slash
        const slashEase = easeOutQuint(phaseProgress);
        
        // Add a slight forward thrust during the middle of the swing
        let thrustZ = 0;
        if (phaseProgress > 0.2 && phaseProgress < 0.7) {
          // Normalize to 0-1 range for this sub-phase
          const thrustProgress = (phaseProgress - 0.2) / 0.5;
          // Parabolic curve for thrust (rises then falls)
          thrustZ = -0.5 * Math.sin(thrustProgress * Math.PI);
        }
        
        // Calculate position along the arc
        const posX = startX + (endX - startX) * slashEase;
        const posY = startY + (endY - startY) * slashEase;
        const posZ = startZ + (endZ - startZ) * slashEase + thrustZ;
        
        return [posX, posY, posZ];
      }
    } else {
      // Original position calculation for default swing
      // Extract direction components
      const { x, y } = direction;
      
      // Calculate position offset based on direction
      // Use an easing function for the swing (ease-out)
      const easedProgress = easeOutCubic(progress);
      
      // Maximum position offset
      const maxOffsetX = 0.8; // Horizontal movement
      const maxOffsetY = 0.6; // Vertical movement
      const maxOffsetZ = 0.5; // Forward thrust
      
      // Calculate movement curve - quick thrust followed by slower return
      const swingCurve = Math.sin(easedProgress * Math.PI);
      const thrustCurve = easedProgress < 0.4 
        ? easedProgress * 2.5 // Fast initial thrust
        : 1 - ((easedProgress - 0.4) * 1.67); // Slower return
      
      // Apply movement
      const offsetX = -x * maxOffsetX * swingCurve;
      const offsetY = -y * maxOffsetY * swingCurve;
      
      // Add a forward thrust at the start of the swing
      const offsetZ = maxOffsetZ * thrustCurve * Math.max(0.2, Math.abs(x) + Math.abs(y));
      
      return [offsetX, offsetY, offsetZ];
    }
  };

  // Easing functions for more natural animation
  const easeOutCubic = (x) => {
    return 1 - Math.pow(1 - x, 3);
  };

  const easeOutQuint = (x) => {
    return 1 - Math.pow(1 - x, 5);
  };

  const easeOutBack = (x) => {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
  };

  const easeInQuad = (x) => {
    return x * x;
  };

  // Render the appropriate model based on item type
  const renderItemModel = () => {
    // Use adjustedConfig if available, otherwise fall back to baseConfig
    const config = adjustedConfig || baseConfig;
  
    // IMPORTANT: Item-specific rendering with outlines
    switch(item.name) {
      case 'Lantern':
        return (
          <group position={[0, .2, 0]} scale={[config.scale, config.scale, config.scale]}>
            {/* Use outlined lantern with white outline */}
            <OutlinedLantern outlineThickness={0.05} />
            
            {/* Additional always-on ambient light for the lantern */}
            <pointLight 
              color="#ffcc77" 
              intensity={15}
              distance={10}
              decay={1}
              position={[0, 0.2, 0]}
            />
          </group>
        );
      case 'Toy Wooden Sword':
        return (
          <group scale={[config.scale, config.scale, config.scale]}>
            {/* Wrap in an extra group for swing animation */}
            <group
              rotation={calculateSwordSwingRotation(swingDirection, swingProgress, swingType)}
              position={calculateSwordSwingPosition(swingDirection, swingProgress, swingType)}
            >
              {/* Add an additional offset to improve sword swing pivot point */}
              <group position={[0, -0.2, 0]}>
                {/* Use outlined sword with white outline */}
                <OutlinedSword outlineThickness={0.05} />
              </group>
            </group>
          </group>
        );
      default:
        // Fallback to a box with white outline for unknown items
        return (
          <group scale={[0.2, 0.2, 0.2]}>
            {/* Outline - slightly larger white box */}
            <mesh scale={[1.1, 1.1, 1.1]} renderOrder={1}>
              <boxGeometry />
              <meshBasicMaterial 
                color="#FFFFFF" 
                side={THREE.BackSide} 
                depthTest={true} 
              />
            </mesh>
            
            {/* Main box */}
            <mesh renderOrder={2}>
              <boxGeometry />
              <meshStandardMaterial color={item.color || 'white'} />
            </mesh>
          </group>
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
  const showItemDisplay = useGameStore(state => state.showItemDisplay);
  const showMessageOverlay = useGameStore(state => state.showMessageOverlay);
  const { size } = useThree();
  
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
  
  // Always render items if they're in inventory, regardless of other flags
  // This ensures consistent visibility across all scenarios
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