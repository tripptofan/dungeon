import React, { useEffect } from "react";
import useGameStore from "../store";

const Dungeon = () => {
  const tileSize = useGameStore((state) => state.tileSize);
  const dungeon = useGameStore((state) => state.dungeon);
  const setTileLocations = useGameStore((state) => state.setTileLocations);
  const setWallLocations = useGameStore((state) => state.setWallLocations);

  const tiles = [];
  const walls = [];
  const tileLocations = [];
  const wallLocations = [];

  const dungeonWidth = dungeon.length * tileSize;
  const dungeonDepth = dungeon[0].length * tileSize;
  const roofHeight = tileSize; // Roof should sit exactly at the top of the walls

  // Light configuration
  const lightRange = 0.3; // Light bulb size (sphere radius)

  // Create sphere light sources with pointLight inside each sphere
  const lightSpheres = [];

  // Loop over the dungeon's columns (z axis) to place lights
  for (let z = 2; z < dungeon[0].length - 2; z += 4) {
    const lightZ = z * tileSize; // Light positions at each column (z axis)
    const lightX = dungeon.length * tileSize / 2; // Center the lights along the x axis (middle of the hallway)

    lightSpheres.push(
      <group key={`light-${z}`} position={[lightX - tileSize / 2, roofHeight, lightZ]}>
        {/* Sphere representing the light bulb */}
        <mesh>
          <sphereGeometry args={[lightRange, 8, 8]} /> {/* Smaller 1x1 light bulb */}
          <meshStandardMaterial emissive="yellow" emissiveIntensity={15} transparent={true} opacity={0.5} />
        </mesh>

        {/* Point light inside the sphere */}
        <pointLight
          position={[0, 0, 0]} // Position the light at the center of the sphere
          intensity={15} // Increased intensity
          color="white"
          distance={lightRange * 30} // Adjust distance to represent the radius of the light
          decay={1.2} // Light decay
          castShadow
        />
      </group>
    );
  }

  dungeon.forEach((row, x) => {
    row.forEach((tile, z) => {
      const worldX = x * tileSize;
      const worldZ = z * tileSize;

      if (tile === 0) {
        tileLocations.push({ x: worldX, z: worldZ });
        tiles.push(
          <mesh key={`tile-${x}-${z}`} position={[worldX, 0, worldZ]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[tileSize, tileSize]} />
            <meshStandardMaterial color={(x + z) % 2 === 0 ? "lightgray" : "darkgray"} />
          </mesh>
        );
      } else {
        wallLocations.push({ x: worldX, z: worldZ });
        walls.push(
          <mesh key={`wall-${x}-${z}`} position={[worldX, tileSize / 2, worldZ]}>
            <boxGeometry args={[tileSize, tileSize, tileSize]} />
            <meshStandardMaterial color="gray" />
          </mesh>
        );
      }
    });
  });

  useEffect(() => {
    setTileLocations(tileLocations);
    setWallLocations(wallLocations);
  }, [setTileLocations, setWallLocations]);

  return (
    <>
      {tiles}
      {walls}

      {/* Roof positioned exactly at the top of the walls */}
      <mesh position={[dungeonWidth / 2 - tileSize / 2, roofHeight, dungeonDepth / 2 - tileSize / 2]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[dungeonWidth, dungeonDepth]} />
        <meshStandardMaterial color="black" side={2} /> {/* side=2 makes it double-sided */}
      </mesh>

      {/* Add the sphere light sources */}
      {lightSpheres}
    </>
  );
};

export default Dungeon;
