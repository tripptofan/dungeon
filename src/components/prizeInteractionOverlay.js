// src/components/prizeInteractionOverlay.js
import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import useGameStore from '../store';

// Styled components for the overlay
const OverlayContainer = styled.div`
  position: fixed;
  bottom: 15%;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
  z-index: 1000;
  opacity: ${props => props.visible ? 1 : 0};
  transition: opacity 0.3s ease;
  pointer-events: ${props => props.visible ? 'auto' : 'none'};
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

const CloseButton = styled(InteractionButton)`
  background-color: rgba(255, 120, 120, 0.2);
  border-color: rgba(255, 255, 255, 0.8);
  
  &:hover {
    background-color: rgba(255, 120, 120, 0.4);
  }
`;

// Helper function to generate a downloadable image from the prize text
const generatePrizeImage = async (prizeText) => {
  // Create a canvas for rendering the prize text
  const canvas = document.createElement('canvas');
  // Make it taller than wide to match the 3D prize's aspect ratio
  canvas.width = 600;
  canvas.height = 900;
  const ctx = canvas.getContext('2d');
  
  // Load the paper texture that we use for the prize in the 3D world
  const loadTexture = () => {
    return new Promise((resolve, reject) => {
      const paperImg = new Image();
      paperImg.crossOrigin = 'anonymous';
      paperImg.onload = () => resolve(paperImg);
      paperImg.onerror = (err) => reject(err);
      // Use the same paper texture from the 3D world
      paperImg.src = '/paper.webp';
    });
  };
  
  try {
    // Load the paper texture
    const paperTexture = await loadTexture();
    
    // Draw the paper texture as background, filling the entire canvas
    ctx.drawImage(paperTexture, 0, 0, canvas.width, canvas.height);
    
    // No border - removed as requested
    
    // Configure text rendering
    ctx.font = 'bold 36px Georgia, serif';
    ctx.fillStyle = '#333';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // No title - just leave space for the centered text
    
    // Wrap and draw the main text
    const wrapText = (text, x, y, maxWidth, lineHeight) => {
      if (!text) return;
      
      const lines = [];
      // Fix: Replace escaped newlines with actual newlines, then split by newline
      const cleanText = text.replace(/\\n/g, '\n');
      const paragraphs = cleanText.split('\n');
      
      paragraphs.forEach(paragraph => {
        const words = paragraph.split(' ');
        let line = '';
        
        words.forEach(word => {
          const testLine = line + word + ' ';
          const metrics = ctx.measureText(testLine);
          
          if (metrics.width > maxWidth && line !== '') {
            lines.push(line);
            line = word + ' ';
          } else {
            line = testLine;
          }
        });
        
        if (line) lines.push(line);
        lines.push(''); // Add an empty line between paragraphs
      });
      
      // Calculate the total height of the text to center it vertically
      const totalTextHeight = lines.length * lineHeight;
      // Calculate the starting Y position to center the text vertically
      const startY = (canvas.height - totalTextHeight) / 2;
      
      // Draw each line
      ctx.font = '36px Georgia, serif'; // Increased font size
      lines.forEach((line, index) => {
        ctx.fillText(line, x, startY + index * lineHeight);
      });
      
      return lines.length; // Return line count for reference
    };
    
    // Draw the prize text properly centered in the canvas
    wrapText(prizeText, canvas.width / 2, canvas.height / 2, canvas.width - 160, 60);
    
    // Add a subtle glow effect to enhance the magical artifact feel
    ctx.shadowColor = '#f0e68c'; // Golden glow
    ctx.shadowBlur = 15;
    ctx.font = 'bold 18px Georgia, serif';
    ctx.fillText('✧ ✦ ✧', canvas.width / 2, canvas.height - 80);
    
    // Convert canvas to data URL
    return canvas.toDataURL('image/png');
  } catch (error) {
    console.error("Error loading paper texture:", error);
    
    // Fallback to a simple gradient background if texture fails to load
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#f8f5e6');
    gradient.addColorStop(1, '#e8e0c0');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Continue with text rendering - no title, just centered prize text
    ctx.font = '36px Georgia, serif';
    ctx.fillStyle = '#333';
    ctx.textAlign = 'center';
    
    // Fix: Replace escaped newlines with actual newlines
    const cleanText = prizeText.replace(/\\n/g, '\n');
    const lines = cleanText.split('\n');
    const lineHeight = 60;
    const totalTextHeight = lines.length * lineHeight;
    const startY = (canvas.height - totalTextHeight) / 2;
    
    lines.forEach((line, index) => {
      ctx.fillText(line, canvas.width / 2, startY + (index * lineHeight));
    });
    
    return canvas.toDataURL('image/png');
  }
};

// Function to generate an iCalendar (.ics) file for the event
const generateCalendarFile = () => {
  // Parse the event details from the prize text - using a more generic title
  const eventTitle = "Art Gallery Event";
  const eventLocation = "French Fried Vintage, 7 Emory Pl, Knoxville, TN 37917";
  
  // Set the event date and time (May 2, 2025 at 6:00 PM Eastern Time)
  const eventDate = new Date(2025, 4, 2, 18, 0, 0); // Month is 0-indexed, so 4 = May
  const eventEndDate = new Date(eventDate.getTime() + 2 * 60 * 60 * 1000); // Event lasts 2 hours
  
  // Format dates for iCalendar format (YYYYMMDDTHHMMSSZ)
  const formatDateForCalendar = (date) => {
    return date.toISOString().replace(/-|:|\.\d+/g, '');
  };
  
  const now = new Date();
  
  // Create the iCalendar content
  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//ArtEvent//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${new Date().getTime()}@artevent.com`,
    `DTSTAMP:${formatDateForCalendar(now)}`,
    `DTSTART:${formatDateForCalendar(eventDate)}`,
    `DTEND:${formatDateForCalendar(eventEndDate)}`,
    `SUMMARY:${eventTitle}`,
    `LOCATION:${eventLocation}`,
    'DESCRIPTION:Join us for an art gallery event at French Fried Vintage!',
    'STATUS:CONFIRMED',
    'SEQUENCE:0',
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');
  
  return icsContent;
};

