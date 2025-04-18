import React, { useRef, useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import useGameStore from '../store';

const PortalEffect = ({ position = [5, 2.5, 95], rotation = [0, 0, 0], scale = [2, 3, 1] }) => {
  const videoRef = useRef();
  const textureRef = useRef();
  const materialRef = useRef();
  const meshRef = useRef();
  const { scene } = useThree();
  
  // Get render order constants from store
  const renderOrder = useGameStore(state => state.renderOrder);
  
  // Set up video texture when component mounts
  useEffect(() => {
    // Create video element
    const video = document.createElement('video');
    video.src = '/portal.webm';
    video.crossOrigin = 'anonymous';
    video.loop = true;
    video.muted = true;
    video.playsInline = true;
    
    // Store reference for cleanup
    videoRef.current = video;
    
    // Create video texture
    const texture = new THREE.VideoTexture(video);
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.format = THREE.RGBAFormat;
    texture.generateMipmaps = false;
    
    // Store reference for updates
    textureRef.current = texture;
    
    // Create material with the texture
    if (materialRef.current) {
      materialRef.current.map = texture;
      materialRef.current.needsUpdate = true;
    }
    
    // Start playback
    video.play().catch(e => {
      console.warn('Portal video playback failed:', e);
      
      // Add click handler to allow user-initiated playback if autoplay fails
      const playHandler = () => {
        video.play().then(() => {
          document.removeEventListener('click', playHandler);
          document.removeEventListener('touchstart', playHandler);
        }).catch(err => console.error('Portal playback still failed:', err));
      };
      
      document.addEventListener('click', playHandler);
      document.addEventListener('touchstart', playHandler);
    });
    
    // Cleanup function
    return () => {
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.src = '';
        videoRef.current.load();
      }
      
      if (textureRef.current) {
        textureRef.current.dispose();
      }
    };
  }, []);
  
  return (
    <mesh 
      position={position}
      rotation={rotation}
      scale={scale}
      renderOrder={renderOrder.ACQUIRED_ITEMS - 1} // Make sure it renders in front of the door but behind acquired items
      ref={meshRef}
    >
      <planeGeometry />
      <meshStandardMaterial 
        ref={materialRef}
        transparent={true}
        side={THREE.DoubleSide}
        emissive="#1a55ff" // Blue emission color
        emissiveIntensity={1.5}
        depthTest={true}
        depthWrite={false}  // Don't write to depth buffer to avoid affecting other transparent objects
      />
    </mesh>
  );
};

export default PortalEffect;