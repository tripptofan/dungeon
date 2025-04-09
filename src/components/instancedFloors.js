import React, { useRef, useEffect, useMemo } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useTextures } from '../utils/textureManagement';
import useGameStore from '../store';

// Constants for performance tuning
const LOD_DISTANCE = 20; 
const CULLING_DISTANCE = 150;

const InstancedFloors = ({ tilePositions, tileSize }) => {
  const { materials } = useTextures();
  const { camera } = useThree();
  const isMobile = useGameStore((state) => state.isMobile);
  
  // Split tile positions into high and low detail based on distance
  const { highDetailPositions, lowDetailPositions } = useMemo(() => {
    const high = [];
    const low = [];
    
    tilePositions.forEach(pos => {
      const distance = new THREE.Vector3(pos.x, 0, pos.z).distanceTo(
        new THREE.Vector3(camera.position.x, 0, camera.position.z)
      );
      
      if (distance <= LOD_DISTANCE) {
        high.push(pos);
      } else if (distance <= CULLING_DISTANCE) {
        low.push(pos);
      }
    });
    
    return { highDetailPositions: high, lowDetailPositions: low };
  }, [tilePositions, camera.position]);
  
  // Set up high detail instances
  const highDetailRef = useRef();
  useEffect(() => {
    if (highDetailRef.current && highDetailPositions.length > 0) {
      // For each high detail tile, set the instance matrix
      highDetailPositions.forEach((pos, i) => {
        const matrix = new THREE.Matrix4();
        matrix.makeRotationX(-Math.PI / 2); // Floors need to be rotated
        matrix.setPosition(pos.x, 0, pos.z);
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
  }, [highDetailPositions]);
  
  // Set up low detail instances
  const lowDetailRef = useRef();
  useEffect(() => {
    if (lowDetailRef.current && lowDetailPositions.length > 0) {
      // For each low detail tile, set the instance matrix
      lowDetailPositions.forEach((pos, i) => {
        const matrix = new THREE.Matrix4();
        matrix.makeRotationX(-Math.PI / 2); // Floors need to be rotated
        matrix.setPosition(pos.x, 0, pos.z);
        lowDetailRef.current.setMatrixAt(i, matrix);
      });
      
      // Update matrices
      lowDetailRef.current.instanceMatrix.needsUpdate = true;
    }
  }, [lowDetailPositions]);

  // Floor material enhancement
  const enhancedFloorMaterial = useMemo(() => {
    if (!materials.floorMaterial) return null;
    
    // Clone the material to avoid affecting other instances
    const material = materials.floorMaterial.clone();
    
    // Add some subtle ambient occlusion
    if (material.aoMap) {
      material.aoMapIntensity = 0.8;
    }
    
    // Add some subtle roughness variation
    material.roughness = 0.9;
    
    return material;
  }, [materials.floorMaterial]);

  if (!materials.floorMaterial || tilePositions.length === 0) return null;

  return (
    <>
      {/* High detail floors */}
      {highDetailPositions.length > 0 && (
        <instancedMesh 
          ref={highDetailRef} 
          args={[null, null, highDetailPositions.length]}
          castShadow={false}
          receiveShadow={true}
        >
          <planeGeometry args={[tileSize, tileSize]} />
          <primitive object={enhancedFloorMaterial || materials.floorMaterial} />
        </instancedMesh>
      )}
      
      {/* Low detail floors */}
      {lowDetailPositions.length > 0 && (
        <instancedMesh 
          ref={lowDetailRef} 
          args={[null, null, lowDetailPositions.length]}
          castShadow={false}
          receiveShadow={false} // Disable shadow receiving for performance
        >
          <planeGeometry args={[tileSize, tileSize]} />
          <primitive object={materials.floorMaterialLod} />
        </instancedMesh>
      )}
    </>
  );
};

export default React.memo(InstancedFloors);