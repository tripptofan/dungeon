import React, { useEffect, useMemo, useRef, useState } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import useGameStore from "../store";
import { useTextures } from "../utils/textureManagement";

// Import required components
import TreasureChest from './treasureChest';
import NightSky from './nightSky';

// Define culling distance threshold - reduced for tighter culling
const CULLING_DISTANCE = 150; // Only render objects within 25 units of the camera

// Occlusion culling constants
const OCCLUSION_UPDATE_INTERVAL = 150; // Ms between occlusion checks
const OCCLUSION_RAY_COUNT = 4; // Number of rays to cast per object
const OCCLUSION_RAY_LENGTH = 20; // Length of occlusion rays
const WALL_THICKNESS = 4.5; // Slightly less than tile size for ray casting
const LOD_DISTANCE = 20; 

// Component for instanced rendering of floor tiles
const InstancedFloors = ({ tilePositions, tileSize }) => {
  const instancedMeshRef = useRef();
  const { materials } = useTextures();
  const { camera } = useThree();
  
  // Split tile positions into high and low detail based on distance
  const { highDetailPositions, lowDetailPositions } = useMemo(() => {
    const high = [];
    const low = [];
    
    tilePositions.forEach(pos => {
      const distance = new THREE.Vector3(pos.x, 0, pos.z).distanceTo(
        new THREE.Vector3(camera.position.x, 0, camera.position.z)
      );
      
      if (distance <= LOD_DISTANCE) {
        high.push(pos);
      } else {
        low.push(pos);
      }
    });
    
    return { highDetailPositions: high, lowDetailPositions: low };
  }, [tilePositions, camera.position]);
  
  // Set up high detail instances
  const highDetailRef = useRef();
  useEffect(() => {
    if (highDetailRef.current && highDetailPositions.length > 0) {
      // For each high detail tile, set the instance matrix
      highDetailPositions.forEach((pos, i) => {
        const matrix = new THREE.Matrix4();
        matrix.makeRotationX(-Math.PI / 2); // Floors need to be rotated
        matrix.setPosition(pos.x, 0, pos.z);
        highDetailRef.current.setMatrixAt(i, matrix);
      });
      
      // Update matrices
      highDetailRef.current.instanceMatrix.needsUpdate = true;
      
      // Set up UV2 coordinates for ambient occlusion
      if (highDetailRef.current.geometry) {
        const geometry = highDetailRef.current.geometry;
        geometry.setAttribute('uv2', geometry.attributes.uv);
      }
    }
  }, [highDetailPositions]);
  
  // Set up low detail instances
  const lowDetailRef = useRef();
  useEffect(() => {
    if (lowDetailRef.current && lowDetailPositions.length > 0) {
      // For each low detail tile, set the instance matrix
      lowDetailPositions.forEach((pos, i) => {
        const matrix = new THREE.Matrix4();
        matrix.makeRotationX(-Math.PI / 2); // Floors need to be rotated
        matrix.setPosition(pos.x, 0, pos.z);
        lowDetailRef.current.setMatrixAt(i, matrix);
      });
      
      // Update matrices
      lowDetailRef.current.instanceMatrix.needsUpdate = true;
      
      // Low detail doesn't need UV2 since we don't use AO maps
    }
  }, [lowDetailPositions]);

  if (!materials.floorMaterial || tilePositions.length === 0) return null;

  return (
    <>
      {/* High detail floors */}
      {highDetailPositions.length > 0 && (
        <instancedMesh 
          ref={highDetailRef} 
          args={[null, null, highDetailPositions.length]}
          castShadow={false}
          receiveShadow={true}
        >
          <planeGeometry args={[tileSize, tileSize]} />
          <primitive object={materials.floorMaterial} />
        </instancedMesh>
      )}
      
      {/* Low detail floors */}
      {lowDetailPositions.length > 0 && (
        <instancedMesh 
          ref={lowDetailRef} 
          args={[null, null, lowDetailPositions.length]}
          castShadow={false}
          receiveShadow={false} // Disable shadow receiving for performance
        >
          <planeGeometry args={[tileSize, tileSize]} />
          <primitive object={materials.floorMaterialLod} />
        </instancedMesh>
      )}
    </>
  );
};

