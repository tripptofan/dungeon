import React, { useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import useGameStore from '../store';
import * as THREE from 'three';

// Individual item component that handles both static display and animation
const ItemObject = ({ experience, isActive, isInteractive }) => {
  const { camera } = useThree();
  const meshRef = useRef();
  const [hovered, setHovered] = useState(false);
  
  // Get animation state from store
  const itemAnimationPhase = useGameStore(state => state.itemAnimationPhase);
  const handleItemClick = useGameStore(state => state.handleItemClick);
  
  // Item size and height
  const itemSize = 0.5;
  const floatingHeight = 2;
  
  // Animation for all items
  useFrame((state, delta) => {
    if (!meshRef.current) return;
    
    // Basic floating animation for all items
    if (!isActive || itemAnimationPhase === 'hidden') {
      // Calculate a floating effect based on time
      const floatOffset = Math.sin(state.clock.elapsedTime + (experience.experience * 0.5)) * 0.1;
      meshRef.current.position.y = floatingHeight + floatOffset;
      
      // Slow rotation for all items
      meshRef.current.rotation.y += 0.002;
    }
    else if (isActive) {
      if (itemAnimationPhase === 'clickable') {
        // Keep position the same but add a more noticeable floating animation
        const floatOffset = Math.sin(state.clock.elapsedTime * 3) * 0.15;
        meshRef.current.position.y = floatingHeight + floatOffset;
        
        // Slightly faster rotation to draw attention
        meshRef.current.rotation.y += 0.01;
      }
      else if (itemAnimationPhase === 'acquiring') {
        // Move toward player
        const playerX = camera.position.x;
        const playerY = camera.position.y;
        const playerZ = camera.position.z;
        
        // Smoothly move toward the player position
        meshRef.current.position.x += (playerX - meshRef.current.position.x) * 0.1;
        meshRef.current.position.y += (playerY - meshRef.current.position.y) * 0.1;
        meshRef.current.position.z += (playerZ - meshRef.current.position.z) * 0.1;
        
        // Scale down as it approaches the player
        meshRef.current.scale.x = Math.max(0.01, meshRef.current.scale.x - 0.02);
        meshRef.current.scale.y = Math.max(0.01, meshRef.current.scale.y - 0.02);
        meshRef.current.scale.z = Math.max(0.01, meshRef.current.scale.z - 0.02);
        
        // Increase rotation speed
        meshRef.current.rotation.y += 0.1;
        
        // Check if item has reached player
        const distanceToPlayer = new THREE.Vector3(playerX, playerY, playerZ)
          .distanceTo(meshRef.current.position);
          
        if (distanceToPlayer < 0.3 || meshRef.current.scale.x <= 0.01) {
          // Item has been fully acquired
          const addToInventory = useGameStore.getState().addToInventory;
          addToInventory(experience.item);
        }
      }
    }
  });
  
  // Determine color from item data or use default
  const itemColor = experience.item.color || 'white';
  
  // Determine if the item should be visible
  const isVisible = !(isActive && itemAnimationPhase === 'acquired');
  
  // Create a glow effect when hovered and clickable
  const emissiveIntensity = (hovered && isInteractive) ? 0.8 : 0.3;
  const glowScale = (hovered && isInteractive) ? 1.1 : 1.0;
  
  return (
    <mesh 
      ref={meshRef}
      position={[
        experience.itemPosition.x, 
        floatingHeight, // Floating at eye level
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
      <boxGeometry args={[itemSize, itemSize, itemSize]} />
      <meshStandardMaterial 
        color={itemColor}
        emissive={itemColor}
        emissiveIntensity={emissiveIntensity}
      />
    </mesh>
  );
};

// Main component that renders all items
const StaticItems = () => {
  const experiences = useGameStore(state => state.experienceScript.experiences);
  const currentExperienceIndex = useGameStore(state => state.currentExperienceIndex);
  const showItemDisplay = useGameStore(state => state.showItemDisplay);
  const itemAnimationPhase = useGameStore(state => state.itemAnimationPhase);
  const inventory = useGameStore(state => state.inventory);
  
  return (
    <>
      {/* Render all experience items at their positions if they're not in inventory */}
      {experiences.map((experience, index) => {
        // Check if this item is already in the inventory
        const isInInventory = inventory.some(item => 
          item.name === experience.item.name
        );
        
        // Only render if not in inventory
        if (!isInInventory) {
          // Determine if item is active and interactive
          const isActive = index === currentExperienceIndex && showItemDisplay;
          
          // Item is only interactive if it's active and in the clickable phase
          const isInteractive = isActive && itemAnimationPhase === 'clickable';
          
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