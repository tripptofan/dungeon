import React, { useRef, useState, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import useGameStore from '../store';
import * as THREE from 'three';
import { Model as Lantern } from './lantern'; // Import Lantern model
import { Model as WoodenSword } from './woodenSword'; // Import WoodenSword model

// Individual item component that handles both static display and animation
const ItemObject = ({ experience, isActive, isInteractive }) => {
  const { camera } = useThree();
  const groupRef = useRef();
  const [hovered, setHovered] = useState(false);
  
  // Get animation state from store
  const itemAnimationPhase = useGameStore(state => state.itemAnimationPhase);
  const handleItemClick = useGameStore(state => state.handleItemClick);
  
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
        return 0.3;
      default:
        return 1.0;
    }
  };
  
  const modelScale = getModelScale();
  
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
  
  // Determine if the item should be visible
  const isVisible = !(isActive && itemAnimationPhase === 'acquired');
  
  // For glow effect when hovered and clickable
  const glowScale = (hovered && isInteractive) ? 1.1 : 1.0;
  const glowIntensity = (hovered && isInteractive) ? 0.8 : 0.3;
  
  // Render the 3D model based on item type
  const renderItemModel = () => {
    switch(itemType) {
      case 'Lantern':
        return (
          <group position={[0, .2, 0]} scale={[modelScale, modelScale, modelScale]}>
            <Lantern />
            {/* Add a subtle light inside the lantern */}
            <pointLight 
              color="orange" 
              intensity={15} 
              distance={10} 
              decay={2} 
              position={[0, 0.2, 0]} 
            />
            
            {/* Add a visible glass effect manually */}
            <mesh position={[0, 0, 0]}>
              <meshPhysicalMaterial
                color="#ffcc88"
                transparent={true}
                opacity={0.5}
                transmission={0.5}
                roughness={0.1}
                clearcoat={0.5}
                emissive="#ffcc77"
                emissiveIntensity={0.2}
                side={THREE.DoubleSide}
              />
            </mesh>
          </group>
        );
      case 'Toy Wooden Sword':
        return (
          <group scale={[modelScale, modelScale, modelScale]} rotation={[0, 0, Math.PI / 4]}>
            <WoodenSword />
          </group>
        );
      default:
        // Fallback to box for unknown items
        return (
          <mesh>
            <boxGeometry args={[0.5, 0.5, 0.5]} />
            <meshStandardMaterial 
              color={experience.item?.color || 'white'}
              emissive={experience.item?.color || 'white'}
              emissiveIntensity={glowIntensity}
            />
          </mesh>
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
      onClick={(e) => {
        e.stopPropagation();
        // Only allow click if item is in clickable state
        if (isActive && isInteractive && itemAnimationPhase === 'clickable') {
          handleItemClick();
        }
      }}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
      scale={[glowScale, glowScale, glowScale]} // Grow slightly when hovered
    >
      {renderItemModel()}
      
      {/* Add a glow effect when hovered */}
      {hovered && isInteractive && (
        <mesh>
          <sphereGeometry args={[0.8, 16, 16]} />
          <meshBasicMaterial 
            color={experience.item?.color || 'white'} 
            transparent 
            opacity={0.2} 
          />
        </mesh>
      )}
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
  const itemAnimationPhase = useGameStore(state => state.itemAnimationPhase);
  const inventory = useGameStore(state => state.inventory);
  
  return (
    <>
      {/* Render all items for experiences of type 'item' */}
      {experiences.map((experience, index) => {
        // Skip if not an item experience type
        if (experience.type !== 'item') return null;
        
        // Check if this item is already in the inventory
        const isInInventory = inventory.some(item => 
          item.name === experience.item.name
        );
        
        // Always render if not in inventory, regardless of current experience
        if (!isInInventory) {
          // Item is active if it's the current experience and showItemDisplay is true,
          // but not during movement - this ensures items remain visible during transit
          const isActiveExperience = index === currentExperienceIndex;
          const isActive = isActiveExperience && showItemDisplay && !isMovingCamera;
          
          // Item is only interactive if it's active, not showing message, and in clickable phase
          const isInteractive = isActive && !showMessageOverlay && itemAnimationPhase === 'clickable';
          
          return (
            <ItemObject 
              key={`item-${index}`}
              experience={experience}
              isActive={isActive}
              isInteractive={isInteractive}
            />
          );
        }
        return null;
      })}
    </>
  );
};

export default React.memo(StaticItems);