import React from 'react';
import { EffectComposer, Sepia, Vignette } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';

// An intensified vintage/retro filter effect with high browser compatibility
const VintageFilter = () => {
  return (
    <EffectComposer>
      {/* Intensified Sepia for stronger vintage color tone */}
      <Sepia
        intensity={0.55} // Increased from 0.6 for stronger effect
        blendFunction={BlendFunction.NORMAL}
      />
      
      {/* Enhanced Vignette for more dramatic darkened edges */}
      <Vignette
        eskil={false}
        offset={0.3} // Decreased to extend the vignette effect further into the image
        darkness={0.65} // Increased from 0.5 for darker edges
        blendFunction={BlendFunction.NORMAL}
      />
    </EffectComposer>
  );
};

export default VintageFilter;