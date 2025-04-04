import React, { useRef, useState, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import useGameStore from '../store';
import * as THREE from 'three';
import OutlinedLantern from './outlinedLantern';
import OutlinedSword from './outlinedSword';

// Static array to store refs to all item objects for outlining
export const staticItemRefs = [];

// Individual item component that handles both static display and animation
const ItemObject = ({ experience, isActive }) => {
  const { camera } = useThree();
  const groupRef = useRef();
  const [hovered, setHovered] = useState(false);
  const clickedRef = useRef(false);
  
  // NEW: Add acquisition tracking ref
  const acquisitionStartTimeRef = useRef(null);
  
  // Get animation state from store
  const itemAnimationPhase = useGameStore(state => state.itemAnimationPhase);
  const showMessageOverlay = useGameStore(state => state.showMessageOverlay);
  
  // Item height
  const floatingHeight = 2;
  
  // Determine which model to show based on item name
  const itemType = experience.item?.name || '';
  
  // Calculate appropriate scale based on item type
  const getModelScale = () => {
    switch(itemType) {
      case 'Lantern':
        return 0.2;
      case 'Toy Wooden Sword':
        return 0.2;
      default:
        return 1.0;
    }
  };
  
  const modelScale = getModelScale();
  
  // Add ref to the static array when mounted, remove when unmounted
  useEffect(() => {
    if (groupRef.current) {
      staticItemRefs.push(groupRef.current);
      console.log(`Added ${itemType} to outline list, total: ${staticItemRefs.length}`);
    }
    
    return () => {
      const index = staticItemRefs.indexOf(groupRef.current);
      if (index !== -1) {
        staticItemRefs.splice(index, 1);
        console.log(`Removed ${itemType} from outline list, remaining: ${staticItemRefs.length}`);
      }
    };
  }, [itemType]);

  // Reset clicked state when overlay appears
  useEffect(() => {
    if (showMessageOverlay) {
      clickedRef.current = false;
    }
  }, [showMessageOverlay]);
  
  // Animation for all items
// Animation for all items
  useFrame((state, delta) => {
    if (!groupRef.current) return;
    
    // Consistent rotation speed for all non-acquiring items
    const baseRotationSpeed = 0.005;
    
    // Basic floating animation for all visible items (inactive or not hidden)
    if (itemAnimationPhase !== 'acquiring') {
      // Calculate a consistent floating effect based on time
      const floatOffset = Math.sin(state.clock.elapsedTime + (experience.experience * 0.5)) * 0.1;
      groupRef.current.position.y = floatingHeight + floatOffset;
      
      // Consistent rotation for all visible items
      groupRef.current.rotation.y += baseRotationSpeed;
    }
    
    // Special animation only during acquisition
    if (isActive && itemAnimationPhase === 'acquiring') {
      // Track acquisition start time if not already tracking
      if (!acquisitionStartTimeRef.current) {
        acquisitionStartTimeRef.current = state.clock.elapsedTime;
        console.log(`${itemType} acquisition started at time: ${acquisitionStartTimeRef.current}`);
      }
      
      // Calculate elapsed acquisition time
      const acquisitionElapsedTime = state.clock.elapsedTime - acquisitionStartTimeRef.current;
      
      // Move toward player
      const playerX = camera.position.x;
      const playerY = camera.position.y - 0.5; // Target slightly below player's center for better effect
      const playerZ = camera.position.z;
      
      // Smoothly move toward the player position with a slight downward arc
      const distanceToPlayer = new THREE.Vector3(playerX, playerY, playerZ)
        .distanceTo(groupRef.current.position);
      
      // Add a downward arc as it approaches the player
      const downwardArc = Math.max(0, Math.min(0.5, distanceToPlayer * 0.2)) * Math.sin(state.clock.elapsedTime * 2);
      
      // IMPROVED: Faster movement toward player (0.1 increased to 0.15)
      groupRef.current.position.x += (playerX - groupRef.current.position.x) * 0.15;
      groupRef.current.position.y += ((playerY - downwardArc) - groupRef.current.position.y) * 0.15;
      groupRef.current.position.z += (playerZ - groupRef.current.position.z) * 0.15;
      
      // IMPROVED: Scale down faster (0.02 increased to 0.05)
      const scaleReduction = 0.05; 
      groupRef.current.scale.x = Math.max(0.01, groupRef.current.scale.x - scaleReduction);
      groupRef.current.scale.y = Math.max(0.01, groupRef.current.scale.y - scaleReduction);
      groupRef.current.scale.z = Math.max(0.01, groupRef.current.scale.z - scaleReduction);
      
      // Increase rotation speed
      groupRef.current.rotation.y += 0.1;
      
      // IMPROVED: Check for acquisition completion with more generous thresholds
      const isCloseEnough = distanceToPlayer < 0.5; // Was 0.3, now more generous
      const isSmallEnough = groupRef.current.scale.x <= 0.05; // More generous scale threshold
      const hasTimedOut = acquisitionElapsedTime > 3.0; // Timeout after 3 seconds
      
      // Complete acquisition if ANY completion condition is met
      if (isCloseEnough || isSmallEnough || hasTimedOut) {
        // Debug which condition triggered completion
        if (isCloseEnough) console.log(`${itemType} acquired - close enough to player`);
        if (isSmallEnough) console.log(`${itemType} acquired - scaled down enough`);
        if (hasTimedOut) console.log(`${itemType} acquired - timeout reached`);
        
        // Item has been fully acquired - add to inventory
        const addToInventory = useGameStore.getState().addToInventory;
        
        // Ensure item isn't already in inventory before adding
        const inventory = useGameStore.getState().inventory;
        const alreadyInInventory = inventory.some(item => item.name === experience.item.name);
        
        if (!alreadyInInventory) {
          console.log(`${itemType} adding to inventory...`);
          addToInventory(experience.item);
          
          // Reset scale to avoid weird visuals if item remains in scene briefly
          groupRef.current.scale.set(0.01, 0.01, 0.01);
          
          // Reset acquisition tracking
          acquisitionStartTimeRef.current = null;
        } else {
          console.log(`${itemType} already in inventory, skipping addition`);
        }
      }
    }
  });
  
  // Modified visibility logic to keep sword visible during message overlay
  const isSwordItem = itemType === 'Toy Wooden Sword';
  const isVisible = isSwordItem ? true : !(isActive && itemAnimationPhase === 'acquired');
  
  // For glow effect when hovered and clickable
  const isInteractive = isActive && !showMessageOverlay;
  const glowScale = (hovered && isInteractive) ? 1.05 : 1.0;
  const glowIntensity = (hovered && isInteractive) ? 0.8 : 0.3;
  
  // ONE-CLICK SOLUTION: Direct acquisition on click
// ONE-CLICK SOLUTION: Direct acquisition on click with enhanced debugging
// ONE-CLICK SOLUTION: Direct acquisition on click with blocking support
// ONE-CLICK SOLUTION: Direct acquisition on click with improved reliability
const handleItemObjectClick = (e) => {
  e.stopPropagation();
  
  // Get current state to check item clickability
  const store = useGameStore.getState();
  
  // Check if item clicks are blocked - exit early if they are
  if (store.blockItemClicks) {
    console.log(`Item ${itemType} clicked but clicks are blocked by overlay`);
    return;
  }
  
  console.log(`Item ${itemType} clicked - checking if clickable`);
  
  const currentExperienceIndex = store.currentExperienceIndex;
  const currentExperience = store.experienceScript.experiences[currentExperienceIndex];
  const isMessageVisible = store.showMessageOverlay;
  const animationPhase = store.itemAnimationPhase;
  
  // Log all relevant state for debugging
  console.log("Item click state:", {
    itemType,
    currentExperienceIndex,
    isCurrentExperience: currentExperience?.item?.name === itemType,
    isMessageVisible,
    animationPhase,
    clicked: clickedRef.current
  });
  
  // Item should be clickable if:
  // 1. It's the active item for the current experience
  // 2. No message overlay is showing
  // 3. The item is in "clickable" phase
  // 4. Item clicks are not blocked
  const isCurrentItemExperience = 
    isActive && 
    currentExperience?.type === 'item' && 
    currentExperience?.item?.name === itemType;
  
  const isClickable = 
    isCurrentItemExperience && 
    !isMessageVisible && 
    !store.blockItemClicks &&
    (animationPhase === 'clickable' || animationPhase === 'hidden');
  
  console.log(`Item ${itemType} click analysis - Clickable: ${isClickable}, Phase: ${animationPhase}`);
  
  // IMPROVEMENT: For debugging, also check if item has already been acquired
  const isAlreadyInInventory = store.inventory.some(item => item.name === itemType);
  if (isAlreadyInInventory) {
    console.log(`Item ${itemType} is already in inventory - skipping acquisition`);
    return;
  }
  
  // Only process if item is determined to be clickable
  if (isClickable && !clickedRef.current) {
    console.log(`Item ${itemType} starting acquisition!`);
    
    // Mark as clicked to prevent multiple acquisition attempts
    clickedRef.current = true;
    
    // DIRECTLY modify the game state to acquire the item
    store.setShowItemDisplay(true);
    store.setItemAnimationPhase('acquiring');
    store.setShowMessageOverlay(false);
    store.setMessageBoxVisible(false);
    
    console.log(`Item ${itemType} acquisition started!`);
    
    // Add verification timeout to ensure the acquisition proceeds
    setTimeout(() => {
      // Check if the item is in the animation phase after starting
      const currentPhase = useGameStore.getState().itemAnimationPhase;
      console.log(`VERIFICATION: Item ${itemType} acquisition phase: ${currentPhase}`);
      
      // If somehow the phase got stuck, force it to acquiring
      if (currentPhase !== 'acquiring' && currentPhase !== 'acquired') {
        console.log("Forcing item animation phase to acquiring");
        useGameStore.getState().setItemAnimationPhase('acquiring');
      }
    }, 100);
  }
};
  
  
  const renderItemModel = () => {
    switch(itemType) {
      case 'Lantern':
        return (
          <group position={[0, .2, 0]} scale={[modelScale, modelScale, modelScale]}>
            {/* Use outlined lantern with white outline */}
            <OutlinedLantern outlineThickness={0.05} />
          </group>
        );
      case 'Toy Wooden Sword':
        return (
          <group scale={[modelScale, modelScale, modelScale]} rotation={[0, 0, Math.PI / 4]}>
            {/* Use outlined sword with white outline */}
            <OutlinedSword outlineThickness={0.05} />
          </group>
        );
      default:
        // Fallback to a box with white outline for unknown items
        return (
          <group>
            {/* Outline - slightly larger white box */}
            <mesh scale={[0.52, 0.52, 0.52]} renderOrder={1}>
              <boxGeometry />
              <meshBasicMaterial 
                color="#FFFFFF" 
                side={THREE.BackSide} 
                depthTest={true} 
              />
            </mesh>
            
            {/* Main box */}
            <mesh scale={[0.5, 0.5, 0.5]} renderOrder={2}>
              <boxGeometry />
              <meshStandardMaterial 
                color={experience.item?.color || 'white'}
                emissive={experience.item?.color || 'white'}
                emissiveIntensity={glowIntensity}
              />
            </mesh>
          </group>
        );
    }
  };
  
  // Create the scene graph for this item
  return (
    <group 
      ref={groupRef}
      position={[
        experience.itemPosition.x, 
        floatingHeight, 
        experience.itemPosition.z
      ]}
      visible={isVisible}
      onClick={handleItemObjectClick}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
      scale={[glowScale, glowScale, glowScale]} // Grow slightly when hovered
    >
      {renderItemModel()}
    </group>
  );
};

// Main component that renders all items
const StaticItems = () => {
  const experiences = useGameStore(state => state.experienceScript.experiences);
  const currentExperienceIndex = useGameStore(state => state.currentExperienceIndex);
  const showMessageOverlay = useGameStore(state => state.showMessageOverlay);
  const isMovingCamera = useGameStore(state => state.isMovingCamera);
  const showItemDisplay = useGameStore(state => state.showItemDisplay);
  const inventory = useGameStore(state => state.inventory);
  
  // Add special handling for the sword experience
  const currentExperience = currentExperienceIndex >= 0 && currentExperienceIndex < experiences.length 
    ? experiences[currentExperienceIndex] 
    : null;
  const isSwordExperience = currentExperience?.type === 'item' && 
    currentExperience?.item?.name === 'Toy Wooden Sword';
  
  // Track overlay dismissal
  const [lastOverlayState, setLastOverlayState] = useState(false);
  
  // Track overlay state changes
  useEffect(() => {
    // Reset clickable state whenever overlay changes
    if (lastOverlayState !== showMessageOverlay) {
      // If overlay was just dismissed and it's an item experience
      if (lastOverlayState && !showMessageOverlay && currentExperience?.type === 'item') {
        console.log("Overlay just dismissed - item should be clickable now");
      }
      
      // Update the last overlay state
      setLastOverlayState(showMessageOverlay);
    }
  }, [showMessageOverlay, lastOverlayState, currentExperience]);
  
  // Force the sword to display when it's the current experience
  useEffect(() => {
    if (isSwordExperience) {
      useGameStore.getState().setForceItemsVisible(true);
      useGameStore.getState().setShowItemDisplay(true);
    }
  }, [isSwordExperience, currentExperienceIndex]);
  
  return (
    <>
      {/* Render all items for experiences of type 'item' */}
      {experiences.map((experience, index) => {
        // Skip if not an item experience type
        if (experience.type !== 'item') return null;
        
        // Only render in-world items that haven't been acquired yet
        const isInInventory = inventory.some(item => 
          item.name === experience.item.name
        );
        
        // If the item is already in inventory, skip rendering it in the world
        if (isInInventory) return null;

        // Modified active experience logic to handle the sword special case
        const isActiveExperience = index === currentExperienceIndex;
        const isSword = experience.item.name === 'Toy Wooden Sword';
        
        // Force the sword to be active during its experience
        const isActive = isActiveExperience && (isSword || (showItemDisplay && !isMovingCamera));
        
        return (
          <ItemObject 
            key={`item-${index}`}
            experience={experience}
            isActive={isActive}
          />
        );
      })}
    </>
  );
};

export default React.memo(StaticItems);