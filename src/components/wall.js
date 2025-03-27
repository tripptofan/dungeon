import React from "react";
import { useLoader } from "@react-three/fiber";
import * as THREE from "three";

const Wall = ({ position, tileSize }) => {
  // Load wall textures using useLoader hook
  const aoTexture = useLoader(THREE.TextureLoader, "/textures/4K-wall_stone_10-ao.jpg");
  const diffuseTexture = useLoader(THREE.TextureLoader, "/textures/4K-wall_stone_10-diffuse.jpg");
  const normalTexture = useLoader(THREE.TextureLoader, "/textures/4K-wall_stone_10-normal.jpg");
  const specularTexture = useLoader(THREE.TextureLoader, "/textures/4K-wall_stone_10-specular.jpg");
  const displacementTexture = useLoader(THREE.TextureLoader, "/textures/4K-wall_stone_10-displacement.jpg");

//   const aoTextureBase = useLoader(THREE.TextureLoader, "/textures/aerial_rocks_02_ao_4k.jpg");
//   const diffuseTextureBase = useLoader(THREE.TextureLoader, "/textures/aerial_rocks_02_diff_4k.jpg");
//   const normalTextureBase = useLoader(THREE.TextureLoader, "/textures/aerial_rocks_02_nor_gl_4k.jpg");
//   const roughnessTextureBase = useLoader(THREE.TextureLoader, "/textures/aerial_rocks_02_rough_4k.jpg");
//   const displacementTextureBase = useLoader(THREE.TextureLoader, "/textures/aerial_rocks_02_disp_4k.jpg");

  // Set texture properties
  const setTextureRepeat = (texture, repeatX, repeatY) => {
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(repeatX, repeatY);
  };

  setTextureRepeat(aoTexture, 1, 1);
  setTextureRepeat(diffuseTexture, 1, 1);
  setTextureRepeat(normalTexture, 1, 1);
  setTextureRepeat(specularTexture, 1, 1);
  setTextureRepeat(displacementTexture, 1, 1);

//   // Adjust texture scaling to match the stretched baseboard geometry
//   const baseboardAspectX = tileSize / (tileSize / 8); // Width relative to height
//   const baseboardAspectZ = tileSize / (tileSize + 0.5); // Depth relative to width

//   setTextureRepeat(aoTextureBase, baseboardAspectX, baseboardAspectZ);
//   setTextureRepeat(diffuseTextureBase, baseboardAspectX, baseboardAspectZ);
//   setTextureRepeat(normalTextureBase, baseboardAspectX, baseboardAspectZ);
//   setTextureRepeat(roughnessTextureBase, baseboardAspectX, baseboardAspectZ);
//   setTextureRepeat(displacementTextureBase, baseboardAspectX, baseboardAspectZ);

  return (
    <group position={position}>
      {/* Wall mesh */}
      <mesh>
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

      {/* <mesh position={[0, -tileSize / 2, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <boxGeometry args={[tileSize, tileSize / 8, tileSize + 0.2]} />
        <meshStandardMaterial
          map={diffuseTextureBase}
          normalMap={normalTextureBase}
          aoMap={aoTextureBase}
          displacementMap={displacementTextureBase}
          roughnessMap={roughnessTextureBase}
          displacementScale={0.1}
          displacementBias={-0.05}
          transparent
        />
      </mesh> */}
    </group>
  );
};

export default Wall;
