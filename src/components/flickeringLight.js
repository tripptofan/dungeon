import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { createNoise2D } from "simplex-noise";

const noise2D = createNoise2D();

const FlickeringLight = ({ position, randomizer = Math.random() }) => {
  const lightRef = useRef();
  const time = useRef(Math.random() * 1000);
  const timeOffset = Math.random() * 1000;

  // 🔹 Compute light behavior based on randomizer
  const baseIntensity = 12 + randomizer * 5; // Between 8 and 15
  const flickerAmount = 2 + randomizer * 2; // Between 3 and 10
  const flickerSpeed = 0.0002 + randomizer * 0.0002; // Between 0.002 and 0.004
  const blackoutChance = 0.003 + randomizer * 0.004; // Between 3% and 7%
  const minIntensity = baseIntensity * 0.7; // 🔹 Ensures the light never drops below 80% of its base

  useFrame(() => {
    if (lightRef.current) {
      time.current += flickerSpeed;

      let flickerFactor = noise2D(time.current * 0.1, timeOffset) * flickerAmount;

      // Introduce occasional dramatic dimming
      if (Math.random() < blackoutChance) {
        flickerFactor -= baseIntensity * (0.7 + Math.random() * 0.2); // Drops but not fully out
      }

      lightRef.current.intensity = Math.max(minIntensity, baseIntensity + flickerFactor);
    }
  });

  return (
    <group position={position}>
      <mesh>
        <sphereGeometry args={[0.3, 8, 8]} />
        <meshStandardMaterial emissive="yellow" emissiveIntensity={15} transparent opacity={0.5} />
      </mesh>
      <pointLight
        ref={lightRef}
        intensity={baseIntensity}
        color="white"
        distance={9}
        decay={1.2}
        castShadow
      />
    </group>
  );
};

export default FlickeringLight;
