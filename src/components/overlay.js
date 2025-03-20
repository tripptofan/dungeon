import React, { useEffect } from 'react';
import styled from 'styled-components';
import useGameStore from '../store';

const OverlayContainer = styled.div`
  position: fixed;
  bottom: 20px;
  left: 0;
  width: 100vw;
  height: auto;
  pointer-events: none;
  z-index: 9999;
`;

const GodModeButton = styled.button`
  position: fixed;
  top: 10px;
  left: 10px;
  background-color: ${({ active }) => (active ? 'green' : 'darkred')};
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  cursor: pointer;
  font-size: 1rem;
  font-weight: bold;
  border-radius: 5px;
  pointer-events: auto;
  z-index: 10000;

  &:hover {
    background-color: ${({ active }) => (active ? 'lightgreen' : 'red')};
  }
`;

const PlayerPositionContainer = styled.div`
  position: fixed;
  top: 50px;
  left: 10px;
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 0.5rem;
  border-radius: 5px;
  font-size: 1rem;
  font-family: monospace;
  z-index: 10000;
`;

const HealthBarContainer = styled.div`
  position: absolute;
  left: 1rem;
  bottom: 0;
  width: 20rem;
  height: 2rem;
  background-color: red;
  border: 2px solid black;
`;

const HealthBarFill = styled.div`
  height: 100%;
  background-color: green;
  width: ${({ health }) => health}%;
  transition: width 0.3s ease-in-out;
`;

const MagicIndicatorContainer = styled.div`
  position: absolute;
  right: 1rem;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
`;

const MagicIndicatorCircle = styled.div`
  width: 3rem;
  height: 3rem;
  background-color: black;
  border-radius: 50%;
  border: 2px solid gray;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 0.5rem;
`;

const MagicIndicatorInnerCircle = styled.div`
  width: 1.8rem;
  height: 1.8rem;
  background-color: ${({ color }) => color};
  border-radius: 50%;
`;

const MagicNameText = styled.div`
  font-size: 1.2rem;
  color: white;
  text-align: center;
`;

const Overlay = () => {
  const { equippedMagic, learnedMagic, godMode, setGodMode, playerPosition } = useGameStore();
  const playerHealth = useGameStore((state) => state.playerHealth);
  const healthPercentage = Math.max(0, Math.min(100, playerHealth));

  // Get the color of the selected magic
  const magicData = learnedMagic[equippedMagic] || {};
  const magicColor = magicData.color || 'gray';

  // Effect to handle pointer lock change and disable godMode when exiting pointer lock
  useEffect(() => {
    const onPointerLockChange = () => {
      if (!document.pointerLockElement) {
        setGodMode(false); // Disable God Mode when pointer lock is exited
      }
    };

    document.addEventListener('pointerlockchange', onPointerLockChange);

    // Cleanup the event listener on unmount
    return () => {
      document.removeEventListener('pointerlockchange', onPointerLockChange);
    };
  }, [setGodMode]);

  return (
    <>
      {/* God Mode Toggle Button */}
      <GodModeButton active={godMode} onClick={() => setGodMode(!godMode)}>
        {godMode ? 'God Mode: ON' : 'God Mode: OFF'}
      </GodModeButton>

      {/* Player Position Display */}
      <PlayerPositionContainer>
        Position: {`(${playerPosition.x.toFixed(2)}, ${playerPosition.z.toFixed(2)})`}
      </PlayerPositionContainer>

      <OverlayContainer>
        {/* Health bar in the bottom-left corner */}
        {/* <HealthBarContainer>
          <HealthBarFill health={healthPercentage} />
        </HealthBarContainer> */}

        {/* Magic indicator in the bottom-right corner */}
        {/* <MagicIndicatorContainer>
          <MagicIndicatorCircle>
            <MagicIndicatorInnerCircle color={magicColor} />
          </MagicIndicatorCircle>
          <MagicNameText>{equippedMagic || 'No Magic Equipped'}</MagicNameText>
        </MagicIndicatorContainer> */}
      </OverlayContainer>
    </>
  );
};

export default Overlay;
