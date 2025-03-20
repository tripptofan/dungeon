import { Canvas } from '@react-three/fiber';
import styled from 'styled-components';
import useGameStore from './store'; // Import the store

import Dungeon from './components/dungeon';
import Player from './components/player';
import Overlay from './components/overlay';

const CanvasWrapper = styled.div`
  position: relative;
  width: 100vw;
  height: ${(props) => (props.isMobile ? '66vh' : '100vh')}; // Use 66vh for mobile, 100vh for desktop
  overflow: hidden;
`;

const ControlInterface = styled.div`
  position: absolute;
  bottom: 0;
  width: 100%;
  height: 33.33%; /* 1/3 of the screen height */
  background-color: black;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const ControlCircle = styled.div`
  position: relative;
  width: 200px;
  height: 200px;
  background-color: transparent;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
  transform: rotate(45deg); /* Rotate the circle by 45 degrees */
`;

const ControlButton = styled.button`
  position: absolute;
  width: 50%;
  height: 50%;
  background-color: green;
  cursor: pointer;
  transition: transform 0.2s ease;

  /* Button press animation */
  &:active {
    transform: scale(0.9);
  }

  /* Define the positions of the 4 buttons based on the rotation */
  &:nth-child(1) {
    top: 0;
    left: 0;
    border-bottom: 2px solid transparent;
    border-right: 2px solid transparent;
  }

  &:nth-child(2) {
    top: 0;
    right: 0;
    border-bottom: 2px solid transparent;
    border-left: 2px solid transparent;
  }

  &:nth-child(3) {
    bottom: 0;
    left: 0;
    border-top: 2px solid transparent;
    border-right: 2px solid transparent;
  }

  &:nth-child(4) {
    bottom: 0;
    right: 0;
    border-top: 2px solid transparent;
    border-left: 2px solid transparent;
  }
`;

function App() {
  const isMobile = useGameStore((state) => state.isMobile); // Get the value of isMobile from the store

  // Get the state setters from the store
  const setMoveUp = useGameStore((state) => state.setMoveUp);
  const setMoveDown = useGameStore((state) => state.setMoveDown);
  const setMoveLeft = useGameStore((state) => state.setMoveLeft);
  const setMoveRight = useGameStore((state) => state.setMoveRight);

  // Function to handle button presses
  const handleButtonPress = (direction) => {
    // Set the corresponding movement state to true when button is pressed
    if (direction === 'up') {
      setMoveUp(true);
    } else if (direction === 'down') {
      setMoveDown(true);
    } else if (direction === 'left') {
      setMoveLeft(true);
    } else if (direction === 'right') {
      setMoveRight(true);
    }
  };

  // Function to reset button press state after movement (you can hook this to player movement completion logic)
  const resetMovementStates = () => {
    setMoveUp(false);
    setMoveDown(false);
    setMoveLeft(false);
    setMoveRight(false);
  };

  return (
    <>
      <CanvasWrapper isMobile={isMobile}>
        <Canvas style={{ background: 'black' }}>
          <Dungeon />
          <Player />
        </Canvas>
      </CanvasWrapper>
      <Overlay />

      {isMobile && (
        <ControlInterface>
          <ControlCircle>
            <ControlButton onClick={() => handleButtonPress('up')} />
            <ControlButton onClick={() => handleButtonPress('right')} />
            <ControlButton onClick={() => handleButtonPress('down')} />
            <ControlButton onClick={() => handleButtonPress('left')} />
          </ControlCircle>
        </ControlInterface>
      )}
    </>
  );
}

export default App;
