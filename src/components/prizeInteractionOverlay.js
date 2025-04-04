// In src/components/prizeInteractionOverlay.js
// Implementation with updated prize text and calendar functionality

import React, { useState, useEffect, useRef } from 'react';
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
    
    // Add a subtle golden border to match the prize in the 3D world
    ctx.strokeStyle = '#f0e68c'; // Golden color
    ctx.lineWidth = 8;
    ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);
    
    // Configure text rendering
    ctx.font = 'bold 36px Georgia, serif';
    ctx.fillStyle = '#333';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Add a title at the top with some padding
    ctx.font = 'bold 44px Georgia, serif';
    ctx.fillText('Ancient Artifact', canvas.width / 2, 80);
    
    // Draw a decorative line
    ctx.beginPath();
    ctx.moveTo(100, 140);
    ctx.lineTo(canvas.width - 100, 140);
    ctx.strokeStyle = '#8B4513';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Wrap and draw the main text
    const wrapText = (text, x, y, maxWidth, lineHeight) => {
      if (!text) return;
      
      const lines = [];
      const paragraphs = text.split('\n');
      
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
      
      // Draw each line
      ctx.font = '30px Georgia, serif';
      lines.forEach((line, index) => {
        ctx.fillText(line, x, y + index * lineHeight);
      });
    };
    
    // Draw the prize text centered in the canvas
    wrapText(prizeText, canvas.width / 2, canvas.height / 2, canvas.width - 120, 50);
    
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
    
    // Continue with text rendering
    ctx.font = 'bold 44px Georgia, serif';
    ctx.fillStyle = '#333';
    ctx.textAlign = 'center';
    ctx.fillText('Ancient Artifact', canvas.width / 2, 80);
    
    // Wrap and render the prize text
    const lines = prizeText.split('\n');
    ctx.font = '30px Georgia, serif';
    lines.forEach((line, index) => {
      ctx.fillText(line, canvas.width / 2, canvas.height / 2 - 50 + (index * 50));
    });
    
    return canvas.toDataURL('image/png');
  }
};

const PrizeInteractionOverlay = () => {
  const [isVisible, setIsVisible] = useState(false);
  const prizeState = useGameStore(state => state.prizeState);
  const setPrizeState = useGameStore(state => state.setPrizeState);
  
  // Reference to store prize text
  const prizeTextRef = useRef('');
  
  // Get the prize text from the experience
  useEffect(() => {
    if (prizeState === 'inspecting') {
      // Set the updated event details for the prize text
      prizeTextRef.current = "Unreal Together\nMay 2, 2025 6:00 P.M.\nFrench Fried Vintage\n7 Emory Pl, Knoxville, TN 37917";
      
      // Also update the text in the original game state if needed
      const experiences = useGameStore.getState().experienceScript.experiences;
      const chestExperience = experiences.find(exp => exp.type === 'chest');
      if (chestExperience?.reward) {
        chestExperience.reward.prizeText = prizeTextRef.current;
      }
    }
  }, [prizeState]);

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

  // Function to generate an iCalendar (.ics) file for the event
  const generateCalendarFile = () => {
    // Parse the event details from the prize text
    const eventTitle = "Unreal Together";
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
      'PRODID:-//Unreal Together//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `UID:${new Date().getTime()}@unrealtogether.com`,
      `DTSTAMP:${formatDateForCalendar(now)}`,
      `DTSTART:${formatDateForCalendar(eventDate)}`,
      `DTEND:${formatDateForCalendar(eventEndDate)}`,
      `SUMMARY:${eventTitle}`,
      `LOCATION:${eventLocation}`,
      'DESCRIPTION:Join us for the Unreal Together event at French Fried Vintage!',
      'STATUS:CONFIRMED',
      'SEQUENCE:0',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');
    
    return icsContent;
  };

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
      downloadLink.download = 'unreal-together-event.ics';
      
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
      downloadLink.download = 'ancient-artifact.png';
      
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