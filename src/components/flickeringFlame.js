import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { createNoise2D } from 'simplex-noise';
import * as THREE from 'three';

const noise2D = createNoise2D();

// Lerp function for smooth transitions
const lerp = (a, b, t) => a + (b - a) * t;

const FlickeringFlame = ({ 
  position = [0, 0.2, 0], 
  color = "#ffcc77",
  randomizer = Math.random(),
  intensity = 5,           // Base intensity
  distance = 10,           // Light distance
  decay = 0.9,             // Light decay
  flickerSpeed = 0.5,      // New parameter to control how fast the flame flickers (lower = smoother)
  flickerRange = 0.3,      // New parameter to control intensity variation (lower = subtler)
  renderOrder = 2000       // Add render order parameter
}) => {
  const lightRef = useRef();
  const glowRef = useRef();
  const time = useRef(Math.random() * 1000);
  const timeOffset = Math.random() * 1000;
  
  // Store the target and current intensity for smooth interpolation
  const targetIntensity = useRef(intensity);
  const currentIntensity = useRef(intensity);
  
  // Reduce the flicker parameters for more subtle effects
  const adjustedRandomizer = randomizer * 0.6; // Scale down randomizer effect
  
  // Compute light behavior based on randomizer and intensity parameter
  const baseIntensity = intensity * (1 + adjustedRandomizer * 0.2); // Less variation in base intensity
  
  // Reduce flicker amount for more subtle effect
  const flickerAmount = flickerRange * baseIntensity; // Scale flicker range based on base intensity
  
  // Slow down the flicker speed
  const adjustedFlickerSpeed = 0.0002 * flickerSpeed; // Adjust flicker speed (lower = smoother)
  
  // Reduce blackout chance and make it less dramatic
  const blackoutChance = 0.001 + adjustedRandomizer * 0.002; // Much rarer (0.1% to 0.3%)
  const minIntensity = baseIntensity * 0.85; // Higher minimum (85% of base) for more subtle dims

  useFrame((state, delta) => {
    if (lightRef.current && glowRef.current) {
      // Increment time more slowly for smoother changes
      time.current += adjustedFlickerSpeed;

      // Use multiple overlapping noise patterns for more organic movement
      const noise1 = noise2D(time.current * 0.1, timeOffset) * 0.5;
      const noise2 = noise2D(time.current * 0.05, timeOffset + 100) * 0.3;
      const noise3 = noise2D(time.current * 0.025, timeOffset + 200) * 0.2;
      
      // Combine noises for more natural, layered effect
      let flickerFactor = (noise1 + noise2 + noise3) * flickerAmount;

      // Much rarer and less dramatic dimming
      if (Math.random() < blackoutChance) {
        // Less dramatic dimming - only dims by 10-15%
        flickerFactor -= baseIntensity * (0.1 + Math.random() * 0.05);
      }

      // Set new target intensity with constraints
      targetIntensity.current = Math.max(minIntensity, baseIntensity + flickerFactor);
      
      // Smoothly interpolate current intensity toward target (lerp)
      // The 2 * delta makes the transition speed relative to frame rate
      // Lower multiplier = smoother, slower transitions
      currentIntensity.current = lerp(
        currentIntensity.current, 
        targetIntensity.current, 
        Math.min(1, 1.5 * delta)
      );
      
      // Apply the smoothed intensity
      lightRef.current.intensity = currentIntensity.current;
      
      // Also smooth the glow adjustments
      // Make scale changes more subtle 
      const scaleFactor = 0.9 + (currentIntensity.current / baseIntensity) * 0.2; // Less scale variation
      
      // Smoothly adjust the scale
      if (glowRef.current.scale.x !== scaleFactor) {
        glowRef.current.scale.lerp(
          new THREE.Vector3(scaleFactor, scaleFactor, scaleFactor), 
          Math.min(1, 2 * delta)
        );
      }
      
      // Smoothly adjust the opacity with less variation
      if (glowRef.current.material) {
        const targetOpacity = 0.5 + (currentIntensity.current / baseIntensity) * 0.2; // Less opacity variation
        glowRef.current.material.opacity = lerp(
          glowRef.current.material.opacity,
          targetOpacity,
          Math.min(1, 2 * delta)
        );
      }
    }
  });

  return (
    <group position={position}>
      <pointLight
        ref={lightRef}
        color={color}
        intensity={baseIntensity}
        distance={distance}
        decay={decay}
        castShadow
      />
      
      {/* Glow sphere */}
      <mesh ref={glowRef} scale={[1, 1, 1]} renderOrder={renderOrder}>
        <sphereGeometry args={[0.1, 8, 8]} />
        <meshBasicMaterial
          color={color}
          transparent={true}
          opacity={0.7}
          depthTest={true}  // Enable depth test
        />
      </mesh>
    </group>
  );
};

export default FlickeringFlame;