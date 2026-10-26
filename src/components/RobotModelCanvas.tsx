import { useRef, useState, Suspense } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Float, Text, ContactShadows, Sparkles } from '@react-three/drei'
import * as THREE from 'three'

interface RobotShowcaseSceneProps {
  alliance?: 'blue' | 'red'
  teamNumber?: string
  autoRotate?: boolean
}

function RobotModel3D({
  alliance = 'blue',
  teamNumber = '12364',
  autoRotate = true,
}: RobotShowcaseSceneProps) {
  const groupRef = useRef<THREE.Group>(null)
  const wheelRefs = useRef<THREE.Mesh[]>([])
  const azimuthRefs = useRef<THREE.Group[]>([])
  const shooterWheelRefs = useRef<THREE.Mesh[]>([])

  const bumperColor = alliance === 'blue' ? '#2563eb' : '#dc2626'
  const underglowColor = alliance === 'blue' ? '#38bdf8' : '#f87171'

  // Kinematic spinning animation in render loop
  useFrame((state, delta) => {
    if (autoRotate && groupRef.current) {
      groupRef.current.rotation.y += delta * 0.4
    }

    const t = state.clock.getElapsedTime()

    // Spin drive wheels
    wheelRefs.current.forEach((wheel) => {
      if (wheel) wheel.rotation.x += delta * 6
    })

    // Subtly articulate azimuth steering angles
    azimuthRefs.current.forEach((az, i) => {
      if (az) az.rotation.y = Math.sin(t * 1.5 + i * 0.8) * 0.35
    })

    // High-speed shooter flywheels
    shooterWheelRefs.current.forEach((flywheel, i) => {
      if (flywheel) flywheel.rotation.z += delta * 35 * (i % 2 === 0 ? 1 : -1)
    })
  })

  // 4 Module positions: 0.28m offset from center
  const modulePositions: [number, number, number][] = [
    [-0.28, -0.05, -0.28], // FL
    [0.28, -0.05, -0.28],  // FR
    [-0.28, -0.05, 0.28],  // BL
    [0.28, -0.05, 0.28],   // BR
  ]

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      {/* ── Main Chassis Tube Frame ───────────────────────────────────── */}
      <mesh position={[0, 0, 0]} castShadow>
        <boxGeometry args={[0.68, 0.04, 0.68]} />
        <meshStandardMaterial color="#1e293b" metalness={0.8} roughness={0.25} />
      </mesh>

      {/* ── Bumper Assembly (Regulation 5" tall) ──────────────────────── */}
      <group position={[0, 0.04, 0]}>
        {/* Front Bumper with Team Number */}
        <mesh position={[0, 0, 0.38]} castShadow>
          <boxGeometry args={[0.76, 0.12, 0.08]} />
          <meshStandardMaterial color={bumperColor} roughness={0.85} />
        </mesh>
        <Text
          position={[0, 0, 0.422]}
          fontSize={0.075}
          color="#ffffff"
          font="https://fonts.gstatic.com/s/jetbrainsmono/v18/tDbY2o-flEEny0FZhsfKu5WU4zr3E_ad06nG.woff"
          anchorX="center"
          anchorY="middle"
        >
          {teamNumber}
        </Text>

        {/* Rear Bumper with Team Number */}
        <mesh position={[0, 0, -0.38]} castShadow>
          <boxGeometry args={[0.76, 0.12, 0.08]} />
          <meshStandardMaterial color={bumperColor} roughness={0.85} />
        </mesh>
        <Text
          position={[0, 0, -0.422]}
          rotation={[0, Math.PI, 0]}
          fontSize={0.075}
          color="#ffffff"
          font="https://fonts.gstatic.com/s/jetbrainsmono/v18/tDbY2o-flEEny0FZhsfKu5WU4zr3E_ad06nG.woff"
          anchorX="center"
          anchorY="middle"
        >
          {teamNumber}
        </Text>

        {/* Left Bumper */}
        <mesh position={[-0.38, 0, 0]} castShadow>
          <boxGeometry args={[0.08, 0.12, 0.84]} />
          <meshStandardMaterial color={bumperColor} roughness={0.85} />
        </mesh>

        {/* Right Bumper */}
        <mesh position={[0.38, 0, 0]} castShadow>
          <boxGeometry args={[0.08, 0.12, 0.84]} />
          <meshStandardMaterial color={bumperColor} roughness={0.85} />
        </mesh>
      </group>

      {/* ── 4x SDS MK4i Swerve Modules ─────────────────────────────────── */}
      {modulePositions.map((pos, idx) => (
        <group key={idx} position={pos}>
          {/* Module Billet Mounting Bracket */}
          <mesh position={[0, 0.07, 0]} castShadow>
            <boxGeometry args={[0.11, 0.03, 0.11]} />
            <meshStandardMaterial color="#475569" metalness={0.9} roughness={0.2} />
          </mesh>

          {/* Kraken X60 Drive & Steer Brushless Motors */}
          <mesh position={[0.03, 0.13, 0.03]} castShadow>
            <cylinderGeometry args={[0.024, 0.024, 0.09, 16]} />
            <meshStandardMaterial color="#0284c7" metalness={0.95} roughness={0.15} />
          </mesh>
          <mesh position={[-0.03, 0.12, -0.03]} castShadow>
            <cylinderGeometry args={[0.022, 0.022, 0.07, 16]} />
            <meshStandardMaterial color="#0f172a" metalness={0.9} roughness={0.2} />
          </mesh>

          {/* Azimuth Rotating Fork & Wheel */}
          <group
            ref={(el) => {
              if (el) azimuthRefs.current[idx] = el
            }}
          >
            <mesh position={[0, 0.01, 0]}>
              <boxGeometry args={[0.08, 0.07, 0.05]} />
              <meshStandardMaterial color="#94a3b8" metalness={0.8} roughness={0.3} />
            </mesh>
            <mesh
              ref={(el) => {
                if (el) wheelRefs.current[idx] = el
              }}
              position={[0, -0.04, 0]}
              castShadow
            >
              <cylinderGeometry args={[0.05, 0.05, 0.035, 20]} />
              <meshStandardMaterial color="#0f172a" roughness={0.9} />
            </mesh>
          </group>
        </group>
      ))}

      {/* ── Dual-Stage Cascading Elevator Mast ───────────────────────── */}
      <group position={[0, 0.35, -0.1]}>
        {/* Left & Right Aluminum Mast Extrusions */}
        <mesh position={[-0.22, 0, 0]} castShadow>
          <boxGeometry args={[0.04, 0.65, 0.04]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.9} roughness={0.15} />
        </mesh>
        <mesh position={[0.22, 0, 0]} castShadow>
          <boxGeometry args={[0.04, 0.65, 0.04]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.9} roughness={0.15} />
        </mesh>
        {/* Top Crossbar */}
        <mesh position={[0, 0.32, 0]} castShadow>
          <boxGeometry args={[0.48, 0.03, 0.03]} />
          <meshStandardMaterial color="#64748b" metalness={0.8} roughness={0.2} />
        </mesh>

        {/* Elevated Carriage & Shooter Subsystem */}
        <group position={[0, 0.15, 0.08]}>
          {/* Shooter Backplate & Hood */}
          <mesh position={[0, 0, 0]} castShadow>
            <boxGeometry args={[0.38, 0.22, 0.16]} />
            <meshStandardMaterial color="#1e293b" metalness={0.7} roughness={0.3} />
          </mesh>

          {/* Left & Right High-Speed Flywheels */}
          <mesh
            ref={(el) => {
              if (el) shooterWheelRefs.current[0] = el
            }}
            position={[-0.14, 0.05, 0.08]}
            rotation={[Math.PI / 2, 0, 0]}
          >
            <cylinderGeometry args={[0.05, 0.05, 0.04, 20]} />
            <meshStandardMaterial color="#0284c7" metalness={0.9} roughness={0.1} />
          </mesh>
          <mesh
            ref={(el) => {
              if (el) shooterWheelRefs.current[1] = el
            }}
            position={[0.14, 0.05, 0.08]}
            rotation={[Math.PI / 2, 0, 0]}
          >
            <cylinderGeometry args={[0.05, 0.05, 0.04, 20]} />
            <meshStandardMaterial color="#0284c7" metalness={0.9} roughness={0.1} />
          </mesh>

          {/* Loaded Orange Foam Note (Torus) */}
          <mesh position={[0, 0.04, 0.04]} rotation={[Math.PI / 2.5, 0, 0]}>
            <torusGeometry args={[0.14, 0.035, 16, 32]} />
            <meshStandardMaterial color="#f97316" roughness={0.7} emissive="#ea580c" emissiveIntensity={0.25} />
          </mesh>
        </group>
      </group>

      {/* ── Underglow LED Strip ───────────────────────────────────────── */}
      <pointLight position={[0, -0.08, 0]} color={underglowColor} intensity={2.5} distance={1.8} />
      <mesh position={[0, -0.04, 0]}>
        <boxGeometry args={[0.55, 0.01, 0.55]} />
        <meshBasicMaterial color={underglowColor} />
      </mesh>
    </group>
  )
}

