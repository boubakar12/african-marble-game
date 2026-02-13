import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Line, OrbitControls, Sky } from '@react-three/drei';
import * as THREE from 'three';
import { Layout } from '@/components/Layout';
import { PowerMeter } from '@/components/PowerMeter';
import { GameResult } from '@/components/GameResult';
import { useGameStore } from '@/store/gameStore';
import { ArrowLeft, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link, useNavigate } from 'react-router-dom';

const SHOOTER_START: [number, number, number] = [0, 0.2, 5];
const GROUND_SIZE = 14;
const WALL_HEIGHT = 0.8;
const MARBLE_RADIUS = 0.2;

// Circle boundary parameters
const CIRCLE_CENTER: [number, number, number] = [0, 0, 0];
const CIRCLE_RADIUS = 3;
const HOLE_RADIUS = 0.4;

// Cross line size (extends from center)
const CROSS_SIZE = CIRCLE_RADIUS;
const LINE_TOLERANCE = 0.25;

// Target marble positions (on the cross lines, inside the circle)
const TARGET_POSITIONS: [number, number, number][] = [
  [0, 0.2, -1.8],      // Top (on vertical line)
  [0, 0.2, 1.8],       // Bottom (on vertical line)
  [-1.8, 0.2, 0],      // Left (on horizontal line)
  [1.8, 0.2, 0],       // Right (on horizontal line)
];

const TARGET_COLORS = ['#E74C3C', '#27AE60', '#3498DB', '#9B59B6'];

// Check if point is inside the circle
const isInsideCircle = (px: number, pz: number): boolean => {
  const dx = px - CIRCLE_CENTER[0];
  const dz = pz - CIRCLE_CENTER[2];
  return Math.sqrt(dx * dx + dz * dz) < CIRCLE_RADIUS;
};

// Check if point is on the cross lines
const isOnCrossLines = (px: number, pz: number): boolean => {
  const dx = Math.abs(px - CIRCLE_CENTER[0]);
  const dz = Math.abs(pz - CIRCLE_CENTER[2]);
  return dx < LINE_TOLERANCE || dz < LINE_TOLERANCE;
};

// Check if point is in the center hole
const isInHole = (px: number, pz: number): boolean => {
  const dx = px - CIRCLE_CENTER[0];
  const dz = pz - CIRCLE_CENTER[2];
  return Math.sqrt(dx * dx + dz * dz) < HOLE_RADIUS;
};

// Sand Ground with texture
const SandGround = () => {
  const sandTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;
    
    ctx.fillStyle = '#C4A574';
    ctx.fillRect(0, 0, 512, 512);
    
    for (let i = 0; i < 15000; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      const shade = Math.random() * 40 - 20;
      ctx.fillStyle = `rgb(${196 + shade}, ${165 + shade}, ${116 + shade})`;
      ctx.fillRect(x, y, 2, 2);
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(4, 4);
    return texture;
  }, []);

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
      <planeGeometry args={[GROUND_SIZE, GROUND_SIZE]} />
      <meshStandardMaterial map={sandTexture} roughness={0.95} metalness={0.05} />
    </mesh>
  );
};

// 3D Boundaries (wooden walls)
const Boundaries = () => {
  const woodColor = '#5D3E29';
  const halfSize = GROUND_SIZE / 2;
  
  return (
    <group>
      {[
        { pos: [0, WALL_HEIGHT / 2, -halfSize] as [number, number, number], size: [GROUND_SIZE + 0.4, WALL_HEIGHT, 0.2] as [number, number, number] },
        { pos: [0, WALL_HEIGHT / 2, halfSize] as [number, number, number], size: [GROUND_SIZE + 0.4, WALL_HEIGHT, 0.2] as [number, number, number] },
        { pos: [-halfSize, WALL_HEIGHT / 2, 0] as [number, number, number], size: [0.2, WALL_HEIGHT, GROUND_SIZE] as [number, number, number] },
        { pos: [halfSize, WALL_HEIGHT / 2, 0] as [number, number, number], size: [0.2, WALL_HEIGHT, GROUND_SIZE] as [number, number, number] },
      ].map((wall, i) => (
        <mesh key={i} position={wall.pos} castShadow receiveShadow>
          <boxGeometry args={wall.size} />
          <meshStandardMaterial color={woodColor} roughness={0.8} />
        </mesh>
      ))}
    </group>
  );
};

