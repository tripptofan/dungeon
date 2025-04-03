import React from 'react';
import styled from 'styled-components';
import useGameStore from '../store';

const OverlayContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: rgba(0, 0, 0, 0.3);
  pointer-events: auto;
  z-index: 1000;
  opacity: ${props => props.visible ? 1 : 0};
  transition: opacity 0.5s ease;
  pointer-events: ${props => props.visible ? 'auto' : 'none'};
  /* Add className for touch handling */
  class-name: action-overlay;
`;

const ActionButton = styled.button`
  background-color: rgba(255, 255, 255, 0.2);
  border: 2px solid white;
  border-radius: 50%;
  width: 100px;
  height: 100px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  transition: all 0.3s ease;
  color: white;
  
  &:hover {
    background-color: rgba(255, 255, 255, 0.4);
    transform: scale(1.1);
  }
  
  &:active {
    transform: scale(0.95);
  }
`;

const ActionIcon = styled.div`
  width: 40px;
  height: 40px;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 8px;
  
  svg {
    width: 100%;
    height: 100%;
  }
`;

const ActionText = styled.div`
  font-size: 1.2rem;
  font-weight: bold;
  text-align: center;
`;

const ActionOverlay = () => {
  const showActionOverlay = useGameStore(state => state.showActionOverlay);
  const actionType = useGameStore(state => state.actionType);
  const actionDirection = useGameStore(state => state.actionDirection);
  const handleAction = useGameStore(state => state.handleAction);
  
  if (!showActionOverlay) return null;
  
  // Render different buttons based on action type and direction
  const renderActionButton = () => {
    if (actionType === 'move') {
      if (actionDirection === 'forward') {
        return (
          <ActionButton onClick={handleAction}>
            <ActionIcon>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 5V19M5 12l7-7 7 7" />
              </svg>
            </ActionIcon>
            <ActionText>Move Forward</ActionText>
          </ActionButton>
        );
      }
      // Add more directions as needed
    }
    // Add more action types as needed
    
    return null;
  };
  
  return (
    <OverlayContainer visible={showActionOverlay} className="action-overlay">
      {renderActionButton()}
    </OverlayContainer>
  );
};

export default React.memo(ActionOverlay);