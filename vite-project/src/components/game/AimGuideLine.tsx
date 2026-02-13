import { Line } from '@react-three/drei';
import * as THREE from 'three';

interface AimGuideLineProps {
  start: THREE.Vector3;
  direction: THREE.Vector3;
  power: number;
  visible: boolean;
}

// Simulates trajectory with friction
const calculateTrajectoryPoints = (
  start: THREE.Vector3,
  direction: THREE.Vector3,
  power: number,
  steps: number = 30
): [number, number, number][] => {
  const points: [number, number, number][] = [];
  const friction = 0.965;
  
  let x = start.x;
  let z = start.z;
  let vx = direction.x * power * 0.3;
  let vz = direction.z * power * 0.3;
  
  for (let i = 0; i < steps; i++) {
    points.push([x, 0.25, z]);
    
    x += vx;
    z += vz;
    vx *= friction;
    vz *= friction;
    
    // Stop if velocity is very low
    if (Math.sqrt(vx * vx + vz * vz) < 0.002) break;
  }
  
  return points;
};

export const AimGuideLine = ({ start, direction, power, visible }: AimGuideLineProps) => {
  if (!visible || power < 0.05) return null;
  
  const trajectoryPoints = calculateTrajectoryPoints(start, direction, power);
  
  if (trajectoryPoints.length < 2) return null;
  
  // Create gradient colors for the trajectory
  const colors = trajectoryPoints.map((_, i) => {
    const t = i / trajectoryPoints.length;
    // Fade from white to transparent
    return new THREE.Color(1, 1, 1).multiplyScalar(1 - t * 0.7);
  });
  
  return (
    <group>
      {/* Main trajectory line */}
      <Line
        points={trajectoryPoints}
        color="#ffffff"
        lineWidth={2}
        transparent
        opacity={0.6}
        dashed
        dashSize={0.15}
        gapSize={0.1}
      />
      
      {/* Predicted landing spot */}
      {trajectoryPoints.length > 5 && (
        <mesh position={trajectoryPoints[trajectoryPoints.length - 1]}>
          <ringGeometry args={[0.1, 0.15, 16]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.5} side={THREE.DoubleSide} />
        </mesh>
      )}
      
      {/* Power indicator dots along trajectory */}
      {trajectoryPoints
        .filter((_, i) => i % 5 === 0 && i > 0)
        .map((point, i) => (
          <mesh key={i} position={point}>
            <sphereGeometry args={[0.04, 8, 8]} />
            <meshBasicMaterial 
              color={power > 0.7 ? '#ff4444' : power > 0.4 ? '#ffaa00' : '#44ff44'} 
              transparent 
              opacity={0.8 - (i * 0.15)}
            />
          </mesh>
        ))
      }
    </group>
  );
};
