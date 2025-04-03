import React, { memo, useMemo } from 'react';
import { extend } from '@react-three/fiber';
import styled from 'styled-components';
import { Mesh, BufferGeometry, Material } from 'three';
import useGameStore from '../store';

// Extend Three.js classes to resolve button interaction warning
extend({ Mesh, BufferGeometry, Material });

const ButtonsContainer = styled.div`
  position: fixed;
  bottom: 40px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 20px;
  z-index: 1002;
  opacity: ${props => props.visible ? 1 : 0};
  transition: opacity 0.5s ease;
  pointer-events: ${props => props.visible ? 'auto' : 'none'};
`;

const ActionButton = styled.button`
  background-color: rgba(60, 60, 80, 0.8);
  color: white;
  padding: 10px 20px;
  border: 2px solid #f0e68c;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    background-color: rgba(80, 80, 100, 0.9);
    transform: scale(1.05);
  }
  
  &:active {
    transform: scale(0.95);
  }
`;

const PrizeButtons = () => {
  // Get prize state from store
  const prizeState = useGameStore(state => state.prizeState);
  const prizeClicked = useGameStore(state => state.prizeClicked);
  
  // Compute visibility - use useMemo to prevent recalculations
  const isVisible = useMemo(() => {
    return prizeState === 'inspecting' && prizeClicked;
  }, [prizeState, prizeClicked]);
  
  // These buttons don't do anything yet
  const handleAccept = () => {
    console.log("Accept prize clicked (no functionality yet)");
  };
  
  const handleDecline = () => {
    console.log("Decline prize clicked (no functionality yet)");
  };
  
  // Don't render anything if not visible
  if (!isVisible) return null;
  
  return (
    <ButtonsContainer visible={true}>
      <ActionButton onClick={handleAccept}>
        Accept Prize
      </ActionButton>
      
      <ActionButton onClick={handleDecline}>
        Decline Prize
      </ActionButton>
    </ButtonsContainer>
  );
};

// Use memo to prevent unnecessary re-renders
export default memo(PrizeButtons);