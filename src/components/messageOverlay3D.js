import React, { useRef, useEffect, useState } from 'react';
import { useFrame, useThree, extend } from '@react-three/fiber';
import * as THREE from 'three';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader';
import useGameStore from '../store';
import MessageService from '../utils/messageService';

// Extend Three.js with additional geometries
extend({ TextGeometry });

const MessageOverlay3D = () => {
  const { camera, size } = useThree();
  const backgroundPlaneRef = useRef();
  const textPlaneRef = useRef();
  const buttonRef = useRef();
  const textCanvasRef = useRef(document.createElement('canvas'));
  const textTextureRef = useRef();
  const [font, setFont] = useState(null);
  const [planeWidth, setPlaneWidth] = useState(4);
  const [planeHeight, setPlaneHeight] = useState(2);

  // Load font
  useEffect(() => {
    const loader = new FontLoader();
    loader.load('https://threejs.org/examples/fonts/helvetiker_regular.typeface.json', (loadedFont) => {
      setFont(loadedFont);
    }, 
    undefined, 
    (error) => {
      console.error('Error loading font:', error);
    });
  }, []);

  // Adjust plane size based on screen width
  useEffect(() => {
    const aspectRatio = size.width / size.height;
    
    // Adjust width based on aspect ratio
    // Wider screens get wider overlay, but with a max and min limit
    const baseWidth = Math.min(Math.max(3 * aspectRatio, 3), 6);
    
    // Subtract a small margin from both sides
    const marginFactor = 0.9; // 10% margin on each side
    const newWidth = baseWidth * marginFactor;
    
    // Make the height a bit taller
    const newHeight = newWidth / 2.5; // 2.5:1 aspect ratio
    
    setPlaneWidth(newWidth);
    setPlaneHeight(newHeight);
  }, [size.width, size.height]);

  // Get state from the store
  const showMessageOverlay = useGameStore(state => state.showMessageOverlay);
  const currentMessage = useGameStore(state => state.currentMessage);
  const progressExperience = useGameStore(state => state.progressExperience);
  const typingInProgress = useGameStore(state => state.typingInProgress);
  const [displayedText, setDisplayedText] = useState('');

  // Handle text typing
  useEffect(() => {
    if (currentMessage) {
      let currentIndex = 0;
      const typingInterval = setInterval(() => {
        if (currentIndex < currentMessage.length) {
          setDisplayedText(prev => prev + currentMessage[currentIndex]);
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
    
    // Prepare text rendering
    ctx.font = 'bold 42px Arial';
    ctx.fillStyle = 'black';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Wrap text logic
    const wrapText = (text, x, y, maxWidth, lineHeight) => {
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
      lines.push(line);
      
      // Render lines centered vertically
      const totalHeight = lines.length * lineHeight;
      const startY = y - totalHeight / 2;
      
      lines.forEach((l, index) => {
        ctx.fillText(l, x, startY + index * lineHeight);
      });
    };
    
    // Render wrapped text
    wrapText(displayedText, canvas.width / 2, canvas.height / 2, 900, 60);
    
    // Create or update texture
    if (!textTextureRef.current) {
      textTextureRef.current = new THREE.CanvasTexture(canvas);
      textTextureRef.current.premultiplyAlpha = true; // Preserve alpha
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
    
    // Create a plane 3 units in front of the camera
    const planePosition = camera.position.clone().add(
      cameraDirection.multiplyScalar(3)
    );
    
    // Position planes
    backgroundPlaneRef.current.position.copy(planePosition);
    textPlaneRef.current.position.copy(planePosition);
    
    // Rotate planes to always face the camera
    backgroundPlaneRef.current.lookAt(camera.position);
    textPlaneRef.current.lookAt(camera.position);
    
    // Position button slightly in front of the plane and in bottom right
    if (buttonRef.current && font) {
      const buttonPosition = planePosition.clone();
      
      // Calculate local right and up vectors relative to camera
      const rightVector = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
      const upVector = new THREE.Vector3(0, 1, 0).applyQuaternion(camera.quaternion);
      
      // Move button to bottom right 
      buttonPosition.add(rightVector.multiplyScalar(planeWidth / 2 - 0.3))  // Move right
                    .sub(upVector.multiplyScalar(planeHeight / 2 - 0.2));   // Move down
      
      // Slight forward offset to avoid z-fighting
      buttonPosition.add(cameraDirection.multiplyScalar(0.01));
      
      buttonRef.current.position.copy(buttonPosition);
      buttonRef.current.lookAt(camera.position);
    }
  });
  
  // Don't render if no overlay
  if (!showMessageOverlay) return null;
  
  return (
    <group>
      {/* Background Plane - Semi-transparent and emissive */}
      <mesh ref={backgroundPlaneRef} renderOrder={9998}>
        <planeGeometry args={[planeWidth, planeHeight]} />
        <meshStandardMaterial 
          color="white"
          emissive="white"
          emissiveIntensity={0.1}
          transparent={true}
          opacity={0.9}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Text Plane - Transparent with text */}
      <mesh ref={textPlaneRef} renderOrder={9999}>
        <planeGeometry args={[planeWidth, planeHeight]} />
        <meshBasicMaterial 
          map={textTextureRef.current}
          transparent={true}
          opacity={1}
          side={THREE.DoubleSide}
        />
      </mesh>
      
      {/* Continue Button */}
      {font && (
        <mesh 
          ref={buttonRef} 
          renderOrder={10000}
          onClick={(e) => {
            e.stopPropagation();
            
            // If typing is still in progress, instantly complete it
            if (typingInProgress) {
              useGameStore.getState().setTypingInProgress(false);
            } else {
              // Progress to next experience
              progressExperience();
            }
          }}
        >
          {/* Text as a small geometry on the button */}
          <textGeometry 
            args={[
              typingInProgress ? 'SKIP' : 'CONTINUE', 
              { 
                font: font,
                size: 0.08,
                height: 0.02 
              }
            ]} 
            position={[0, 0, 0.01]} // Slightly forward to avoid z-fighting
          />
          <meshBasicMaterial color="black" />
        </mesh>
      )}
    </group>
  );
};

export default React.memo(MessageOverlay3D);