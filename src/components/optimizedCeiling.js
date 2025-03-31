import React, { useRef, useEffect } from "react";
import { useTextures } from "../utils/textureManagement";
import * as THREE from "three";

const OptimizedCeiling = ({ position, tileSize, dungeonWidth, dungeonDepth }) => {
  const meshRef = useRef();
  const { materials, textureSets } = useTextures();
  
  // Add UV2 coordinates for ambient occlusion mapping
  useEffect(() => {
    if (meshRef.current) {
      const geometry = meshRef.current.geometry;
      geometry.setAttribute('uv2', geometry.attributes.uv);
    }
  }, []);

  // Set up custom texture repeat for large ceiling
  useEffect(() => {
    if (meshRef.current && materials.ceilingMaterial) {
      // Calculate repeat scale based on dungeon size
      const repeatX = dungeonWidth * 0.5;
      const repeatZ = dungeonDepth * 0.5;
      
      // Clone the material to avoid affecting other components using it
      meshRef.current.material = materials.ceilingMaterial.clone();
      
      // Apply repeat to all textures in the material
      if (meshRef.current.material.map) 
        meshRef.current.material.map.repeat.set(repeatX, repeatZ);
      
      if (meshRef.current.material.aoMap) 
        meshRef.current.material.aoMap.repeat.set(repeatX, repeatZ);
      
      if (meshRef.current.material.normalMap) 
        meshRef.current.material.normalMap.repeat.set(repeatX, repeatZ);
      
      if (meshRef.current.material.displacementMap) 
        meshRef.current.material.displacementMap.repeat.set(repeatX, repeatZ);
      
      if (meshRef.current.material.roughnessMap) 
        meshRef.current.material.roughnessMap.repeat.set(repeatX, repeatZ);
    }
  }, [materials.ceilingMaterial, dungeonWidth, dungeonDepth]);

  return (
    <mesh ref={meshRef} position={position} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[dungeonWidth, dungeonDepth]} />
      {/* Start with the shared ceiling material - it will be cloned and customized in useEffect */}
      {materials.ceilingMaterial ? (
        <primitive object={materials.ceilingMaterial} />
      ) : (
        <meshStandardMaterial color="#333" side={THREE.DoubleSide} /> // Fallback
      )}
    </mesh>
  );
};

export default React.memo(OptimizedCeiling);