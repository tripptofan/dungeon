import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Constants for performance tuning
const STAR_COUNT = 1000; // Reasonable number of stars
const SKY_RADIUS = 500; // Far enough to be a backdrop, but not too far
const ROTATION_SPEED = 0.0001; // Very slow rotation for subtle effect

const NightSky = () => {
  const skyRef = useRef();
  
  // Generate stars only once using useMemo
  const starsGeometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry();
    const positions = [];
    const colors = [];
    const sizes = [];
    
    // Distribute stars evenly in a dome shape above the dungeon
    for (let i = 0; i < STAR_COUNT; i++) {
      // Use hemisphere distribution for stars (only above the dungeon)
      const theta = Math.random() * Math.PI; // Vertical angle (0 to PI)
      const phi = Math.random() * Math.PI * 2; // Horizontal angle (0 to 2PI)
      
      // Convert spherical to Cartesian coordinates
      const x = SKY_RADIUS * Math.sin(theta) * Math.cos(phi);
      const y = SKY_RADIUS * Math.cos(theta); // Y is up
      const z = SKY_RADIUS * Math.sin(theta) * Math.sin(phi);
      
      positions.push(x, y, z);
      
      // Vary star colors slightly
      const r = 0.9 + Math.random() * 0.1; // Mostly white
      const g = 0.9 + Math.random() * 0.1;
      const b = 1.0; // Full blue for slight blue tint
      colors.push(r, g, b);
      
      // Vary star sizes
      const size = 0.5 + Math.random() * 1.5;
      sizes.push(size);
    }
    
    // Create buffer attributes
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1));
    
    return geometry;
  }, []);
  
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
  
  // Very slow rotation of the sky
  useFrame(() => {
    if (skyRef.current) {
      skyRef.current.rotation.y += ROTATION_SPEED;
    }
  });
  
  return (
    <points ref={skyRef} geometry={starsGeometry} material={starsMaterial} />
  );
};

export default React.memo(NightSky);