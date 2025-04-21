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
  const canvas = document.createElement('canvas');
  canvas.width = 600;
  canvas.height = 900;
  const ctx = canvas.getContext('2d');
  
  const loadTexture = () => {
    return new Promise((resolve, reject) => {
      const paperImg = new Image();
      paperImg.crossOrigin = 'anonymous';
      paperImg.onload = () => resolve(paperImg);
      paperImg.onerror = (err) => reject(err);
      paperImg.src = '/paper.webp';
    });
  };
  
  try {
    const paperTexture = await loadTexture();
    ctx.drawImage(paperTexture, 0, 0, canvas.width, canvas.height);
    
    ctx.font = 'bold 36px Georgia, serif';
    ctx.fillStyle = '#333';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    const wrapText = (text, x, y, maxWidth, lineHeight) => {
      if (!text) return;
      
      const lines = [];
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
      
      const totalTextHeight = lines.length * lineHeight;
      const startY = (canvas.height - totalTextHeight) / 2;
      
      ctx.font = '36px Georgia, serif';
      lines.forEach((line, index) => {
        ctx.fillText(line, x, startY + index * lineHeight);
      });
      
      return lines.length;
    };
    
    wrapText(prizeText, canvas.width / 2, canvas.height / 2, canvas.width - 160, 60);
    
    ctx.shadowColor = '#f0e68c';
    ctx.shadowBlur = 15;
    ctx.font = 'bold 18px Georgia, serif';
    ctx.fillText('✧ ✦ ✧', canvas.width / 2, canvas.height - 80);
    
    return canvas.toDataURL('image/png');
  } catch (error) {
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#f8f5e6');
    gradient.addColorStop(1, '#e8e0c0');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.font = '36px Georgia, serif';
    ctx.fillStyle = '#333';
    ctx.textAlign = 'center';
    
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
  const eventTitle = "Art Gallery Event";
  const eventLocation = "French Fried Vintage, 7 Emory Pl, Knoxville, TN 37917";
  
  const eventDate = new Date(2025, 4, 2, 18, 0, 0);
  const eventEndDate = new Date(eventDate.getTime() + 2 * 60 * 60 * 1000);
  
  const formatDateForCalendar = (date) => {
    return date.toISOString().replace(/-|:|\.\d+/g, '');
  };
  
  const now = new Date();
  
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
  
  const prizeTextRef = useRef('');
  
  useEffect(() => {
    if (prizeState === 'inspecting') {
      prizeTextRef.current = "May 2, 2025 6:00 P.M.\\nFrench Fried Vintage\\n7 Emory Pl, Knoxville, TN 37917";
      
      const experiences = useGameStore.getState().experienceScript.experiences;
      const chestExperience = experiences.find(exp => exp.type === 'chest');
      if (chestExperience?.reward) {
        chestExperience.reward.prizeText = prizeTextRef.current;
      }
    }
  }, [prizeState]);

  useEffect(() => {
    if (prizeState === 'inspecting') {
      setIsMounted(true);
      setIsFadingOut(false);
      
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 3000);

      return () => clearTimeout(timer);
    } else if (isMounted) {
      setIsVisible(false);
      setIsFadingOut(true);
      
      const timer = setTimeout(() => {
        setIsMounted(false);
        setIsFadingOut(false);
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [prizeState, isMounted]);

  const handleCalendarClick = () => {
    if (window.gtag) {
      window.gtag('event', 'button_click', {
        'event_category': 'interaction', 
        'button_name': 'calendar',
        'transport_type': 'beacon',
        'non_interaction': false
      });
    }
    
    const eventTitle = "Art Gallery Event";
    const eventLocation = "French Fried Vintage, 7 Emory Pl, Knoxville, TN 37917";
    const eventDescription = "Join us for an art gallery event at French Fried Vintage!";
    
    const googleStart = "20250502T220000Z";
    const googleEnd = "20250503T000000Z";
    
    const eventDate = "2025-05-02";
    const startTime = "18:00";
    const endTime = "20:00";
    
    const googleCalendarUrl = `https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(eventTitle)}&dates=${googleStart}/${googleEnd}&details=${encodeURIComponent(eventDescription)}&location=${encodeURIComponent(eventLocation)}&sf=true`;
    
    const outlookCalendarUrl = `https://outlook.live.com/calendar/0/deeplink/compose?subject=${encodeURIComponent(eventTitle)}&startdt=${eventDate}T${startTime}&enddt=${eventDate}T${endTime}&body=${encodeURIComponent(eventDescription)}&location=${encodeURIComponent(eventLocation)}`;
    
    const yahooCalendarUrl = `https://calendar.yahoo.com/?v=60&title=${encodeURIComponent(eventTitle)}&st=${googleStart}&et=${googleEnd}&desc=${encodeURIComponent(eventDescription)}&in_loc=${encodeURIComponent(eventLocation)}`;
    
    const appleCalendarUrl = `data:text/calendar;charset=utf8,${encodeURIComponent(generateCalendarFile())}`;
    
    const modal = document.createElement('div');
    modal.id = 'calendar-modal';
    modal.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
      z-index: 10000;
      display: flex;
      flex-direction: column;
      gap: 10px;
      min-width: 300px;
      color: #333;
    `;
    
    modal.innerHTML = `
      <h3 style="margin: 0 0 10px; text-align: center;">Add to Calendar</h3>
      <a href="${googleCalendarUrl}" target="_blank" rel="noopener noreferrer" style="padding: 10px; background: #4285F4; color: white; text-decoration: none; border-radius: 4px; text-align: center;">Google Calendar</a>
      <a href="${outlookCalendarUrl}" target="_blank" rel="noopener noreferrer" style="padding: 10px; background: #0078D4; color: white; text-decoration: none; border-radius: 4px; text-align: center;">Outlook</a>
      <a href="${yahooCalendarUrl}" target="_blank" rel="noopener noreferrer" style="padding: 10px; background: #6001D2; color: white; text-decoration: none; border-radius: 4px; text-align: center;">Yahoo Calendar</a>
      <a href="${appleCalendarUrl}" download="art-gallery-event.ics" style="padding: 10px; background: #333; color: white; text-decoration: none; border-radius: 4px; text-align: center;">Apple Calendar / .ics</a>
      <button id="close-modal" style="padding: 10px; background: #ddd; color: #333; border: none; border-radius: 4px; margin-top: 10px; cursor: pointer;">Close</button>
    `;
    
    const existingModal = document.getElementById('calendar-modal');
    if (existingModal) {
      existingModal.remove();
    }
    
    document.body.appendChild(modal);
    
    const removeModal = () => {
      const modalToRemove = document.getElementById('calendar-modal');
      if (modalToRemove && modalToRemove.parentNode) {
        modalToRemove.parentNode.removeChild(modalToRemove);
      }
      document.removeEventListener('click', handleOutsideClick);
    };
    
    const closeButton = document.getElementById('close-modal');
    if (closeButton) {
      closeButton.addEventListener('click', (e) => {
        e.stopPropagation();
        removeModal();
      });
    }
    
    const handleOutsideClick = (e) => {
      const modalElem = document.getElementById('calendar-modal');
      if (modalElem && (!modalElem.contains(e.target) || e.target === modalElem)) {
        removeModal();
      }
    };
    
    setTimeout(() => {
      document.addEventListener('click', handleOutsideClick);
    }, 100);
  };

  const handleDownloadClick = async () => {
    const originalInnerHTML = document.activeElement.innerHTML;
    
    if (window.gtag) {
      window.gtag('event', 'button_click', {
        'event_category': 'interaction', 
        'button_name': 'download',
        'transport_type': 'beacon',
        'non_interaction': false
      });
    }
    
    try {
      if (document.activeElement.tagName === 'BUTTON') {
        document.activeElement.innerHTML = '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="white" stroke-width="2" fill="none" stroke-dasharray="40" stroke-dashoffset="0"><animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="1s" repeatCount="indefinite" /></circle></svg>';
      }
      
      const imageDataUrl = await generatePrizeImage(prizeTextRef.current);
      
      const downloadLink = document.createElement('a');
      downloadLink.href = imageDataUrl;
      downloadLink.download = 'SeeYouThere.png';
      
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      
      setTimeout(() => {
        if (document.activeElement.tagName === 'BUTTON') {
          document.activeElement.innerHTML = originalInnerHTML;
        }
      }, 500);
      
    } catch (error) {
      if (document.activeElement.tagName === 'BUTTON') {
        document.activeElement.innerHTML = originalInnerHTML;
      }
    }
  };

  const handleCloseClick = () => {
    setIsVisible(false);
    setIsFadingOut(true);
    setPrizeState('acquiring');
    
    setTimeout(() => {
      setIsMounted(false);
      setIsFadingOut(false);
    }, 300);
  };

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