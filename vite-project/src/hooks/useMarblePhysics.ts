import { useRef, useCallback } from 'react';
import * as THREE from 'three';

interface MarblePhysics {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  isMoving: boolean;
}

export const useMarblePhysics = () => {
  const friction = 0.96;
  const minVelocity = 0.001;

  const updateMarble = useCallback((marble: MarblePhysics) => {
    if (!marble.isMoving) return;

    // Apply velocity
    marble.position.x += marble.velocity.x;
    marble.position.z += marble.velocity.z;

    // Apply friction
    marble.velocity.x *= friction;
    marble.velocity.z *= friction;

    // Check if stopped
    const speed = Math.sqrt(marble.velocity.x ** 2 + marble.velocity.z ** 2);
    if (speed < minVelocity) {
      marble.velocity.set(0, 0, 0);
      marble.isMoving = false;
    }
  }, []);

  const checkCollision = useCallback((
    marble1: MarblePhysics, 
    marble2: MarblePhysics,
    marbleRadius: number = 0.15
  ): boolean => {
    const dx = marble1.position.x - marble2.position.x;
    const dz = marble1.position.z - marble2.position.z;
    const distance = Math.sqrt(dx * dx + dz * dz);

    if (distance < marbleRadius * 2) {
      // Elastic collision
      const nx = dx / distance;
      const nz = dz / distance;

      const relVelX = marble1.velocity.x - marble2.velocity.x;
      const relVelZ = marble1.velocity.z - marble2.velocity.z;

      const dot = relVelX * nx + relVelZ * nz;

      // Update velocities (elastic collision)
      marble1.velocity.x -= dot * nx;
      marble1.velocity.z -= dot * nz;
      marble2.velocity.x += dot * nx;
      marble2.velocity.z += dot * nz;

      marble1.isMoving = true;
      marble2.isMoving = true;

      // Separate marbles to prevent overlap
      const overlap = marbleRadius * 2 - distance;
      marble1.position.x += (overlap / 2) * nx;
      marble1.position.z += (overlap / 2) * nz;
      marble2.position.x -= (overlap / 2) * nx;
      marble2.position.z -= (overlap / 2) * nz;

      return true;
    }
    return false;
  }, []);

  const isInsideCircle = useCallback((
    position: THREE.Vector3, 
    center: THREE.Vector3, 
    radius: number
  ): boolean => {
    const dx = position.x - center.x;
    const dz = position.z - center.z;
    return Math.sqrt(dx * dx + dz * dz) < radius;
  }, []);

  const isInsideTriangle = useCallback((
    point: THREE.Vector3,
    v1: THREE.Vector3,
    v2: THREE.Vector3,
    v3: THREE.Vector3
  ): boolean => {
    const sign = (p1: THREE.Vector3, p2: THREE.Vector3, p3: THREE.Vector3) => {
      return (p1.x - p3.x) * (p2.z - p3.z) - (p2.x - p3.x) * (p1.z - p3.z);
    };

    const d1 = sign(point, v1, v2);
    const d2 = sign(point, v2, v3);
    const d3 = sign(point, v3, v1);

    const hasNeg = (d1 < 0) || (d2 < 0) || (d3 < 0);
    const hasPos = (d1 > 0) || (d2 > 0) || (d3 > 0);

    return !(hasNeg && hasPos);
  }, []);

  const isOnCrossLines = useCallback((
    position: THREE.Vector3,
    center: THREE.Vector3,
    tolerance: number = 0.2
  ): boolean => {
    const dx = Math.abs(position.x - center.x);
    const dz = Math.abs(position.z - center.z);
    return dx < tolerance || dz < tolerance;
  }, []);

  const isInsideHole = useCallback((
    position: THREE.Vector3,
    holeCenter: THREE.Vector3,
    holeRadius: number = 0.35
  ): boolean => {
    const dx = position.x - holeCenter.x;
    const dz = position.z - holeCenter.z;
    return Math.sqrt(dx * dx + dz * dz) < holeRadius;
  }, []);

  return {
    updateMarble,
    checkCollision,
    isInsideCircle,
    isInsideTriangle,
    isOnCrossLines,
    isInsideHole,
  };
};
