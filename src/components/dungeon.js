import React, { useEffect, useMemo, useRef, useState } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import useGameStore from "../store";
import { useTextures } from "../utils/textureManagement";

// Import required components
import TreasureChest from './treasureChest';
import NightSky from './nightSky';

// Define culling distance threshold - reduced for tighter culling
const CULLING_DISTANCE = 25; // Only render objects within 25 units of the camera

// Occlusion culling constants
const OCCLUSION_UPDATE_INTERVAL = 150; // Ms between occlusion checks
const OCCLUSION_RAY_COUNT = 4; // Number of rays to cast per object
const OCCLUSION_RAY_LENGTH = 20; // Length of occlusion rays
const WALL_THICKNESS = 4.5; // Slightly less than tile size for ray casting

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
      castShadow={false}
      receiveShadow={true}
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
      castShadow={true}
      receiveShadow={true}
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
      castShadow={true}
      receiveShadow={true}
    >
      <boxGeometry args={[tileSize, tileSize, tileSize]} />
      <primitive object={materials.doorMaterial} />
    </instancedMesh>
  );
};

// Main Dungeon component
const OptimizedDungeon = () => {
  const { camera, scene } = useThree();
  const frustumRef = useRef(new THREE.Frustum());
  const projScreenMatrixRef = useRef(new THREE.Matrix4());
  const lastFrustumUpdateRef = useRef(0);
  const lastOcclusionUpdateRef = useRef(0);
  const raycasterRef = useRef(new THREE.Raycaster());
  
  const tileSize = useGameStore((state) => state.tileSize);
  const dungeon = useGameStore((state) => state.dungeon);
  const setTileLocations = useGameStore((state) => state.setTileLocations);
  const setWallLocations = useGameStore((state) => state.setWallLocations);
  const playerPosition = useGameStore((state) => state.playerPosition);

  // Calculate dungeon dimensions
  const dungeonWidth = useMemo(() => dungeon.length * tileSize, [dungeon.length, tileSize]);
  const dungeonDepth = useMemo(() => dungeon[0].length * tileSize, [dungeon, tileSize]);

  // State for visible elements
  const [visibleTiles, setVisibleTiles] = useState([]);
  const [visibleWalls, setVisibleWalls] = useState([]);
  const [visibleDoors, setVisibleDoors] = useState([]);
  
  // Tracking state
  const [renderCount, setRenderCount] = useState({
    tiles: 0,
    walls: 0,
    doors: 0,
    occluded: 0
  });
  
  // Reference to all walls for occlusion tests
  const allWallsRef = useRef([]);
  const allDoorsRef = useRef([]);

  // Create full dungeon data structure but don't instantiate components yet
  const dungeonData = useMemo(() => {
    const tilesData = [];
    const wallsData = [];
    const doorsData = [];
    const tileLocationsArray = [];
    const wallLocationsArray = [];
    
    // Create a 2D lookup grid for quick access to dungeon layout
    const gridLookup = Array(dungeon.length).fill().map(() => Array(dungeon[0].length).fill(0));
    
    // Fill lookup grid with dungeon data
    dungeon.forEach((row, x) => {
      row.forEach((tile, z) => {
        gridLookup[x][z] = tile;
      });
    });

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
            position: { x: worldX, z: worldZ },
            gridPos: { x, z }
          });
        } else if (tile === 1) {
          // Regular wall
          wallLocationsArray.push({ x: worldX, z: worldZ });
          wallsData.push({
            key: `wall-${x}-${z}`,
            position: { x: worldX, z: worldZ },
            gridPos: { x, z }
          });
        } else if (tile === 2) {
          // Door component
          wallLocationsArray.push({ x: worldX, z: worldZ });
          doorsData.push({
            key: `door-${x}-${z}`,
            position: { x: worldX, z: worldZ },
            gridPos: { x, z }
          });
        }
      });
    });

    return {
      tilesData,
      wallsData,
      doorsData,
      tileLocationsArray,
      wallLocationsArray,
      gridLookup
    };
  }, [dungeon, tileSize]);

  // Store all wall refs for occlusion testing
  useEffect(() => {
    allWallsRef.current = dungeonData.wallsData;
    allDoorsRef.current = dungeonData.doorsData;
  }, [dungeonData]);

  // Update locations in store
  useEffect(() => {
    setTileLocations(dungeonData.tileLocationsArray);
    setWallLocations(dungeonData.wallLocationsArray);
  }, [dungeonData.tileLocationsArray, dungeonData.wallLocationsArray, setTileLocations, setWallLocations]);

  // Efficient frustum culling using reusable objects and optimized checks
  useFrame(() => {
    const now = performance.now();
    
    // Only update frustum and occlusion culling at specific intervals to save performance
    const shouldUpdateFrustum = now - lastFrustumUpdateRef.current >= OCCLUSION_UPDATE_INTERVAL;
    
    if (!shouldUpdateFrustum) {
      return;
    }
    
    lastFrustumUpdateRef.current = now;
    lastOcclusionUpdateRef.current = now;

    // Update the frustum with current camera matrices
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
    
    // Reusable objects to prevent garbage collection
    const tempPosition = new THREE.Vector3();
    const boundingSphere = new THREE.Sphere();
    const sphereRadius = tileSize * 0.8;
    
    // Cache camera direction for occlusion culling
    const cameraDirection = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
    
    // New arrays to track objects for occlusion testing
    const frustumVisibleWalls = [];
    const frustumVisibleDoors = [];
    
    // Objects that pass frustum culling but might be occluded
    let occlusionTestObjects = [];
    
    // Filter tiles based on distance and frustum
    const newVisibleTiles = dungeonData.tilesData.filter(tile => {
      tempPosition.set(tile.position.x, 0, tile.position.z);
      
      // First do a quick distance check (faster than frustum check)
      if (tempPosition.distanceTo(cameraPosVec) > CULLING_DISTANCE) {
        return false;
      }
      
      // Then check if in frustum
      boundingSphere.center.copy(tempPosition);
      boundingSphere.radius = sphereRadius;
      return frustumRef.current.intersectsSphere(boundingSphere);
    });
    
    // Filter walls based on distance and frustum
    dungeonData.wallsData.forEach(wall => {
      tempPosition.set(wall.position.x, tileSize / 2, wall.position.z);
      
      // Distance check
      if (tempPosition.distanceTo(cameraPosVec) > CULLING_DISTANCE) {
        return; // Skip this wall
      }
      
      // Frustum check
      boundingSphere.center.copy(tempPosition);
      boundingSphere.radius = sphereRadius;
      
      if (frustumRef.current.intersectsSphere(boundingSphere)) {
        // This wall is in the frustum, save it for occlusion testing
        frustumVisibleWalls.push(wall);
        occlusionTestObjects.push({
          type: 'wall',
          object: wall,
          position: tempPosition.clone(),
          distance: tempPosition.distanceTo(cameraPosVec)
        });
      }
    });
    
    // Filter doors based on distance and frustum
    dungeonData.doorsData.forEach(door => {
      tempPosition.set(door.position.x, tileSize / 2, door.position.z);
      
      // Distance check
      if (tempPosition.distanceTo(cameraPosVec) > CULLING_DISTANCE) {
        return; // Skip this door
      }
      
      // Frustum check
      boundingSphere.center.copy(tempPosition);
      boundingSphere.radius = sphereRadius;
      
      if (frustumRef.current.intersectsSphere(boundingSphere)) {
        // This door is in the frustum, save it for occlusion testing
        frustumVisibleDoors.push(door);
        occlusionTestObjects.push({
          type: 'door',
          object: door,
          position: tempPosition.clone(),
          distance: tempPosition.distanceTo(cameraPosVec)
        });
      }
    });
    
    // Sort objects by distance to camera (closest first) for more efficient occlusion
    occlusionTestObjects.sort((a, b) => a.distance - b.distance);
    
    // Arrays for objects that pass both frustum and occlusion tests
    const occlusionVisibleWalls = [];
    const occlusionVisibleDoors = [];
    let occludedCount = 0;
    
    // Set up objects for occlusion testing
    const rayOrigin = cameraPosVec.clone();
    const rayDirection = new THREE.Vector3();
    const rayEndpoint = new THREE.Vector3();
    
    // Create an array of all blocking objects (all walls and doors) for ray testing
    const allBlockers = [...dungeonData.wallsData.map(wall => ({
      type: 'wall',
      object: wall,
      position: new THREE.Vector3(wall.position.x, tileSize / 2, wall.position.z),
      halfWidth: WALL_THICKNESS / 2
    })), ...dungeonData.doorsData.map(door => ({
      type: 'door',
      object: door,
      position: new THREE.Vector3(door.position.x, tileSize / 2, door.position.z),
      halfWidth: WALL_THICKNESS / 2
    }))];
    
    // Perform occlusion testing on objects that pass frustum culling
    occlusionTestObjects.forEach(testObj => {
      const objPos = testObj.position;
      
      // For very close objects, don't perform occlusion testing
      if (testObj.distance < tileSize * 1.5) {
        // Object is very close to camera, always visible
        if (testObj.type === 'wall') {
          occlusionVisibleWalls.push(testObj.object);
        } else {
          occlusionVisibleDoors.push(testObj.object);
        }
        return;
      }
      
      // Cast multiple rays to test different parts of the object
      let isVisible = false;
      const rayOffsets = [
        { x: 0, y: 0, z: 0 },                           // Center
        { x: tileSize * 0.4, y: 0, z: tileSize * 0.4 }, // Corner
        { x: -tileSize * 0.4, y: 0, z: tileSize * 0.4 }, // Corner
        { x: tileSize * 0.4, y: 0, z: -tileSize * 0.4 }  // Corner
      ];
      
      // Check if any ray reaches the object without being blocked
      for (let i = 0; i < OCCLUSION_RAY_COUNT; i++) {
        if (isVisible) break; // If already found visible, skip remaining checks
        
        // Calculate ray endpoint with offset
        rayEndpoint.copy(objPos);
        rayEndpoint.x += rayOffsets[i].x;
        rayEndpoint.y += rayOffsets[i].y;
        rayEndpoint.z += rayOffsets[i].z;
        
        // Calculate direction from camera to this point of the object
        rayDirection.copy(rayEndpoint).sub(rayOrigin).normalize();
        
        // Set up raycaster from camera to object
        raycasterRef.current.set(rayOrigin, rayDirection);
        
        // Find all potential intersections along the ray
        let isOccluded = false;
        
        // Perform manual ray testing against blockers
        // This is faster than scene.raycast for this specific case
        for (const blocker of allBlockers) {
          // Skip self-intersection
          if ((testObj.type === blocker.type) && 
              (testObj.object.key === blocker.object.key)) {
            continue;
          }
          
          // Skip blockers that are farther from camera than our test object
          const blockerDistSq = blocker.position.distanceToSquared(rayOrigin);
          if (blockerDistSq > testObj.distance * testObj.distance) {
            continue;
          }
          
          // Calculate ray-box intersection
          // Simplify to 2D test for our grid-based dungeon
          const dx = blocker.position.x - rayOrigin.x;
          const dz = blocker.position.z - rayOrigin.z;
          
          // Project blocker center onto ray
          const t = (dx * rayDirection.x + dz * rayDirection.z) / 
                    (rayDirection.x * rayDirection.x + rayDirection.z * rayDirection.z);
          
          // Skip if blocker is behind ray origin
          if (t < 0) continue;
          
          // Calculate closest point on ray to blocker center
          const closestX = rayOrigin.x + t * rayDirection.x;
          const closestZ = rayOrigin.z + t * rayDirection.z;
          
          // Calculate distance from closest point to blocker center
          const distX = Math.abs(closestX - blocker.position.x);
          const distZ = Math.abs(closestZ - blocker.position.z);
          
          // Check if closest point is within blocker bounds
          if (distX <= blocker.halfWidth && distZ <= blocker.halfWidth) {
            // Ray intersects this blocker
            isOccluded = true;
            break;
          }
        }
        
        if (!isOccluded) {
          isVisible = true;
        }
      }
      
      if (isVisible) {
        // Object is visible through at least one ray
        if (testObj.type === 'wall') {
          occlusionVisibleWalls.push(testObj.object);
        } else {
          occlusionVisibleDoors.push(testObj.object);
        }
      } else {
        occludedCount++;
      }
    });
    
    // Update visible elements state
    setVisibleTiles(newVisibleTiles);
    setVisibleWalls(occlusionVisibleWalls);
    setVisibleDoors(occlusionVisibleDoors);
    
    // Update render statistics
    setRenderCount({
      tiles: newVisibleTiles.length,
      walls: occlusionVisibleWalls.length,
      doors: occlusionVisibleDoors.length,
      occluded: occludedCount
    });
  });

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
      
      {/* Night sky instead of ceiling */}
      <NightSky />
      
      {/* Treasure chest is a unique component, no instancing needed */}
      <TreasureChest />
      
      {/* Debug info component - only active in debugMode */}
      {useGameStore(state => state.debugMode) && (
        <DungeonDebugInfo 
          renderCount={renderCount} 
          cullingDistance={CULLING_DISTANCE}
        />
      )}
    </>
  );
};

// Optional debug component to display performance metrics
const DungeonDebugInfo = ({ renderCount, cullingDistance }) => {
  const { camera } = useThree();
  
  useFrame(() => {
    // Update debug info in console every 5 seconds
    if (Math.floor(performance.now() / 5000) % 1 === 0) {
      console.log(`Culling stats: Distance=${cullingDistance}, ` + 
                  `Rendered: ${renderCount.tiles} tiles, ${renderCount.walls} walls, ` +
                  `${renderCount.doors} doors, Occluded: ${renderCount.occluded}`);
    }
  });
  
  return null; // This is just for debugging information
};

export default React.memo(OptimizedDungeon);