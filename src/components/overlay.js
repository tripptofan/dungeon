import React from 'react';
import styled from 'styled-components';
import useGameStore from '../store';

const OverlayContainer = styled.div`
  position: fixed;
  bottom: 20px; /* Fixed at the bottom of the viewport */
  left: 0;
  width: 100vw;
  height: auto;
  pointer-events: none; /* Prevent interaction with the overlay */
  z-index: 9999; /* Ensure it appears above the canvas */
`;

const HealthBarContainer = styled.div`
  position: absolute;
  left: 1rem; /* Small gap from the left edge */
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
  right: 1rem; /* Small gap from the right edge */
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
  margin-bottom: 0.5rem; /* Small gap between circle and text */
`;

const MagicIndicatorInnerCircle = styled.div`
  width: 1.8rem;
  height: 1.8rem;
  background-color: ${({ color }) => color}; /* Color of the selected magic */
  border-radius: 50%;
`;

const MagicNameText = styled.div`
  font-size: 1.2rem;
  color: white;
  text-align: center;
`;

const Overlay = () => {
  const { equippedMagic, learnedMagic } = useGameStore();
  const playerHealth = useGameStore((state) => state.playerHealth);
  const healthPercentage = Math.max(0, Math.min(100, playerHealth));

  // Get the color of the selected magic
  const magicData = learnedMagic[equippedMagic] || {};
  const magicColor = magicData.color || 'gray'; // Default to gray if no magic is equipped

  return (
    <OverlayContainer>
      {/* Health bar in the bottom-left corner */}
      <HealthBarContainer>
        <HealthBarFill health={healthPercentage} />
      </HealthBarContainer>

      {/* Magic indicator in the bottom-right corner */}
      <MagicIndicatorContainer>
        <MagicIndicatorCircle>
          <MagicIndicatorInnerCircle color={magicColor} />
        </MagicIndicatorCircle>
        <MagicNameText>{equippedMagic || 'No Magic Equipped'}</MagicNameText>
      </MagicIndicatorContainer>
    </OverlayContainer>
  );
};

export default Overlay;
