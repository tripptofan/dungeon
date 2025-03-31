// Wall.js
import React, { useMemo } from "react";
import { useLoader } from "@react-three/fiber";
import * as THREE from "three";

// A simpler approach that directly modifies material properties for a pastel look
const Wall = ({ position, tileSize }) => {
  // Load the wall texture
  const wallTexture = useLoader(THREE.TextureLoader, "/textures/dungeonWallTexture.png");
  
  // Set texture properties
  useMemo(() => {
    if (wallTexture) {
      wallTexture.wrapS = wallTexture.wrapT = THREE.RepeatWrapping;
      wallTexture.repeat.set(1, 1);
      wallTexture.colorSpace = THREE.SRGBColorSpace;
    }
  }, [wallTexture]);

  // Define a soft pastel color
  const pastelTint = new THREE.Color(0xf0e6ff); // Light lavender

  return (
    <mesh position={position}>
      <boxGeometry args={[tileSize, tileSize, tileSize]} />
      <meshStandardMaterial
        map={wallTexture}
        // Apply a pastel tint to the base color
        color={pastelTint}
        // Use the same texture for emissive but with a different color to enhance pastel effect
        emissive={new THREE.Color(0xffe8f5)} // Light pink for subtle glow
        emissiveMap={wallTexture}
        emissiveIntensity={0.01}
        // Lower contrast and increase smoothness for pastel look
        roughness={0.6}
        metalness={0.1}
      />
    </mesh>
  );
};

export default React.memo(Wall);