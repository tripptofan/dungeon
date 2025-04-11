import React, { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { EffectComposer } from '@react-three/postprocessing';
import useGameStore from '../store';
import { FadeEffectImpl } from './effects/FadeEffectImpl';

// Wrapper component to control fade duration and timing
const FadeEffect = () => {
  const { sceneLoaded, loadingFade, setLoadingFade } = useGameStore();
  const fadeRef = useRef(null);
  const effectRef = useRef(null);
  const startTimeRef = useRef(null);
  const fadeInProgress = useRef(false);
  const hasSetupFade = useRef(false);
  const firstRenderCompletedRef = useRef(false);
  const frameCountRef = useRef(0);
  
  // Configuration
  const fadeDuration = 2.5; // Total fade duration in seconds
  const fadeDelay = 0.5; // Delay before starting fade
  const requiredFramesForStableRender = 10; // Number of frames to wait for stable rendering

  // Create a ref to hold our custom effect instance
  useEffect(() => {
    if (!effectRef.current) {
      effectRef.current = new FadeEffectImpl();
      
      // If we already have a reference to the effect composer, add our effect
      if (fadeRef.current && fadeRef.current.addEffect) {
        fadeRef.current.addEffect(effectRef.current);
      }
    }
    
    return () => {
      // Clean up the effect when the component unmounts
      if (fadeRef.current && fadeRef.current.removeEffect && effectRef.current) {
        fadeRef.current.removeEffect(effectRef.current);
      }
    };
  }, []);

  // Set opacity to 0 when not in use, but don't skip the render
  // This avoids the React hooks conditional rendering issue
  useEffect(() => {
    if (!loadingFade && !fadeInProgress.current && effectRef.current) {
      effectRef.current.setOpacity(0);
    }
  }, [loadingFade]);

  // Initial setup and stable render detection
  useFrame(() => {
    // Wait for multiple frames to ensure stable rendering
    if (sceneLoaded && !firstRenderCompletedRef.current) {
      frameCountRef.current++;
      
      // Only consider the scene stable after multiple frames have been rendered
      if (frameCountRef.current >= requiredFramesForStableRender) {
        console.log(`Rendered ${requiredFramesForStableRender} frames, scene is stable and ready for fade effect`);
        firstRenderCompletedRef.current = true;
        
        // If fade was supposed to start, we can now safely initialize it
        if (loadingFade && !hasSetupFade.current && !fadeInProgress.current) {
          console.log("Scene rendering stable, initializing fade effect");
          hasSetupFade.current = true;
          
          // Set initial opacity to fully black (1.0)
          if (effectRef.current) {
            effectRef.current.setOpacity(1.0);
          }
          
          // Start the fade after a short delay
          setTimeout(() => {
            console.log("Starting fade animation");
            startTimeRef.current = Date.now();
            fadeInProgress.current = true;
          }, fadeDelay * 1000);
        }
      }
    }
    
    // Animation frame processing for fade effect
    if (fadeInProgress.current && startTimeRef.current !== null && effectRef.current) {
      // Calculate progress based on elapsed time
      const elapsedTime = (Date.now() - startTimeRef.current) / 1000; // convert to seconds
      const progress = Math.min(elapsedTime / fadeDuration, 1.0);
      
      // Calculate new opacity (1.0 -> 0.0)
      const newOpacity = Math.max(0, 1.0 - progress);
      
      // Update opacity through our custom method
      effectRef.current.setOpacity(newOpacity);
      
      // Check if fade is complete
      if (progress >= 1.0) {
        fadeInProgress.current = false;
        setLoadingFade(false);
      }
    }
  });

  // We no longer need the old approach as we handle everything in the useFrame hook
  // This useEffect is now mainly for cleanup
  useEffect(() => {
    return () => {
      // Cleanup function for component unmounting
      fadeInProgress.current = false;
      hasSetupFade.current = false;
      startTimeRef.current = null;
      firstRenderCompletedRef.current = false;
      frameCountRef.current = 0;
    };
  }, []);

  // Only render the EffectComposer when needed to avoid performance impact
  // But we've moved the conditional logic to inside a useEffect to avoid hook rule violations
  const shouldRender = loadingFade || fadeInProgress.current;
  
  return (
    <>
      {shouldRender && (
        <EffectComposer ref={fadeRef}>
          {/* No need to add child effects here as we're adding them programmatically */}
        </EffectComposer>
      )}
    </>
  );
};

export default FadeEffect;