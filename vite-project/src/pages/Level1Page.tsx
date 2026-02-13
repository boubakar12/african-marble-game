import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Line, OrbitControls, Environment, Sky, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { Layout } from '@/components/Layout';
import { PowerMeter } from '@/components/PowerMeter';
import { GameResult } from '@/components/GameResult';
import { useGameStore } from '@/store/gameStore';
import { ArrowLeft, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const SHOOTER_START: [number, number, number] = [0, 0.2, 3];
const HOLE_POSITION: [number, number, number] = [0, -0.2, -2];
const HOLE_RADIUS = 0.5;
const GROUND_SIZE = 12;
const WALL_HEIGHT = 0.8;

// Realistic Sand Ground with procedural texture
const SandGround = () => {
  const sandTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;
    
    // Base sand color
    ctx.fillStyle = '#C4A574';
    ctx.fillRect(0, 0, 512, 512);
    
    // Add grain texture
    for (let i = 0; i < 15000; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      const shade = Math.random() * 40 - 20;
      const r = 196 + shade;
      const g = 165 + shade;
      const b = 116 + shade;
      ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
      ctx.fillRect(x, y, 2, 2);
    }
    
    // Add some darker spots
    for (let i = 0; i < 200; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      ctx.fillStyle = 'rgba(139, 90, 43, 0.3)';
      ctx.beginPath();
      ctx.arc(x, y, Math.random() * 8 + 2, 0, Math.PI * 2);
      ctx.fill();
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(4, 4);
    return texture;
  }, []);

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
      <planeGeometry args={[GROUND_SIZE, GROUND_SIZE]} />
      <meshStandardMaterial 
        map={sandTexture}
        roughness={0.95}
        metalness={0.05}
        bumpScale={0.02}
      />
    </mesh>
  );
};

// 3D Walls/Boundaries
const Boundaries = () => {
  const woodColor = '#5D3E29';
  const halfSize = GROUND_SIZE / 2;
  
  return (
    <group>
      {/* Front wall */}
      <mesh position={[0, WALL_HEIGHT / 2, -halfSize]} castShadow receiveShadow>
        <boxGeometry args={[GROUND_SIZE + 0.4, WALL_HEIGHT, 0.2]} />
        <meshStandardMaterial color={woodColor} roughness={0.8} />
      </mesh>
      
      {/* Back wall */}
      <mesh position={[0, WALL_HEIGHT / 2, halfSize]} castShadow receiveShadow>
        <boxGeometry args={[GROUND_SIZE + 0.4, WALL_HEIGHT, 0.2]} />
        <meshStandardMaterial color={woodColor} roughness={0.8} />
      </mesh>
      
      {/* Left wall */}
      <mesh position={[-halfSize, WALL_HEIGHT / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.2, WALL_HEIGHT, GROUND_SIZE]} />
        <meshStandardMaterial color={woodColor} roughness={0.8} />
      </mesh>
      
      {/* Right wall */}
      <mesh position={[halfSize, WALL_HEIGHT / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.2, WALL_HEIGHT, GROUND_SIZE]} />
        <meshStandardMaterial color={woodColor} roughness={0.8} />
      </mesh>
      
      {/* Corner posts */}
      {[[-1, -1], [-1, 1], [1, -1], [1, 1]].map(([x, z], i) => (
        <mesh 
          key={i} 
          position={[x * halfSize, WALL_HEIGHT / 2, z * halfSize]} 
          castShadow
        >
          <cylinderGeometry args={[0.15, 0.15, WALL_HEIGHT, 8]} />
          <meshStandardMaterial color="#3D2817" roughness={0.7} />
        </mesh>
      ))}
    </group>
  );
};

