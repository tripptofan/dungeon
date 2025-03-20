import { useEffect } from "react";
import useGameStore from "./store";

const DeviceDetection = () => {
  const setIsMobile = useGameStore((state) => state.setIsMobile);

  useEffect(() => {
    const isMobile = /Mobi|Android/i.test(navigator.userAgent);
    setIsMobile(isMobile);
  }, [setIsMobile]);

  return null;
};

export default DeviceDetection;
