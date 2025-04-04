// src/components/BlackScreen.js
import React from 'react';
import styled from 'styled-components';
import useGameStore from '../store';

// Black overlay that fades in with CSS
const BlackOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: black;
  opacity: ${props => props.opacity};
  transition: opacity 0.2s ease;
  pointer-events: ${props => props.opacity > 0 ? 'auto' : 'none'};
  z-index: 1000; // Higher than other UI elements
`;

// Simple component to display a black screen overlay with opacity from the store
const BlackScreen = () => {
  const blackScreenOpacity = useGameStore(state => state.blackScreenOpacity);
  
  return (
    <BlackOverlay opacity={blackScreenOpacity} />
  );
};

export default BlackScreen;