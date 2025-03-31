import React, { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import useGameStore from '../store';

// Static array to store refs to chest for outlining (similar to other items)
export const treasureChestRefs = [];

// Component that renders a treasure chest as the final reward
const TreasureChest = () => {
  const chestRef = useRef();
  const [hovered, setHovered] = useState(false);
  
  // Get relevant state from the store
  const tileSize = useGameStore(state => state.tileSize);
  const dungeon = useGameStore(state => state.dungeon);
  const currentExperienceIndex = useGameStore(state => state.currentExperienceIndex);
  const experiences = useGameStore(state => state.experienceScript.experiences);
  const handleItemClick = useGameStore(state => state.handleItemClick);
  const showMessageOverlay = useGameStore(state => state.showMessageOverlay);
  
  // We'll position the chest at the same position defined in the 
  // chest experience (experience 6) but slightly ahead of where the player will stand
  const chestExperience = experiences.find(exp => exp.type === 'chest');
  // If chest experience is defined, use its position, otherwise fallback to default
  const chestPosition = chestExperience 
    ? { x: chestExperience.position.x, z: chestExperience.position.z - 5 } // 5 units in front of where player will stop
    : { x: 5, z: (dungeon[0].length - 2) * tileSize }; // Fallback
  
  // Determine whether this is the active experience
  const isChestExperience = currentExperienceIndex >= 0 && 
    currentExperienceIndex < experiences.length && 
    experiences[currentExperienceIndex].type === 'chest';
  
  // Determine if the chest is interactive (active and no overlay showing)
  const isInteractive = isChestExperience && !showMessageOverlay;
  
  // Add ref to the static array when mounted, remove when unmounted
  useEffect(() => {
    if (chestRef.current) {
      treasureChestRefs.push(chestRef.current);
      console.log(`Added treasure chest to outline list, total: ${treasureChestRefs.length}`);
    }
    
    return () => {
      const index = treasureChestRefs.indexOf(chestRef.current);
      if (index !== -1) {
        treasureChestRefs.splice(index, 1);
        console.log(`Removed treasure chest from outline list, remaining: ${treasureChestRefs.length}`);
      }
    };
  }, []);
  
  // No animation - chest should remain stationary on the floor
  useFrame(() => {
    if (!chestRef.current) return;
    
    // Ensure chest stays firmly on the ground
    chestRef.current.position.y = 0.5; // Half the height of the chest to sit on floor
  });
  
  // For glow effect when hovered and clickable - no scaling of the chest itself
  const glowIntensity = (hovered && isInteractive) ? 0.8 : 0.3;
  
  return (
    <group 
      ref={chestRef}
      position={[chestPosition.x, 0.5, chestPosition.z]} // Positioned based on the experience configuration
      onClick={(e) => {
        e.stopPropagation();
        if (isInteractive) {
          handleItemClick();
        }
      }}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      {/* Main chest body */}
      <mesh>
        <boxGeometry args={[2, 1, 1.2]} /> {/* Width, height, depth */}
        <meshStandardMaterial 
          color="#8B4513" // Brown wooden color
          roughness={0.7}
          metalness={0.3}
          emissive="#8B4513"
          emissiveIntensity={0.2} // Add some glow to be more visible
        />
      </mesh>
      
      {/* Chest lid */}
      <mesh position={[0, 0.5, 0]}>
        <boxGeometry args={[2, 0.3, 1.2]} />
        <meshStandardMaterial 
          color="#A0522D" // Slightly different brown for contrast
          roughness={0.6}
          metalness={0.4}
        />
      </mesh>
      
      {/* Metal details/lock */}
      <mesh position={[0, 0.3, 0.6]}>
        <boxGeometry args={[0.4, 0.4, 0.1]} />
        <meshStandardMaterial 
          color="#FFD700" // Gold color
          roughness={0.3}
          metalness={0.8}
          emissive="#FFD700"
          emissiveIntensity={0.2}
        />
      </mesh>
      
      {/* Add a subtle glow around the chest but don't make it too large */}
      <mesh position={[0, 0.2, 0]}>
        <sphereGeometry args={[1.2, 16, 16]} />
        <meshBasicMaterial 
          color="#FFD700" 
          transparent 
          opacity={hovered && isInteractive ? 0.25 : 0.1} 
        />
      </mesh>
      
      {/* Add a light source to make the chest more visible */}
      <pointLight
        color="#FFD700"
        intensity={1.5}
        distance={5}
        decay={2}
        position={[0, 0.5, 0]}
      />
    </group>
  );
};

export default React.memo(TreasureChest);