// 3D Hole with depth
const Hole = () => {
  return (
    <group position={HOLE_POSITION}>
      {/* Hole rim */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.21, 0]}>
        <ringGeometry args={[HOLE_RADIUS - 0.05, HOLE_RADIUS + 0.08, 32]} />
        <meshStandardMaterial color="#654321" roughness={0.9} />
      </mesh>
      
      {/* Hole interior (cylinder going down) */}
      <mesh position={[0, -0.15, 0]}>
        <cylinderGeometry args={[HOLE_RADIUS, HOLE_RADIUS * 0.8, 0.5, 32]} />
        <meshStandardMaterial color="#1a0f0a" side={THREE.BackSide} />
      </mesh>
      
      {/* Hole bottom */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.4, 0]}>
        <circleGeometry args={[HOLE_RADIUS * 0.8, 32]} />
        <meshStandardMaterial color="#0a0505" />
      </mesh>
      
      {/* Shadow ring on ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <ringGeometry args={[HOLE_RADIUS + 0.08, HOLE_RADIUS + 0.3, 32]} />
        <meshStandardMaterial color="#000000" transparent opacity={0.2} />
      </mesh>
    </group>
  );
};

// 3D Starting Line marker
const StartingLine = () => {
  return (
    <group position={[0, 0.02, 4]}>
      {/* Main line */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[3, 0.1]} />
        <meshStandardMaterial color="#8B4513" roughness={0.9} />
      </mesh>
      
      {/* Side markers */}
      <mesh position={[-1.6, 0.1, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.08, 0.25, 8]} />
        <meshStandardMaterial color="#D4A574" roughness={0.6} />
      </mesh>
      <mesh position={[1.6, 0.1, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.08, 0.25, 8]} />
        <meshStandardMaterial color="#D4A574" roughness={0.6} />
      </mesh>
    </group>
  );
};

