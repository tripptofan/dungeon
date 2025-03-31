import React from 'react';
import * as THREE from 'three';

// A component that adds colored lighting to create a pastel effect
// without using post-processing
const PastelLighting = () => {
  return (
    <>
      {/* Increased ambient light with slight color tint */}
      <ambientLight intensity={1.0} color="#f8f4ff" />
      
      {/* Soft directional light with warm tint */}
      <directionalLight 
        position={[5, 10, 5]} 
        intensity={0.5} 
        color="#ffece0" 
      />
      
      {/* Subtle blue/lavender fill light */}
      <directionalLight 
        position={[-10, 5, -5]} 
        intensity={0.3} 
        color="#e0e8ff" 
      />
      
      {/* Optional subtle bottom fill light */}
      <hemisphereLight 
        color="#ffe8e8" 
        groundColor="#d0e0ff" 
        intensity={0.4} 
      />
    </>
  );
};

export default PastelLighting;