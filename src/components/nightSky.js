import React, { useRef, useMemo } from 'react';
import * as THREE from 'three';
import useGameStore from '../store';

// Constants for performance tuning
const STAR_COUNT = 800; // Reduced number of stars
const SKY_RADIUS = 500; // Far enough to be a backdrop, but not too far
const MIN_Y_POSITION = 10; // Only generate stars above this Y value

const NightSky = () => {
  const skyRef = useRef();
  const isMobile = useGameStore((state) => state.isMobile);
  
  // Generate stars only once using useMemo
  // Use fewer stars on mobile
  const actualStarCount = isMobile ? Math.floor(STAR_COUNT * 0.6) : STAR_COUNT;
  
  const starsGeometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry();
    const positions = [];
    const colors = [];
    const sizes = [];
    
    // Counter to ensure we generate enough valid stars
    let validStarsCount = 0;
    let attempts = 0;
    const maxAttempts = actualStarCount * 3; // Prevent infinite loops
    
    // Distribute stars evenly in a dome shape above the dungeon
    while (validStarsCount < actualStarCount && attempts < maxAttempts) {
      attempts++;
      
      // Use hemisphere distribution for stars (only above the dungeon)
      const theta = Math.random() * Math.PI / 2; // Vertical angle (0 to PI/2 - only top hemisphere)
      const phi = Math.random() * Math.PI * 2; // Horizontal angle (0 to 2PI)
      
      // Convert spherical to Cartesian coordinates
      const x = SKY_RADIUS * Math.sin(theta) * Math.cos(phi);
      const y = SKY_RADIUS * Math.cos(theta); // Y is up
      const z = SKY_RADIUS * Math.sin(theta) * Math.sin(phi);
      
      // Skip stars below the minimum Y position
      if (y < MIN_Y_POSITION) {
        continue;
      }
      
      // Add the position
      positions.push(x, y, z);
      
      // Vary star colors slightly
      const r = 0.9 + Math.random() * 0.1; // Mostly white
      const g = 0.9 + Math.random() * 0.1;
      const b = 1.0; // Full blue for slight blue tint
      colors.push(r, g, b);
      
      // Vary star sizes - smaller variance for more uniform look
      const size = 0.7 + Math.random() * 1.0;
      sizes.push(size);
      
      validStarsCount++;
    }
    
    // Create buffer attributes
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1));
    
    return geometry;
  }, [actualStarCount, isMobile]);
  
  // Create material only once with useMemo
  const starsMaterial = useMemo(() => {
    const vertexShader = `
      attribute float size;
      varying vec3 vColor;
      void main() {
        vColor = color;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = size * (300.0 / -mvPosition.z);
        gl_Position = projectionMatrix * mvPosition;
      }
    `;
    
    const fragmentShader = `
      varying vec3 vColor;
      void main() {
        // Create circular points with soft edges
        float r = distance(gl_PointCoord, vec2(0.5, 0.5));
        if (r > 0.5) discard;
        
        // Fade out edges for more natural stars
        float alpha = 1.0 - smoothstep(0.2, 0.5, r);
        gl_FragColor = vec4(vColor, alpha);
      }
    `;
    
    return new THREE.ShaderMaterial({
      uniforms: {},
      vertexShader,
      fragmentShader,
      blending: THREE.AdditiveBlending,
      depthTest: false, // No depth testing for stars
      transparent: true,
      vertexColors: true
    });
  }, []);
  
  // No rotation or animation - stars are static now
  
  return (
    <points ref={skyRef} geometry={starsGeometry} material={starsMaterial} />
  );
};

export default React.memo(NightSky);