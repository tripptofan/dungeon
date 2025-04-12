import React, { useRef, useState, useEffect, memo } from 'react';
import { useFrame } from '@react-three/fiber';
import useGameStore from '../store';
import MessageService from '../utils/messageService';

// Static array to store refs to chest for outlining (similar to other items)
export const treasureChestRefs = [];

// Component that renders a treasure chest as the final reward
const TreasureChest = () => {
  const chestRef = useRef();
  // Removed hover state
  const messageSentRef = useRef(false);
  const initializedRef = useRef(false);
  const chestPositionRef = useRef({ x: 5, z: 86 });

  const [opacity, setOpacity] = useState(1.0);
  const [isFading, setIsFading] = useState(false);
  const fadeStartRef = useRef(null);
  const prizeState = useGameStore(state => state.prizeState);
  
  useEffect(() => {
    // Start fading when prize is acquired (removed from scene)
    if (prizeState === 'acquired' && !isFading) {
      console.log("Prize acquired, starting chest fade animation");
      setIsFading(true);
      fadeStartRef.current = performance.now();
    }
  }, [prizeState, isFading]);
  
  // Track overlay dismissal to improve click handling
  const [lastOverlayState, setLastOverlayState] = useState(false);
  const [overlayJustDismissed, setOverlayJustDismissed] = useState(false);
  
  // Get relevant state from the store
  const currentExperienceIndex = useGameStore(state => state.currentExperienceIndex);
  const experiences = useGameStore(state => state.experienceScript.experiences);
  const showMessageOverlay = useGameStore(state => state.showMessageOverlay);
  const chestOpened = useGameStore(state => state.chestOpened);
  const isMovingCamera = useGameStore(state => state.isMovingCamera);
  
  // Get actions from store
  const setChestOpened = useGameStore(state => state.setChestOpened);
  
  // Initialize chest position once on mount
  useEffect(() => {
    if (!initializedRef.current) {
      // Find chest experience
      const chestExp = experiences.find(exp => exp.type === 'chest');
      
      // If chest experience is defined, use its position
      if (chestExp) {
        chestPositionRef.current = {
          x: chestExp.position.x,
          z: chestExp.position.z + 4 // 3 units in front of where player will stop
        };
      }
      
      initializedRef.current = true;
    }
  }, [experiences]);
  
  // Add ref to the static array when mounted, remove when unmounted
  useEffect(() => {
    if (chestRef.current) {
      treasureChestRefs.push(chestRef.current);
      console.log(`Added treasure chest to outline list, total: ${treasureChestRefs.length}`);
    }
    
    return () => {
      const index = treasureChestRefs.indexOf(chestRef.current);
      if (index !== -1) {
        treasureChestRefs.splice(index, 1);
        console.log(`Removed treasure chest from outline list, remaining: ${treasureChestRefs.length}`);
      }
    };
  }, []);

  // FIX: Track overlay state changes to detect dismissal
  useEffect(() => {
    // If overlay was showing, and now it's not, mark as just dismissed
    if (lastOverlayState && !showMessageOverlay) {
      console.log("Overlay just dismissed, marking chest as ready for interaction");
      setOverlayJustDismissed(true);
      
      // Reset after a short delay
      const timer = setTimeout(() => {
        setOverlayJustDismissed(false);
      }, 500); // Allow 500ms window for click after dismissal
      
      return () => clearTimeout(timer);
    }
    
    // Update the last overlay state
    setLastOverlayState(showMessageOverlay);
  }, [showMessageOverlay, lastOverlayState]);
  
  // Show "a reward for the hero..." message when chest experience starts
  // ONLY when the player has stopped moving
  useEffect(() => {
    // Check if this is the chest experience and player is not moving
    const isChestExperience = currentExperienceIndex === 5 && 
      experiences[currentExperienceIndex]?.type === 'chest';
      
    if (isChestExperience && !chestOpened && !messageSentRef.current && !isMovingCamera) {
      // Wait a short delay after the player stops to show the message
      // This ensures player has come to a complete stop
      const timer = setTimeout(() => {
        // Double-check that we're still in the chest experience and not moving
        if (currentExperienceIndex === 5 && !isMovingCamera) {
          // Mark message as sent to prevent repeated messages
          messageSentRef.current = true;
          
          // Use the MessageService to show the chest message
          MessageService.showChestMessage();
        }
      }, 800); // Slightly longer delay for better timing
      
      return () => clearTimeout(timer);
    }
  }, [
    currentExperienceIndex, 
    experiences, 
    chestOpened, 
    isMovingCamera
  ]);
  
  // FIX: Improved chest click handling to properly sequence with message
  const handleChestClick = (e) => {
    e.stopPropagation();
    
    // Determine if chest is currently interactive
    const isChestExperience = currentExperienceIndex === 5 && 
      experiences[currentExperienceIndex]?.type === 'chest';
    
    // FIX: Only make chest interactive if:
    // 1. It's the chest experience
    // 2. The chest hasn't been opened yet
    // 3. The welcome message has been shown (messageSentRef.current is true)
    // 4. Either: the message overlay is not showing OR it was just dismissed
    const isMessageShown = messageSentRef.current;
    const isInteractive = isChestExperience && !chestOpened && isMessageShown &&
                        (!showMessageOverlay || overlayJustDismissed);
    
    console.log("Chest clicked, interactive:", isInteractive, 
                "Message shown:", isMessageShown,
                "Overlay dismissed:", overlayJustDismissed);
    
    if (isInteractive) {
      console.log("Chest click is valid! Opening...");
      setChestOpened(true);
    } else if (isChestExperience && !isMessageShown) {
      console.log("Chest clicked too early! Wait for the welcome message.");
    }
  };
  
  // Simplified useFrame - just ensure chest position is correct and handle fade animation
  useFrame(() => {
    if (!chestRef.current) return;
    
    if (chestRef.current && chestRef.current.position.y !== 0.5) {
      chestRef.current.position.y = 0.5;
    }
    
    // Handle fade animation if active
    if (isFading) {
      const elapsed = performance.now() - fadeStartRef.current;
      const fadeDuration = 1500; // 1.5 seconds
      
      // Calculate new opacity
      const newOpacity = Math.max(0, 1 - (elapsed / fadeDuration));
      setOpacity(newOpacity);
      
      // Apply opacity to all child materials
      chestRef.current.traverse(child => {
        if (child.isMesh && child.material) {
          child.material.transparent = true;
          child.material.opacity = newOpacity;
        }
      });
      
      // Remove chest when fully transparent
      if (newOpacity <= 0) {
        chestRef.current.visible = false;
        
        // Set door as clickable after chest fades out
        useGameStore.getState().setDoorClickable(true);
        console.log("Chest faded out, door is now clickable!");
      }
    }
  });
  
  // Determine if chest is currently interactive - computed value
  const isChestExperience = currentExperienceIndex === 5 && 
    experiences[currentExperienceIndex]?.type === 'chest';
  const isMessageShown = messageSentRef.current;
  const isInteractive = isChestExperience && !showMessageOverlay && !chestOpened && isMessageShown;
  
  // Removed glow effect based on hover
  // Using a constant glow intensity instead
  const glowIntensity = 0.3;
  
  return (
    <group 
      ref={chestRef}
      position={[chestPositionRef.current.x, 0.5, chestPositionRef.current.z]}
      onClick={handleChestClick}
      // Removed hover handlers
      rotation={[0, Math.PI, 0]}
    >
      {/* Main chest body */}
      <mesh>
        <boxGeometry args={[2, 1, 1.2]} /> {/* Width, height, depth */}
        <meshStandardMaterial 
          color="#8B4513" // Brown wooden color
          roughness={0.7}
          metalness={0.3}
          emissive="#8B4513"
          emissiveIntensity={0.2}
          transparent={true}  // Add this line
          opacity={opacity}   // Add this line
        />
      </mesh>
      
      {/* Chest lid */}
      <mesh position={[0, 0.5, 0]}>
        <boxGeometry args={[2, 0.3, 1.2]} />
        <meshStandardMaterial 
          color="#A0522D" // Slightly different brown for contrast
          roughness={0.6}
          metalness={0.4}
          transparent={true}  // Add this line
          opacity={opacity}   // Add this line
        />
      </mesh>
      
      {/* Metal details/lock */}
      <mesh position={[0, 0.3, 0.6]}>
        <boxGeometry args={[0.4, 0.4, 0.1]} />
        <meshStandardMaterial 
          color="#FFD700" // Gold color
          roughness={0.3}
          metalness={0.8}
          emissive="#FFD700"
          emissiveIntensity={glowIntensity}
          transparent={true}  // Add this line
          opacity={opacity}   // Add this line
        />
      </mesh>
      
      {/* Add a light source to make the chest more visible */}
      <pointLight
        color="#FFD700"
        intensity={1.5}
        distance={5}
        decay={2}
        position={[0, 0.5, 0]}
      />
    </group>
  );
};

export default memo(TreasureChest);