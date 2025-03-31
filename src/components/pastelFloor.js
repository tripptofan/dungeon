import React from "react";
import { useHueShiftedTexture, PASTEL_PRESETS } from "./useHueShiftedTexture";

const PastelFloor = ({ position, tileSize }) => {
  const { material } = useHueShiftedTexture(
    "/textures/dungeonFloor.png", 
    PASTEL_PRESETS.peach.hueShift,
    PASTEL_PRESETS.peach.saturation,
    PASTEL_PRESETS.peach.lightness
  );
  
  if (!material) return null;
  
  // The key fix: use the material as a property, not a child
  return (
    <mesh position={position} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[tileSize, tileSize]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
};

export default React.memo(PastelFloor);