import React from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import useGameStore from '../store';

// Component to add subtle moonlight/starlight to the scene
const AmbientNightLight = () => {
  const isMobile = useGameStore(state => state.isMobile);
  
  // Reduce light intensity on mobile for better performance
  const ambientIntensity = isMobile ? 0.1 : 0.15;
  const directionalIntensity = isMobile ? 0.15 : 0.2;

  return (
    <>
      {/* Dim ambient light for general visibility */}
      <ambientLight intensity={ambientIntensity} color="#3b3b5a" />
      
      {/* Directional moonlight from above */}
      <directionalLight 
        position={[0, 50, 0]} 
        intensity={directionalIntensity} 
        color="#b8c5ff"
        castShadow={false}
      />
    </>
  );
};

export default React.memo(AmbientNightLight);