export function RobotModelCanvas({
  alliance = 'blue',
  teamNumber = '12364',
}: {
  alliance?: 'blue' | 'red'
  teamNumber?: string
}) {
  const [autoRotate, setAutoRotate] = useState(true)

  return (
    <div className="relative w-full h-[420px] sm:h-[500px] lg:h-[580px] rounded-3xl overflow-hidden glass-luxury border border-[var(--border-bright)] shadow-2xl">
      {/* ── 3D Canvas ─────────────────────────────────────────────────── */}
      <Canvas
        camera={{ position: [1.8, 1.4, 2.0], fov: 42 }}
        shadows
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={0.75} />
        <directionalLight position={[4, 8, 4]} intensity={1.8} castShadow shadow-mapSize={1024} />
        <pointLight position={[-4, 3, -4]} intensity={0.8} color="#818cf8" />

        <Suspense fallback={null}>
          <Float speed={1.2} rotationIntensity={0.2} floatIntensity={0.3}>
            <RobotModel3D alliance={alliance} teamNumber={teamNumber} autoRotate={autoRotate} />
          </Float>

          {/* Floating High-Tech Sparkles Dust */}
          <Sparkles count={45} scale={3.5} size={2.5} speed={0.4} opacity={0.35} color="#38bdf8" />

          {/* Contact Shadows Under Robot */}
          <ContactShadows position={[0, -0.22, 0]} opacity={0.65} scale={3} blur={1.8} far={1.5} />
        </Suspense>

        <OrbitControls
          enablePan={false}
          enableZoom={true}
          minDistance={1.2}
          maxDistance={3.8}
          maxPolarAngle={Math.PI / 2.05}
        />
      </Canvas>

      {/* ── Overlay Controls & Badges ─────────────────────────────────── */}
      <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
        <span className="px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase bg-[var(--bg-elevated)]/90 backdrop-blur-md border border-[var(--border)] text-cyan-400 flex items-center gap-1.5 shadow-md">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
          3D INTERACTIVE ROBOT MODEL
        </span>
      </div>

      <div className="absolute bottom-4 right-4 z-10 flex items-center gap-2">
        <button
          onClick={() => setAutoRotate(!autoRotate)}
          className="px-3 py-1.5 rounded-xl text-[11px] font-mono font-bold bg-[var(--bg-elevated)]/90 backdrop-blur-md border border-[var(--border)] text-[var(--muted)] hover:text-white transition shadow-md active:scale-95"
        >
          {autoRotate ? '⏸ PAUSE ROTATION' : '▶ AUTO ROTATE'}
        </button>
      </div>

      <div className="absolute bottom-4 left-4 z-10 text-[10px] font-mono text-[var(--muted)] hidden sm:block bg-[var(--panel)]/70 px-2.5 py-1 rounded-lg backdrop-blur-sm border border-[var(--border)]">
        DRAG TO ROTATE • SCROLL TO ZOOM
      </div>
    </div>
  )
}