// Circle boundary visualization
const CircleBoundaryVisual = () => {
  const points = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 64; i++) {
      const angle = (i / 64) * Math.PI * 2;
      pts.push(new THREE.Vector3(
        CIRCLE_CENTER[0] + Math.cos(angle) * CIRCLE_RADIUS,
        0.02,
        CIRCLE_CENTER[2] + Math.sin(angle) * CIRCLE_RADIUS
      ));
    }
    return pts;
  }, []);

  return (
    <group>
      {/* Circle outline */}
      <Line points={points} color="#8B4513" lineWidth={4} />
      
      {/* Semi-transparent fill */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[CIRCLE_CENTER[0], 0.01, CIRCLE_CENTER[2]]}>
        <circleGeometry args={[CIRCLE_RADIUS, 64]} />
        <meshStandardMaterial color="#8B4513" transparent opacity={0.1} />
      </mesh>
    </group>
  );
};

// Cross lines visualization
const CrossLinesVisual = () => {
  return (
    <group>
      {/* Horizontal line */}
      <Line 
        points={[
          [-CROSS_SIZE, 0.02, 0],
          [CROSS_SIZE, 0.02, 0]
        ]} 
        color="#654321" 
        lineWidth={3}
      />
      
      {/* Vertical line */}
      <Line 
        points={[
          [0, 0.02, -CROSS_SIZE],
          [0, 0.02, CROSS_SIZE]
        ]} 
        color="#654321" 
        lineWidth={3}
      />
      
      {/* Center marker */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, 0]}>
        <circleGeometry args={[0.1, 16]} />
        <meshStandardMaterial color="#654321" />
      </mesh>
    </group>
  );
};

// Central Hole
const CentralHole = () => {
  return (
    <group>
      {/* Dark hole */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]}>
        <circleGeometry args={[HOLE_RADIUS, 32]} />
        <meshStandardMaterial color="#1a0f0a" />
      </mesh>
      
      {/* Hole ring outline */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.006, 0]}>
        <ringGeometry args={[HOLE_RADIUS - 0.05, HOLE_RADIUS, 32]} />
        <meshStandardMaterial color="#2C1810" />
      </mesh>
    </group>
  );
};

// Target Marble component
interface TargetMarbleProps {
  initialPosition: [number, number, number];
  color: string;
  velocity: React.MutableRefObject<THREE.Vector3>;
  position: React.MutableRefObject<THREE.Vector3>;
  inHole: React.MutableRefObject<boolean>;
  index: number;
}

const TargetMarble = ({ initialPosition, color, velocity, position, inHole, index }: TargetMarbleProps) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const halfSize = GROUND_SIZE / 2 - 0.3;

  useFrame(() => {
    if (!meshRef.current || inHole.current) return;
    
    position.current.x += velocity.current.x;
    position.current.z += velocity.current.z;
    
    // Wall collisions
    if (position.current.x < -halfSize) {
      position.current.x = -halfSize;
      velocity.current.x *= -0.6;
    }
    if (position.current.x > halfSize) {
      position.current.x = halfSize;
      velocity.current.x *= -0.6;
    }
    if (position.current.z < -halfSize) {
      position.current.z = -halfSize;
      velocity.current.z *= -0.6;
    }
    if (position.current.z > halfSize) {
      position.current.z = halfSize;
      velocity.current.z *= -0.6;
    }
    
    // Check if fell into hole
    if (isInHole(position.current.x, position.current.z)) {
      inHole.current = true;
      velocity.current.set(0, 0, 0);
      // Move below ground to hide
      position.current.y = -1;
    }
    
    // Friction
    velocity.current.x *= 0.965;
    velocity.current.z *= 0.965;
    
    meshRef.current.position.copy(position.current);
    
    // Rolling rotation
    const speed = Math.sqrt(velocity.current.x ** 2 + velocity.current.z ** 2);
    if (speed > 0.001) {
      meshRef.current.rotation.x += velocity.current.z * 5;
      meshRef.current.rotation.z -= velocity.current.x * 5;
    }
  });

  return (
    <mesh ref={meshRef} position={initialPosition} castShadow>
      <sphereGeometry args={[MARBLE_RADIUS, 64, 64]} />
      <meshStandardMaterial 
        color={color}
        metalness={0.7}
        roughness={0.2}
        envMapIntensity={1}
      />
    </mesh>
  );
};

