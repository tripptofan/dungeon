import React, { useMemo, useRef, useEffect } from "react";
import { useLoader } from "@react-three/fiber";
import * as THREE from "three";

const FloorTile = ({ position, tileSize }) => {
  const meshRef = useRef();
  
  // Load all texture maps for the floor
  const [
    colorMap,
    aoMap,
    displacementMap,
    normalMap,
    specularMap
  ] = useLoader(THREE.TextureLoader, [
    "/textures/dungeonFloor/dungeonFloor.png",
    "/textures/dungeonFloor/AmbientOcclusionMap.png",
    "/textures/dungeonFloor/DisplacementMap.png",
    "/textures/dungeonFloor/NormalMap.png",
    "/textures/dungeonFloor/SpecularMap.png"
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

  // Define a soft pastel color for tinting
  const pastelTint = new THREE.Color(0xf0e6ff); // Light lavender

  return (
    <mesh ref={meshRef} position={position} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[tileSize, tileSize]} />
      <meshStandardMaterial
        map={colorMap}
        aoMap={aoMap}
        displacementMap={displacementMap}
        normalMap={normalMap}
        roughnessMap={specularMap} // Use specular map for roughness (inverse)
        
        // Material properties
        // color={pastelTint}
        aoMapIntensity={.6}
        displacementScale={0.02} // Very subtle displacement for floor
        normalScale={new THREE.Vector2(0.6, 0.6)}
        roughness={1.8} // Floors typically rougher than walls
        metalness={0.2}
        
        // Subtle emissive for overall lightness
        emissive={new THREE.Color(0xffffff)}
        emissiveMap={colorMap}
        emissiveIntensity={0.01}
      />
    </mesh>
  );
};

export default React.memo(FloorTile);