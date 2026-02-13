import { useMemo } from 'react';
import * as THREE from 'three';

interface HoleProps {
  position: [number, number, number];
  radius?: number;
}

export const Hole = ({ position, radius = 0.4 }: HoleProps) => {
  return (
    <group position={position}>
      {/* Dark pit bottom */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.15, 0]}>
        <circleGeometry args={[radius * 0.7, 32]} />
        <meshStandardMaterial color="#0a0503" />
      </mesh>
      {/* Inner dark ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]}>
        <ringGeometry args={[radius * 0.5, radius * 0.85, 32]} />
        <meshStandardMaterial color="#1a0d08" />
      </mesh>
      {/* Hole rim with gradient effect */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]}>
        <ringGeometry args={[radius * 0.7, radius, 32]} />
        <meshStandardMaterial color="#2C1810" />
      </mesh>
      {/* Top edge highlight */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.001, 0]}>
        <ringGeometry args={[radius * 0.95, radius * 1.05, 32]} />
        <meshStandardMaterial color="#4a3020" />
      </mesh>
      {/* Cylindrical hole wall */}
      <mesh position={[0, -0.075, 0]}>
        <cylinderGeometry args={[radius * 0.9, radius * 0.7, 0.15, 32, 1, true]} />
        <meshStandardMaterial color="#1a0d08" side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
};

interface TriangleBoundaryProps {
  vertices: [THREE.Vector3, THREE.Vector3, THREE.Vector3];
}

export const TriangleBoundary = ({ vertices }: TriangleBoundaryProps) => {
  const points = useMemo(() => {
    return [
      new THREE.Vector3(vertices[0].x, 0.01, vertices[0].z),
      new THREE.Vector3(vertices[1].x, 0.01, vertices[1].z),
      new THREE.Vector3(vertices[2].x, 0.01, vertices[2].z),
      new THREE.Vector3(vertices[0].x, 0.01, vertices[0].z), // Close the triangle
    ];
  }, [vertices]);

  const lineGeometry = useMemo(() => {
    return new THREE.BufferGeometry().setFromPoints(points);
  }, [points]);

  return (
    <line>
      <bufferGeometry attach="geometry" {...lineGeometry} />
      <lineBasicMaterial attach="material" color="#8B4513" linewidth={3} />
    </line>
  );
};

interface CircleBoundaryProps {
  center: [number, number, number];
  radius: number;
}

export const CircleBoundary = ({ center, radius }: CircleBoundaryProps) => {
  const points = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 64; i++) {
      const angle = (i / 64) * Math.PI * 2;
      pts.push(new THREE.Vector3(
        center[0] + Math.cos(angle) * radius,
        0.01,
        center[2] + Math.sin(angle) * radius
      ));
    }
    return pts;
  }, [center, radius]);

  const lineGeometry = useMemo(() => {
    return new THREE.BufferGeometry().setFromPoints(points);
  }, [points]);

  return (
    <line>
      <bufferGeometry attach="geometry" {...lineGeometry} />
      <lineBasicMaterial attach="material" color="#8B4513" linewidth={3} />
    </line>
  );
};

interface CrossLinesProps {
  center: [number, number, number];
  size: number;
}

export const CrossLines = ({ center, size }: CrossLinesProps) => {
  const horizontalPoints = useMemo(() => [
    new THREE.Vector3(center[0] - size, 0.01, center[2]),
    new THREE.Vector3(center[0] + size, 0.01, center[2]),
  ], [center, size]);

  const verticalPoints = useMemo(() => [
    new THREE.Vector3(center[0], 0.01, center[2] - size),
    new THREE.Vector3(center[0], 0.01, center[2] + size),
  ], [center, size]);

  const horizontalGeometry = useMemo(() => {
    return new THREE.BufferGeometry().setFromPoints(horizontalPoints);
  }, [horizontalPoints]);

  const verticalGeometry = useMemo(() => {
    return new THREE.BufferGeometry().setFromPoints(verticalPoints);
  }, [verticalPoints]);

  return (
    <>
      <line>
        <bufferGeometry attach="geometry" {...horizontalGeometry} />
        <lineBasicMaterial attach="material" color="#8B4513" linewidth={2} />
      </line>
      <line>
        <bufferGeometry attach="geometry" {...verticalGeometry} />
        <lineBasicMaterial attach="material" color="#8B4513" linewidth={2} />
      </line>
    </>
  );
};

interface StartingLineProps {
  position: [number, number, number];
  width?: number;
}

export const StartingLine = ({ position, width = 2 }: StartingLineProps) => {
  const points = useMemo(() => [
    new THREE.Vector3(position[0] - width / 2, 0.01, position[2]),
    new THREE.Vector3(position[0] + width / 2, 0.01, position[2]),
  ], [position, width]);

  const lineGeometry = useMemo(() => {
    return new THREE.BufferGeometry().setFromPoints(points);
  }, [points]);

  return (
    <line>
      <bufferGeometry attach="geometry" {...lineGeometry} />
      <lineBasicMaterial attach="material" color="#654321" linewidth={3} />
    </line>
  );
};
