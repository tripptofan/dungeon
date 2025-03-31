import React from 'react';
import * as THREE from 'three';

// Component that creates an outline by rendering a slightly larger black version of the geometry
const OutlinedObject = ({ geometry, position = [0, 0, 0], rotation = [0, 0, 0], scale = 1, color = '#ffffff', outlineColor = '#000000', outlineThickness = 0.05 }) => {
  // Calculate the outline scale factor based on the original scale and outline thickness
  const outlineScale = typeof scale === 'number' 
    ? scale + outlineThickness 
    : [
        scale[0] + outlineThickness,
        scale[1] + outlineThickness, 
        scale[2] + outlineThickness
      ];
  
  return (
    <group position={position} rotation={rotation}>
      {/* Outline mesh - rendered first (underneath) */}
      <mesh scale={outlineScale} renderOrder={1}>
        {geometry}
        <meshBasicMaterial color={outlineColor} side={THREE.BackSide} depthTest={true} />
      </mesh>
      
      {/* Original mesh - rendered on top of the outline */}
      <mesh scale={scale} renderOrder={2}>
        {geometry}
        <meshStandardMaterial color={color} />
      </mesh>
    </group>
  );
};

export default OutlinedObject;