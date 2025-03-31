import React from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';

// Component to add subtle moonlight/starlight to the scene
const AmbientNightLight = () => {
  // Add a subtle blue ambient light for starlight
  return (
    <>
      {/* Dim ambient light for general visibility */}
      <ambientLight intensity={0.15} color="#3b3b5a" />
      
      {/* Directional moonlight from above */}
      <directionalLight 
        position={[0, 50, 0]} 
        intensity={0.2} 
        color="#b8c5ff"
        castShadow={false}
      />
    </>
  );
};

export default React.memo(AmbientNightLight);