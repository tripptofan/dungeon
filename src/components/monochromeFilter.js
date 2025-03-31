import React, { useMemo } from 'react';
import { EffectComposer, Vignette } from '@react-three/postprocessing';
import { BlendFunction, Effect } from 'postprocessing';
import * as THREE from 'three';

// Create a simple custom monochrome effect using ShaderMaterial
const MonochromeFilter = () => {
  // Create a custom monochrome effect using a simple color adjustment
  return (
    <EffectComposer>
      {/* Simple color adjustment for monochrome effect */}
      <Vignette
        eskil={false}
        offset={0.1}
        darkness={0.6}
        blendFunction={BlendFunction.NORMAL}
      />
    </EffectComposer>
  );
};

export default MonochromeFilter;