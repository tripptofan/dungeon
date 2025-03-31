import React, { useRef, useEffect } from "react";
import { useTextures } from "../utils/textureManagement";

const OptimizedDoor = ({ position, tileSize }) => {
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
      {/* Use the shared door material */}
      {materials.doorMaterial ? (
        <primitive object={materials.doorMaterial} />
      ) : (
        <meshStandardMaterial color="#8B4513" /> // Fallback with brown color
      )}
    </mesh>
  );
};

export default React.memo(OptimizedDoor);