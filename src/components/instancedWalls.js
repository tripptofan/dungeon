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
  
  // Set up high detail instances
  const highDetailRef = useRef();
  useEffect(() => {
    if (highDetailRef.current && highDetailPositions.length > 0) {
      // For each high detail wall, set the instance matrix
      highDetailPositions.forEach((pos, i) => {
        const matrix = new THREE.Matrix4();
        matrix.setPosition(pos.x, tileSize / 2, pos.z);
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
  }, [highDetailPositions, tileSize]);
  
  // Set up low detail instances
  const lowDetailRef = useRef();
  useEffect(() => {
    if (lowDetailRef.current && lowDetailPositions.length > 0) {
      // For each low detail wall, set the instance matrix
      lowDetailPositions.forEach((pos, i) => {
        const matrix = new THREE.Matrix4();
        matrix.setPosition(pos.x, tileSize / 2, pos.z);
        lowDetailRef.current.setMatrixAt(i, matrix);
      });
      
      // Update matrices
      lowDetailRef.current.instanceMatrix.needsUpdate = true;
    }
  }, [lowDetailPositions, tileSize]);

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
    <>
      {/* High detail walls */}
      {highDetailPositions.length > 0 && (
        <instancedMesh 
          ref={highDetailRef} 
          args={[null, null, highDetailPositions.length]}
          castShadow={true}
          receiveShadow={true}
        >
          <boxGeometry args={[tileSize, tileSize, tileSize]} />
          <primitive object={highDetailMaterial || materials.wallMaterial} />
        </instancedMesh>
      )}
      
      {/* Low detail walls */}
      {lowDetailPositions.length > 0 && (
        <instancedMesh 
          ref={lowDetailRef} 
          args={[null, null, lowDetailPositions.length]}
          castShadow={false} // Disable shadow casting for performance
          receiveShadow={false} // Disable shadow receiving for performance
        >
          <boxGeometry args={[tileSize, tileSize, tileSize]} />
          <primitive object={materials.wallMaterialLod} />
        </instancedMesh>
      )}
    </>
  );
};

export default React.memo(InstancedWalls);