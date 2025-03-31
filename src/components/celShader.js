import React, { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { extend, useFrame } from '@react-three/fiber';

// Cel-shading effect with edge detection
// This component creates shaders for cel-shading and outlines

// Vertex shader for the cel shading effect
const celVertexShader = `
  varying vec3 vNormal;
  varying vec3 vViewPosition;
  
  void main() {
    vNormal = normalize(normalMatrix * normal);
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vViewPosition = -mvPosition.xyz;
    gl_Position = projectionMatrix * mvPosition;
  }
`;

// Fragment shader for the cel shading effect
const celFragmentShader = `
  varying vec3 vNormal;
  varying vec3 vViewPosition;
  
  uniform vec3 uColor;
  uniform float uBands;
  
  void main() {
    vec3 normal = normalize(vNormal);
    vec3 viewDir = normalize(vViewPosition);
    
    // Calculate lighting (simple Lambertian diffuse)
    float diffuse = dot(normal, vec3(0.0, 1.0, 0.5));
    
    // Quantize the lighting to create bands (cel shading)
    diffuse = ceil(diffuse * uBands) / uBands;
    
    // Final color with cel shading
    vec3 color = uColor * diffuse;
    
    gl_FragColor = vec4(color, 1.0);
  }
`;

// Edge detection vertex shader
const edgeVertexShader = `
  varying vec3 vNormal;
  varying vec3 vViewPosition;
  
  void main() {
    vNormal = normalize(normalMatrix * normal);
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vViewPosition = -mvPosition.xyz;
    gl_Position = projectionMatrix * mvPosition;
  }
`;

// Edge detection fragment shader
const edgeFragmentShader = `
  varying vec3 vNormal;
  varying vec3 vViewPosition;
  
  uniform vec3 uEdgeColor;
  uniform float uEdgeThickness;
  
  void main() {
    vec3 normal = normalize(vNormal);
    vec3 viewDir = normalize(vViewPosition);
    
    // Calculate rim lighting effect for edges
    float rimFactor = 1.0 - max(0.0, dot(normal, viewDir));
    rimFactor = smoothstep(1.0 - uEdgeThickness, 1.0, rimFactor);
    
    // Apply edge color
    vec3 finalColor = mix(vec3(0.0), uEdgeColor, rimFactor);
    
    gl_FragColor = vec4(finalColor, rimFactor);
  }
`;

// Create the cel shader material
class CelShaderMaterial extends THREE.ShaderMaterial {
  constructor() {
    super({
      vertexShader: celVertexShader,
      fragmentShader: celFragmentShader,
      uniforms: {
        uColor: { value: new THREE.Color(0x44aadd) },
        uBands: { value: 4.0 }
      }
    });
  }
}

// Create the edge detection material
class EdgeShaderMaterial extends THREE.ShaderMaterial {
  constructor() {
    super({
      vertexShader: edgeVertexShader,
      fragmentShader: edgeFragmentShader,
      uniforms: {
        uEdgeColor: { value: new THREE.Color(0x000000) },
        uEdgeThickness: { value: 0.6 }
      },
      transparent: true,
      side: THREE.BackSide // Draw backside to create outline
    });
  }
}

// Register the custom materials
extend({ CelShaderMaterial, EdgeShaderMaterial });

// Hook to use cel shading on a mesh
export const useCelShader = (props = {}) => {
  const celRef = useRef();
  const edgeRef = useRef();
  
  // Default colors
  const color = props.color || '#44aadd';
  const edgeColor = props.edgeColor || '#000000';
  const bands = props.bands || 4.0;
  const edgeThickness = props.edgeThickness || 0.6;
  
  // Update uniforms when props change
  useFrame(() => {
    if (celRef.current) {
      celRef.current.uniforms.uColor.value.set(color);
      celRef.current.uniforms.uBands.value = bands;
    }
    
    if (edgeRef.current) {
      edgeRef.current.uniforms.uEdgeColor.value.set(edgeColor);
      edgeRef.current.uniforms.uEdgeThickness.value = edgeThickness;
    }
  });
  
  return { celRef, edgeRef };
};

// Component for cel-shaded mesh
export const CelShaded = ({ geometry, scale = 1.0, position = [0, 0, 0], color = '#44aadd', edgeColor = '#000000', bands = 4.0, edgeThickness = 0.6 }) => {
  const { celRef, edgeRef } = useCelShader({ color, edgeColor, bands, edgeThickness });
  
  return (
    <group position={position} scale={[scale, scale, scale]}>
      {/* Main cel-shaded mesh */}
      <mesh>
        {geometry}
        <celShaderMaterial ref={celRef} />
      </mesh>
      
      {/* Slightly larger mesh with edge shader for outline */}
      <mesh scale={[1.05, 1.05, 1.05]}>
        {geometry}
        <edgeShaderMaterial ref={edgeRef} />
      </mesh>
    </group>
  );
};

export default CelShaded;