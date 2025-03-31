import React, { useEffect, useMemo } from "react";
import useGameStore from "../store";

import FlickeringLight from "./flickeringLight";
import PastelFloor from "./pastelFloor";
import PastelWall from "./pastelWall";
import PastelDoor from "./pastelDoor";
import PastelCeiling from "./pastelCeiling";

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
  const { tiles, walls, doors, tileLocations, wallLocations, lightSpheres } = useMemo(() => {
    const tilesArray = [];
    const wallsArray = [];
    const doorsArray = [];
    const tileLocationsArray = [];
    const wallLocationsArray = [];
    const lightSpheresArray = [];

    // Create tiles, walls and doors
    dungeon.forEach((row, x) => {
      row.forEach((tile, z) => {
        const worldX = x * tileSize;
        const worldZ = z * tileSize;

        if (tile === 0) {
          // Floor tile
          tileLocationsArray.push({ x: worldX, z: worldZ });
          tilesArray.push(
            <PastelFloor key={`floor-${x}-${z}`} position={[worldX, 0, worldZ]} tileSize={tileSize} />
          );
        } else if (tile === 1) {
          // Regular wall
          wallLocationsArray.push({ x: worldX, z: worldZ });
          wallsArray.push(
            <PastelWall key={`wall-${x}-${z}`} position={[worldX, tileSize / 2, worldZ]} tileSize={tileSize} />
          );
        } else if (tile === 2) {
          // Door component
          wallLocationsArray.push({ x: worldX, z: worldZ });
          doorsArray.push(
            <PastelDoor key={`door-${x}-${z}`} position={[worldX, tileSize / 2, worldZ]} tileSize={tileSize} />
          );
        }
      });
    });

    return {
      tiles: tilesArray,
      walls: wallsArray,
      doors: doorsArray,
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
      {doors}
      <PastelCeiling 
        position={[dungeonWidth / 2 - tileSize / 2, roofHeight, dungeonDepth / 2 - tileSize / 2]} 
        tileSize={tileSize}
      />
    </>
  );
};

export default React.memo(Dungeon);