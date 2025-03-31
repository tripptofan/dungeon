import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import OutlinedObject from './outlineObjectTechnique';

const TestOutlineObjects = () => {
  // Create refs for animation
  const groupRef = useRef();
  
  // Animate the whole group to make it more visible
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.2;
    }
  });
  
  return (
    <group ref={groupRef} position={[5, 2, 10]}>
      {/* Red box with white outline */}
      <OutlinedObject 
        position={[-2, 0, 0]} 
        color="#ff0000" 
        outlineColor="#FFFFFF"
        outlineThickness={0.1} // Thick outline for visibility
        geometry={<boxGeometry args={[1, 1, 1]} />}
      />
      
      {/* Blue box with white outline */}
      <OutlinedObject 
        position={[0, 0, 0]} 
        color="#0000ff" 
        outlineColor="#FFFFFF"
        outlineThickness={0.1}
        geometry={<boxGeometry args={[1, 1, 1]} />}
      />
      
      {/* Green sphere with white outline */}
      <OutlinedObject 
        position={[2, 0, 0]} 
        color="#00ff00" 
        outlineColor="#FFFFFF"
        outlineThickness={0.1}
        geometry={<sphereGeometry args={[0.7, 32, 32]} />}
      />
    </group>
  );
};

export default TestOutlineObjects;