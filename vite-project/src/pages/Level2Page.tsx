import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Line, OrbitControls, Sky } from '@react-three/drei';
import * as THREE from 'three';
import { Layout } from '@/components/Layout';
import { PowerMeter } from '@/components/PowerMeter';
import { GameResult } from '@/components/GameResult';
import { useGameStore } from '@/store/gameStore';
import { ArrowLeft, RotateCcw, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link, useNavigate } from 'react-router-dom';
import { TutorialOverlay } from '@/components/game/TutorialOverlay';
import { PowerPresets } from '@/components/game/PowerPresets';
import { AimGuideLine } from '@/components/game/AimGuideLine';

const SHOOTER_START: [number, number, number] = [0, 0.2, 4];
const GROUND_SIZE = 14;
const WALL_HEIGHT = 0.8;
const MARBLE_RADIUS = 0.2;

// Triangle vertices (equilateral triangle centered at origin)
const TRIANGLE_SIZE = 2.5;
const TRIANGLE_VERTICES: [number, number, number][] = [
  [0, 0.02, -TRIANGLE_SIZE],
  [-TRIANGLE_SIZE * 0.866, 0.02, TRIANGLE_SIZE * 0.5],
  [TRIANGLE_SIZE * 0.866, 0.02, TRIANGLE_SIZE * 0.5],
];

// Target marble positions (at triangle corners)
const TARGET_POSITIONS: [number, number, number][] = [
  [0, 0.2, -TRIANGLE_SIZE + 0.3],
  [-TRIANGLE_SIZE * 0.866 + 0.3, 0.2, TRIANGLE_SIZE * 0.5 - 0.2],
  [TRIANGLE_SIZE * 0.866 - 0.3, 0.2, TRIANGLE_SIZE * 0.5 - 0.2],
];

const TARGET_COLORS = ['#E74C3C', '#27AE60', '#3498DB'];

