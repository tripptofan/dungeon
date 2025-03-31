import React from 'react';
import { EffectComposer, HueSaturation, BrightnessContrast } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';

const PastelEffect = () => {
  return (
    <EffectComposer>
      {/* Simple hue and saturation adjustment */}
      <HueSaturation
        blendFunction={BlendFunction.NORMAL}
        hue={0.05} // Subtle hue shift
        saturation={0.7} // Reduce saturation for pastel look
      />
      
      {/* Brightness and contrast adjustment */}
      <BrightnessContrast
        brightness={0.1} // Slight brightness boost
        contrast={-0.5} // Reduce contrast for softer look
        blendFunction={BlendFunction.NORMAL}
      />
    </EffectComposer>
  );
};

export default PastelEffect;