import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber'; // Add the useFrame import
import { Sphere, MeshDistortMaterial } from '@react-three/drei';
import useGameStore from '../store'; // Adjust the import path as needed

const Projectiles = ({ projectile }) => {
  const { learnedMagic } = useGameStore();
  const magicData = learnedMagic[projectile.type] || {};
  const { color } = magicData;
  
  const projectileRef = useRef();

  // Use the velocity to move the projectile
  useFrame(() => {
    if (projectileRef.current) {
      // Update the position based on the velocity
      projectileRef.current.position.add(projectile.velocity);
    }
  });

  if (!color) return null; // Return nothing if the projectile type is invalid

  return (
    <Sphere ref={projectileRef} args={[0.2, 16, 16]} position={projectile.position}>
      <MeshDistortMaterial color={color.split('/')[0]} distort={0.2} speed={2} />
    </Sphere>
  );
};

export default Projectiles;