const PrizeInteractionOverlay = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const prizeState = useGameStore(state => state.prizeState);
  const setPrizeState = useGameStore(state => state.setPrizeState);
  
  // Reference to store prize text
  const prizeTextRef = useRef('');
  
  // Get the prize text from the experience
  useEffect(() => {
    if (prizeState === 'inspecting') {
      // Set the updated event details without "Unreal Together"
      prizeTextRef.current = "May 2, 2025 6:00 P.M.\\nFrench Fried Vintage\\n7 Emory Pl, Knoxville, TN 37917";
      
      // Also update the text in the original game state if needed
      const experiences = useGameStore.getState().experienceScript.experiences;
      const chestExperience = experiences.find(exp => exp.type === 'chest');
      if (chestExperience?.reward) {
        chestExperience.reward.prizeText = prizeTextRef.current;
      }
    }
  }, [prizeState]);

  // Handle component mounting/unmounting based on prize state
  useEffect(() => {
    if (prizeState === 'inspecting') {
      // Mount the component when prize is being inspected
      setIsMounted(true);
      setIsFadingOut(false);
      
      // Delay the appearance of buttons slightly
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 3000);

      return () => clearTimeout(timer);
    } else if (isMounted) {
      // Start fade out when prize state changes from 'inspecting' to something else
      setIsVisible(false);
      setIsFadingOut(true);
      
      // Unmount after fade out animation completes
      const timer = setTimeout(() => {
        setIsMounted(false);
        setIsFadingOut(false);
      }, 300); // Match transition duration
      
      return () => clearTimeout(timer);
    }
  }, [prizeState, isMounted]);

  // Handle calendar button click
  const handleCalendarClick = () => {
    console.log("Calendar button clicked - generating calendar event");
    const originalInnerHTML = document.activeElement.innerHTML;
    try {
      // Show some visual feedback that the calendar file is being generated
      if (document.activeElement.tagName === 'BUTTON') {
        document.activeElement.innerHTML = '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="white" stroke-width="2" fill="none" stroke-dasharray="40" stroke-dashoffset="0"><animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="1s" repeatCount="indefinite" /></circle></svg>';
      }
      
      // Generate the iCalendar file content
      const icsContent = generateCalendarFile();
      
      // Create a Blob containing the calendar data
      const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
      
      // Create a URL for the Blob
      const url = URL.createObjectURL(blob);
      
      // Create a temporary anchor element for downloading
      const downloadLink = document.createElement('a');
      downloadLink.href = url;
      downloadLink.download = 'art-gallery-event.ics'; // Updated filename
      
      // Append to the body, click to trigger download, then remove
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      
      // Clean up the URL object
      setTimeout(() => URL.revokeObjectURL(url), 100);
      
      console.log("Calendar event download initiated");
      
      // Restore original button content after a short delay
      setTimeout(() => {
        if (document.activeElement.tagName === 'BUTTON') {
          document.activeElement.innerHTML = originalInnerHTML;
        }
      }, 500);
      
    } catch (error) {
      console.error("Error generating calendar event:", error);
      
      // Restore original button content if there was an error
      if (document.activeElement.tagName === 'BUTTON') {
        document.activeElement.innerHTML = originalInnerHTML;
      }
    }
  };

  const handleDownloadClick = async () => {
    console.log("Download button clicked - generating image for prize");
    const originalInnerHTML = document.activeElement.innerHTML;
    try {
      // Show some visual feedback that the download is being prepared
      if (document.activeElement.tagName === 'BUTTON') {
        document.activeElement.innerHTML = '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="white" stroke-width="2" fill="none" stroke-dasharray="40" stroke-dashoffset="0"><animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="1s" repeatCount="indefinite" /></circle></svg>';
      }
      
      // Generate the image data URL from the prize text (now async)
      const imageDataUrl = await generatePrizeImage(prizeTextRef.current);
      
      // Create a temporary anchor element for downloading
      const downloadLink = document.createElement('a');
      downloadLink.href = imageDataUrl;
      downloadLink.download = 'SeeYouThere.png';
      
      // Append to the body, click to trigger download, then remove
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      
      console.log("Prize image download initiated");
      
      // Restore original button content after a short delay
      setTimeout(() => {
        if (document.activeElement.tagName === 'BUTTON') {
          document.activeElement.innerHTML = originalInnerHTML;
        }
      }, 500);
      
    } catch (error) {
      console.error("Error generating prize image:", error);
      
      // Restore original button content if there was an error
      if (document.activeElement.tagName === 'BUTTON') {
        document.activeElement.innerHTML = originalInnerHTML;
      }
    }
  };

  // Handle close button click - transition to acquiring state
  const handleCloseClick = () => {
    console.log("Close button clicked - transitioning prize to acquiring state");
    
    // Start fade out
    setIsVisible(false);
    setIsFadingOut(true);
    
    // Change prize state to acquiring so it will animate towards the player
    setPrizeState('acquiring');
    
    // Unmount after fade out animation completes
    setTimeout(() => {
      setIsMounted(false);
      setIsFadingOut(false);
    }, 300); // Match transition duration
  };

  // Only render if component should be mounted
  if (!isMounted && !isFadingOut) {
    return null;
  }

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
      
      <CloseButton onClick={handleCloseClick}>
        <svg viewBox="0 0 24 24">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </CloseButton>
    </OverlayContainer>
  );
};

export default PrizeInteractionOverlay;