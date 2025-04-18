import React, { useState, useEffect, useRef } from 'react';
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
  /* Removed the dark background overlay */
  background-color: transparent;
  pointer-events: auto;
  z-index: 1000;
  opacity: ${props => props.visible ? 1 : 0};
  transition: opacity 0.5s ease;
  pointer-events: ${props => props.visible ? 'auto' : 'none'};
  /* Add className for touch handling */
  class-name: action-overlay;
`;

const AnimatedAction = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  transition: transform 0.3s ease;
  
  &:hover {
    transform: scale(1.1);
  }
  
  &:active {
    transform: scale(0.95);
  }
`;

const AnimationContainer = styled.div`
  width: 180px;
  height: 180px;
  position: relative;
  
  img {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    object-fit: contain;
    opacity: 0;
    transition: opacity 0.1s ease;
    /* Apply filter to make the black images white */
    filter: invert(100%) brightness(120%) drop-shadow(0 0 6px rgba(255, 255, 255, 0.5));
  }
  
  img.active {
    opacity: 1;
  }
`;

const ActionOverlay = () => {
  const showActionOverlay = useGameStore(state => state.showActionOverlay);
  const actionType = useGameStore(state => state.actionType);
  const actionDirection = useGameStore(state => state.actionDirection);
  const handleAction = useGameStore(state => state.handleAction);
  
  // Component state
  const [isMounted, setIsMounted] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);
  
  // Animation sequence constants
  const WIGGLE_FRAMES = [1, 2]; // First two frames for wiggle animation
  const BLINK_FRAMES = [3, 4, 5, 6]; // Remaining frames for blink animation
  
  // Animation sequence state
  const [currentFrame, setCurrentFrame] = useState(WIGGLE_FRAMES[0]);
  const [animationPhase, setAnimationPhase] = useState('wiggle'); // 'wiggle' or 'blink'
  const wiggleCyclesRef = useRef(0);
  const wiggleCycleTargetRef = useRef(6); // Loop wiggle 3 times before blinking
  const wiggleFrameIndexRef = useRef(0);
  const blinkFrameIndexRef = useRef(0);
  const animationTimerRef = useRef(null);
  
  // Handle animation frame cycling
  useEffect(() => {
    if (isVisible && !isFadingOut) {
      // Start the animation cycle
      animationTimerRef.current = setInterval(() => {
        if (animationPhase === 'wiggle') {
          // Handle wiggle animation
          wiggleFrameIndexRef.current = (wiggleFrameIndexRef.current + 1) % WIGGLE_FRAMES.length;
          setCurrentFrame(WIGGLE_FRAMES[wiggleFrameIndexRef.current]);
          
          // Check if we completed a full wiggle cycle
          if (wiggleFrameIndexRef.current === 0) {
            wiggleCyclesRef.current += 1;
            
            // Check if we should transition to blink phase
            if (wiggleCyclesRef.current >= wiggleCycleTargetRef.current) {
              setAnimationPhase('blink');
              wiggleCyclesRef.current = 0;
              blinkFrameIndexRef.current = 0;
            }
          }
        } else {
          // Handle blink animation
          blinkFrameIndexRef.current = (blinkFrameIndexRef.current + 1) % BLINK_FRAMES.length;
          setCurrentFrame(BLINK_FRAMES[blinkFrameIndexRef.current]);
          
          // Check if we completed a full blink cycle
          if (blinkFrameIndexRef.current === BLINK_FRAMES.length - 1) {
            // Reset to wiggle phase
            setAnimationPhase('wiggle');
            wiggleFrameIndexRef.current = 0;
          }
        }
      }, 150); // Speed of animation - adjust as needed
      
      return () => {
        // Clean up timer when component unmounts or visibility changes
        if (animationTimerRef.current) {
          clearInterval(animationTimerRef.current);
        }
      };
    }
  }, [isVisible, isFadingOut, animationPhase]);
  
  // Handle mounting/unmounting based on showActionOverlay state
  useEffect(() => {
    if (showActionOverlay) {
      // Reset animation state
      setAnimationPhase('wiggle');
      wiggleCyclesRef.current = 0;
      wiggleFrameIndexRef.current = 0;
      blinkFrameIndexRef.current = 0;
      setCurrentFrame(WIGGLE_FRAMES[0]);
      
      // Mount the component
      setIsMounted(true);
      setIsFadingOut(false);
      
      // Short delay before showing to ensure smooth animation
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 50);
      
      return () => clearTimeout(timer);
    } else if (isMounted) {
      // Start fade out
      setIsVisible(false);
      setIsFadingOut(true);
      
      // Unmount after fade out animation completes
      const timer = setTimeout(() => {
        setIsMounted(false);
        setIsFadingOut(false);
      }, 500); // Match transition duration
      
      return () => clearTimeout(timer);
    }
  }, [showActionOverlay, isMounted]);
  
  // Handle action button click with fade out
  const handleActionButtonClick = () => {
    // Start fade out
    setIsVisible(false);
    setIsFadingOut(true);
    
    // Call the action handler
    handleAction();
  };
  
  // Render animated action based on action type and direction
  const renderAnimatedAction = () => {
    if (actionType === 'move') {
      if (actionDirection === 'forward') {
        return (
          <AnimatedAction onClick={handleActionButtonClick}>
            <AnimationContainer>
              {/* Render all frames and use CSS to show only the active one */}
              {[...WIGGLE_FRAMES, ...BLINK_FRAMES].map(frameNum => {
                const paddedFrame = frameNum.toString().padStart(4, '0');
                return (
                  <img 
                    key={`point${paddedFrame}`}
                    src={`/point/point${paddedFrame}.png`}
                    alt={`Animation frame ${frameNum}`}
                    className={frameNum === currentFrame ? 'active' : ''}
                  />
                );
              })}
            </AnimationContainer>
          </AnimatedAction>
        );
      }
    }
    
    return null;
  };
  
  // Don't render anything if not mounted
  if (!isMounted && !isFadingOut) return null;
  
  return (
    <OverlayContainer visible={isVisible} className="action-overlay">
      {renderAnimatedAction()}
    </OverlayContainer>
  );
};

export default React.memo(ActionOverlay);