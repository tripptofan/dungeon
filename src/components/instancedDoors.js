import React, { useRef, useEffect, useMemo, useState } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import useGameStore from '../store';
import { useTextures } from '../utils/textureManagement';

// Constants for performance tuning
const LOD_DISTANCE = 20;
const CULLING_DISTANCE = 150;

const InstancedDoors = ({ doorPositions, tileSize }) => {
  const { materials } = useTextures();
  const { camera } = useThree();
  const doorClickable = useGameStore(state => state.doorClickable);
  const handleDoorClick = useGameStore(state => state.handleDoorClick);
  
  // For individual door meshes that support click interactions
  const [doorMeshes, setDoorMeshes] = useState([]);
  
  // Effect to create the door meshes when positions change
  useEffect(() => {
    if (doorPositions.length > 0) {
      setDoorMeshes(doorPositions);
    }
  }, [doorPositions]);
  
  // Split door positions into high and low detail based on distance
  const { highDetailPositions, lowDetailPositions } = useMemo(() => {
    const high = [];
    const low = [];
    
    doorPositions.forEach(pos => {
      const distance = new THREE.Vector3(pos.x, tileSize/2, pos.z).distanceTo(camera.position);
      
      if (distance <= LOD_DISTANCE) {
        high.push(pos);
      } else if (distance <= CULLING_DISTANCE) {
        low.push(pos);
      }
    });
    
    return { highDetailPositions: high, lowDetailPositions: low };
  }, [doorPositions, camera.position, tileSize]);
  
  // Enhanced door material
  const enhancedDoorMaterial = useMemo(() => {
    if (!materials.doorMaterial) return null;
    
    // Clone the material to prevent affecting other components
    const material = materials.doorMaterial.clone();
    
    // Add subtle glow effect to doors
    material.emissive = new THREE.Color(0x4c1010); // Dark red/brown emissive
    material.emissiveIntensity = 0.15; // Subtle emissive intensity
    
    return material;
  }, [materials.doorMaterial]);

  if (!materials.doorMaterial || doorPositions.length === 0) return null;

  return (
    <>
      {/* Interactive door meshes - these handle clicks */}
      {doorMeshes.map((door, index) => (
        <mesh
          key={`door-${index}`}
          position={[door.x, tileSize / 2, door.z]}
          castShadow={true}
          receiveShadow={true}
          onClick={(e) => {
            e.stopPropagation();
            if (doorClickable) {
              // Handle the door click with the door position
              handleDoorClick({x: door.x, z: door.z});
              console.log("Door clicked at position:", door);
            }
          }}
          // Removed hover handlers
        >
          <boxGeometry args={[tileSize, tileSize, tileSize]} />
          <primitive object={enhancedDoorMaterial || materials.doorMaterial} />
        </mesh>
      ))}
    </>
  );
};

export default React.memo(InstancedDoors);