// Check if point is inside triangle
const isInsideTriangle = (px: number, pz: number): boolean => {
  const [v1, v2, v3] = TRIANGLE_VERTICES;
  
  const sign = (p1x: number, p1z: number, p2x: number, p2z: number, p3x: number, p3z: number) => {
    return (p1x - p3x) * (p2z - p3z) - (p2x - p3x) * (p1z - p3z);
  };
  
  const d1 = sign(px, pz, v1[0], v1[2], v2[0], v2[2]);
  const d2 = sign(px, pz, v2[0], v2[2], v3[0], v3[2]);
  const d3 = sign(px, pz, v3[0], v3[2], v1[0], v1[2]);
  
  const hasNeg = (d1 < 0) || (d2 < 0) || (d3 < 0);
  const hasPos = (d1 > 0) || (d2 > 0) || (d3 > 0);
  
  return !(hasNeg && hasPos);
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

// 3D Boundaries
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

// Triangle boundary visualization
const TriangleBoundary = () => {
  const points: [number, number, number][] = [
    ...TRIANGLE_VERTICES,
    TRIANGLE_VERTICES[0],
  ];
  
  return (
    <group>
      <Line points={points} color="#8B4513" lineWidth={4} />
      
      {TRIANGLE_VERTICES.map((v, i) => (
        <mesh key={i} position={[v[0], 0.05, v[2]]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.15, 16]} />
          <meshStandardMaterial color="#654321" />
        </mesh>
      ))}
      
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <shapeGeometry args={[(() => {
          const shape = new THREE.Shape();
          shape.moveTo(TRIANGLE_VERTICES[0][0], -TRIANGLE_VERTICES[0][2]);
          shape.lineTo(TRIANGLE_VERTICES[1][0], -TRIANGLE_VERTICES[1][2]);
          shape.lineTo(TRIANGLE_VERTICES[2][0], -TRIANGLE_VERTICES[2][2]);
          shape.closePath();
          return shape;
        })()]} />
        <meshStandardMaterial color="#8B4513" transparent opacity={0.15} />
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
  index: number;
}

const TargetMarble = ({ initialPosition, color, velocity, position }: TargetMarbleProps) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const halfSize = GROUND_SIZE / 2 - 0.3;

  useFrame(() => {
    if (!meshRef.current) return;
    
    position.current.x += velocity.current.x;
    position.current.z += velocity.current.z;
    
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
  targetVelocities
}: { 
  position: React.MutableRefObject<THREE.Vector3>;
  velocity: React.MutableRefObject<THREE.Vector3>;
  targetPositions: React.MutableRefObject<THREE.Vector3>[];
  targetVelocities: React.MutableRefObject<THREE.Vector3>[];
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const halfSize = GROUND_SIZE / 2 - 0.3;

  useFrame(() => {
    if (!meshRef.current) return;
    
    position.current.x += velocity.current.x;
    position.current.z += velocity.current.z;
    
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
    
    targetPositions.forEach((targetPos, i) => {
      const dx = position.current.x - targetPos.current.x;
      const dz = position.current.z - targetPos.current.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      
      if (dist < MARBLE_RADIUS * 2) {
        const nx = dx / dist;
        const nz = dz / dist;
        
        const dvx = velocity.current.x - targetVelocities[i].current.x;
        const dvz = velocity.current.z - targetVelocities[i].current.z;
        
        const dvn = dvx * nx + dvz * nz;
        
        if (dvn > 0) return;
        
        const restitution = 0.85;
        
        velocity.current.x -= dvn * nx * restitution;
        velocity.current.z -= dvn * nz * restitution;
        targetVelocities[i].current.x += dvn * nx * restitution;
        targetVelocities[i].current.z += dvn * nz * restitution;
        
        const overlap = MARBLE_RADIUS * 2 - dist;
        position.current.x += nx * overlap * 0.5;
        position.current.z += nz * overlap * 0.5;
        targetPos.current.x -= nx * overlap * 0.5;
        targetPos.current.z -= nz * overlap * 0.5;
      }
    });
    
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
    
    if (Math.sqrt(dx * dx + dz * dz) < 1.5) { // Increased touch target
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
  onShoot,
  onDragUpdate,
  canShoot,
  currentMarblePos,
  onDragStateChange
}: {
  marblePosition: React.MutableRefObject<THREE.Vector3>;
  velocity: React.MutableRefObject<THREE.Vector3>;
  targetPositions: React.MutableRefObject<THREE.Vector3>[];
  targetVelocities: React.MutableRefObject<THREE.Vector3>[];
  onShoot: (power: number, direction: THREE.Vector3) => void;
  onDragUpdate: (power: number, direction: THREE.Vector3) => void;
  canShoot: boolean;
  currentMarblePos: THREE.Vector3;
  onDragStateChange: (dragging: boolean) => void;
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
    onDragUpdate(power, direction);
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
    onDragUpdate(0, new THREE.Vector3());
  }, [onShoot, onDragUpdate]);

  const handleSetIsDragging = useCallback((dragging: boolean) => {
    setIsDragging(dragging);
    onDragStateChange(dragging);
  }, [onDragStateChange]);

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
      <TriangleBoundary />

      {TARGET_POSITIONS.map((pos, i) => (
        <TargetMarble
          key={i}
          index={i}
          initialPosition={pos}
          color={TARGET_COLORS[i]}
          velocity={targetVelocities[i]}
          position={targetPositions[i]}
        />
      ))}

      {/* Aim guide line (shows predicted trajectory) */}
      <AimGuideLine 
        start={currentMarblePos} 
        direction={aimDirection} 
        power={aimPower} 
        visible={showAim} 
      />

      <ShooterMarble 
        position={marblePosition} 
        velocity={velocity}
        targetPositions={targetPositions}
        targetVelocities={targetVelocities}
      />

      <DragPlane 
        onDragStart={handleDragStart}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        marblePosition={currentMarblePos}
        canInteract={canShoot}
        setIsDragging={handleSetIsDragging}
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

const Level2Page = () => {
  const navigate = useNavigate();
  const { marbleCount, recordShot, recordWin, recordLoss, completeLevel } = useGameStore();
  
  const marblePosition = useRef(new THREE.Vector3(...SHOOTER_START));
  const velocity = useRef(new THREE.Vector3(0, 0, 0));
  
  const targetPositions = [
    useRef(new THREE.Vector3(...TARGET_POSITIONS[0])),
    useRef(new THREE.Vector3(...TARGET_POSITIONS[1])),
    useRef(new THREE.Vector3(...TARGET_POSITIONS[2])),
  ];
  
  const targetVelocities = [
    useRef(new THREE.Vector3(0, 0, 0)),
    useRef(new THREE.Vector3(0, 0, 0)),
    useRef(new THREE.Vector3(0, 0, 0)),
  ];
  
  const [power, setPower] = useState(0);
  const [aimDirection, setAimDirection] = useState<THREE.Vector3>(new THREE.Vector3(0, 0, -1));
  const [shots, setShots] = useState(0);
  const [isMoving, setIsMoving] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [isWin, setIsWin] = useState(false);
  const [hasEntered, setHasEntered] = useState(false);
  const [currentMarblePos, setCurrentMarblePos] = useState(new THREE.Vector3(...SHOOTER_START));
  const [isDragging, setIsDragging] = useState(false);
  
  // Tutorial state
  const [showTutorial, setShowTutorial] = useState(false);
  const [hasSeenTutorial, setHasSeenTutorial] = useState(() => {
    return localStorage.getItem('marble-game-tutorial-seen') === 'true';
  });

  // Check if player has enough marbles
  useEffect(() => {
    if (marbleCount < 1 && !hasEntered) {
      navigate('/');
    }
  }, [marbleCount, hasEntered, navigate]);

  const checkGameState = useCallback(() => {
    const shooterInside = isInsideTriangle(marblePosition.current.x, marblePosition.current.z);
    
    const targetsOutside = targetPositions.every(tp => 
      !isInsideTriangle(tp.current.x, tp.current.z)
    );
    
    if (targetsOutside && !shooterInside) {
      setIsWin(true);
      setShowResult(true);
      recordWin(3);
      completeLevel(2);
    } else if (shooterInside) {
      setIsWin(false);
      setShowResult(true);
      recordLoss(1);
    }
  }, [recordWin, recordLoss, completeLevel, targetPositions]);


  useEffect(() => {
    if (!isMoving) return;
    
    const checkInterval = setInterval(() => {
      const shooterSpeed = Math.sqrt(velocity.current.x ** 2 + velocity.current.z ** 2);
      const allStopped = targetVelocities.every(tv => 
        Math.sqrt(tv.current.x ** 2 + tv.current.z ** 2) < 0.002
      );
      
      setCurrentMarblePos(marblePosition.current.clone());
      
      if (shooterSpeed < 0.002 && allStopped) {
        velocity.current.set(0, 0, 0);
        targetVelocities.forEach(tv => tv.current.set(0, 0, 0));
        setIsMoving(false);
        checkGameState();
      }
    }, 50);

    return () => clearInterval(checkInterval);
  }, [isMoving, checkGameState, targetVelocities]);

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

  const handleDragUpdate = useCallback((dragPower: number, direction: THREE.Vector3) => {
    setPower(dragPower);
    if (direction.length() > 0) {
      setAimDirection(direction);
    }
  }, []);

  const handlePresetShot = useCallback((presetPower: number) => {
    // Use current aim direction or default forward
    const direction = aimDirection.length() > 0 ? aimDirection : new THREE.Vector3(0, 0, -1);
    handleShoot(presetPower, direction);
  }, [aimDirection, handleShoot]);

  const resetGame = useCallback(() => {
    marblePosition.current.set(...SHOOTER_START);
    velocity.current.set(0, 0, 0);
    
    TARGET_POSITIONS.forEach((pos, i) => {
      targetPositions[i].current.set(...pos);
      targetVelocities[i].current.set(0, 0, 0);
    });
    
    setCurrentMarblePos(new THREE.Vector3(...SHOOTER_START));
    setShots(0);
    setIsMoving(false);
    setShowResult(false);
    setIsWin(false);
    setHasEntered(false);
  }, [targetPositions, targetVelocities]);

  // Show tutorial for first-time players
  useEffect(() => {
    if (!hasSeenTutorial) {
      setShowTutorial(true);
    }
  }, [hasSeenTutorial]);

  const handleTutorialComplete = useCallback(() => {
    setShowTutorial(false);
    setHasSeenTutorial(true);
    localStorage.setItem('marble-game-tutorial-seen', 'true');
  }, []);

  const canShoot = !isMoving && !showResult;

  return (
    <Layout>
      <div className="h-[calc(100vh-180px)] min-h-[500px] relative">
        {/* Tutorial Overlay */}
        <TutorialOverlay
          isOpen={showTutorial}
          onClose={() => setShowTutorial(false)}
          onComplete={handleTutorialComplete}
        />
        
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-10 flex justify-between items-center p-4">
          <div className="flex gap-2">
            <Link to="/">
              <Button variant="outline" size="sm" className="bg-card/90 backdrop-blur">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </Link>
            <Button 
              variant="outline" 
              size="sm" 
              className="bg-card/90 backdrop-blur"
              onClick={() => setShowTutorial(true)}
            >
              <HelpCircle className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="bg-card/90 backdrop-blur px-4 py-2 rounded-lg shadow-lg border border-border">
            <h2 className="font-bold text-foreground">Level 2: Triangle Formation</h2>
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
            <li>• Knock all 3 marbles outside the triangle</li>
            <li>• Your shooter must stay outside too!</li>
            <li>• Win +3 marbles, Lose -1 marble</li>
          </ol>
        </div>

        {/* Power Presets */}
        <PowerPresets
          onSelectPower={handlePresetShot}
          disabled={!canShoot || isDragging}
          visible={!showTutorial && !showResult}
        />

        <PowerMeter power={power} visible={power > 0} />

        <Canvas 
          shadows 
          camera={{ position: [0, 14, 12], fov: 50 }}
          gl={{ antialias: true }}
        >
          <GameScene 
            marblePosition={marblePosition}
            velocity={velocity}
            targetPositions={targetPositions}
            targetVelocities={targetVelocities}
            onShoot={handleShoot}
            onDragUpdate={handleDragUpdate}
            canShoot={canShoot}
            currentMarblePos={currentMarblePos}
            onDragStateChange={setIsDragging}
          />
        </Canvas>

        <GameResult 
          isOpen={showResult}
          isWin={isWin}
          marblesChange={isWin ? 3 : -1}
          onPlayAgain={resetGame}
          levelName="Level 2: Triangle Formation"
        />
      </div>
    </Layout>
  );
};

export default Level2Page;
