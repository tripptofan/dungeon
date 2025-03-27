import { Suspense, useState, useEffect} from 'react';
import { Canvas } from '@react-three/fiber';
import { useProgress } from '@react-three/drei';

import styled from 'styled-components';
import useGameStore from './store';

import Dungeon from './components/dungeon';
import Player from './components/player';
import Overlay from './components/overlay';
import FadeOutPlane from './components/fadeOutPlane';


const CanvasWrapper = styled.div`
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
`;



function App() {
  const isMobile = useGameStore((state) => state.isMobile);

  return (
    <>
      <CanvasWrapper isMobile={isMobile}>
        <Canvas style={{ background: 'black' }}>
          <Suspense fallback={null}>
            <ambientLight intensity={0.2} />
            <Dungeon />
            <Player />
            <FadeOutPlane />
          </Suspense>
        </Canvas>
      </CanvasWrapper>
      <Overlay />
    </>
  );
}

export default App;
