import React from 'react';
import { EffectComposer, HueSaturation, Vignette } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';

// A simple desaturation filter - creates a near-monochrome look
const DesaturationFilter = () => {
  return (
    <EffectComposer>
      {/* Use HueSaturation with very low saturation for near-monochrome effect */}
      <HueSaturation
        saturation={0.05} // Almost no color, but keeps a tiny bit
        hue={0}
        blendFunction={BlendFunction.NORMAL}
      />
      
      {/* Vignette for added contrast */}
      <Vignette
        eskil={false}
        offset={0.3}
        darkness={0.5}
        blendFunction={BlendFunction.NORMAL}
      />
    </EffectComposer>
  );
};

export default DesaturationFilter;