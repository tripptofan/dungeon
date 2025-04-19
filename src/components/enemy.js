import React, { useRef, useEffect, useState, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import useGameStore from '../store';
import MessageService from '../utils/messageService';

const Enemy = () => {
  const enemyRef = useRef();
  const materialRef = useRef();
  const [isVisible, setIsVisible] = useState(false);
  const [isRising, setIsRising] = useState(false);
  const [animationStarted, setAnimationStarted] = useState(false);
  const [enemyPosition, setEnemyPosition] = useState(null);
  const { camera } = useThree();
  
  // PNG sequence animation state
  const [currentFrame, setCurrentFrame] = useState(0);
  const frameTimeRef = useRef(0);
  const frameRateRef = useRef(1/12); // 12 frames per second (adjust as needed)
  const framesLoadedRef = useRef(false);
  const textureArrayRef = useRef([]);
  const frameTextureRef = useRef(null);
  const totalFrames = 16; // Total number of frames in the sequence
  
  // Hit counter state - NEW
  const hitCountRef = useRef(0);
  const totalHitsRequired = 3; // NEW - Number of hits required to defeat enemy
  const [hitFlashActive, setHitFlashActive] = useState(false); // NEW - For visual feedback
  
  // Get render order constants from store
  const renderOrder = useGameStore(state => state.renderOrder);
  
  // FIX: Track overlay state for improved click handling
  const [lastOverlayState, setLastOverlayState] = useState(false);
  const [overlayJustDismissed, setOverlayJustDismissed] = useState(false);
  
  // Preload all image frames
  useEffect(() => {
    const textureLoader = new THREE.TextureLoader();
    const textures = [];
    
    // Create a promise for loading each frame
    const loadPromises = [];
    
    // Load all frames
    for (let i = 1; i <= totalFrames; i++) {
      const frameNumber = i.toString().padStart(2, '0');
      const framePath = `/gemSequence/frame_apngframe${frameNumber}.png`;
      
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
            textures[i-1] = texture;
            resolve();
          },
          undefined, // onProgress callback not needed
          (error) => {
            console.error(`Error loading frame ${framePath}:`, error);
            resolve(); // Resolve anyway to avoid blocking other frames
          }
        );
      });
      
      loadPromises.push(loadPromise);
    }
    
    // Wait for all textures to load
    Promise.all(loadPromises).then(() => {
      textureArrayRef.current = textures;
      frameTextureRef.current = textures[0];
      framesLoadedRef.current = true;
      console.log(`Loaded ${textures.length} animation frames for enemy`);
    });
    
    // Cleanup function
    return () => {
      // Dispose textures when component unmounts
      if (textureArrayRef.current.length > 0) {
        textureArrayRef.current.forEach(texture => {
          if (texture) texture.dispose();
        });
      }
    };
  }, []);
  
  // Get relevant state from the store
  const currentExperienceIndex = useGameStore(state => state.currentExperienceIndex);
  const experiences = useGameStore(state => state.experienceScript.experiences);
  const isMovingCamera = useGameStore(state => state.isMovingCamera);
  const playerPosition = useGameStore(state => state.playerPosition);
  const handleEnemyClick = useGameStore(state => state.handleEnemyClick);
  const swordSwinging = useGameStore(state => state.swordSwinging);
  const debugMode = useGameStore(state => state.debugMode);
  const showMessageOverlay = useGameStore(state => state.showMessageOverlay);
  
  // FIX: Track overlay state changes to detect dismissal
  useEffect(() => {
    // If overlay was showing, and now it's not, mark as just dismissed
    if (lastOverlayState && !showMessageOverlay) {
      console.log("Overlay just dismissed, marking enemy as ready for interaction");
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
  
  // For debug mode, force enemy to be visible
  useEffect(() => {
    if (debugMode) {
      console.log("Debug mode enabled - forcing enemy visibility");
      
      // Position the enemy directly in front of the camera
      const cameraDir = new THREE.Vector3(0, 0, -1);
      cameraDir.applyQuaternion(camera.quaternion);
      cameraDir.multiplyScalar(5); // 5 units in front of camera
      
      const debugPosition = {
        x: camera.position.x + cameraDir.x,
        y: camera.position.y, // Same height as camera
        z: camera.position.z + cameraDir.z
      };
      
      console.log("Debug enemy position:", debugPosition);
      
      setEnemyPosition(debugPosition);
      setIsVisible(true);
      
      // Set enemy as clickable
      useGameStore.getState().setEnemyClickable(true);
    }
  }, [camera, debugMode]);
  
  // Determine if this is the enemy encounter experience
  const isEnemyExperience = currentExperienceIndex >= 0 && 
    currentExperienceIndex < experiences.length && 
    experiences[currentExperienceIndex].type === 'enemy';
  
  // Calculate enemy position based on player position and experience data
  useEffect(() => {
    if (isEnemyExperience && !isMovingCamera) {
      const experience = experiences[currentExperienceIndex];
      
      // Debug output
      console.log("Enemy experience triggered!");
      console.log("Current experience index:", currentExperienceIndex);
      console.log("Player position:", playerPosition);
      
      // Position the enemy directly in front of player
      const newPosition = {
        x: playerPosition.x,
        y: -5, // Start below the floor
        z: playerPosition.z + 4 // 6 units in front of the player
      };
      
      console.log("Setting enemy position to:", newPosition);
      
      setEnemyPosition(newPosition);
      setIsVisible(true);
      
      // Start the rising animation after a short delay
      setTimeout(() => {
        console.log("Starting enemy rising animation");
        setIsRising(true);
        setAnimationStarted(true);
      }, 500);
    } else {
      if (isEnemyExperience) {
        console.log("Enemy experience active but camera is moving - waiting");
      }
      
      setIsVisible(false);
      setIsRising(false);
      setAnimationStarted(false);
    }
  }, [currentExperienceIndex, experiences, isMovingCamera, isEnemyExperience, playerPosition]);
  
  // Handle the rising animation and frame updates
  useFrame((state, delta) => {
    if (!enemyRef.current || !isVisible || !enemyPosition) return;

    // Update position
    enemyRef.current.position.x = enemyPosition.x;
    enemyRef.current.position.z = enemyPosition.z;
    
    if (isRising) {
      // Rise up from below the floor to a standing position
      const targetY = 2.0; // Higher final height (center of rectangle)
      const riseSpeed = 0.08; // Faster rise speed
      
      if (enemyRef.current.position.y < targetY) {
        // Move upward
        enemyRef.current.position.y += riseSpeed;
        console.log("Enemy rising, current Y:", enemyRef.current.position.y);
      } else {
        // Reached target height, stop rising
        setIsRising(false);
        
        // Show the message overlay once the enemy has risen
        if (animationStarted) {
          setAnimationStarted(false);
          
          // DO NOT set enemy clickable here
          // Instead, let MessageService handle this after the message is dismissed
          console.log("Enemy appearance complete, showing message...");
          
          // Wait a moment before showing the message
          setTimeout(() => {
            // Use the MessageService instead of direct store access
            MessageService.showEnemyMessage();
          }, 500);
        }
      }
    }
    
    // Handle hit flash effect timing - NEW
    if (hitFlashActive) {
      // Turn off flash after a short duration (250ms)
      setTimeout(() => {
        setHitFlashActive(false);
        
        // Reset material color if not fading out
        if (materialRef.current && !useGameStore.getState().enemyFadingOut) {
          materialRef.current.color.set(0xFFFFFF); // Back to normal
        }
      }, 250);
    }
    
    // Handle PNG sequence animation
    if (framesLoadedRef.current && textureArrayRef.current.length > 0) {
      // Accumulate time
      frameTimeRef.current += delta;
      
      // Check if it's time to advance to the next frame
      if (frameTimeRef.current >= frameRateRef.current) {
        // Reset the timer
        frameTimeRef.current = 0;
        
        // Advance to the next frame
        const nextFrame = (currentFrame + 1) % totalFrames;
        setCurrentFrame(nextFrame);
        
        // Update the texture
        if (materialRef.current && textureArrayRef.current[nextFrame]) {
          materialRef.current.map = textureArrayRef.current[nextFrame];
          materialRef.current.needsUpdate = true;
        }
      }
    }
    
    // Handle sword swing animation hit detection - MODIFIED
    if (swordSwinging) {
      const swingProgress = useGameStore.getState().swingProgress;
      
      // When swing is halfway through, detect hit
      if (swingProgress > 0.3 && swingProgress < 0.6 && !useGameStore.getState().enemyHit) {
        // Set enemyHit flag to true temporarily for this swing
        useGameStore.getState().setEnemyHit(true);
        
        // Increment hit counter
        hitCountRef.current += 1;
        console.log(`Enemy hit! Current hits: ${hitCountRef.current}/${totalHitsRequired}`);
        
        // Apply hit flash effect
        if (materialRef.current) {
          materialRef.current.color.set(0xFF3333); // Red tint
          setHitFlashActive(true);
        }
        
        // Check if we've reached the required number of hits
        if (hitCountRef.current >= totalHitsRequired) {
          console.log("Enemy defeated after reaching hit threshold!");
          
          // Slowly fade out after final hit
          setTimeout(() => {
            if (enemyRef.current && enemyRef.current.visible) {
              // Start decreasing opacity
              useGameStore.getState().startEnemyFadeOut();
            }
          }, 300);
        } else {
          // Reset enemy hit state after a short delay to allow for another hit
          setTimeout(() => {
            useGameStore.getState().setEnemyHit(false);
          }, 800); // Allow for sword swing to complete
        }
      }
    }
    
    // Handle fade out animation
    const isFadingOut = useGameStore.getState().enemyFadingOut;
    if (isFadingOut) {
      // Check if material references exist
      if (materialRef.current) {
        // Reduce opacity
        materialRef.current.opacity -= 0.02;
        
        // Apply to all meshes in the group
        enemyRef.current?.parent?.traverse(child => {
          if (child.isMesh && child.material && child !== enemyRef.current) {
            child.material.opacity -= 0.02;
          }
        });
        
        // When fully transparent, hide the enemy
        if (materialRef.current.opacity <= 0) {
          setIsVisible(false);
          useGameStore.getState().completeEnemyFadeOut();
        }
      }
    }
  });
  
  // FIX: Improved enemy click handling to prevent double-click issues
  const handleEnemyMeshClick = (e) => {
    e.stopPropagation();
    
    console.log("Enemy clicked!");
    
    // FIX: Calculate if enemy is clickable with improved conditions
    const enemyClickable = useGameStore.getState().enemyClickable;
    const enemyHit = useGameStore.getState().enemyHit;
    
    // FIX: Enemy is clickable if: regular conditions OR overlay just dismissed
    const isClickable = (enemyClickable && !showMessageOverlay && !enemyHit) || 
                        (enemyClickable && overlayJustDismissed && !enemyHit);
      
    if (isClickable) {
      console.log("Triggering enemy click handler");
      handleEnemyClick();
    } else {
      console.log("Enemy not clickable or already hit:", 
        {clickable: enemyClickable, dismissed: overlayJustDismissed, hit: enemyHit});
    }
  };
  
  // Don't render if not visible
  if (!isVisible || !enemyPosition) return null;
  
  // Calculate if enemy is clickable
  const enemyClickable = useGameStore.getState().enemyClickable && 
                        (!showMessageOverlay || overlayJustDismissed);

  // Create health display in units of 10% - NEW
  const healthPercentage = Math.max(0, 100 - (hitCountRef.current * 10));
                        
  // Create a more visible animated enemy with fixed depth handling
  return (
    <group>
      {/* Health bar above enemy - NEW */}
      <mesh 
        position={[enemyPosition.x, enemyPosition.y + 2.5, enemyPosition.z]}
        renderOrder={renderOrder.ENEMY + 10}
      >
        <planeGeometry args={[3, 0.3]} />
        <meshBasicMaterial 
          color="#333333"
          transparent={true}
          opacity={0.7}
          depthTest={true}
        />
      </mesh>
      
      {/* Health bar fill - NEW */}
      {healthPercentage > 0 && (
        <mesh 
          position={[
            enemyPosition.x - 1.5 + (healthPercentage/100 * 1.5), 
            enemyPosition.y + 2.5, 
            enemyPosition.z + 0.01
          ]}
          scale={[healthPercentage/100, 1, 1]}
          renderOrder={renderOrder.ENEMY + 11}
        >
          <planeGeometry args={[3, 0.25]} />
          <meshBasicMaterial 
            color={
              healthPercentage > 60 ? "#22cc22" :  // Green for high health
              healthPercentage > 30 ? "#cccc22" :  // Yellow for medium health
              "#cc2222"                            // Red for low health
            }
            transparent={true}
            opacity={0.9}
            depthTest={true}
          />
        </mesh>
      )}
      
      {/* Main enemy mesh with improved visibility settings */}
      <mesh 
        ref={enemyRef}
        position={[enemyPosition.x, enemyPosition.y, enemyPosition.z]}
        onClick={handleEnemyMeshClick}
        rotation={[0, Math.PI, 0]}
        renderOrder={renderOrder.ENEMY}
      >
        <planeGeometry args={[3, 4.5]} />
        <meshBasicMaterial 
          ref={materialRef}
          transparent={true}
          map={framesLoadedRef.current ? textureArrayRef.current[currentFrame] : null}
          opacity={1.0}
          color="#ffffff"
          depthTest={true}  // Important: Keep depth test enabled
          depthWrite={true} // Important: Enable depth writing for proper occlusion
          alphaTest={0.01}  // Added alpha test to help with transparency issues
        />
      </mesh>
      
      {/* Simplified glow effect */}
      <mesh 
        position={[enemyPosition.x, enemyPosition.y, enemyPosition.z - 0.1]}
        onClick={handleEnemyMeshClick}
        renderOrder={renderOrder.ENEMY - 1}
      >
        <planeGeometry args={[3.6, 5]} />
        <meshBasicMaterial
          color="#ffff88"
          transparent={true} 
          opacity={0.3}
          depthTest={true}
          depthWrite={true}
          alphaTest={0.01}
        />
      </mesh>
      
      {/* Hit counter text (debug) - NEW */}
      {debugMode && (
        <mesh
          position={[enemyPosition.x, enemyPosition.y - 2.5, enemyPosition.z]}
          renderOrder={renderOrder.ENEMY + 12}
        >
          <planeGeometry args={[2, 0.5]} />
          <meshBasicMaterial
            color="#ffffff"
            transparent={true}
            opacity={0.9}
            depthTest={false}
          />
          {/* We can't actually render text in Three.js without a custom approach,
              but this would be where we'd display the hit counter if we could */}
        </mesh>
      )}
    </group>
  );
};

export default React.memo(Enemy);