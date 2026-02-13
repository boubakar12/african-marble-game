import * as THREE from 'three';

interface SandGroundProps {
  size?: number;
}

export const SandGround = ({ size = 20 }: SandGroundProps) => {
  return (
    <mesh 
      rotation={[-Math.PI / 2, 0, 0]} 
      position={[0, -0.01, 0]} 
      receiveShadow
    >
      <planeGeometry args={[size, size, 32, 32]} />
      <meshStandardMaterial 
        color="#DEB887"
        roughness={0.9}
        metalness={0.1}
      />
    </mesh>
  );
};