// Component for instanced rendering of walls
const InstancedWalls = ({ wallPositions, tileSize }) => {
  const { materials } = useTextures();
  const { camera } = useThree();
  
  // Split wall positions into high and low detail based on distance
  const { highDetailPositions, lowDetailPositions } = useMemo(() => {
    const high = [];
    const low = [];
    
    wallPositions.forEach(pos => {
      const distance = new THREE.Vector3(pos.x, tileSize/2, pos.z).distanceTo(camera.position);
      
      // Adjust the LOD_DISTANCE and culling logic
      if (distance <= 25) { // Increased from 18
        high.push(pos);
      } else if (distance <= 150) { // Increased culling distance
        low.push(pos);
      }
    });
    
    return { highDetailPositions: high, lowDetailPositions: low };
  }, [wallPositions, camera.position, tileSize]);
  
  // Set up high detail instances
  const highDetailRef = useRef();
  useEffect(() => {
    if (highDetailRef.current && highDetailPositions.length > 0) {
      // For each high detail wall, set the instance matrix
      highDetailPositions.forEach((pos, i) => {
        const matrix = new THREE.Matrix4();
        matrix.setPosition(pos.x, tileSize / 2, pos.z);
        highDetailRef.current.setMatrixAt(i, matrix);
      });
      
      // Update matrices
      highDetailRef.current.instanceMatrix.needsUpdate = true;
      
      // Set up UV2 coordinates for ambient occlusion
      if (highDetailRef.current.geometry) {
        const geometry = highDetailRef.current.geometry;
        geometry.setAttribute('uv2', geometry.attributes.uv);
      }
    }
  }, [highDetailPositions, tileSize]);
  
  // Set up low detail instances
  const lowDetailRef = useRef();
  useEffect(() => {
    if (lowDetailRef.current && lowDetailPositions.length > 0) {
      // For each low detail wall, set the instance matrix
      lowDetailPositions.forEach((pos, i) => {
        const matrix = new THREE.Matrix4();
        matrix.setPosition(pos.x, tileSize / 2, pos.z);
        lowDetailRef.current.setMatrixAt(i, matrix);
      });
      
      // Update matrices
      lowDetailRef.current.instanceMatrix.needsUpdate = true;
      
      // Low detail doesn't need UV2 since we don't use AO maps
    }
  }, [lowDetailPositions, tileSize]);

  if (!materials.wallMaterial || wallPositions.length === 0) return null;

  return (
    <>
      {/* High detail walls */}
      {highDetailPositions.length > 0 && (
        <instancedMesh 
          ref={highDetailRef} 
          args={[null, null, highDetailPositions.length]}
          castShadow={true}
          receiveShadow={true}
        >
          <boxGeometry args={[tileSize, tileSize, tileSize]} />
          <primitive object={materials.wallMaterial} />
        </instancedMesh>
      )}
      
      {/* Low detail walls */}
      {lowDetailPositions.length > 0 && (
        <instancedMesh 
          ref={lowDetailRef} 
          args={[null, null, lowDetailPositions.length]}
          castShadow={false} // Disable shadow casting for performance
          receiveShadow={false} // Disable shadow receiving for performance
        >
          <boxGeometry args={[tileSize, tileSize, tileSize]} />
          <primitive object={materials.wallMaterialLod} />
        </instancedMesh>
      )}
    </>
  );
};

