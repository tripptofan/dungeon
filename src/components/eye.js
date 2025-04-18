import React, { useRef, useEffect, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import useGameStore from '../store';

const Eye = ({ position = [0, 0, 0], scale = [.5, .5], rotation = [0, Math.PI, 0], emissiveIntensity = 1, randomize = true }) => {
  const eyeRef = useRef();
  const materialRef = useRef();
  const { camera } = useThree();
  
  // Get render order constants from store
  const renderOrder = useGameStore(state => state.renderOrder);
  
  // PNG sequence animation state
  const [currentFrame, setCurrentFrame] = useState(0);
  const frameTimeRef = useRef(0);
  const frameRateRef = useRef(1/8); // 8 frames per second
  const wiggleCountRef = useRef(0);
  const isBlinkingRef = useRef(false);
  const framesLoadedRef = useRef(false);
  
  // Random color for the eye
  const [emissiveColor, setEmissiveColor] = useState('#ffffff'); // Default white
  
  // Animation sequence tracking - UPDATED for 2 wiggle frames
  const WIGGLE_FRAME_COUNT = 2; // CHANGED from 3 to 2 frames: wiggle1.png to wiggle2.png
  const BLINK_FRAME_COUNT = 5;  // 5 frames: blink1.png to blink5.png
  
  // Store loaded textures
  const wiggleTexturesRef = useRef([]);
  const blinkTexturesRef = useRef([]);
  
  // Position the eye a few steps in front of the player
  const [eyePosition, setEyePosition] = useState(null);
  
  // Get player position from store
  const playerPosition = useGameStore(state => state.playerPosition);
  
  // Set initial position in front of player
  useEffect(() => {
    // Position the eye 5 units in front of the player with a slight offset to avoid blocking
    setEyePosition({
      x: playerPosition.x,
      y: playerPosition.y, 
      z: playerPosition.z + 5 // Assuming player is facing negative Z
    });
  }, [playerPosition]);
  
  const wiggleCycleTargetRef = useRef(0); // Target number of wiggle cycles before blinking

  useEffect(() => {
      // Available colors for the eye
      const availableColors = [
        '#ff69b4', // hotpink
        '#40e0d0', // turquoise
        '#fffacd', // light yellow
        '#ffffff', // white
        '#e6e6fa'  // lavender
      ];
      
      // Pick a color - random if randomize is true, otherwise use white
      if (randomize) {
        const randomColorIndex = Math.floor(Math.random() * availableColors.length);
        setEmissiveColor(availableColors[randomColorIndex]);
      } else {
        setEmissiveColor('#ffffff'); // Default to white when not randomizing
      }
      
      const textureLoader = new THREE.TextureLoader();
      const wiggleTextures = [];
      const blinkTextures = [];
      
      // Create promise arrays for loading
      const loadPromises = [];
      
      // Load wiggle frames (wiggle1.png through wiggle2.png)
      for (let i = 1; i <= WIGGLE_FRAME_COUNT; i++) {
        const framePath = `/eye/wiggle/wiggle${i}.png`;
        
        const loadPromise = new Promise((resolve) => {
          textureLoader.load(
            framePath,
            (texture) => {
              // Configure texture for transparency
              texture.minFilter = THREE.LinearFilter;
              texture.magFilter = THREE.LinearFilter;
              texture.format = THREE.RGBAFormat;
              texture.colorSpace = THREE.SRGBColorSpace;
              texture.generateMipmaps = false;
              
              // Store texture at the correct index
              wiggleTextures[i-1] = texture;
              resolve();
            },
            undefined, // onProgress callback not needed
            (error) => {
              console.error(`Error loading wiggle frame ${framePath}:`, error);
              resolve(); // Resolve anyway to avoid blocking other frames
            }
          );
        });
        
        loadPromises.push(loadPromise);
      }
      
      // Load blink frames (blink1.png through blink5.png)
      for (let i = 1; i <= BLINK_FRAME_COUNT; i++) {
        const framePath = `/eye/blink/blink${i}.png`;
        
        const loadPromise = new Promise((resolve) => {
          textureLoader.load(
            framePath,
            (texture) => {
              // Configure texture for transparency
              texture.minFilter = THREE.LinearFilter;
              texture.magFilter = THREE.LinearFilter;
              texture.format = THREE.RGBAFormat;
              texture.colorSpace = THREE.SRGBColorSpace;
              texture.generateMipmaps = false;
              
              // Store texture at the correct index
              blinkTextures[i-1] = texture;
              resolve();
            },
            undefined, // onProgress callback not needed
            (error) => {
              console.error(`Error loading blink frame ${framePath}:`, error);
              resolve(); // Resolve anyway to avoid blocking other frames
            }
          );
        });
        
        loadPromises.push(loadPromise);
      }
      
      // Wait for all textures to load
      Promise.all(loadPromises).then(() => {
        wiggleTexturesRef.current = wiggleTextures;
        blinkTexturesRef.current = blinkTextures;
        framesLoadedRef.current = true;
        
        if (randomize) {
          // Randomly select a starting frame
          const allFrames = [...wiggleTextures, ...blinkTextures];
          const randomFrameIndex = Math.floor(Math.random() * allFrames.length);
          const isBlinkFrame = randomFrameIndex >= wiggleTextures.length;
          const randomFrame = allFrames[randomFrameIndex];
          
          // Set the initial frame and update the material
          setCurrentFrame(isBlinkFrame ? randomFrameIndex - wiggleTextures.length : randomFrameIndex);
          isBlinkingRef.current = isBlinkFrame;
          
          if (materialRef.current && randomFrame) {
            materialRef.current.map = randomFrame;
            materialRef.current.needsUpdate = true;
          }
          
          // Set a random wiggle cycle target between 7 and 10
          wiggleCycleTargetRef.current = Math.floor(Math.random() * 4) + 7; // Random number between 7 and 10
          
          console.log(`Loaded ${wiggleTextures.length} wiggle frames and ${blinkTextures.length} blink frames for eye`);
          console.log(`Starting with ${isBlinkFrame ? 'blink' : 'wiggle'} frame ${randomFrameIndex}`);
          console.log(`Random wiggle cycle target set to ${wiggleCycleTargetRef.current}`);
          console.log(`Eye color set to ${emissiveColor}`);
        } else {
          // Use deterministic starting state when not randomizing
          setCurrentFrame(0);
          isBlinkingRef.current = false;
          
          if (materialRef.current && wiggleTextures[0]) {
            materialRef.current.map = wiggleTextures[0];
            materialRef.current.needsUpdate = true;
          }
          
          // Use a fixed wiggle cycle target
          wiggleCycleTargetRef.current = 8; // Default to 8 cycles when not randomizing
          
          console.log(`Loaded ${wiggleTextures.length} wiggle frames and ${blinkTextures.length} blink frames for eye`);
          console.log(`Starting with wiggle frame 0 (non-randomized)`);
          console.log(`Fixed wiggle cycle target set to ${wiggleCycleTargetRef.current}`);
          console.log(`Eye color set to white (non-randomized)`);
        }
      });
      
      // Cleanup function
      return () => {
        // Dispose textures when component unmounts
        wiggleTextures.forEach(texture => {
          if (texture) texture.dispose();
        });
        blinkTextures.forEach(texture => {
          if (texture) texture.dispose();
        });
      };
    }, [randomize]); // Add randomize to dependency array to re-run when it changes
    
  // Add effect to update emissive intensity when the prop changes
  useEffect(() => {
    if (materialRef.current) {
      materialRef.current.emissiveIntensity = emissiveIntensity;
      materialRef.current.needsUpdate = true;
    }
  }, [emissiveIntensity]);
  
  // Handle animation frames
  useFrame((state, delta) => {
    if (!eyeRef.current || !framesLoadedRef.current) return;
    
    // Accumulate time since last frame
    frameTimeRef.current += delta;
    
    // Check if it's time to advance to the next frame
    if (frameTimeRef.current >= frameRateRef.current) {
      // Reset the timer
      frameTimeRef.current = 0;
      
      if (isBlinkingRef.current) {
        // Playing blink sequence
        const nextFrame = currentFrame + 1;
        
        if (nextFrame >= BLINK_FRAME_COUNT) {
          // Blink sequence complete, go back to wiggle
          setCurrentFrame(0);
          isBlinkingRef.current = false;
          wiggleCountRef.current = 0;
          
          // Update texture to first wiggle frame
          if (materialRef.current && wiggleTexturesRef.current[0]) {
            materialRef.current.map = wiggleTexturesRef.current[0];
            materialRef.current.needsUpdate = true;
          }
        } else {
          // Continue blink sequence
          setCurrentFrame(nextFrame);
          
          // Update the texture
          if (materialRef.current && blinkTexturesRef.current[nextFrame]) {
            materialRef.current.map = blinkTexturesRef.current[nextFrame];
            materialRef.current.needsUpdate = true;
          }
        }
      } else {
        // Playing wiggle sequence
        const nextFrame = (currentFrame + 1) % WIGGLE_FRAME_COUNT;
        setCurrentFrame(nextFrame);
        
        // Update the texture
        if (materialRef.current && wiggleTexturesRef.current[nextFrame]) {
          materialRef.current.map = wiggleTexturesRef.current[nextFrame];
          materialRef.current.needsUpdate = true;
        }
        
        // Check if we've completed a full wiggle cycle
        if (nextFrame === 0) {
          wiggleCountRef.current++;
          
          // Check if we've reached the random wiggle cycle target
          if (wiggleCountRef.current >= wiggleCycleTargetRef.current) {
            isBlinkingRef.current = true;
            setCurrentFrame(0);
            
            // Update texture to first blink frame
            if (materialRef.current && blinkTexturesRef.current[0]) {
              materialRef.current.map = blinkTexturesRef.current[0];
              materialRef.current.needsUpdate = true;
            }
          }
        }
      }
    }
  });
  
  // Don't render if position isn't set yet
  if (!eyePosition) return null;
  
  // Fix: modify renderOrder to ensure eyes don't render on top of treasure chest
  // Use a lower renderOrder value than the TREASURE_CHEST value
  const effectiveRenderOrder = renderOrder.EYES;
  
  // Add a light to ensure the eye is visible
  return (
    <group position={position}>
      {/* Main eye mesh */}
      <mesh 
        ref={eyeRef}
        rotation={rotation} // Ensure the eye faces the correct direction
        renderOrder={effectiveRenderOrder}
      >
        <planeGeometry args={scale} /> {/* Adjust size as needed */}
        <meshStandardMaterial 
          ref={materialRef}
          transparent={true}
          side={THREE.DoubleSide}
          emissive={emissiveColor} // Using the random color
          emissiveIntensity={emissiveIntensity}
          map={isBlinkingRef.current 
            ? blinkTexturesRef.current[currentFrame] 
            : wiggleTexturesRef.current[currentFrame]
          }
          depthTest={true}  // Enable depth test to properly handle occlusion
          depthWrite={false}  // Disable depth write to prevent occluding other objects
        />
      </mesh>
    </group>
  );
};

export default React.memo(Eye);