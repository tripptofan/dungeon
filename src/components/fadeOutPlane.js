import React, { useRef, useEffect, useState } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import useGameStore from "../store";

const FadeOutPlane = () => {
  const { camera } = useThree();
  const { sceneLoaded, loadingFade, setLoadingFade } = useGameStore();
  const [opacity, setOpacity] = useState(1.0);
  const materialRef = useRef();
  
  // Keep track of animation progress
  const startTimeRef = useRef(null);
  const fadeInProgress = useRef(false);
  const hasSetupFade = useRef(false);
  
  // Configuration
  const fadeDuration = 2.5; // Total fade duration in seconds
  const fadeDelay = 0.5; // Delay before starting fade
  
  // Ensure we start with full opacity
  useEffect(() => {
    if (materialRef.current) {
      materialRef.current.opacity = 1.0;
    }
  }, []);
  
  // Handle starting the fade
  useEffect(() => {
    if (sceneLoaded && loadingFade && !hasSetupFade.current) {
      // Mark that we've set up the fade to prevent duplicate setups
      hasSetupFade.current = true;
      
      // Record when we start the fade (after delay)
      setTimeout(() => {
        startTimeRef.current = Date.now();
        fadeInProgress.current = true;
      }, fadeDelay * 1000);
    }
  }, [sceneLoaded, loadingFade]);
  
  // Handle the fade animation using absolute time instead of delta
  useFrame(() => {
    if (!materialRef.current) return;
    
    // Always ensure the plane is in front of the camera
    const planePosition = new THREE.Vector3(0, 0, -1);
    planePosition.applyMatrix4(camera.matrixWorld);
    
    // Make sure opacity is set correctly
    materialRef.current.opacity = opacity;
    
    // Handle the fade animation
    if (fadeInProgress.current && startTimeRef.current !== null) {
      // Calculate progress based on elapsed time
      const elapsedTime = (Date.now() - startTimeRef.current) / 1000; // convert to seconds
      const progress = Math.min(elapsedTime / fadeDuration, 1.0);
      
      // Calculate new opacity (1.0 -> 0.0)
      const newOpacity = Math.max(0, 1.0 - progress);
      
      // Update state (this will trigger a re-render)
      setOpacity(newOpacity);
      
      // Check if fade is complete
      if (progress >= 1.0) {
        fadeInProgress.current = false;
        setLoadingFade(false);
      }
    }
  });
  
  // Full-screen plane that covers the entire camera view
  return (
    <>
      {/* Create a plane that's always in front of the camera */}
      <mesh position={[0, 0, -0.5]} renderOrder={9999}>
        {/* Use a larger plane to ensure coverage */}
        <planeGeometry args={[5, 5]} />
        <meshBasicMaterial 
          ref={materialRef} 
          color="black" 
          transparent={true} 
          opacity={opacity}
          side={THREE.DoubleSide}
          depthTest={false}
          depthWrite={false}
        />
      </mesh>
      
      {/* Add a second plane with fixed position as backup */}
      <mesh position={[5, 2, 0]} rotation={[0, -Math.PI / 2, 0]} renderOrder={9998}>
        <planeGeometry args={[20, 20]} />
        <meshBasicMaterial 
          color="black" 
          transparent={true} 
          opacity={opacity}
          side={THREE.DoubleSide}
          depthTest={false}
          depthWrite={false}
        />
      </mesh>
    </>
  );
};

export default FadeOutPlane;