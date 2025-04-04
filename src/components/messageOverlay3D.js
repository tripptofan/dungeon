import React, { useRef, useEffect, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import useGameStore from '../store';
import MessageService from '../utils/messageService';

const MessageOverlay3D = () => {
  const { camera, size } = useThree();
  const groupRef = useRef();
  const backgroundPlaneRef = useRef();
  const textPlaneRef = useRef();
  const blockingPlaneRef = useRef();
  const textCanvasRef = useRef(document.createElement('canvas'));
  const textTextureRef = useRef();
  const [planeWidth, setPlaneWidth] = useState(4);
  const [planeHeight, setPlaneHeight] = useState(2);
  
  // Track for click-to-dismiss functionality
  const pointerDownTimeRef = useRef(0);
  const pointerDownPositionRef = useRef({ x: 0, y: 0 });
  const isDraggingRef = useRef(false);
  const textCompletedRef = useRef(false);
  
  // Animation tracking
  const animationStartTimeRef = useRef(0);
  const initialFloatPositionRef = useRef(null);
  const floatPhaseRef = useRef(Math.random() * Math.PI * 2); // Random starting phase
  const textTypingTimerRef = useRef(null);
  const [opacity, setOpacity] = useState(0);
  const [displayedText, setDisplayedText] = useState('');
  const [shouldRender, setShouldRender] = useState(true); // NEW: Control whether component renders at all
  
  // Store the initial plane position in "body forward" direction
  const initialPositionRef = useRef(null);
  const hasSetInitialPosition = useRef(false);
  
  // Track fade state for proper enabling of clicks
  const fadeOutCompleteRef = useRef(true);
  const isFadingOutRef = useRef(false);
  const dismissTimerRef = useRef(null); // Track dismiss timer for cleanup

  // Adjust plane size based on screen width
  useEffect(() => {
    const aspectRatio = size.width / size.height;
    
    // Calculate a much narrower width to ensure visible gaps at the sides
    const baseWidth = Math.min(Math.max(1.8 * aspectRatio, 2), 3);
    
    // Increase the margin for better fit
    const marginFactor = 0.5; // 20% margin on each side
    const newWidth = baseWidth * marginFactor;
    
    // Keep the height proportional but slightly taller for better text display
    const newHeight = newWidth * 1.4;
    
    setPlaneWidth(newWidth);
    setPlaneHeight(newHeight);
  }, [size.width, size.height]);

  // Get state from the store
  const showMessageOverlay = useGameStore(state => state.showMessageOverlay);
  const currentMessage = useGameStore(state => state.currentMessage);
  const progressExperience = useGameStore(state => state.progressExperience);
  const typingInProgress = useGameStore(state => state.typingInProgress);
  
  // Function to enable interactions after fade-out is complete
// Function to enable interactions after fade-out is complete
const enableInteractions = () => {
    // Get the current experience to check its type
    const state = useGameStore.getState();
    const currentExperienceIndex = state.currentExperienceIndex;
    const experience = currentExperienceIndex >= 0 && 
                      currentExperienceIndex < state.experienceScript.experiences.length 
      ? state.experienceScript.experiences[currentExperienceIndex] 
      : null;
      
    // Enable item clicks
    useGameStore.getState().setBlockItemClicks(false);
    console.log("Message overlay fade-out complete - interactions now enabled");

    // Handle different experience types
    if (experience?.type === 'item') {
      // For item experiences, make the item clickable
      useGameStore.getState().setItemAnimationPhase('clickable');
      console.log("Fade-out complete - item animation phase set to clickable");
    } 
    else if (experience?.type === 'enemy') {
      // For enemy experiences, make the enemy clickable
      useGameStore.getState().setEnemyClickable(true);
      console.log("Fade-out complete - enemy is now clickable");
    }
    else if (experience?.type === 'chest') {
      // For chest experiences, nothing special needed
      console.log("Fade-out complete - chest is now clickable");
    }
    else if (currentExperienceIndex === -1) {
      // This was the prologue - show move forward button
      console.log("Prologue complete - showing move forward button");
      // FIXED: Use setShowActionOverlay with parameters instead of individual action setters
      useGameStore.getState().setShowActionOverlay(true, 'move', 'forward');
    }
    else if (experience?.type === 'shake') {
      // After shake message, show move forward button
      console.log("Shake message complete - showing move forward button");
      // FIXED: Use setShowActionOverlay with parameters instead of individual action setters
      useGameStore.getState().setShowActionOverlay(true, 'move', 'forward');
    }
  };
  
  // Function to explicitly block clicks on items when overlay is active
  useEffect(() => {
    if (showMessageOverlay) {
      // Block item clicks when overlay is showing
      useGameStore.getState().setBlockItemClicks(true);
      useGameStore.getState().setItemAnimationPhase('hidden');
      fadeOutCompleteRef.current = false;
      isFadingOutRef.current = false;
      setShouldRender(true); // Ensure the component is rendered when overlay should show
      
      console.log("Message overlay visible - blocking item clicks");
    } else if (!fadeOutCompleteRef.current) {
      // Keep blocking clicks during the fade-out
      isFadingOutRef.current = true;
      console.log("Message overlay fading out - still blocking item clicks");
    }
    
    // Cleanup on unmount - ensure clicks are unblocked
    return () => {
      if (dismissTimerRef.current) {
        clearTimeout(dismissTimerRef.current);
        dismissTimerRef.current = null;
      }
      
      if (!fadeOutCompleteRef.current) {
        // Just in case the component unmounts during a fade, ensure interactions are enabled
        enableInteractions();
        fadeOutCompleteRef.current = true;
      }
    };
  }, [showMessageOverlay]);
  
  // Handle all animations when overlay appears or disappears
  useEffect(() => {
    // Clean up any existing animations
    if (textTypingTimerRef.current) {
      clearInterval(textTypingTimerRef.current);
      textTypingTimerRef.current = null;
    }
    
    if (dismissTimerRef.current) {
      clearTimeout(dismissTimerRef.current);
      dismissTimerRef.current = null;
    }
    
    if (showMessageOverlay) {
      // Reset all animation state
      setOpacity(0);
      setDisplayedText('');
      textCompletedRef.current = false;
      hasSetInitialPosition.current = false;
      floatPhaseRef.current = Math.random() * Math.PI * 2;
      animationStartTimeRef.current = performance.now();
      setShouldRender(true); // Ensure we're rendering when showing the overlay
      
      // Start the typing animation
      if (currentMessage) {
        // Use a ref to keep track of the current index
        const textIndexRef = { current: 0 };
        
        // Set up the typing interval
        textTypingTimerRef.current = setInterval(() => {
          if (textIndexRef.current < currentMessage.length) {
            // Update displayed text
            const newText = currentMessage.substring(0, textIndexRef.current + 1);
            setDisplayedText(newText);
            textIndexRef.current++;
          } else {
            // Text is complete, mark as completed and clear the interval
            textCompletedRef.current = true;
            clearInterval(textTypingTimerRef.current);
            textTypingTimerRef.current = null;
            // Tell the store typing is done
            useGameStore.getState().setTypingInProgress(false);
          }
        }, 40);
      }
    } else {
      // Mark as fading out
      isFadingOutRef.current = true;
    }
    
    // Clean up on unmount or when overlay state changes
    return () => {
      if (textTypingTimerRef.current) {
        clearInterval(textTypingTimerRef.current);
        textTypingTimerRef.current = null;
      }
      
      if (dismissTimerRef.current) {
        clearTimeout(dismissTimerRef.current);
        dismissTimerRef.current = null;
      }
    };
  }, [showMessageOverlay, currentMessage]);

  // Create canvas texture for text rendering
  useEffect(() => {
    const canvas = textCanvasRef.current;
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    
    // Clear canvas with full transparency
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Add substantial padding around the entire canvas to prevent text clipping
    const padding = 80; // Significantly increase padding around text content
    
    // Prepare text rendering with properly sized font
    ctx.font = 'bold 72px Arial'; // Slightly smaller font for even better fit
    ctx.fillStyle = 'black';
    ctx.textAlign = 'center'; // Keep center alignment for horizontal positioning
    ctx.textBaseline = 'middle'; // Middle alignment for vertical positioning
    
    // Wrap text logic with improved text sizing and spacing
    const wrapText = (text, x, y, maxWidth, lineHeight) => {
      if (!text || text.length === 0) return; // Guard against empty text
      
      const words = text.split(' ');
      let line = '';
      let yOffset = y;
      let lines = [];
      
      words.forEach((word) => {
        const testLine = line + word + ' ';
        const metrics = ctx.measureText(testLine);
        
        if (metrics.width > maxWidth && line !== '') {
          lines.push(line);
          line = word + ' ';
          yOffset += lineHeight;
        } else {
          line = testLine;
        }
      });
      
      // Add the last line
      if (line.length > 0) {
        lines.push(line);
      }
      
      // Render lines centered vertically
      const totalHeight = lines.length * lineHeight;
      const startY = y - totalHeight / 2;
      
      lines.forEach((l, index) => {
        // Ensure each line is drawn with proper spacing
        const lineY = startY + index * lineHeight;
        
        // Draw the text - centered horizontally
        ctx.fillText(l, x, lineY);
      });
    };
    
    // Use a narrower width to ensure text has plenty of room at the edges
    wrapText(displayedText, canvas.width / 2, canvas.height / 2, 1000, 55);
    
    // Create or update texture
    if (!textTextureRef.current) {
      textTextureRef.current = new THREE.CanvasTexture(canvas);
      textTextureRef.current.premultiplyAlpha = true; // Preserve alpha
      // Set proper texture properties to avoid clipping
      textTextureRef.current.wrapS = THREE.ClampToEdgeWrapping;
      textTextureRef.current.wrapT = THREE.ClampToEdgeWrapping;
    } else {
      textTextureRef.current.needsUpdate = true;
    }
  }, [displayedText]);

  // Handle all animated effects in a single frame update
  useFrame((state, delta) => {
    if (!groupRef.current) return;
    
    if (showMessageOverlay) {
      // --- Handle position and floating ---
      
      // Only set initial position once when the overlay becomes visible
      if (!hasSetInitialPosition.current) {
        // Get player's position - this is the "body" position
        const playerPosition = useGameStore.getState().playerPosition;
        
        // Calculate position in front of the player's body
        const overlayDistance = 1.5; // Distance in front of the player
        const overlayPosition = new THREE.Vector3(
          playerPosition.x,
          playerPosition.y,
          playerPosition.z + overlayDistance // Assuming player faces negative Z
        );
        
        initialPositionRef.current = overlayPosition.clone();
        initialFloatPositionRef.current = overlayPosition.clone();
        hasSetInitialPosition.current = true;
        
        // Set initial position to the group
        groupRef.current.position.copy(initialPositionRef.current);
      }
      
      // --- Handle fade-in and floating animation ---
      
      // Calculate animation elapsed time
      const elapsedMs = performance.now() - animationStartTimeRef.current;
      const elapsedSeconds = elapsedMs / 1000;
      
      // Fade-in duration and progress (0-1)
      const fadeInDuration = 0.4; // seconds
      const fadeProgress = Math.min(elapsedSeconds / fadeInDuration, 1);
      
      // Use easeOutCubic for fade-in
      const fadeEaseProgress = 1 - Math.pow(1 - fadeProgress, 3);
      
      // Update opacity
      const newOpacity = fadeEaseProgress * 0.9; // Target max opacity of 0.9
      setOpacity(newOpacity);
      
      // Update floating animation
      floatPhaseRef.current += delta * 0.3; // Slow speed for gentle movement
      
      // Calculate very subtle offsets
      const yOffset = Math.sin(floatPhaseRef.current) * 0.04; // Vertical bobbing
      const xOffset = Math.cos(floatPhaseRef.current * 0.63) * 0.02; // Slight horizontal drift
      const rotationOffset = Math.sin(floatPhaseRef.current * 0.4) * 0.005; // Very subtle rotation
      
      // Apply floating animation with smooth fade-in
      if (initialFloatPositionRef.current) {
        // Apply position with proportional floating effect
        groupRef.current.position.copy(initialFloatPositionRef.current);
        groupRef.current.position.y += yOffset * fadeEaseProgress;
        groupRef.current.position.x += xOffset * fadeEaseProgress;
        
        // Apply subtle rotation effect
        groupRef.current.rotation.z = rotationOffset * fadeEaseProgress;
      }
    } 
    else if (isFadingOutRef.current && opacity > 0) {
      // --- Handle fade-out ---
      
      // MUCH FASTER fade-out (100ms)
      const fadeOutSpeed = 0.1 / 0.1; // 0.1 opacity per 0.1 seconds
      const newOpacity = Math.max(0, opacity - fadeOutSpeed * delta);
      setOpacity(newOpacity);
      
      // Check if fade-out is complete
      if (newOpacity <= 0.01) {
        // Fade-out is complete
        if (!fadeOutCompleteRef.current) {
          // Clear any existing timeout
          if (dismissTimerRef.current) {
            clearTimeout(dismissTimerRef.current);
          }
          
          // Mark fade as complete immediately
          fadeOutCompleteRef.current = true;
          isFadingOutRef.current = false;
          
          // Set up a new timeout to handle post-fade interactions
          dismissTimerRef.current = setTimeout(() => {
            // Enable interactions
            enableInteractions();
            
            // Remove the overlay completely from the scene
            setShouldRender(false);
            console.log("Overlay completely removed from scene after fade-out");
          }, 100); // Short delay to ensure opacity update is applied
        }
      }
    }
    
    // Always make the group face the camera
    if (groupRef.current) {
      groupRef.current.lookAt(camera.position);
    }
    
    // Apply the current opacity to materials
    if (backgroundPlaneRef.current?.material) {
      backgroundPlaneRef.current.material.opacity = opacity;
    }
    
    if (textPlaneRef.current?.material) {
      textPlaneRef.current.material.opacity = opacity;
    }
  });
  
  // Shared click handlers for all mesh elements
  const handlePointerDown = (e) => {
    e.stopPropagation();
    
    // Record time and position for click detection
    pointerDownTimeRef.current = performance.now();
    pointerDownPositionRef.current = { x: e.point.x, y: e.point.z };
    isDraggingRef.current = false;
  };
  
  const handlePointerMove = (e) => {
    e.stopPropagation();
    
    // Check if we've moved beyond a small threshold to consider it a drag
    if (pointerDownTimeRef.current > 0) {
      const dx = e.point.x - pointerDownPositionRef.current.x;
      const dy = e.point.z - pointerDownPositionRef.current.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // If moved more than a small threshold, consider it a drag
      if (distance > 0.05) {
        isDraggingRef.current = true;
      }
    }
  };
  
  const handlePointerUp = (e) => {
    e.stopPropagation();
    
    // Only process if this was a click (not a drag)
    const clickDuration = performance.now() - pointerDownTimeRef.current;
    
    if (clickDuration < 300 && !isDraggingRef.current) {
      // This was a click, handle based on text state
      
      // If typing is still in progress, instantly complete it
      if (typingInProgress) {
        console.log("Text typing in progress, completing text");
        
        // Stop the typing animation
        if (textTypingTimerRef.current) {
          clearInterval(textTypingTimerRef.current);
          textTypingTimerRef.current = null;
        }
        
        // Set the full text immediately
        setDisplayedText(currentMessage);
        
        // Mark text as completed
        textCompletedRef.current = true;
        
        // Tell the store typing is done
        useGameStore.getState().setTypingInProgress(false);
      } 
      // Only dismiss if the text is already completed
      else if (textCompletedRef.current) {
        console.log("Text completed, dismissing overlay");
        
        // Set fading out state before progressing the experience
        isFadingOutRef.current = true;
        fadeOutCompleteRef.current = false;
        
        // Progress to next experience (dismiss)
        progressExperience();
      }
    }
    
    // Reset state
    pointerDownTimeRef.current = 0;
    isDraggingRef.current = false;
  };
  
  // Don't render if:
  // 1. The overlay shouldn't be shown (showMessageOverlay is false)
  // 2. The component is marked as not needing to render (shouldRender is false)
  // 3. The overlay has completely faded out (opacity <= 0.01)
  if ((!showMessageOverlay && !isFadingOutRef.current) || !shouldRender || (!showMessageOverlay && opacity <= 0.01)) {
    return null;
  }
  
  return (
    <group ref={groupRef}>
      {/* Blocking plane - large enough to catch all clicks but not disrupt raycasting elsewhere */}
      <mesh
        ref={blockingPlaneRef}
        renderOrder={9998}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        position={[0, 0, -0.015]}
      >
        {/* Use a large plane to block clicks in the message area */}
        <planeGeometry args={[planeWidth * 5, planeHeight * 5]} />
        <meshBasicMaterial 
          color="white"
          transparent={true}
          opacity={0.001} // Nearly invisible but still blocks raycasts
          side={THREE.DoubleSide}
          depthTest={false}
        />
      </mesh>
      
      {/* Background Plane - Semi-transparent, emissive, and clickable */}
      <mesh 
        ref={backgroundPlaneRef} 
        renderOrder={10000}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        <planeGeometry args={[planeWidth, planeHeight]} />
        <meshStandardMaterial 
          color="white"
          emissive="white"
          emissiveIntensity={0.9}
          transparent={true}
          opacity={opacity}
          side={THREE.DoubleSide}
          depthTest={false} // Ensure it renders on top of other objects
        />
      </mesh>

      {/* Text Plane - Transparent with text */}
      <mesh 
        ref={textPlaneRef} 
        renderOrder={10001}
        position={[0, 0, 0.01]} // Slightly in front to avoid z-fighting
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        <planeGeometry args={[planeWidth - 0.2, planeHeight - 0.2]} /> {/* Even smaller for better margin */}
        <meshBasicMaterial 
          map={textTextureRef.current}
          transparent={true}
          opacity={opacity}
          side={THREE.DoubleSide}
          depthTest={false} // Ensure it renders on top of other objects
        />
      </mesh>
    </group>
  );
};

export default React.memo(MessageOverlay3D);