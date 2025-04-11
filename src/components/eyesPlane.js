import Eye from './eye';

const EyesPlane = () => {
    

  return (
    <group
      position={[5, 2, 5.2]}
    >
      
    <Eye position={[.03, 0, -.01]} scale={[.05, .05]} />
    <Eye position={[-.03, 0, -.01]} scale={[.05, .05]} />
      <mesh rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[1, 1]} />
        <meshStandardMaterial color="black"/>
      </mesh> 
    </group>
  );
}
export default EyesPlane;