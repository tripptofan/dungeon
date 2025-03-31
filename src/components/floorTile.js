import React, { useRef, useEffect } from "react";
import { useTextures } from "../utils/textureManagement";

const OptimizedFloorTile = ({ position, tileSize }) => {
  const meshRef = useRef();
  const { materials } = useTextures();
  
  // Add UV2 coordinates for ambient occlusion mapping
  useEffect(() => {
    if (meshRef.current) {
      const geometry = meshRef.current.geometry;
      geometry.setAttribute('uv2', geometry.attributes.uv);
    }
  }, []);

  return (
    <mesh ref={meshRef} position={position} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[tileSize, tileSize]} />
      {/* Use the shared floor material - no need to create new material instances */}
      {materials.floorMaterial ? (
        <primitive object={materials.floorMaterial} />
      ) : (
        <meshStandardMaterial color="#444" /> // Fallback if material isn't loaded yet
      )}
    </mesh>
  );
};

export default React.memo(OptimizedFloorTile);