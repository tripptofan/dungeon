import React, { useMemo, useState, useCallback } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import useGameStore from '../store';
import { useTextures } from '../utils/textureManagement';
import Torch from './torch'; // Import the torch component

const InstancedDoors = ({ doorPositions, tileSize }) => {
  const { materials } = useTextures();
  const { camera } = useThree();
  const doorClickable = useGameStore(state => state.doorClickable);
  const handleDoorClick = useGameStore(state => state.handleDoorClick);
  
  // Single door state - true when door has been clicked/opened
  const [doorOpened, setDoorOpened] = useState(false);
  // Track if we're in the process of opening the door to prevent multiple clicks
  const [isOpening, setIsOpening] = useState(false);
  
  // Create base materials with transparency
  const baseDoorMaterial = useMemo(() => {
    if (!materials.doorMaterial) return null;
    
    // Clone the material to prevent affecting other components
    const material = materials.doorMaterial.clone();
    
    // Set up transparency
    material.transparent = true;
    material.alphaTest = 0.5; // Only render pixels with alpha > 0.5
    
    return material;
  }, [materials.doorMaterial]);
  
  const openDoorMaterial = useMemo(() => {
    if (!materials.doorOpenMaterial) return null;
    
    // Clone the material to prevent affecting other components
    const material = materials.doorOpenMaterial.clone();
    
    // Set up transparency
    material.transparent = true;
    material.alphaTest = 0.5; // Only render pixels with alpha > 0.5
    
    return material;
  }, [materials.doorOpenMaterial]);

  // Handle door click with a delay
  const onDoorClick = useCallback((door) => {
    // Prevent clicking if door is not clickable or already being opened
    if (!doorClickable || doorOpened || isOpening) return;
    
    // Set door opening state to prevent multiple clicks
    setIsOpening(true);
    
    // Immediately change the texture by marking door as opened
    setDoorOpened(true);
    
    console.log("Door clicked at position:", door);
    
    // Wait 2 seconds before calling the global handler
    setTimeout(() => {
      // Call the global door click handler after delay
      handleDoorClick({x: door.x, z: door.z});
      // Door opening process is complete
      setIsOpening(false);
    }, 2000);
  }, [doorClickable, doorOpened, isOpening, handleDoorClick]);

  if (!baseDoorMaterial || !openDoorMaterial || doorPositions.length === 0) return null;

  // Just use the first door position since there's only one door
  const door = doorPositions[0];
  
  // Calculate torch positions - halfway up the wall, on the left and right sides
  const torchYPosition = tileSize / 2; // Same height as door center
  const torchOffset = tileSize * 0.38; // Offset from door center (70% of tile size)
  
  return (
    <group>
      {/* Door mesh */}
      <mesh
        position={[door.x, tileSize / 2, door.z - tileSize / 2]}
        castShadow={true}
        receiveShadow={true}
        onClick={(e) => {
          e.stopPropagation();
          onDoorClick(door);
        }}
      >
        <planeGeometry args={[tileSize, tileSize]} />
        <primitive
          object={doorOpened ? openDoorMaterial : baseDoorMaterial}
          side={THREE.DoubleSide}
        />
      </mesh>
      
      {/* Left torch */}
      <Torch
        position={[door.x + torchOffset, 2, door.z - .1]}
        rotation={[0, 0, 0]}
        scale={.7}
      />
      
      {/* Right torch */}
      <Torch
        position={[door.x - torchOffset -.2, 2, door.z - .1]}
        rotation={[0, 0, 0]}
        scale={0.7}
      />
    </group>
  );
};

export default React.memo(InstancedDoors);