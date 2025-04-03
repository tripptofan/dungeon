import React, { useRef, useState, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import useGameStore from '../store';

// Static array to store refs to the prize for outlining
export const prizeRefs = [];

const Prize = () => {
  const prizeRef = useRef();
  const { camera } = useThree();
  const [hovered, setHovered] = useState(false);
  
  // Use refs instead of state for animation values to avoid re-renders
  const animationStateRef = useRef('hidden'); // hidden, rising, floating, inspecting
  const floatPhaseRef = useRef(0);
  const prizePositionRef = useRef(null);
  const initializedRef = useRef(false);
  const lastUpdateTimeRef = useRef(0);
  
  // Get relevant state from the store
  const prizeState = useGameStore(state => state.prizeState);
  const setPrizeState = useGameStore(state => state.setPrizeState);
  const setPrizeClicked = useGameStore(state => state.setPrizeClicked);
  const chestOpened = useGameStore(state => state.chestOpened);
  const showMessageOverlay = useGameStore(state => state.showMessageOverlay);

  // Get chest position from the experience data - do this once
  const experiences = useGameStore(state => state.experienceScript.experiences);
  const chestExperience = experiences.find(exp => exp.type === 'chest');
  const chestPosition = useRef(
    chestExperience 
      ? { x: chestExperience.position.x, z: chestExperience.position.z + 4 }
      : { x: 5, z: 86 }
  ).current;
  
  // Add ref to the static array when mounted, remove when unmounted
  useEffect(() => {
    if (prizeRef.current) {
      prizeRefs.push(prizeRef.current);
      console.log(`Added prize to outline list, total: ${prizeRefs.length}`);
    }
    
    return () => {
      const index = prizeRefs.indexOf(prizeRef.current);
      if (index !== -1) {
        prizeRefs.splice(index, 1);
        console.log(`Removed prize from outline list, remaining: ${prizeRefs.length}`);
      }
    };
  }, []);
  
  // Initialize the prize position and update animation state - once on mount
  useEffect(() => {
    if (!initializedRef.current) {
      // Initialize position
      prizePositionRef.current = {
        x: chestPosition.x,
        y: 0.5, // inside the chest
        z: chestPosition.z
      };
      
      initializedRef.current = true;
    }
    
    // Update animation state based on prize state
    animationStateRef.current = prizeState;
  }, [prizeState, chestPosition]);
  
  // Start rising when chest is opened - only trigger once
  useEffect(() => {
    if (chestOpened && prizeState === 'hidden') {
      // Start rising from the chest
      setPrizeState('rising');
    }
  }, [chestOpened, prizeState, setPrizeState]);
  
  // Handle the prize animation (optimized version)
  useFrame((state, delta) => {
    if (!prizeRef.current || !prizePositionRef.current) return;
    
    const animationState = animationStateRef.current;
    
    // Skip updates if hidden
    if (animationState === 'hidden') return;
    
    // Throttle updates for better performance (update at most 60 times per second)
    const now = performance.now();
    if (now - lastUpdateTimeRef.current < 16) { // ~60fps = 16ms between frames
      return;
    }
    lastUpdateTimeRef.current = now;
    
    // Update the float phase for the floating animation (use ref to avoid re-renders)
    floatPhaseRef.current += delta * 2;
    
    // Update position based on animation state
    if (animationState === 'rising') {
      // Rise up from the chest
      const targetY = 2.0; // Float above the chest
      const riseSpeed = 0.01;
      
      if (prizePositionRef.current.y < targetY) {
        prizePositionRef.current.y += riseSpeed;
      } else {
        // Transition to floating state - use the store action
        setPrizeState('floating');
      }
    } 
    else if (animationState === 'floating') {
      // Floating animation - use sin wave with float phase ref
      const floatOffset = Math.sin(floatPhaseRef.current) * 0.1;
      prizePositionRef.current.y = 2.0 + floatOffset; // Base height plus float offset
      
      // Make the prize always face the player during floating
      if (prizeRef.current) {
        // Get direction to camera (in XZ plane only)
        const dirToCamera = new THREE.Vector3(
          camera.position.x - prizeRef.current.position.x,
          0,
          camera.position.z - prizeRef.current.position.z
        ).normalize();
        
        // Set rotation to face the camera
        if (dirToCamera.length() > 0) {
          const angle = Math.atan2(dirToCamera.x, dirToCamera.z);
          prizeRef.current.rotation.y = angle;
        }
      }
    }
    else if (animationState === 'inspecting') {
      // Position right in front of the camera
      const cameraDirection = new THREE.Vector3(0, 0, -1);
      cameraDirection.applyQuaternion(camera.quaternion);
      
      // Position the prize 1 unit in front of the camera
      const targetPos = {
        x: camera.position.x + cameraDirection.x * 1,
        y: camera.position.y, // Same height as camera
        z: camera.position.z + cameraDirection.z * 1
      };
      
      // Smoothly move toward the target position (lerp)
      prizePositionRef.current.x += (targetPos.x - prizePositionRef.current.x) * 0.1;
      prizePositionRef.current.y += (targetPos.y - prizePositionRef.current.y) * 0.1;
      prizePositionRef.current.z += (targetPos.z - prizePositionRef.current.z) * 0.1;
      
      // Make prize face directly at the camera
      prizeRef.current.lookAt(camera.position);
    }
    
    // Apply the position directly to the mesh
    if (prizeRef.current) {
      prizeRef.current.position.set(
        prizePositionRef.current.x,
        prizePositionRef.current.y,
        prizePositionRef.current.z
      );
    }
  });
  
  // Don't render if hidden
  if (prizeState === 'hidden') return null;
  
  // Create a glowing effect when hovered
  const glowIntensity = hovered ? 0.8 : 0.4;
  const isClickable = (prizeState === 'floating' || prizeState === 'inspecting') && !showMessageOverlay;
  
  return (
    <group 
      ref={prizeRef} 
      position={[
        prizePositionRef.current?.x || chestPosition.x,
        prizePositionRef.current?.y || 0.5,
        prizePositionRef.current?.z || chestPosition.z
      ]}
    >
      {/* Prize object - now tall instead of wide - rotated to appear as a tall document/note */}
      <mesh 
        rotation={[0, Math.PI / 2, Math.PI/2]} // Rotate 90 degrees to make it tall instead of wide
        onClick={(e) => {
          e.stopPropagation();
          if (isClickable && prizeState === 'floating') {
            // Move to inspecting state
            setPrizeState('inspecting');
            setPrizeClicked(true);
          }
        }}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        renderOrder={2000} // Ensure it renders on top when in inspection mode
      >
        <boxGeometry args={[1.0, 0.02, 1.5]} /> {/* Swapped dimensions to make it tall */}
        <meshStandardMaterial 
          color="#f0e68c" // Golden color
          emissive="#f0e68c"
          emissiveIntensity={glowIntensity}
          metalness={0.7}
          roughness={0.2}
        />
      </mesh>
      
      {/* Add more paper/document-like visuals */}
      <mesh
        rotation={[0, Math.PI / 2, Math.PI/2]} // Same rotation as parent
        position={[0, 0, 0.001]} // Slightly in front
        renderOrder={2001}
      >
        <planeGeometry args={[0.95, 1.45]} /> {/* Slightly smaller than the base */}
        <meshBasicMaterial 
          color="#fff8e1" // Parchment/paper color
          transparent={true}
          opacity={0.8}
        />
      </mesh>
      
      {/* Add a more obvious glow effect */}
      <pointLight 
        color="#ffcc77" 
        intensity={2} 
        distance={3} 
        decay={2} 
      />
    </group>
  );
};

export default React.memo(Prize);