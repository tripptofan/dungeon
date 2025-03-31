import React, { useMemo, useRef, useEffect } from "react";
import { useLoader } from "@react-three/fiber";
import * as THREE from "three";

const Wall = ({ position, tileSize }) => {
  const meshRef = useRef();
  
  // Load all texture maps for the wall
  const [
    colorMap,
    aoMap,
    displacementMap,
    normalMap,
    specularMap
  ] = useLoader(THREE.TextureLoader, [
    "/textures/dungeonWall/dungeonWall.png",
    "/textures/dungeonWall/AmbientOcclusionMap.png",
    "/textures/dungeonWall/DisplacementMap.png",
    "/textures/dungeonWall/NormalMap.png",
    "/textures/dungeonWall/SpecularMap.png"
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

  // Define base material properties
  const pastelTint = new THREE.Color(0xf0e6ff); // Light lavender tint

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
        color={pastelTint}
        aoMapIntensity={0.5}
        displacementScale={0.5} // Subtle displacement
        normalScale={new THREE.Vector2(0.5, 0.5)}
        roughness={1.6}
        metalness={0.1}
        
        // Subtle emissive effect
        emissive={new THREE.Color(0xffe8f5)}
        emissiveIntensity={0.01}
      />
    </mesh>
  );
};

export default React.memo(Wall);