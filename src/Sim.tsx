import { useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { Physics, RigidBody, BallCollider, CuboidCollider, useRapier } from '@react-three/rapier'
import { useSim } from './store'
import { useParams } from './stores/paramStore'
import { FRCField } from './components/FRCField'
import { SwerveRobot } from './components/SwerveRobot'

function GravitySync() {
  const { world } = useRapier()
  const pVals = useParams((p) => p.values)
  const gx = Number(pVals['world.gravity_x']) || 0
  const gy = Number(pVals['world.gravity_y']) || 0
  // Vertical gravity: world.gravity_z default is -9.81 m/s²
  const gz = Number(pVals['world.gravity_z']) ?? -9.81

  useEffect(() => {
    // In Three.js: Y is vertical, X is lateral, Z is longitudinal
    world.gravity = { x: gx, y: gz, z: gy }
  }, [gx, gy, gz, world])

  return null
}

function GamePieces() {
  const resetKey = useSim((s) => s.resetKey)
  const pVals = useParams((p) => p.values)

  const objectMass = Number(pVals['game.piece_mass']) || 0.35
  const mu = Number(pVals['game.piece_fric']) || Number(pVals['field.carpet_fric_x']) || 1.15
  const restitution = Number(pVals['game.piece_restitution']) || 0.25
  const pieceDrag = Number(pVals['game.piece_drag']) || 0.2

  // Regulation game pieces arranged along centerline and scoring zones
  const notePositions: [number, number][] = [
    [0, -2.5],
    [0, -1.2],
    [0, 0],
    [0, 1.2],
    [0, 2.5],
    [3.5, -1.5],
    [3.5, 1.5],
    [-3.5, -1.5],
    [-3.5, 1.5],
  ]

  // Heavy defense practice obstacles
  const obstacleBoxes: [number, number][] = [
    [2.5, 0],
    [-2.5, 0],
  ]

  return (
    <group key={resetKey}>
      {/* Official Game Pieces */}
      {notePositions.map(([x, z], i) => (
        <RigidBody
          key={`note-${i}`}
          position={[x, 0.25, z]}
          colliders={false}
          ccd={true}
          restitution={restitution}
          friction={mu}
          linearDamping={pieceDrag}
          angularDamping={0.4}
        >
          <BallCollider args={[0.18]} mass={objectMass} />
          {/* Orange Game Piece Mesh */}
          <mesh castShadow receiveShadow>
            <torusGeometry args={[0.15, 0.05, 16, 32]} />
            <meshStandardMaterial color="#f97316" roughness={0.6} />
          </mesh>
        </RigidBody>
      ))}

      {/* Defense Practice Crates */}
      {obstacleBoxes.map(([x, z], i) => (
        <RigidBody
          key={`box-${i}`}
          position={[x, 0.35, z]}
          colliders={false}
          ccd={true}
          friction={mu}
          restitution={0.1}
          linearDamping={0.3}
        >
          <CuboidCollider args={[0.3, 0.3, 0.3]} mass={objectMass * 30} />
          <mesh castShadow receiveShadow>
            <boxGeometry args={[0.6, 0.6, 0.6]} />
            <meshStandardMaterial color="#7c3aed" roughness={0.4} metalness={0.2} />
          </mesh>
        </RigidBody>
      ))}
    </group>
  )
}

export default function Sim() {
  const resetKey = useSim((s) => s.resetKey)
  const pVals = useParams((p) => p.values)

  // Reactive simulation frequency & time scale
  const timestep = Number(pVals['world.timestep']) || 0.02
  const timeScale = Math.max(0.1, Math.min(5.0, Number(pVals['world.time_scale']) || 1.0))
  const lightLux = Number(pVals['field.light_intensity']) || 1000
  const lightMult = Math.max(0.2, Math.min(3.0, lightLux / 1000))

  return (
    <Canvas
      shadows
      camera={{ position: [-6, 5.5, 5], fov: 50 }}
      className="w-full h-full"
    >
      <color attach="background" args={['#080d14']} />

      {/* Tunable Lighting Rig */}
      <ambientLight intensity={0.6 * lightMult} />
      <directionalLight
        position={[10, 16, 8]}
        intensity={1.3 * lightMult}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-12}
        shadow-camera-right={12}
        shadow-camera-top={8}
        shadow-camera-bottom={-8}
      />
      <directionalLight position={[-10, 12, -8]} intensity={0.4 * lightMult} />
      <pointLight position={[0, 6, 0]} intensity={0.7 * lightMult} />

      {/* Rock-solid Rapier Physics World with Timestep & Dilation */}
      <Physics
        key={`${resetKey}-${timestep}-${timeScale}`}
        timeStep={timestep / timeScale}
        gravity={[0, -9.81, 0]}
      >
        <GravitySync />
        <FRCField />
        <SwerveRobot />
        <GamePieces />
      </Physics>

      {/* Orbit Controls with bounded angles */}
      <OrbitControls
        makeDefault
        target={[-3, 0.2, 0]}
        maxPolarAngle={Math.PI / 2.05}
        minDistance={2}
        maxDistance={25}
      />
    </Canvas>
  )
}
