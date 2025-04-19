import React, { useRef, useEffect, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import useGameStore from '../store';
import MessageService from '../utils/messageService';
import Eye from './eye';

const MessageOverlay3D = () => {
  const { camera, size, clock } = useThree();
  const groupRef = useRef();
  const textPlaneRef = useRef();
  const backingPlaneRef = useRef();
  const textCanvasRef = useRef(document.createElement('canvas'));
  const textTextureRef = useRef();
  const [planeWidth, setPlaneWidth] = useState(4);
  const [planeHeight, setPlaneHeight] = useState(2);
  
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

  // Add state to track light intensity (initial 0)
  const [lightIntensity, setLightIntensity] = useState(0);
  const lightRef = useRef();

  // Adjust plane size based on screen width
  useEffect(() => {
    const aspectRatio = size.width / size.height;
    
    // Calculate a narrower width as before
    const baseWidth = Math.min(Math.max(1.5 * aspectRatio, 2.4), 2.5);
    const marginFactor = 0.4; // 40% of baseWidth
    const newWidth = baseWidth * marginFactor;
    
    // Make the height MUCH shorter by reducing the height ratio significantly
    const newHeight = newWidth * 0.7; // Reduced from 1.2 to 0.7 for a much shorter overlay
    
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
    
    // Increase font size significantly
    ctx.font = 'bold 64px Arial'; // Increased from 52px to 64px for larger text
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Improved wrap text function that shows all text
    const wrapText = (text, x, y, maxWidth, lineHeight) => {
      if (!text || text.length === 0) return;
      
      const words = text.split(' ');
      let line = '';
      let lines = [];
      
      words.forEach((word) => {
        const testLine = line + word + ' ';
        const metrics = ctx.measureText(testLine);
        
        if (metrics.width > maxWidth && line !== '') {
          lines.push(line);
          line = word + ' ';
        } else {
          line = testLine;
        }
      });
      
      // Add the last line
      if (line.length > 0) {
        lines.push(line);
      }
      
      // Allow up to 3 lines without truncation - show ALL text
      // No truncation or ellipsis
      
      // Calculate total text height
      const totalHeight = lines.length * lineHeight;
      
      // Center text vertically with minimal padding
      const startY = y - (totalHeight / 2);
      
      // Render all lines
      lines.forEach((l, index) => {
        const lineY = startY + index * lineHeight;
        ctx.fillText(l, x, lineY);
      });
    };
    
    // Use more of the canvas width with less padding
    wrapText(displayedText, canvas.width / 2, canvas.height / 2, 800, 60); // Adjusted line height to 60 for larger font
    
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
        
        // Calculate position in front of the player's body but at a higher position
        const overlayDistance = 1.5; // Keep same distance in front of the player
        const overlayHeight = 0.0; // Changed from -0.2 to 0.0 to raise the overlay
        const overlayPosition = new THREE.Vector3(
          playerPosition.x,
          playerPosition.y + overlayHeight, // Higher position
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
      const fadeInDuration = 0.8; // 0.8 seconds
      const fadeProgress = Math.min(elapsedSeconds / fadeInDuration, 1);
      
      // Use easeOutCubic for fade-in
      const fadeEaseProgress = 1 - Math.pow(1 - fadeProgress, 3);
      
      // Update opacity - synchronized with the float animation
      const newOpacity = fadeEaseProgress;
      setOpacity(newOpacity);
      
      // Update light intensity
      const newLightIntensity = fadeEaseProgress * 5; // Increased from 4 to 5
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
      setLightIntensity(Math.max(0, lightIntensity - fadeOutSpeed * 3 * delta));
    }
    
    // Always make the group face the camera (y-axis rotation only)
    if (groupRef.current && camera) {
      // Get camera position in world space
      const cameraPosition = new THREE.Vector3();
      camera.getWorldPosition(cameraPosition);
      
      // Get overlay position
      const overlayPosition = new THREE.Vector3();
      groupRef.current.getWorldPosition(overlayPosition);
      
      // Calculate direction vector in the horizontal plane only (ignoring Y component)
      const direction = new THREE.Vector3();
      direction.subVectors(cameraPosition, overlayPosition);
      direction.y = 0; // Zero out the Y component to keep parallel to ground
      direction.normalize();
      
      // Calculate the angle in the XZ plane
      const angle = Math.atan2(direction.x, direction.z);
      
      // Apply rotation around Y axis only (keeping parallel to X and Z axes)
      groupRef.current.rotation.x = 0; // Lock X rotation (no tilting up/down)
      groupRef.current.rotation.y = angle; // Rotate around Y to face player horizontally
      
      // Keep the subtle Z rotation for the floating effect
      // (calculated earlier in the animation section)
      // groupRef.current.rotation.z remains as set in the floating animation
    }
    
    // Apply the current opacity to materials
    if (backingPlaneRef.current?.material) {
      backingPlaneRef.current.material.opacity = opacity * 0.8;
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

  // Calculate the eye size based on the plane width - make them smaller
  const eyeScale = [planeWidth * 0.07, planeWidth * 0.07]; // Reduced from 0.09 to 0.07 (about 22% smaller)
  
  return (
    <group ref={groupRef}>
      {/* Backing plane - using meshBasicMaterial with color only */}
      <mesh
        ref={backingPlaneRef}
        renderOrder={renderOrder.MESSAGE_OVERLAY}
        position={[0, 0, -0.005]}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        castShadow={false}
        receiveShadow={false}
      >
        <planeGeometry args={[planeWidth, planeHeight]} />
        <meshBasicMaterial
          color="#3a4a6a"  // Brightened from #2a3a5a to #3a4a6a
          transparent={true}
          opacity={0.8 * opacity}
          depthTest={true}
          depthWrite={false}
        />
      </mesh>

      {/* Emissive glow plane - sits just behind the backing plane to create glow effect */}
      <mesh
        renderOrder={renderOrder.MESSAGE_OVERLAY - 1}
        position={[0, 0, -0.008]}
        castShadow={false}
        receiveShadow={false}
      >
        <planeGeometry args={[planeWidth + 0.1, planeHeight + 0.1]} />
        <meshBasicMaterial
          color="#55aaff"  // Brightened from #4477ee to #55aaff
          transparent={true}
          opacity={0.6 * opacity} // Increased from 0.5 to 0.6 for even more glow
          depthTest={true}
          depthWrite={false}
        />
      </mesh>

      {/* Text Plane - reduced height to accommodate the eye */}
      <mesh 
        ref={textPlaneRef} 
        renderOrder={renderOrder.MESSAGE_OVERLAY + 1}
        position={[0, planeHeight * 0.15, 0]} // Move text up within the overlay
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        castShadow={false}
        receiveShadow={false}
      >
        <planeGeometry args={[planeWidth - 0.08, planeHeight - 0.15]} /> {/* Slightly less height to leave room at bottom */}
        <meshBasicMaterial 
          map={textTextureRef.current}
          transparent={true}
          opacity={opacity}
          side={THREE.FrontSide}
          depthTest={true}
          depthWrite={false}
        />
      </mesh>

      {/* Add the animated eye at the bottom of the message */}
      <group 
        position={[0, -planeHeight/2 + eyeScale[1], 0.01]} // Raised position by removing the divisor (was /1.5)
        renderOrder={renderOrder.MESSAGE_OVERLAY + 2} // Ensure it renders on top
      >
        {/* Use the Eye component with even smaller scale */}
        <Eye 
          position={[.2, .06, 0]} // Increased Y offset from .03 to .06 to raise further
          scale={[.2, .2]} // Reduced from .25 to .2 (20% smaller)
          rotation={[0, 0, 0]}
          opacity={opacity} // Already tied to the overlay opacity
          randomize={true} // Enable randomization for more natural movement
          float={false}
        />
        <Eye 
          position={[-.2, .06, 0]} // Increased Y offset from .03 to .06 to raise further
          scale={[.2, .2]} // Reduced from .25 to .2 (20% smaller)
          rotation={[0, 0, 0]}
          opacity={opacity} // Already tied to the overlay opacity
          randomize={true} // Enable randomization for more natural movement
          float={false}
        />
      </group>
    </group>
  );
};

export default React.memo(MessageOverlay3D);