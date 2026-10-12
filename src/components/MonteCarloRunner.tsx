import { useState, useRef, useCallback } from 'react'
import { Play, Square, BarChart2, Shuffle, AlertTriangle } from 'lucide-react'
import { useParams } from '../stores/paramStore'

interface RunResult {
  seed: number
  success: boolean
  score: number
  reason: string
  durationMs: number
}

interface Stats {
  runs: number
  successRate: number
  avgScore: number
  minScore: number
  maxScore: number
  p5: number
  p95: number
}

function calcStats(results: RunResult[]): Stats {
  if (results.length === 0)
    return { runs: 0, successRate: 0, avgScore: 0, minScore: 0, maxScore: 0, p5: 0, p95: 0 }
  const scores = results.map((r) => r.score).sort((a, b) => a - b)
  const successes = results.filter((r) => r.success).length
  return {
    runs: results.length,
    successRate: (successes / results.length) * 100,
    avgScore: scores.reduce((a, b) => a + b, 0) / scores.length,
    minScore: scores[0],
    maxScore: scores[scores.length - 1],
    p5: scores[Math.floor(scores.length * 0.05)],
    p95: scores[Math.floor(scores.length * 0.95)],
  }
}

// Simulate a single run: combines current params with domain randomization
function simulateRun(
  baseSeed: number,
  randMassRange: number,
  randFricRange: number,
  packetLoss: number,
  netJitter: number,
  sensorFailProb: number,
  motorFailProb: number,
  scenario: string
): RunResult {
  const start = performance.now()
  // Seeded pseudo-random using simple LCG (no external deps needed)
  let s = baseSeed ^ 0xdeadbeef
  const rand = () => {
    s = (Math.imul(1664525, s) + 1013904223) >>> 0
    return s / 0xffffffff
  }

  // Domain-randomized params for this trial
  const massMult = 1 + (rand() * 2 - 1) * randMassRange
  const fricMult = 1 + (rand() * 2 - 1) * randFricRange

  // Simulate whether robot survives the scenario
  let score = 0
  let success = true
  let reason = 'OK'

  // Motor failure
  if (rand() * 100 < motorFailProb) {
    success = false
    reason = `Motor failure (seed=${baseSeed})`
  }

  // Sensor failure
  if (success && rand() * 100 < sensorFailProb) {
    success = rand() > 0.5 // Sensor failure may be recoverable
    if (!success) reason = `Sensor failure (seed=${baseSeed})`
  }

  // Network packet loss
  const effectiveControl = Math.max(0, 1 - packetLoss / 100 - rand() * netJitter * 5)

  // Score depends on scenario
  switch (scenario) {
    case 'auto':
      score = success ? Math.round(rand() * 15 * effectiveControl * fricMult * (1 / massMult)) : rand() * 3
      break
    case 'defense':
      score = success ? Math.round(rand() * 8 * effectiveControl * fricMult) : 0
      break
    case 'push':
      score = success ? Math.round(rand() * 10 * fricMult * (1 / massMult)) : 0
      break
    case 'climb':
      score = success ? (rand() > 0.3 * massMult ? 15 : 6) : 0
      break
    default:
      score = success ? Math.round(rand() * 20 * effectiveControl) : rand() * 5
  }

  return {
    seed: baseSeed,
    success,
    score,
    reason,
    durationMs: performance.now() - start,
  }
}

// Mini bar chart for score distribution
function Histogram({ results }: { results: RunResult[] }) {
  if (results.length === 0) return null
  const scores = results.map((r) => r.score)
  const max = Math.max(...scores, 1)
  const buckets = 12
  const bucketSize = max / buckets
  const counts = Array(buckets).fill(0)
  for (const s of scores) {
    const b = Math.min(buckets - 1, Math.floor(s / bucketSize))
    counts[b]++
  }
  const maxCount = Math.max(...counts, 1)

  return (
    <div className="mt-3">
      <p className="text-[10px] text-[var(--muted)] font-mono mb-1">Score Distribution</p>
      <div className="flex items-end gap-0.5 h-16">
        {counts.map((c, i) => {
          const pct = (c / maxCount) * 100
          const label = Math.round(i * bucketSize)
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-0.5" title={`~${label}: ${c} runs`}>
              <div
                className="w-full rounded-t transition-all"
                style={{
                  height: `${pct}%`,
                  minHeight: c > 0 ? 2 : 0,
                  background: pct > 60 ? '#22c55e' : pct > 30 ? '#f59e0b' : '#f87171',
                }}
              />
            </div>
          )
        })}
      </div>
      <div className="flex justify-between text-[8px] text-[var(--muted)] font-mono mt-0.5">
        <span>0</span>
        <span>{Math.round(max / 2)}</span>
        <span>{Math.round(max)}</span>
      </div>
    </div>
  )
}

function StatRow({ label, value, unit = '', color }: { label: string; value: number | string; unit?: string; color?: string }) {
  return (
    <div className="flex justify-between items-baseline text-[11px]">
      <span className="text-[var(--muted)]">{label}</span>
      <span className="font-mono font-bold" style={{ color: color || 'var(--text)' }}>
        {typeof value === 'number' ? value.toFixed(1) : value}
        {unit && <span className="text-[9px] text-[var(--muted)] ml-0.5">{unit}</span>}
      </span>
    </div>
  )
}

