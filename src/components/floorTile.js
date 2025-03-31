import React, { useMemo } from "react";
import { useLoader } from "@react-three/fiber";
import * as THREE from "three";

const FloorTile = ({ position, tileSize }) => {
  // Load the new floor texture
  const floorTexture = useLoader(THREE.TextureLoader, "/textures/ceilingTexture2.png");
    // Define a soft pastel color
    const pastelTint = new THREE.Color(0xf0e6ff); // Light lavender
  // Set texture properties once - optimize with useMemo
  useMemo(() => {
    floorTexture.wrapS = floorTexture.wrapT = THREE.RepeatWrapping;
    floorTexture.repeat.set(1, 1);
    
    // Set additional texture properties
    floorTexture.colorSpace = THREE.SRGBColorSpace;
    floorTexture.minFilter = THREE.LinearMipmapLinearFilter;
    floorTexture.magFilter = THREE.LinearFilter;
  }, [floorTexture]);

  return (
    <mesh position={position} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[tileSize, tileSize]} />
      <meshStandardMaterial
        map={floorTexture}
        color={pastelTint}
        emissive={new THREE.Color(0xffffff)} 
        emissiveMap={floorTexture}
        emissiveIntensity={0.9}
        roughness={0.8}
        metalness={0.2}
      />
    </mesh>
  );
};

export default React.memo(FloorTile);