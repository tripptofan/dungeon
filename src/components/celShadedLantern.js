import React, { useRef } from 'react';
import { useGLTF } from '@react-three/drei';
import { CelShaded } from './celShader';
import FlickeringFlame from './flickeringFlame';

// Cel-shaded version of the lantern
const CelShadedLantern = ({ position = [0, 0, 0], rotation = [0, 0, 0], scale = 1.0 }) => {
  // Load the original lantern model
  const { nodes, materials } = useGLTF('/Lantern-smallTextures.glb');
  
  return (
    <group position={position} rotation={rotation} scale={scale}>
      {/* Metal parts - darker metal color */}
      <CelShaded
        color="#444444" 
        edgeColor="#000000"
        bands={4}
        edgeThickness={0.6}
        geometry={<bufferGeometry {...nodes['Lantern-inner-metal'].geometry} />}
      />
      
      {/* Handle - brown wooden color */}
      <CelShaded
        color="#8B4513" 
        edgeColor="#000000"
        bands={3}
        edgeThickness={0.6}
        geometry={<bufferGeometry {...nodes['Lantern-handle'].geometry} />}
      />
      
      {/* Outer metal - slightly lighter */}
      <CelShaded
        color="#666666" 
        edgeColor="#000000"
        bands={4}
        edgeThickness={0.6}
        geometry={<bufferGeometry {...nodes.Circle_1.geometry} />}
      />
      
      {/* Glass - use a bright yellow with subtle cel shading */}
      <CelShaded
        color="#FFDD88" 
        edgeColor="#AA7700"
        bands={2} // Fewer bands for glass
        edgeThickness={0.4}
        geometry={<bufferGeometry {...nodes['Lantern-glass'].geometry} />}
      />
      
      {/* Circle glass */}
      <CelShaded
        color="#FFDD88" 
        edgeColor="#AA7700"
        bands={2}
        edgeThickness={0.4}
        geometry={<bufferGeometry {...nodes.Circle.geometry} />}
      />
      
      {/* Add the flickering flame inside */}
      <FlickeringFlame 
        position={[0, 0.2, 0]}
        color="#ffcc77"
        randomizer={0.75}
      />
      
      {/* Additional light for the lantern */}
      <pointLight 
        color="#ffcc77" 
        intensity={5} 
        distance={3} 
        decay={1.5} 
        position={[0, 0.2, 0]}
      />
    </group>
  );
};

export default CelShadedLantern;