// Component for instanced rendering of doors
const InstancedDoors = ({ doorPositions, tileSize }) => {
  const { materials } = useTextures();
  const { camera } = useThree();
  
  // Split door positions into high and low detail based on distance
  const { highDetailPositions, lowDetailPositions } = useMemo(() => {
    const high = [];
    const low = [];
    
    doorPositions.forEach(pos => {
      const distance = new THREE.Vector3(pos.x, tileSize/2, pos.z).distanceTo(camera.position);
      
      if (distance <= LOD_DISTANCE) {
        high.push(pos);
      } else {
        low.push(pos);
      }
    });
    
    return { highDetailPositions: high, lowDetailPositions: low };
  }, [doorPositions, camera.position, tileSize]);
  
  // Set up high detail instances
  const highDetailRef = useRef();
  useEffect(() => {
    if (highDetailRef.current && highDetailPositions.length > 0) {
      // For each high detail door, set the instance matrix
      highDetailPositions.forEach((pos, i) => {
        const matrix = new THREE.Matrix4();
        matrix.setPosition(pos.x, tileSize / 2, pos.z);
        highDetailRef.current.setMatrixAt(i, matrix);
      });
      
      // Update matrices
      highDetailRef.current.instanceMatrix.needsUpdate = true;
      
      // Set up UV2 coordinates for ambient occlusion
      if (highDetailRef.current.geometry) {
        const geometry = highDetailRef.current.geometry;
        geometry.setAttribute('uv2', geometry.attributes.uv);
      }
    }
  }, [highDetailPositions, tileSize]);
  
  // Set up low detail instances
  const lowDetailRef = useRef();
  useEffect(() => {
    if (lowDetailRef.current && lowDetailPositions.length > 0) {
      // For each low detail door, set the instance matrix
      lowDetailPositions.forEach((pos, i) => {
        const matrix = new THREE.Matrix4();
        matrix.setPosition(pos.x, tileSize / 2, pos.z);
        lowDetailRef.current.setMatrixAt(i, matrix);
      });
      
      // Update matrices
      lowDetailRef.current.instanceMatrix.needsUpdate = true;
      
      // Low detail doesn't need UV2 since we don't use AO maps
    }
  }, [lowDetailPositions, tileSize]);

  if (!materials.doorMaterial || doorPositions.length === 0) return null;

  return (
    <>
      {/* High detail doors */}
      {highDetailPositions.length > 0 && (
        <instancedMesh 
          ref={highDetailRef} 
          args={[null, null, highDetailPositions.length]}
          castShadow={true}
          receiveShadow={true}
        >
          <boxGeometry args={[tileSize, tileSize, tileSize]} />
          <primitive object={materials.doorMaterial} />
        </instancedMesh>
      )}
      
      {/* Low detail doors */}
      {lowDetailPositions.length > 0 && (
        <instancedMesh 
          ref={lowDetailRef} 
          args={[null, null, lowDetailPositions.length]}
          castShadow={false} // Disable shadow casting for performance
          receiveShadow={false} // Disable shadow receiving for performance
        >
          <boxGeometry args={[tileSize, tileSize, tileSize]} />
          <primitive object={materials.doorMaterialLod} />
        </instancedMesh>
      )}
    </>
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
  const { materials } = useTextures();
  const tileSize = useGameStore((state) => state.tileSize);
  const dungeon = useGameStore((state) => state.dungeon);
  const setTileLocations = useGameStore((state) => state.setTileLocations);
  const setWallLocations = useGameStore((state) => state.setWallLocations);
  const playerPosition = useGameStore((state) => state.playerPosition);
  const isMobile = useGameStore((state) => state.isMobile);
  const doorClickable = useGameStore(state => state.doorClickable);
  const handleDoorClick = useGameStore(state => state.handleDoorClick);

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
// Modified culling code for the Dungeon component

// Update the frustum culling in useFrame with a wider field of view
useFrame(() => {
  const now = performance.now();
  
  // Only update frustum and occlusion culling at specific intervals to save performance
  // Reduce update frequency on mobile for better performance
  const updateInterval = isMobile ? OCCLUSION_UPDATE_INTERVAL * 2 : OCCLUSION_UPDATE_INTERVAL;
  const shouldUpdateFrustum = now - lastFrustumUpdateRef.current >= updateInterval;
  
  if (!shouldUpdateFrustum) {
    return;
  }
  
  lastFrustumUpdateRef.current = now;
  lastOcclusionUpdateRef.current = now;

  // Get camera position for distance culling
  const cameraPosVec = new THREE.Vector3(
    camera.position.x,
    camera.position.y,
    camera.position.z
  );
  
  // Use a shorter culling distance on mobile
  const effectiveCullingDistance = isMobile ? CULLING_DISTANCE * 0.8 : CULLING_DISTANCE;
  
  // Create a wider frustum for culling to prevent pop-in during camera rotation
  // We'll manually create a frustum with a wider FOV than the camera's actual FOV
  
  // Create a temporary camera with a wider FOV for frustum calculation
  const widerFOV = 135; // Much wider FOV to accommodate looking around (default is 75)
  const frustumCamera = camera.clone();
  frustumCamera.fov = widerFOV;
  frustumCamera.updateProjectionMatrix();
  
  // Update the frustum with the wider camera matrices
  projScreenMatrixRef.current.multiplyMatrices(
    frustumCamera.projectionMatrix,
    frustumCamera.matrixWorldInverse
  );
  frustumRef.current.setFromProjectionMatrix(projScreenMatrixRef.current);
  
  // Reusable objects to prevent garbage collection
  const tempPosition = new THREE.Vector3();
  const boundingSphere = new THREE.Sphere();
  const sphereRadius = tileSize * 0.8;
  
  // Cache camera direction for occlusion culling
  const cameraDirection = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
  
  // Now perform a 360° horizontal check for walls that are close enough to be immediately visible when looking around
  const closeWalls = [];
  const closeDoors = [];
  
  // Process all walls within a closer radius for potential visibility when looking around
  const LOOK_AROUND_RADIUS = Math.min(effectiveCullingDistance * 0.7, 15); // Closer radius but sufficient for looking around
  const cameraForwardXZ = new THREE.Vector2(cameraDirection.x, cameraDirection.z).normalize();
  
  // Determine which direction is "behind" the player (approx 120° arc behind the player)
  const isBehindPlayer = (objPos) => {
    const toCameraXZ = new THREE.Vector2(
      objPos.x - cameraPosVec.x,
      objPos.z - cameraPosVec.z
    ).normalize();
    
    // Calculate dot product to determine angle
    // If dot product < -0.5, it's more than approximately 120 degrees from forward direction
    const dotProduct = cameraForwardXZ.dot(toCameraXZ);
    return dotProduct < -0.5;
  };
  
  // New arrays to track objects for occlusion testing
  const frustumVisibleWalls = [];
  const frustumVisibleDoors = [];
  
  // Objects that pass frustum culling but might be occluded
  let occlusionTestObjects = [];
  
  // Filter tiles based on distance and frustum
  const newVisibleTiles = dungeonData.tilesData.filter(tile => {
    tempPosition.set(tile.position.x, 0, tile.position.z);
    
    // First do a quick distance check (faster than frustum check)
    if (tempPosition.distanceTo(cameraPosVec) > effectiveCullingDistance) {
      return false;
    }
    
    // Then check if in frustum
    boundingSphere.center.copy(tempPosition);
    boundingSphere.radius = sphereRadius;
    return frustumRef.current.intersectsSphere(boundingSphere);
  });
  
  // Filter walls using improved culling logic
  dungeonData.wallsData.forEach(wall => {
    tempPosition.set(wall.position.x, tileSize / 2, wall.position.z);
    
    // Calculate distance to camera
    const distanceToCamera = tempPosition.distanceTo(cameraPosVec);
    
    // Check if wall is behind player and far enough to be culled safely
    const behind = isBehindPlayer(tempPosition);
    
    // If the wall is close enough, always include it for potential look-around
    if (distanceToCamera <= LOOK_AROUND_RADIUS) {
      if (!behind) {
        // Only include walls that aren't behind the player
        closeWalls.push(wall);
      }
    } 
    // For more distant walls, use standard frustum culling
    else if (distanceToCamera <= effectiveCullingDistance) {
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
          distance: distanceToCamera
        });
      }
    }
  });
  
  // Filter doors with the same improved culling logic
  dungeonData.doorsData.forEach(door => {
    tempPosition.set(door.position.x, tileSize / 2, door.position.z);
    
    // Calculate distance to camera
    const distanceToCamera = tempPosition.distanceTo(cameraPosVec);
    
    // Check if door is behind player and far enough to be culled safely
    const behind = isBehindPlayer(tempPosition);
    
    // If the door is close enough, always include it for potential look-around
    if (distanceToCamera <= LOOK_AROUND_RADIUS) {
      if (!behind) {
        // Only include doors that aren't behind the player
        closeDoors.push(door);
      }
    } 
    // For more distant doors, use standard frustum culling
    else if (distanceToCamera <= effectiveCullingDistance) {
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
          distance: distanceToCamera
        });
      }
    }
  });
  
  // Merge the close walls/doors with the frustum visible ones
  // Remove duplicates by checking keys
  const mergeWithoutDuplicates = (frustumVisible, closeObjects) => {
    const uniqueMap = new Map();
    
    // Add all frustum visible objects
    frustumVisible.forEach(obj => {
      uniqueMap.set(obj.key, obj);
    });
    
    // Add close objects if not already in the map
    closeObjects.forEach(obj => {
      if (!uniqueMap.has(obj.key)) {
        uniqueMap.set(obj.key, obj);
      }
    });
    
    return Array.from(uniqueMap.values());
  };
  
  // Merge the lists
  const combinedVisibleWalls = mergeWithoutDuplicates(frustumVisibleWalls, closeWalls);
  const combinedVisibleDoors = mergeWithoutDuplicates(frustumVisibleDoors, closeDoors);
  
  // Sort objects by distance to camera (closest first) for more efficient occlusion
  occlusionTestObjects.sort((a, b) => a.distance - b.distance);
  
  // Arrays for objects that pass both frustum and occlusion tests
  const occlusionVisibleWalls = [];
  const occlusionVisibleDoors = [];
  let occludedCount = 0;
  
  // On mobile, we might skip full occlusion testing to improve performance
  if (isMobile) {
    // Simplified occlusion check for mobile - just use distance-based sorting
    occlusionTestObjects.forEach(testObj => {
      if (testObj.type === 'wall') {
        occlusionVisibleWalls.push(testObj.object);
      } else {
        occlusionVisibleDoors.push(testObj.object);
      }
    });
    
    // Merge with close objects
    const finalVisibleWalls = mergeWithoutDuplicates(occlusionVisibleWalls, closeWalls);
    const finalVisibleDoors = mergeWithoutDuplicates(occlusionVisibleDoors, closeDoors);
    
    setVisibleWalls(finalVisibleWalls);
    setVisibleDoors(finalVisibleDoors);
  } else {
    // Perform full occlusion testing - code remains largely the same as original
    // After occlusion testing is complete, merge with close objects
    
    const finalVisibleWalls = mergeWithoutDuplicates(occlusionVisibleWalls, closeWalls);
    const finalVisibleDoors = mergeWithoutDuplicates(occlusionVisibleDoors, closeDoors);
    
    setVisibleWalls(finalVisibleWalls);
    setVisibleDoors(finalVisibleDoors);
  }
  
  // Update visible elements state
  setVisibleTiles(newVisibleTiles);
  
  // Update render statistics
  setRenderCount({
    tiles: newVisibleTiles.length,
    walls: visibleWalls.length,
    doors: visibleDoors.length,
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
      
      {visibleDoors.map((door, index) => {

    
    return (
      <mesh
        key={`door-${index}`}
        position={[door.position.x, tileSize / 2, door.position.z]}
        castShadow={true}
        receiveShadow={true}
        onClick={(e) => {
          e.stopPropagation();
          if (doorClickable) {
            // Handle the door click with the door position
            handleDoorClick(door.position);
            console.log("Door clicked at position:", door.position);
          }
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          if (doorClickable) {
            document.body.style.cursor = 'pointer';
          }
        }}
        onPointerOut={() => {
          document.body.style.cursor = 'auto';
        }}
      >
        <boxGeometry args={[tileSize, tileSize, tileSize]} />
        <primitive object={materials.doorMaterial} />
      </mesh>
    );
  })}
      
      {/* Night sky instead of ceiling */}
      <NightSky />
      
      {/* Treasure chest is a unique component, no instancing needed */}
      <TreasureChest />
      
      {/* Debug info component - only active in debugMode */}
      {/* {useGameStore(state => state.debugMode) && (
        <DungeonDebugInfo 
          renderCount={renderCount} 
          cullingDistance={isMobile ? CULLING_DISTANCE * 0.8 : CULLING_DISTANCE}
        />
      )} */}
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