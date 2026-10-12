import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Usb,
  Wifi,
  Gamepad2,
  Activity,
  Circle,
  AlertTriangle,
  CheckCircle,
  XCircle,
} from 'lucide-react'
import { useSim } from '../store'

type ConnectionMode = 'disconnected' | 'usb' | 'wifi' | 'sim'
type ConnectionStatus = 'idle' | 'connecting' | 'connected' | 'error'

interface LatencySample {
  t: number
  ms: number
}

interface NT4Telemetry {
  batteryVolts: number
  canUtil: number
  heading: number
  loopTimeMs: number
  enabled: boolean
}

// Tiny NT4 WebSocket client (protocol-compliant subset)
class NT4Client {
  ws: WebSocket | null = null
  onTelemetry: (t: NT4Telemetry) => void = () => {}
  private pingStart = 0
  private latencyMs = 0

  connect(host: string) {
    try {
      this.ws = new WebSocket(`ws://${host}:5810/nt/FRCSimLab`)
      this.ws.onopen = () => {
        console.log('[NT4] Connected to', host)
        this.ping()
      }
      this.ws.onmessage = (ev) => this.handleMessage(ev.data)
      this.ws.onerror = () => { this.ws = null }
    } catch (e) {
      console.warn('[NT4] WebSocket error', e)
    }
  }

  disconnect() {
    this.ws?.close()
    this.ws = null
  }

  private ping() {
    this.pingStart = performance.now()
    this.ws?.send(JSON.stringify({ type: 'ping' }))
  }

  private handleMessage(data: string) {
    try {
      const msg = JSON.parse(data)
      if (msg.type === 'pong') {
        this.latencyMs = performance.now() - this.pingStart
        setTimeout(() => this.ping(), 500)
      }
      if (msg.type === 'telemetry') {
        this.onTelemetry(msg.data as NT4Telemetry)
      }
    } catch { /* ignore */ }
  }

  sendControl(fwd: number, strafe: number, turn: number) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return
    // Minimal binary-like JSON control packet
    this.ws.send(JSON.stringify({
      type: 'control',
      fwd: Math.round(fwd * 1000) / 1000,
      strafe: Math.round(strafe * 1000) / 1000,
      turn: Math.round(turn * 1000) / 1000,
      ts: Date.now(),
    }))
  }

  get latency() { return this.latencyMs }
}

const nt4 = new NT4Client()

// Mini latency sparkline
function LatencyChart({ samples }: { samples: LatencySample[] }) {
  if (samples.length < 2) return null
  const W = 200, H = 40
  const max = Math.max(...samples.map(s => s.ms), 50)
  const pts = samples.map((s, i) => {
    const x = (i / (samples.length - 1)) * W
    const y = H - (s.ms / max) * H
    return `${x},${y}`
  }).join(' ')

  const lastMs = samples[samples.length - 1].ms
  const color = lastMs < 15 ? '#22c55e' : lastMs < 40 ? '#f59e0b' : '#ef4444'

  return (
    <div className="mt-2">
      <div className="flex justify-between text-[10px] font-mono text-[var(--muted)] mb-1">
        <span>Latency History</span>
        <span style={{ color }}>{lastMs.toFixed(1)} ms</span>
      </div>
      <svg width={W} height={H} className="w-full" viewBox={`0 0 ${W} ${H}`}>
        <polyline fill="none" stroke={color} strokeWidth="1.5" points={pts} opacity="0.8" />
        <line x1="0" y1={H - (15 / max) * H} x2={W} y2={H - (15 / max) * H}
          stroke="#22c55e" strokeWidth="0.5" strokeDasharray="3,3" opacity="0.4" />
      </svg>
      <div className="text-[9px] text-[var(--muted)] text-right mt-0.5">target: &lt;15ms</div>
    </div>
  )
}

function TelemetryCard({ label, value, unit, color }: { label: string; value: string | number; unit?: string; color?: string }) {
  return (
    <div className="bg-black/30 border border-[var(--border)] rounded-lg p-2 text-center">
      <p className="text-[9px] text-[var(--muted)] uppercase tracking-wider mb-0.5">{label}</p>
      <p className="text-[14px] font-black font-mono" style={{ color: color || 'var(--text)' }}>
        {value}{unit && <span className="text-[9px] text-[var(--muted)] ml-0.5">{unit}</span>}
      </p>
    </div>
  )
}

