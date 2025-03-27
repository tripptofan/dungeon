import { useEffect, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import useGameStore from "../store";

export default function FadeOutPlane() {
  const { sceneLoaded, loadingFade, setLoadingFade } = useGameStore();
  const materialRef = useRef();
  const opacityRef = useRef(1);
  const shouldFadeRef = useRef(false);
  
  const fadeSpeed = 0.5; // Adjust this value to control the fade speed
  const fadeDelay = 1; // Delay in seconds before fading starts

  useEffect(() => {
    let timeoutId;
    if (sceneLoaded && loadingFade) {
      timeoutId = setTimeout(() => {
        shouldFadeRef.current = true;
      }, fadeDelay * 1000);
    }
    
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [sceneLoaded, loadingFade]);

  useFrame((_, delta) => {
    if (shouldFadeRef.current && materialRef.current) {
      opacityRef.current = Math.max(0, opacityRef.current - delta * fadeSpeed);
      
      if (materialRef.current) {
        materialRef.current.opacity = opacityRef.current;
      }

      if (opacityRef.current === 0) {
        shouldFadeRef.current = false;
        setLoadingFade(false);
      }
    }
  });

  // Only render if opacity is greater than 0
  if (opacityRef.current <= 0) {
    return null;
  }

  return (
    <mesh position={[5, 2, 6]}>
      <planeGeometry args={[10, 10]} />
      <meshBasicMaterial 
        ref={materialRef} 
        color="black" 
        side={2} 
        transparent 
        opacity={opacityRef.current} 
      />
    </mesh>
  );
}