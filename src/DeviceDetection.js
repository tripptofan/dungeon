import { useEffect } from "react";
import useGameStore from "./store";

// Simple component that checks device type once on mount
const DeviceDetection = () => {
  const setIsMobile = useGameStore((state) => state.setIsMobile);

  useEffect(() => {
    // Check if device is mobile
    const checkIsMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor || window.opera;
      const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase());
      return isMobileDevice;
    };
    
    // Set the mobile state just once
    setIsMobile(checkIsMobile());
    
    // No cleanup or dependencies - this should run exactly once
  }, [setIsMobile]);

  // This component doesn't render anything
  return null;
};

export default DeviceDetection;