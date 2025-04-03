import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import useGameStore from '../store';

// Styled components for the overlay
const OverlayContainer = styled.div`
  position: fixed;
  bottom: 15%; // Raised up a bit more
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
  z-index: 1000;
  opacity: ${props => props.visible ? 1 : 0};
  transition: opacity 0.3s ease;
`;

const InteractionButton = styled.button`
  width: 60px;
  height: 60px;
  border-radius: 15px;
  background-color: rgba(255, 255, 255, 0.2);
  border: 2px solid white;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    background-color: rgba(255, 255, 255, 0.4);
    transform: scale(1.1);
  }
  
  &:active {
    transform: scale(0.95);
  }
  
  svg {
    width: 30px;
    height: 30px;
    stroke: white;
    stroke-width: 1.5;
    fill: none;
  }
`;

const PrizeInteractionOverlay = () => {
  const [isVisible, setIsVisible] = useState(false);
  const prizeState = useGameStore(state => state.prizeState);
  const setPrizeState = useGameStore(state => state.setPrizeState);

  // Control visibility based on prize state
  useEffect(() => {
    if (prizeState === 'inspecting') {
      // Delay the appearance of buttons slightly
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 3000);

      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [prizeState]);

  // Handle interaction buttons
  const handleCalendarClick = () => {
    console.log("Calendar button clicked");
    // Future functionality for scheduling/viewing
  };

  const handleDownloadClick = () => {
    console.log("Download button clicked");
    // Future functionality for downloading/saving
  };

  return (
    <OverlayContainer visible={isVisible}>
      <InteractionButton onClick={handleCalendarClick}>
        <svg viewBox="0 0 24 24">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
          <line x1="16" y1="2" x2="16" y2="6"></line>
          <line x1="8" y1="2" x2="8" y2="6"></line>
          <line x1="3" y1="10" x2="21" y2="10"></line>
        </svg>
      </InteractionButton>
      
      <InteractionButton onClick={handleDownloadClick}>
        <svg viewBox="0 0 24 24">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
          <polyline points="7 10 12 15 17 10"></polyline>
          <line x1="12" y1="15" x2="12" y2="3"></line>
        </svg>
      </InteractionButton>
    </OverlayContainer>
  );
};

export default PrizeInteractionOverlay;