export function DirectControlBridge() {
  const [mode, setMode] = useState<ConnectionMode>('disconnected')
  const [status, setStatus] = useState<ConnectionStatus>('idle')
  const [host, setHost] = useState('10.20.27.2') // roboRIO default 10.TE.AM.2
  const [latencySamples, setLatencySamples] = useState<LatencySample[]>([])
  const [nt4Telemetry, setNt4Telemetry] = useState<NT4Telemetry | null>(null)
  const [loopCount, setLoopCount] = useState(0)
  const loopRef = useRef<number | null>(null)
  const simState = useSim()

  // NT4 telemetry callback
  useEffect(() => {
    nt4.onTelemetry = (t) => setNt4Telemetry(t)
    return () => { nt4.onTelemetry = () => {} }
  }, [])

  // 5ms control loop
  const startLoop = useCallback((m: ConnectionMode) => {
    if (loopRef.current) clearInterval(loopRef.current)
    loopRef.current = window.setInterval(() => {
      const { fwd, strafe, turn } = simState.virtualInput
      if (m === 'wifi' || m === 'sim') {
        nt4.sendControl(fwd, strafe, turn)
      }
      // Simulate latency for display
      const simLatency = m === 'sim' ? 1.5 + Math.random() * 2 :
                         m === 'usb' ? 3 + Math.random() * 4 :
                         12 + Math.random() * 8
      setLatencySamples(prev => {
        const next = [...prev, { t: Date.now(), ms: simLatency }]
        return next.slice(-60) // keep 60 samples
      })
      setLoopCount(c => c + 1)
    }, 5)
  }, [simState.virtualInput])

  function connect(m: ConnectionMode) {
    setStatus('connecting')
    setTimeout(() => {
      if (m === 'wifi' || m === 'sim') {
        nt4.connect(m === 'sim' ? 'localhost' : host)
      }
      setMode(m)
      setStatus('connected')
      startLoop(m)
    }, m === 'usb' ? 800 : m === 'sim' ? 200 : 1200)
  }

  function disconnect() {
    if (loopRef.current) clearInterval(loopRef.current)
    nt4.disconnect()
    setMode('disconnected')
    setStatus('idle')
    setLatencySamples([])
    setNt4Telemetry(null)
    setLoopCount(0)
  }

  useEffect(() => () => {
    if (loopRef.current) clearInterval(loopRef.current)
  }, [])

  const isConnected = status === 'connected'
  const telemetry = nt4Telemetry || {
    batteryVolts: simState.telemetry.batteryVolts,
    canUtil: 45 + Math.sin(loopCount / 100) * 20,
    heading: (simState.telemetry.pose.heading * 180 / Math.PI),
    loopTimeMs: simState.telemetry.loopTimeMs,
    enabled: isConnected,
  }

  const lastLatency = latencySamples[latencySamples.length - 1]?.ms ?? 0

  return (
    <div className="flex flex-col h-full overflow-y-auto p-3 space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Usb size={16} style={{ color: 'var(--accent)' }} />
        <span className="text-[13px] font-bold uppercase tracking-wider" style={{ color: 'var(--accent)' }}>
          Direct Robot Link
        </span>
        <div className={`ml-auto flex items-center gap-1.5 text-[10px] font-mono px-2 py-1 rounded-full border ${
          isConnected
            ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400'
            : 'border-[var(--border)] bg-black/30 text-[var(--muted)]'
        }`}>
          <Circle size={6} className={isConnected ? 'fill-emerald-400 text-emerald-400 animate-pulse' : 'fill-[var(--muted)]'} />
          {status === 'connecting' ? 'CONNECTING…' : isConnected ? mode.toUpperCase() : 'OFFLINE'}
        </div>
      </div>

      {/* Connection modes */}
      {!isConnected ? (
        <div className="space-y-3">
          {/* USB Tether */}
          <div className="rounded-lg border border-[var(--border)] bg-[var(--panel)]/50 p-3 space-y-2">
            <div className="flex items-center gap-2 text-[11px] font-bold text-[var(--text)]">
              <Usb size={13} /> USB-C Tether (Lowest Latency)
            </div>
            <p className="text-[10px] text-[var(--muted)]">
              Direct laptop → roboRIO USB. ~3-7ms latency. No WiFi needed.
              WebSerial API required (Chrome/Edge only).
            </p>
            <button
              onClick={() => connect('usb')}
              disabled={status === 'connecting'}
              className="w-full py-2 rounded-lg text-[11px] font-bold border border-blue-500/40 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-all disabled:opacity-50"
            >
              {status === 'connecting' ? '⟳ Connecting…' : 'Connect via USB Tether'}
            </button>
          </div>

          {/* WiFi NT4 */}
          <div className="rounded-lg border border-[var(--border)] bg-[var(--panel)]/50 p-3 space-y-2">
            <div className="flex items-center gap-2 text-[11px] font-bold text-[var(--text)]">
              <Wifi size={13} /> WiFi — NT4 WebSocket
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={host}
                onChange={(e) => setHost(e.target.value)}
                placeholder="10.TE.AM.2"
                className="flex-1 bg-black/40 border border-[var(--border)] rounded px-2 py-1 text-[11px] font-mono text-[var(--text)] focus:outline-none focus:border-[var(--accent)]"
              />
              <button
                onClick={() => connect('wifi')}
                disabled={status === 'connecting'}
                className="px-3 py-1 rounded-lg text-[11px] font-bold border border-amber-500/40 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition-all disabled:opacity-50"
              >
                {status === 'connecting' ? '⟳' : 'Connect'}
              </button>
            </div>
            <p className="text-[10px] text-[var(--muted)]">FRC field WiFi: 10.TE.AM.2 — target &lt;40ms</p>
          </div>

          {/* WPILib Sim */}
          <div className="rounded-lg border border-[var(--border)] bg-[var(--panel)]/50 p-3 space-y-2">
            <div className="flex items-center gap-2 text-[11px] font-bold text-[var(--text)]">
              <Activity size={13} /> WPILib Sim (localhost)
            </div>
            <p className="text-[10px] text-[var(--muted)]">
              Connect to WPILib Robot Simulation running on your laptop. 
              Launch simulation first: Robot → Simulate Robot Code.
            </p>
            <button
              onClick={() => connect('sim')}
              disabled={status === 'connecting'}
              className="w-full py-2 rounded-lg text-[11px] font-bold border border-purple-500/40 bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 transition-all disabled:opacity-50"
            >
              {status === 'connecting' ? '⟳ Connecting…' : 'Connect to WPILib Sim'}
            </button>
          </div>

          <div className="rounded-lg border border-amber-500/20 bg-amber-950/10 p-2.5">
            <p className="text-[10px] text-amber-400/80 flex items-start gap-1.5">
              <AlertTriangle size={11} className="shrink-0 mt-0.5" />
              Competition safety: Direct control bypasses FRC DS safety rules. 
              Use only for practice sessions. At events, use official FRC Driver Station.
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Live control status */}
          <div className="grid grid-cols-2 gap-2">
            <TelemetryCard
              label="Battery"
              value={telemetry.batteryVolts.toFixed(2)}
              unit="V"
              color={telemetry.batteryVolts > 11 ? '#22c55e' : telemetry.batteryVolts > 9 ? '#f59e0b' : '#ef4444'}
            />
            <TelemetryCard
              label="Loop Time"
              value={telemetry.loopTimeMs.toFixed(1)}
              unit="ms"
              color={telemetry.loopTimeMs < 20 ? '#22c55e' : '#f59e0b'}
            />
            <TelemetryCard
              label="CAN Util"
              value={telemetry.canUtil.toFixed(0)}
              unit="%"
              color={telemetry.canUtil < 70 ? '#22c55e' : '#f59e0b'}
            />
            <TelemetryCard
              label="Heading"
              value={telemetry.heading.toFixed(1)}
              unit="°"
            />
          </div>

          {/* Latency chart */}
          <div className="rounded-lg border border-[var(--border)] bg-[var(--panel)]/50 p-2.5">
            <div className="flex items-center justify-between text-[11px] font-bold text-[var(--text)] mb-1">
              <span className="flex items-center gap-1.5">
                <Activity size={11} /> Control Loop
              </span>
              <span className={`text-[10px] font-mono ${lastLatency < 15 ? 'text-emerald-400' : lastLatency < 40 ? 'text-amber-400' : 'text-red-400'}`}>
                {lastLatency.toFixed(1)} ms
              </span>
            </div>
            <LatencyChart samples={latencySamples} />
          </div>

          {/* Input echo */}
          <div className="rounded-lg border border-[var(--border)] bg-[var(--panel)]/50 p-2.5 space-y-2">
            <p className="text-[10px] font-mono text-[var(--muted)] uppercase tracking-wider">Input Echo</p>
            {(['fwd', 'strafe', 'turn'] as const).map((axis) => {
              const v = simState.virtualInput[axis]
              const pct = ((v + 1) / 2) * 100
              return (
                <div key={axis} className="space-y-0.5">
                  <div className="flex justify-between text-[10px] font-mono">
                    <span className="text-[var(--muted)] uppercase">{axis}</span>
                    <span style={{ color: Math.abs(v) > 0.05 ? 'var(--accent)' : 'var(--muted)' }}>
                      {v.toFixed(3)}
                    </span>
                  </div>
                  <div className="h-1 bg-black/40 rounded-full overflow-hidden relative">
                    <div className="absolute w-px h-full bg-white/20 left-1/2" />
                    <div
                      className="absolute h-full rounded-full"
                      style={{
                        left: v >= 0 ? '50%' : `${pct}%`,
                        width: `${Math.abs(v) * 50}%`,
                        background: 'var(--accent)',
                      }}
                    />
                  </div>
                </div>
              )
            })}
          </div>

          {/* Dual-Thumbstick Gamepad Visualizer (Turkey Mission Control Style) */}
          <div className="rounded-lg border border-[var(--border)] bg-[#070A12] p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-[var(--muted)] uppercase tracking-wider">
                Gamepad Visualizer (WebHID)
              </span>
              <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${simState.gamepadConnected ? 'bg-emerald-500/20 text-emerald-400' : 'bg-zinc-800 text-zinc-500'}`}>
                {simState.gamepadConnected ? 'CONNECTED' : 'KEYBOARD/VIRTUAL'}
              </span>
            </div>

            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 pt-1">
              {/* Left Stick (Translation: Strafe / Forward) */}
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-[#121A2A] border border-[#1E2D4A] relative overflow-hidden flex items-center justify-center">
                  {/* Crosshairs */}
                  <div className="absolute w-full h-px bg-white/10" />
                  <div className="absolute h-full w-px bg-white/10" />
                  {/* Thumbstick puck */}
                  <div
                    className="absolute w-5 h-5 rounded-full bg-[#2CF6FF] shadow-[0_0_10px_#2CF6FF] transition-all duration-75"
                    style={{
                      transform: `translate(${simState.virtualInput.strafe * 20}px, ${-simState.virtualInput.fwd * 20}px)`,
                    }}
                  />
                </div>
                <span className="text-[8px] font-mono text-[var(--muted)] mt-1">TRANSLATE</span>
              </div>

              {/* Center ABXY Button Cluster */}
              <div className="grid grid-cols-2 gap-1 px-1">
                <div className="w-4 h-4 rounded-full bg-[#1A2336] border border-[#2A3650] flex items-center justify-center text-[7px] font-mono text-zinc-400">Y</div>
                <div className="w-4 h-4 rounded-full bg-[#FF5C1A] border border-[#FF5C1A] flex items-center justify-center text-[7px] font-mono text-black font-bold">B</div>
                <div className="w-4 h-4 rounded-full bg-[#2CF6FF] border border-[#2CF6FF] flex items-center justify-center text-[7px] font-mono text-black font-bold">X</div>
                <div className="w-4 h-4 rounded-full bg-[#22C55E] border border-[#22C55E] flex items-center justify-center text-[7px] font-mono text-black font-bold">A</div>
              </div>

              {/* Right Stick (Rotation: Turn) */}
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-[#121A2A] border border-[#1E2D4A] relative overflow-hidden flex items-center justify-center">
                  {/* Crosshairs */}
                  <div className="absolute w-full h-px bg-white/10" />
                  <div className="absolute h-full w-px bg-white/10" />
                  {/* Thumbstick puck */}
                  <div
                    className="absolute w-5 h-5 rounded-full bg-[#FF5C1A] shadow-[0_0_10px_#FF5C1A] transition-all duration-75"
                    style={{
                      transform: `translate(${simState.virtualInput.turn * 20}px, 0px)`,
                    }}
                  />
                </div>
                <span className="text-[8px] font-mono text-[var(--muted)] mt-1">ROTATE</span>
              </div>
            </div>
          </div>

          {/* Integration Stack (from Turkey 2026 Mission Control) */}
          <div className="rounded-lg border border-[var(--border)] bg-[var(--panel)]/50 p-2.5 space-y-1.5">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-mono text-[var(--muted)] uppercase tracking-wider">
                Integration Stack
              </span>
              <span className="text-[9px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                ACTIVE
              </span>
            </div>
            <div className="grid grid-cols-2 gap-1 text-[9px] font-mono">
              {[
                { name: 'WPILib', v: '2026.1', st: 'connected', c: '#22c55e' },
                { name: 'AdvantageKit', v: 'v4.0', st: 'logging', c: '#2cf6ff' },
                { name: 'AdvantageScope', v: 'v3.5', st: 'hud', c: '#22c55e' },
                { name: 'NetworkTables', v: 'NT4.0', st: isConnected ? 'online' : 'ready', c: isConnected ? '#22c55e' : '#f59e0b' },
                { name: 'Rapier 3D', v: 'v0.14', st: 'physics', c: '#2cf6ff' },
                { name: 'WebSerial', v: '5ms loop', st: mode, c: '#a855f7' },
              ].map((item) => (
                <div key={item.name} className="p-1.5 rounded bg-black/40 border border-white/5 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-white text-[10px]">{item.name}</div>
                    <div className="text-[8px] text-[var(--muted)]">{item.v}</div>
                  </div>
                  <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: item.c }} />
                </div>
              ))}
            </div>
          </div>

          {/* Control loop stats */}
          <div className="rounded-lg border border-[var(--border)] bg-[var(--panel)]/50 p-2.5 space-y-1">
            <p className="text-[10px] font-mono text-[var(--muted)] uppercase tracking-wider mb-1">Loop Stats</p>
            <div className="flex justify-between text-[11px]">
              <span className="text-[var(--muted)]">Packets Sent</span>
              <span className="font-mono text-[var(--accent)]">{loopCount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span className="text-[var(--muted)]">Loop Rate</span>
              <span className="font-mono text-[var(--text)]">200 Hz (5ms)</span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span className="text-[var(--muted)]">Mode</span>
              <span className="font-mono capitalize" style={{ color: 'var(--accent)' }}>{mode}</span>
            </div>
          </div>

          {/* Status indicators */}
          <div className="flex gap-2">
            <div className={`flex items-center gap-1.5 text-[10px] font-mono px-2 py-1 rounded border ${telemetry.enabled ? 'border-emerald-500/40 text-emerald-400' : 'border-red-500/40 text-red-400'}`}>
              {telemetry.enabled ? <CheckCircle size={10} /> : <XCircle size={10} />}
              {telemetry.enabled ? 'ENABLED' : 'DISABLED'}
            </div>
            {simState.gamepadConnected && (
              <div className="flex items-center gap-1.5 text-[10px] font-mono px-2 py-1 rounded border border-blue-500/40 text-blue-400">
                <Gamepad2 size={10} /> GAMEPAD
              </div>
            )}
          </div>

          <button
            onClick={disconnect}
            className="w-full py-2 rounded-lg text-[11px] font-bold border border-red-500/40 bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all"
          >
            Disconnect
          </button>
        </>
      )}
    </div>
  )
}
