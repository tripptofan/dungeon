import React, { useMemo } from "react";
import { useLoader } from "@react-three/fiber";
import useGameStore from "../store";
import * as THREE from "three";

const Ceiling = ({ position, tileSize }) => {
  const dungeon = useGameStore((state) => state.dungeon);
  
  // Calculate dimensions once
  const dungeonWidth = useMemo(() => dungeon.length * tileSize, [dungeon.length, tileSize]);
  const dungeonDepth = useMemo(() => dungeon[0].length * tileSize, [dungeon, tileSize]);

  // Load the new ceiling texture (using ceilingTexture1, can be changed to ceilingTexture2)
  const ceilingTexture = useLoader(THREE.TextureLoader, "/textures/dungeonFloor.png");

  // Set texture properties - scale down significantly
  // Make texture repeat many times across each tile for a smaller, more detailed pattern
  const repeatX = dungeonWidth * .5; // 3 times more repeats for a smaller scale
  const repeatZ = dungeonDepth * .5;

  // Optimize by applying texture settings only when needed
  useMemo(() => {
    ceilingTexture.wrapS = ceilingTexture.wrapT = THREE.RepeatWrapping;
    ceilingTexture.repeat.set(repeatX, repeatZ);
    ceilingTexture.colorSpace = THREE.SRGBColorSpace;
    ceilingTexture.minFilter = THREE.LinearMipmapLinearFilter;
    ceilingTexture.magFilter = THREE.LinearFilter;
  }, [ceilingTexture, repeatX, repeatZ]);

  return (
    <mesh position={position} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[dungeonWidth, dungeonDepth]} />
      <meshStandardMaterial
        map={ceilingTexture}
        emissive={new THREE.Color(0xffffff)} 
        emissiveMap={ceilingTexture}
        emissiveIntensity={.3}
        roughness={0.7}
        metalness={0.3}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
};

export default React.memo(Ceiling);