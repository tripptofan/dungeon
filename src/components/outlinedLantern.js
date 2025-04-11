import React, { useRef } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import FlickeringFlame from './flickeringFlame';

// Component that renders a lantern with a white outline
const OutlinedLantern = ({ 
  position = [0, 0, 0], 
  rotation = [0, 0, 0], 
  scale = 1, 
  outlineThickness = 0.05, 
  emissiveIntensity = 1.0,   // Controls emissive materials in lantern
  lightIntensity = 1.0,      // Controls flame light intensity
  renderOrder = 2000         // Add render order parameter with default value
}) => {
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
            renderOrder={renderOrder}
          >
            <meshBasicMaterial 
              color="#FFFFFF" 
              side={THREE.BackSide} 
              depthTest={true}  // Enable depth test
              transparent={false}
              opacity={1.0}
            />
          </mesh>
          
          {/* Original part - rendered on top */}
          <mesh 
            geometry={nodes[part.name].geometry} 
            scale={scale} 
            renderOrder={renderOrder + 1}
          >
            <meshStandardMaterial 
              {...part.material} 
              emissiveIntensity={emissiveIntensity} // Use the passed prop
              depthTest={true}  // Enable depth test
              transparent={false} // Make opaque parts fully opaque
              opacity={1.0}
            />
          </mesh>
        </React.Fragment>
      ))}
      
      {/* Render glass parts with adjusted emissive intensity */}
      {glassParts.map((part) => (
        <mesh 
          key={part.name}
          geometry={nodes[part.name].geometry} 
          scale={scale} 
          renderOrder={renderOrder + 2}
        >
          <meshPhysicalMaterial
            color="#FFDD88"
            transparent={true}
            opacity={0.8}         // Increased opacity
            transmission={0.3}    // Reduced transmission
            roughness={0.1}
            clearcoat={0.5}
            emissive="#ffcc77"
            emissiveIntensity={emissiveIntensity * 0.3} // Scale with the passed prop
            side={THREE.DoubleSide}
            depthTest={true}  // Enable depth test
            depthWrite={true}     // Enable depth writing for glass parts
          />
        </mesh>
      ))}
      
      {/* Add the flickering flame inside with adjusted intensity */}
      <FlickeringFlame 
        position={[0, 0.2, 0]}
        color="#ffcc77"
        randomizer={0.75}
        intensity={lightIntensity * 1.5}  // Scale flame intensity based on prop
        distance={2.0 * lightIntensity}   // Adjust distance based on intensity
        decay={1.2}                       // Slightly increased decay
        renderOrder={renderOrder + 3}     // Pass render order to flame
      />
      
      {/* Add ambient light for the lantern with reduced intensity */}
      <pointLight 
        color="#ffcc77" 
        intensity={lightIntensity * 0.3}  // Reduced auxiliary light
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