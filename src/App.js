import { Suspense, useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import styled from 'styled-components';
import useGameStore from './store';

// Import the TextureProvider
import { TextureProvider } from './utils/textureManagement';

// Import 3D Scene Components
import Dungeon from './components/dungeon';
import Player from './components/player';
import FadeEffect from './components/FadeEffect'; // Replace FadeOutPlane with FadeEffect
import ForceRender from './components/forceRender';
import MessageOverlay3D from './components/messageOverlay3D';
import ActionOverlay from './components/actionOverlay';
import StaticItems from './components/staticItems';
import AcquiredItems from './components/acquiredItems';
import CameraShake from './components/cameraShake';
import DeviceDetection from './DeviceDetection';
import Enemy from './components/enemy';
import SimpleFpsLimiter from './components/SimpleFpsLimiter';
import { initializeGA } from './utils/GoogleAnalytics';

// Commenting out LookAroundControl to disable it
// import LookAroundControl from './components/lookAroundControl';

import Prize from './components/prize';
// import AmbientNightLight from './components/ambientNightLight';
import PrizeInteractionOverlay from './components/prizeInteractionOverlay';
import BlackScreen from './components/BlackScreen';
import Eye from './components/eye';

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

// Add loading progress bar
const LoadingProgressContainer = styled.div`
  position: fixed;
  bottom: 20%;
  left: 50%;
  transform: translateX(-50%);
  width: 60%;
  max-width: 400px;
  height: 8px;
  background-color: rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  overflow: hidden;
  z-index: 100;
`;

const LoadingProgressBar = styled.div`
  height: 100%;
  background-color: #3a86ff;
  width: ${props => props.progress}%;
  transition: width 0.3s ease;
`;

// Black overlay that fades out with CSS
const BlackOverlay = styled.div.withConfig({
  shouldForwardProp: (prop) => !['isVisible'].includes(prop)
})`
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

const CanvasWrapper = styled.div`
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
`;


const StyledCanvasWrapper = styled(CanvasWrapper)`
  /* Always disable default touch actions on mobile for custom touch handling */
  ${props => props.$isMobile && `
    touch-action: none;
    user-select: none;
    -webkit-user-select: none;
    -webkit-touch-callout: none;
  `}
  
  /* Ensure look-around functionality always works with overlays */
  @media (max-width: 768px) {
    canvas {
      touch-action: none !important;
    }
  }
`;
// Performance info overlay for development
const PerformanceInfo = styled.div`
  position: fixed;
  top: 10px;
  right: 10px;
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 10px;
  border-radius: 4px;
  font-size: 12px;
  font-family: monospace;
  z-index: 1000;
  display: ${props => props.visible ? 'block' : 'none'};
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
  const [textureProgress, setTextureProgress] = useState(0);
  const [fps, setFps] = useState(0);
  const [showPerformance, setShowPerformance] = useState(process.env.NODE_ENV === 'development');

  // FPS counter
  useEffect(() => {
    if (!showPerformance) return;

    let frameCount = 0;
    let lastTime = performance.now();

    const updateFps = () => {
      const now = performance.now();
      frameCount++;

      if (now >= lastTime + 1000) {
        setFps(Math.round((frameCount * 1000) / (now - lastTime)));
        frameCount = 0;
        lastTime = now;
      }

      requestAnimationFrame(updateFps);
    };

    const animId = requestAnimationFrame(updateFps);
    return () => cancelAnimationFrame(animId);
  }, [showPerformance]);

  // Initialize scene loading sequence
  useEffect(() => {
    initializeGA();
    // Show loading indicator initially
    setSceneLoaded(false);
    setLoadingFade(true);
    setOverlayVisible(true);

    // After a delay, mark scene as loaded to remove loading indicator
    const loadTimer = setTimeout(() => {
      // First signal that textures are loaded
      setSceneLoaded(true);

      // After another delay, start the fade effect and begin hiding the CSS overlay
      const fadeTimer = setTimeout(() => {
        setOverlayVisible(false);

        // We'll keep the loadingFade state true so the FadeEffect component can manage the transition
        // The FadeEffect will wait for the scene to be fully rendered before starting its animation

        // After fade completes, mark scene as ready
        const readyTimer = setTimeout(() => {
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

  // Handle texture loading progress
  const handleTextureProgress = (progress) => {
    setTextureProgress(progress);
  };

  return (
    <>
      <SimpleFpsLimiter targetFps={60} />
      <DeviceDetection />

      <StyledCanvasWrapper $isMobile={isMobile}>
        <Canvas
          key={canvasKey}
          style={{ background: 'rgb(2,0,20)' }}
          gl={{
            powerPreference: "high-performance",
            antialias: isMobile ? false : true,
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
          {/* Wrap entire scene in TextureProvider to provide shared materials */}
          <TextureProvider onProgress={handleTextureProgress}>
            <Suspense fallback={null}>
              <Dungeon />
              <Player />
              {/* <AmbientNightLight /> */}
              <StaticItems />
              {/* <Eye
                position={[5.05, 2, 5.2]}
                scale={[.1, .1]}
              />
              <Eye
                position={[4.95, 2, 5.2]}
                scale={[.1, .1]}
              /> */}
              {/* <EyesPlane /> */}
              {/* Use our new FadeEffect instead of FadeOutPlane */}
              {loadingFade && <FadeEffect />}
              <ForceRender />
              <CameraShake />
              <AcquiredItems />
              <Enemy />
              <Prize />
              {/* Commenting out LookAroundControl to disable it */}
              {/* <LookAroundControl /> */}
              
              {/* 3D Scene Overlays */}
              {sceneReady && (
                <>
                  <MessageOverlay3D />

                </>
              )}
            </Suspense>
          </TextureProvider>
        </Canvas>

        {/* UI components */}
        <BlackOverlay isVisible={overlayVisible} />

        {!sceneLoaded && (
          <>
            <LoadingIndicator>
              Loading...
            </LoadingIndicator>
            <LoadingProgressContainer>
              <LoadingProgressBar progress={textureProgress} />
            </LoadingProgressContainer>
          </>
        )}

        {sceneReady && (
          <>
            <ActionOverlay />
            {/* <LookAroundIndicator /> */}
            <PrizeInteractionOverlay />
            <BlackScreen /> 
          </>
        )}

        {/* Performance monitoring for development */}
        {/* {showPerformance && (
          <PerformanceInfo visible={true}>
            <div>FPS: {fps}</div>
            <div>Device: {isMobile ? 'Mobile' : 'Desktop'}</div>
          </PerformanceInfo>
        )} */}
      </StyledCanvasWrapper>
    </>
  );
}

export default App;