import React, { useRef } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

// Update OutlinedSword to accept and use renderOrder
const OutlinedSword = ({ 
  position = [0, 0, 0], 
  rotation = [0, 0, 0], 
  scale = 1, 
  outlineThickness = 0.05,
  renderOrder = 2000 // Add default renderOrder
}) => {
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
        renderOrder={renderOrder} // Use the prop
      >
        <meshBasicMaterial 
          color="#FFFFFF" 
          side={THREE.BackSide} 
          depthTest={true} // Enable depth test
          transparent={false} // Make sure it's not transparent
          opacity={1.0}      // Full opacity
        />
      </mesh>
      
      {/* Original sword mesh - rendered on top */}
      <mesh 
        geometry={nodes.SWORD.geometry} 
        scale={scale} 
        renderOrder={renderOrder + 1} // One higher than outline
      >
        <meshStandardMaterial 
          {...materials.wood} 
          color="#8B4513" // Brown wooden color
          depthTest={true} // Enable depth test
          transparent={false} // Make sure it's not transparent
          opacity={1.0}      // Full opacity
          metalness={0.1}    // Slightly metallic (gives more solid appearance)
          roughness={0.8}    // More rough (less shiny)
        />
      </mesh>
    </group>
  );
};

export default OutlinedSword;

// Preload the model to avoid loading delay
useGLTF.preload('/woodenSword-smallerTextures.glb');