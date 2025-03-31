import React, { useMemo } from 'react';
import { EffectComposer, HueSaturation, BrightnessContrast, ToneMapping, Bloom } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';

const EnhancedPastelEffect = ({ enabled = true }) => {
  // Pastel colors need soft, slightly desaturated but clearly colorful appearance
  const pastelSettings = useMemo(() => ({
    // HueSaturation
    hue: 0.02,          // Very subtle hue shift
    saturation: 0.85,   // Keep more of the original saturation
    
    // BrightnessContrast
    brightness: 0.12,   // Slightly increase brightness
    contrast: -0.15,    // Reduce contrast for a softer look
    
    // Bloom
    bloomIntensity: 0.35,      // Medium bloom effect
    bloomLuminanceThreshold: 0.6, // Start bloom at this brightness level
    
    // Tone mapping
    toneMapping: {
      middleGrey: 0.6,    // Mid-point of the tonal range
      maxLuminance: 2.0   // Maximum luminance
    }
  }), []);

  if (!enabled) return null;

  return (
    <EffectComposer>
      {/* Adjust hue and saturation for pastel-like colors */}
      <HueSaturation
        blendFunction={BlendFunction.NORMAL}
        hue={pastelSettings.hue}
        saturation={pastelSettings.saturation}
      />
      
      {/* Adjust brightness and contrast for softer appearance */}
      <BrightnessContrast
        brightness={pastelSettings.brightness}
        contrast={pastelSettings.contrast}
        blendFunction={BlendFunction.NORMAL}
      />
      
      {/* Add bloom effect for that dreamy pastel glow */}
      <Bloom
        intensity={pastelSettings.bloomIntensity}
        luminanceThreshold={pastelSettings.bloomLuminanceThreshold}
        luminanceSmoothing={0.025}
        blendFunction={BlendFunction.SCREEN}
      />
      
      {/* Apply tone mapping to balance the overall brightness */}
      <ToneMapping
        blendFunction={BlendFunction.NORMAL}
        adaptive={true}
        resolution={256}
        middleGrey={pastelSettings.toneMapping.middleGrey}
        maxLuminance={pastelSettings.toneMapping.maxLuminance}
        averageLuminance={1.0}
        adaptationRate={1.0}
      />
    </EffectComposer>
  );
};

export default EnhancedPastelEffect;