export function MonteCarloRunner() {
  const { values } = useParams()
  const [running, setRunning] = useState(false)
  const [results, setResults] = useState<RunResult[]>([])
  const [progress, setProgress] = useState(0)
  const stopRef = useRef(false)

  const run = useCallback(async () => {
    stopRef.current = false
    setRunning(true)
    setResults([])
    setProgress(0)

    const totalRuns = Number(values['test.monte_carlo_runs']) || 100
    const seed = Number(values['test.seed']) || 42
    const randMassRange = Number(values['test.rand_mass_range']) || 0.1
    const randFricRange = Number(values['test.rand_fric_range']) || 0.2
    const packetLoss = Number(values['test.packet_loss']) || 0
    const netJitter = Number(values['test.net_jitter']) || 0
    const sensorFail = Number(values['test.sensor_fail_prob']) || 0
    const motorFail = Number(values['test.motor_fail_prob']) || 0
    const scenario = String(values['test.scenario'] || 'none')
    const domainRand = Boolean(values['test.domain_rand'])

    const batch: RunResult[] = []
    const CHUNK = 10 // run 10 simulations per animation frame to keep UI responsive

    for (let i = 0; i < totalRuns; i += CHUNK) {
      if (stopRef.current) break
      for (let j = i; j < Math.min(i + CHUNK, totalRuns); j++) {
        batch.push(
          simulateRun(
            seed + j,
            domainRand ? randMassRange : 0,
            domainRand ? randFricRange : 0,
            packetLoss,
            netJitter,
            sensorFail,
            motorFail,
            scenario
          )
        )
      }
      setResults([...batch])
      setProgress(Math.min(100, Math.round((Math.min(i + CHUNK, totalRuns) / totalRuns) * 100)))
      // Yield to UI
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
    }

    setRunning(false)
  }, [values])

  const stats = calcStats(results)
  const failureReasons = results
    .filter((r) => !r.success)
    .reduce<Record<string, number>>((acc, r) => {
      const key = r.reason.replace(/seed=\d+/, 'seed=X')
      acc[key] = (acc[key] || 0) + 1
      return acc
    }, {})

  return (
    <div className="flex flex-col h-full overflow-y-auto p-3 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart2 size={16} style={{ color: 'var(--accent)' }} />
          <span className="text-[13px] font-bold uppercase tracking-wider" style={{ color: 'var(--accent)' }}>
            Monte Carlo Robustness
          </span>
        </div>
        {running ? (
          <button
            onClick={() => { stopRef.current = true; setRunning(false) }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/20 border border-red-500/50 text-red-400 text-[11px] font-bold hover:bg-red-500/30 transition-all"
          >
            <Square size={11} /> STOP
          </button>
        ) : (
          <button
            onClick={run}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all active:scale-95"
            style={{ background: 'var(--accent)', color: '#000' }}
          >
            <Play size={11} /> RUN {Number(values['test.monte_carlo_runs']) || 100} TRIALS
          </button>
        )}
      </div>

      {/* Quick Scenario & Preset Controls */}
      <div className="rounded-lg border border-[var(--border)] bg-[var(--panel)]/50 p-2.5 space-y-2">
        <div>
          <span className="text-[10px] font-mono text-[var(--muted)] uppercase tracking-wider block mb-1">
            Test Scenario
          </span>
          <div className="grid grid-cols-4 gap-1">
            {(['auto', 'defense', 'push', 'climb'] as const).map((sc) => {
              const active = String(values['test.scenario'] || 'auto') === sc
              return (
                <button
                  key={sc}
                  onClick={() => useParams.getState().setParam('test.scenario', sc)}
                  className={`py-1 rounded text-[10px] font-mono font-bold uppercase transition-all ${
                    active
                      ? 'bg-[var(--accent)] text-black shadow-sm'
                      : 'bg-black/40 text-[var(--muted)] hover:text-white border border-[var(--border)]'
                  }`}
                >
                  {sc}
                </button>
              )
            })}
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-[10px] font-mono text-[var(--muted)] uppercase tracking-wider">
              Trial Batches
            </span>
            <button
              onClick={() => useParams.getState().setParam('test.domain_rand', !values['test.domain_rand'])}
              className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold border transition-all ${
                values['test.domain_rand']
                  ? 'border-emerald-500/50 bg-emerald-500/20 text-emerald-400'
                  : 'border-[var(--border)] bg-black/30 text-[var(--muted)]'
              }`}
            >
              DOMAIN RAND: {values['test.domain_rand'] ? 'ON' : 'OFF'}
            </button>
          </div>
          <div className="grid grid-cols-4 gap-1">
            {[50, 100, 250, 500].map((count) => {
              const active = Number(values['test.monte_carlo_runs']) === count
              return (
                <button
                  key={count}
                  onClick={() => useParams.getState().setParam('test.monte_carlo_runs', count)}
                  className={`py-1 rounded text-[10px] font-mono transition-all ${
                    active
                      ? 'border border-[var(--accent)] bg-[var(--accent)]/15 text-[var(--accent)] font-bold'
                      : 'bg-black/30 text-[var(--muted)] hover:text-white border border-[var(--border)]'
                  }`}
                >
                  {count} runs
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Config summary */}
      <div className="rounded-lg border border-[var(--border)] bg-[var(--panel)]/50 p-2.5 space-y-1">
        <p className="text-[10px] font-mono text-[var(--muted)] uppercase tracking-wider mb-1.5">Active Config</p>
        <StatRow label="Trials" value={Number(values['test.monte_carlo_runs']) || 100} />
        <StatRow label="Seed" value={Number(values['test.seed']) || 42} />
        <StatRow label="Domain Rand" value={values['test.domain_rand'] ? 'ON' : 'OFF'} color={values['test.domain_rand'] ? '#4ade80' : '#6b7280'} />
        <StatRow label="Packet Loss" value={Number(values['test.packet_loss']) || 0} unit="%" />
        <StatRow label="Sensor Fail" value={Number(values['test.sensor_fail_prob']) || 0} unit="%" />
        <StatRow label="Motor Fail" value={Number(values['test.motor_fail_prob']) || 0} unit="%" />
        <StatRow label="Scenario" value={String(values['test.scenario'] || 'auto')} />
      </div>

      {/* Progress bar */}
      {running && (
        <div className="space-y-1">
          <div className="flex justify-between text-[10px] text-[var(--muted)] font-mono">
            <span className="flex items-center gap-1">
              <Shuffle size={10} className="animate-spin" /> Running trials…
            </span>
            <span>{progress}%</span>
          </div>
          <div className="h-1.5 bg-black/40 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${progress}%`, background: 'var(--accent)' }}
            />
          </div>
          <p className="text-[10px] text-[var(--muted)] font-mono text-right">
            {results.length} / {Number(values['test.monte_carlo_runs']) || 100} runs complete
          </p>
        </div>
      )}

      {/* Results stats */}
      {results.length > 0 && (
        <>
          {/* Success rate ring */}
          <div className="flex items-center gap-4 p-3 rounded-lg border border-[var(--border)] bg-[var(--panel)]/50">
            <div className="relative w-16 h-16 shrink-0">
              <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                <circle cx="18" cy="18" r="15" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="3" />
                <circle
                  cx="18" cy="18" r="15" fill="none"
                  stroke={stats.successRate > 80 ? '#22c55e' : stats.successRate > 50 ? '#f59e0b' : '#ef4444'}
                  strokeWidth="3"
                  strokeDasharray={`${stats.successRate * 0.942} 100`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-[11px] font-black font-mono" style={{ color: stats.successRate > 80 ? '#22c55e' : stats.successRate > 50 ? '#f59e0b' : '#ef4444' }}>
                  {stats.successRate.toFixed(0)}%
                </span>
              </div>
            </div>
            <div className="flex-1 space-y-1">
              <p className="text-[11px] font-bold text-[var(--text)]">Success Rate</p>
              <p className="text-[10px] text-[var(--muted)]">{results.filter(r => r.success).length} / {results.length} trials passed</p>
              <StatRow label="Avg Score" value={stats.avgScore} color="var(--accent)" />
            </div>
          </div>

          {/* Stats grid */}
          <div className="rounded-lg border border-[var(--border)] bg-[var(--panel)]/50 p-2.5 space-y-1">
            <p className="text-[10px] font-mono text-[var(--muted)] uppercase tracking-wider mb-1.5">Statistics</p>
            <StatRow label="Min Score" value={stats.minScore} color="#f87171" />
            <StatRow label="P5 (worst 5%)" value={stats.p5} color="#fb923c" />
            <StatRow label="P95 (best 95%)" value={stats.p95} color="#4ade80" />
            <StatRow label="Max Score" value={stats.maxScore} color="#22c55e" />
          </div>

          <Histogram results={results} />

          {/* Failure analysis */}
          {Object.keys(failureReasons).length > 0 && (
            <div className="rounded-lg border border-red-500/20 bg-red-950/10 p-2.5 space-y-1">
              <p className="text-[10px] font-bold flex items-center gap-1.5 text-red-400 uppercase tracking-wider mb-1.5">
                <AlertTriangle size={11} /> Failure Analysis
              </p>
              {Object.entries(failureReasons).map(([reason, count]) => (
                <div key={reason} className="flex justify-between text-[10px]">
                  <span className="text-[var(--muted)] truncate pr-2">{reason}</span>
                  <span className="font-mono text-red-400 shrink-0">{count}×</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {results.length === 0 && !running && (
        <div className="flex flex-col items-center justify-center flex-1 gap-3 text-center py-12">
          <BarChart2 size={40} className="text-[var(--border)]" />
          <p className="text-[12px] text-[var(--muted)] leading-relaxed max-w-[220px]">
            Configure parameters in the SIM tab, then run trials to test robustness under domain randomization and fault injection.
          </p>
        </div>
      )}
    </div>
  )
}
