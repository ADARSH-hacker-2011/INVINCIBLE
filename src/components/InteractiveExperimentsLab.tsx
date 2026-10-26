import { useState, useMemo } from 'react'
import {
  Target,
  Compass,
  Flame,
  ShieldAlert,
} from 'lucide-react'
import { useSim } from '../store'

type LabId = 'shooter' | 'skidpad' | 'tipover' | 'motordyno'

export function InteractiveExperimentsLab() {
  const { robotMass, mu } = useSim()
  const [activeLab, setActiveLab] = useState<LabId>('shooter')

  // ── 1. Shooter Ballistics State ──────────────────────────────────────────
  const [flywheelRpm, setFlywheelRpm] = useState<number>(4500)
  const [hoodAngleDeg, setHoodAngleDeg] = useState<number>(55)
  const [targetDistance, setTargetDistance] = useState<number>(3.2)
  const speakerHeight = 2.05 // meters
  const shooterExitHeight = 0.45 // meters

  // Real ballistic trajectory calculation with air drag
  const trajectoryData = useMemo(() => {
    // 4-inch flywheel diameter -> v_exit approx 0.8 * surface speed
    const wheelRadiusM = 0.0508
    const surfaceSpeed = ((2 * Math.PI * wheelRadiusM) / 60) * flywheelRpm
    const exitVelocity = surfaceSpeed * 0.78 // slip efficiency
    const angleRad = (hoodAngleDeg * Math.PI) / 180

    let vx = exitVelocity * Math.cos(angleRad)
    let vy = exitVelocity * Math.sin(angleRad)
    let x = 0
    let y = shooterExitHeight
    const dt = 0.005
    const g = 9.81
    const cd = 0.47 // foam note drag coeff
    const area = 0.035 // frontal area m^2
    const noteMass = 0.235 // kg
    const rho = 1.225 // air density kg/m^3

    const points: { x: number; y: number }[] = [{ x, y }]
    let scored = false
    let apexY = y

    for (let i = 0; i < 600; i++) {
      const v = Math.hypot(vx, vy)
      const fDrag = 0.5 * rho * cd * area * v * v
      const ax = -((fDrag * (vx / v)) / noteMass)
      const ay = -g - (fDrag * (vy / v)) / noteMass

      vx += ax * dt
      vy += ay * dt
      x += vx * dt
      y += vy * dt

      if (y > apexY) apexY = y
      points.push({ x, y })

      // Target Speaker Opening is at [targetDistance, targetDistance + 0.4] at height speakerHeight
      if (
        Math.abs(x - targetDistance) < 0.25 &&
        y >= speakerHeight - 0.25 &&
        y <= speakerHeight + 0.35 &&
        vy < 0 // falling into speaker
      ) {
        scored = true
      }

      if (y <= 0) break
    }

    return { points, scored, apexY, exitVelocity }
  }, [flywheelRpm, hoodAngleDeg, targetDistance])

  // ── 2. Skidpad & Friction Circle State ──────────────────────────────────
  const [skidpadSpeed, setSkidpadSpeed] = useState<number>(3.8)
  const [turnRadius, setTurnRadius] = useState<number>(1.8)
  const [surfaceMu, setSurfaceMu] = useState<number>(mu || 1.15)

  const skidpadMetrics = useMemo(() => {
    const centripetalAcc = (skidpadSpeed * skidpadSpeed) / turnRadius
    const maxLateralAcc = surfaceMu * 9.81
    const isDrifting = centripetalAcc > maxLateralAcc
    const lateralG = centripetalAcc / 9.81
    const slipAngleDeg = isDrifting ? Math.min(45, (centripetalAcc - maxLateralAcc) * 6) : 0
    return { centripetalAcc, maxLateralAcc, isDrifting, lateralG, slipAngleDeg }
  }, [skidpadSpeed, turnRadius, surfaceMu])

  // ── 3. Tip-Over & Dynamic CoM State ──────────────────────────────────────
  const [elevatorExtension, setElevatorExtension] = useState<number>(0.8)
  const [brakingDecel, setBrakingDecel] = useState<number>(9.5)
  const trackWidthM = 0.65

  const tipOverMetrics = useMemo(() => {
    // Base robot CoM at 0.18m, elevator carriage adds weight higher up
    const baseComZ = 0.18
    const carriageMass = 12
    const totalMass = robotMass || 55
    const baseMass = totalMass - carriageMass
    const carriageZ = 0.25 + elevatorExtension
    const totalComZ = (baseMass * baseComZ + carriageMass * carriageZ) / totalMass

    // Tip over condition: a_decel / g > (trackWidth / 2) / totalComZ
    const tipThresholdDecel = 9.81 * ((trackWidthM / 2) / totalComZ)
    const isTipping = brakingDecel >= tipThresholdDecel
    const stabilityMarginPercent = Math.max(0, ((tipThresholdDecel - brakingDecel) / tipThresholdDecel) * 100)

    return { totalComZ, tipThresholdDecel, isTipping, stabilityMarginPercent }
  }, [elevatorExtension, brakingDecel, robotMass])

  // ── 4. Motor Dyno State ──────────────────────────────────────────────────
  const [selectedMotor, setSelectedMotor] = useState<'kraken' | 'falcon' | 'neo'>('kraken')
  const [appliedTorque, setAppliedTorque] = useState<number>(2.4)

  const motorData = useMemo(() => {
    const specs = {
      kraken: { name: 'Kraken X60', stallTorque: 7.09, freeRpm: 6000, stallCurrent: 366, freeCurrent: 2.0, R: 0.027 },
      falcon: { name: 'Falcon 500', stallTorque: 4.69, freeRpm: 6380, stallCurrent: 257, freeCurrent: 1.5, R: 0.035 },
      neo: { name: 'NEO Vortex', stallTorque: 3.6, freeRpm: 6784, stallCurrent: 211, freeCurrent: 3.6, R: 0.045 },
    }[selectedMotor]

    const torqueRatio = Math.min(1.0, appliedTorque / specs.stallTorque)
    const operatingRpm = Math.max(0, specs.freeRpm * (1 - torqueRatio))
    const currentDraw = specs.freeCurrent + (specs.stallCurrent - specs.freeCurrent) * torqueRatio
    const mechanicalPowerW = ((operatingRpm * 2 * Math.PI) / 60) * appliedTorque
    const electricalPowerW = 12 * currentDraw
    const efficiencyPercent = electricalPowerW > 0 ? Math.min(95, (mechanicalPowerW / electricalPowerW) * 100) : 0
    const heatLossW = Math.max(0, electricalPowerW - mechanicalPowerW)
    const breakerTripTimeSec = currentDraw > 60 ? (1200 / (currentDraw - 60)) : 999

    return { ...specs, operatingRpm, currentDraw, mechanicalPowerW, efficiencyPercent, heatLossW, breakerTripTimeSec }
  }, [selectedMotor, appliedTorque])

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background: 'var(--bg)' }}>
      <div className="flex-1 overflow-y-auto p-5">
        {/* Hero Banner */}
        <div className="hero-banner p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="gradient-text-brand text-2xl font-black tracking-tight mb-1 flex items-center gap-2">
                <Target size={24} className="text-[var(--accent)]" />
                INTERACTIVE MECHANISM & PHYSICS LABS
              </div>
              <p style={{ color: 'var(--muted)', fontSize: 13 }}>
                Live mechanism test-benches: test ballistics, swerve skidpad drifting, center-of-mass rollover, and motor dyno burnout.
              </p>
            </div>
            <div className="flex gap-2">
              <span className="badge badge-ready font-mono text-[10px]">LIVE RAPIER MATH</span>
              <span className="badge badge-running font-mono text-[10px]">REAL-TIME TESTBENCH</span>
            </div>
          </div>
        </div>

        {/* Lab Selector Navigation Pills */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
          {[
            { id: 'shooter', label: '🎯 Ballistics & Shooter Lab', icon: <Target size={14} /> },
            { id: 'skidpad', label: '🛞 Swerve Skidpad & Traction Lab', icon: <Compass size={14} /> },
            { id: 'tipover', label: '🦾 Superstructure CoM & Tip-Over Lab', icon: <ShieldAlert size={14} /> },
            { id: 'motordyno', label: '⚡ Motor Dyno & Thermal Burnout', icon: <Flame size={14} /> },
          ].map((lab) => (
            <button
              key={lab.id}
              onClick={() => setActiveLab(lab.id as LabId)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold font-mono transition-all ${
                activeLab === lab.id ? 'btn-glow' : 'border border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--muted)] hover:text-white'
              }`}
            >
              {lab.icon}
              {lab.label}
            </button>
          ))}
        </div>

        {/* ── LAB 1: SHOOTER BALLISTICS ────────────────────────────────────── */}
        {activeLab === 'shooter' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Controls */}
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5 space-y-4">
              <div className="section-header">Shooter Configuration</div>
              <div>
                <div className="flex justify-between text-xs font-mono mb-1">
                  <span className="text-[var(--muted)]">Flywheel Speed:</span>
                  <span className="text-[var(--text)] font-bold">{flywheelRpm} RPM</span>
                </div>
                <input
                  type="range"
                  min="2000"
                  max="6000"
                  step="50"
                  value={flywheelRpm}
                  onChange={(e) => setFlywheelRpm(parseInt(e.target.value))}
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-mono mb-1">
                  <span className="text-[var(--muted)]">Hood Release Angle:</span>
                  <span className="text-[var(--text)] font-bold">{hoodAngleDeg}°</span>
                </div>
                <input
                  type="range"
                  min="25"
                  max="75"
                  step="1"
                  value={hoodAngleDeg}
                  onChange={(e) => setHoodAngleDeg(parseInt(e.target.value))}
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-mono mb-1">
                  <span className="text-[var(--muted)]">Speaker Target Distance:</span>
                  <span className="text-[var(--text)] font-bold">{targetDistance.toFixed(2)} m</span>
                </div>
                <input
                  type="range"
                  min="1.0"
                  max="6.0"
                  step="0.1"
                  value={targetDistance}
                  onChange={(e) => setTargetDistance(parseFloat(e.target.value))}
                />
              </div>

              <div className="p-3 rounded-xl bg-[var(--bg)] border border-[var(--border)] space-y-2 text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-[var(--muted)]">Exit Velocity:</span>
                  <span className="text-[var(--accent-lite)] font-bold">{trajectoryData.exitVelocity.toFixed(1)} m/s</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--muted)]">Trajectory Apex:</span>
                  <span className="text-[var(--text)] font-bold">{trajectoryData.apexY.toFixed(2)} m</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-[var(--border)]">
                  <span className="text-[var(--muted)]">Speaker Goal Status:</span>
                  <span className={`px-2 py-0.5 rounded font-bold ${trajectoryData.scored ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'}`}>
                    {trajectoryData.scored ? '✓ GOAL SCORED' : '✗ MISS TARGET'}
                  </span>
                </div>
              </div>
            </div>

            {/* 2D Trajectory Canvas */}
            <div className="lg:col-span-2 rounded-2xl border border-[var(--border)] bg-black/60 p-5 flex flex-col justify-between">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-mono text-[var(--muted)]">FLIGHT TRAJECTORY SIMULATION (AIR DRAG INCLUDED)</span>
                <span className="text-[10px] font-mono text-[var(--accent)]">SCALE: 1m GRID</span>
              </div>

              <div className="relative w-full h-72 border border-[var(--border)] rounded-xl bg-[var(--bg)] overflow-hidden">
                <svg className="w-full h-full" viewBox="0 0 600 280">
                  {/* Grid Lines */}
                  {[1, 2, 3, 4, 5, 6].map((m) => (
                    <line key={m} x1={m * 90} y1="0" x2={m * 90} y2="280" stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" />
                  ))}
                  {[0.5, 1.0, 1.5, 2.0, 2.5].map((h) => (
                    <line key={h} x1="0" y1={280 - h * 100} x2="600" y2={280 - h * 100} stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" />
                  ))}

                  {/* Speaker Target Opening */}
                  <rect
                    x={targetDistance * 90 - 15}
                    y={280 - speakerHeight * 100 - 20}
                    width="30"
                    height="40"
                    fill="rgba(59, 130, 246, 0.2)"
                    stroke="#3B82F6"
                    strokeWidth="2"
                    rx="4"
                  />
                  <text
                    x={targetDistance * 90}
                    y={280 - speakerHeight * 100 - 25}
                    textAnchor="middle"
                    fill="#38BDF8"
                    fontSize="9"
                    fontFamily="monospace"
                  >
                    SPEAKER (2.05m)
                  </text>

                  {/* Robot Origin */}
                  <rect x="0" y={280 - 45} width="40" height="45" fill="#1E293B" stroke="var(--border)" rx="4" />
                  <text x="20" y="270" textAnchor="middle" fill="#64748B" fontSize="8" fontFamily="monospace">
                    ROBOT
                  </text>

                  {/* Flight Curve */}
                  <polyline
                    points={trajectoryData.points.map((p) => `${p.x * 90},${280 - p.y * 100}`).join(' ')}
                    fill="none"
                    stroke={trajectoryData.scored ? '#34D399' : '#F43F5E'}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />

                  {/* Note marker at apex */}
                  <circle
                    cx={trajectoryData.points[Math.floor(trajectoryData.points.length / 2)]?.x * 90 || 0}
                    cy={280 - (trajectoryData.points[Math.floor(trajectoryData.points.length / 2)]?.y * 100 || 0)}
                    r="5"
                    fill="#FB923C"
                  />
                </svg>
              </div>

              <div className="flex justify-between items-center text-[10px] font-mono text-[var(--muted)] mt-3">
                <span>● Robot Shooter Exit (0.45m)</span>
                <span className="text-orange-400">● Foam Note Apex</span>
                <span className="text-blue-400">■ Speaker Funnel Target</span>
              </div>
            </div>
          </div>
        )}

        {/* ── LAB 2: SWERVE SKIDPAD & TRACTION ─────────────────────────────── */}
        {activeLab === 'skidpad' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5 space-y-4">
              <div className="section-header">Skidpad Cornering Conditions</div>
              <div>
                <div className="flex justify-between text-xs font-mono mb-1">
                  <span className="text-[var(--muted)]">Cornering Speed:</span>
                  <span className="text-[var(--text)] font-bold">{skidpadSpeed.toFixed(1)} m/s</span>
                </div>
                <input
                  type="range"
                  min="1.0"
                  max="6.0"
                  step="0.1"
                  value={skidpadSpeed}
                  onChange={(e) => setSkidpadSpeed(parseFloat(e.target.value))}
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-mono mb-1">
                  <span className="text-[var(--muted)]">Turn Radius:</span>
                  <span className="text-[var(--text)] font-bold">{turnRadius.toFixed(1)} m</span>
                </div>
                <input
                  type="range"
                  min="0.8"
                  max="4.0"
                  step="0.1"
                  value={turnRadius}
                  onChange={(e) => setTurnRadius(parseFloat(e.target.value))}
                />
              </div>

              <div>
                <span className="text-[10px] font-mono text-[var(--muted)] block mb-1">Surface Carpet / Slick Material:</span>
                <div className="grid grid-cols-3 gap-1.5 text-xs font-mono">
                  {[
                    { label: 'Carpet', mu: 1.15 },
                    { label: 'Plate', mu: 0.28 },
                    { label: 'Ice', mu: 0.06 },
                  ].map((s) => (
                    <button
                      key={s.label}
                      onClick={() => setSurfaceMu(s.mu)}
                      className={`p-2 rounded-lg border text-center transition ${
                        Math.abs(surfaceMu - s.mu) < 0.01
                          ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-white font-bold'
                          : 'border-[var(--border)] bg-[var(--bg)] text-[var(--muted)]'
                      }`}
                    >
                      <div>{s.label}</div>
                      <div className="text-[10px] text-[var(--muted)]">μ={s.mu}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="lg:col-span-2 rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5 flex flex-col justify-between">
              <div className="section-header">Friction Circle & Lateral G-Force Analysis</div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="p-3 rounded-xl bg-[var(--bg)] border border-[var(--border)]">
                  <div className="text-[10px] font-mono text-[var(--muted)]">Lateral G-Force</div>
                  <div className="text-xl font-bold font-mono text-cyan-400 mt-1">{skidpadMetrics.lateralG.toFixed(2)} G</div>
                </div>
                <div className="p-3 rounded-xl bg-[var(--bg)] border border-[var(--border)]">
                  <div className="text-[10px] font-mono text-[var(--muted)]">Traction Limit</div>
                  <div className="text-xl font-bold font-mono text-emerald-400 mt-1">{(skidpadMetrics.maxLateralAcc / 9.81).toFixed(2)} G</div>
                </div>
                <div className="p-3 rounded-xl bg-[var(--bg)] border border-[var(--border)]">
                  <div className="text-[10px] font-mono text-[var(--muted)]">Wheel Drift Angle</div>
                  <div className="text-xl font-bold font-mono text-amber-400 mt-1">{skidpadMetrics.slipAngleDeg.toFixed(1)}°</div>
                </div>
                <div className="p-3 rounded-xl bg-[var(--bg)] border border-[var(--border)]">
                  <div className="text-[10px] font-mono text-[var(--muted)]">Chassis State</div>
                  <div className={`text-sm font-bold font-mono mt-1 ${skidpadMetrics.isDrifting ? 'text-rose-400 animate-pulse' : 'text-emerald-400'}`}>
                    {skidpadMetrics.isDrifting ? '⚡ BREAKING TRACTION (DRIFT)' : '✓ FULL TRACTION (GRIP)'}
                  </div>
                </div>
              </div>

              {/* Friction Circle Visualizer */}
              <div className="h-48 border border-[var(--border)] rounded-xl bg-black/60 flex items-center justify-center relative">
                <svg width="180" height="180" viewBox="-90 -90 180 180">
                  {/* Outer Traction Limit Circle */}
                  <circle r="75" fill="none" stroke="var(--border)" strokeWidth="1" strokeDasharray="3 3" />
                  <circle
                    r={Math.min(75, 75 * (skidpadMetrics.maxLateralAcc / (1.5 * 9.81)))}
                    fill="rgba(52, 211, 153, 0.08)"
                    stroke="#34D399"
                    strokeWidth="1.5"
                  />
                  {/* Crosshairs */}
                  <line x1="-80" y1="0" x2="80" y2="0" stroke="rgba(255,255,255,0.1)" />
                  <line x1="0" y1="-80" x2="0" y2="80" stroke="rgba(255,255,255,0.1)" />

                  {/* Active G-Force Vector */}
                  <circle
                    cx={Math.min(80, (skidpadMetrics.lateralG / 1.5) * 75)}
                    cy="0"
                    r="8"
                    fill={skidpadMetrics.isDrifting ? '#F43F5E' : '#22D3EE'}
                    stroke="#FFFFFF"
                    strokeWidth="1.5"
                  />
                </svg>
                <div className="absolute bottom-2 left-3 text-[10px] font-mono text-[var(--muted)]">
                  Friction Circle: Green circle = Tire Limit. Dot = Demanded Cornering Force.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── LAB 3: ELEVATOR TIP-OVER RISK ────────────────────────────────── */}
        {activeLab === 'tipover' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5 space-y-4">
              <div className="section-header">Elevator & Dynamic Braking</div>
              <div>
                <div className="flex justify-between text-xs font-mono mb-1">
                  <span className="text-[var(--muted)]">Elevator Carriage Extension:</span>
                  <span className="text-[var(--text)] font-bold">{elevatorExtension.toFixed(2)} m</span>
                </div>
                <input
                  type="range"
                  min="0.0"
                  max="1.1"
                  step="0.05"
                  value={elevatorExtension}
                  onChange={(e) => setElevatorExtension(parseFloat(e.target.value))}
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-mono mb-1">
                  <span className="text-[var(--muted)]">Emergency Stop Deceleration:</span>
                  <span className="text-[var(--text)] font-bold">{brakingDecel.toFixed(1)} m/s²</span>
                </div>
                <input
                  type="range"
                  min="3.0"
                  max="16.0"
                  step="0.5"
                  value={brakingDecel}
                  onChange={(e) => setBrakingDecel(parseFloat(e.target.value))}
                />
              </div>

              <div className="p-4 rounded-xl bg-[var(--bg)] border border-[var(--border)] space-y-2 text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-[var(--muted)]">Chassis Center of Mass (Z):</span>
                  <span className="text-[var(--accent-lite)] font-bold">{tipOverMetrics.totalComZ.toFixed(2)} m</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--muted)]">Tip-Over Threshold Decel:</span>
                  <span className="text-[var(--text)] font-bold">{tipOverMetrics.tipThresholdDecel.toFixed(1)} m/s²</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-[var(--border)]">
                  <span className="text-[var(--muted)]">Rollover Stability Margin:</span>
                  <span className={`font-bold ${tipOverMetrics.isTipping ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {tipOverMetrics.isTipping ? '⚠️ DANGER: ROBOT WILL ROLL OVER' : `${tipOverMetrics.stabilityMarginPercent.toFixed(1)}% SAFE`}
                  </span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-2 rounded-2xl border border-[var(--border)] bg-black/60 p-5 flex flex-col justify-between">
              <div className="section-header">Dynamic Side-Profile Free Body Diagram</div>
              <div className="h-64 border border-[var(--border)] rounded-xl bg-[var(--bg)] flex items-center justify-center relative">
                <svg width="300" height="220" viewBox="0 0 300 220">
                  {/* Ground */}
                  <line x1="20" y1="190" x2="280" y2="190" stroke="var(--border)" strokeWidth="3" />

                  {/* Robot Base Wheels */}
                  <circle cx="90" cy="180" r="12" fill="#334155" />
                  <circle cx="210" cy="180" r="12" fill="#334155" />
                  <rect x="70" y="150" width="160" height="26" fill="#1E293B" rx="4" />

                  {/* Elevator Mast */}
                  <rect x="140" y={150 - elevatorExtension * 100} width="20" height={elevatorExtension * 100} fill="#3B82F6" opacity="0.6" />
                  {/* Carriage Weight */}
                  <circle cx="150" cy={150 - elevatorExtension * 100} r="14" fill="#60A5FA" />

                  {/* Total CoM Marker */}
                  <g transform={`translate(150, ${180 - tipOverMetrics.totalComZ * 120})`}>
                    <circle r="8" fill="#F43F5E" />
                    <line x1="-12" y1="0" x2="12" y2="0" stroke="#FFFFFF" strokeWidth="1.5" />
                    <line x1="0" y1="-12" x2="0" y2="12" stroke="#FFFFFF" strokeWidth="1.5" />
                  </g>
                </svg>
                <div className="absolute top-3 right-3 text-xs font-mono">
                  <span className="text-rose-400 font-bold">● Total CoM: {tipOverMetrics.totalComZ.toFixed(2)}m</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── LAB 4: MOTOR DYNO & THERMAL BURNOUT ──────────────────────────── */}
        {activeLab === 'motordyno' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5 space-y-4">
              <div className="section-header">Dyno Dynamometer Load</div>
              <div>
                <span className="text-[10px] font-mono text-[var(--muted)] block mb-1">Select Brushless Stator:</span>
                <div className="grid grid-cols-3 gap-1.5 text-xs font-mono">
                  {(['kraken', 'falcon', 'neo'] as const).map((m) => (
                    <button
                      key={m}
                      onClick={() => setSelectedMotor(m)}
                      className={`p-2 rounded-lg border text-center uppercase transition ${
                        selectedMotor === m
                          ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-white font-bold'
                          : 'border-[var(--border)] bg-[var(--bg)] text-[var(--muted)]'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-mono mb-1">
                  <span className="text-[var(--muted)]">Applied Mechanical Load:</span>
                  <span className="text-[var(--text)] font-bold">{appliedTorque.toFixed(2)} N·m</span>
                </div>
                <input
                  type="range"
                  min="0.2"
                  max="6.0"
                  step="0.1"
                  value={appliedTorque}
                  onChange={(e) => setAppliedTorque(parseFloat(e.target.value))}
                />
              </div>

              <div className="p-4 rounded-xl bg-[var(--bg)] border border-[var(--border)] space-y-2 text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-[var(--muted)]">Operating Speed:</span>
                  <span className="text-cyan-400 font-bold">{motorData.operatingRpm.toFixed(0)} RPM</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--muted)]">Current Draw:</span>
                  <span className="text-amber-400 font-bold">{motorData.currentDraw.toFixed(1)} A</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--muted)]">Mechanical Power:</span>
                  <span className="text-emerald-400 font-bold">{motorData.mechanicalPowerW.toFixed(0)} W</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--muted)]">Heat Dissipation (I²R):</span>
                  <span className="text-rose-400 font-bold">{motorData.heatLossW.toFixed(0)} W</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-2 rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5 flex flex-col justify-between">
              <div className="section-header">Motor Performance Curves & Breaker Trip Estimation</div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="p-3 rounded-xl bg-[var(--bg)] border border-[var(--border)]">
                  <div className="text-[10px] font-mono text-[var(--muted)]">Efficiency</div>
                  <div className="text-xl font-bold font-mono text-emerald-400 mt-1">{motorData.efficiencyPercent.toFixed(1)}%</div>
                </div>
                <div className="p-3 rounded-xl bg-[var(--bg)] border border-[var(--border)]">
                  <div className="text-[10px] font-mono text-[var(--muted)]">Stall Torque</div>
                  <div className="text-xl font-bold font-mono text-cyan-400 mt-1">{motorData.stallTorque} N·m</div>
                </div>
                <div className="p-3 rounded-xl bg-[var(--bg)] border border-[var(--border)]">
                  <div className="text-[10px] font-mono text-[var(--muted)]">Stall Current</div>
                  <div className="text-xl font-bold font-mono text-rose-400 mt-1">{motorData.stallCurrent} A</div>
                </div>
                <div className="p-3 rounded-xl bg-[var(--bg)] border border-[var(--border)]">
                  <div className="text-[10px] font-mono text-[var(--muted)]">40A Breaker Trip</div>
                  <div className={`text-sm font-bold font-mono mt-1 ${motorData.breakerTripTimeSec < 60 ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {motorData.breakerTripTimeSec > 300 ? 'SAFE INDEFINITELY' : `TRIP IN ${motorData.breakerTripTimeSec.toFixed(1)}s`}
                  </div>
                </div>
              </div>

              {/* Progress bar of current load vs stall */}
              <div className="p-4 rounded-xl bg-[var(--bg)] border border-[var(--border)] space-y-2">
                <div className="flex justify-between text-xs font-mono">
                  <span>TORQUE LOADING CAPACITY</span>
                  <span className="text-[var(--accent-lite)]">{((appliedTorque / motorData.stallTorque) * 100).toFixed(0)}%</span>
                </div>
                <div className="h-3 w-full bg-black/40 rounded-full overflow-hidden p-0.5 border border-[var(--border)]">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${Math.min(100, (appliedTorque / motorData.stallTorque) * 100)}%`,
                      background: appliedTorque / motorData.stallTorque > 0.8 ? 'var(--danger)' : 'var(--accent)',
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
