import React, { useEffect } from 'react';
import * as THREE from 'three';
import { useLoader } from '@react-three/fiber';

// This function converts a regular texture to a pastel version
const transformToPastel = (texture) => {
  if (!texture || !texture.image) return texture;

  // Create a canvas to manipulate pixel data
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  
  canvas.width = texture.image.width;
  canvas.height = texture.image.height;
  
  // Draw original image to canvas
  context.drawImage(texture.image, 0, 0);
  
  // Get pixel data
  const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  
  // Pastel transformation settings
  const brightnessBoost = 0.2;  // Increase brightness
  const saturationReduce = 0.25; // Reduce saturation 
  const pastelShift = 0.15;     // Shift colors toward pastel hues
  
  // Process each pixel
  for (let i = 0; i < data.length; i += 4) {
    // Get RGB values
    let r = data[i];
    let g = data[i + 1];
    let b = data[i + 2];
    
    // Convert to HSL (simplified conversion)
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;
    
    if (max === min) {
      h = s = 0; // achromatic
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      
      h /= 6;
    }
    
    // Adjust HSL for pastel effect
    l = Math.min(1, l + brightnessBoost);
    s = Math.max(0, s * (1 - saturationReduce));
    
    // Shift hue slightly toward pastel tones
    h = ((h + pastelShift) % 1);
    
    // Convert back to RGB (simplified)
    let r1, g1, b1;
    
    function hueToRgb(p, q, t) {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    }
    
    if (s === 0) {
      r1 = g1 = b1 = l;
    } else {
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      
      r1 = hueToRgb(p, q, h + 1/3);
      g1 = hueToRgb(p, q, h);
      b1 = hueToRgb(p, q, h - 1/3);
    }
    
    // Set new RGB values
    data[i] = Math.round(r1 * 255);
    data[i + 1] = Math.round(g1 * 255);
    data[i + 2] = Math.round(b1 * 255);
  }
  
  // Update image with new data
  context.putImageData(imageData, 0, 0);
  
  // Create new texture from manipulated canvas
  const newTexture = new THREE.Texture(canvas);
  newTexture.needsUpdate = true;
  
  // Copy necessary properties from the original texture
  newTexture.wrapS = texture.wrapS;
  newTexture.wrapT = texture.wrapT;
  newTexture.repeat = texture.repeat.clone();
  newTexture.offset = texture.offset.clone();
  newTexture.center = texture.center.clone();
  newTexture.rotation = texture.rotation;
  
  return newTexture;
};

// Usage example for transforming a texture
export const usePastelTexture = (path) => {
  const originalTexture = useLoader(THREE.TextureLoader, path);
  const [pastelTexture, setPastelTexture] = React.useState(null);
  
  useEffect(() => {
    if (originalTexture) {
      const transformed = transformToPastel(originalTexture);
      setPastelTexture(transformed);
    }
  }, [originalTexture]);
  
  return pastelTexture || originalTexture;
};

// Component that globally transforms textures
const PastelTextureModifier = () => {
  // This component doesn't render anything visible
  // It works by globally modifying textures
  
  // You could add global texture modification logic here
  // But for now, we'll use the hook approach for individual textures
  
  return null;
};

export default PastelTextureModifier;