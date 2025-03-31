import React, { useRef } from 'react';
import { useGLTF } from '@react-three/drei';
import { CelShaded } from './celShader';

// Cel-shaded version of the wooden sword
const CelShadedSword = ({ position = [0, 0, 0], rotation = [0, 0, 0], scale = 1.0 }) => {
  // Load the original sword model
  const { nodes, materials } = useGLTF('/woodenSword-smallerTextures.glb');
  
  return (
    <group position={position} rotation={rotation} scale={scale}>
      {/* Use the sword's geometry with our cel shader */}
      <CelShaded
        color="#8B4513" // Brown wooden color
        edgeColor="#000000" // Black outline
        bands={3} // Few color bands for cartoony look
        edgeThickness={0.6}
        geometry={<bufferGeometry {...nodes.SWORD.geometry} />}
      />
    </group>
  );
};

export default CelShadedSword;