import React, { useRef, useEffect, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import useGameStore from '../store';
import MessageService from '../utils/messageService';

const MessageOverlay3D = () => {
  const { camera, size, clock } = useThree();
  const groupRef = useRef();
  const boxRef = useRef();
  const boxWireframeRef = useRef();
  const textPlaneRef = useRef();
  const textCanvasRef = useRef(document.createElement('canvas'));
  const textTextureRef = useRef();
  const [planeWidth, setPlaneWidth] = useState(4);
  const [planeHeight, setPlaneHeight] = useState(2);
  const boxDepth = 0.2; // Shallow box depth
  
  // Get render order constants from store
  const renderOrder = useGameStore(state => state.renderOrder);
  
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
  
  // Store the initial plane position in "body forward" direction
  const initialPositionRef = useRef(null);
  const hasSetInitialPosition = useRef(false);

  // Add fade-in animation for the overlay and its light

  // First, add a ref for the point light
  const lightRef = useRef();

  // Add state to track light intensity (initial 0)
  const [lightIntensity, setLightIntensity] = useState(0);

  // Adjust plane size based on screen width
  useEffect(() => {
    const aspectRatio = size.width / size.height;
    
    // Calculate a much narrower width to ensure visible gaps at the sides
    const baseWidth = Math.min(Math.max(1.5 * aspectRatio, 2.4), 2.5); // Reduced base width range
    
    // Further reduce width with a smaller scale factor
    const marginFactor = 0.4; // Reduced from 0.5 to 0.4 (40% of baseWidth)
    const newWidth = baseWidth * marginFactor;
    
    // Keep the height proportional but slightly taller for better text display
    const newHeight = newWidth * 1.5; // Increased height ratio for better text visibility
    
    setPlaneWidth(newWidth);
    setPlaneHeight(newHeight);
  }, [size.width, size.height]);

  // Get state from the store
  const showMessageOverlay = useGameStore(state => state.showMessageOverlay);
  const currentMessage = useGameStore(state => state.currentMessage);
  const progressExperience = useGameStore(state => state.progressExperience);
  const typingInProgress = useGameStore(state => state.typingInProgress);
  
  // Handle all animations when overlay appears or disappears
  useEffect(() => {
    // Clean up any existing animations
    if (textTypingTimerRef.current) {
      clearInterval(textTypingTimerRef.current);
      textTypingTimerRef.current = null;
    }
    
    if (showMessageOverlay) {
      // Reset all animation state
      setOpacity(0); // Start at 0 opacity
      setLightIntensity(0); // Start with light off
      setDisplayedText('');
      textCompletedRef.current = false;
      hasSetInitialPosition.current = false;
      floatPhaseRef.current = Math.random() * Math.PI * 2;
      animationStartTimeRef.current = performance.now();
      
      // Start the typing animation, but don't use setState inside setInterval
      // to avoid potential conflicts with the fade animation
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
      // Fast fade-out animation handled in the useFrame hook
    }
    
    // Clean up on unmount or when overlay state changes
    return () => {
      if (textTypingTimerRef.current) {
        clearInterval(textTypingTimerRef.current);
        textTypingTimerRef.current = null;
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
      const fadeInDuration = 0.8; // Increased from 0.4 to 0.8 seconds
      const fadeProgress = Math.min(elapsedSeconds / fadeInDuration, 1);
      
      // Use easeOutCubic for fade-in
      const fadeEaseProgress = 1 - Math.pow(1 - fadeProgress, 3);
      
      // Update opacity
      const newOpacity = fadeEaseProgress * 0.9; // Target max opacity of 0.9
      setOpacity(newOpacity);
      
      // Update light intensity (target max intensity is 4)
      const newLightIntensity = fadeEaseProgress * 4;
      setLightIntensity(newLightIntensity);
      
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
    else if (opacity > 0) {
      // --- Handle fade-out ---
      
      // Fast fade-out (100ms)
      const fadeOutSpeed = 0.1 / 0.1; // 0.1 opacity per 0.1 seconds
      setOpacity(Math.max(0, opacity - fadeOutSpeed * delta));
      
      // Also fade out the light
      setLightIntensity(Math.max(0, lightIntensity - fadeOutSpeed * 4 * delta));
    }
    
    // Always make the group face the camera
    if (groupRef.current) {
      groupRef.current.lookAt(camera.position);
    }
    
    // Apply the current opacity to materials
    if (boxRef.current?.material) {
      boxRef.current.material.opacity = opacity * 0.6; // Make the fill slightly more transparent
    }

    if (boxWireframeRef.current?.material) {
      boxWireframeRef.current.material.opacity = opacity;
    }
    
    if (textPlaneRef.current?.material) {
      textPlaneRef.current.material.opacity = opacity;
    }
    
    // Apply current light intensity to the point light
    if (lightRef.current) {
      lightRef.current.intensity = lightIntensity;
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
        // Progress to next experience (dismiss)
        progressExperience();
      }
    }
    
    // Reset state
    pointerDownTimeRef.current = 0;
    isDraggingRef.current = false;
  };
  
  // Don't render if no overlay or completely faded out
  if (!showMessageOverlay && opacity <= 0.01) return null;
  
  return (
    <group ref={groupRef}>
      {/* Point light */}
      <pointLight 
        ref={lightRef}
        position={[0, 0, 1]}
        intensity={lightIntensity}
        distance={4}
        decay={2}
        color="#ffffff"
        castShadow={true}
      />
      
      {/* Main background box - REVISED for better transparency */}
      <mesh 
        ref={boxRef} 
        renderOrder={renderOrder.MESSAGE_OVERLAY}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        castShadow={true}
        receiveShadow={true}
      >
        <boxGeometry args={[planeWidth, planeHeight, boxDepth]} />
        <meshPhysicalMaterial 
          color="#f8f8f8"
          transparent={true}
          opacity={0.7}
          roughness={0.4}
          metalness={0.05}
          transmission={0.6}      // RESTORED: Increased transparency to allow eyes/enemy to be seen
          side={THREE.DoubleSide}
          depthTest={true}        // Keep depth test enabled 
          depthWrite={false}      // RESTORED: Disable depth writing to allow objects to be visible
          clearcoat={0.5}
          clearcoatRoughness={0.3}
        />
      </mesh>
      
      {/* Wireframe to show the 3D structure - REVISED for better transparency */}
      <mesh
        ref={boxWireframeRef}
        renderOrder={renderOrder.MESSAGE_OVERLAY + 1}
      >
        <boxGeometry args={[planeWidth, planeHeight, boxDepth]} />
        <meshPhongMaterial
          color="yellow"
          wireframe={true}
          transparent={true}
          opacity={0.6}         // Reduced from 0.8
          emissive="yellow"
          emissiveIntensity={0.6}
          shininess={100}
          depthTest={true}      // Keep depth test enabled
          depthWrite={false}    // RESTORED: Disable depth writing to allow objects to be visible
        />
      </mesh>

      {/* Text Plane - Only on front face */}
      <mesh 
        ref={textPlaneRef} 
        renderOrder={renderOrder.MESSAGE_OVERLAY + 2}
        position={[0, 0, boxDepth/2 + 0.001]}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        <planeGeometry args={[planeWidth - 0.3, planeHeight - 0.3]} />
        <meshBasicMaterial 
          map={textTextureRef.current}
          transparent={true}
          opacity={opacity}
          side={THREE.FrontSide}
          depthTest={true}      // Keep depth test enabled
          depthWrite={false}    // Keep depth writing disabled for text overlay
        />
      </mesh>
      
      {/* Add a very subtle background plane behind the text for better readability 
           while still allowing objects to be visible through the main box */}
      <mesh
        renderOrder={renderOrder.MESSAGE_OVERLAY + 1}
        position={[0, 0, boxDepth/2 - 0.001]}
      >
        <planeGeometry args={[planeWidth - 0.1, planeHeight - 0.1]} />
        <meshBasicMaterial
          color="#ffffff"
          transparent={true}
          opacity={0.4}         // Very subtle opacity
          side={THREE.FrontSide}
          depthTest={true}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
};

export default React.memo(MessageOverlay3D);