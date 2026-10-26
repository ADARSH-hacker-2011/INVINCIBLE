import { useState, useRef, useCallback } from 'react'
import {
  FlaskConical,
  TrendingUp,
  Flame,
  Battery,
  Zap,
  GitBranch,
  Play,
  Square,
  Download,
  Upload,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react'
import { useSim } from '../store'
import { MonteCarloRunner } from './MonteCarloRunner'

// ─── Types ──────────────────────────────────────────────────────────────────

type ExpId = 'montecarlo' | 'sysid' | 'thermal' | 'battery' | 'chaos' | 'path'
type ExpStatus = 'ready' | 'running' | 'complete' | 'error'

interface SysIdResult {
  kS: number; kV: number; kA: number; r2: number
}

interface ThermalPoint { t: number; temp: number }

interface BatteryPoint { t: number; voltage: number }

interface PathPoint { x: number; y: number }

// ─── SysId OLS Regression ───────────────────────────────────────────────────

function fitSysId(voltage: number[], velocity: number[], acceleration: number[]): SysIdResult {
  const n = voltage.length
  // Design matrix: [sign(v), v, a]
  // V = kS*sign(v) + kV*v + kA*a  →  X @ [kS,kV,kA]' = V
  let A00=0,A01=0,A02=0,A11=0,A12=0,A22=0,b0=0,b1=0,b2=0
  for (let i = 0; i < n; i++) {
    const s = Math.sign(velocity[i])
    const v = velocity[i]
    const a = acceleration[i]
    const V = voltage[i]
    A00 += s*s; A01 += s*v; A02 += s*a
    A11 += v*v; A12 += v*a; A22 += a*a
    b0 += s*V; b1 += v*V; b2 += a*V
  }
  // Solve 3×3 normal equations via Cramer's rule (simplified)
  const det = A00*(A11*A22-A12*A12) - A01*(A01*A22-A12*A02) + A02*(A01*A12-A11*A02)
  if (Math.abs(det) < 1e-12) return { kS: 0, kV: 0, kA: 0, r2: 0 }
  const kS = (b0*(A11*A22-A12*A12) - A01*(b1*A22-A12*b2) + A02*(b1*A12-A11*b2)) / det
  const kV = (A00*(b1*A22-A12*b2) - b0*(A01*A22-A12*A02) + A02*(A01*b2-b1*A02)) / det
  const kA = (A00*(A11*b2-b1*A12) - A01*(A01*b2-b1*A02) + b0*(A01*A12-A11*A02)) / det

  // R²
  const vMean = voltage.reduce((a,b)=>a+b,0)/n
  let ssTot=0,ssRes=0
  for (let i=0;i<n;i++) {
    const pred = kS*Math.sign(velocity[i]) + kV*velocity[i] + kA*acceleration[i]
    ssTot += (voltage[i]-vMean)**2
    ssRes += (voltage[i]-pred)**2
  }
  const r2 = ssTot > 0 ? Math.max(0, 1 - ssRes/ssTot) : 0
  return { kS, kV, kA, r2 }
}

function runSysId(robotMass: number, motorForce: number, maxSpeed: number): SysIdResult {
  const dt = 0.02
  const vMax = maxSpeed
  // Motor gain: F = motorForce * (V/12)
  const motorGain = motorForce / 12

  const voltArr: number[] = []
  const velArr: number[] = []
  const accArr: number[] = []

  // Quasistatic: ramp voltage 0→10V at 0.25V/s
  let vel = 0
  for (let step = 0; step < 2000; step++) {
    const V = Math.min(10, step * dt * 0.25)
    const F = motorGain * V
    const friction = 0.3 * motorForce / 12 // kS equivalent
    const netF = V > 0.1 ? F - friction : 0
    const acc = netF / robotMass
    vel = Math.min(vel + acc * dt, vMax)
    if (vel > 0.05 && V > 0.5) {
      voltArr.push(V)
      velArr.push(vel)
      accArr.push(acc)
    }
  }
  // Dynamic: step 7V for 2s
  vel = 0
  let prevVel = 0
  for (let step = 0; step < 100; step++) {
    const V = 7
    const F = motorGain * V
    const friction = 0.3 * motorForce / 12
    const acc = (F - friction) / robotMass
    vel = Math.min(vel + acc * dt, vMax)
    if (step > 2) {
      const measuredAcc = (vel - prevVel) / dt
      voltArr.push(V)
      velArr.push(vel)
      accArr.push(measuredAcc)
    }
    prevVel = vel
  }

  return fitSysId(voltArr, velArr, accArr)
}

// ─── Thermal ODE Simulation ──────────────────────────────────────────────────

function runThermalStress(motorForce: number): { points: ThermalPoint[]; foldbackTime: number; peakTemp: number } {
  // dT/dt = (I²·R₀·[1+α·(T-25)] - k_cool·(T-T_amb)) / C_thermal
  // Kraken X60: C=180 J/K, R₀=0.027Ω, α_Cu=0.00393, k_cool=2.5 W/K
  const C = 180, R0 = 0.027, alpha = 0.00393, k_cool = 2.5, T_amb = 25
  // Current: motor at ~85% stall
  const I = (motorForce / 12) * 0.85 / 0.9 // simplified: F=Kt*I*gearRatio
  const dt = 0.005 // 200Hz
  let T = T_amb
  let time = 0
  let foldbackTime = -1
  const points: ThermalPoint[] = []

  while (time < 60 && T < 140) {
    const R_eff = R0 * (1 + alpha * (T - 25))
    const Q_in = I * I * R_eff
    const Q_out = k_cool * (T - T_amb)
    T += ((Q_in - Q_out) / C) * dt
    time += dt
    if (time % 0.5 < dt * 1.5) points.push({ t: time, temp: T })
    if (T >= 125 && foldbackTime < 0) foldbackTime = time
  }
  return { points, foldbackTime: foldbackTime < 0 ? 60 : foldbackTime, peakTemp: T }
}

// ─── Battery Drain Simulation ────────────────────────────────────────────────

function runBatteryProfile(motorForce: number, maxSpeed: number): { points: BatteryPoint[]; minV: number; brownouts: number } {
  const Vnom = 12.6, R_int = 0.015
  const dt = 0.5 // sample every 0.5s
  const totalTime = 150 // 150s match
  const points: BatteryPoint[] = []
  let brownouts = 0
  let minV = Vnom

  for (let t = 0; t <= totalTime; t += dt) {
    // Drive profile: sprint/coast cycle
    const phase = Math.floor(t / 10) % 3
    const velocityFraction = phase === 0 ? 0.85 : phase === 1 ? 0.4 : 0.0
    const vel = velocityFraction * maxSpeed
    // P = F*v (mechanical), electrical P = P_mech / η
    const P_mech = (motorForce / 4) * vel // per-motor
    const P_elec = P_mech / 0.85 // η=0.85
    const I_draw = P_elec / Vnom
    const V_term = Math.max(6.0, Vnom - I_draw * R_int)
    if (V_term < 6.8) brownouts++
    if (V_term < minV) minV = V_term
    points.push({ t, voltage: V_term })
  }
  return { points, minV, brownouts }
}

// ─── Chaos Monkey ────────────────────────────────────────────────────────────

function runChaosMonkey(robotMass: number, mu: number, motorForce: number): { successRate: number; degradation: number } {
  // Run 100 trials with random fault injection each
  const trials = 100
  let chaosSuccess = 0
  let baselineSuccess = 0

  for (let i = 0; i < trials; i++) {
    const seed = i * 7919 + 13
    const rand = (s: number) => { const x = Math.sin(s) * 43758.5453; return x - Math.floor(x) }

    // Baseline trial
    {
      const mass = robotMass
      const friction = mu
      const force = motorForce
      const traction = friction * mass * 9.81
      const acc = Math.min(force, traction) / mass
      const score = acc > 3 ? 1 : 0
      if (score) baselineSuccess++
    }

    // Chaos trial: fault injection
    {
      const r1 = rand(seed)
      const r2 = rand(seed + 1)
      const r3 = rand(seed + 2)
      const mass = robotMass * (0.85 + r1 * 0.30) // ±15% mass noise
      const friction = mu * (0.5 + r2 * 0.5)       // 50-100% friction
      const force = motorForce * (0.5 + r3 * 0.5)  // one module cut
      const traction = friction * mass * 9.81
      const acc = Math.min(force, traction) / mass
      const score = acc > 2 ? 1 : 0 // lower threshold (degraded)
      if (score) chaosSuccess++
    }
  }

  const base = (baselineSuccess / trials) * 100
  const chaos = (chaosSuccess / trials) * 100
  return {
    successRate: chaos,
    degradation: base > 0 ? Math.max(0, ((base - chaos) / base) * 100) : 0,
  }
}

// ─── Experiment Card Component ───────────────────────────────────────────────

interface ExpCard {
  id: ExpId
  icon: React.ReactNode
  title: string
  subtitle: string
  iconBg: string
  iconColor: string
  accentColor: string
}

const CARDS: ExpCard[] = [
  { id: 'montecarlo', icon: <FlaskConical size={22} />, title: 'Monte Carlo', subtitle: '200 randomized trials', iconBg: 'rgba(52,211,153,0.15)', iconColor: '#34D399', accentColor: '#34D399' },
  { id: 'sysid',      icon: <TrendingUp  size={22} />, title: 'SysId Characterize', subtitle: 'kS / kV / kA regression', iconBg: 'rgba(59,130,246,0.15)', iconColor: '#60A5FA', accentColor: '#3B82F6' },
  { id: 'thermal',    icon: <Flame       size={22} />, title: 'Thermal Stress', subtitle: 'Motor temp ODE to 125°C', iconBg: 'rgba(249,115,22,0.15)', iconColor: '#FB923C', accentColor: '#F97316' },
  { id: 'battery',    icon: <Battery     size={22} />, title: 'Battery Profile', subtitle: '150 s match drain curve', iconBg: 'rgba(234,179,8,0.15)', iconColor: '#FCD34D', accentColor: '#EAB308' },
  { id: 'chaos',      icon: <Zap         size={22} />, title: 'Chaos Monkey', subtitle: 'Fault injection · recovery', iconBg: 'rgba(251,113,133,0.15)', iconColor: '#FB7185', accentColor: '#F43F5E' },
  { id: 'path',       icon: <GitBranch   size={22} />, title: 'Path Analyzer', subtitle: 'Import .path / deviation', iconBg: 'rgba(168,85,247,0.15)', iconColor: '#C084FC', accentColor: '#A855F7' },
]

// ─── SVG Line Chart helper ───────────────────────────────────────────────────

function LineChart({ points, yMin, yMax, color, label, unit, width = 280, height = 80 }: {
  points: {x: number, y: number}[], yMin: number, yMax: number, color: string,
  label: string, unit: string, width?: number, height?: number
}) {
  if (points.length < 2) return null
  const xMin = points[0].x, xMax = points[points.length - 1].x
  const px = (x: number) => ((x - xMin) / (xMax - xMin)) * (width - 4) + 2
  const py = (y: number) => height - ((y - yMin) / (yMax - yMin + 0.001)) * (height - 4) - 2
  const d = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${px(p.x).toFixed(1)} ${py(p.y).toFixed(1)}`).join(' ')
  return (
    <div style={{ fontFamily: 'JetBrains Mono, monospace' }}>
      <div style={{ fontSize: 9, color: 'var(--muted)', marginBottom: 2 }}>{label}</div>
      <svg width={width} height={height} style={{ display: 'block', borderRadius: 6, background: 'var(--bg)' }}>
        {/* Grid lines */}
        {[0.25, 0.5, 0.75].map(f => (
          <line key={f} x1={2} x2={width-2} y1={height * f} y2={height * f}
            stroke="var(--border)" strokeWidth={0.5} strokeDasharray="3 3" />
        ))}
        <path d={d} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
        {/* Y labels */}
        <text x={3} y={10} fill="var(--faint)" fontSize={7}>{yMax.toFixed(1)}{unit}</text>
        <text x={3} y={height - 3} fill="var(--faint)" fontSize={7}>{yMin.toFixed(1)}{unit}</text>
      </svg>
    </div>
  )
}

// ─── Main ExperimentsBanner ──────────────────────────────────────────────────

export function ExperimentsBanner() {
  const { robotMass, motorForce, maxSpeed, mu } = useSim()
  const [activeExp, setActiveExp] = useState<ExpId | null>(null)
  const [statuses, setStatuses] = useState<Record<ExpId, ExpStatus>>({
    montecarlo: 'ready', sysid: 'ready', thermal: 'ready',
    battery: 'ready', chaos: 'ready', path: 'ready',
  })

  // Results
  const [sysIdResult, setSysIdResult] = useState<SysIdResult | null>(null)
  const [thermalPoints, setThermalPoints] = useState<ThermalPoint[]>([])
  const [thermalFoldback, setThermalFoldback] = useState(0)
  const [battPoints, setBattPoints] = useState<BatteryPoint[]>([])
  const [battMin, setBattMin] = useState(12.6)
  const [battBrownouts, setBattBrownouts] = useState(0)
  const [chaosResult, setChaosResult] = useState<{successRate:number;degradation:number}|null>(null)
  const [pathDeviation, setPathDeviation] = useState<{maxDev:number;avgDev:number}|null>(null)
  const [pathIdeal, setPathIdeal] = useState<PathPoint[]>([])
  const [pathSim, setPathSim] = useState<PathPoint[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const setStatus = (id: ExpId, s: ExpStatus) =>
    setStatuses(prev => ({ ...prev, [id]: s }))

  const runExp = useCallback((id: ExpId) => {
    setActiveExp(id)
    if (id === 'montecarlo') return // MonteCarloRunner handles its own run logic

    setStatus(id, 'running')

    // Offload to macrotask so UI can show "running"
    setTimeout(() => {
      try {
        if (id === 'sysid') {
          const r = runSysId(robotMass, motorForce, maxSpeed)
          setSysIdResult(r)
          setStatus('sysid', 'complete')
        } else if (id === 'thermal') {
          const r = runThermalStress(motorForce)
          setThermalPoints(r.points)
          setThermalFoldback(r.foldbackTime)
          setStatus('thermal', 'complete')
        } else if (id === 'battery') {
          const r = runBatteryProfile(motorForce, maxSpeed)
          setBattPoints(r.points)
          setBattMin(r.minV)
          setBattBrownouts(r.brownouts)
          setStatus('battery', 'complete')
        } else if (id === 'chaos') {
          const r = runChaosMonkey(robotMass, mu, motorForce)
          setChaosResult(r)
          setStatus('chaos', 'complete')
        }
      } catch {
        setStatus(id, 'error')
      }
    }, 50)
  }, [robotMass, motorForce, maxSpeed, mu])

  const handlePathFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setStatus('path', 'running')
    setActiveExp('path')
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const json = JSON.parse(ev.target?.result as string)
        // Support PathPlanner .path format
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const states: any[] = json.trajectory?.states ?? json.waypoints ?? []
        if (states.length < 2) throw new Error('No trajectory states found')

        const ideal: PathPoint[] = states.map((s) => ({
          x: s.pose?.translation?.x ?? s.x ?? 0,
          y: s.pose?.translation?.y ?? s.y ?? 0,
        }))
        // Simulate tracking with P-controller (kP=3)
        const sim: PathPoint[] = [{ ...ideal[0] }]
        let px = ideal[0].x, py = ideal[0].y
        for (let i = 1; i < ideal.length; i++) {
          const ex = ideal[i].x - px, ey = ideal[i].y - py
          px += ex * 0.85 + (Math.random() - 0.5) * 0.04
          py += ey * 0.85 + (Math.random() - 0.5) * 0.04
          sim.push({ x: px, y: py })
        }
        // Compute deviation
        let totalDev = 0, maxDev = 0
        for (let i = 0; i < ideal.length; i++) {
          const d = Math.hypot(sim[i].x - ideal[i].x, sim[i].y - ideal[i].y)
          if (d > maxDev) maxDev = d
          totalDev += d
        }
        setPathIdeal(ideal)
        setPathSim(sim)
        setPathDeviation({ maxDev, avgDev: totalDev / ideal.length })
        setStatus('path', 'complete')
      } catch {
        setStatus('path', 'error')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }, [])

  const badgeClass = (id: ExpId) => {
    const s = statuses[id]
    if (s === 'ready')    return 'badge badge-ready'
    if (s === 'running')  return 'badge badge-running'
    if (s === 'complete') return 'badge badge-complete'
    return 'badge badge-error'
  }
  const badgeLabel = (id: ExpId) => {
    const s = statuses[id]
    if (s === 'running') return '⟳ RUNNING'
    if (s === 'complete') return '✓ COMPLETE'
    if (s === 'error') return '✗ ERROR'
    return '● READY'
  }

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background: 'var(--bg)' }}>
      <div className="flex-1 overflow-y-auto p-5">
        {/* ── Hero Banner ───────────────────────────────────────────────── */}
        <div className="hero-banner p-6 mb-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="gradient-text-brand text-2xl font-black tracking-tight mb-1">
                🧪 EXPERIMENT LAB
              </div>
              <p style={{ color: 'var(--muted)', fontSize: 13 }}>
                Stress-test your robot against randomized match scenarios using deterministic physics.
              </p>
            </div>
            {/* Stat chips from last completed runs */}
            <div className="flex gap-3 flex-wrap justify-end" style={{ fontSize: 11 }}>
              {sysIdResult && (
                <div style={{ background: 'var(--accent-soft)', border: '1px solid var(--border-bright)', borderRadius: 8, padding: '6px 12px', fontFamily: 'monospace' }}>
                  <span style={{ color: 'var(--muted)' }}>kV:</span>{' '}
                  <span style={{ color: 'var(--accent-lite)', fontWeight: 700 }}>{sysIdResult.kV.toFixed(3)}</span>
                </div>
              )}
              {battPoints.length > 0 && (
                <div style={{ background: 'var(--accent-soft)', border: '1px solid var(--border-bright)', borderRadius: 8, padding: '6px 12px', fontFamily: 'monospace' }}>
                  <span style={{ color: 'var(--muted)' }}>Min V:</span>{' '}
                  <span style={{ color: battMin < 8 ? 'var(--danger)' : 'var(--success)', fontWeight: 700 }}>{battMin.toFixed(2)}V</span>
                </div>
              )}
              {thermalFoldback > 0 && thermalPoints.length > 0 && (
                <div style={{ background: 'var(--accent-soft)', border: '1px solid var(--border-bright)', borderRadius: 8, padding: '6px 12px', fontFamily: 'monospace' }}>
                  <span style={{ color: 'var(--muted)' }}>Foldback:</span>{' '}
                  <span style={{ color: 'var(--warning)', fontWeight: 700 }}>{thermalFoldback.toFixed(1)}s</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── 6-Card Grid ───────────────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 16 }}>
          {CARDS.map((card) => (
            <div
              key={card.id}
              className={`exp-card${activeExp === card.id ? ' active' : ''}`}
              onClick={() => { if (card.id !== 'path') runExp(card.id) }}
              style={{ borderColor: activeExp === card.id ? card.accentColor : undefined, cursor: card.id === 'path' ? 'default' : 'pointer' }}
            >
              {/* Icon + badge */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 10,
                  background: card.iconBg, color: card.iconColor,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  {card.icon}
                </div>
                <span className={badgeClass(card.id)}>{badgeLabel(card.id)}</span>
              </div>

              {/* Title + desc */}
              <div>
                <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text)' }}>{card.title}</div>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{card.subtitle}</div>
              </div>

              {/* Action button */}
              {card.id === 'path' ? (
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click() }}
                    className="btn-glow"
                    style={{ flex: 1, borderRadius: 8, padding: '7px 0', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                  >
                    <Upload size={12} /> IMPORT .PATH
                  </button>
                  <input ref={fileInputRef} type="file" accept=".path,.auto,.json" style={{ display: 'none' }} onChange={handlePathFile} />
                </div>
              ) : (
                <button
                  onClick={(e) => { e.stopPropagation(); runExp(card.id) }}
                  disabled={statuses[card.id] === 'running'}
                  className="btn-glow"
                  style={{
                    width: '100%', borderRadius: 8, padding: '7px 0',
                    fontSize: 11, fontWeight: 700,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    opacity: statuses[card.id] === 'running' ? 0.6 : 1,
                  }}
                >
                  {statuses[card.id] === 'running' ? <Square size={12} /> : <Play size={12} />}
                  {statuses[card.id] === 'running' ? 'RUNNING…' : 'RUN EXPERIMENT'}
                </button>
              )}
            </div>
          ))}
        </div>

        {/* ── Expanded Results Panel ─────────────────────────────────────── */}
        {activeExp && (
          <div style={{
            background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: 16,
            padding: 20, marginTop: 4,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h3 style={{ fontWeight: 800, fontSize: 14, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 8 }}>
                {CARDS.find(c => c.id === activeExp)?.icon}
                {CARDS.find(c => c.id === activeExp)?.title} — Results
              </h3>
              <button onClick={() => setActiveExp(null)} style={{ color: 'var(--muted)', fontSize: 12, background: 'none', border: 'none', cursor: 'pointer' }}>
                ✕ Close
              </button>
            </div>

            {/* MONTE CARLO */}
            {activeExp === 'montecarlo' && <MonteCarloRunner />}

            {/* SYSID */}
            {activeExp === 'sysid' && (
              <div>
                {statuses.sysid === 'running' && (
                  <p style={{ color: 'var(--muted)', fontSize: 12 }}>⟳ Running quasistatic + dynamic sweep…</p>
                )}
                {sysIdResult && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                    {[
                      { label: 'kS (static friction)', value: sysIdResult.kS.toFixed(4), unit: 'V', color: '#60A5FA' },
                      { label: 'kV (velocity gain)', value: sysIdResult.kV.toFixed(4), unit: 'V/(m/s)', color: '#34D399' },
                      { label: 'kA (accel gain)', value: sysIdResult.kA.toFixed(4), unit: 'V/(m/s²)', color: '#FB923C' },
                      { label: 'R² fit quality', value: (sysIdResult.r2 * 100).toFixed(1), unit: '%', color: sysIdResult.r2 > 0.95 ? '#34D399' : '#FBBF24' },
                    ].map(s => (
                      <div key={s.label} style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 14px' }}>
                        <div style={{ fontSize: 10, color: 'var(--muted)', marginBottom: 4 }}>{s.label}</div>
                        <div style={{ fontSize: 22, fontWeight: 800, color: s.color, fontFamily: 'monospace' }}>{s.value}</div>
                        <div style={{ fontSize: 10, color: 'var(--faint)' }}>{s.unit}</div>
                      </div>
                    ))}
                  </div>
                )}
                {sysIdResult && (
                  <div style={{ marginTop: 12, fontSize: 11, color: 'var(--muted)', fontFamily: 'monospace', background: 'var(--bg)', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border)' }}>
                    WPILib feedforward: <span style={{ color: 'var(--accent-lite)' }}>new SimpleMotorFeedforward({sysIdResult.kS.toFixed(4)}, {sysIdResult.kV.toFixed(4)}, {sysIdResult.kA.toFixed(4)})</span>
                  </div>
                )}
                {sysIdResult && (
                  <div style={{ display: 'flex', gap: 6, marginTop: 8, fontSize: 11, alignItems: 'center', color: sysIdResult.r2 > 0.95 ? 'var(--success)' : 'var(--warning)' }}>
                    {sysIdResult.r2 > 0.95 ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
                    {sysIdResult.r2 > 0.95 ? 'Excellent model fit — ready to deploy.' : 'Moderate fit — check motor stall or slip conditions.'}
                  </div>
                )}
              </div>
            )}

            {/* THERMAL */}
            {activeExp === 'thermal' && (
              <div>
                {statuses.thermal === 'running' && <p style={{ color: 'var(--muted)', fontSize: 12 }}>⟳ Integrating thermal ODE at 200Hz…</p>}
                {thermalPoints.length > 0 && (
                  <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', gap: 12 }}>
                      {[
                        { label: 'Foldback at', value: thermalFoldback.toFixed(1), unit: 's', color: '#FBBF24' },
                        { label: 'Peak temp', value: thermalPoints[thermalPoints.length-1].temp.toFixed(1), unit: '°C', color: '#FB7185' },
                      ].map(s => (
                        <div key={s.label} style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 14px', minWidth: 100 }}>
                          <div style={{ fontSize: 10, color: 'var(--muted)', marginBottom: 4 }}>{s.label}</div>
                          <div style={{ fontSize: 22, fontWeight: 800, color: s.color, fontFamily: 'monospace' }}>{s.value}</div>
                          <div style={{ fontSize: 10, color: 'var(--faint)' }}>{s.unit}</div>
                        </div>
                      ))}
                    </div>
                    <LineChart
                      points={thermalPoints.map(p => ({ x: p.t, y: p.temp }))}
                      yMin={25} yMax={Math.max(130, thermalPoints[thermalPoints.length-1]?.temp ?? 130)}
                      color="#FB923C" label="Motor Temperature vs Time" unit="°C"
                      width={340} height={100}
                    />
                  </div>
                )}
              </div>
            )}

            {/* BATTERY */}
            {activeExp === 'battery' && (
              <div>
                {statuses.battery === 'running' && <p style={{ color: 'var(--muted)', fontSize: 12 }}>⟳ Simulating 150s match draw…</p>}
                {battPoints.length > 0 && (
                  <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', gap: 12 }}>
                      {[
                        { label: 'Min terminal V', value: battMin.toFixed(2), unit: 'V', color: battMin < 8 ? '#FB7185' : '#34D399' },
                        { label: 'Brownout events', value: String(battBrownouts), unit: '< 6.8V', color: battBrownouts > 0 ? '#FB7185' : '#34D399' },
                      ].map(s => (
                        <div key={s.label} style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 14px', minWidth: 100 }}>
                          <div style={{ fontSize: 10, color: 'var(--muted)', marginBottom: 4 }}>{s.label}</div>
                          <div style={{ fontSize: 22, fontWeight: 800, color: s.color, fontFamily: 'monospace' }}>{s.value}</div>
                          <div style={{ fontSize: 10, color: 'var(--faint)' }}>{s.unit}</div>
                        </div>
                      ))}
                    </div>
                    <LineChart
                      points={battPoints.map(p => ({ x: p.t, y: p.voltage }))}
                      yMin={Math.min(6.0, battMin - 0.2)} yMax={12.8}
                      color="#FCD34D" label="Battery Terminal Voltage vs Match Time" unit="V"
                      width={360} height={100}
                    />
                  </div>
                )}
              </div>
            )}

            {/* CHAOS MONKEY */}
            {activeExp === 'chaos' && (
              <div>
                {statuses.chaos === 'running' && <p style={{ color: 'var(--muted)', fontSize: 12 }}>⟳ Injecting faults across 100 trials…</p>}
                {chaosResult && (
                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    {[
                      { label: 'Success rate under chaos', value: chaosResult.successRate.toFixed(1), unit: '%', color: chaosResult.successRate > 70 ? '#34D399' : '#FB7185' },
                      { label: 'Performance degradation', value: chaosResult.degradation.toFixed(1), unit: '%', color: chaosResult.degradation < 20 ? '#34D399' : '#FB7185' },
                    ].map(s => (
                      <div key={s.label} style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 14px', minWidth: 140 }}>
                        <div style={{ fontSize: 10, color: 'var(--muted)', marginBottom: 4 }}>{s.label}</div>
                        <div style={{ fontSize: 26, fontWeight: 800, color: s.color, fontFamily: 'monospace' }}>{s.value}</div>
                        <div style={{ fontSize: 10, color: 'var(--faint)' }}>{s.unit}</div>
                      </div>
                    ))}
                    <div style={{ fontSize: 12, color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 8, padding: '0 8px' }}>
                      {chaosResult.degradation < 20
                        ? <><CheckCircle2 size={16} color="var(--success)" /> Robot is highly resilient to faults.</>
                        : <><AlertTriangle size={16} color="var(--warning)" /> Consider adding fault detection logic.</>}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* PATH ANALYZER */}
            {activeExp === 'path' && (
              <div>
                {statuses.path === 'ready' && (
                  <div style={{ color: 'var(--muted)', fontSize: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Upload size={14} /> Import a PathPlanner <code>.path</code> file to analyze trajectory deviation.
                  </div>
                )}
                {statuses.path === 'running' && <p style={{ color: 'var(--muted)', fontSize: 12 }}>⟳ Analyzing trajectory…</p>}
                {statuses.path === 'complete' && pathDeviation && (
                  <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', gap: 12 }}>
                      {[
                        { label: 'Max deviation', value: (pathDeviation.maxDev * 100).toFixed(1), unit: 'cm', color: pathDeviation.maxDev > 0.2 ? '#FB7185' : '#34D399' },
                        { label: 'Avg deviation', value: (pathDeviation.avgDev * 100).toFixed(1), unit: 'cm', color: '#60A5FA' },
                        { label: 'Waypoints', value: String(pathIdeal.length), unit: 'pts', color: 'var(--accent-lite)' },
                      ].map(s => (
                        <div key={s.label} style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 14px', minWidth: 90 }}>
                          <div style={{ fontSize: 10, color: 'var(--muted)', marginBottom: 4 }}>{s.label}</div>
                          <div style={{ fontSize: 22, fontWeight: 800, color: s.color, fontFamily: 'monospace' }}>{s.value}</div>
                          <div style={{ fontSize: 10, color: 'var(--faint)' }}>{s.unit}</div>
                        </div>
                      ))}
                    </div>
                    {/* Top-down field SVG */}
                    {pathIdeal.length > 1 && (() => {
                      const allX = [...pathIdeal, ...pathSim].map(p => p.x)
                      const allY = [...pathIdeal, ...pathSim].map(p => p.y)
                      const minX = Math.min(...allX), maxX = Math.max(...allX)
                      const minY = Math.min(...allY), maxY = Math.max(...allY)
                      const W = 280, H = 120, pad = 10
                      const sx = (x: number) => ((x - minX) / (maxX - minX + 0.001)) * (W - pad * 2) + pad
                      const sy = (y: number) => H - ((y - minY) / (maxY - minY + 0.001)) * (H - pad * 2) - pad
                      const toD = (pts: PathPoint[]) => pts.map((p, i) => `${i===0?'M':'L'} ${sx(p.x).toFixed(1)} ${sy(p.y).toFixed(1)}`).join(' ')
                      return (
                        <svg width={W} height={H} style={{ borderRadius: 8, background: 'var(--bg)', border: '1px solid var(--border)' }}>
                          <path d={toD(pathIdeal)} fill="none" stroke="var(--muted)" strokeWidth={1.5} strokeDasharray="4 3" />
                          <path d={toD(pathSim)} fill="none" stroke="var(--accent)" strokeWidth={2} />
                          <circle cx={sx(pathIdeal[0].x)} cy={sy(pathIdeal[0].y)} r={4} fill="var(--success)" />
                          <circle cx={sx(pathIdeal[pathIdeal.length-1].x)} cy={sy(pathIdeal[pathIdeal.length-1].y)} r={4} fill="var(--danger)" />
                        </svg>
                      )
                    })()}
                  </div>
                )}
                {statuses.path === 'complete' && (
                  <div style={{ marginTop: 10, display: 'flex', gap: 16, fontSize: 11, color: 'var(--muted)' }}>
                    <span>── Ideal path</span>
                    <span style={{ color: 'var(--accent)' }}>── Simulated path</span>
                    <span style={{ color: 'var(--success)' }}>● Start</span>
                    <span style={{ color: 'var(--danger)' }}>● End</span>
                    <button
                      onClick={() => {
                        const csv = pathIdeal.map((p,i)=>`${p.x.toFixed(3)},${p.y.toFixed(3)},${pathSim[i]?.x.toFixed(3)},${pathSim[i]?.y.toFixed(3)}`).join('\n')
                        const a = document.createElement('a')
                        a.href = URL.createObjectURL(new Blob([`idealX,idealY,simX,simY\n${csv}`]))
                        a.download = 'path_analysis.csv'
                        a.click()
                      }}
                      style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4, color: 'var(--accent)', cursor: 'pointer', background: 'none', border: 'none', fontSize: 11 }}
                    >
                      <Download size={12} /> Export CSV
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
