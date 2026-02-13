import { useCallback } from 'react';
import * as THREE from 'three';

export type AIDifficulty = 'easy' | 'medium' | 'hard';

interface AIShot {
  power: number;
  direction: THREE.Vector3;
}

interface AIOpponentConfig {
  difficulty: AIDifficulty;
  shooterPosition: THREE.Vector3;
  targetPositions: THREE.Vector3[];
  isInsideBoundary: (x: number, z: number) => boolean;
}

// AI accuracy and power variance based on difficulty
const DIFFICULTY_CONFIG = {
  easy: {
    accuracyVariance: 0.4,     // High variance = less accurate
    powerVariance: 0.3,
    thinkingTime: 2000,        // Longer "thinking" time
    missChance: 0.3,           // 30% chance to intentionally miss
  },
  medium: {
    accuracyVariance: 0.2,
    powerVariance: 0.15,
    thinkingTime: 1500,
    missChance: 0.1,
  },
  hard: {
    accuracyVariance: 0.05,
    powerVariance: 0.05,
    thinkingTime: 1000,
    missChance: 0.02,
  },
};

export const calculateAIShot = (config: AIOpponentConfig): AIShot => {
  const { difficulty, shooterPosition, targetPositions, isInsideBoundary } = config;
  const settings = DIFFICULTY_CONFIG[difficulty];
  
  // Find the best target (one still inside the boundary)
  const validTargets = targetPositions.filter(tp => isInsideBoundary(tp.x, tp.z));
  
  if (validTargets.length === 0) {
    // All targets are out, AI needs to avoid going inside
    return {
      power: 0.3 + Math.random() * settings.powerVariance,
      direction: new THREE.Vector3(Math.random() - 0.5, 0, -1).normalize(),
    };
  }
  
  // Intentional miss chance (for easier difficulties)
  if (Math.random() < settings.missChance) {
    const randomAngle = Math.random() * Math.PI * 2;
    return {
      power: 0.4 + Math.random() * 0.3,
      direction: new THREE.Vector3(Math.cos(randomAngle), 0, Math.sin(randomAngle)),
    };
  }
  
  // Find closest target
  let closestTarget = validTargets[0];
  let closestDist = Infinity;
  
  validTargets.forEach(target => {
    const dx = target.x - shooterPosition.x;
    const dz = target.z - shooterPosition.z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    if (dist < closestDist) {
      closestDist = dist;
      closestTarget = target;
    }
  });
  
  // Calculate ideal direction to target
  const dx = closestTarget.x - shooterPosition.x;
  const dz = closestTarget.z - shooterPosition.z;
  const idealDirection = new THREE.Vector3(dx, 0, dz).normalize();
  
  // Add variance based on difficulty
  const variance = settings.accuracyVariance;
  idealDirection.x += (Math.random() - 0.5) * variance;
  idealDirection.z += (Math.random() - 0.5) * variance;
  idealDirection.normalize();
  
  // Calculate power based on distance
  const idealPower = Math.min(0.9, closestDist / 5 + 0.3);
  const powerWithVariance = idealPower + (Math.random() - 0.5) * settings.powerVariance;
  
  return {
    power: Math.max(0.3, Math.min(1, powerWithVariance)),
    direction: idealDirection,
  };
};

export const getAIThinkingTime = (difficulty: AIDifficulty): number => {
  return DIFFICULTY_CONFIG[difficulty].thinkingTime;
};

export const useAIOpponent = () => {
  const calculateShot = useCallback((config: AIOpponentConfig) => {
    return calculateAIShot(config);
  }, []);
  
  const getThinkingTime = useCallback((difficulty: AIDifficulty) => {
    return getAIThinkingTime(difficulty);
  }, []);
  
  return { calculateShot, getThinkingTime };
};
