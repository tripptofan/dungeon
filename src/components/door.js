import React, { useMemo, useRef, useEffect } from "react";
import { useLoader } from "@react-three/fiber";
import * as THREE from "three";

const Door = ({ position, tileSize }) => {
  const meshRef = useRef();
  
  // Load all texture maps for the door
  const [
    colorMap,
    aoMap,
    displacementMap,
    normalMap,
    specularMap
  ] = useLoader(THREE.TextureLoader, [
    "/textures/dungeonDoor/dungeonDoor.png",
    "/textures/dungeonDoor/AmbientOcclusionMap.png",
    "/textures/dungeonDoor/DisplacementMap.png",
    "/textures/dungeonDoor/NormalMap.png",
    "/textures/dungeonDoor/SpecularMap.png"
  ]);

  // Configure all textures once using useMemo for better performance
  useMemo(() => {
    [colorMap, aoMap, displacementMap, normalMap, specularMap].forEach(texture => {
      if (texture) {
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(1, 1);
        texture.colorSpace = THREE.SRGBColorSpace;
      }
    });
  }, [colorMap, aoMap, displacementMap, normalMap, specularMap]);

  // Add UV2 coordinates for ambient occlusion mapping
  useEffect(() => {
    if (meshRef.current) {
      const geometry = meshRef.current.geometry;
      geometry.setAttribute('uv2', geometry.attributes.uv);
    }
  }, []);

  return (
    <mesh ref={meshRef} position={position}>
      <boxGeometry args={[tileSize, tileSize, tileSize]} />
      <meshStandardMaterial
        map={colorMap}
        aoMap={aoMap}
        displacementMap={displacementMap}
        normalMap={normalMap}
        roughnessMap={specularMap} // Use specular map for roughness (inverse)
        
        // Material properties
        aoMapIntensity={0.7}
        displacementScale={0.1} // Slightly more displacement for door details
        normalScale={new THREE.Vector2(0.8, 0.8)}
        roughness={0.6}
        metalness={0.3} // Slightly more metallic than walls for hinges/hardware
        
        // Subtle emissive effect
        emissive={new THREE.Color(0xffffff)}
        emissiveMap={colorMap}
        emissiveIntensity={0.02}
      />
    </mesh>
  );
};

export default React.memo(Door);