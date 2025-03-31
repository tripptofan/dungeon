import React, { useMemo } from "react";
import { useLoader } from "@react-three/fiber";
import * as THREE from "three";

const Door = ({ position, tileSize }) => {
  // Load the door texture instead of using geometry
  const doorTexture = useLoader(THREE.TextureLoader, "/textures/dungeonDoor.png");
  
  // Set texture properties once - optimize with useMemo
  useMemo(() => {
    // Configure texture wrapping and repeat
    doorTexture.wrapS = doorTexture.wrapT = THREE.RepeatWrapping;
    doorTexture.repeat.set(1, 1);
    
    // Optionally set additional texture properties
    doorTexture.colorSpace = THREE.SRGBColorSpace;
    doorTexture.minFilter = THREE.LinearMipmapLinearFilter;
    doorTexture.magFilter = THREE.LinearFilter;
  }, [doorTexture]);

  return (
    <mesh position={position}>
      <boxGeometry args={[tileSize, tileSize, tileSize]} />
      <meshStandardMaterial
        map={doorTexture}
        emissive={new THREE.Color(0xffffff)} 
        emissiveMap={doorTexture}
        emissiveIntensity={0.1}
        roughness={0.8}
        metalness={0.2}
      />
    </mesh>
  );
};

export default React.memo(Door);