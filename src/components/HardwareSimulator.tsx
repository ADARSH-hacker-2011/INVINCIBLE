import { useState } from 'react'
import {
  Zap,
  Activity,
  Cpu,
  Flame,
  ExternalLink,
  RotateCcw,
  Sliders,
  ShieldAlert,
  Maximize2,
  Minimize2,
  Layers,
  Code2,
  Check,
} from 'lucide-react'
import { useParams } from '../stores/paramStore'

export interface WokwiPreset {
  id: string
  label: string
  chip: string
  category: string
  description: string
}

export const WOKWI_PRESETS: WokwiPreset[] = [
  {
    id: '426417550801048577',
    label: 'ESP32 CAN Bus Node',
    chip: 'ESP32',
    category: 'CANbus / FRC Net',
    description: 'CAN communication node simulating FRC sensor broadcasts and frame transmission',
  },
  {
    id: '422725687364130817',
    label: 'Dual CAN Bus Network',
    chip: 'ESP32',
    category: 'CANbus / FRC Net',
    description: 'Multi-node CAN network demonstrating frame arbitration and packet filtering',
  },
  {
    id: '374311994583630849',
    label: 'Ultrasonic Distance Coprocessor',
    chip: 'ESP32',
    category: 'Sensors / Vision',
    description: 'HC-SR04 ultrasonic rangefinder for intake piece detection and proximity alert',
  },
  {
    id: '425104407781611521',
    label: 'NeoPixel RGB Canvas (CANdle)',
    chip: 'ESP32',
    category: 'Signaling / LEDs',
    description: 'Addressable RGB LED matrix for alliance status and driver signaling',
  },
  {
    id: '378750308936520705',
    label: 'Raspberry Pi Pico MicroPython',
    chip: 'RP2040',
    category: 'Coprocessor',
    description: 'RP2040 microcontroller running MicroPython edge scripts and sensor telemetry',
  },
  {
    id: '312993650809242176',
    label: 'FastLED ESP32 Underglow',
    chip: 'ESP32',
    category: 'Signaling / LEDs',
    description: 'High-speed DMA/I2S FastLED driver for robot perimeter underglow patterns',
  },
]

