// src/components/BlackScreen.js
import React from 'react';
import styled from 'styled-components';
import useGameStore from '../store';

// Overlay that fades in with CSS - much faster transition for portal
const Overlay = styled.div.withConfig({
  shouldForwardProp: (prop) => !['isEntered'].includes(prop)
})`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: ${props => props.isEntered ? 'white' : 'black'};
  opacity: ${props => props.opacity};
  transition: opacity ${props => props.isEntered ? '0.5s' : '2s'} ease;
  pointer-events: ${props => props.opacity > 0 ? 'auto' : 'none'};
  z-index: 1000; // Higher than other UI elements
  display: flex;
  justify-content: center;
  align-items: center;
`;

// Component to display a screen overlay with opacity from the store
const BlackScreen = () => {
  const blackScreenOpacity = useGameStore(state => state.blackScreenOpacity);
  const portalEntered = useGameStore(state => state.portalEntered);
  
  return (
    <Overlay 
      opacity={blackScreenOpacity} 
      isEntered={portalEntered} 
    />
  );
};

export default BlackScreen;