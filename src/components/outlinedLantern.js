import React, { useRef } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import FlickeringFlame from './flickeringFlame';

// Component that renders a lantern with a white outline
const OutlinedLantern = ({ position = [0, 0, 0], rotation = [0, 0, 0], scale = 1, outlineThickness = 0.05 }) => {
  // Load the lantern model
  const { nodes, materials } = useGLTF('/Lantern-smallTextures.glb');
  
  // Calculate the outline scale factor - make it more consistent across all parts
  const outlineScale = typeof scale === 'number'
    ? scale * (1 + outlineThickness)
    : [
        scale[0] * (1 + outlineThickness),
        scale[1] * (1 + outlineThickness),
        scale[2] * (1 + outlineThickness)
      ];
      
  // List of all the parts that need outlines
  const parts = [
    { name: 'Lantern-handle', material: materials.handleWood },
    { name: 'Lantern-rubber', material: materials.rubber },
    { name: 'Lantern-inner-metal', material: materials.normalMetal },
    { name: 'Circle_1', material: materials.metal }
  ];
  
  // Handle glass parts separately - no outline needed for glass
  const glassParts = [
    { name: 'Lantern-glass', material: materials.glass },
    { name: 'Circle', material: materials.glass }
  ];
  
  return (
    <group position={position} rotation={rotation}>
      {/* Render all non-glass parts with outlines */}
      {parts.map((part) => (
        <React.Fragment key={part.name}>
          {/* Outline - slightly larger WHITE version rendered first */}
          <mesh 
            geometry={nodes[part.name].geometry} 
            scale={outlineScale} 
            renderOrder={1}
          >
            <meshBasicMaterial 
              color="#FFFFFF" 
              side={THREE.BackSide} 
              depthTest={true} 
            />
          </mesh>
          
          {/* Original part - rendered on top */}
          <mesh 
            geometry={nodes[part.name].geometry} 
            scale={scale} 
            renderOrder={2}
          >
            <meshStandardMaterial {...part.material} />
          </mesh>
        </React.Fragment>
      ))}
      
      {/* Render glass parts without outlines */}
      {glassParts.map((part) => (
        <mesh 
          key={part.name}
          geometry={nodes[part.name].geometry} 
          scale={scale} 
          renderOrder={3}
        >
          <meshPhysicalMaterial
            color="#FFDD88"
            transparent={true}
            opacity={0.7}
            transmission={0.5}
            roughness={0.1}
            clearcoat={0.5}
            emissive="#ffcc77"
            emissiveIntensity={0.3}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
      
      {/* Add the flickering flame inside */}
      <FlickeringFlame 
        position={[0, 0.2, 0]}
        color="#ffcc77"
        randomizer={0.75}
      />
      
      {/* Add light for the lantern */}
      <pointLight 
        color="#ffcc77" 
        intensity={3} 
        distance={2} 
        decay={1} 
        position={[0, 0.2, 0]}
      />
    </group>
  );
};

export default OutlinedLantern;

// Preload the model to avoid loading delay
useGLTF.preload('/Lantern-smallTextures.glb');