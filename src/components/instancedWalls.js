import React, { useRef, useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { useTextures } from '../utils/textureManagement';

const InstancedWalls = ({ wallPositions, tileSize, yOffset = tileSize / 2 }) => {
  const { materials } = useTextures();
  const instancedMeshRef = useRef();
  
  // Reusable matrix for setting positions
  const tempMatrix = useMemo(() => new THREE.Matrix4(), []);
  
  // Create wall geometry with standard height
  const wallGeometry = useMemo(() => {
    return new THREE.BoxGeometry(tileSize, tileSize, tileSize);
  }, [tileSize]);
  
  // Set wall instances when positions change
  useEffect(() => {
    if (!instancedMeshRef.current || !materials.wallMaterial || wallPositions.length === 0) return;
    
    // Update each wall instance
    wallPositions.forEach((position, i) => {
      tempMatrix.makeTranslation(
        position.x,
        yOffset, // Use the yOffset parameter for vertical positioning
        position.z
      );
      instancedMeshRef.current.setMatrixAt(i, tempMatrix);
    });
    
    // Update the instance matrix
    instancedMeshRef.current.instanceMatrix.needsUpdate = true;
    instancedMeshRef.current.count = wallPositions.length;
  }, [wallPositions, tileSize, tempMatrix, yOffset]);
  
  if (!materials.wallMaterial || wallPositions.length === 0) return null;
  
  return (
    <instancedMesh 
      ref={instancedMeshRef}
      args={[wallGeometry, materials.wallMaterial, wallPositions.length]} 
      receiveShadow
      castShadow
    />
  );
};

export default React.memo(InstancedWalls);