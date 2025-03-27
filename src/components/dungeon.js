import React, { useEffect, useMemo } from "react";
import useGameStore from "../store";

import FlickeringLight from "./flickeringLight";
import FloorTile from "./floorTile";
import Wall from "./wall";
import Ceiling from "./ceiling";

const Dungeon = () => {
  const tileSize = useGameStore((state) => state.tileSize);
  const dungeon = useGameStore((state) => state.dungeon);
  const setTileLocations = useGameStore((state) => state.setTileLocations);
  const setWallLocations = useGameStore((state) => state.setWallLocations);

  // Calculate dungeon dimensions
  const dungeonWidth = useMemo(() => dungeon.length * tileSize, [dungeon.length, tileSize]);
  const dungeonDepth = useMemo(() => dungeon[0].length * tileSize, [dungeon, tileSize]);
  const roofHeight = tileSize; // Roof height

  // Build the dungeon elements with useMemo to avoid unnecessary rebuilds
  const { tiles, walls, tileLocations, wallLocations, lightSpheres } = useMemo(() => {
    const tilesArray = [];
    const wallsArray = [];
    const tileLocationsArray = [];
    const wallLocationsArray = [];
    const lightSpheresArray = [];

    // Create lights
    for (let z = 4; z < dungeon[0].length - 2; z += 4) {
      const lightZ = z * tileSize;
      const lightX = dungeon.length * tileSize / 2;
      const isFlickering = Math.random() < 0.8;
    
      if (isFlickering) {
        lightSpheresArray.push(
          <FlickeringLight
            key={`flicker-light-${z}`}
            position={[lightX - tileSize / 2, roofHeight - 2, lightZ]}
            randomizer={Math.random()} // Unique randomizer for each light
          />
        );
      } else {
        // Steady light
        lightSpheresArray.push(
          <group key={`steady-light-${z}`} position={[lightX - tileSize / 2, roofHeight - 2, lightZ]}>
            <mesh>
              <sphereGeometry args={[0.3, 8, 8]} />
              <meshStandardMaterial emissive="yellow" emissiveIntensity={15} transparent opacity={0.5} />
            </mesh>
            <pointLight intensity={15} color="white" distance={9} decay={1.2} castShadow />
          </group>
        );
      }
    }

    // Create tiles and walls
    dungeon.forEach((row, x) => {
      row.forEach((tile, z) => {
        const worldX = x * tileSize;
        const worldZ = z * tileSize;

        if (tile === 0) {
          tileLocationsArray.push({ x: worldX, z: worldZ });
          tilesArray.push(
            <FloorTile key={`floor-${x}-${z}`} position={[worldX, 0, worldZ]} tileSize={tileSize} />
          );
        } else {
          wallLocationsArray.push({ x: worldX, z: worldZ });
          wallsArray.push(
            <Wall key={`wall-${x}-${z}`} position={[worldX, tileSize / 2, worldZ]} tileSize={tileSize} />
          );
        }
      });
    });

    return {
      tiles: tilesArray,
      walls: wallsArray,
      tileLocations: tileLocationsArray,
      wallLocations: wallLocationsArray,
      lightSpheres: lightSpheresArray
    };
  }, [dungeon, tileSize, roofHeight]);

  // Update locations in store
  useEffect(() => {
    setTileLocations(tileLocations);
    setWallLocations(wallLocations);
  }, [tileLocations, wallLocations, setTileLocations, setWallLocations]);

  return (
    <>
      {tiles}
      {walls}
      <Ceiling 
        position={[dungeonWidth / 2 - tileSize / 2, roofHeight, dungeonDepth / 2 - tileSize / 2]} 
        tileSize={tileSize}
      />
      {lightSpheres}
    </>
  );
};

export default React.memo(Dungeon);