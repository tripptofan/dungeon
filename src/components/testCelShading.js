import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { CelShaded } from './celShader';

const TestCelShading = () => {
  const groupRef = useRef();
  
  // Rotate the test objects to demonstrate the cel-shading and outline
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.2;
    }
  });
  
  return (
    <group ref={groupRef} position={[10, 3, 10]}>
      {/* Sphere with cel-shading */}
      <CelShaded
        position={[-2, 0, 0]}
        color="#ff4433"
        edgeColor="#000000"
        bands={3}
        edgeThickness={0.5}
        geometry={<sphereGeometry args={[1, 32, 32]} />}
      />
      
      {/* Box with cel-shading */}
      <CelShaded
        position={[2, 0, 0]}
        color="#44aaff"
        edgeColor="#000000"
        bands={4}
        edgeThickness={0.6}
        geometry={<boxGeometry args={[1.5, 1.5, 1.5]} />}
      />
      
      {/* Torus with cel-shading */}
      <CelShaded
        position={[0, 2, 0]}
        color="#ffcc22"
        edgeColor="#000000"
        bands={5}
        edgeThickness={0.7}
        geometry={<torusGeometry args={[1, 0.4, 16, 32]} />}
      />
    </group>
  );
};

export default TestCelShading;