import React, { useRef, useEffect, useMemo } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import useGameStore from '../store';
import { useTextures } from '../utils/textureManagement';

// Constants for performance tuning
const LOD_DISTANCE = 25; // Distance at which to switch to lower detail
const CULLING_DISTANCE = 150; // Maximum rendering distance

const InstancedWalls = ({ wallPositions, tileSize }) => {
  const { materials } = useTextures();
  const { camera } = useThree();
  const isMobile = useGameStore((state) => state.isMobile);
  
  // Split wall positions into high and low detail based on distance
  const { highDetailPositions, lowDetailPositions } = useMemo(() => {
    const high = [];
    const low = [];
    
    wallPositions.forEach(pos => {
      const distance = new THREE.Vector3(pos.x, tileSize/2, pos.z).distanceTo(camera.position);
      
      // Adjust the LOD_DISTANCE and culling logic
      if (distance <= LOD_DISTANCE) {
        high.push(pos);
      } else if (distance <= CULLING_DISTANCE) {
        low.push(pos);
      }
    });
    
    return { highDetailPositions: high, lowDetailPositions: low };
  }, [wallPositions, camera.position, tileSize]);
  
  // Calculate wall plane direction for each wall position
  const { highDetailConfigs, lowDetailConfigs } = useMemo(() => {
    const highConfigs = [];
    const lowConfigs = [];
    
    // Function to determine wall face direction based on position
    const determineWallOrientation = (pos) => {
      // Create a simplified dungeon layout
      const dungeonLayout = useGameStore.getState().dungeon;
      const dungeonWidth = dungeonLayout.length;
      const dungeonDepth = dungeonLayout[0].length;
      
      // Convert world position to grid coordinates
      const gridX = Math.floor(pos.x / tileSize);
      const gridZ = Math.floor(pos.z / tileSize);
      
      // Check surrounding tiles to determine wall orientation
      let orientation = { 
        position: [pos.x, tileSize / 2, pos.z],
        rotation: [0, 0, 0], 
        offset: [0, 0, 0]
      };
      
      // Check neighbors if within bounds
      // Walls should face empty space (value 0) or doors (value 2)
      
      // Check if we're at the west edge or there's open space to the west
      if (gridX === 0 || (gridX > 0 && (dungeonLayout[gridX-1]?.[gridZ] === 0 || dungeonLayout[gridX-1]?.[gridZ] === 2))) {
        orientation = {
          position: [pos.x - tileSize/2, tileSize/2, pos.z],
          rotation: [0, -Math.PI/2, 0], // Face west
          offset: [-tileSize/2, 0, 0]
        };
      }
      // Check if we're at the east edge or there's open space to the east
      else if (gridX === dungeonWidth-1 || (gridX < dungeonWidth-1 && (dungeonLayout[gridX+1]?.[gridZ] === 0 || dungeonLayout[gridX+1]?.[gridZ] === 2))) {
        orientation = {
          position: [pos.x + tileSize/2, tileSize/2, pos.z],
          rotation: [0, Math.PI/2, 0], // Face east
          offset: [tileSize/2, 0, 0]
        };
      }
      // Check if we're at the north edge or there's open space to the north
      else if (gridZ === 0 || (gridZ > 0 && (dungeonLayout[gridX]?.[gridZ-1] === 0 || dungeonLayout[gridX]?.[gridZ-1] === 2))) {
        orientation = {
          position: [pos.x, tileSize/2, pos.z - tileSize/2],
          rotation: [0, 0, 0], // Face north
          offset: [0, 0, -tileSize/2]
        };
      }
      // Check if we're at the south edge or there's open space to the south
      else if (gridZ === dungeonDepth-1 || (gridZ < dungeonDepth-1 && (dungeonLayout[gridX]?.[gridZ+1] === 0 || dungeonLayout[gridX]?.[gridZ+1] === 2))) {
        orientation = {
          position: [pos.x, tileSize/2, pos.z + tileSize/2],
          rotation: [0, Math.PI, 0], // Face south
          offset: [0, 0, tileSize/2]
        };
      }
      
      // Special case: If we're on the outer perimeter, ensure walls face inward
      if (gridX === 0) { // West edge
        orientation = {
          position: [pos.x + tileSize/2, tileSize/2, pos.z],
          rotation: [0, Math.PI/2, 0], // Face east (inward)
          offset: [tileSize/2, 0, 0]
        };
      } else if (gridX === dungeonWidth - 1) { // East edge
        orientation = {
          position: [pos.x - tileSize/2, tileSize/2, pos.z],
          rotation: [0, -Math.PI/2, 0], // Face west (inward)
          offset: [-tileSize/2, 0, 0]
        };
      } else if (gridZ === 0) { // North edge
        orientation = {
          position: [pos.x, tileSize/2, pos.z + tileSize/2],
          rotation: [0, Math.PI, 0], // Face south (inward)
          offset: [0, 0, tileSize/2]
        };
      } else if (gridZ === dungeonDepth - 1) { // South edge
        orientation = {
          position: [pos.x, tileSize/2, pos.z - tileSize/2],
          rotation: [0, 0, 0], // Face north (inward)
          offset: [0, 0, -tileSize/2]
        };
      }
      
      return orientation;
    };
    
    // Calculate wall configurations for high detail
    highDetailPositions.forEach(pos => {
      highConfigs.push(determineWallOrientation(pos));
    });
    
    // Calculate wall configurations for low detail
    lowDetailPositions.forEach(pos => {
      lowConfigs.push(determineWallOrientation(pos));
    });
    
    return { highDetailConfigs: highConfigs, lowDetailConfigs: lowConfigs };
  }, [highDetailPositions, lowDetailPositions, tileSize]);
  
  // Set up high detail instances
  const highDetailRef = useRef();
  useEffect(() => {
    if (highDetailRef.current && highDetailConfigs.length > 0) {
      // For each high detail wall, set the instance matrix
      highDetailConfigs.forEach((config, i) => {
        const matrix = new THREE.Matrix4();
        
        // Apply rotation
        const quaternion = new THREE.Quaternion();
        quaternion.setFromEuler(new THREE.Euler(...config.rotation));
        
        // Apply position with offset
        const position = new THREE.Vector3(...config.position);
        
        // Set matrix
        matrix.compose(position, quaternion, new THREE.Vector3(1, 1, 1));
        highDetailRef.current.setMatrixAt(i, matrix);
      });
      
      // Update matrices
      highDetailRef.current.instanceMatrix.needsUpdate = true;
      
      // Set up UV2 coordinates for ambient occlusion
      if (highDetailRef.current.geometry) {
        const geometry = highDetailRef.current.geometry;
        geometry.setAttribute('uv2', geometry.attributes.uv);
      }
    }
  }, [highDetailConfigs]);
  
  // Set up low detail instances
  const lowDetailRef = useRef();
  useEffect(() => {
    if (lowDetailRef.current && lowDetailConfigs.length > 0) {
      // For each low detail wall, set the instance matrix
      lowDetailConfigs.forEach((config, i) => {
        const matrix = new THREE.Matrix4();
        
        // Apply rotation
        const quaternion = new THREE.Quaternion();
        quaternion.setFromEuler(new THREE.Euler(...config.rotation));
        
        // Apply position with offset
        const position = new THREE.Vector3(...config.position);
        
        // Set matrix
        matrix.compose(position, quaternion, new THREE.Vector3(1, 1, 1));
        lowDetailRef.current.setMatrixAt(i, matrix);
      });
      
      // Update matrices
      lowDetailRef.current.instanceMatrix.needsUpdate = true;
    }
  }, [lowDetailConfigs]);

  // Add subtle wall material variations
  const highDetailMaterial = useMemo(() => {
    if (!materials.wallMaterial) return null;
    
    // Clone the material to prevent affecting other components
    const material = materials.wallMaterial.clone();
    
    // Add subtle environment lighting effect
    material.envMapIntensity = 0.2;
    
    return material;
  }, [materials.wallMaterial]);

  if (!materials.wallMaterial || wallPositions.length === 0) return null;

  return (
    <group>
      {/* High detail walls - using planes instead of boxes */}
      {highDetailConfigs.length > 0 && (
        <instancedMesh 
          ref={highDetailRef} 
          args={[null, null, highDetailConfigs.length]}
          castShadow={true}
          receiveShadow={true}
        >
          {/* Use plane geometry with the same dimensions as the tile */}
          <planeGeometry args={[tileSize, tileSize]} />
          <primitive object={highDetailMaterial || materials.wallMaterial} />
        </instancedMesh>
      )}
      
      {/* Low detail walls - also using planes */}
      {lowDetailConfigs.length > 0 && (
        <instancedMesh 
          ref={lowDetailRef} 
          args={[null, null, lowDetailConfigs.length]}
          castShadow={false} // Disable shadow casting for performance
          receiveShadow={false} // Disable shadow receiving for performance
        >
          <planeGeometry args={[tileSize, tileSize]} />
          <primitive object={materials.wallMaterialLod} />
        </instancedMesh>
      )}
    </group>
  );
};

export default React.memo(InstancedWalls);