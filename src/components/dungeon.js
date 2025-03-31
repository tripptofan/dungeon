import React, { useEffect, useMemo, useRef, useState } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import useGameStore from "../store";
import { useTextures } from "../utils/textureManagement";

// Import optimized ceiling component
import OptimizedCeiling from "./optimizedCeiling";
import TreasureChest from './treasureChest';

// Define a frustum culling distance threshold
const CULLING_DISTANCE = 30; // Only render objects within 30 units of the camera

// Component for instanced rendering of floor tiles
const InstancedFloors = ({ tilePositions, tileSize }) => {
  const instancedMeshRef = useRef();
  const { materials } = useTextures();
  
  // Set up instances
  useEffect(() => {
    if (instancedMeshRef.current && tilePositions.length > 0) {
      // For each tile position, set the instance matrix
      tilePositions.forEach((pos, i) => {
        const matrix = new THREE.Matrix4();
        // Create transformation matrix with rotation and position
        matrix.makeRotationX(-Math.PI / 2); // Floors need to be rotated
        matrix.setPosition(pos.x, 0, pos.z);
        instancedMeshRef.current.setMatrixAt(i, matrix);
      });
      
      // Update the instance matrices
      instancedMeshRef.current.instanceMatrix.needsUpdate = true;
      
      // Set up UV2 coordinates for ambient occlusion
      if (instancedMeshRef.current.geometry) {
        const geometry = instancedMeshRef.current.geometry;
        geometry.setAttribute('uv2', geometry.attributes.uv);
      }
    }
  }, [tilePositions]);

  if (!materials.floorMaterial || tilePositions.length === 0) return null;

  return (
    <instancedMesh 
      ref={instancedMeshRef} 
      args={[null, null, tilePositions.length]}
    >
      <planeGeometry args={[tileSize, tileSize]} />
      <primitive object={materials.floorMaterial} />
    </instancedMesh>
  );
};

// Component for instanced rendering of walls
const InstancedWalls = ({ wallPositions, tileSize }) => {
  const instancedMeshRef = useRef();
  const { materials } = useTextures();
  
  // Set up instances
  useEffect(() => {
    if (instancedMeshRef.current && wallPositions.length > 0) {
      // For each wall position, set the instance matrix
      wallPositions.forEach((pos, i) => {
        const matrix = new THREE.Matrix4();
        matrix.setPosition(pos.x, tileSize / 2, pos.z); // Walls are positioned at half height
        instancedMeshRef.current.setMatrixAt(i, matrix);
      });
      
      // Update the instance matrices
      instancedMeshRef.current.instanceMatrix.needsUpdate = true;
      
      // Set up UV2 coordinates for ambient occlusion
      if (instancedMeshRef.current.geometry) {
        const geometry = instancedMeshRef.current.geometry;
        geometry.setAttribute('uv2', geometry.attributes.uv);
      }
    }
  }, [wallPositions, tileSize]);

  if (!materials.wallMaterial || wallPositions.length === 0) return null;

  return (
    <instancedMesh 
      ref={instancedMeshRef} 
      args={[null, null, wallPositions.length]}
    >
      <boxGeometry args={[tileSize, tileSize, tileSize]} />
      <primitive object={materials.wallMaterial} />
    </instancedMesh>
  );
};

// Component for instanced rendering of doors
const InstancedDoors = ({ doorPositions, tileSize }) => {
  const instancedMeshRef = useRef();
  const { materials } = useTextures();
  
  // Set up instances
  useEffect(() => {
    if (instancedMeshRef.current && doorPositions.length > 0) {
      // For each door position, set the instance matrix
      doorPositions.forEach((pos, i) => {
        const matrix = new THREE.Matrix4();
        matrix.setPosition(pos.x, tileSize / 2, pos.z); // Doors are positioned at half height like walls
        instancedMeshRef.current.setMatrixAt(i, matrix);
      });
      
      // Update the instance matrices
      instancedMeshRef.current.instanceMatrix.needsUpdate = true;
      
      // Set up UV2 coordinates for ambient occlusion
      if (instancedMeshRef.current.geometry) {
        const geometry = instancedMeshRef.current.geometry;
        geometry.setAttribute('uv2', geometry.attributes.uv);
      }
    }
  }, [doorPositions, tileSize]);

  if (!materials.doorMaterial || doorPositions.length === 0) return null;

  return (
    <instancedMesh 
      ref={instancedMeshRef} 
      args={[null, null, doorPositions.length]}
    >
      <boxGeometry args={[tileSize, tileSize, tileSize]} />
      <primitive object={materials.doorMaterial} />
    </instancedMesh>
  );
};

