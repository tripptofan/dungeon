import React from 'react';
import { EffectComposer, Sepia, Vignette } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';

// A set of highly reliable color filters that work well across browsers
const ReliableColorFilters = () => {
  return (
    <EffectComposer>
      {/* Sepia is one of the most reliable color filters */}
      <Sepia
        intensity={0.5} // Adjust from 0 to 1
        blendFunction={BlendFunction.NORMAL}
      />
      
      {/* Vignette is also very stable across browsers */}
      <Vignette
        eskil={false}
        offset={0.1}
        darkness={0.5}
        blendFunction={BlendFunction.NORMAL}
      />
    </EffectComposer>
  );
};

export default ReliableColorFilters;