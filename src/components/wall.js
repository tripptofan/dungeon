import React, { useRef, useEffect } from "react";
import { useTextures } from "../utils/textureManagement";

const OptimizedWall = ({ position, tileSize }) => {
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
    <mesh ref={meshRef} position={position}>
      <boxGeometry args={[tileSize, tileSize, tileSize]} />
      {/* Use the shared wall material */}
      {materials.wallMaterial ? (
        <primitive object={materials.wallMaterial} />
      ) : (
        <meshStandardMaterial color="#666" /> // Fallback
      )}
    </mesh>
  );
};

export default React.memo(OptimizedWall);