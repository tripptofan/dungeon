import React, { useMemo, useEffect } from "react";
import useGameStore from "../store";
import { useHueShiftedTexture, PASTEL_PRESETS } from "./useHueShiftedTexture";
import * as THREE from "three";

const PastelCeiling = ({ position, tileSize }) => {
  const dungeon = useGameStore((state) => state.dungeon);
  
  // Calculate dimensions once
  const dungeonWidth = useMemo(() => dungeon.length * tileSize, [dungeon.length, tileSize]);
  const dungeonDepth = useMemo(() => dungeon[0].length * tileSize, [dungeon, tileSize]);

  const { material } = useHueShiftedTexture(
    "/textures/ceilingTexture1.png", 
    PASTEL_PRESETS.peach.hueShift,
    PASTEL_PRESETS.peach.saturation,
    PASTEL_PRESETS.peach.lightness
  );
  
  // Set up texture repeat for the ceiling
  useEffect(() => {
    if (material && material.uniforms) {
      material.uniforms.repeat = { value: new THREE.Vector2(3, 3) };
      
      // Add to fragment shader if needed
      const originalFragShader = material.fragmentShader;
      if (!originalFragShader.includes('uniform vec2 repeat;')) {
        material.fragmentShader = 
          originalFragShader
            .replace('varying vec2 vUv;', 'varying vec2 vUv;\nuniform vec2 repeat;')
            .replace('vec4 texColor = texture2D(baseTexture, vUv);', 
                     'vec4 texColor = texture2D(baseTexture, mod(vUv * repeat, 1.0));');
        
        // Need to tell the material to update
        material.needsUpdate = true;
      }
    }
  }, [material, dungeonWidth, dungeonDepth]);
  
  if (!material) return null;
  
  // The key fix: use the material as a property, not a child
  return (
    <mesh position={position} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[dungeonWidth, dungeonDepth]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
};

export default React.memo(PastelCeiling);