import { useState, useRef, useCallback } from 'react'
import {
  TrendingUp,
  Battery,
  Zap,
  GitBranch,
  Play,
  Upload,
  FlaskConical,
  BarChart3,
} from 'lucide-react'
import { useSim } from '../store'
import { MonteCarloRunner } from './MonteCarloRunner'

type StatExpId = 'montecarlo' | 'sysid' | 'thermal' | 'battery' | 'chaos' | 'path'
type ExpStatus = 'ready' | 'running' | 'complete' | 'error'

interface SysIdResult {
  kS: number
  kV: number
  kA: number
  r2: number
}

interface BatteryPoint {
  t: number
  voltage: number
}

interface PathPoint {
  x: number
  y: number
}

function fitSysId(voltage: number[], velocity: number[], acceleration: number[]): SysIdResult {
  const n = voltage.length
  let A00 = 0, A01 = 0, A02 = 0, A11 = 0, A12 = 0, A22 = 0, b0 = 0, b1 = 0, b2 = 0
  for (let i = 0; i < n; i++) {
    const s = Math.sign(velocity[i])
    const v = velocity[i]
    const a = acceleration[i]
    const V = voltage[i]
    A00 += s * s
    A01 += s * v
    A02 += s * a
    A11 += v * v
    A12 += v * a
    A22 += a * a
    b0 += s * V
    b1 += v * V
    b2 += a * V
  }
  const det = A00 * (A11 * A22 - A12 * A12) - A01 * (A01 * A22 - A12 * A02) + A02 * (A01 * A12 - A11 * A02)
  if (Math.abs(det) < 1e-12) return { kS: 0, kV: 0, kA: 0, r2: 0 }
  const kS = (b0 * (A11 * A22 - A12 * A12) - A01 * (b1 * A22 - A12 * b2) + A02 * (b1 * A12 - A11 * b2)) / det
  const kV = (A00 * (b1 * A22 - A12 * b2) - b0 * (A01 * A22 - A12 * A02) + A02 * (A01 * b2 - b1 * A02)) / det
  const kA = (A00 * (A11 * b2 - b1 * A12) - A01 * (A01 * b2 - b1 * A02) + b0 * (A01 * A12 - A11 * A02)) / det

  const vMean = voltage.reduce((a, b) => a + b, 0) / n
  let ssTot = 0, ssRes = 0
  for (let i = 0; i < n; i++) {
    const pred = kS * Math.sign(velocity[i]) + kV * velocity[i] + kA * acceleration[i]
    ssTot += (voltage[i] - vMean) ** 2
    ssRes += (voltage[i] - pred) ** 2
  }
  const r2 = ssTot > 0 ? Math.max(0, 1 - ssRes / ssTot) : 0
  return { kS, kV, kA, r2 }
}

