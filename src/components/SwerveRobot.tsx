import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { RigidBody, CuboidCollider } from '@react-three/rapier'
import type { RapierRigidBody } from '@react-three/rapier'
import { Text } from '@react-three/drei'
import * as THREE from 'three'
import { useSim, type SwerveModuleState } from '../store'
import { useParams } from '../stores/paramStore'

// Swerve module positions relative to robot center (meters)
// Track width: 0.56m, Wheelbase: 0.56m (chassis size 0.76m x 0.76m)
const MODULE_OFFSETS = [
  { id: 'FL' as const, x: -0.28, z: -0.28 },
  { id: 'FR' as const, x: 0.28, z: -0.28 },
  { id: 'BL' as const, x: -0.28, z: 0.28 },
  { id: 'BR' as const, x: 0.28, z: 0.28 },
]

function SwerveModuleMesh({
  position,
  angle,
  speed,
}: {
  position: [number, number, number]
  angle: number
  speed: number
}) {
  const wheelRef = useRef<THREE.Mesh>(null)

  useFrame((_, dt) => {
    if (wheelRef.current) {
      // Spin the wheel based on drive speed
      wheelRef.current.rotation.x += speed * dt * 10
    }
  })

  return (
    <group position={position}>
      {/* Fixed swerve mounting billet bracket */}
      <mesh position={[0, 0.08, 0]} castShadow>
        <boxGeometry args={[0.11, 0.04, 0.11]} />
        <meshStandardMaterial color="#334155" metalness={0.8} roughness={0.3} />
      </mesh>
      {/* Drive & Steer Falcon/Kraken motors simulation */}
      <mesh position={[0.03, 0.14, 0.03]} castShadow>
        <cylinderGeometry args={[0.025, 0.025, 0.08, 16]} />
        <meshStandardMaterial color="#0284c7" metalness={0.9} roughness={0.2} />
      </mesh>
      <mesh position={[-0.03, 0.14, -0.03]} castShadow>
        <cylinderGeometry args={[0.022, 0.022, 0.07, 16]} />
        <meshStandardMaterial color="#0f172a" metalness={0.8} roughness={0.3} />
      </mesh>

      {/* Rotating Azimuth Assembly */}
      <group rotation={[0, angle, 0]}>
        {/* Azimuth fork / wheel yoke */}
        <mesh position={[0, 0.01, 0]}>
          <boxGeometry args={[0.08, 0.08, 0.05]} />
          <meshStandardMaterial color="#64748b" metalness={0.8} roughness={0.2} />
        </mesh>

        {/* Nitrile Tread Drive Wheel */}
        <mesh ref={wheelRef} position={[0, -0.035, 0]} castShadow>
          <cylinderGeometry args={[0.05, 0.05, 0.035, 20]} />
          {/* Rotate cylinder so its rolling axis aligns with X */}
          <meshStandardMaterial color="#0f172a" roughness={0.95} />
        </mesh>
      </group>
    </group>
  )
}

