import { create } from 'zustand'
import { useParams } from './stores/paramStore'

export type Drivetrain = 'swerve' | 'tank'
export type ThemeName = 'midnight' | 'ocean' | 'ember'

export interface GroundPreset {
  name: string
  mu: number
  color: string
  restitution: number
}

export const GROUNDS: GroundPreset[] = [
  { name: 'FRC Carpet (Regulation)', mu: 1.15, color: '#1c2838', restitution: 0.1 },
  { name: 'Polished Concrete', mu: 0.65, color: '#4b5563', restitution: 0.3 },
  { name: 'Wet Defense Plate', mu: 0.28, color: '#334155', restitution: 0.2 },
  { name: 'Ice / Low Friction', mu: 0.06, color: '#93c5fd', restitution: 0.4 },
  { name: 'Rubber / High Traction', mu: 1.45, color: '#0f172a', restitution: 0.1 },
]

export interface SwerveModuleState {
  id: 'FL' | 'FR' | 'BL' | 'BR'
  angle: number // Radians
  speed: number // m/s
  voltage: number // Motor command 0-12V
}

export interface SimParams {
  gravity: number // m/s^2 (downward)
  groundName: string
  mu: number
  drivetrain: Drivetrain
  robotMass: number // kg
  motorForce: number // N, max total force
  maxSpeed: number // m/s
  maxAngularSpeed: number // rad/s
  objectMass: number // kg per game piece
  resetKey: number
  theme: ThemeName
  alliance: 'blue' | 'red'
  eStop: boolean // Emergency stop — halts all robot motion immediately

  // Articulations
  elevatorHeight: number // 0 to 1.2 m
  intakeActive: boolean

  // Telemetry & Kinematics
  telemetry: {
    speed: number
    accel: number
    traction: number
    batteryVolts: number
    loopTimeMs: number
    pose: { x: number; z: number; heading: number }
  }
  swerveModules: [SwerveModuleState, SwerveModuleState, SwerveModuleState, SwerveModuleState]

  // Input states
  virtualInput: { fwd: number; strafe: number; turn: number }
  gamepadConnected: boolean
  activeKeys: string[]
  
  // Custom CAD model URI (if imported)
  customModelUrl: string | null
}

interface Store extends SimParams {
  set: (p: Partial<SimParams>) => void
  setVirtualInput: (input: { fwd: number; strafe: number; turn: number }) => void
  reset: () => void
  setModuleStates: (states: [SwerveModuleState, SwerveModuleState, SwerveModuleState, SwerveModuleState]) => void
}

const savedTheme = (localStorage.getItem('frcsim:theme') as ThemeName) || 'midnight'

const initialModules: [SwerveModuleState, SwerveModuleState, SwerveModuleState, SwerveModuleState] = [
  { id: 'FL', angle: 0, speed: 0, voltage: 0 },
  { id: 'FR', angle: 0, speed: 0, voltage: 0 },
  { id: 'BL', angle: 0, speed: 0, voltage: 0 },
  { id: 'BR', angle: 0, speed: 0, voltage: 0 },
]

export const useSim = create<Store>((set) => ({
  gravity: 9.81,
  groundName: 'FRC Carpet (Regulation)',
  mu: 1.15,
  drivetrain: 'swerve',
  robotMass: 54, // ~120 lbs with bumpers and battery
  motorForce: 480, // 4x Kraken X60 / Falcon 500 swerve drive
  maxSpeed: 4.8, // ~15.7 ft/s standard L2/L3 ratio
  maxAngularSpeed: 10.5, // rad/s (~1.6 rev/s spin)
  objectMass: 0.35, // Official FRC foam game piece
  resetKey: 0,
  theme: savedTheme,
  alliance: 'blue',
  eStop: false,

  elevatorHeight: 0.0,
  intakeActive: false,

  telemetry: {
    speed: 0,
    accel: 0,
    traction: 610,
    batteryVolts: 12.65,
    loopTimeMs: 19.8,
    pose: { x: 0, z: 0, heading: 0 },
  },
  swerveModules: initialModules,

  virtualInput: { fwd: 0, strafe: 0, turn: 0 },
  gamepadConnected: false,
  activeKeys: [],
  customModelUrl: null,

  set: (p) => {
    if (p.theme) localStorage.setItem('frcsim:theme', p.theme)
    // Synchronize into 190-param store so both panels stay in agreement
    const pStore = useParams.getState()
    if (p.gravity !== undefined) pStore.setParam('world.gravity_z', -p.gravity)
    if (p.mu !== undefined) pStore.setParam('field.carpet_fric_x', p.mu)
    if (p.robotMass !== undefined) pStore.setParam('robot.mass', p.robotMass)
    if (p.maxSpeed !== undefined) pStore.setParam('ctrl.max_vel', p.maxSpeed)
    if (p.drivetrain !== undefined) pStore.setParam('drive.type', p.drivetrain)
    if (p.objectMass !== undefined) pStore.setParam('game.piece_mass', p.objectMass)
    set(p)
  },
  setVirtualInput: (virtualInput) => set({ virtualInput }),
  setModuleStates: (swerveModules) => set({ swerveModules }),
  reset: () =>
    set((s) => ({
      resetKey: s.resetKey + 1,
      telemetry: {
        ...s.telemetry,
        speed: 0,
        accel: 0,
        batteryVolts: 12.65,
        pose: { x: 0, z: 0, heading: 0 },
      },
      swerveModules: initialModules,
    })),
}))
