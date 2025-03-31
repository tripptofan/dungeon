import React, { useRef, useState, useMemo } from "react";
import { useLoader, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import useGameStore from "../store";
import { gsap } from "gsap";

const Door = ({ position, tileSize }) => {
  const doorRef = useRef();
  const wallRef = useRef();
  const [isOpen, setIsOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  
  // Load the wall texture - same as used in the Wall component
  const wallTexture = useLoader(THREE.TextureLoader, "/textures/dungeonWallTexture.png");
  
  // Set texture properties once - optimize with useMemo
  useMemo(() => {
    // Configure texture wrapping and repeat
    wallTexture.wrapS = wallTexture.wrapT = THREE.RepeatWrapping;
    wallTexture.repeat.set(1, 1);
    
    // Optionally set additional texture properties
    wallTexture.colorSpace = THREE.SRGBColorSpace;
    wallTexture.minFilter = THREE.LinearMipmapLinearFilter;
    wallTexture.magFilter = THREE.LinearFilter;
  }, [wallTexture]);
  
  // Dimensions for the door
  const doorWidth = tileSize * 0.6;
  const doorHeight = tileSize * 0.8;
  const doorThickness = tileSize / 5;  // 1/5 of tileSize as specified
  
  // Function to handle door opening animation
  const toggleDoor = () => {
    if (isAnimating) return;
    
    setIsAnimating(true);
    
    const timeline = gsap.timeline({
      onComplete: () => {
        setIsOpen(!isOpen);
        setIsAnimating(false);
      }
    });
    
    if (!isOpen) {
      // Opening animation
      timeline.to(doorRef.current.rotation, {
        y: Math.PI / 2,  // 90 degrees in radians
        duration: 1,
        ease: "power2.out"
      });
    } else {
      // Closing animation
      timeline.to(doorRef.current.rotation, {
        y: 0,
        duration: 1,
        ease: "power2.in"
      });
    }
  };
  
  // Check if player is close to the door
  useFrame(() => {
    if (!doorRef.current) return;
    
    const playerPosition = useGameStore.getState().playerPosition;
    const doorPosition = new THREE.Vector3(position[0], position[1], position[2]);
    
    // Calculate distance between player and door
    const distance = doorPosition.distanceTo(new THREE.Vector3(playerPosition.x, playerPosition.y, playerPosition.z));
    
    // Open door automatically if player is within range
    if (distance < tileSize * 1.5 && !isOpen && !isAnimating) {
      toggleDoor();
    }
  });
  
  return (
    <group position={position}>
      {/* Complete wall with door cutout */}
      <group ref={wallRef}>
        {/* Main wall - full size to ensure it connects with adjacent walls */}
        <mesh>
          <boxGeometry args={[tileSize, tileSize, doorThickness]} />
          <meshStandardMaterial map={wallTexture} roughness={0.8} metalness={0.2} />
        </mesh>
        
        {/* Cutout for the door (negative space) - we'll use a slightly darker material for the door frame */}
        <mesh position={[0, 0, doorThickness/2 + 0.01]}>
          <boxGeometry args={[doorWidth, doorHeight, doorThickness + 0.1]} />
          <meshStandardMaterial color="#333333" roughness={0.9} metalness={0.1} />
        </mesh>
      </group>
      
      {/* Door (will be animated to open/close) */}
      <group 
        ref={doorRef} 
        position={[-(doorWidth/2), doorHeight/2, 0]} // Position at the bottom edge, centered vertically
        onClick={toggleDoor}
      >
        <mesh position={[doorWidth/2, 0, 0]}>
          <boxGeometry args={[doorWidth, doorHeight, doorThickness/2]} />
          <meshStandardMaterial color="red" roughness={0.7} metalness={0.3} />
        </mesh>
        
        {/* Door handle */}
        <mesh position={[doorWidth - 0.5, 0, doorThickness/2 + 0.1]}>
          <sphereGeometry args={[0.15, 16, 16]} />
          <meshStandardMaterial color="gold" metalness={0.8} roughness={0.2} />
        </mesh>
      </group>
    </group>
  );
};

export default React.memo(Door);