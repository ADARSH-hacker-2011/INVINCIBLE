import { RigidBody, CuboidCollider } from '@react-three/rapier'
import { Text } from '@react-three/drei'
import { GROUNDS, useSim } from '../store'
import { useParams } from '../stores/paramStore'

// Official regulation FRC field dimensions (meters)
// Length: ~16.54m, Width: ~8.21m
const FIELD_L = 16.54
const FIELD_W = 8.21
const HALF_L = FIELD_L / 2
const HALF_W = FIELD_W / 2

export function FRCField() {
  const { groundName } = useSim()
  const pVals = useParams((p) => p.values)
  const preset = GROUNDS.find((x) => x.name === groundName) ?? GROUNDS[0]

  // Reactive field parameters from 190-param engine
  const carpetFric = Number(pVals['field.carpet_fric_x']) || preset.mu || 1.15
  const wallH = Number(pVals['field.wall_height']) || 0.65
  const wallFric = Number(pVals['field.wall_fric']) || 0.3
  const bumpHeight = Number(pVals['field.bump_height']) || 0
  const slopeXDeg = Number(pVals['field.slope_x']) || 0
  const slopeYDeg = Number(pVals['field.slope_y']) || 0
  const restitution = Number(pVals['world.restitution']) || preset.restitution || 0.1

  const slopeXRad = (slopeXDeg * Math.PI) / 180
  const slopeZRad = (slopeYDeg * Math.PI) / 180

  return (
    <group rotation={[slopeZRad, 0, slopeXRad]}>
      {/* SOLID 1.0-METER SUB-FLOOR COLLIDER (Zero Tunneling Guarantee) */}
      <RigidBody type="fixed" friction={carpetFric} restitution={restitution}>
        <CuboidCollider args={[HALF_L + 4, 1.0, HALF_W + 4]} position={[0, -1.0, 0]} friction={carpetFric} />

        {/* Visual Arena Carpet */}
        <mesh position={[0, -0.01, 0]} receiveShadow>
          <boxGeometry args={[FIELD_L, 0.02, FIELD_W]} />
          <meshStandardMaterial color={preset.color} roughness={0.8} />
        </mesh>

        {/* Outer Runoff Floor */}
        <mesh position={[0, -0.02, 0]} receiveShadow>
          <boxGeometry args={[FIELD_L + 6, 0.015, FIELD_W + 6]} />
          <meshStandardMaterial color="#0b0f17" roughness={0.9} />
        </mesh>
      </RigidBody>

      {/* Optional Cable Protector / Bump Obstacle */}
      {bumpHeight > 0.005 && (
        <RigidBody type="fixed" friction={carpetFric}>
          <CuboidCollider args={[0.25, bumpHeight / 2, HALF_W - 0.5]} position={[0, bumpHeight / 2, 0]} />
          <mesh position={[0, bumpHeight / 2, 0]} castShadow receiveShadow>
            <boxGeometry args={[0.5, bumpHeight, FIELD_W - 1.0]} />
            <meshStandardMaterial color="#f59e0b" roughness={0.6} metalness={0.2} />
          </mesh>
        </RigidBody>
      )}

      {/* Field Lines & Alliance Zones */}
      <group position={[0, 0.005, 0]}>
        {/* Blue Alliance Zone */}
        <mesh position={[-HALF_L + 2.5, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[5, FIELD_W]} />
          <meshBasicMaterial color="#1e3a8a" opacity={0.18} transparent />
        </mesh>

        {/* Red Alliance Zone */}
        <mesh position={[HALF_L - 2.5, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[5, FIELD_W]} />
          <meshBasicMaterial color="#991b1b" opacity={0.18} transparent />
        </mesh>

        {/* Center Line */}
        <mesh position={[0, 0.001, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.08, FIELD_W]} />
          <meshBasicMaterial color="#ffffff" opacity={0.4} transparent />
        </mesh>

        {/* Alliance Driver Station Signs */}
        <Text
          position={[-HALF_L - 0.4, 1.1, 0]}
          rotation={[0, Math.PI / 2, 0]}
          fontSize={0.45}
          color="#3b82f6"
          anchorX="center"
          anchorY="middle"
        >
          BLUE ALLIANCE
        </Text>
        <Text
          position={[HALF_L + 0.4, 1.1, 0]}
          rotation={[0, -Math.PI / 2, 0]}
          fontSize={0.45}
          color="#ef4444"
          anchorX="center"
          anchorY="middle"
        >
          RED ALLIANCE
        </Text>
      </group>

      {/* Official Boundary Walls with RigidBody Colliders */}
      <RigidBody type="fixed" friction={wallFric}>
        {/* Blue End Wall */}
        <CuboidCollider args={[0.2, wallH, HALF_W]} position={[-HALF_L, wallH, 0]} />
        {/* Red End Wall */}
        <CuboidCollider args={[0.2, wallH, HALF_W]} position={[HALF_L, wallH, 0]} />
        {/* North Side Wall */}
        <CuboidCollider args={[HALF_L, wallH, 0.2]} position={[0, wallH, -HALF_W]} />
        {/* South Side Wall */}
        <CuboidCollider args={[HALF_L, wallH, 0.2]} position={[0, wallH, HALF_W]} />

        {/* Visual Wall Meshes: Aluminum extruded railings + tinted polycarb */}
        {/* Blue End Wall mesh */}
        <mesh position={[-HALF_L, wallH / 2, 0]}>
          <boxGeometry args={[0.08, wallH, FIELD_W]} />
          <meshStandardMaterial color="#1e3a8a" opacity={0.65} transparent roughness={0.3} />
        </mesh>
        {/* Red End Wall mesh */}
        <mesh position={[HALF_L, wallH / 2, 0]}>
          <boxGeometry args={[0.08, wallH, FIELD_W]} />
          <meshStandardMaterial color="#991b1b" opacity={0.65} transparent roughness={0.3} />
        </mesh>
        {/* North Wall mesh */}
        <mesh position={[0, wallH / 2, -HALF_W]}>
          <boxGeometry args={[FIELD_L, wallH, 0.08]} />
          <meshStandardMaterial color="#475569" opacity={0.5} transparent roughness={0.3} />
        </mesh>
        {/* South Wall mesh */}
        <mesh position={[0, wallH / 2, HALF_W]}>
          <boxGeometry args={[FIELD_L, wallH, 0.08]} />
          <meshStandardMaterial color="#475569" opacity={0.5} transparent roughness={0.3} />
        </mesh>

        {/* Top rail bumpers (silver aluminum) */}
        <mesh position={[0, wallH, -HALF_W]}>
          <boxGeometry args={[FIELD_L, 0.04, 0.1]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.7} roughness={0.2} />
        </mesh>
        <mesh position={[0, wallH, HALF_W]}>
          <boxGeometry args={[FIELD_L, 0.04, 0.1]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.7} roughness={0.2} />
        </mesh>
      </RigidBody>

      {/* Field Obstacle / Center Stage Truss (Procedural) */}
      <group position={[0, 0, 0]}>
        <mesh position={[-1.2, 1.2, 0]}>
          <cylinderGeometry args={[0.04, 0.04, 2.4]} />
          <meshStandardMaterial color="#64748b" metalness={0.8} roughness={0.3} />
        </mesh>
        <mesh position={[1.2, 1.2, 0]}>
          <cylinderGeometry args={[0.04, 0.04, 2.4]} />
          <meshStandardMaterial color="#64748b" metalness={0.8} roughness={0.3} />
        </mesh>
        <mesh position={[0, 2.4, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.05, 0.05, 2.4]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.8} roughness={0.3} />
        </mesh>
      </group>
    </group>
  )
}
