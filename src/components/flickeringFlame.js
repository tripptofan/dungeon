import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { createNoise2D } from 'simplex-noise';

const noise2D = createNoise2D();

// Modeled after the existing flickeringLight.js component
const FlickeringFlame = ({ 
  position = [0, 0.2, 0], 
  color = "#ffcc77",
  randomizer = Math.random() 
}) => {
  const lightRef = useRef();
  const glowRef = useRef();
  const time = useRef(Math.random() * 1000);
  const timeOffset = Math.random() * 1000;

  // Compute light behavior based on randomizer (same approach as flickeringLight.js)
  const baseIntensity = 5 + randomizer * 5; // Between 12 and 17
  const flickerAmount = 2 + randomizer * 2; // Between 2 and 4
  const flickerSpeed = 0.0002 + randomizer * 0.0002; // Between 0.0002 and 0.0004
  const blackoutChance = 0.3 + randomizer * 0.004; // Between 0.3% and 0.7%
  const minIntensity = baseIntensity * 0.7; // Ensures the light never drops below 70% of base

  useFrame(() => {
    if (lightRef.current && glowRef.current) {
      time.current += flickerSpeed;

      let flickerFactor = noise2D(time.current * 0.1, timeOffset) * flickerAmount;

      // Introduce occasional dramatic dimming
      if (Math.random() < blackoutChance) {
        flickerFactor -= baseIntensity * (0.7 + Math.random() * 0.2); // Drops but not fully out
      }

      const currentIntensity = Math.max(minIntensity, baseIntensity + flickerFactor);
      lightRef.current.intensity = currentIntensity;
      
      // Also adjust the glow size and brightness to match the light intensity
      const scaleFactor = 0.8 + (currentIntensity / baseIntensity) * 0.4;
      glowRef.current.scale.set(scaleFactor, scaleFactor, scaleFactor);
      
      if (glowRef.current.material) {
        glowRef.current.material.opacity = 0.4 + (currentIntensity / baseIntensity) * 0.3;
      }
    }
  });

  return (
    <group position={position}>
      <pointLight
        ref={lightRef}
        color={color}
        intensity={baseIntensity}
        distance={9}
        decay={1}
        castShadow
      />
    </group>
  );
};

export default FlickeringFlame;