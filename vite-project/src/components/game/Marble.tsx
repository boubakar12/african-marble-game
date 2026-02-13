import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface MarbleProps {
  position: [number, number, number];
  color: string;
  velocity?: React.MutableRefObject<THREE.Vector3>;
  isShooter?: boolean;
  isKnockedOut?: boolean;
}

export const Marble = ({ 
  position, 
  color, 
  velocity, 
  isShooter = false,
  isKnockedOut = false 
}: MarbleProps) => {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (!meshRef.current || !velocity) return;
    
    // Update position based on velocity
    meshRef.current.position.x += velocity.current.x;
    meshRef.current.position.z += velocity.current.z;
    
    // Apply friction
    velocity.current.x *= 0.96;
    velocity.current.z *= 0.96;
    
    // Rotate marble based on movement (realistic rolling)
    const speed = Math.sqrt(velocity.current.x ** 2 + velocity.current.z ** 2);
    if (speed > 0.001) {
      meshRef.current.rotation.x += velocity.current.z * 2;
      meshRef.current.rotation.z -= velocity.current.x * 2;
    }
    
    // Stop if velocity is very low
    if (speed < 0.001) {
      velocity.current.set(0, 0, 0);
    }
  });

  return (
    <mesh 
      ref={meshRef} 
      position={position}
      castShadow
      receiveShadow
    >
      <sphereGeometry args={[0.15, 32, 32]} />
      <meshStandardMaterial 
        color={color}
        metalness={isShooter ? 0.4 : 0.3}
        roughness={isShooter ? 0.1 : 0.2}
        opacity={isKnockedOut ? 0.3 : 1}
        transparent={isKnockedOut}
      />
    </mesh>
  );
};
