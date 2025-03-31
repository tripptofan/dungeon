import { useMemo } from 'react';
import * as THREE from 'three';
import { useLoader } from '@react-three/fiber';

// Pastel color presets
export const PASTEL_PRESETS = {
  lavender: { hueShift: 0.75, saturation: 0.6, lightness: 1.2 },
  mint: { hueShift: 0.4, saturation: 0.6, lightness: 1.15 },
  peach: { hueShift: 0.07, saturation: 0.7, lightness: 1.1 },
  babyBlue: { hueShift: 0.57, saturation: 0.65, lightness: 1.2 },
  rosePink: { hueShift: 0.95, saturation: 0.7, lightness: 1.1 }
};

// Hook to create a hue-shifted texture
export const useHueShiftedTexture = (path, hueShift = 0.3, saturation = 0.8, lightness = 1.1) => {
  const texture = useLoader(THREE.TextureLoader, path);
  
  // Create hue-shifted material
  const material = useMemo(() => {
    if (!texture) return null;
    
    // Configure texture properties
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.colorSpace = THREE.SRGBColorSpace;
    
    return new THREE.ShaderMaterial({
      uniforms: {
        baseTexture: { value: texture },
        hueShift: { value: hueShift },
        saturationScale: { value: saturation },
        lightnessScale: { value: lightness }
      },
      vertexShader: `
        varying vec2 vUv;
        
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D baseTexture;
        uniform float hueShift;
        uniform float saturationScale;
        uniform float lightnessScale;
        varying vec2 vUv;
        
        // Function to convert RGB to HSL
        vec3 rgb2hsl(vec3 color) {
          float maxColor = max(max(color.r, color.g), color.b);
          float minColor = min(min(color.r, color.g), color.b);
          float delta = maxColor - minColor;
          
          float h = 0.0;
          float s = 0.0;
          float l = (maxColor + minColor) / 2.0;
          
          if (delta > 0.0) {
            s = l < 0.5 ? delta / (maxColor + minColor) : delta / (2.0 - maxColor - minColor);
            
            if (maxColor == color.r) {
              h = (color.g - color.b) / delta + (color.g < color.b ? 6.0 : 0.0);
            } else if (maxColor == color.g) {
              h = (color.b - color.r) / delta + 2.0;
            } else {
              h = (color.r - color.g) / delta + 4.0;
            }
            h /= 6.0;
          }
          
          return vec3(h, s, l);
        }
        
        // Function to convert HSL to RGB
        float hue2rgb(float p, float q, float t) {
          if (t < 0.0) t += 1.0;
          if (t > 1.0) t -= 1.0;
          if (t < 1.0/6.0) return p + (q - p) * 6.0 * t;
          if (t < 1.0/2.0) return q;
          if (t < 2.0/3.0) return p + (q - p) * (2.0/3.0 - t) * 6.0;
          return p;
        }
        
        vec3 hsl2rgb(vec3 hsl) {
          float h = hsl.x;
          float s = hsl.y;
          float l = hsl.z;
          
          float r, g, b;
          
          if (s == 0.0) {
            r = g = b = l; // achromatic
          } else {
            float q = l < 0.5 ? l * (1.0 + s) : l + s - l * s;
            float p = 2.0 * l - q;
            r = hue2rgb(p, q, h + 1.0/3.0);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1.0/3.0);
          }
          
          return vec3(r, g, b);
        }
        
        void main() {
          // Get original texture color
          vec4 texColor = texture2D(baseTexture, vUv);
          
          // If fully transparent, don't process
          if (texColor.a <= 0.01) {
            gl_FragColor = texColor;
            return;
          }
          
          // Convert to HSL
          vec3 hsl = rgb2hsl(texColor.rgb);
          
          // Apply hue shift (add and wrap around 0-1)
          hsl.x = fract(hsl.x + hueShift);
          
          // Adjust saturation and lightness for pastel look
          hsl.y *= saturationScale; // Lower saturation for pastel
          hsl.z = clamp(hsl.z * lightnessScale, 0.0, 1.0); // Increase lightness
          
          // Convert back to RGB
          vec3 shiftedRgb = hsl2rgb(hsl);
          
          // Output final color
          gl_FragColor = vec4(shiftedRgb, texColor.a);
        }
      `,
      transparent: true,
      side: THREE.DoubleSide
    });
  }, [texture, hueShift, saturation, lightness]);
  
  return { texture, material };
};