export function SwerveRobot() {
  const bodyRef = useRef<RapierRigidBody>(null)
  const lastSpeedRef = useRef(0)
  const tAccRef = useRef(0)
  const gyroDriftAccRef = useRef(0)
  const moduleAnglesRef = useRef<[number, number, number, number]>([0, 0, 0, 0])

  const {
    alliance,
    elevatorHeight,
    intakeActive,
    virtualInput,
  } = useSim()

  const pVals = useParams((p) => p.values)

  // 190-parameter dynamic extractions
  const robotMass = Number(pVals['robot.mass']) || 56
  const comX = Number(pVals['robot.com_x']) || 0
  const comY = Number(pVals['robot.com_y']) || 0
  const comZ = Number(pVals['robot.com_z']) || 0.08

  // Drivetrain & Motors
  const motorType = String(pVals['drive.motor_drive'] || 'falcon500')
  const defaultStallTorque = motorType === 'krakenx60' ? 7.09 : motorType === 'neo' ? 3.28 : 4.69
  const stallTorque = Number(pVals['drive.stall_torque_drive']) || defaultStallTorque
  const gearRatio = Number(pVals['drive.gear_ratio_drive']) || 6.12
  const wheelDia = Number(pVals['drive.wheel_dia']) || 0.1016
  const wheelRadius = wheelDia / 2
  const wheelFric = Number(pVals['drive.wheel_fric']) || 1.2
  const carpetFric = Number(pVals['field.carpet_fric_x']) || 1.15
  const combinedMu = Math.min(wheelFric, carpetFric)

  // Calculated motor force: 4 modules * (Torque * GearRatio / WheelRadius)
  const motorForceCalc = 4 * ((stallTorque * gearRatio) / wheelRadius)
  const maxSpeed = Number(pVals['ctrl.max_vel']) || Number(pVals['robot.max_v']) || 4.5
  const maxAngularSpeed = Number(pVals['robot.max_omega']) || 8.0
  const vertGravity = Math.abs(Number(pVals['world.gravity_z']) ?? -9.81)

  // Control Curves (Deadband & Expo)
  const deadband = Number(pVals['ctrl.deadband']) || 0.05
  const expo = Number(pVals['ctrl.expo']) || 0.5

  function shapeInput(val: number): number {
    const sign = Math.sign(val)
    const abs = Math.abs(val)
    if (abs < deadband) return 0
    const scaled = (abs - deadband) / (1 - deadband)
    const curved = (1 - expo) * scaled + expo * (scaled * scaled * scaled)
    return sign * curved
  }

  // Electrical specs
  const battNominal = Number(pVals['elec.batt_voltage']) || 12.8
  const battRes = Number(pVals['elec.batt_resistance']) || 0.02
  const brownoutV = Number(pVals['elec.brownout_v']) || 6.5
  const currentLimit = (Number(pVals['drive.current_limit_drive']) || 60) * 4 // total 4 motors

  // Sensor specs
  const gyroDriftRate = (Number(pVals['sensor.gyro_drift']) || 0.01) * (Math.PI / 180) // rad/s
  const gyroNoiseAmp = (Number(pVals['sensor.gyro_noise']) || 0.002) * (Math.PI / 180)
  const drivetrain = String(pVals['drive.type'] || 'swerve')
  const bumperFric = Number(pVals['robot.bumper_fric']) || 0.6

  const bumperColor = alliance === 'blue' ? '#1d4ed8' : '#b91c1c'

  // Input axis evaluation (combining keyboard + virtual/gamepad sticks)
  useFrame((_, rawDt) => {
    const b = bodyRef.current
    if (!b) return

    const dt = Math.min(rawDt, 1 / 30)
    const pos = b.translation()

    // Safety auto-recovery if bot somehow leaves field bounds
    if (pos.y < -0.5 || Math.abs(pos.x) > 10 || Math.abs(pos.z) > 6) {
      b.setTranslation({ x: -4, y: 0.35, z: 0 }, true)
      b.setLinvel({ x: 0, y: 0, z: 0 }, true)
      b.setAngvel({ x: 0, y: 0, z: 0 }, true)
      return
    }

    const q = b.rotation()
    const yaw = 2 * Math.atan2(q.y, q.w)

    // Robot local forward & right vectors in world space
    const fwdX = -Math.sin(yaw)
    const fwdZ = -Math.cos(yaw)
    const rgtX = Math.cos(yaw)
    const rgtZ = -Math.sin(yaw)

    const lin = b.linvel()
    const vFwd = lin.x * fwdX + lin.z * fwdZ
    const vRgt = lin.x * rgtX + lin.z * rgtZ

    // Commanded inputs with deadband & expo shaping
    let cmdFwd = shapeInput(virtualInput.fwd)
    let cmdStrafe = shapeInput(virtualInput.strafe)
    let cmdTurn = shapeInput(virtualInput.turn)

    // Limit magnitude of joystick translation vector
    const transMag = Math.hypot(cmdFwd, cmdStrafe)
    if (transMag > 1) {
      cmdFwd /= transMag
      cmdStrafe /= transMag
    }

    // Swerve Inverse Kinematics calculations for 4 modules
    const targetVx = (drivetrain === 'swerve' ? cmdStrafe : 0) * maxSpeed
    const targetVz = cmdFwd * maxSpeed
    const targetOmega = cmdTurn * maxAngularSpeed

    const newModuleStates: [SwerveModuleState, SwerveModuleState, SwerveModuleState, SwerveModuleState] = [
      { id: 'FL', angle: 0, speed: 0, voltage: 0 },
      { id: 'FR', angle: 0, speed: 0, voltage: 0 },
      { id: 'BL', angle: 0, speed: 0, voltage: 0 },
      { id: 'BR', angle: 0, speed: 0, voltage: 0 },
    ]

    MODULE_OFFSETS.forEach((mod, idx) => {
      // Kinematic formula: V_module = V_chassis + (Omega x r)
      const vx = targetVx - targetOmega * mod.z
      const vz = targetVz + targetOmega * mod.x
      const speed = Math.hypot(vx, vz)

      let angle = moduleAnglesRef.current[idx]
      if (speed > 0.05) {
        angle = Math.atan2(vx, vz)
        moduleAnglesRef.current[idx] = angle
      }

      newModuleStates[idx] = {
        id: mod.id,
        angle,
        speed: Math.min(speed, maxSpeed),
        voltage: Math.min(12, (speed / maxSpeed) * 12),
      }
    })

    // Traction & drive force physics
    const tractionLimit = combinedMu * robotMass * vertGravity
    let maxDriveForce = Math.min(motorForceCalc, tractionLimit)

    let reqForceFwd = ((cmdFwd * maxSpeed - vFwd) / dt) * robotMass
    let reqForceRgt = ((cmdStrafe * maxSpeed - vRgt) / dt) * robotMass

    const reqMag = Math.hypot(reqForceFwd, reqForceRgt)

    // Battery Sag Calculation
    const motorDutyCycle = Math.min(1.0, reqMag / (maxDriveForce + 1e-5))
    const currentDraw = Math.min(currentLimit, 15 + motorDutyCycle * (currentLimit - 15))
    const battSag = battNominal - currentDraw * battRes

    // Real Brownout Protection Check
    const inBrownout = battSag < brownoutV
    if (inBrownout) {
      maxDriveForce *= 0.2 // throttle motors heavily during brownout
    }

    if (reqMag > maxDriveForce && reqMag > 0) {
      reqForceFwd *= maxDriveForce / reqMag
      reqForceRgt *= maxDriveForce / reqMag
    }

    // Apply translational impulse
    b.applyImpulse(
      {
        x: (reqForceFwd * fwdX + reqForceRgt * rgtX) * dt,
        y: 0,
        z: (reqForceFwd * fwdZ + reqForceRgt * rgtZ) * dt,
      },
      true,
    )

    // Yaw rotational physics
    const currentOmega = b.angvel().y
    const maxAlpha = 14 * Math.min(1, tractionLimit / (robotMass * 9.81 + 1e-5)) * (motorForceCalc / 1500)
    const targetW = cmdTurn * (maxAngularSpeed * 0.5)
    const deltaW = Math.max(-maxAlpha * dt, Math.min(maxAlpha * dt, targetW - currentOmega))

    b.setAngvel({ x: 0, y: currentOmega + deltaW, z: 0 }, true)

    // Integrate gyro drift over time
    gyroDriftAccRef.current += gyroDriftRate * dt

    // Telemetry publishing at ~20 Hz
    tAccRef.current += dt
    if (tAccRef.current >= 0.05) {
      const currentSpeed = Math.hypot(lin.x, lin.z)
      const accel = (currentSpeed - lastSpeedRef.current) / tAccRef.current
      lastSpeedRef.current = currentSpeed

      const noisyHeading = yaw + gyroDriftAccRef.current + (Math.random() * 2 - 1) * gyroNoiseAmp

      useSim.getState().set({
        telemetry: {
          speed: currentSpeed,
          accel,
          traction: tractionLimit,
          batteryVolts: Math.max(5.0, battSag),
          loopTimeMs: 19.5 + Math.random() * 0.6,
          pose: { x: pos.x, z: pos.z, heading: noisyHeading },
        },
        swerveModules: newModuleStates,
      })
      tAccRef.current = 0
    }
  })

  const modules = useSim((s) => s.swerveModules)

  return (
    <RigidBody
      ref={bodyRef}
      position={[-4, 0.25, 0]}
      colliders={false}
      ccd={true}
      enabledRotations={[false, true, false]}
      linearDamping={0.15}
      angularDamping={0.4}
      canSleep={false}
    >
      {/* Primary Chassis Collider with center of mass offset */}
      <CuboidCollider
        args={[0.38, 0.12, 0.38]}
        position={[comX, comZ, comY]}
        mass={robotMass}
        friction={bumperFric}
      />

      {/* CHASSIS FRAME & BELLYPAN */}
      <mesh position={[0, 0.06, 0]} castShadow>
        <boxGeometry args={[0.7, 0.04, 0.7]} />
        <meshStandardMaterial color="#1e293b" metalness={0.7} roughness={0.3} />
      </mesh>

      {/* BELLYPAN ELECTRONICS (RoboRIO + Battery) */}
      <mesh position={[0, 0.09, 0.1]}>
        <boxGeometry args={[0.18, 0.03, 0.14]} />
        <meshStandardMaterial color="#0f172a" />
      </mesh>
      {/* Battery (Yellow Anderson connector simulation) */}
      <mesh position={[0.12, 0.11, -0.05]} castShadow>
        <boxGeometry args={[0.15, 0.12, 0.08]} />
        <meshStandardMaterial color="#171717" />
      </mesh>

      {/* REGULATION BUMPERS (30" x 30" with white team stencil) */}
      <group position={[0, 0.08, 0]}>
        {/* Front Bumper */}
        <mesh position={[0, 0, -0.37]} castShadow>
          <boxGeometry args={[0.76, 0.12, 0.08]} />
          <meshStandardMaterial color={bumperColor} roughness={0.7} />
        </mesh>
        {/* Back Bumper */}
        <mesh position={[0, 0, 0.37]} castShadow>
          <boxGeometry args={[0.76, 0.12, 0.08]} />
          <meshStandardMaterial color={bumperColor} roughness={0.7} />
        </mesh>
        {/* Left Bumper */}
        <mesh position={[-0.37, 0, 0]} castShadow>
          <boxGeometry args={[0.08, 0.12, 0.66]} />
          <meshStandardMaterial color={bumperColor} roughness={0.7} />
        </mesh>
        {/* Right Bumper */}
        <mesh position={[0.37, 0, 0]} castShadow>
          <boxGeometry args={[0.08, 0.12, 0.66]} />
          <meshStandardMaterial color={bumperColor} roughness={0.7} />
        </mesh>

        {/* Team Number 2027 stencils on front & back */}
        <Text
          position={[0, 0.01, -0.415]}
          rotation={[0, Math.PI, 0]}
          fontSize={0.065}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
        >
          2027
        </Text>
        <Text
          position={[0, 0.01, 0.415]}
          fontSize={0.065}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
        >
          2027
        </Text>
      </group>

      {/* 4 ACTIVE SWERVE MODULES */}
      {MODULE_OFFSETS.map((m, i) => (
        <SwerveModuleMesh
          key={m.id}
          position={[m.x, -0.01, m.z]}
          angle={modules[i]?.angle ?? 0}
          speed={modules[i]?.speed ?? 0}
        />
      ))}

      {/* 2-STAGE ARTICULATED ELEVATOR */}
      <group position={[0, 0.12, 0.15]}>
        {/* Outer fixed vertical masts */}
        <mesh position={[-0.2, 0.4, 0]} castShadow>
          <boxGeometry args={[0.04, 0.8, 0.04]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.8} roughness={0.2} />
        </mesh>
        <mesh position={[0.2, 0.4, 0]} castShadow>
          <boxGeometry args={[0.04, 0.8, 0.04]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.8} roughness={0.2} />
        </mesh>
        {/* Top crossbar */}
        <mesh position={[0, 0.8, 0]}>
          <boxGeometry args={[0.44, 0.03, 0.04]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.8} roughness={0.2} />
        </mesh>

        {/* Moving Inner Stage Carriage */}
        <group position={[0, elevatorHeight, 0]}>
          <mesh position={[0, 0.25, -0.05]} castShadow>
            <boxGeometry args={[0.38, 0.08, 0.12]} />
            <meshStandardMaterial color="#f59e0b" metalness={0.5} roughness={0.3} />
          </mesh>
        </group>
      </group>

      {/* FRONT INTAKE MECHANISM & ROLLERS */}
      <group position={[0, 0.1, -0.28]}>
        <mesh position={[-0.22, 0, -0.1]} rotation={[0.2, 0, 0]}>
          <boxGeometry args={[0.02, 0.05, 0.2]} />
          <meshStandardMaterial color="#38bdf8" opacity={0.7} transparent />
        </mesh>
        <mesh position={[0.22, 0, -0.1]} rotation={[0.2, 0, 0]}>
          <boxGeometry args={[0.02, 0.05, 0.2]} />
          <meshStandardMaterial color="#38bdf8" opacity={0.7} transparent />
        </mesh>

        {/* Spinning Compliant Wheels (Neon Green) */}
        <mesh position={[0, 0.02, -0.2]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.04, 0.04, 0.38, 16]} />
          <meshStandardMaterial
            color={intakeActive ? '#22c55e' : '#4ade80'}
            emissive={intakeActive ? '#22c55e' : '#000000'}
            emissiveIntensity={intakeActive ? 0.6 : 0}
            roughness={0.4}
          />
        </mesh>
      </group>

      {/* VISION SENSOR (Limelight / PhotonVision mount with glowing LED) */}
      <group position={[0, 0.35, -0.15]}>
        <mesh castShadow>
          <boxGeometry args={[0.08, 0.05, 0.06]} />
          <meshStandardMaterial color="#0f172a" />
        </mesh>
        {/* Glowing Green AprilTag Vision Ring */}
        <mesh position={[0, 0, -0.035]}>
          <ringGeometry args={[0.012, 0.022, 16]} />
          <meshBasicMaterial color="#22c55e" />
        </mesh>
      </group>
    </RigidBody>
  )
}