// Realistic Marble with reflections
const ShooterMarble = ({ 
  position, 
  velocity,
  onPositionUpdate
}: { 
  position: React.MutableRefObject<THREE.Vector3>;
  velocity: React.MutableRefObject<THREE.Vector3>;
  onPositionUpdate: (pos: THREE.Vector3) => void;
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const halfSize = GROUND_SIZE / 2 - 0.3;

  useFrame(() => {
    if (!meshRef.current) return;
    
    // Apply velocity
    position.current.x += velocity.current.x;
    position.current.z += velocity.current.z;
    
    // Wall collisions with bounce
    if (position.current.x < -halfSize) {
      position.current.x = -halfSize;
      velocity.current.x *= -0.6; // Bounce with energy loss
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
    
    // Check if falling into hole
    const dx = position.current.x - HOLE_POSITION[0];
    const dz = position.current.z - HOLE_POSITION[2];
    const distToHole = Math.sqrt(dx * dx + dz * dz);
    
    if (distToHole < HOLE_RADIUS * 0.7) {
      // Marble falls into hole
      position.current.y = Math.max(position.current.y - 0.05, -0.3);
      velocity.current.multiplyScalar(0.9);
    } else {
      position.current.y = SHOOTER_START[1];
    }
    
    // Apply friction (sand friction is higher)
    velocity.current.x *= 0.965;
    velocity.current.z *= 0.965;
    
    // Update mesh position
    meshRef.current.position.copy(position.current);
    onPositionUpdate(position.current.clone());
    
    // Realistic rolling rotation
    const speed = Math.sqrt(velocity.current.x ** 2 + velocity.current.z ** 2);
    if (speed > 0.001) {
      const rotationSpeed = speed * 5;
      meshRef.current.rotation.x += velocity.current.z * rotationSpeed;
      meshRef.current.rotation.z -= velocity.current.x * rotationSpeed;
    }
  });

  return (
    <mesh ref={meshRef} position={SHOOTER_START} castShadow>
      <sphereGeometry args={[0.2, 64, 64]} />
      <meshStandardMaterial 
        color="#1C2833"
        metalness={0.8}
        roughness={0.15}
        envMapIntensity={1.2}
      />
    </mesh>
  );
};

// Decorative stones around the field
const DecoStones = () => {
  const stones = useMemo(() => {
    const arr = [];
    for (let i = 0; i < 15; i++) {
      const angle = (i / 15) * Math.PI * 2;
      const radius = GROUND_SIZE / 2 + 0.8;
      arr.push({
        position: [
          Math.cos(angle) * radius + (Math.random() - 0.5) * 0.5,
          0.1 + Math.random() * 0.1,
          Math.sin(angle) * radius + (Math.random() - 0.5) * 0.5
        ] as [number, number, number],
        scale: 0.1 + Math.random() * 0.15,
        color: `hsl(30, ${20 + Math.random() * 20}%, ${40 + Math.random() * 20}%)`
      });
    }
    return arr;
  }, []);

  return (
    <group>
      {stones.map((stone, i) => (
        <mesh key={i} position={stone.position} castShadow>
          <dodecahedronGeometry args={[stone.scale, 0]} />
          <meshStandardMaterial color={stone.color} roughness={0.9} />
        </mesh>
      ))}
    </group>
  );
};

// Aim Arrow (3D)
const AimArrow = ({ 
  start, 
  direction, 
  power, 
  visible 
}: { 
  start: THREE.Vector3; 
  direction: THREE.Vector3; 
  power: number; 
  visible: boolean; 
}) => {
  if (!visible || power < 0.05) return null;
  
  const length = power * 3;
  const end = start.clone().add(direction.clone().multiplyScalar(length));
  
  return (
    <group>
      {/* Arrow line */}
      <Line 
        points={[[start.x, 0.3, start.z], [end.x, 0.3, end.z]]} 
        color="#ffffff" 
        lineWidth={3}
        transparent
        opacity={0.8}
      />
      
      {/* Power indicator dots */}
      {[0.25, 0.5, 0.75].map((t, i) => (
        power > t && (
          <mesh 
            key={i}
            position={[
              start.x + direction.x * length * t,
              0.3,
              start.z + direction.z * length * t
            ]}
          >
            <sphereGeometry args={[0.05, 8, 8]} />
            <meshBasicMaterial color={power > 0.7 ? '#ff4444' : power > 0.4 ? '#ffaa00' : '#44ff44'} />
          </mesh>
        )
      ))}
    </group>
  );
};

// Interactive ground plane for drag detection
const DragPlane = ({ 
  onDragStart, 
  onDrag, 
  onDragEnd,
  marblePosition,
  canInteract,
  setIsDragging
}: {
  onDragStart: (point: THREE.Vector3) => void;
  onDrag: (point: THREE.Vector3) => void;
  onDragEnd: (point: THREE.Vector3) => void;
  marblePosition: THREE.Vector3;
  canInteract: boolean;
  setIsDragging: (dragging: boolean) => void;
}) => {
  const [localDragging, setLocalDragging] = useState(false);
  const planeRef = useRef<THREE.Mesh>(null);

  const handlePointerDown = useCallback((e: any) => {
    if (!canInteract) return;
    e.stopPropagation();
    
    const point = e.point as THREE.Vector3;
    const dx = point.x - marblePosition.x;
    const dz = point.z - marblePosition.z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    
    if (dist < 1) {
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
      ref={planeRef}
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

const GameScene = ({ 
  marblePosition,
  velocity,
  onShoot,
  onDragUpdate,
  canShoot,
  currentMarblePos
}: {
  marblePosition: React.MutableRefObject<THREE.Vector3>;
  velocity: React.MutableRefObject<THREE.Vector3>;
  onShoot: (power: number, direction: THREE.Vector3) => void;
  onDragUpdate: (power: number, direction: THREE.Vector3 | null) => void;
  canShoot: boolean;
  currentMarblePos: THREE.Vector3;
}) => {
  const dragStartRef = useRef<THREE.Vector3 | null>(null);
  const [aimDirection, setAimDirection] = useState<THREE.Vector3>(new THREE.Vector3());
  const [aimPower, setAimPower] = useState(0);
  const [showAim, setShowAim] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragStart = useCallback((point: THREE.Vector3) => {
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
    onDragUpdate(0, null);
  }, [onShoot, onDragUpdate]);

  const handleMarblePositionUpdate = useCallback((pos: THREE.Vector3) => {
    // Position update handled by parent
  }, []);

  return (
    <>
      {/* Environment & Lighting */}
      <Sky 
        distance={450000}
        sunPosition={[5, 15, 10]}
        inclination={0.6}
        azimuth={0.25}
      />
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

      {/* Ground */}
      <SandGround />

      {/* Boundaries */}
      <Boundaries />

      {/* Decorative elements */}
      <DecoStones />

      {/* Hole */}
      <Hole />

      {/* Starting Line */}
      <StartingLine />

      {/* Aim Arrow */}
      <AimArrow 
        start={currentMarblePos} 
        direction={aimDirection} 
        power={aimPower} 
        visible={showAim} 
      />

      {/* Shooter Marble */}
      <ShooterMarble 
        position={marblePosition} 
        velocity={velocity} 
        onPositionUpdate={handleMarblePositionUpdate}
      />

      {/* Interactive Drag Plane */}
      <DragPlane 
        onDragStart={handleDragStart}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        marblePosition={currentMarblePos}
        canInteract={canShoot}
        setIsDragging={setIsDragging}
      />

      {/* Camera controls for viewing - DISABLED during aiming */}
      <OrbitControls 
        enablePan={false}
        enableZoom={true}
        enableRotate={!isDragging}
        minPolarAngle={Math.PI / 6}
        maxPolarAngle={Math.PI / 2.5}
        minDistance={8}
        maxDistance={20}
      />
    </>
  );
};

const Level1Page = () => {
  const marblePosition = useRef(new THREE.Vector3(...SHOOTER_START));
  const velocity = useRef(new THREE.Vector3(0, 0, 0));
  
  const [power, setPower] = useState(0);
  const [shots, setShots] = useState(0);
  const [isMoving, setIsMoving] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [isWin, setIsWin] = useState(false);
  const [currentMarblePos, setCurrentMarblePos] = useState(new THREE.Vector3(...SHOOTER_START));
  
  const { recordShot, recordWin, completeLevel } = useGameStore();

  const checkWinCondition = useCallback(() => {
    const pos = marblePosition.current;
    const dx = pos.x - HOLE_POSITION[0];
    const dz = pos.z - HOLE_POSITION[2];
    const distance = Math.sqrt(dx * dx + dz * dz);
    
    if (distance < HOLE_RADIUS * 0.7 && pos.y < 0) {
      setIsWin(true);
      setShowResult(true);
      recordWin(1);
      completeLevel(1);
    }
  }, [recordWin, completeLevel]);

  // Check if marble stopped moving
  useEffect(() => {
    if (!isMoving) return;
    
    const checkInterval = setInterval(() => {
      const speed = Math.sqrt(
        velocity.current.x ** 2 + velocity.current.z ** 2
      );
      
      // Update current position for UI
      setCurrentMarblePos(marblePosition.current.clone());
      
      if (speed < 0.002) {
        velocity.current.set(0, 0, 0);
        setIsMoving(false);
        checkWinCondition();
      }
    }, 50);

    return () => clearInterval(checkInterval);
  }, [isMoving, checkWinCondition]);

  const handleShoot = useCallback((shootPower: number, direction: THREE.Vector3) => {
    const force = shootPower * 0.25;
    velocity.current.set(
      direction.x * force,
      0,
      direction.z * force
    );
    setIsMoving(true);
    setShots(s => s + 1);
    recordShot();
  }, [recordShot]);

  const handleDragUpdate = useCallback((dragPower: number, direction: THREE.Vector3 | null) => {
    setPower(dragPower);
  }, []);

  const resetGame = useCallback(() => {
    marblePosition.current.set(...SHOOTER_START);
    velocity.current.set(0, 0, 0);
    setCurrentMarblePos(new THREE.Vector3(...SHOOTER_START));
    setShots(0);
    setIsMoving(false);
    setShowResult(false);
    setIsWin(false);
  }, []);

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
            <h2 className="font-bold text-foreground">Level 1: Hole Challenge</h2>
            <p className="text-sm text-muted-foreground">Shots: {shots}</p>
          </div>
          
          <Button variant="outline" size="sm" onClick={resetGame} className="bg-card/90 backdrop-blur">
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset
          </Button>
        </div>

        {/* Instructions */}
        <div className="absolute bottom-4 left-4 z-10 bg-card/90 backdrop-blur p-4 rounded-lg max-w-xs border border-border shadow-lg">
          <h3 className="font-semibold text-foreground mb-2">How to Play:</h3>
          <ol className="text-sm text-muted-foreground space-y-1">
            <li>1. Click near the dark marble</li>
            <li>2. Drag backwards to aim & set power</li>
            <li>3. Release to shoot into the hole!</li>
          </ol>
          <p className="text-xs text-muted-foreground mt-2 opacity-70">
            Tip: Drag mouse to rotate camera view
          </p>
        </div>

        {/* Power Meter */}
        <PowerMeter power={power} visible={power > 0} />

        {/* 3D Canvas */}
        <Canvas 
          shadows 
          camera={{ position: [0, 12, 10], fov: 50 }}
          gl={{ antialias: true }}
        >
          <GameScene 
            marblePosition={marblePosition}
            velocity={velocity}
            onShoot={handleShoot}
            onDragUpdate={handleDragUpdate}
            canShoot={!isMoving}
            currentMarblePos={currentMarblePos}
          />
        </Canvas>

        {/* Game Result */}
        <GameResult 
          isOpen={showResult}
          isWin={isWin}
          marblesChange={isWin ? 1 : 0}
          onPlayAgain={resetGame}
          levelName="Level 1: Hole Challenge"
        />
      </div>
    </Layout>
  );
};

export default Level1Page;
