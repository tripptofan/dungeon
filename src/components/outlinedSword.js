import React, { useRef } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

// Component that renders a wooden sword with a white outline
const OutlinedSword = ({ position = [0, 0, 0], rotation = [0, 0, 0], scale = 1, outlineThickness = 0.05 }) => {
  // Load the sword model
  const { nodes, materials } = useGLTF('/woodenSword-smallerTextures.glb');
  
  // Calculate the outline scale factor - ensure consistent thickness
  const outlineScale = typeof scale === 'number'
    ? scale * (1 + outlineThickness)
    : [
        scale[0] * (1 + outlineThickness),
        scale[1] * (1 + outlineThickness),
        scale[2] * (1 + outlineThickness)
      ];
      
  return (
    <group position={position} rotation={rotation}>
      {/* Outline - slightly larger WHITE version rendered first */}
      <mesh 
        geometry={nodes.SWORD.geometry} 
        scale={outlineScale} 
        renderOrder={1}
      >
        <meshBasicMaterial 
          color="#FFFFFF" 
          side={THREE.BackSide} 
          depthTest={true} 
        />
      </mesh>
      
      {/* Original sword mesh - rendered on top */}
      <mesh 
        geometry={nodes.SWORD.geometry} 
        scale={scale} 
        renderOrder={2}
      >
        <meshStandardMaterial 
          {...materials.wood} 
          color="#8B4513" // Brown wooden color
        />
      </mesh>
    </group>
  );
};

export default OutlinedSword;

// Preload the model to avoid loading delay
useGLTF.preload('/woodenSword-smallerTextures.glb');