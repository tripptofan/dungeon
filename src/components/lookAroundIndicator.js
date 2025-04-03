import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import useGameStore from '../store';

const IndicatorContainer = styled.div`
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.1);
  border: 2px solid rgba(255, 255, 255, 0.3);
  display: flex;
  justify-content: center;
  align-items: center;
  pointer-events: none;
  opacity: ${props => props.visible ? 0.8 : 0};
  transition: opacity 0.3s ease;
  z-index: 2000; /* Very high z-index to appear over all overlays */
`;

const ArrowContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
`;

const Arrow = styled.div`
  width: 8px;
  height: 8px;
  border-top: 2px solid white;
  border-right: 2px solid white;
  transform: rotate(45deg);
  margin-left: -5px;
`;

const LeftArrow = styled(Arrow)`
  transform: rotate(-135deg);
  margin-left: 5px;
`;

const LookAroundIndicator = () => {
  const [visible, setVisible] = useState(false);
  
  // Get relevant state from the store
  const isMobile = useGameStore(state => state.isMobile);
  const isMovingCamera = useGameStore(state => state.isMovingCamera);
  const cameraShaking = useGameStore(state => state.cameraShaking);
  
  // Always show the indicator on mobile when not moving camera or shaking,
  // regardless of overlay state
  useEffect(() => {
    // Only show on mobile and when not camera movement
    const canLookAround = isMobile && 
                          !isMovingCamera && 
                          !cameraShaking.isShaking;
    
    setVisible(canLookAround);
  }, [isMobile, isMovingCamera, cameraShaking.isShaking]);
  
  // Skip rendering if not mobile
  if (!isMobile) return null;
  
  return (
    <IndicatorContainer visible={visible}>
      <ArrowContainer>
        <LeftArrow />
        <Arrow />
      </ArrowContainer>
    </IndicatorContainer>
  );
};

export default React.memo(LookAroundIndicator);