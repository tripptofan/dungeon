import React, { useEffect, useMemo, useRef, useState } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import useGameStore from "../store";
import { useTextures } from "../utils/textureManagement";

// Import our new separated components
import InstancedFloors from './instancedFloors';
import InstancedWalls from './instancedWalls';
import InstancedDoors from './instancedDoors';

// Import required additional components
import TreasureChest from './treasureChest';
import NightSky from './nightSky';

// Import Eye component
import Eye from './eye';

// Define culling distance threshold
const CULLING_DISTANCE = 100; // Only render objects within this distance of the camera

// Occlusion culling constants
const OCCLUSION_UPDATE_INTERVAL = 150; // Ms between occlusion checks
const OCCLUSION_RAY_COUNT = 4; // Number of rays to cast per object
const OCCLUSION_RAY_LENGTH = 20; // Length of occlusion rays
const WALL_THICKNESS = 4.5; // Slightly less than tile size for ray casting

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
      // For non-mobile devices, we can use the full occlusion testing
      // Simplified occlusion test: accept walls that are close enough
      occlusionTestObjects.forEach(testObj => {
        if (testObj.distance < 15) { // Close objects are always visible
          if (testObj.type === 'wall') {
            occlusionVisibleWalls.push(testObj.object);
          } else {
            occlusionVisibleDoors.push(testObj.object);
          }
        } else {
          // For further objects, do a simple ray test
          const directionToObject = new THREE.Vector3()
            .subVectors(testObj.position, cameraPosVec)
            .normalize();
          
          // Check if there are any walls between the camera and the object
          raycasterRef.current.set(cameraPosVec, directionToObject);
          const intersects = raycasterRef.current.intersectObjects(scene.children, true);
          
          // If the first intersection is with this object, it's visible
          if (intersects.length > 0) {
            // Check if the distance to the first intersection is close to the object's distance
            const isVisible = Math.abs(intersects[0].distance - testObj.distance) < 1.0;
            
            if (isVisible) {
              if (testObj.type === 'wall') {
                occlusionVisibleWalls.push(testObj.object);
              } else {
                occlusionVisibleDoors.push(testObj.object);
              }
            } else {
              occludedCount++;
            }
          }
        }
      });
      
      // Merge with close objects
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
      
      {/* First layer of walls - ground level */}
      <InstancedWalls
        wallPositions={visibleWalls.map(wall => wall.position)}
        tileSize={tileSize}
        yOffset={tileSize / 2}
      />
      
      {/* Second layer of walls - upper level */}
      <InstancedWalls
        wallPositions={[
          ...visibleWalls.map(wall => wall.position),
          ...visibleDoors.map(door => door.position) // Add walls above doors
        ]}
        tileSize={tileSize}
        yOffset={tileSize * 1.5} // Position directly above the first layer
      />
      
      {/* Doors at ground level only */}
      <InstancedDoors
        doorPositions={visibleDoors.map(door => door.position)}
        tileSize={tileSize}
      />
      
      {/* Night sky instead of ceiling */}
      <NightSky />
      
      {/* Add eyes along the path */}
      <PathEyes tileSize={tileSize} />
      
      {/* Treasure chest is a unique component, no instancing needed */}
      <TreasureChest />
      
      {/* Debug info component - only active in debugMode */}
      {useGameStore(state => state.debugMode) && (
        <DungeonDebugInfo 
          renderCount={renderCount} 
          cullingDistance={isMobile ? CULLING_DISTANCE * 0.8 : CULLING_DISTANCE}
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

// Add this new component for path eyes
const PathEyes = ({ tileSize }) => {
  const { camera } = useThree();
  
  // Generate eyes along a path to the treasure (existing code remains the same)
  const pathEyes = useMemo(() => {
    const eyes = [];
    // Get player starting position from store
    const playerPosition = useGameStore.getState().playerPosition;
    
    // Define how many eyes to place
    const numberOfEyes = 100;
    
    // Generate eyes
    for (let i = 0; i < numberOfEyes; i++) {
      // Create a seed for stable randomization
      const random = Math.random;
      
      // Random x position between 2.6 and 7.4
      const x = 2.7 + random() * 4.7;
      
      // Random y position between 1 and 5
      const y = .3 + random() * 9;
      
      // Random z position between 3 and the end of dungeon
      // Assuming the treasure chest is at the end of the dungeon path
      const z = 1 + random() * (100 - 3);
      
      eyes.push({
        key: `path-eye-${i}`,
        position: [x, y, z],
        // Use default rotation by not specifying a rotation prop
        scale: [0.4, 0.4] // Fixed scale
      });
    }
    
    return eyes;
  }, [tileSize]); // Only recalculate if tileSize changes
  
  // Track visible eyes with distance-based culling and intensity
  const [visibleEyes, setVisibleEyes] = useState([]);
  
  // Reference for the frustum
  const frustumRef = useRef(new THREE.Frustum());
  const projScreenMatrixRef = useRef(new THREE.Matrix4());
  
  // Configurable intensity parameters for fine-tuning the J-curve
  const intensityParams = {
    cullDistance: 40,           // Maximum distance at which eyes are visible
    fullIntensityDistance: 2,   // Distance at which eyes are at full brightness
    minIntensity: 0.005,        // Minimum intensity at cull distance
    falloffExponent: 3          // Lower exponent for initial calculation
  };

  // Update visible eyes on every frame
  useFrame(() => {
    const cameraPosVec = new THREE.Vector3(
      camera.position.x,
      camera.position.y,
      camera.position.z
    );
    
    // Update the frustum for culling checks
    // Use a slightly wider FOV than the camera to prevent pop-in during rotation
    const widerFOV = 100; // Wider than default (75) but not as wide as for walls/doors
    const frustumCamera = camera.clone();
    frustumCamera.fov = widerFOV;
    frustumCamera.updateProjectionMatrix();
    
    projScreenMatrixRef.current.multiplyMatrices(
      frustumCamera.projectionMatrix,
      frustumCamera.matrixWorldInverse
    );
    frustumRef.current.setFromProjectionMatrix(projScreenMatrixRef.current);
    
    // Get camera direction for behind-player checks
    const cameraDirection = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
    const cameraForwardXZ = new THREE.Vector2(cameraDirection.x, cameraDirection.z).normalize();
    
    // Function to determine if an object is behind the player
    const isBehindPlayer = (objPos) => {
      const toCameraXZ = new THREE.Vector2(
        objPos.x - cameraPosVec.x,
        objPos.z - cameraPosVec.z
      ).normalize();
      
      // If dot product < -0.2, it's more than approximately 100 degrees from forward direction
      // Using a less strict threshold than walls (making the cone of visibility wider)
      const dotProduct = cameraForwardXZ.dot(toCameraXZ);
      return dotProduct < -0.2;
    };
    
    // Use the configurable parameters
    const {
      cullDistance,
      fullIntensityDistance,
      minIntensity,
      falloffExponent
    } = intensityParams;
    
    // Reusable objects to prevent garbage collection
    const tempPosition = new THREE.Vector3();
    const boundingSphere = new THREE.Sphere();
    const sphereRadius = 0.5; // Appropriate size for an eye
    
    // Calculate which eyes are visible and their emissive intensity
    const visible = pathEyes.map(eye => {
      // Create a Vector3 from the eye position array
      tempPosition.set(eye.position[0], eye.position[1], eye.position[2]);
      
      // Calculate distance to camera
      const distanceToCam = tempPosition.distanceTo(cameraPosVec);
      
      // Minimum distance to prevent eyes from being too close to the camera
      const MIN_EYE_DISTANCE = 1.0; // Don't render eyes closer than 1 unit from camera
      
      // First distance checks - both minimum and maximum
      if (distanceToCam < MIN_EYE_DISTANCE || distanceToCam > cullDistance) {
        return null;
      }
      
      // Check if the eye is behind the player
      if (isBehindPlayer(tempPosition) && distanceToCam > 5) {
        // Cull eyes that are behind the player, except very close ones
        return null;
      }
      
      // Frustum culling check
      boundingSphere.center.copy(tempPosition);
      boundingSphere.radius = sphereRadius;
      
      if (!frustumRef.current.intersectsSphere(boundingSphere) && distanceToCam > 5) {
        // Cull eyes outside the frustum, except very close ones
        return null;
      }
      
      // Calculate eye position relative to camera view direction
      // This helps prevent eyes that are directly in the player's face
      const eyeDirection = new THREE.Vector3().subVectors(tempPosition, cameraPosVec).normalize();
      const forwardDot = eyeDirection.dot(cameraDirection);
      
      // If the eye is too directly in front of the camera and very close, don't render it
      if (forwardDot > 0.9 && distanceToCam < 2.0) {
        return null;
      }
      
      // If eye passes all culling checks, calculate intensity
      let emissiveIntensity;
      
      // If within full intensity distance, use full intensity
      if (distanceToCam <= fullIntensityDistance) {
        emissiveIntensity = 1.0;
      } else {
        // Create a smooth J-curve for intensity falloff
        
        // 1. Normalize the distance to a 0-1 range
        const fadeZoneSize = cullDistance - fullIntensityDistance;
        const distanceInFadeZone = distanceToCam - fullIntensityDistance;
        const normalizedDistance = distanceInFadeZone / fadeZoneSize;
        
        // 2. Initial calculation with lower exponent
        const basicFalloff = Math.pow(normalizedDistance, falloffExponent);
        const invertedBasic = 1 - basicFalloff;
        
        // 3. Apply an additional curve transformation for J-curve
        const jCurveValue = Math.pow(invertedBasic, 3);
        
        // 4. Scale to our desired intensity range
        emissiveIntensity = minIntensity + jCurveValue * (1.0 - minIntensity);
      }
      
      // Check if message overlay is showing
      const overlayVisible = useGameStore.getState().showMessageOverlay;
      
      // If overlay is visible, boost the intensity slightly to help eyes shine through
      if (overlayVisible && emissiveIntensity > 0.1) {
        // Boost intensity by 70% when overlay is visible, but maintain the J-curve
        emissiveIntensity = Math.min(1.0, emissiveIntensity * 1.7);
      }
      
      return {
        ...eye,
        emissiveIntensity
      };
    }).filter(Boolean); // Remove null entries (culled eyes)
    
    // Update state with visible eyes
    setVisibleEyes(visible);
  });
  
  return (
    <>
      {visibleEyes.map(eye => (
        <Eye 
          key={eye.key}
          position={eye.position}
          scale={eye.scale}
          emissiveIntensity={eye.emissiveIntensity}
        />
      ))}
    </>
  );
};

export default React.memo(OptimizedDungeon);