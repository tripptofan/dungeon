import React, { useRef, useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { EffectComposer, Outline } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import { Color } from 'three';
import useGameStore from '../store';

// Component that adds cartoon-style outlines to selected objects
const OutlineEffect = ({ objects = [] }) => {
  const { size } = useThree();
  
  // Get item visibility flag from store
  const showItemDisplay = useGameStore(state => state.showItemDisplay);
  const forceItemsVisible = useGameStore(state => state.forceItemsVisible);
  
  // Filter out any null or undefined objects
  const validObjects = objects.filter(obj => obj);
  
  // Only render outline when items should be visible
  // For testing purposes, we'll keep this always true
  const shouldRenderOutline = true; // showItemDisplay || forceItemsVisible;
  
  // Log for debugging
  useEffect(() => {
    console.log("OutlineEffect: Valid objects:", validObjects.length);
    if (validObjects.length > 0) {
      console.log("Sample object:", validObjects[0]);
    }
  }, [validObjects]);
  
  // Don't render if no objects or shouldn't be visible
  if (!shouldRenderOutline || validObjects.length === 0) {
    return null;
  }
  
  return (
    <EffectComposer>
      <Outline 
        selection={validObjects}
        edgeStrength={10}
        edgeGlow={0}
        edgeThickness={1}
        pulseSpeed={0}
        visibleEdgeColor={0x000000}
        hiddenEdgeColor={0x000000}
        blur={false}
        xRay={true}
      />
    </EffectComposer>
  );
};

export default OutlineEffect;
