// src/components/BlackScreen.js
import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import useGameStore from '../store';

// Overlay that fades in with CSS - much faster transition for portal
const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: ${props => props.isPortalEntered ? 'white' : 'black'};
  opacity: ${props => props.opacity};
  transition: opacity ${props => props.isPortalEntered ? '0.5s' : '2s'} ease;
  pointer-events: ${props => props.opacity > 0 ? 'auto' : 'none'};
  z-index: 1000; // Higher than other UI elements
  display: flex;
  justify-content: center;
  align-items: center;
`;

// Container for the farewell text
const FarewellTextContainer = styled.div`
  opacity: ${props => props.visible ? 1 : 0};
  transition: opacity 2s ease;
  display: flex;
  justify-content: center;
  user-select: none;
`;

// Individual letter with vibration animation
const Letter = styled.span`
  font-family: 'Times New Roman', serif;
  font-size: 3rem;
  font-weight: 300;
  color: black;
  display: inline-block;
  transform: translate(
    ${props => props.vibrating ? `${Math.sin(props.offset) * 2}px` : '0px'}, 
    ${props => props.vibrating ? `${Math.cos(props.offset) * 2}px` : '0px'}
  );
  transition: transform 0.05s ease;
  margin: 0 0.1rem;
`;

// Component to display a screen overlay with opacity from the store
const BlackScreen = () => {
  const blackScreenOpacity = useGameStore(state => state.blackScreenOpacity);
  const portalEntered = useGameStore(state => state.portalEntered);
  const [showText, setShowText] = useState(false);
  const [letterOffsets, setLetterOffsets] = useState([]);
  const animationFrameRef = useRef(null);
  const timeRef = useRef(0);
  
  const text = "see you there";
  
  // Initialize random offsets for each letter
  useEffect(() => {
    if (text) {
      // Create random offset starting points for each letter
      const offsets = Array.from({ length: text.length }, () => Math.random() * Math.PI * 2);
      setLetterOffsets(offsets);
    }
  }, [text]);
  
  // Handle text appearance and disappearance timers
  useEffect(() => {
    let fadeInTimer;
    let fadeOutTimer;
    
    // If portal entered and overlay is visible
    if (portalEntered && blackScreenOpacity > 0) {
      // Set a timer to show the text 4 seconds after the white screen appears
      fadeInTimer = setTimeout(() => {
        setShowText(true);
        
        // Set a timer to hide the text after 4 seconds of display
        fadeOutTimer = setTimeout(() => {
          setShowText(false);
        }, 4000); // 4 seconds display time
        
      }, 4000); // 4 seconds before appearing
    } else {
      // Reset text visibility when overlay is not visible
      setShowText(false);
    }
    
    // Clean up timers on component unmount or when dependencies change
    return () => {
      if (fadeInTimer) clearTimeout(fadeInTimer);
      if (fadeOutTimer) clearTimeout(fadeOutTimer);
    };
  }, [portalEntered, blackScreenOpacity]);
  
  // Animation loop for letter vibration
  useEffect(() => {
    // Only animate when text is visible
    if (showText && letterOffsets.length > 0) {
      const animate = () => {
        timeRef.current += 0.03; // Speed of vibration
        
        // Update each letter's offset at different rates
        setLetterOffsets(prevOffsets => 
          prevOffsets.map((offset, index) => {
            // Each letter vibrates at a slightly different frequency
            const speed = 0.8 + (index % 5) * 0.1;
            return (offset + 0.1 * speed) % (Math.PI * 2);
          })
        );
        
        animationFrameRef.current = requestAnimationFrame(animate);
      };
      
      animationFrameRef.current = requestAnimationFrame(animate);
      
      return () => {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
      };
    }
  }, [showText, letterOffsets.length]);
  
  return (
    <Overlay 
      opacity={blackScreenOpacity} 
      isPortalEntered={portalEntered} 
    >
      {portalEntered && (
        <FarewellTextContainer visible={showText}>
          {text.split('').map((letter, index) => (
            <Letter 
              key={`letter-${index}`}
              vibrating={showText}
              offset={letterOffsets[index] || 0}
            >
              {letter === ' ' ? '\u00A0' : letter}
            </Letter>
          ))}
        </FarewellTextContainer>
      )}
    </Overlay>
  );
};

export default BlackScreen;