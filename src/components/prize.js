import React, { useRef, useState, useEffect, useMemo } from 'react';
import { extend, useFrame, useThree, useLoader } from '@react-three/fiber';
import * as THREE from 'three';
import { Mesh } from 'three';
import useGameStore from '../store';
import MessageService from '../utils/messageService';

// Extend Three.js classes to resolve button interaction warning
extend({ Mesh });

// Static array to store refs to the prize for outlining
export const prizeRefs = [];

// Text rendering configuration
const TEXT_CONFIG = {
  fontSize: 48,
  fontFamily: "Georgia, serif",
  textColor: '#333',
  lineHeight: 1.8,
  padding: 10,
  maxWidth: 600, // Narrower text container
  textAlign: 'center'
};

const Prize = () => {
  const prizeRef = useRef();
  const meshRef = useRef();
  const { camera } = useThree();
  // Removed hovered state
  
  // Load the paper texture
  const paperTexture = useLoader(THREE.TextureLoader, '/paper.webp');
  
  // Create canvas texture for prize text
  const textCanvasRef = useRef(document.createElement('canvas'));
  const textTextureRef = useRef(null);
  
  // Use refs instead of state for animation values to avoid re-renders
  const animationStateRef = useRef('hidden'); // hidden, rising, floating, inspecting, acquiring
  const floatPhaseRef = useRef(0);
  const prizePositionRef = useRef(null);
  const initializedRef = useRef(false);
  const lastUpdateTimeRef = useRef(0);
  const inspectTimerRef = useRef(null);
  const acquisitionCompleteRef = useRef(false);
  
  // Get relevant state from the store
  const prizeState = useGameStore(state => state.prizeState);
  const setPrizeState = useGameStore(state => state.setPrizeState);
  const setPrizeClicked = useGameStore(state => state.setPrizeClicked);
  const chestOpened = useGameStore(state => state.chestOpened);
  const showMessageOverlay = useGameStore(state => state.showMessageOverlay);
  
  // Get the prize text from the experience
  const experiences = useGameStore(state => state.experienceScript.experiences);
  const chestExperience = experiences.find(exp => exp.type === 'chest');
  const prizeText = chestExperience?.reward?.prizeText || 'No text found';
  
  // Get chest position from the experience data - do this once
  const chestPosition = useRef(
    chestExperience 
      ? { x: chestExperience.position.x, z: chestExperience.position.z + 4 }
      : { x: 5, z: 86 }
  ).current;
  
  // Create canvas texture for text
  useEffect(() => {
    const canvas = textCanvasRef.current;
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Set text styles
    ctx.font = `${TEXT_CONFIG.fontSize}px ${TEXT_CONFIG.fontFamily}`;
    ctx.fillStyle = TEXT_CONFIG.textColor;
    ctx.textAlign = TEXT_CONFIG.textAlign;
    ctx.textBaseline = 'middle';
    
    // Improved wrap text logic that properly handles newline characters
    const wrapText = (text, x, y, maxWidth, lineHeight) => {
      if (!text || text.length === 0) return;
      
      // First split by newline characters to respect line breaks
      const paragraphs = text.split('\\n');
      const lines = [];
      
      // Process each paragraph separately, respecting manual line breaks
      paragraphs.forEach(paragraph => {
        if (paragraph.trim() === '') {
          // Handle empty lines
          lines.push('');
          return;
        }
        
        const words = paragraph.split(' ');
        let line = '';
        
        // Process words within each paragraph for width-based wrapping
        words.forEach(word => {
          const testLine = line + word + ' ';
          const metrics = ctx.measureText(testLine);
          
          if (metrics.width > maxWidth && line !== '') {
            lines.push(line);
            line = word + ' ';
          } else {
            line = testLine;
          }
        });
        
        // Add the last line of this paragraph
        if (line) lines.push(line);
      });
      
      // Calculate total height for vertical centering
      const totalHeight = lines.length * lineHeight;
      const startY = y - (totalHeight / 2);
      
      // Render each line
      lines.forEach((line, index) => {
        const lineY = startY + (index * lineHeight);
        ctx.fillText(line, x, lineY);
      });
    };
    
    // Draw text with improved wrapping (centered both horizontally and vertically)
    wrapText(
      prizeText, 
      canvas.width / 2, 
      canvas.height / 2, 
      canvas.width - 120, 
      36
    );
    
    // Create or update texture
    if (!textTextureRef.current) {
      textTextureRef.current = new THREE.CanvasTexture(canvas);
      textTextureRef.current.minFilter = THREE.LinearFilter;
      textTextureRef.current.magFilter = THREE.LinearFilter;
    } else {
      textTextureRef.current.needsUpdate = true;
    }
  }, [prizeText]);

  // Handle transition to inspect state
  useEffect(() => {
    if (prizeState === 'inspecting') {
      // Disable any 3D message overlay
      useGameStore.getState().setShowMessageOverlay(false);
      useGameStore.getState().setMessageBoxVisible(false);
      
      // Clear any existing timer just to be safe
      if (inspectTimerRef.current) {
        clearTimeout(inspectTimerRef.current);
      }
    }
    
    // Reset acquisition state when prize state changes
    if (prizeState === 'acquiring') {
      acquisitionCompleteRef.current = false;
    }
  }, [prizeState]);
  
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
      
      // Position the prize further from the camera to ensure full view
      const targetPos = {
        x: camera.position.x + cameraDirection.x * 1.5, // Moved further back
        y: camera.position.y, // Same height as camera
        z: camera.position.z + cameraDirection.z * 1.5
      };
      
      // Smoothly move toward the target position (lerp)
      prizePositionRef.current.x += (targetPos.x - prizePositionRef.current.x) * 0.1;
      prizePositionRef.current.y += (targetPos.y - prizePositionRef.current.y) * 0.1;
      prizePositionRef.current.z += (targetPos.z - prizePositionRef.current.z) * 0.1;
      
      // Make prize face directly at the camera
      prizeRef.current.lookAt(camera.position);
    } 
    else if (animationState === 'acquiring') {
      // Similar to the item acquisition animation
      // Move toward player with shrinking effect
      
      // Get player's position
      const playerX = camera.position.x;
      const playerY = camera.position.y - 0.5; // Target slightly below player's center
      const playerZ = camera.position.z;
      
      // Calculate distance to player
      const distanceToPlayer = new THREE.Vector3(playerX, playerY, playerZ)
        .distanceTo(new THREE.Vector3(
          prizePositionRef.current.x, 
          prizePositionRef.current.y, 
          prizePositionRef.current.z
        ));
      
      // Add a downward arc as it approaches the player
      const downwardArc = Math.max(0, Math.min(0.5, distanceToPlayer * 0.2)) * 
                           Math.sin(state.clock.elapsedTime * 2);
      
      // Move toward player position
      prizePositionRef.current.x += (playerX - prizePositionRef.current.x) * 0.1;
      prizePositionRef.current.y += ((playerY - downwardArc) - prizePositionRef.current.y) * 0.1;
      prizePositionRef.current.z += (playerZ - prizePositionRef.current.z) * 0.1;
      
      // Scale down as it approaches the player
      if (prizeRef.current) {
        const currentScale = prizeRef.current.scale.x;
        const newScale = Math.max(0.01, currentScale - 0.02);
        prizeRef.current.scale.set(newScale, newScale, newScale);
      }
      
      // Increase rotation speed for dramatic effect
      prizeRef.current.rotation.y += 0.1;
      
      // Check if prize has reached player
      if (distanceToPlayer < 0.3 || (prizeRef.current && prizeRef.current.scale.x <= 0.01)) {
        // Prize has been fully acquired
        if (!acquisitionCompleteRef.current) {
          acquisitionCompleteRef.current = true;
          console.log("Prize animation complete!");
          
          // Just change prize state to acquired (which will hide it)
          // We don't add it to the inventory - this is purely visual
          setTimeout(() => {
            setPrizeState('acquired');
          }, 100);
        }
      }
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
  
  // Don't render if hidden or acquired
  if (prizeState === 'hidden' || prizeState === 'acquired') return null;
  
  // Using constant glow intensity instead of hover-based
  const glowIntensity = 0.4;
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
      {/* Prize object - tall document with custom material to show texture */}
      <mesh 
        ref={meshRef}
        rotation={[0, Math.PI / 2, Math.PI/2]} // Rotate 90 degrees to make it tall instead of wide
        onClick={(e) => {
          e.stopPropagation();
          if (isClickable && prizeState === 'floating') {
            // Move to inspecting state
            setPrizeState('inspecting');
            setPrizeClicked(true);
          }
        }}
        // Removed hover handlers
        renderOrder={2000} // Ensure it renders on top when in inspection mode
      >
        <boxGeometry args={[1.5, 0.02, 1]} /> {/* Taller and narrower */}
        <shaderMaterial 
          transparent={false} // Fully opaque
          side={THREE.DoubleSide}
          uniforms={{
            paperTexture: { value: paperTexture },
            textTexture: { value: textTextureRef.current },
            opacity: { value: 1.0 }, // Fully opaque
            glowIntensity: { value: glowIntensity }
          }}
          vertexShader={`
            varying vec2 vUv;
            varying vec3 vNormal;
            varying vec3 vViewDirection;
            
            void main() {
              // Rotate UV coordinates 90 degrees clockwise
              vUv = vec2(1.0 - uv.y, uv.x);
              
              vNormal = normalize(normalMatrix * normal);
              vec4 modelViewPosition = modelViewMatrix * vec4(position, 1.0);
              vViewDirection = normalize(-modelViewPosition.xyz);
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
          `}
          fragmentShader={`
            uniform sampler2D paperTexture;
            uniform sampler2D textTexture;
            uniform float opacity;
            uniform float glowIntensity;
            
            varying vec2 vUv;
            varying vec3 vNormal;
            varying vec3 vViewDirection;
            
            void main() {
              // Check if the surface is facing the camera
              float facing = dot(vNormal, vViewDirection);
              
              // Only show texture on front-facing side
              if (facing > 0.0) {
                vec4 paperColor = texture2D(paperTexture, vUv);
                vec4 textColor = texture2D(textTexture, vUv);
                
                // Blend text with paper texture
                vec3 finalColor = mix(paperColor.rgb, textColor.rgb, textColor.a);
                gl_FragColor = vec4(finalColor, 1.0);
              } else {
                // Golden color for other sides
                vec3 goldenColor = vec3(0.941, 0.902, 0.549); // #f0e68c
                gl_FragColor = vec4(goldenColor * (1.0 + glowIntensity * 0.5), 1.0);
              }
            }
          `}
          emissiveMap={paperTexture}
          emissive="#f0e68c"
          emissiveIntensity={0.2} // Slight emission
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