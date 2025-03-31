import React from 'react';
import { EffectComposer, HueSaturation, BrightnessContrast } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';

// A simpler color effect that only uses basic adjustments
const SimpleColorEffect = () => {
  return (
    <EffectComposer>
      {/* Simple hue and saturation adjustment */}
      <HueSaturation
        blendFunction={BlendFunction.NORMAL}
        hue={0.1} // Slight hue shift
        saturation={1.2} // Slightly increase saturation
      />
      
      {/* Simple brightness and contrast adjustment */}
      <BrightnessContrast
        brightness={0.05} // Subtle brightness increase
        contrast={0.1} // Subtle contrast increase
        blendFunction={BlendFunction.NORMAL}
      />
    </EffectComposer>
  );
};

export default SimpleColorEffect;