// Shooter Marble
const ShooterMarble = ({ 
  position, 
  velocity,
  targetPositions,
  targetVelocities,
  targetInHoles,
  shooterInHole
}: { 
  position: React.MutableRefObject<THREE.Vector3>;
  velocity: React.MutableRefObject<THREE.Vector3>;
  targetPositions: React.MutableRefObject<THREE.Vector3>[];
  targetVelocities: React.MutableRefObject<THREE.Vector3>[];
  targetInHoles: React.MutableRefObject<boolean>[];
  shooterInHole: React.MutableRefObject<boolean>;
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const halfSize = GROUND_SIZE / 2 - 0.3;

  useFrame(() => {
    if (!meshRef.current || shooterInHole.current) return;
    
    position.current.x += velocity.current.x;
    position.current.z += velocity.current.z;
    
    // Wall collisions
    if (position.current.x < -halfSize) {
      position.current.x = -halfSize;
      velocity.current.x *= -0.6;
    }
    if (position.current.x > halfSize) {
      position.current.x = halfSize;
      velocity.current.x *= -0.6;
    }
    if (position.current.z < -halfSize) {
      position.current.z = -halfSize;
      velocity.current.z *= -0.6;
    }
    if (position.current.z > halfSize) {
      position.current.z = halfSize;
      velocity.current.z *= -0.6;
    }
    
    // Check if fell into hole
    if (isInHole(position.current.x, position.current.z)) {
      shooterInHole.current = true;
      velocity.current.set(0, 0, 0);
      position.current.y = -1;
    }
    
    // Check collisions with target marbles
    targetPositions.forEach((targetPos, i) => {
      if (targetInHoles[i].current) return; // Skip marbles in hole
      
      const dx = position.current.x - targetPos.current.x;
      const dz = position.current.z - targetPos.current.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      
      if (dist < MARBLE_RADIUS * 2) {
        // Elastic collision
        const nx = dx / dist;
        const nz = dz / dist;
        
        const dvx = velocity.current.x - targetVelocities[i].current.x;
        const dvz = velocity.current.z - targetVelocities[i].current.z;
        
        const dvn = dvx * nx + dvz * nz;
        
        if (dvn > 0) return; // Moving apart
        
        const restitution = 0.85;
        
        velocity.current.x -= dvn * nx * restitution;
        velocity.current.z -= dvn * nz * restitution;
        targetVelocities[i].current.x += dvn * nx * restitution;
        targetVelocities[i].current.z += dvn * nz * restitution;
        
        // Separate marbles
        const overlap = MARBLE_RADIUS * 2 - dist;
        position.current.x += nx * overlap * 0.5;
        position.current.z += nz * overlap * 0.5;
        targetPos.current.x -= nx * overlap * 0.5;
        targetPos.current.z -= nz * overlap * 0.5;
      }
    });
    
    // Target-to-target collisions
    for (let i = 0; i < targetPositions.length; i++) {
      if (targetInHoles[i].current) continue;
      for (let j = i + 1; j < targetPositions.length; j++) {
        if (targetInHoles[j].current) continue;
        
        const dx = targetPositions[i].current.x - targetPositions[j].current.x;
        const dz = targetPositions[i].current.z - targetPositions[j].current.z;
        const dist = Math.sqrt(dx * dx + dz * dz);
        
        if (dist < MARBLE_RADIUS * 2) {
          const nx = dx / dist;
          const nz = dz / dist;
          
          const dvx = targetVelocities[i].current.x - targetVelocities[j].current.x;
          const dvz = targetVelocities[i].current.z - targetVelocities[j].current.z;
          
          const dvn = dvx * nx + dvz * nz;
          
          if (dvn > 0) continue;
          
          const restitution = 0.85;
          
          targetVelocities[i].current.x -= dvn * nx * restitution;
          targetVelocities[i].current.z -= dvn * nz * restitution;
          targetVelocities[j].current.x += dvn * nx * restitution;
          targetVelocities[j].current.z += dvn * nz * restitution;
          
          const overlap = MARBLE_RADIUS * 2 - dist;
          targetPositions[i].current.x += nx * overlap * 0.5;
          targetPositions[i].current.z += nz * overlap * 0.5;
          targetPositions[j].current.x -= nx * overlap * 0.5;
          targetPositions[j].current.z -= nz * overlap * 0.5;
        }
      }
    }
    
    // Friction
    velocity.current.x *= 0.965;
    velocity.current.z *= 0.965;
    
    meshRef.current.position.copy(position.current);
    
    const speed = Math.sqrt(velocity.current.x ** 2 + velocity.current.z ** 2);
    if (speed > 0.001) {
      meshRef.current.rotation.x += velocity.current.z * 5;
      meshRef.current.rotation.z -= velocity.current.x * 5;
    }
  });

  return (
    <mesh ref={meshRef} position={SHOOTER_START} castShadow>
      <sphereGeometry args={[MARBLE_RADIUS, 64, 64]} />
      <meshStandardMaterial 
        color="#1C2833"
        metalness={0.8}
        roughness={0.15}
        envMapIntensity={1.2}
      />
    </mesh>
  );
};

// Aim Arrow
const AimArrow = ({ start, direction, power, visible }: { 
  start: THREE.Vector3; direction: THREE.Vector3; power: number; visible: boolean; 
}) => {
  if (!visible || power < 0.05) return null;
  
  const length = power * 3;
  const end = start.clone().add(direction.clone().multiplyScalar(length));
  
  return (
    <group>
      <Line 
        points={[[start.x, 0.3, start.z], [end.x, 0.3, end.z]]} 
        color="#ffffff" 
        lineWidth={3}
        transparent
        opacity={0.8}
      />
      {[0.25, 0.5, 0.75].map((t, i) => (
        power > t && (
          <mesh key={i} position={[start.x + direction.x * length * t, 0.3, start.z + direction.z * length * t]}>
            <sphereGeometry args={[0.05, 8, 8]} />
            <meshBasicMaterial color={power > 0.7 ? '#ff4444' : power > 0.4 ? '#ffaa00' : '#44ff44'} />
          </mesh>
        )
      ))}
    </group>
  );
};

// Drag Plane
const DragPlane = ({ 
  onDragStart, onDrag, onDragEnd, marblePosition, canInteract, setIsDragging
}: {
  onDragStart: (point: THREE.Vector3) => void;
  onDrag: (point: THREE.Vector3) => void;
  onDragEnd: (point: THREE.Vector3) => void;
  marblePosition: THREE.Vector3;
  canInteract: boolean;
  setIsDragging: (dragging: boolean) => void;
}) => {
  const [localDragging, setLocalDragging] = useState(false);

  const handlePointerDown = useCallback((e: any) => {
    if (!canInteract) return;
    e.stopPropagation();
    
    const point = e.point as THREE.Vector3;
    const dx = point.x - marblePosition.x;
    const dz = point.z - marblePosition.z;
    
    if (Math.sqrt(dx * dx + dz * dz) < 1) {
      setLocalDragging(true);
      setIsDragging(true);
      onDragStart(point);
    }
  }, [canInteract, marblePosition, onDragStart, setIsDragging]);

  const handlePointerMove = useCallback((e: any) => {
    if (!localDragging) return;
    onDrag(e.point as THREE.Vector3);
  }, [localDragging, onDrag]);

  const handlePointerUp = useCallback((e: any) => {
    if (!localDragging) return;
    setLocalDragging(false);
    setIsDragging(false);
    onDragEnd(e.point as THREE.Vector3);
  }, [localDragging, onDragEnd, setIsDragging]);

  return (
    <mesh 
      rotation={[-Math.PI / 2, 0, 0]} 
      position={[0, 0.02, 0]}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      <planeGeometry args={[30, 30]} />
      <meshBasicMaterial visible={false} />
    </mesh>
  );
};

// Game Scene
const GameScene = ({ 
  marblePosition,
  velocity,
  targetPositions,
  targetVelocities,
  targetInHoles,
  shooterInHole,
  onShoot,
  onDragUpdate,
  canShoot,
  currentMarblePos
}: {
  marblePosition: React.MutableRefObject<THREE.Vector3>;
  velocity: React.MutableRefObject<THREE.Vector3>;
  targetPositions: React.MutableRefObject<THREE.Vector3>[];
  targetVelocities: React.MutableRefObject<THREE.Vector3>[];
  targetInHoles: React.MutableRefObject<boolean>[];
  shooterInHole: React.MutableRefObject<boolean>;
  onShoot: (power: number, direction: THREE.Vector3) => void;
  onDragUpdate: (power: number) => void;
  canShoot: boolean;
  currentMarblePos: THREE.Vector3;
}) => {
  const dragStartRef = useRef<THREE.Vector3 | null>(null);
  const [aimDirection, setAimDirection] = useState<THREE.Vector3>(new THREE.Vector3());
  const [aimPower, setAimPower] = useState(0);
  const [showAim, setShowAim] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragStart = useCallback(() => {
    dragStartRef.current = marblePosition.current.clone();
    setShowAim(true);
  }, [marblePosition]);

  const handleDrag = useCallback((point: THREE.Vector3) => {
    if (!dragStartRef.current) return;
    
    const dx = dragStartRef.current.x - point.x;
    const dz = dragStartRef.current.z - point.z;
    const distance = Math.sqrt(dx * dx + dz * dz);
    const power = Math.min(distance / 3, 1);
    const direction = new THREE.Vector3(dx, 0, dz).normalize();
    
    setAimDirection(direction);
    setAimPower(power);
    onDragUpdate(power);
  }, [onDragUpdate]);

  const handleDragEnd = useCallback((point: THREE.Vector3) => {
    if (!dragStartRef.current) return;
    
    const dx = dragStartRef.current.x - point.x;
    const dz = dragStartRef.current.z - point.z;
    const distance = Math.sqrt(dx * dx + dz * dz);
    
    if (distance > 0.2) {
      const power = Math.min(distance / 3, 1);
      const direction = new THREE.Vector3(dx, 0, dz).normalize();
      onShoot(power, direction);
    }
    
    dragStartRef.current = null;
    setShowAim(false);
    setAimPower(0);
    onDragUpdate(0);
  }, [onShoot, onDragUpdate]);

  return (
    <>
      <Sky distance={450000} sunPosition={[5, 15, 10]} inclination={0.6} azimuth={0.25} />
      <ambientLight intensity={0.5} />
      <directionalLight 
        position={[8, 20, 8]} 
        intensity={1.5} 
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={50}
        shadow-camera-left={-15}
        shadow-camera-right={15}
        shadow-camera-top={15}
        shadow-camera-bottom={-15}
      />
      <hemisphereLight args={['#87CEEB', '#C4A574', 0.4]} />

      <SandGround />
      <Boundaries />
      <CircleBoundaryVisual />
      <CrossLinesVisual />
      <CentralHole />

      {/* Target Marbles */}
      {TARGET_POSITIONS.map((pos, i) => (
        <TargetMarble
          key={i}
          index={i}
          initialPosition={pos}
          color={TARGET_COLORS[i]}
          velocity={targetVelocities[i]}
          position={targetPositions[i]}
          inHole={targetInHoles[i]}
        />
      ))}

      <AimArrow start={currentMarblePos} direction={aimDirection} power={aimPower} visible={showAim} />

      <ShooterMarble 
        position={marblePosition} 
        velocity={velocity}
        targetPositions={targetPositions}
        targetVelocities={targetVelocities}
        targetInHoles={targetInHoles}
        shooterInHole={shooterInHole}
      />

      <DragPlane 
        onDragStart={handleDragStart}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        marblePosition={currentMarblePos}
        canInteract={canShoot}
        setIsDragging={setIsDragging}
      />

      <OrbitControls 
        enablePan={false}
        enableZoom={true}
        enableRotate={!isDragging}
        minPolarAngle={Math.PI / 6}
        maxPolarAngle={Math.PI / 2.5}
        minDistance={8}
        maxDistance={22}
      />
    </>
  );
};

const Level3Page = () => {
  const navigate = useNavigate();
  const { marbleCount, recordShot, recordWin, recordLoss, completeLevel } = useGameStore();
  
  const marblePosition = useRef(new THREE.Vector3(...SHOOTER_START));
  const velocity = useRef(new THREE.Vector3(0, 0, 0));
  const shooterInHole = useRef(false);
  
  const targetPositions = [
    useRef(new THREE.Vector3(...TARGET_POSITIONS[0])),
    useRef(new THREE.Vector3(...TARGET_POSITIONS[1])),
    useRef(new THREE.Vector3(...TARGET_POSITIONS[2])),
    useRef(new THREE.Vector3(...TARGET_POSITIONS[3])),
  ];
  
  const targetVelocities = [
    useRef(new THREE.Vector3(0, 0, 0)),
    useRef(new THREE.Vector3(0, 0, 0)),
    useRef(new THREE.Vector3(0, 0, 0)),
    useRef(new THREE.Vector3(0, 0, 0)),
  ];
  
  const targetInHoles = [
    useRef(false),
    useRef(false),
    useRef(false),
    useRef(false),
  ];
  
  const [power, setPower] = useState(0);
  const [shots, setShots] = useState(0);
  const [isMoving, setIsMoving] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [isWin, setIsWin] = useState(false);
  const [hasEntered, setHasEntered] = useState(false);
  const [currentMarblePos, setCurrentMarblePos] = useState(new THREE.Vector3(...SHOOTER_START));
  const [marblesWonThisRound, setMarblesWonThisRound] = useState(0);

  // Check if player has enough marbles
  useEffect(() => {
    if (marbleCount < 1 && !hasEntered) {
      navigate('/');
    }
  }, [marbleCount, hasEntered, navigate]);

  const checkGameState = useCallback(() => {
    // Check how many targets are outside the circle (and not in hole)
    const targetsOutside = targetPositions.filter((tp, i) => 
      !targetInHoles[i].current && !isInsideCircle(tp.current.x, tp.current.z)
    ).length;
    
    // Marbles in the hole don't count as won
    const targetsInHole = targetInHoles.filter(h => h.current).length;
    
    const allTargetsHandled = targetsOutside + targetsInHole === 4;
    const shooterFellInHole = shooterInHole.current;
    const shooterInsideCircle = isInsideCircle(marblePosition.current.x, marblePosition.current.z);
    
    // LOSE conditions:
    // 1. Shooter falls into hole
    // 2. Shooter ends inside circle (and not in hole)
    // 3. Any target marble falls into hole
    if (shooterFellInHole || targetsInHole > 0) {
      setIsWin(false);
      setShowResult(true);
      recordLoss(1);
    } else if (allTargetsHandled && !shooterInsideCircle) {
      // WIN: All 4 targets outside circle, shooter outside circle
      setIsWin(true);
      setMarblesWonThisRound(targetsOutside);
      setShowResult(true);
      recordWin(4);
      completeLevel(3);
    } else if (shooterInsideCircle && !isMoving) {
      // LOSE: Shooter inside circle at end
      setIsWin(false);
      setShowResult(true);
      recordLoss(1);
    }
  }, [recordWin, recordLoss, completeLevel, targetPositions, targetInHoles, isMoving]);

  useEffect(() => {
    if (!isMoving) return;
    
    const checkInterval = setInterval(() => {
      const shooterSpeed = Math.sqrt(velocity.current.x ** 2 + velocity.current.z ** 2);
      const allStopped = targetVelocities.every(tv => 
        Math.sqrt(tv.current.x ** 2 + tv.current.z ** 2) < 0.002
      );
      
      setCurrentMarblePos(marblePosition.current.clone());
      
      // Immediate check for hole falls
      if (shooterInHole.current || targetInHoles.some(h => h.current)) {
        velocity.current.set(0, 0, 0);
        targetVelocities.forEach(tv => tv.current.set(0, 0, 0));
        setIsMoving(false);
        checkGameState();
        return;
      }
      
      if (shooterSpeed < 0.002 && allStopped) {
        velocity.current.set(0, 0, 0);
        targetVelocities.forEach(tv => tv.current.set(0, 0, 0));
        setIsMoving(false);
        checkGameState();
      }
    }, 50);

    return () => clearInterval(checkInterval);
  }, [isMoving, checkGameState, targetVelocities, targetInHoles]);

  const handleShoot = useCallback((shootPower: number, direction: THREE.Vector3) => {
    if (!hasEntered) {
      setHasEntered(true);
    }
    
    const force = shootPower * 0.3;
    velocity.current.set(direction.x * force, 0, direction.z * force);
    setIsMoving(true);
    setShots(s => s + 1);
    recordShot();
  }, [recordShot, hasEntered]);

  const resetGame = useCallback(() => {
    marblePosition.current.set(...SHOOTER_START);
    velocity.current.set(0, 0, 0);
    shooterInHole.current = false;
    
    TARGET_POSITIONS.forEach((pos, i) => {
      targetPositions[i].current.set(...pos);
      targetVelocities[i].current.set(0, 0, 0);
      targetInHoles[i].current = false;
    });
    
    setCurrentMarblePos(new THREE.Vector3(...SHOOTER_START));
    setShots(0);
    setIsMoving(false);
    setShowResult(false);
    setIsWin(false);
    setHasEntered(false);
    setMarblesWonThisRound(0);
  }, [targetPositions, targetVelocities, targetInHoles]);

  return (
    <Layout>
      <div className="h-[calc(100vh-180px)] min-h-[500px] relative">
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-10 flex justify-between items-center p-4">
          <Link to="/">
            <Button variant="outline" size="sm" className="bg-card/90 backdrop-blur">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
          
          <div className="bg-card/90 backdrop-blur px-4 py-2 rounded-lg shadow-lg border border-border">
            <h2 className="font-bold text-foreground">Level 3: Circle & Cross</h2>
            <p className="text-sm text-muted-foreground">Shots: {shots} | Risk: 1 marble</p>
          </div>
          
          <Button variant="outline" size="sm" onClick={resetGame} className="bg-card/90 backdrop-blur">
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset
          </Button>
        </div>

        {/* Instructions */}
        <div className="absolute bottom-4 left-4 z-10 bg-card/90 backdrop-blur p-4 rounded-lg max-w-xs border border-border shadow-lg">
          <h3 className="font-semibold text-foreground mb-2">How to Win:</h3>
          <ol className="text-sm text-muted-foreground space-y-1">
            <li>• Knock all 4 marbles outside the circle</li>
            <li>• Avoid the center hole!</li>
            <li>• Your shooter must stay outside too</li>
            <li>• Win +4 marbles, Lose -1 marble</li>
          </ol>
        </div>

        <PowerMeter power={power} visible={power > 0} />

        <Canvas 
          shadows 
          camera={{ position: [0, 14, 14], fov: 50 }}
          gl={{ antialias: true }}
        >
          <GameScene 
            marblePosition={marblePosition}
            velocity={velocity}
            targetPositions={targetPositions}
            targetVelocities={targetVelocities}
            targetInHoles={targetInHoles}
            shooterInHole={shooterInHole}
            onShoot={handleShoot}
            onDragUpdate={setPower}
            canShoot={!isMoving && !showResult}
            currentMarblePos={currentMarblePos}
          />
        </Canvas>

        <GameResult 
          isOpen={showResult}
          isWin={isWin}
          marblesChange={isWin ? 4 : -1}
          onPlayAgain={resetGame}
          levelName="Level 3: Circle & Cross"
        />
      </div>
    </Layout>
  );
};

export default Level3Page;
