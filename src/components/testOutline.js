import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { EffectComposer, Outline } from '@react-three/postprocessing';

const TestOutline = () => {
  // Create refs for all the meshes we want to outline
  const box1Ref = useRef();
  const box2Ref = useRef();
  const sphereRef = useRef();
  
  // Animate objects to make them more visible
  useFrame((state) => {
    if (box1Ref.current && box2Ref.current && sphereRef.current) {
      box1Ref.current.rotation.y += 0.01;
      box2Ref.current.rotation.x += 0.01;
      sphereRef.current.rotation.z += 0.01;
    }
  });
  
  return (
    <>
      {/* Test objects positioned where they'll be visible */}
      <mesh ref={box1Ref} position={[5, 2, 8]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="red" />
      </mesh>
      
      <mesh ref={box2Ref} position={[12, 2, 10]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="blue" />
      </mesh>
      
      <mesh ref={sphereRef} position={[14, 2, 10]}>
        <sphereGeometry args={[0.7, 32, 32]} />
        <meshStandardMaterial color="green" />
      </mesh>
      
      {/* Self-contained outline effect for just these objects */}
      <EffectComposer multisampling={0} autoClear={false}>
        <Outline 
          selection={[box1Ref.current, box2Ref.current, sphereRef.current].filter(Boolean)}
          selectionLayer={10}
          blendFunction={0} // Normal
          edgeStrength={10}
          edgeGlow={0}
          edgeThickness={2}
          pulseSpeed={0}
          visibleEdgeColor={0x000000}
          hiddenEdgeColor={0x000000}
          blur={false}
          xRay={true}
        />
      </EffectComposer>
    </>
  );
};

export default TestOutline;