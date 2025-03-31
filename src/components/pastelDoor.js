import React from "react";
import { useHueShiftedTexture, PASTEL_PRESETS } from "./useHueShiftedTexture";

const PastelDoor = ({ position, tileSize }) => {
  const { material } = useHueShiftedTexture(
    "/textures/dungeonDoor.png", 
    PASTEL_PRESETS.mint.hueShift,
    PASTEL_PRESETS.mint.saturation,
    PASTEL_PRESETS.mint.lightness
  );
  
  if (!material) return null;
  
  // The key fix: use the material as a property, not a child
  return (
    <mesh position={position}>
      <boxGeometry args={[tileSize, tileSize, tileSize]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
};

export default React.memo(PastelDoor);