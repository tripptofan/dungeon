import React, { useEffect } from "react";
import useGameStore from "../store";

const Dungeon = () => {
  const tileSize = useGameStore((state) => state.tileSize);
  const gridSize = useGameStore((state) => state.gridSize);
  const setTileLocations = useGameStore((state) => state.setTileLocations);
  const setWallLocations = useGameStore((state) => state.setWallLocations);
  const setEnemySpawnPoint = useGameStore((state) => state.setEnemySpawnPoint);

  const tiles = [];
  const walls = [];
  const tileLocations = [];
  const wallLocations = [];

  const createTile = (x, z) => {
    const color = (x + z) % 2 === 0 ? "lightgray" : "darkgray";
    tileLocations.push({ x, z });

    return (
      <mesh key={`tile-${x}-${z}`} position={[x * tileSize, 0, z * tileSize]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[tileSize, tileSize]} />
        <meshStandardMaterial color={color} />
      </mesh>
    );
  };

  const createWall = (x, z, width, height, depth) => {
    wallLocations.push({ x, z });
    return (
      <mesh key={`wall-${x}-${z}`} position={[x, height / 2, z]}>
        <boxGeometry args={[width, height, depth]} />
        <meshStandardMaterial color="gray" />
      </mesh>
    );
  };

  for (let x = 0; x < gridSize; x++) {
    for (let z = 0; z < gridSize; z++) {
      tiles.push(createTile(x, z));
    }
  }

  const halfTile = tileSize / 2;
  const wallHeight = tileSize;
  const gridLimit = gridSize * tileSize;
  const wallThickness = useGameStore((state) => state.wallThickness);

  for (let x = 0; x < gridSize; x++) {
    walls.push(createWall(x * tileSize, -halfTile, tileSize, wallHeight, wallThickness));
    walls.push(createWall(x * tileSize, gridLimit - halfTile, tileSize, wallHeight, wallThickness));
  }
  for (let z = 0; z < gridSize; z++) {
    walls.push(createWall(-halfTile, z * tileSize, wallThickness, wallHeight, tileSize));
    walls.push(createWall(gridLimit - halfTile, z * tileSize, wallThickness, wallHeight, tileSize));
  }

  const centerX = Math.floor(gridSize / 2) * tileSize;
  const centerZ = Math.floor(gridSize / 2) * tileSize;

  useEffect(() => {
    setTileLocations(tileLocations);
    setWallLocations(wallLocations);
    setEnemySpawnPoint({ x: centerX, y: 1.5, z: centerZ });
  }, [setTileLocations, setWallLocations, setEnemySpawnPoint]);

  return (
    <>
      {tiles}
      {walls}
    </>
  );
};

export default Dungeon;
