import React, { useRef, useEffect, useState } from 'react';
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
  const frameRateRef = useRef(1/12); // 12 frames per second
  const framesLoadedRef = useRef(false);
  const textureArrayRef = useRef([]);
  const frameTextureRef = useRef(null);
  const totalFrames = 16; // Total number of frames in the sequence
  
  // Hit counter state
  const hitCountRef = useRef(0);
  const totalHitsRequired = 3; // Number of hits required to defeat enemy
  const [hitFlashActive, setHitFlashActive] = useState(false); // For visual feedback
  
  // Get render order constants from store
  const renderOrder = useGameStore(state => state.renderOrder);
  
  // Track overlay state for improved click handling
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
  const showMessageOverlay = useGameStore(state => state.showMessageOverlay);
  
  // Track overlay state changes to detect dismissal
  useEffect(() => {
    // If overlay was showing, and now it's not, mark as just dismissed
    if (lastOverlayState && !showMessageOverlay) {
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
  
  // Determine if this is the enemy encounter experience
  const isEnemyExperience = currentExperienceIndex >= 0 && 
    currentExperienceIndex < experiences.length && 
    experiences[currentExperienceIndex].type === 'enemy';
  
  // Calculate enemy position based on player position and experience data
  useEffect(() => {
    if (isEnemyExperience && !isMovingCamera) {
      // Position the enemy directly in front of player
      const newPosition = {
        x: playerPosition.x,
        y: -5, // Start below the floor
        z: playerPosition.z + 4 // 4 units in front of the player
      };
      
      setEnemyPosition(newPosition);
      setIsVisible(true);
      
      // Start the rising animation after a short delay
      setTimeout(() => {
        setIsRising(true);
        setAnimationStarted(true);
      }, 500);
    } else {
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
      } else {
        // Reached target height, stop rising
        setIsRising(false);
        
        // Show the message overlay once the enemy has risen
        if (animationStarted) {
          setAnimationStarted(false);
          
          // Wait a moment before showing the message
          setTimeout(() => {
            // Use the MessageService instead of direct store access
            MessageService.showEnemyMessage();
          }, 500);
        }
      }
    }
    
    // Handle hit flash effect timing
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
    
    // Handle sword swing animation hit detection
    if (swordSwinging) {
      const swingProgress = useGameStore.getState().swingProgress;
      
      // When swing is halfway through, detect hit
      if (swingProgress > 0.3 && swingProgress < 0.6 && !useGameStore.getState().enemyHit) {
        // Set enemyHit flag to true temporarily for this swing
        useGameStore.getState().setEnemyHit(true);
        
        // Increment hit counter
        hitCountRef.current += 1;
        
        // Apply hit flash effect
        if (materialRef.current) {
          materialRef.current.color.set(0xFF3333); // Red tint
          setHitFlashActive(true);
        }
        
        // Check if we've reached the required number of hits
        if (hitCountRef.current >= totalHitsRequired) {
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
  
  // Improved enemy click handling to prevent double-click issues
  const handleEnemyMeshClick = (e) => {
    e.stopPropagation();
    
    // Calculate if enemy is clickable with improved conditions
    const enemyClickable = useGameStore.getState().enemyClickable;
    const enemyHit = useGameStore.getState().enemyHit;
    
    // Enemy is clickable if: regular conditions OR overlay just dismissed
    const isClickable = (enemyClickable && !showMessageOverlay && !enemyHit) || 
                        (enemyClickable && overlayJustDismissed && !enemyHit);
      
    if (isClickable) {
      handleEnemyClick();
    }
  };
  
  // Don't render if not visible
  if (!isVisible || !enemyPosition) return null;
  
  // Calculate if enemy is clickable
  const enemyClickable = useGameStore.getState().enemyClickable && 
                        (!showMessageOverlay || overlayJustDismissed);

  // Create health display in units of 10%
  const healthPercentage = Math.max(0, 100 - (hitCountRef.current * 10));
                        
  // Create a more visible animated enemy with fixed depth handling
  return (
    <group>
      {/* Health bar above enemy */}
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
      
      {/* Health bar fill */}
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
          depthTest={true}  // Keep depth test enabled
          depthWrite={true} // Enable depth writing for proper occlusion
          alphaTest={0.01}  // Alpha test to help with transparency issues
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
    </group>
  );
};

export default React.memo(Enemy);