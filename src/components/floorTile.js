import React from "react";
import { useLoader } from "@react-three/fiber";
import * as THREE from "three";

const FloorTile = ({ position, tileSize }) => {
  // Load textures using useLoader hook
  const aoTexture = useLoader(THREE.TextureLoader, "/textures/medieval_wall_02_ao_4k.jpg");
  const diffuseTexture = useLoader(THREE.TextureLoader, "/textures/medieval_wall_02_diff_4k.jpg");
  const normalTexture = useLoader(THREE.TextureLoader, "/textures/medieval_wall_02_nor_gl_4k.jpg");
  const roughnessTexture = useLoader(THREE.TextureLoader, "/textures/medieval_wall_02_rough_4k.jpg");
  const displacementTexture = useLoader(THREE.TextureLoader, "/textures/medieval_wall_02_disp_4k.jpg");

  // Set texture properties
  aoTexture.wrapS = aoTexture.wrapT = THREE.RepeatWrapping;
  diffuseTexture.wrapS = diffuseTexture.wrapT = THREE.RepeatWrapping;
  normalTexture.wrapS = normalTexture.wrapT = THREE.RepeatWrapping;
  roughnessTexture.wrapS = roughnessTexture.wrapT = THREE.RepeatWrapping;
  displacementTexture.wrapS = displacementTexture.wrapT = THREE.RepeatWrapping;

  return (
    <mesh position={position} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[tileSize, tileSize]} />
      <meshStandardMaterial
        map={diffuseTexture}
        normalMap={normalTexture}
        roughnessMap={roughnessTexture}
        aoMap={aoTexture}
        displacementMap={displacementTexture}
        displacementScale={0.1} // Adjust as necessary
        displacementBias={-0.05} // Optional
        transparent
      />
    </mesh>
  );
};

export default FloorTile;
