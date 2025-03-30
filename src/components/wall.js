import React, { useMemo } from "react";
import { useLoader } from "@react-three/fiber";
import * as THREE from "three";

const Wall = ({ position, tileSize }) => {
  // Load the new single wall texture
  const wallTexture = useLoader(THREE.TextureLoader, "/textures/dungeonWallTexture.png");
  
  // Set texture properties - optimize with useMemo to prevent unnecessary recalculations
  useMemo(() => {
    // Configure texture wrapping and repeat
    wallTexture.wrapS = wallTexture.wrapT = THREE.RepeatWrapping;
    wallTexture.repeat.set(1, 1);
    
    // Optionally set additional texture properties
    // Note: encoding moved to ColorManagement in newer Three.js versions
    wallTexture.colorSpace = THREE.SRGBColorSpace;
    wallTexture.minFilter = THREE.LinearMipmapLinearFilter;
    wallTexture.magFilter = THREE.LinearFilter;
  }, [wallTexture]);

  return (
    <mesh position={position}>
      <boxGeometry args={[tileSize, tileSize, tileSize]} />
      <meshStandardMaterial
        map={wallTexture}
        roughness={0.8}
        metalness={0.2}
      />
    </mesh>
  );
};

export default React.memo(Wall);