// Main Dungeon component
const OptimizedDungeon = () => {
  const { camera } = useThree();
  const frustumRef = useRef(new THREE.Frustum());
  const projScreenMatrixRef = useRef(new THREE.Matrix4());
  
  const tileSize = useGameStore((state) => state.tileSize);
  const dungeon = useGameStore((state) => state.dungeon);
  const setTileLocations = useGameStore((state) => state.setTileLocations);
  const setWallLocations = useGameStore((state) => state.setWallLocations);
  const playerPosition = useGameStore((state) => state.playerPosition);

  // Calculate dungeon dimensions
  const dungeonWidth = useMemo(() => dungeon.length * tileSize, [dungeon.length, tileSize]);
  const dungeonDepth = useMemo(() => dungeon[0].length * tileSize, [dungeon, tileSize]);
  const roofHeight = tileSize; // Roof height

  // State for visible elements
  const [visibleTiles, setVisibleTiles] = useState([]);
  const [visibleWalls, setVisibleWalls] = useState([]);
  const [visibleDoors, setVisibleDoors] = useState([]);

  // Create full dungeon data structure but don't instantiate components yet
  const dungeonData = useMemo(() => {
    const tilesData = [];
    const wallsData = [];
    const doorsData = [];
    const tileLocationsArray = [];
    const wallLocationsArray = [];

    // Create data for tiles, walls and doors
    dungeon.forEach((row, x) => {
      row.forEach((tile, z) => {
        const worldX = x * tileSize;
        const worldZ = z * tileSize;

        if (tile === 0) {
          // Floor tile
          tileLocationsArray.push({ x: worldX, z: worldZ });
          tilesData.push({
            key: `floor-${x}-${z}`,
            position: { x: worldX, z: worldZ }
          });
        } else if (tile === 1) {
          // Regular wall
          wallLocationsArray.push({ x: worldX, z: worldZ });
          wallsData.push({
            key: `wall-${x}-${z}`,
            position: { x: worldX, z: worldZ }
          });
        } else if (tile === 2) {
          // Door component
          wallLocationsArray.push({ x: worldX, z: worldZ });
          doorsData.push({
            key: `door-${x}-${z}`,
            position: { x: worldX, z: worldZ }
          });
        }
      });
    });

    return {
      tilesData,
      wallsData,
      doorsData,
      tileLocationsArray,
      wallLocationsArray
    };
  }, [dungeon, tileSize]);

  // Update locations in store
  useEffect(() => {
    setTileLocations(dungeonData.tileLocationsArray);
    setWallLocations(dungeonData.wallLocationsArray);
  }, [dungeonData.tileLocationsArray, dungeonData.wallLocationsArray, setTileLocations, setWallLocations]);

  // Update the visible elements based on camera position on each frame
  useFrame(() => {
    // Update the frustum
    projScreenMatrixRef.current.multiplyMatrices(
      camera.projectionMatrix,
      camera.matrixWorldInverse
    );
    frustumRef.current.setFromProjectionMatrix(projScreenMatrixRef.current);
    
    // Get camera position for distance culling
    const cameraPosVec = new THREE.Vector3(
      camera.position.x,
      camera.position.y,
      camera.position.z
    );
    
    // Only update visibility every 5 frames for performance
    // This is a common optimization for frustum culling
    if (Math.floor(performance.now() / 200) % 2 === 0) {
      // Filter tiles based on distance
      const newVisibleTiles = dungeonData.tilesData.filter(tile => {
        const tilePos = new THREE.Vector3(tile.position.x, 0, tile.position.z);
        return tilePos.distanceTo(cameraPosVec) < CULLING_DISTANCE;
      });
      
      // Filter walls based on distance
      const newVisibleWalls = dungeonData.wallsData.filter(wall => {
        const wallPos = new THREE.Vector3(wall.position.x, tileSize / 2, wall.position.z);
        return wallPos.distanceTo(cameraPosVec) < CULLING_DISTANCE;
      });
      
      // Filter doors based on distance
      const newVisibleDoors = dungeonData.doorsData.filter(door => {
        const doorPos = new THREE.Vector3(door.position.x, tileSize / 2, door.position.z);
        return doorPos.distanceTo(cameraPosVec) < CULLING_DISTANCE;
      });
      
      // Update visible elements state
      setVisibleTiles(newVisibleTiles);
      setVisibleWalls(newVisibleWalls);
      setVisibleDoors(newVisibleDoors);
    }
  });

  // Render using instanced meshes for better performance
  return (
    <>
      {/* Use instanced rendering for floors, walls, and doors */}
      <InstancedFloors
        tilePositions={visibleTiles.map(tile => tile.position)}
        tileSize={tileSize}
      />
      
      <InstancedWalls
        wallPositions={visibleWalls.map(wall => wall.position)}
        tileSize={tileSize}
      />
      
      <InstancedDoors
        doorPositions={visibleDoors.map(door => door.position)}
        tileSize={tileSize}
      />
      
      {/* Use optimized ceiling component */}
      <OptimizedCeiling 
        position={[dungeonWidth / 2 - tileSize / 2, roofHeight, dungeonDepth / 2 - tileSize / 2]} 
        tileSize={tileSize}
        dungeonWidth={dungeonWidth}
        dungeonDepth={dungeonDepth}
      />
      
      {/* Treasure chest is a unique component, no instancing needed */}
      <TreasureChest />
    </>
  );
};

export default React.memo(OptimizedDungeon);