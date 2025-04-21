import React, { useRef, useEffect, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import useGameStore from '../store';
import MessageService from '../utils/messageService';
import Eye from './eye';

const MessageOverlay3D = () => {
  const { camera, size } = useThree();
  const groupRef = useRef();
  const textPlaneRef = useRef();
  const backingPlaneRef = useRef();
  const textCanvasRef = useRef(document.createElement('canvas'));
  const textTextureRef = useRef();
  const [planeWidth, setPlaneWidth] = useState(4);
  const [planeHeight, setPlaneHeight] = useState(2);
  
  // Get render order constants from store
  const renderOrder = useGameStore(state => state.renderOrder);
  
  // Track for click-to-dismiss functionality
  const pointerDownTimeRef = useRef(0);
  const pointerDownPositionRef = useRef({ x: 0, y: 0 });
  const isDraggingRef = useRef(false);
  const textCompletedRef = useRef(false);
  
  // Animation tracking
  const animationStartTimeRef = useRef(0);
  const initialFloatPositionRef = useRef(null);
  const floatPhaseRef = useRef(Math.random() * Math.PI * 2);
  const textTypingTimerRef = useRef(null);
  const [opacity, setOpacity] = useState(0);
  const [displayedText, setDisplayedText] = useState('');
  
  // Store the initial plane position in "body forward" direction
  const initialPositionRef = useRef(null);
  const hasSetInitialPosition = useRef(false);

  // Add state to track light intensity (initial 0)
  const [lightIntensity, setLightIntensity] = useState(0);
  const lightRef = useRef();

  // Adjust plane size based on screen width
  useEffect(() => {
    const aspectRatio = size.width / size.height;
    
    const baseWidth = Math.min(Math.max(1.5 * aspectRatio, 2.4), 2.5);
    const marginFactor = 0.4;
    const newWidth = baseWidth * marginFactor;
    
    const newHeight = newWidth * 0.7;
    
    setPlaneWidth(newWidth);
    setPlaneHeight(newHeight);
  }, [size.width, size.height]);

  // Get state from the store
  const showMessageOverlay = useGameStore(state => state.showMessageOverlay);
  const currentMessage = useGameStore(state => state.currentMessage);
  const progressExperience = useGameStore(state => state.progressExperience);
  const typingInProgress = useGameStore(state => state.typingInProgress);
  
  // Handle all animations when overlay appears or disappears
  useEffect(() => {
    if (textTypingTimerRef.current) {
      clearInterval(textTypingTimerRef.current);
      textTypingTimerRef.current = null;
    }
    
    if (showMessageOverlay) {
      setOpacity(0);
      setLightIntensity(0);
      setDisplayedText('');
      textCompletedRef.current = false;
      hasSetInitialPosition.current = false;
      floatPhaseRef.current = Math.random() * Math.PI * 2;
      animationStartTimeRef.current = performance.now();
      
      if (currentMessage) {
        const textIndexRef = { current: 0 };
        
        textTypingTimerRef.current = setInterval(() => {
          if (textIndexRef.current < currentMessage.length) {
            const newText = currentMessage.substring(0, textIndexRef.current + 1);
            setDisplayedText(newText);
            textIndexRef.current++;
          } else {
            textCompletedRef.current = true;
            clearInterval(textTypingTimerRef.current);
            textTypingTimerRef.current = null;
            useGameStore.getState().setTypingInProgress(false);
          }
        }, 40);
      }
    }
    
    return () => {
      if (textTypingTimerRef.current) {
        clearInterval(textTypingTimerRef.current);
        textTypingTimerRef.current = null;
      }
    };
  }, [showMessageOverlay, currentMessage]);

  // Create canvas texture for text rendering
  useEffect(() => {
    const canvas = textCanvasRef.current;
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    ctx.font = 'bold 64px Arial';
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    const wrapText = (text, x, y, maxWidth, lineHeight) => {
      if (!text || text.length === 0) return;
      
      const words = text.split(' ');
      let line = '';
      let lines = [];
      
      words.forEach((word) => {
        const testLine = line + word + ' ';
        const metrics = ctx.measureText(testLine);
        
        if (metrics.width > maxWidth && line !== '') {
          lines.push(line);
          line = word + ' ';
        } else {
          line = testLine;
        }
      });
      
      if (line.length > 0) {
        lines.push(line);
      }
      
      const totalHeight = lines.length * lineHeight;
      
      const startY = y - (totalHeight / 2);
      
      lines.forEach((l, index) => {
        const lineY = startY + index * lineHeight;
        ctx.fillText(l, x, lineY);
      });
    };
    
    wrapText(displayedText, canvas.width / 2, canvas.height / 2, 800, 60);
    
    if (!textTextureRef.current) {
      textTextureRef.current = new THREE.CanvasTexture(canvas);
      textTextureRef.current.premultiplyAlpha = true;
      textTextureRef.current.wrapS = THREE.ClampToEdgeWrapping;
      textTextureRef.current.wrapT = THREE.ClampToEdgeWrapping;
    } else {
      textTextureRef.current.needsUpdate = true;
    }
  }, [displayedText]);

  // Handle all animated effects in a single frame update
  useFrame((state, delta) => {
    if (!groupRef.current) return;
    
    if (showMessageOverlay) {
      if (!hasSetInitialPosition.current) {
        const playerPosition = useGameStore.getState().playerPosition;
        
        const overlayDistance = 1.5;
        const overlayHeight = 0.0;
        const overlayPosition = new THREE.Vector3(
          playerPosition.x,
          playerPosition.y + overlayHeight,
          playerPosition.z + overlayDistance
        );
        
        initialPositionRef.current = overlayPosition.clone();
        initialFloatPositionRef.current = overlayPosition.clone();
        hasSetInitialPosition.current = true;
        
        groupRef.current.position.copy(initialPositionRef.current);
      }
      
      const elapsedMs = performance.now() - animationStartTimeRef.current;
      const elapsedSeconds = elapsedMs / 1000;
      
      const fadeInDuration = 0.8;
      const fadeProgress = Math.min(elapsedSeconds / fadeInDuration, 1);
      
      const fadeEaseProgress = 1 - Math.pow(1 - fadeProgress, 3);
      
      const newOpacity = fadeEaseProgress;
      setOpacity(newOpacity);
      
      const newLightIntensity = fadeEaseProgress * 5;
      setLightIntensity(newLightIntensity);
      
      floatPhaseRef.current += delta * 0.3;
      
      const yOffset = Math.sin(floatPhaseRef.current) * 0.04;
      const xOffset = Math.cos(floatPhaseRef.current * 0.63) * 0.02;
      const rotationOffset = Math.sin(floatPhaseRef.current * 0.4) * 0.005;
      
      if (initialFloatPositionRef.current) {
        groupRef.current.position.copy(initialFloatPositionRef.current);
        groupRef.current.position.y += yOffset * fadeEaseProgress;
        groupRef.current.position.x += xOffset * fadeEaseProgress;
        
        groupRef.current.rotation.z = rotationOffset * fadeEaseProgress;
      }
    } 
    else if (opacity > 0) {
      const fadeOutSpeed = 0.1 / 0.1;
      setOpacity(Math.max(0, opacity - fadeOutSpeed * delta));
      
      setLightIntensity(Math.max(0, lightIntensity - fadeOutSpeed * 3 * delta));
    }
    
    if (groupRef.current && camera) {
      const cameraPosition = new THREE.Vector3();
      camera.getWorldPosition(cameraPosition);
      
      const overlayPosition = new THREE.Vector3();
      groupRef.current.getWorldPosition(overlayPosition);
      
      const direction = new THREE.Vector3();
      direction.subVectors(cameraPosition, overlayPosition);
      direction.y = 0;
      direction.normalize();
      
      const angle = Math.atan2(direction.x, direction.z);
      
      groupRef.current.rotation.x = 0;
      groupRef.current.rotation.y = angle;
    }
    
    if (backingPlaneRef.current?.material) {
      backingPlaneRef.current.material.opacity = opacity * 0.8;
    }
    
    if (textPlaneRef.current?.material) {
      textPlaneRef.current.material.opacity = opacity;
    }
    
    if (lightRef.current) {
      lightRef.current.intensity = lightIntensity;
    }
  });
  
  // Shared click handlers for all mesh elements
  const handlePointerDown = (e) => {
    e.stopPropagation();
    
    pointerDownTimeRef.current = performance.now();
    pointerDownPositionRef.current = { x: e.point.x, y: e.point.z };
    isDraggingRef.current = false;
  };
  
  const handlePointerMove = (e) => {
    e.stopPropagation();
    
    if (pointerDownTimeRef.current > 0) {
      const dx = e.point.x - pointerDownPositionRef.current.x;
      const dy = e.point.z - pointerDownPositionRef.current.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance > 0.05) {
        isDraggingRef.current = true;
      }
    }
  };
  
  const handlePointerUp = (e) => {
    e.stopPropagation();
    
    const clickDuration = performance.now() - pointerDownTimeRef.current;
    
    if (clickDuration < 300 && !isDraggingRef.current) {
      if (typingInProgress) {
        if (textTypingTimerRef.current) {
          clearInterval(textTypingTimerRef.current);
          textTypingTimerRef.current = null;
        }
        
        setDisplayedText(currentMessage);
        
        textCompletedRef.current = true;
        
        useGameStore.getState().setTypingInProgress(false);
      } 
      else if (textCompletedRef.current) {
        progressExperience();
      }
    }
    
    pointerDownTimeRef.current = 0;
    isDraggingRef.current = false;
  };
  
  if (!showMessageOverlay && opacity <= 0.01) return null;

  const eyeScale = [planeWidth * 0.07, planeWidth * 0.07];
  
  return (
    <group ref={groupRef}>
      <mesh
        ref={backingPlaneRef}
        renderOrder={renderOrder.MESSAGE_OVERLAY}
        position={[0, 0, -0.005]}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        castShadow={false}
        receiveShadow={false}
      >
        <planeGeometry args={[planeWidth, planeHeight]} />
        <meshBasicMaterial
          color="#3a4a6a"
          transparent={true}
          opacity={0.8 * opacity}
          depthTest={true}
          depthWrite={false}
        />
      </mesh>

      <mesh
        renderOrder={renderOrder.MESSAGE_OVERLAY - 1}
        position={[0, 0, -0.008]}
        castShadow={false}
        receiveShadow={false}
      >
        <planeGeometry args={[planeWidth + 0.1, planeHeight + 0.1]} />
        <meshBasicMaterial
          color="#55aaff"
          transparent={true}
          opacity={0.6 * opacity}
          depthTest={true}
          depthWrite={false}
        />
      </mesh>

      <mesh 
        ref={textPlaneRef} 
        renderOrder={renderOrder.MESSAGE_OVERLAY + 1}
        position={[0, planeHeight * 0.15, 0]}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        castShadow={false}
        receiveShadow={false}
      >
        <planeGeometry args={[planeWidth - 0.08, planeHeight - 0.15]} />
        <meshBasicMaterial 
          map={textTextureRef.current}
          transparent={true}
          opacity={opacity}
          side={THREE.FrontSide}
          depthTest={true}
          depthWrite={false}
        />
      </mesh>

      <group 
        position={[0, -planeHeight/2 + eyeScale[1], 0.01]}
        renderOrder={renderOrder.MESSAGE_OVERLAY + 2}
      >
        <Eye 
          position={[.2, .06, 0]}
          scale={[.2, .2]}
          rotation={[0, 0, 0]}
          opacity={opacity}
          randomize={true}
          float={false}
        />
        <Eye 
          position={[-.2, .06, 0]}
          scale={[.2, .2]}
          rotation={[0, 0, 0]}
          opacity={opacity}
          randomize={true}
          float={false}
        />
      </group>
    </group>
  );
};

export default React.memo(MessageOverlay3D);