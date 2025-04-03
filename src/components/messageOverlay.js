import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import useGameStore from '../store';
import MessageService from '../utils/messageService';

// Semi-transparent overlay that covers the entire screen
const OverlayBackground = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.4);
  opacity: ${props => props.visible ? 1 : 0};
  transition: opacity 1s ease;
  z-index: 1000;
  pointer-events: ${props => props.visible ? 'auto' : 'none'};
`;

// Text box container that appears in center of screen
const TextBoxContainer = styled.div`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 80%;
  max-width: 600px;
  background-color: white;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
  opacity: ${props => props.visible ? 1 : 0};
  transform: ${props => props.visible 
    ? 'translate(-50%, -50%) scale(1)' 
    : 'translate(-50%, -55%) scale(0.95)'};
  transition: opacity 0.7s ease, transform 0.7s ease;
  z-index: 1001;
`;

// Text display area with gradual text reveal
const TextArea = styled.div`
  font-size: 1.2rem;
  line-height: 1.6;
  color: #333;
  margin-bottom: 24px;
  min-height: 100px;
`;

// Continue button in the corner
const ContinueButton = styled.button`
  position: absolute;
  bottom: 16px;
  right: 16px;
  background-color: #3a86ff;
  color: white;
  border: none;
  border-radius: 50%;
  width: 50px;
  height: 50px;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  transition: background-color 0.3s ease, transform 0.2s ease;
  
  &:hover {
    background-color: #2667cc;
    transform: scale(1.05);
  }
  
  &:active {
    transform: scale(0.95);
  }
  
  svg {
    width: 24px;
    height: 24px;
  }
`;

const MessageOverlay = () => {
  // Use selectors to optimize re-renders
  const currentExperienceIndex = useGameStore(state => state.currentExperienceIndex);
  const experiences = useGameStore(state => state.experienceScript.experiences);

  const showMessageOverlay = useGameStore(state => state.showMessageOverlay);
  const messageBoxVisible = useGameStore(state => state.messageBoxVisible);
  const currentMessage = useGameStore(state => state.currentMessage);
  const typingInProgress = useGameStore(state => state.typingInProgress);
  
  // Use separate action getters to avoid unnecessary re-renders
  const progressExperience = useGameStore(state => state.progressExperience);
  
  const [displayedText, setDisplayedText] = useState('');
  const fullTextRef = useRef('');
  const charIndexRef = useRef(0);
  const typingSpeedRef = useRef(40); // milliseconds per character
  const typingIntervalRef = useRef(null);
  
  // FIX: Enhanced isSwordExperience detection
  const isSwordExperience = React.useMemo(() => {
    if (currentExperienceIndex >= 0 && currentExperienceIndex < experiences.length) {
      const experience = experiences[currentExperienceIndex];
      return experience.type === 'item' && experience.item?.name === 'Toy Wooden Sword';
    }
    return false;
  }, [currentExperienceIndex, experiences]);

  // FIX: Always force items visible when showing sword message
  React.useEffect(() => {
    if (isSwordExperience) {
      console.log("MessageOverlay: Forcing items visible for sword experience");
      useGameStore.getState().setForceItemsVisible(true);
      useGameStore.getState().setShowItemDisplay(true);
    }
  }, [showMessageOverlay, isSwordExperience, currentExperienceIndex]);

  // Reset the typing animation when the current message changes
  useEffect(() => {
    if (currentMessage) {
      fullTextRef.current = currentMessage;
      
      // Only reset the typing animation if it's explicitly triggered
      if (typingInProgress) {
        // Make sure to start with a clean state
        clearTimeout(typingIntervalRef.current);
        charIndexRef.current = 0;
        setDisplayedText(''); // Start with empty string
        
        // Important: Add a small delay before starting typing to ensure proper initialization
        setTimeout(() => {
          // Set up new typing interval with proper closure
          typingIntervalRef.current = setInterval(() => {
            if (charIndexRef.current < fullTextRef.current.length) {
              setDisplayedText(prev => {
                // Ensure we're adding the correct character
                return fullTextRef.current.substring(0, charIndexRef.current + 1);
              });
              charIndexRef.current++;
            } else {
              // Text animation completed
              clearInterval(typingIntervalRef.current);
              typingIntervalRef.current = null;
              useGameStore.getState().setTypingInProgress(false);
            }
          }, typingSpeedRef.current);
        }, 50); // Small delay to ensure state is ready
      }
    }
    
    // Clean up interval on unmount or when dependencies change
    return () => {
      if (typingIntervalRef.current) {
        clearInterval(typingIntervalRef.current);
      }
    };
  }, [currentMessage, typingInProgress]);

  // FIX: Improved cleanup logic for sword visibility
  React.useEffect(() => {
    // FIX: Always ensure sword remains visible when it's the current experience
    if (isSwordExperience) {
      useGameStore.getState().setForceItemsVisible(true);
      useGameStore.getState().setShowItemDisplay(true);
    }
    
    // Effect to clean up force items visible flag when overlay closes
    if (!showMessageOverlay && useGameStore.getState().forceItemsVisible) {
      // Delay clearing the force flag to ensure smooth transitions
      setTimeout(() => {
        // Only clear force flag if we don't have the sword experience active
        if (!isSwordExperience) {
          // Check if we have the sword in inventory before clearing the force flag
          const hasSword = useGameStore.getState().inventory.some(
            item => item.name === "Toy Wooden Sword"
          );
          
          if (!hasSword) {
            useGameStore.getState().setForceItemsVisible(false);
          }
        }
      }, 500);
    }
  }, [showMessageOverlay, isSwordExperience]);

  const handleContinue = () => {
    // If typing is still in progress, instantly complete it
    if (typingInProgress) {
      if (typingIntervalRef.current) {
        clearInterval(typingIntervalRef.current);
        typingIntervalRef.current = null;
      }
      setDisplayedText(fullTextRef.current);
      useGameStore.getState().setTypingInProgress(false);
      return;
    }
    
    // Progress to the next experience step, with item visibility preserved
    progressExperience();
  };
  
  // Skip showing the component if there's no overlay
  if (!showMessageOverlay) return null;
  
  return (
    <>
      <OverlayBackground visible={showMessageOverlay} />
      
      <TextBoxContainer visible={messageBoxVisible}>
        <TextArea>
          {displayedText}
        </TextArea>
        
        <ContinueButton onClick={handleContinue}>
          {/* Arrow/Continue icon */}
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {typingInProgress ? (
              // Show skip icon during typing
              <path d="M5 12h14M13 5l7 7-7 7" />
            ) : (
              // Show continue arrow when done typing
              <path d="M12 5V19M19 12l-7 7-7-7" />
            )}
          </svg>
        </ContinueButton>
      </TextBoxContainer>
    </>
  );
};

export default React.memo(MessageOverlay);