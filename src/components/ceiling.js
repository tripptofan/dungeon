import React, { useMemo } from "react";
import { useLoader } from "@react-three/fiber";
import useGameStore from "../store";
import * as THREE from "three";

const Ceiling = ({ position, tileSize }) => {
  const dungeon = useGameStore((state) => state.dungeon);
  
  // Calculate dimensions once
  const dungeonWidth = useMemo(() => dungeon.length * tileSize, [dungeon.length, tileSize]);
  const dungeonDepth = useMemo(() => dungeon[0].length * tileSize, [dungeon, tileSize]);

  // Load textures using useLoader hook
  const aoTexture = useLoader(THREE.TextureLoader, "/textures/broken_wall_ao_4k.jpg");
  const diffuseTexture = useLoader(THREE.TextureLoader, "/textures/broken_wall_diff_4k.jpg");
  const normalTexture = useLoader(THREE.TextureLoader, "/textures/broken_wall_nor_gl_4k.jpg");
  const roughnessTexture = useLoader(THREE.TextureLoader, "/textures/broken_wall_rough_4k.jpg");
  const displacementTexture = useLoader(THREE.TextureLoader, "/textures/broken_wall_disp_4k.jpg");

  // Set texture properties
  const repeatX = dungeonWidth / tileSize;
  const repeatZ = dungeonDepth / tileSize;

  // Optimize by applying texture settings only when needed
  useMemo(() => {
    [aoTexture, diffuseTexture, normalTexture, roughnessTexture, displacementTexture].forEach((texture) => {
      texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(repeatX, repeatZ);
    });
  }, [aoTexture, diffuseTexture, normalTexture, roughnessTexture, displacementTexture, repeatX, repeatZ]);

  return (
    <mesh position={position} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[dungeonWidth, dungeonDepth]} />
      <meshStandardMaterial
        map={diffuseTexture}
        normalMap={normalTexture}
        roughnessMap={roughnessTexture}
        aoMap={aoTexture}
        displacementMap={displacementTexture}
        displacementScale={0.1} 
        displacementBias={-0.05} 
        transparent
        side={THREE.DoubleSide}
      />
    </mesh>
  );
};

export default React.memo(Ceiling);