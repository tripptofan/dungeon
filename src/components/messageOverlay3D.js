import React, { useRef, useEffect, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import useGameStore from '../store';
import MessageService from '../utils/messageService';

const MessageOverlay3D = () => {
  const { camera, size } = useThree();
  const backgroundPlaneRef = useRef();
  const textPlaneRef = useRef();
  const textCanvasRef = useRef(document.createElement('canvas'));
  const textTextureRef = useRef();
  const [planeWidth, setPlaneWidth] = useState(4);
  const [planeHeight, setPlaneHeight] = useState(2);

  // Adjust plane size based on screen width
  useEffect(() => {
    const aspectRatio = size.width / size.height;
    
    // Calculate a much narrower width to ensure visible gaps at the sides
    // Reduced from 2.2 * aspectRatio to 1.8 * aspectRatio for narrower width
    // Also reduced max width from 4 to 3 to ensure it doesn't get too wide
    const baseWidth = Math.min(Math.max(1.8 * aspectRatio, 2), 3);
    
    // Increase the margin for better fit
    const marginFactor = 0.5; // 20% margin on each side (increased from 15%)
    const newWidth = baseWidth * marginFactor;
    
    // Keep the height proportional but slightly taller for better text display
    const newHeight = newWidth * 1.4; // Changed from 2.2:1 to 2.0:1 for slightly taller box
    
    setPlaneWidth(newWidth);
    setPlaneHeight(newHeight);
  }, [size.width, size.height]);

  // Get state from the store
  const showMessageOverlay = useGameStore(state => state.showMessageOverlay);
  const currentMessage = useGameStore(state => state.currentMessage);
  const progressExperience = useGameStore(state => state.progressExperience);
  const typingInProgress = useGameStore(state => state.typingInProgress);
  const [displayedText, setDisplayedText] = useState('');

  // Handle text typing - reset displayed text when message changes
  useEffect(() => {
    if (currentMessage) {
      // Reset the displayed text completely when current message changes
      setDisplayedText('');
      
      // Create a new typing animation
      let currentIndex = 0;
      const typingInterval = setInterval(() => {
        if (currentIndex < currentMessage.length) {
          // Set the new text directly instead of appending to previous text
          // This ensures correct rendering at every step
          const newText = currentMessage.substring(0, currentIndex + 1);
          setDisplayedText(newText);
          currentIndex++;
        } else {
          clearInterval(typingInterval);
        }
      }, 40);

      return () => clearInterval(typingInterval);
    }
  }, [currentMessage]);

  // Create canvas texture for text rendering
  useEffect(() => {
    const canvas = textCanvasRef.current;
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    
    // Clear canvas with full transparency
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw a subtle background to help with debugging text boundaries
    // ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    // ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Add substantial padding around the entire canvas to prevent text clipping
    const padding = 80; // Significantly increase padding around text content
    
    // Prepare text rendering with properly sized font
    ctx.font = 'bold 72px Arial'; // Slightly smaller font for even better fit
    ctx.fillStyle = 'black';
    ctx.textAlign = 'center'; // Keep center alignment for horizontal positioning
    ctx.textBaseline = 'middle'; // Middle alignment for vertical positioning
    
    // Wrap text logic with improved text sizing and spacing
    const wrapText = (text, x, y, maxWidth, lineHeight) => {
      if (!text || text.length === 0) return; // Guard against empty text
      
      const words = text.split(' ');
      let line = '';
      let yOffset = y;
      let lines = [];
      
      words.forEach((word) => {
        const testLine = line + word + ' ';
        const metrics = ctx.measureText(testLine);
        
        if (metrics.width > maxWidth && line !== '') {
          lines.push(line);
          line = word + ' ';
          yOffset += lineHeight;
        } else {
          line = testLine;
        }
      });
      
      // Add the last line
      if (line.length > 0) {
        lines.push(line);
      }
      
      // Render lines centered vertically
      const totalHeight = lines.length * lineHeight;
      const startY = y - totalHeight / 2;
      
      // Debug - draw the text area boundary
      // ctx.strokeStyle = 'blue';
      // ctx.strokeRect(x - maxWidth/2, startY - 30, maxWidth, totalHeight + 60);
      
      lines.forEach((l, index) => {
        // Ensure each line is drawn with proper spacing
        const lineY = startY + index * lineHeight;
        
        // Optional: Draw a background highlight behind each line for debugging
        // const textWidth = ctx.measureText(l).width;
        // ctx.fillStyle = 'rgba(255,255,0,0.2)';
        // ctx.fillRect(x - textWidth/2, lineY - lineHeight/2, textWidth, lineHeight);
        // ctx.fillStyle = 'black';
        
        // Draw the text - centered horizontally
        ctx.fillText(l, x, lineY);
      });
    };
    
    // Use a narrower width to ensure text has plenty of room at the edges
    // Reduced from 760 to 700 for even more padding
    wrapText(displayedText, canvas.width / 2, canvas.height / 2, 1000, 55);
    
    // Create a debug grid to help visualize the text boundaries (for development)
    // const debugGrid = () => {
    //   // Draw a border around the entire canvas
    //   ctx.strokeStyle = 'rgba(255,0,0,0.5)';
    //   ctx.lineWidth = 2;
    //   ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);
      
    //   // Draw center lines
    //   ctx.strokeStyle = 'rgba(0,0,255,0.5)';
    //   ctx.beginPath();
    //   ctx.moveTo(canvas.width/2, 0);
    //   ctx.lineTo(canvas.width/2, canvas.height);
    //   ctx.moveTo(0, canvas.height/2);
    //   ctx.lineTo(canvas.width, canvas.height/2);
    //   ctx.stroke();
    // };
    
    // debugGrid(); // Uncomment for debugging
    
    // Create or update texture
    if (!textTextureRef.current) {
      textTextureRef.current = new THREE.CanvasTexture(canvas);
      textTextureRef.current.premultiplyAlpha = true; // Preserve alpha
      // Set proper texture properties to avoid clipping
      textTextureRef.current.wrapS = THREE.ClampToEdgeWrapping;
      textTextureRef.current.wrapT = THREE.ClampToEdgeWrapping;
    } else {
      textTextureRef.current.needsUpdate = true;
    }
  }, [displayedText]);

  // Position the overlay in front of the player
  useFrame(() => {
    if (!backgroundPlaneRef.current || !textPlaneRef.current || !showMessageOverlay) return;
    
    // Calculate direction player is facing
    const cameraDirection = new THREE.Vector3(0, 0, -1);
    cameraDirection.applyQuaternion(camera.quaternion);
    
    // Position the plane much closer to the camera (1.5 units instead of 2.5)
    // This helps ensure it renders in front of floating items and stays in view
    const planePosition = camera.position.clone().add(
      cameraDirection.multiplyScalar(1.5)
    );
    
    // Position planes
    backgroundPlaneRef.current.position.copy(planePosition);
    textPlaneRef.current.position.copy(planePosition);
    
    // Rotate planes to always face the camera
    backgroundPlaneRef.current.lookAt(camera.position);
    textPlaneRef.current.lookAt(camera.position);
  });
  
  // Don't render if no overlay
  if (!showMessageOverlay) return null;
  
  return (
    <group>
      {/* Background Plane - Semi-transparent, emissive, and clickable */}
      <mesh 
        ref={backgroundPlaneRef} 
        renderOrder={10000}
        onClick={(e) => {
          e.stopPropagation();
          
          // If typing is still in progress, instantly complete it
          if (typingInProgress) {
            useGameStore.getState().setTypingInProgress(false);
            // Set the full text immediately
            setDisplayedText(currentMessage);
          } else {
            // Progress to next experience
            progressExperience();
          }
        }}
      >
        <planeGeometry args={[planeWidth, planeHeight]} />
        <meshStandardMaterial 
          color="white"
          emissive="white"
          emissiveIntensity={0.9}
          transparent={true}
          opacity={0.9}
          side={THREE.DoubleSide}
          depthTest={false} // Ensure it renders on top of other objects
        />
      </mesh>

      {/* Text Plane - Transparent with text */}
      <mesh 
        ref={textPlaneRef} 
        renderOrder={10001}
        onClick={(e) => {
          e.stopPropagation();
          
          // If typing is still in progress, instantly complete it
          if (typingInProgress) {
            useGameStore.getState().setTypingInProgress(false);
            // Set the full text immediately
            setDisplayedText(currentMessage);
          } else {
            // Progress to next experience
            progressExperience();
          }
        }}
      >
        <planeGeometry args={[planeWidth - 0.2, planeHeight - 0.2]} /> {/* Even smaller for better margin */}
        <meshBasicMaterial 
          map={textTextureRef.current}
          transparent={true}
          opacity={1}
          side={THREE.DoubleSide}
          depthTest={false} // Ensure it renders on top of other objects
        />
      </mesh>
    </group>
  );
};

export default React.memo(MessageOverlay3D);