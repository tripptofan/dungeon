import React, { useMemo, useRef, useEffect } from "react";
import { useLoader } from "@react-three/fiber";
import useGameStore from "../store";
import * as THREE from "three";

const Ceiling = ({ position, tileSize }) => {
  const meshRef = useRef();
  const dungeon = useGameStore((state) => state.dungeon);
  
  // Calculate dimensions once
  const dungeonWidth = useMemo(() => dungeon.length * tileSize, [dungeon.length, tileSize]);
  const dungeonDepth = useMemo(() => dungeon[0].length * tileSize, [dungeon, tileSize]);

  // Load all texture maps for the ceiling
  const [
    colorMap,
    aoMap,
    displacementMap,
    normalMap,
    specularMap
  ] = useLoader(THREE.TextureLoader, [
    "/textures/ceilingTexture/ceilingTexture.png",
    "/textures/ceilingTexture/AmbientOcclusionMap.png",
    "/textures/ceilingTexture/DisplacementMap.png",
    "/textures/ceilingTexture/NormalMap.png",
    "/textures/ceilingTexture/SpecularMap.png"
  ]);

  // For ceiling, we want textures to repeat more across the large surface
  const repeatX = dungeonWidth * 0.5;
  const repeatZ = dungeonDepth * 0.5;

  // Configure all textures once using useMemo for better performance
  useMemo(() => {
    [colorMap, aoMap, displacementMap, normalMap, specularMap].forEach(texture => {
      if (texture) {
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(repeatX, repeatZ);
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.minFilter = THREE.LinearMipmapLinearFilter;
        texture.magFilter = THREE.LinearFilter;
      }
    });
  }, [colorMap, aoMap, displacementMap, normalMap, specularMap, repeatX, repeatZ]);

  // Add UV2 coordinates for ambient occlusion mapping
  useEffect(() => {
    if (meshRef.current) {
      const geometry = meshRef.current.geometry;
      geometry.setAttribute('uv2', geometry.attributes.uv);
    }
  }, []);

  return (
    <mesh ref={meshRef} position={position} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[dungeonWidth, dungeonDepth]} />
      <meshStandardMaterial
        map={colorMap}
        aoMap={aoMap}
        displacementMap={displacementMap}
        normalMap={normalMap}
        roughnessMap={specularMap} // Use specular map for roughness (inverse)
        
        // Material properties
        aoMapIntensity={0.5}
        displacementScale={4} // Subtle ceiling displacement
        normalScale={new THREE.Vector2(0.5, 0.5)}
        roughness={2.7}
        metalness={0.3}
        
        // Subtle emissive for overall ambient light from ceiling
        emissive={new THREE.Color(0xffffff)}
        emissiveMap={colorMap}
        emissiveIntensity={0}
        side={THREE.DoubleSide} // Make sure ceiling is visible from above and below
      />
    </mesh>
  );
};

export default React.memo(Ceiling);