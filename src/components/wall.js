import React, { useMemo } from "react";
import { useLoader } from "@react-three/fiber";
import * as THREE from "three";

const Wall = ({ position, tileSize }) => {
  // Load wall textures using useLoader hook
  const aoTexture = useLoader(THREE.TextureLoader, "/textures/4K-wall_stone_10-ao.jpg");
  const diffuseTexture = useLoader(THREE.TextureLoader, "/textures/4K-wall_stone_10-diffuse.jpg");
  const normalTexture = useLoader(THREE.TextureLoader, "/textures/4K-wall_stone_10-normal.jpg");
  const specularTexture = useLoader(THREE.TextureLoader, "/textures/4K-wall_stone_10-specular.jpg");
  const displacementTexture = useLoader(THREE.TextureLoader, "/textures/4K-wall_stone_10-displacement.jpg");

  // Set texture properties - optimize with useMemo to prevent unnecessary recalculations
  useMemo(() => {
    const setTextureRepeat = (texture, repeatX, repeatY) => {
      texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(repeatX, repeatY);
    };

    setTextureRepeat(aoTexture, 1, 1);
    setTextureRepeat(diffuseTexture, 1, 1);
    setTextureRepeat(normalTexture, 1, 1);
    setTextureRepeat(specularTexture, 1, 1);
    setTextureRepeat(displacementTexture, 1, 1);
  }, [aoTexture, diffuseTexture, normalTexture, specularTexture, displacementTexture]);

  return (
    <mesh position={position}>
      <boxGeometry args={[tileSize, tileSize, tileSize]} />
      <meshStandardMaterial
        map={specularTexture}
        normalMap={normalTexture}
        aoMap={aoTexture}
        displacementMap={displacementTexture}
        displacementScale={0.1}
        displacementBias={-0.05}
        transparent
      />
    </mesh>
  );
};

export default React.memo(Wall);