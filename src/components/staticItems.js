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
  const clickedRef = useRef(false);
  const [dismissCooldown, setDismissCooldown] = useState(false);
  
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
        return 0.16;
      default:
        return 1.0;
    }
  };
  
  const modelScale = getModelScale();
  
  // Add ref to the static array when mounted, remove when unmounted
  useEffect(() => {
    if (groupRef.current) {
      staticItemRefs.push(groupRef.current);
    }
    
    return () => {
      const index = staticItemRefs.indexOf(groupRef.current);
      if (index !== -1) {
        staticItemRefs.splice(index, 1);
      }
    };
  }, [itemType]);

  // Reset clicked state when overlay appears
  useEffect(() => {
    if (showMessageOverlay) {
      clickedRef.current = false;
    }
  }, [showMessageOverlay]);
  
  // Track overlay state changes to add cooldown period after dismissal
  const [lastOverlayState, setLastOverlayState] = useState(false);
  
  useEffect(() => {
    // If overlay was showing, and now it's not, set dismissal cooldown
    if (lastOverlayState && !showMessageOverlay) {
      setDismissCooldown(true);
      
      // Reset cooldown after a delay to allow overlay to fully transition out
      const timer = setTimeout(() => {
        setDismissCooldown(false);
      }, 600); // Slightly longer than overlay transition (500ms)
      
      return () => clearTimeout(timer);
    }
    
    // Update the last overlay state
    setLastOverlayState(showMessageOverlay);
  }, [showMessageOverlay, lastOverlayState, itemType]);
  
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
      // Move toward player
      const playerX = camera.position.x;
      const playerY = camera.position.y - 0.5; // Target slightly below player's center for better effect
      const playerZ = camera.position.z;
      
      // Smoothly move toward the player position with a slight downward arc
      const distanceToPlayer = new THREE.Vector3(playerX, playerY, playerZ)
        .distanceTo(groupRef.current.position);
      
      // Add a downward arc as it approaches the player
      const downwardArc = Math.max(0, Math.min(0.5, distanceToPlayer * 0.2)) * Math.sin(state.clock.elapsedTime * 2);
      
      groupRef.current.position.x += (playerX - groupRef.current.position.x) * 0.1;
      groupRef.current.position.y += ((playerY - downwardArc) - groupRef.current.position.y) * 0.1;
      groupRef.current.position.z += (playerZ - groupRef.current.position.z) * 0.1;
      
      // Scale down as it approaches the player
      groupRef.current.scale.x = Math.max(0.01, groupRef.current.scale.x - 0.02);
      groupRef.current.scale.y = Math.max(0.01, groupRef.current.scale.y - 0.02);
      groupRef.current.scale.z = Math.max(0.01, groupRef.current.scale.z - 0.02);
      
      // Increase rotation speed
      groupRef.current.rotation.y += 0.1;
      
      // Check if item has reached player
      if (distanceToPlayer < 0.3 || groupRef.current.scale.x <= 0.01) {
        // Item has been fully acquired
        const addToInventory = useGameStore.getState().addToInventory;
        addToInventory(experience.item);
      }
    }
  });
  
  // Modified visibility logic to keep sword visible during message overlay
  const isSwordItem = itemType === 'Toy Wooden Sword';
  const isVisible = isSwordItem ? true : !(isActive && itemAnimationPhase === 'acquired');
  
  // Use a constant glow effect instead of hover-based
  const isInteractive = isActive && !showMessageOverlay && !dismissCooldown;
  // Remove hover-based scale changes
  const glowScale = 1.0;
  // Constant glow intensity
  const glowIntensity = 0.3;
  
  // Improved item click handling with cooldown period
  const handleItemObjectClick = (e) => {
    e.stopPropagation();
    
    // Get current state to check item clickability
    const store = useGameStore.getState();
    const currentExperienceIndex = store.currentExperienceIndex;
    const currentExperience = store.experienceScript.experiences[currentExperienceIndex];
    const isMessageVisible = store.showMessageOverlay;
    const animationPhase = store.itemAnimationPhase;
    
    // Item should be clickable if:
    // 1. It's the active item for the current experience
    // 2. No message overlay is showing
    // 3. The item is in "clickable" phase OR in the initial hidden phase
    // 4. The dismissal cooldown is not active
    const isCurrentItemExperience = 
      isActive && 
      currentExperience?.type === 'item' && 
      currentExperience?.item?.name === itemType;
    
    const isClickable = 
      isCurrentItemExperience && 
      !isMessageVisible && 
      !dismissCooldown && 
      (animationPhase === 'clickable' || animationPhase === 'hidden');
    
    // Only process if item is determined to be clickable
    if (isClickable && !clickedRef.current) {
      // Mark as clicked to prevent multiple acquisition attempts
      clickedRef.current = true;
      
      // Modify the game state to acquire the item
      store.setShowItemDisplay(true);
      store.setItemAnimationPhase('acquiring');
      store.setShowMessageOverlay(false);
      store.setMessageBoxVisible(false);
    }
  };
  
  const renderItemModel = () => {
    switch(itemType) {
      case 'Lantern':
        return (
          <group position={[0, .2, 0]} scale={[modelScale, modelScale, modelScale]}>
            <OutlinedLantern 
              outlineThickness={0.05} 
              emissiveIntensity={0.4}
              lightIntensity={4}
            />
          </group>
        );
      case 'Toy Wooden Sword':
        return (
          <group scale={[modelScale, modelScale, modelScale]} rotation={[0, 0, Math.PI / 4]}>
            <OutlinedSword outlineThickness={0.05} />
          </group>
        );
      default:
        // Fallback to a box with white outline for unknown items
        return (
          <group>
            <mesh scale={[0.52, 0.52, 0.52]} renderOrder={1}>
              <boxGeometry />
              <meshBasicMaterial 
                color="#FFFFFF" 
                side={THREE.BackSide} 
                depthTest={true} 
              />
            </mesh>
            
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
      scale={[glowScale, glowScale, glowScale]}
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
  
  // Force the sword to display when it's the current experience
  useEffect(() => {
    if (isSwordExperience) {
      useGameStore.getState().setForceItemsVisible(true);
      useGameStore.getState().setShowItemDisplay(true);
    }
  }, [isSwordExperience, currentExperienceIndex]);
  
  return (
    <>
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