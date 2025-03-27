import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';

// This component forces Three.js to render when mounted
const ForceRender = () => {
  const { gl, scene, camera, invalidate } = useThree();
  
  useEffect(() => {
    // Function to force a render
    const forceRender = () => {
      gl.render(scene, camera);
      invalidate();
    };
    
    // Force a render immediately
    forceRender();
    
    // Schedule another render after a short delay
    const timer1 = setTimeout(forceRender, 50);
    const timer2 = setTimeout(forceRender, 200);
    const timer3 = setTimeout(forceRender, 500);
    
    // Also force render on resize
    const handleResize = () => {
      setTimeout(forceRender, 10);
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      window.removeEventListener('resize', handleResize);
    };
  }, [gl, scene, camera, invalidate]);
  
  // This component doesn't render anything
  return null;
};

export default ForceRender;