function runSysId(robotMass: number, motorForce: number, maxSpeed: number): SysIdResult {
  const dt = 0.02
  const vMax = maxSpeed
  const motorGain = motorForce / 12

  const voltArr: number[] = []
  const velArr: number[] = []
  const accArr: number[] = []

  let vel = 0
  for (let step = 0; step < 2000; step++) {
    const V = Math.min(10, step * dt * 0.25)
    const F = motorGain * V
    const friction = (0.3 * motorForce) / 12
    const netF = V > 0.1 ? F - friction : 0
    const acc = netF / robotMass
    vel = Math.min(vel + acc * dt, vMax)
    if (vel > 0.05 && V > 0.5) {
      voltArr.push(V)
      velArr.push(vel)
      accArr.push(acc)
    }
  }

  vel = 0
  let prevVel = 0
  for (let step = 0; step < 100; step++) {
    const V = 7
    const F = motorGain * V
    const friction = (0.3 * motorForce) / 12
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

function runBatteryProfile(motorForce: number, maxSpeed: number): { points: BatteryPoint[]; minV: number; brownouts: number } {
  const Vnom = 12.6, R_int = 0.015
  const dt = 0.5
  const totalTime = 150
  const points: BatteryPoint[] = []
  let brownouts = 0
  let minV = Vnom

  for (let t = 0; t <= totalTime; t += dt) {
    const phase = Math.floor(t / 10) % 3
    const velocityFraction = phase === 0 ? 0.85 : phase === 1 ? 0.4 : 0.0
    const vel = velocityFraction * maxSpeed
    const P_mech = (motorForce / 4) * vel
    const P_elec = P_mech / 0.85
    const I_draw = P_elec / Vnom
    const V_term = Math.max(6.0, Vnom - I_draw * R_int)
    if (V_term < 6.8) brownouts++
    if (V_term < minV) minV = V_term
    points.push({ t, voltage: V_term })
  }
  return { points, minV, brownouts }
}

function runChaosMonkey(robotMass: number, mu: number, motorForce: number): { successRate: number; degradation: number } {
  const trials = 100
  let chaosSuccess = 0
  let baselineSuccess = 0

  for (let i = 0; i < trials; i++) {
    const seed = i * 7919 + 13
    const rand = (s: number) => {
      const x = Math.sin(s) * 43758.5453
      return x - Math.floor(x)
    }

    {
      const traction = mu * robotMass * 9.81
      const acc = Math.min(motorForce, traction) / robotMass
      if (acc > 3) baselineSuccess++
    }

    {
      const r1 = rand(seed)
      const r2 = rand(seed + 1)
      const r3 = rand(seed + 2)
      const mass = robotMass * (0.85 + r1 * 0.3)
      const friction = mu * (0.5 + r2 * 0.5)
      const force = motorForce * (0.5 + r3 * 0.5)
      const traction = friction * mass * 9.81
      const acc = Math.min(force, traction) / mass
      if (acc > 2) chaosSuccess++
    }
  }

  const base = (baselineSuccess / trials) * 100
  const chaos = (chaosSuccess / trials) * 100
  return {
    successRate: chaos,
    degradation: base > 0 ? Math.max(0, ((base - chaos) / base) * 100) : 0,
  }
}

interface StatCardDef {
  id: StatExpId
  icon: React.ReactNode
  title: string
  subtitle: string
  iconBg: string
  iconColor: string
  accentColor: string
}

const STAT_CARDS: StatCardDef[] = [
  { id: 'montecarlo', icon: <FlaskConical size={22} />, title: 'Monte Carlo Sample Space', subtitle: '200 randomized parameter trials', iconBg: 'rgba(52,211,153,0.15)', iconColor: '#34D399', accentColor: '#34D399' },
  { id: 'sysid', icon: <TrendingUp size={22} />, title: 'SysId OLS Parameter Fit', subtitle: 'kS / kV / kA system identification', iconBg: 'rgba(59,130,246,0.15)', iconColor: '#60A5FA', accentColor: '#3B82F6' },
  { id: 'battery', icon: <Battery size={22} />, title: 'Battery Sag Prediction', subtitle: '150 s match voltage model', iconBg: 'rgba(234,179,8,0.15)', iconColor: '#FCD34D', accentColor: '#EAB308' },
  { id: 'chaos', icon: <Zap size={22} />, title: 'Fault Chaos Analysis', subtitle: 'Randomized component failure rate', iconBg: 'rgba(251,113,133,0.15)', iconColor: '#FB7185', accentColor: '#F43F5E' },
  { id: 'path', icon: <GitBranch size={22} />, title: 'PathPlanner Tracking Variance', subtitle: 'Trajectory deviation statistics', iconBg: 'rgba(168,85,247,0.15)', iconColor: '#C084FC', accentColor: '#A855F7' },
]

export function StatsPredictions() {
  const { robotMass, motorForce, maxSpeed, mu } = useSim()
  const [activeExp, setActiveExp] = useState<StatExpId>('montecarlo')
  const [statuses, setStatuses] = useState<Record<StatExpId, ExpStatus>>({
    montecarlo: 'ready',
    sysid: 'ready',
    thermal: 'ready',
    battery: 'ready',
    chaos: 'ready',
    path: 'ready',
  })

  const [sysIdResult, setSysIdResult] = useState<SysIdResult | null>(null)
  const [battPoints, setBattPoints] = useState<BatteryPoint[]>([])
  const [battMin, setBattMin] = useState(12.6)
  const [battBrownouts, setBattBrownouts] = useState(0)
  const [chaosResult, setChaosResult] = useState<{ successRate: number; degradation: number } | null>(null)
  const [pathDeviation, setPathDeviation] = useState<{ maxDev: number; avgDev: number } | null>(null)
  const [pathIdeal, setPathIdeal] = useState<PathPoint[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const setStatus = (id: StatExpId, s: ExpStatus) => setStatuses((prev) => ({ ...prev, [id]: s }))

  const runExp = useCallback(
    (id: StatExpId) => {
      setActiveExp(id)
      if (id === 'montecarlo') return

      setStatus(id, 'running')
      setTimeout(() => {
        try {
          if (id === 'sysid') {
            const r = runSysId(robotMass, motorForce, maxSpeed)
            setSysIdResult(r)
            setStatus('sysid', 'complete')
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
    },
    [robotMass, motorForce, maxSpeed, mu],
  )

  const handlePathFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setStatus('path', 'running')
    setActiveExp('path')
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const json = JSON.parse(ev.target?.result as string)
        const states: any[] = json.trajectory?.states ?? json.waypoints ?? []
        if (states.length < 2) throw new Error('No states found')

        const ideal: PathPoint[] = states.map((s) => ({
          x: s.pose?.translation?.x ?? s.x ?? 0,
          y: s.pose?.translation?.y ?? s.y ?? 0,
        }))
        const sim: PathPoint[] = [{ ...ideal[0] }]
        let px = ideal[0].x, py = ideal[0].y
        for (let i = 1; i < ideal.length; i++) {
          const ex = ideal[i].x - px, ey = ideal[i].y - py
          px += ex * 0.85 + (Math.random() - 0.5) * 0.04
          py += ey * 0.85 + (Math.random() - 0.5) * 0.04
          sim.push({ x: px, y: py })
        }
        let totalDev = 0, maxDev = 0
        for (let i = 0; i < ideal.length; i++) {
          const d = Math.hypot(sim[i].x - ideal[i].x, sim[i].y - ideal[i].y)
          if (d > maxDev) maxDev = d
          totalDev += d
        }
        setPathIdeal(ideal)
        setPathDeviation({ maxDev, avgDev: totalDev / ideal.length })
        setStatus('path', 'complete')
      } catch {
        setStatus('path', 'error')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }, [])

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background: 'var(--bg)' }}>
      <div className="flex-1 overflow-y-auto p-5">
        {/* Hero Banner */}
        <div className="hero-banner p-6 mb-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="gradient-text-brand text-2xl font-black tracking-tight mb-1 flex items-center gap-2">
                <BarChart3 size={24} className="text-[var(--accent)]" />
                STATISTICS & PREDICTIONS
              </div>
              <p style={{ color: 'var(--muted)', fontSize: 13 }}>
                Multi-dimensional sample spaces, Monte Carlo batch trials, and parametric predictive models.
              </p>
            </div>
            <div className="flex gap-2">
              <span className="badge badge-ready font-mono text-[10px]">100HZ SOLVER</span>
              <span className="badge badge-complete font-mono text-[10px]">OLS REGRESSION</span>
            </div>
          </div>
        </div>

        {/* Predictive Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
          {STAT_CARDS.map((card) => {
            const isSelected = activeExp === card.id
            return (
              <div
                key={card.id}
                onClick={() => {
                  if (card.id !== 'path') runExp(card.id)
                }}
                className={`exp-card ${isSelected ? 'active' : ''}`}
                style={{
                  borderColor: isSelected ? card.accentColor : undefined,
                  boxShadow: isSelected ? `0 0 16px ${card.accentColor}33` : undefined,
                }}
              >
                <div className="flex items-center justify-between">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: card.iconBg, color: card.iconColor }}
                  >
                    {card.icon}
                  </div>
                  <span className={`badge ${statuses[card.id] === 'complete' ? 'badge-ready' : 'badge-running'}`}>
                    {statuses[card.id].toUpperCase()}
                  </span>
                </div>
                <div>
                  <h4 className="font-bold text-xs text-[var(--text)]">{card.title}</h4>
                  <p className="text-[10px] text-[var(--muted)] mt-1">{card.subtitle}</p>
                </div>
                {card.id === 'path' ? (
                  <div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        fileInputRef.current?.click()
                      }}
                      className="btn-glow w-full py-1.5 rounded-lg text-xs font-mono font-bold flex items-center justify-center gap-1.5"
                    >
                      <Upload size={12} /> Load .path
                    </button>
                    <input ref={fileInputRef} type="file" accept=".path,.auto,.json" className="hidden" onChange={handlePathFile} />
                  </div>
                ) : (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      runExp(card.id)
                    }}
                    className="btn-glow w-full py-1.5 rounded-lg text-xs font-mono font-bold flex items-center justify-center gap-1.5"
                  >
                    <Play size={12} /> Compute
                  </button>
                )}
              </div>
            )
          })}
        </div>

        {/* Results Panel */}
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5">
          {activeExp === 'montecarlo' && <MonteCarloRunner />}

          {activeExp === 'sysid' && (
            <div>
              <h3 className="font-bold text-sm text-[var(--text)] mb-3 flex items-center gap-2">
                <TrendingUp size={16} className="text-blue-400" /> SysId Ordinary Least Squares Regression Fit
              </h3>
              {sysIdResult ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 rounded-xl bg-[var(--bg)] border border-[var(--border)]">
                    <div className="text-[10px] font-mono text-[var(--muted)]">kS (Static Friction)</div>
                    <div className="text-xl font-bold font-mono text-blue-400 mt-1">{sysIdResult.kS.toFixed(4)} V</div>
                  </div>
                  <div className="p-4 rounded-xl bg-[var(--bg)] border border-[var(--border)]">
                    <div className="text-[10px] font-mono text-[var(--muted)]">kV (Velocity Gain)</div>
                    <div className="text-xl font-bold font-mono text-emerald-400 mt-1">{sysIdResult.kV.toFixed(4)} V/(m/s)</div>
                  </div>
                  <div className="p-4 rounded-xl bg-[var(--bg)] border border-[var(--border)]">
                    <div className="text-[10px] font-mono text-[var(--muted)]">kA (Acceleration Gain)</div>
                    <div className="text-xl font-bold font-mono text-amber-400 mt-1">{sysIdResult.kA.toFixed(4)} V/(m/s²)</div>
                  </div>
                  <div className="p-4 rounded-xl bg-[var(--bg)] border border-[var(--border)]">
                    <div className="text-[10px] font-mono text-[var(--muted)]">R² Goodness of Fit</div>
                    <div className="text-xl font-bold font-mono text-purple-400 mt-1">{(sysIdResult.r2 * 100).toFixed(1)}%</div>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-[var(--muted)]">Click 'Compute' above to execute 400-step Quasistatic and Dynamic SysId characterization.</p>
              )}
            </div>
          )}

          {activeExp === 'battery' && (
            <div>
              <h3 className="font-bold text-sm text-[var(--text)] mb-3 flex items-center gap-2">
                <Battery size={16} className="text-amber-400" /> 150-Second Match Terminal Voltage Prediction
              </h3>
              {battPoints.length > 0 ? (
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="p-3 rounded-lg bg-[var(--bg)] border border-[var(--border)]">
                      <span className="text-[10px] text-[var(--muted)] font-mono">Minimum Terminal Voltage:</span>{' '}
                      <span className="font-bold font-mono text-emerald-400">{battMin.toFixed(2)} V</span>
                    </div>
                    <div className="p-3 rounded-lg bg-[var(--bg)] border border-[var(--border)]">
                      <span className="text-[10px] text-[var(--muted)] font-mono">Brownout Incidents (&lt;6.8V):</span>{' '}
                      <span className="font-bold font-mono text-purple-400">{battBrownouts}</span>
                    </div>
                  </div>
                  <div className="h-28 w-full bg-[var(--bg)] rounded-xl border border-[var(--border)] p-2 flex items-end">
                    <svg className="w-full h-full">
                      {battPoints.map((p, i, arr) => {
                        if (i === 0) return null
                        const x1 = ((arr[i - 1].t) / 150) * 100
                        const y1 = 100 - ((arr[i - 1].voltage - 6) / 7) * 100
                        const x2 = ((p.t) / 150) * 100
                        const y2 = 100 - ((p.voltage - 6) / 7) * 100
                        return (
                          <line
                            key={i}
                            x1={`${x1}%`}
                            y1={`${y1}%`}
                            x2={`${x2}%`}
                            y2={`${y2}%`}
                            stroke="var(--accent)"
                            strokeWidth="2"
                          />
                        )
                      })}
                    </svg>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-[var(--muted)]">Click 'Compute' to simulate motor loads and battery internal resistance drop.</p>
              )}
            </div>
          )}

          {activeExp === 'chaos' && (
            <div>
              <h3 className="font-bold text-sm text-[var(--text)] mb-3 flex items-center gap-2">
                <Zap size={16} className="text-rose-400" /> Fault Chaos Monkey Degradation Analysis
              </h3>
              {chaosResult ? (
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-[var(--bg)] border border-[var(--border)]">
                    <div className="text-xs font-mono text-[var(--muted)]">Success Rate Under Random Faults</div>
                    <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">{chaosResult.successRate.toFixed(1)}%</div>
                  </div>
                  <div className="p-4 rounded-xl bg-[var(--bg)] border border-[var(--border)]">
                    <div className="text-xs font-mono text-[var(--muted)]">Relative Performance Degradation</div>
                    <div className="text-2xl font-bold font-mono text-rose-400 mt-1">{chaosResult.degradation.toFixed(1)}%</div>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-[var(--muted)]">Click 'Compute' to simulate 100 trials with randomized motor dropouts and carpet friction variance.</p>
              )}
            </div>
          )}

          {activeExp === 'path' && (
            <div>
              <h3 className="font-bold text-sm text-[var(--text)] mb-3 flex items-center gap-2">
                <GitBranch size={16} className="text-purple-400" /> PathPlanner Trajectory Deviation
              </h3>
              {pathDeviation ? (
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl bg-[var(--bg)] border border-[var(--border)]">
                    <div className="text-xs font-mono text-[var(--muted)]">Maximum Deviation Error</div>
                    <div className="text-xl font-bold font-mono text-rose-400 mt-1">{(pathDeviation.maxDev * 100).toFixed(1)} cm</div>
                  </div>
                  <div className="p-4 rounded-xl bg-[var(--bg)] border border-[var(--border)]">
                    <div className="text-xs font-mono text-[var(--muted)]">Mean Tracking Deviation</div>
                    <div className="text-xl font-bold font-mono text-blue-400 mt-1">{(pathDeviation.avgDev * 100).toFixed(1)} cm</div>
                  </div>
                  <div className="p-4 rounded-xl bg-[var(--bg)] border border-[var(--border)]">
                    <div className="text-xs font-mono text-[var(--muted)]">Imported Waypoints</div>
                    <div className="text-xl font-bold font-mono text-purple-400 mt-1">{pathIdeal.length} points</div>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-[var(--muted)]">Upload a PathPlanner .path file above to inspect kinematic tracking error.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
