import { Suspense, useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import styled from 'styled-components';
import useGameStore from './store';

import Dungeon from './components/dungeon';
import Player from './components/player';
import FadeOutPlane from './components/fadeOutPlane';
import ForceRender from './components/forceRender';
import MessageOverlay from './components/messageOverlay';
import ActionOverlay from './components/actionOverlay';
import StaticItems from './components/staticItems';
import AcquiredItems from './components/acquiredItems'; // Import the new component
import CameraShake from './components/cameraShake';
import DeviceDetection from './DeviceDetection';

const CanvasWrapper = styled.div`
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
`;

const StyledCanvasWrapper = styled(CanvasWrapper)`
  ${props => props.$isMobile && `
    touch-action: none;
  `}
`;

// Loading indicator shown during initial scene loading
const LoadingIndicator = styled.div`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: white;
  font-size: 1.5rem;
  letter-spacing: 0.1em;
  text-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
  z-index: 100;
`;

// Black overlay that fades out with CSS
const BlackOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: black;
  opacity: ${props => props.isVisible ? 1 : 0};
  transition: opacity 2s ease;
  pointer-events: none;
  z-index: 90;
`;

function App() {
  const isMobile = useGameStore((state) => state.isMobile);
  const sceneLoaded = useGameStore((state) => state.sceneLoaded);
  const loadingFade = useGameStore((state) => state.loadingFade);
  const setLoadingFade = useGameStore((state) => state.setLoadingFade);
  const setSceneLoaded = useGameStore((state) => state.setSceneLoaded);
  const startExperience = useGameStore((state) => state.startExperience);
  
  const [canvasKey, setCanvasKey] = useState(0);
  const [overlayVisible, setOverlayVisible] = useState(true);
  const [sceneReady, setSceneReady] = useState(false);
  
  // Initialize scene loading sequence
  useEffect(() => {
    console.log("App mounted, initializing loading sequence");
    
    // Show loading indicator initially
    setSceneLoaded(false);
    setLoadingFade(true);
    setOverlayVisible(true);
    
    // After a delay, mark scene as loaded to remove loading indicator
    const loadTimer = setTimeout(() => {
      console.log("Scene marked as loaded");
      setSceneLoaded(true);
      
      // After another delay, start the fade effect
      const fadeTimer = setTimeout(() => {
        console.log("Starting fade effect");
        setOverlayVisible(false);
        
        // After fade completes, mark scene as ready
        const readyTimer = setTimeout(() => {
          console.log("Scene fully ready");
          setSceneReady(true);
          
          // Start the experience after a brief pause
          const experienceTimer = setTimeout(() => {
            startExperience();
          }, 1000);
          
          return () => clearTimeout(experienceTimer);
        }, 3000);
        
        return () => clearTimeout(readyTimer);
      }, 1000);
      
      return () => clearTimeout(fadeTimer);
    }, 1500);
    
    return () => clearTimeout(loadTimer);
  }, [setSceneLoaded, setLoadingFade, startExperience]);
  
  // Force Canvas remount when component loads
  useEffect(() => {
    const timer = setTimeout(() => {
      setCanvasKey(prev => prev + 1);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <DeviceDetection />
      
      <StyledCanvasWrapper $isMobile={isMobile}>
        <Canvas 
          key={canvasKey}
          style={{ background: 'black' }}
          gl={{ 
            powerPreference: "high-performance",
            antialias: true,
            stencil: false,
            depth: true 
          }}
          camera={{
            fov: 75,
            near: 0.1,
            far: 1000,
            position: [5, 2, 5]
          }}
          resize={{ scroll: false, debounce: { scroll: 50, resize: 0 } }}
        >
          <Suspense fallback={null}>
            <ambientLight intensity={0.8} />
            <Dungeon />
            <Player />
            <StaticItems />
            {/* Move AcquiredItems to after everything else */}
            {loadingFade && <FadeOutPlane />}
            <ForceRender />
            <CameraShake />
            {/* Add AcquiredItems as the last component to ensure it's on top */}
            <AcquiredItems />
          </Suspense>

        </Canvas>
        
        {/* CSS-based black overlay - provides a backup fade mechanism */}
        <BlackOverlay isVisible={overlayVisible} />
        
        {/* Only show loading indicator when scene isn't loaded */}
        {!sceneLoaded && (
          <LoadingIndicator>
            Loading Experience...
          </LoadingIndicator>
        )}
        
        {/* Show UI components when scene is ready */}
        {sceneReady && (
          <>
            <MessageOverlay />
            <ActionOverlay />
          </>
        )}
      </StyledCanvasWrapper>
    </>
  );
}

export default App;