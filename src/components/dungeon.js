import React, { useEffect } from "react";
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

  const tiles = [];
  const walls = [];
  const tileLocations = [];
  const wallLocations = [];

  const dungeonWidth = dungeon.length * tileSize;
  const dungeonDepth = dungeon[0].length * tileSize;
  const roofHeight = tileSize; // Roof should sit exactly at the top of the walls


  // Create sphere light sources with pointLight inside each sphere
  const lightSpheres = [];

  // Loop over the dungeon's columns (z axis) to place lights
  for (let z = 4; z < dungeon[0].length - 2; z += 4) {
    const lightZ = z * tileSize;
    const lightX = dungeon.length * tileSize / 2;
    const isFlickering = Math.random() < 0.8;
  
    if (isFlickering) {
      lightSpheres.push(
        <FlickeringLight
          key={`flicker-light-${z}`}
          position={[lightX - tileSize / 2, roofHeight - 2, lightZ]}
          randomizer={Math.random()} // Unique randomizer for each light
        />
      );
    } else {
      // Steady light
      lightSpheres.push(
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
  

  dungeon.forEach((row, x) => {
    row.forEach((tile, z) => {
      const worldX = x * tileSize;
      const worldZ = z * tileSize;

      if (tile === 0) {
        tileLocations.push({ x: worldX, z: worldZ });
        tiles.push(
          <FloorTile key={`floor-${x}-${z}`} position={[worldX, 0, worldZ]} tileSize={tileSize} />

        );
      } else {
        wallLocations.push({ x: worldX, z: worldZ });
        walls.push(
          <Wall key={`wall-${x}-${z}`} position={[worldX, tileSize / 2, worldZ]} tileSize={tileSize} />
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
      <Ceiling position={[dungeonWidth / 2 - tileSize / 2, roofHeight, dungeonDepth / 2 - tileSize / 2]} tileSize={tileSize}/>
      {/* Roof positioned exactly at the top of the walls */}
      {/* <mesh position={[dungeonWidth / 2 - tileSize / 2, roofHeight, dungeonDepth / 2 - tileSize / 2]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[dungeonWidth, dungeonDepth]} />
        <meshStandardMaterial color="black" side={2} /> 
      </mesh> */}

      {/* Add the sphere light sources */}
      {lightSpheres}
    </>
  );
};

export default Dungeon;