export function sanitizeWokwiId(input: string): string {
  const trimmed = (input || '').trim()
  const match = trimmed.match(/wokwi\.com\/projects\/([^/?#\s]+)/i)
  if (match && match[1]) {
    return match[1]
  }
  if (trimmed.startsWith('new/')) {
    return trimmed
  }
  return trimmed.replace(/^https?:\/\//i, '').replace(/^[/#]+/, '').split(/[?#]/)[0]
}

interface MotorSpec {
  name: string
  stallTorque: number // Nm
  stallCurrent: number // A
  freeSpeed: number // RPM
  freeCurrent: number // A
  resistance: number // Ohms
}

const MOTOR_DATABASE: Record<string, MotorSpec> = {
  krakenx60: {
    name: 'Kraken X60 (Brushless)',
    stallTorque: 7.09,
    stallCurrent: 366,
    freeSpeed: 6000,
    freeCurrent: 2.0,
    resistance: 0.033,
  },
  falcon500: {
    name: 'Falcon 500 (V3)',
    stallTorque: 4.69,
    stallCurrent: 257,
    freeSpeed: 6380,
    freeCurrent: 1.5,
    resistance: 0.046,
  },
  neo: {
    name: 'REV NEO (Brushless)',
    stallTorque: 3.28,
    stallCurrent: 181,
    freeSpeed: 5676,
    freeCurrent: 1.8,
    resistance: 0.066,
  },
  neo550: {
    name: 'REV NEO 550 (Auxiliary)',
    stallTorque: 0.97,
    stallCurrent: 100,
    freeSpeed: 11000,
    freeCurrent: 1.4,
    resistance: 0.12,
  },
}

export function HardwareSimulator() {
  const { values, setParam } = useParams()

  // Electrical state
  const [activeMotorKey, setActiveMotorKey] = useState<string>('krakenx60')
  const [loadTorque, setLoadTorque] = useState<number>(1.5) // Nm obstruction
  const [gearRatio, setGearRatio] = useState<number>(6.12)
  const [voltageSupply, setVoltageSupply] = useState<number>(12.6)
  const [motorTemp, setMotorTemp] = useState<number>(25.0) // °C
  const [ledPattern, setLedPattern] = useState<'alliance' | 'rainbow' | 'indexed' | 'brownout'>('alliance')
  const [wokwiProjectId, setWokwiProjectId] = useState<string>('426417550801048577') // Verified ESP32 CAN node
  const [wokwiViewMode, setWokwiViewMode] = useState<'full' | 'diagram' | 'code'>('full')
  const [isWokwiExpanded, setIsWokwiExpanded] = useState<boolean>(false)
  const [iframeRefreshKey, setIframeRefreshKey] = useState<number>(0)

  const motor = MOTOR_DATABASE[activeMotorKey] || MOTOR_DATABASE.krakenx60

  // Motor physics calculations under obstruction load
  const clampedLoad = Math.min(motor.stallTorque, Math.max(0, loadTorque))
  const loadFraction = clampedLoad / motor.stallTorque
  const currentDraw = motor.freeCurrent + loadFraction * (motor.stallCurrent - motor.freeCurrent)
  const motorRPM = Math.max(0, motor.freeSpeed * (1 - loadFraction) * (voltageSupply / 12.0))
  const mechPowerWatts = (clampedLoad * (motorRPM * 2 * Math.PI)) / 60
  const electricalPowerWatts = currentDraw * voltageSupply
  const efficiencyPct = electricalPowerWatts > 0 ? Math.min(100, (mechPowerWatts / electricalPowerWatts) * 100) : 0
  const outputWheelTorque = clampedLoad * gearRatio // Nm at wheel output shaft

  // Thermal rise calculation (I²R losses)
  const heatWatts = currentDraw * currentDraw * motor.resistance

  // PDH 24-channel current distribution simulation
  const pdhChannels = [
    { name: 'FL Drive', amps: currentDraw * 0.9, breaker: 40 },
    { name: 'FR Drive', amps: currentDraw * 0.92, breaker: 40 },
    { name: 'BL Drive', amps: currentDraw * 0.88, breaker: 40 },
    { name: 'BR Drive', amps: currentDraw * 0.91, breaker: 40 },
    { name: 'FL Steer', amps: 8.5, breaker: 30 },
    { name: 'FR Steer', amps: 9.2, breaker: 30 },
    { name: 'BL Steer', amps: 7.8, breaker: 30 },
    { name: 'BR Steer', amps: 8.1, breaker: 30 },
    { name: 'Elevator M1', amps: 22.4, breaker: 40 },
    { name: 'Elevator M2', amps: 21.8, breaker: 40 },
    { name: 'Intake Roller', amps: 14.5, breaker: 30 },
    { name: 'Shooter Flywheel', amps: 35.0, breaker: 40 },
    { name: 'Limelight 3G', amps: 2.2, breaker: 10 },
    { name: 'Pigeon 2.0 IMU', amps: 0.15, breaker: 10 },
    { name: 'CANdle LEDs', amps: 3.5, breaker: 10 },
    { name: 'roboRIO 2.0', amps: 1.8, breaker: 10 },
  ]

  const totalRobotAmps = pdhChannels.reduce((sum, ch) => sum + ch.amps, 0)
  const battInternalRes = Number(values['elec.batt_resistance']) || 0.02
  const battTerminalVoltage = Math.max(6.0, voltageSupply - totalRobotAmps * battInternalRes)
  const isBrownout = battTerminalVoltage < (Number(values['elec.brownout_v']) || 6.5)

  // LED Light Emission simulation
  const ledCount = 64
  const ledAmps = ledPattern === 'brownout' ? 0.8 : ledPattern === 'indexed' ? 2.8 : 3.6
  const lumenOutput = Math.round(ledAmps * 180) // ~650 lumens

  return (
    <div className="flex flex-col h-full overflow-y-auto bg-[#070A12] text-zinc-200 p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#1E2D4A] pb-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
            <Zap size={16} className="text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-black tracking-wider uppercase font-mono text-white">
                HARDWARE & CIRCUIT LAB
              </h2>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 font-mono border border-amber-500/30 font-bold">
                WOKWI + CAN BUS ENGINE
              </span>
            </div>
            <p className="text-[10px] text-zinc-400">
              Electrical load, thermal throttling, current sag, torque obstruction, and microcontroller emulation
            </p>
          </div>
        </div>

        {/* Global Battery Status */}
        <div className="flex items-center gap-3 font-mono text-xs">
          <div className="px-3 py-1.5 rounded-lg bg-[#121A2A] border border-[#1E2D4A] flex items-center gap-2">
            <span className="text-zinc-500 text-[10px]">TOTAL DRAW:</span>
            <span className="font-bold text-amber-400">{totalRobotAmps.toFixed(1)} A</span>
          </div>
          <div className={`px-3 py-1.5 rounded-lg border flex items-center gap-2 ${
            isBrownout
              ? 'border-red-500 bg-red-500/20 text-red-400 animate-pulse'
              : 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
          }`}>
            <span className="text-[10px]">TERMINAL V:</span>
            <span className="font-black text-sm">{battTerminalVoltage.toFixed(2)} V</span>
          </div>
        </div>
      </div>

      {/* Grid: Motor Obstruction Bench (Left) + PDH Channels & LEDs (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* ─── SECTION 1: DYNAMOMETER & MOTOR LOAD BENCH ───────────────────── */}
        <div className="rounded-xl border border-[#1E2D4A] bg-[#0A0E19] p-4 space-y-4">
          <div className="flex items-center justify-between border-b border-[#1E2D4A]/60 pb-2">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400 font-mono">
              <Activity size={14} /> Motor Dyno & Mechanical Obstruction
            </div>
            <select
              value={activeMotorKey}
              onChange={(e) => {
                setActiveMotorKey(e.target.value)
                setParam('drive.motor_drive', e.target.value)
              }}
              className="bg-black/50 border border-[#1E2D4A] text-xs font-mono text-white rounded px-2 py-1 outline-none"
            >
              {Object.entries(MOTOR_DATABASE).map(([k, m]) => (
                <option key={k} value={k}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          {/* Load Slider (The core requirement: simulating how much obstruction it handles) */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-zinc-400 flex items-center gap-1.5">
                <Sliders size={12} className="text-amber-400" /> Applied Mechanical Obstruction:
              </span>
              <span className="font-bold text-amber-400">
                {clampedLoad.toFixed(2)} Nm / {motor.stallTorque} Nm Stall
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={motor.stallTorque}
              step={0.05}
              value={clampedLoad}
              onChange={(e) => setLoadTorque(parseFloat(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer"
            />
            <div className="flex justify-between text-[9px] text-zinc-500 font-mono">
              <span>0.0 Nm (Free Spin)</span>
              <span>50% Torque</span>
              <span>100% Locked Rotor (Stall)</span>
            </div>
          </div>

          {/* Interactive Ratio & Supply Voltage Tuning */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] font-mono">
                <span className="text-zinc-400">Gear Ratio:</span>
                <span className="font-bold text-cyan-400">{gearRatio.toFixed(2)}:1</span>
              </div>
              <input
                type="range"
                min={2.0}
                max={25.0}
                step={0.1}
                value={gearRatio}
                onChange={(e) => setGearRatio(parseFloat(e.target.value))}
                className="w-full accent-cyan-500 cursor-pointer h-1.5"
              />
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] font-mono">
                <span className="text-zinc-400">Supply Voltage:</span>
                <span className="font-bold text-emerald-400">{voltageSupply.toFixed(1)} V</span>
              </div>
              <input
                type="range"
                min={9.0}
                max={13.5}
                step={0.1}
                value={voltageSupply}
                onChange={(e) => setVoltageSupply(parseFloat(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer h-1.5"
              />
            </div>
          </div>

          {/* Motor Dyno Gauges */}
          <div className="grid grid-cols-3 gap-2">
            <div className="p-2.5 rounded-lg bg-black/40 border border-[#1E2D4A] text-center">
              <div className="text-[9px] text-zinc-500 font-mono uppercase">Current Passing</div>
              <div className="text-lg font-black font-mono text-amber-400 mt-0.5">
                {currentDraw.toFixed(1)} <span className="text-xs font-normal">A</span>
              </div>
            </div>
            <div className="p-2.5 rounded-lg bg-black/40 border border-[#1E2D4A] text-center">
              <div className="text-[9px] text-zinc-500 font-mono uppercase">Shaft RPM</div>
              <div className="text-lg font-black font-mono text-cyan-400 mt-0.5">
                {Math.round(motorRPM)} <span className="text-xs font-normal">RPM</span>
              </div>
            </div>
            <div className="p-2.5 rounded-lg bg-black/40 border border-[#1E2D4A] text-center">
              <div className="text-[9px] text-zinc-500 font-mono uppercase">Wheel Output Torque</div>
              <div className="text-lg font-black font-mono text-emerald-400 mt-0.5">
                {outputWheelTorque.toFixed(1)} <span className="text-xs font-normal">Nm</span>
              </div>
            </div>
          </div>

          {/* Additional Power & Thermal metrics */}
          <div className="rounded-lg bg-[#0E1524] border border-[#1E2D4A] p-3 space-y-2 text-xs font-mono">
            <div className="flex justify-between">
              <span className="text-zinc-400">Mechanical Work Output:</span>
              <span className="font-bold text-white">{Math.round(mechPowerWatts)} Watts</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Thermal Heat Dissipation ($I^2R$):</span>
              <span className="font-bold text-orange-400 flex items-center gap-1">
                <Flame size={12} /> {Math.round(heatWatts)} W
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Motor Efficiency:</span>
              <span className="font-bold text-cyan-400">{efficiencyPct.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between items-center pt-1 border-t border-white/5">
              <span className="text-zinc-400">Simulated Motor Temp:</span>
              <div className="flex items-center gap-2">
                <span className={`font-bold ${motorTemp > 75 ? 'text-red-400' : 'text-emerald-400'}`}>
                  {(25 + (heatWatts / 80)).toFixed(1)} °C
                </span>
                <button
                  onClick={() => setMotorTemp(25.0)}
                  title="Cool motor"
                  className="p-1 rounded hover:bg-black/40 text-zinc-400 hover:text-white"
                >
                  <RotateCcw size={11} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ─── SECTION 2: REV POWER DISTRIBUTION HUB (PDH) ────────────────── */}
        <div className="rounded-xl border border-[#1E2D4A] bg-[#0A0E19] p-4 space-y-4">
          <div className="flex items-center justify-between border-b border-[#1E2D4A]/60 pb-2">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-cyan-400 font-mono">
              <Cpu size={14} /> REV PDH Channels (Live Current Draw)
            </div>
            <span className="text-[10px] font-mono text-zinc-500">16 / 24 Monitored</span>
          </div>

          {/* Channel list */}
          <div className="grid grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
            {pdhChannels.map((ch, idx) => {
              const pct = Math.min(100, (ch.amps / ch.breaker) * 100)
              const isOverCurrent = ch.amps > ch.breaker
              return (
                <div key={idx} className="p-2 rounded-lg bg-black/40 border border-white/5 space-y-1">
                  <div className="flex justify-between text-[10px] font-mono">
                    <span className="text-zinc-300 truncate" title={ch.name}>
                      {ch.name}
                    </span>
                    <span className={`font-bold ${isOverCurrent ? 'text-red-400' : pct > 70 ? 'text-amber-400' : 'text-zinc-300'}`}>
                      {ch.amps.toFixed(1)}A / {ch.breaker}A
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-[#121A2A] overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-150 ${
                        isOverCurrent ? 'bg-red-500' : pct > 70 ? 'bg-amber-400' : 'bg-cyan-400'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>

          {/* 120A Main Breaker Status */}
          <div className="p-3 rounded-lg bg-[#0E1524] border border-[#1E2D4A] flex items-center justify-between font-mono text-xs">
            <div className="flex items-center gap-2">
              <ShieldAlert size={14} className={totalRobotAmps > 120 ? 'text-red-400' : 'text-emerald-400'} />
              <div>
                <div className="font-bold text-white text-[11px]">120A Main Breaker</div>
                <div className="text-[9px] text-zinc-500">
                  Thermal trip status: {totalRobotAmps > 120 ? 'TRIP WARNING (Over 120A)' : 'NOMINAL'}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="font-black text-amber-400">{Math.round((totalRobotAmps / 120) * 100)}%</div>
              <div className="text-[8px] text-zinc-500">CAPACITY</div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── SECTION 3: ADDRESSABLE LED CANDLE (LIGHT EMISSION SIMULATOR) ─── */}
      <div className="rounded-xl border border-[#1E2D4A] bg-[#0A0E19] p-4 space-y-3">
        <div className="flex items-center justify-between border-b border-[#1E2D4A]/60 pb-2">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-400 font-mono">
            <Zap size={14} /> Addressable LED Strip (CANdle / WS2812B Light Emission)
          </div>
          <div className="flex gap-1">
            {(['alliance', 'rainbow', 'indexed', 'brownout'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setLedPattern(p)}
                className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase transition ${
                  ledPattern === p
                    ? 'bg-emerald-500 text-black font-bold'
                    : 'bg-black/30 text-zinc-400 hover:text-white border border-white/5'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* LED Visualization Strip */}
        <div className="p-3 rounded-lg bg-black/60 border border-white/10 flex items-center justify-between overflow-hidden">
          <div className="flex gap-1.5 flex-1 overflow-x-auto py-1">
            {Array.from({ length: 32 }).map((_, i) => {
              let ledColor = '#3b82f6'
              if (ledPattern === 'rainbow') {
                const hue = (i / 32) * 360
                ledColor = `hsl(${hue}, 100%, 55%)`
              } else if (ledPattern === 'indexed') {
                ledColor = '#f59e0b' // yellow note indexed
              } else if (ledPattern === 'brownout') {
                ledColor = i % 2 === 0 ? '#ef4444' : '#000000'
              }
              return (
                <div
                  key={i}
                  className="w-3.5 h-3.5 rounded-full shrink-0 shadow-sm transition-all duration-150"
                  style={{
                    background: ledColor,
                    boxShadow: `0 0 8px ${ledColor}`,
                  }}
                />
              )
            })}
          </div>
        </div>

        <div className="flex justify-between items-center text-xs font-mono text-zinc-400">
          <span>
            Light Output: <strong className="text-white">{lumenOutput} Lumens</strong> ({ledCount} LEDs)
          </span>
          <span>
            Current Passing: <strong className="text-amber-400">{ledAmps.toFixed(2)} A @ 5V DC</strong>
          </span>
        </div>
      </div>

      {/* ─── SECTION 4: WOKWI CLOUD CIRCUIT SIMULATOR EMBED ─────────────── */}
      {(() => {
        const cleanId = sanitizeWokwiId(wokwiProjectId) || '426417550801048577'
        const iframeSrc =
          wokwiViewMode === 'diagram'
            ? `https://wokwi.com/projects/${cleanId}?view=diagram`
            : wokwiViewMode === 'code'
              ? `https://wokwi.com/projects/${cleanId}?view=code`
              : `https://wokwi.com/projects/${cleanId}`
        const activePreset = WOKWI_PRESETS.find((p) => p.id === cleanId)

        return (
          <div className="rounded-xl border border-[#1E2D4A] bg-[#0A0E19] p-4 space-y-3.5">
            {/* Header row */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1E2D4A]/60 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center">
                  <Cpu size={14} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-purple-300 font-mono">
                      Wokwi Circuit & Coprocessor Emulation
                    </span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-mono font-bold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      LIVE WASM ENGINE
                    </span>
                  </div>
                  <span className="text-[10px] text-zinc-400">
                    {activePreset ? `${activePreset.label} (${activePreset.chip}) — ${activePreset.description}` : 'Custom Coprocessor / Peripheral Project'}
                  </span>
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="flex items-center gap-1.5 font-mono">
                {/* View Mode Toggle */}
                <div className="flex rounded-md bg-black/60 p-0.5 border border-[#1E2D4A]">
                  <button
                    onClick={() => setWokwiViewMode('full')}
                    className={`px-2 py-1 rounded text-[10px] font-bold transition flex items-center gap-1 ${
                      wokwiViewMode === 'full'
                        ? 'bg-purple-600 text-white shadow-sm'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                    title="Full IDE (Schematic + Code + Serial)"
                  >
                    <Layers size={11} /> Full IDE
                  </button>
                  <button
                    onClick={() => setWokwiViewMode('diagram')}
                    className={`px-2 py-1 rounded text-[10px] font-bold transition flex items-center gap-1 ${
                      wokwiViewMode === 'diagram'
                        ? 'bg-purple-600 text-white shadow-sm'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                    title="Diagram Only"
                  >
                    <Cpu size={11} /> Diagram
                  </button>
                  <button
                    onClick={() => setWokwiViewMode('code')}
                    className={`px-2 py-1 rounded text-[10px] font-bold transition flex items-center gap-1 ${
                      wokwiViewMode === 'code'
                        ? 'bg-purple-600 text-white shadow-sm'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                    title="Firmware Code Only"
                  >
                    <Code2 size={11} /> Code
                  </button>
                </div>

                {/* Refresh Iframe */}
                <button
                  onClick={() => setIframeRefreshKey((k) => k + 1)}
                  className="p-1.5 rounded-md bg-black/50 border border-[#1E2D4A] text-zinc-400 hover:text-white hover:border-zinc-500 transition"
                  title="Reload simulator iframe"
                >
                  <RotateCcw size={13} />
                </button>

                {/* Expand / Collapse Height */}
                <button
                  onClick={() => setIsWokwiExpanded((prev) => !prev)}
                  className="p-1.5 rounded-md bg-black/50 border border-[#1E2D4A] text-zinc-400 hover:text-white hover:border-zinc-500 transition"
                  title={isWokwiExpanded ? 'Collapse simulator height' : 'Expand simulator height'}
                >
                  {isWokwiExpanded ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
                </button>

                {/* Open in full Wokwi */}
                <a
                  href={`https://wokwi.com/projects/${cleanId}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 px-2 py-1 rounded-md bg-[#121A2A] border border-[#1E2D4A] text-zinc-300 hover:text-purple-300 hover:border-purple-500/50 text-[10px] transition"
                  title="Open project in dedicated Wokwi tab"
                >
                  <span>Open</span>
                  <ExternalLink size={11} />
                </a>
              </div>
            </div>

            {/* Presets Bar & Custom Input */}
            <div className="flex flex-wrap items-center justify-between gap-2 bg-[#070A12] p-2 rounded-lg border border-[#1A2336]">
              {/* Presets Chips */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider mr-1">
                  FRC Presets:
                </span>
                {WOKWI_PRESETS.map((preset) => {
                  const isSelected = cleanId === preset.id
                  return (
                    <button
                      key={preset.id}
                      onClick={() => setWokwiProjectId(preset.id)}
                      className={`px-2 py-1 rounded text-[10px] font-mono transition flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-purple-500/20 text-purple-300 border border-purple-500/60 font-bold'
                          : 'bg-black/40 text-zinc-400 hover:text-zinc-200 hover:bg-black/70 border border-white/5'
                      }`}
                      title={preset.description}
                    >
                      <span className="text-[9px] px-1 py-0.2 rounded bg-white/10 text-zinc-300 font-normal">
                        {preset.chip}
                      </span>
                      <span>{preset.label}</span>
                      {isSelected && <Check size={10} className="text-purple-400" />}
                    </button>
                  )
                })}
              </div>

              {/* Custom Input */}
              <div className="flex items-center gap-1.5 font-mono ml-auto">
                <span className="text-[10px] text-zinc-500">ID / URL:</span>
                <input
                  type="text"
                  value={wokwiProjectId}
                  onChange={(e) => setWokwiProjectId(e.target.value)}
                  placeholder="e.g. 426417550801048577 or paste link"
                  className="bg-black/60 border border-[#1E2D4A] rounded px-2 py-1 text-xs font-mono text-white w-52 placeholder:text-zinc-600 focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            {/* Live Wokwi Embed Frame */}
            <div
              className={`rounded-lg overflow-hidden border border-[#1E2D4A] relative bg-black transition-all duration-200 ${
                isWokwiExpanded ? 'h-[720px]' : 'h-[500px]'
              }`}
            >
              <iframe
                key={iframeRefreshKey}
                src={iframeSrc}
                title="Wokwi FRC Coprocessor Simulator"
                className="w-full h-full border-0"
                allow="accelerometer; ambient-light-sensor; camera; encrypted-media; geolocation; gyroscope; hid; microphone; midi; payment; usb; vr; xr-spatial-tracking; serial; clipboard-read; clipboard-write; cross-origin-isolated"
                allowFullScreen
                loading="lazy"
              />
            </div>

            {/* Footer notes & browser shield alert */}
            <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] text-zinc-500 font-mono pt-1">
              <p>
                *Runs full ESP32 and RP2040 microcontrollers directly in WebAssembly. Click the green <strong>▶ Play</strong> button inside the simulator to execute firmware and view CAN/Serial telemetry.
              </p>
              <p className="text-zinc-600">
                Note: If Brave Shields or privacy blockers prevent embed loading, click <strong className="text-purple-400">Open ↗</strong> above to launch in a dedicated tab.
              </p>
            </div>
          </div>
        )
      })()}
    </div>
  )
}
