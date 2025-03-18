import React, { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Text } from '@react-three/drei';

const HealthBar = ({ enemyPosition, healthPercentage }) => {
  const healthBarRef = useRef();
  const { camera } = useThree();

  const barWidth = 1.5; // Fixed width of the health bar
  const barHeight = 0.2; // Fixed height

  useFrame(() => {
    if (healthBarRef.current) {
      healthBarRef.current.position.set(enemyPosition.x, enemyPosition.y + 1.5, enemyPosition.z);
      healthBarRef.current.lookAt(camera.position);
    }
  });

  return (
    <group ref={healthBarRef}>
      {/* Background bar (Full size) */}
      <mesh position={[0, 0, 0]}>
        <planeGeometry args={[barWidth, barHeight]} />
        <meshBasicMaterial color="black" opacity={0.5} transparent />
      </mesh>

      {/* Red bar (Depleted health, always full size) */}
      <mesh position={[0, 0, 0.001]}>
        <planeGeometry args={[barWidth, barHeight]} />
        <meshBasicMaterial color="red" />
      </mesh>

      {/* Green bar (Remaining health, shrinks from right to left) */}
      <mesh position={[(-barWidth / 2) + (healthPercentage / 100) * (barWidth / 2), 0, 0.002]}>
        <planeGeometry args={[(barWidth * healthPercentage) / 100, barHeight]} />
        <meshBasicMaterial color="green" />
      </mesh>

      {/* Health percentage text */}
      <Text position={[0, 0, 0.01]} fontSize={0.12} color="white" anchorX="center" anchorY="middle">
        {`${Math.round(healthPercentage)}%`}
      </Text>
    </group>
  );
};

export default HealthBar;
