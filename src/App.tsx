import { useEffect, useState, useRef, type ReactNode } from 'react'
import {
  Globe2,
  Bot,
  RotateCcw,
  Cpu,
  Radio,
  Sparkles,
  Zap,
  FileCode,
  ListTodo,
  Layers,
  Palette,
  Gamepad2,
  Wrench,
  Activity,
  Battery,
  Gauge,
  Check,
  Target,
  BarChart3,
  ArrowLeft,
} from 'lucide-react'
import Sim from './Sim'
import { GROUNDS, useSim, type ThemeName } from './store'
import { TeamShowcasePortal } from './components/TeamShowcasePortal'
import { AdvantageScopeHUD } from './components/AdvantageScopeHUD'
import { VirtualControls } from './components/VirtualControls'
import { CADModelLoader } from './components/CADModelLoader'
import { ParamPanel } from './components/ParamPanel'
import { InteractiveExperimentsLab } from './components/InteractiveExperimentsLab'
import { StatsPredictions } from './components/StatsPredictions'
import { DirectControlBridge } from './components/DirectControlBridge'
import { AICopilotModal } from './components/AICopilotModal'
import { HardwareSimulator } from './components/HardwareSimulator'
import { JavaConfigExporter } from './components/JavaConfigExporter'
import { RoadmapPanel } from './components/RoadmapPanel'
import { WPILibToolLauncher } from './components/WPILibToolLauncher'
import { GamepadProfileEditor } from './components/GamepadProfileEditor'

// ─── Shared Panel Wrapper ───────────────────────────────────────────────────
function Panel({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <section className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-3 mb-3 shadow-md">
      <h2
        className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider mb-2.5 pb-1 border-b border-[var(--border)]"
        style={{ color: 'var(--accent)' }}
      >
        {icon}
        {title}
      </h2>
      <div className="space-y-3">{children}</div>
    </section>
  )
}

// ─── Reusable Slider ────────────────────────────────────────────────────────
function Slider({
  label,
  value,
  min,
  max,
  step,
  unit,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  unit: string
  onChange: (v: number) => void
}) {
  return (
    <label className="block text-xs">
      <div className="flex justify-between text-[var(--muted)] mb-1 font-mono">
        <span>{label}</span>
        <span className="text-[var(--text)] font-semibold">
          {value} {unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
      />
    </label>
  )
}

// ─── Tabs Configuration ─────────────────────────────────────────────────────
export type Tab = 'sim' | 'experiments' | 'stats' | 'control' | 'hardware' | 'tools'

interface TabConfig {
  id: Tab
  label: string
  icon: ReactNode
  accentColor: string
  description: string
}

const TABS: TabConfig[] = [
  {
    id: 'sim',
    label: 'SIM',
    icon: <Globe2 size={13} />,
    accentColor: '#38bdf8',
    description: '3D Rapier Physics Simulator',
  },
  {
    id: 'experiments',
    label: 'EXPERIMENTS',
    icon: <Target size={13} />,
    accentColor: '#f97316',
    description: 'Interactive Shooter, Skidpad & CoM Labs',
  },
  {
    id: 'stats',
    label: 'PREDICTIONS',
    icon: <BarChart3 size={13} />,
    accentColor: '#4ade80',
    description: 'Sample Space, Monte Carlo & SysId Regression',
  },
  {
    id: 'control',
    label: 'CONTROL',
    icon: <Radio size={13} />,
    accentColor: '#f472b6',
    description: 'Direct Robot Link & Telemetry',
  },
  {
    id: 'hardware',
    label: 'HARDWARE',
    icon: <Zap size={13} />,
    accentColor: '#f59e0b',
    description: 'Wokwi Circuits & Motor Dyno',
  },
  {
    id: 'tools',
    label: 'WPILIB TOOLS',
    icon: <Wrench size={13} />,
    accentColor: '#a855f7',
    description: 'Launch Glass, AdvantageScope & Shuffleboard',
  },
]

// ─── Theme List ─────────────────────────────────────────────────────────────
const THEMES: { id: ThemeName; label: string; dotColor: string }[] = [
  { id: 'midnight', label: 'Midnight Blue', dotColor: '#3B82F6' },
  { id: 'argos', label: 'Argos V8 (Violet)', dotColor: '#6366F1' },
  { id: 'championship', label: 'Championship Gold', dotColor: '#EAB308' },
  { id: 'neon', label: 'Neon Cyberpunk', dotColor: '#22D3EE' },
  { id: 'ocean', label: 'Deep Ocean Teal', dotColor: '#14B8A6' },
  { id: 'ember', label: 'Ember Flame', dotColor: '#F97316' },
  { id: 'stealth', label: 'Stealth Slate', dotColor: '#94A3B8' },
]

// ─── SIM Tab Sidebar (Environment, Robot, Tuner, CAD) ───────────────────────
type SidePanel = 'environment' | 'robot' | 'params' | 'cad'

function SimSidebar() {
  const s = useSim()
  const [activePanel, setActivePanel] = useState<SidePanel>('environment')

  const planets: [string, number, string][] = [
    ['Earth', 9.81, '#38BDF8'],
    ['Moon', 1.62, '#94A3B8'],
    ['Mars', 3.71, '#F87171'],
    ['Jupiter', 24.79, '#FBBF24'],
    ['Zero-g', 0, '#A78BFA'],
  ]

  const sidePanels: { id: SidePanel; label: string; icon: ReactNode }[] = [
    { id: 'environment', label: 'Env', icon: <Globe2 size={13} /> },
    { id: 'robot', label: 'Robot', icon: <Bot size={13} /> },
    { id: 'params', label: 'Tuner', icon: <Cpu size={13} /> },
    { id: 'cad', label: 'CAD', icon: <Layers size={13} /> },
  ]

  return (
    <div className="flex h-full">
      {/* Sub-nav left rail */}
      <div className="w-16 shrink-0 border-r border-[var(--border)] flex flex-col items-center py-3 gap-2 bg-[var(--panel)]">
        {sidePanels.map((p) => (
          <button
            key={p.id}
            onClick={() => setActivePanel(p.id)}
            title={p.label}
            className={`w-12 flex flex-col items-center justify-center gap-1 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all ${
              activePanel === p.id
                ? 'bg-[var(--accent)] text-white shadow-md'
                : 'text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--panel-hover)]'
            }`}
          >
            {p.icon}
            <span className="leading-tight text-center">{p.label}</span>
          </button>
        ))}
      </div>

      {/* Panel content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activePanel === 'environment' && (
          <div className="space-y-4">
            <Panel icon={<Globe2 size={14} />} title="What-If Gravitational Environment">
              <Slider
                label="Gravity (g)"
                value={s.gravity}
                min={0}
                max={30}
                step={0.01}
                unit="m/s²"
                onChange={(v) => s.set({ gravity: v })}
              />

              <div>
                <span className="text-[10px] font-mono text-[var(--muted)] block mb-1.5 uppercase">
                  Planetary Presets
                </span>
                <div className="grid grid-cols-2 gap-1.5">
                  {planets.map(([n, g, color]) => (
                    <button
                      key={n}
                      onClick={() => s.set({ gravity: g })}
                      className={`text-[11px] font-mono p-1.5 rounded-lg border flex items-center justify-between transition-all ${
                        Math.abs(s.gravity - g) < 0.05
                          ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--text)] font-bold'
                          : 'border-[var(--border)] bg-[var(--bg)] text-[var(--muted)] hover:text-white'
                      }`}
                    >
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full" style={{ background: color }} />
                        {n}
                      </span>
                      <span className="text-[10px] text-[var(--muted)]">{g}</span>
                    </button>
                  ))}
                </div>
              </div>

              <label className="block text-xs pt-1">
                <span className="text-[var(--muted)] font-mono block mb-1">Surface Friction Preset</span>
                <select
                  value={s.groundName}
                  onChange={(e) => {
                    const g = GROUNDS.find((x) => x.name === e.target.value)!
                    s.set({ groundName: g.name, mu: g.mu })
                  }}
                >
                  {GROUNDS.map((g) => (
                    <option key={g.name} value={g.name}>
                      {g.name} (μ = {g.mu})
                    </option>
                  ))}
                </select>
              </label>

              <Slider
                label="Traction Friction (μ)"
                value={s.mu}
                min={0.05}
                max={1.8}
                step={0.01}
                unit=""
                onChange={(v) => s.set({ mu: v })}
              />
            </Panel>
          </div>
        )}

        {activePanel === 'robot' && (
          <Panel icon={<Bot size={14} />} title="Robot Powertrain & Chassis">
            <label className="block text-xs">
              <span className="text-[var(--muted)] font-mono block mb-1">Drivetrain Architecture</span>
              <select
                value={s.drivetrain}
                onChange={(e) => s.set({ drivetrain: e.target.value as 'swerve' | 'tank' })}
              >
                <option value="swerve">Swerve Drive (4-Pod Holonomic)</option>
                <option value="tank">Tank Drive (Differential 6WD)</option>
              </select>
            </label>
            <Slider
              label="Total Chassis Mass"
              value={s.robotMass}
              min={25}
              max={75}
              step={1}
              unit="kg"
              onChange={(v) => s.set({ robotMass: v })}
            />
            <Slider
              label="Motor Drive Force"
              value={s.motorForce}
              min={100}
              max={900}
              step={10}
              unit="N"
              onChange={(v) => s.set({ motorForce: v })}
            />
            <Slider
              label="Max Top Speed"
              value={s.maxSpeed}
              min={1.5}
              max={6.5}
              step={0.1}
              unit="m/s"
              onChange={(v) => s.set({ maxSpeed: v })}
            />
            <Slider
              label="Game Piece Mass"
              value={s.objectMass}
              min={0.1}
              max={2.0}
              step={0.05}
              unit="kg"
              onChange={(v) => s.set({ objectMass: v })}
            />
          </Panel>
        )}

        {activePanel === 'params' && <ParamPanel />}
        {activePanel === 'cad' && <CADModelLoader />}

        {/* Multi-AI Synergy Card */}
        {activePanel !== 'params' && (
          <div className="p-3.5 rounded-xl border border-[var(--border-bright)] bg-[var(--accent-soft)] text-xs space-y-2 mt-4">
            <div className="flex items-center gap-1.5 text-[var(--accent)] font-bold text-xs">
              <Sparkles size={14} className="animate-pulse" /> Free Multi-AI Engine Ready
            </div>
            <p className="text-[10px] text-[var(--muted)] leading-relaxed">
              Query Groq, DeepSeek R1, Mistral, and Gemini Flash directly from the AI Copilot modal for zero-cost PID & physics derivation.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Main Application Shell ─────────────────────────────────────────────────
export default function App() {
  const s = useSim()
  const [currentView, setCurrentView] = useState<'website' | 'inventory'>('website')
  const [activeTab, setActiveTab] = useState<Tab>('sim')
  const [copilotOpen, setCopilotOpen] = useState<boolean>(false)
  const [javaExporterOpen, setJavaExporterOpen] = useState<boolean>(false)
  const [roadmapOpen, setRoadmapOpen] = useState<boolean>(false)
  const [gamepadEditorOpen, setGamepadEditorOpen] = useState<boolean>(false)
  const [themePopoverOpen, setThemePopoverOpen] = useState<boolean>(false)

  const themeRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    document.documentElement.dataset.theme = s.theme
  }, [s.theme])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (themeRef.current && !themeRef.current.contains(e.target as Node)) {
        setThemePopoverOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  if (currentView === 'website') {
    return (
      <TeamShowcasePortal
        onEnterInventory={() => setCurrentView('inventory')}
        teamNumber="12364"
        teamName="THE TITANIUM TITANS"
      />
    )
  }

  return (
    <div className="flex flex-col h-screen bg-[var(--bg)] text-[var(--text)] overflow-hidden">
      {/* ── Top Header (64px) ──────────────────────────────────────────────── */}
      <header className="h-16 border-b border-[var(--border)] bg-[var(--panel)]/95 backdrop-blur-md px-5 flex items-center justify-between shrink-0 z-30 shadow-lg">
        {/* Left: Brand Logo & Mission Title */}
        <div className="flex items-center gap-4">
          {/* Back to Public Portal Button */}
          <button
            onClick={() => setCurrentView('website')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] hover:border-[var(--accent)] text-[var(--muted)] hover:text-white text-xs font-mono font-bold transition shadow-sm active:scale-95"
            title="Return to Public Team 12364 Website"
          >
            <ArrowLeft size={13} className="text-[var(--accent)]" />
            <span className="hidden sm:inline">TEAM 12364 PORTAL</span>
          </button>

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 via-indigo-500 to-pink-500 flex items-center justify-center shadow-md">
              <span className="text-white font-black text-sm">⚡</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-black tracking-wider uppercase font-mono gradient-text-brand leading-none">
                  FRC GOD PLATFORM
                </h1>
                <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                  2027
                </span>
                <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                  <span className="w-1 h-1 rounded-full bg-amber-400 animate-ping" />
                  EXPERIMENTAL LAB
                </span>
              </div>
              <span className="text-[10px] font-mono text-[var(--muted)] leading-none block mt-0.5">
                INTERNAL TESTING, SIMULATION & TOOL BRIDGE
              </span>
            </div>
          </div>

          <div className="h-6 w-px bg-[var(--border)] mx-1" />

          {/* Navigation Pill Strip */}
          <nav className="flex items-center gap-1.5">
            {TABS.map((tab) => {
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold uppercase font-mono tracking-wider transition-all ${
                    isActive
                      ? 'btn-glow'
                      : 'text-[var(--muted)] hover:text-[var(--text)] bg-[var(--bg-elevated)] border border-[var(--border)]'
                  }`}
                  style={
                    isActive
                      ? {
                          boxShadow: '0 4px 16px var(--accent-glow)',
                        }
                      : {}
                  }
                >
                  {tab.icon}
                  {tab.label}
                </button>
              )
            })}
          </nav>
        </div>

        {/* Right: Action Modals + Alliance + Themes + Respawn + E-STOP */}
        <div className="flex items-center gap-2.5">
          {/* AI Copilot Launch Button */}
          <button
            onClick={() => setCopilotOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500/15 via-purple-500/15 to-pink-500/15 border border-cyan-500/40 text-cyan-300 hover:text-white hover:border-cyan-400 text-xs font-bold font-mono transition shadow-sm hover:shadow-cyan-500/20 active:scale-95"
            title="Open AI Parameter Copilot"
          >
            <Sparkles size={13} className="text-cyan-400 animate-pulse" />
            <span>AI COPILOT</span>
          </button>

          {/* WPILib Java Config Exporter */}
          <button
            onClick={() => setJavaExporterOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 hover:text-white hover:border-emerald-400 text-xs font-bold font-mono transition shadow-sm active:scale-95"
            title="Export Tuned Swerve Configs to Java"
          >
            <FileCode size={13} className="text-emerald-400" />
            <span>EXPORT JAVA</span>
          </button>

          {/* Gamepad Profile Editor */}
          <button
            onClick={() => setGamepadEditorOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] hover:border-[var(--accent)] text-zinc-300 hover:text-white text-xs font-bold font-mono transition active:scale-95"
            title="Gamepad Sensitivity & Axis Tuning"
          >
            <Gamepad2 size={13} className="text-[var(--accent)]" />
            <span className="hidden lg:inline">GAMEPAD</span>
          </button>

          {/* Roadmap & Tasks */}
          <button
            onClick={() => setRoadmapOpen(true)}
            className="p-1.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] hover:border-purple-400 text-purple-300 hover:text-white text-xs font-mono transition active:scale-95"
            title="View Roadmap & Tasks"
          >
            <ListTodo size={15} />
          </button>

          <div className="h-6 w-px bg-[var(--border)]" />

          {/* Alliance Selector */}
          <div className="flex rounded-xl border border-[var(--border)] overflow-hidden p-0.5 bg-black/40 text-xs">
            <button
              onClick={() => s.set({ alliance: 'blue' })}
              className={`px-2.5 py-1 rounded-lg font-mono text-[11px] font-bold transition-all ${
                s.alliance === 'blue'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-[var(--muted)] hover:text-white'
              }`}
            >
              BLUE #2027
            </button>
            <button
              onClick={() => s.set({ alliance: 'red' })}
              className={`px-2.5 py-1 rounded-lg font-mono text-[11px] font-bold transition-all ${
                s.alliance === 'red'
                  ? 'bg-red-600 text-white shadow-md'
                  : 'text-[var(--muted)] hover:text-white'
              }`}
            >
              RED #2027
            </button>
          </div>

          {/* 7-Theme Picker Popover */}
          <div className="relative" ref={themeRef}>
            <button
              onClick={() => setThemePopoverOpen(!themePopoverOpen)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--muted)] hover:text-white text-xs font-mono transition"
              title="Select Visual Color Theme"
            >
              <Palette size={13} className="text-[var(--accent)]" />
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: 'var(--accent)' }} />
            </button>

            {themePopoverOpen && (
              <div
                className="absolute right-0 top-12 w-48 rounded-2xl border border-[var(--border-bright)] bg-[var(--panel)] p-2 shadow-2xl z-50 space-y-1"
                style={{ boxShadow: '0 8px 32px var(--accent-glow)' }}
              >
                <div className="text-[10px] font-mono text-[var(--faint)] px-2 py-1 uppercase">
                  Select Theme (7 Presets)
                </div>
                {THEMES.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => {
                      s.set({ theme: t.id })
                      setThemePopoverOpen(false)
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-mono transition ${
                      s.theme === t.id
                        ? 'bg-[var(--accent-soft)] text-[var(--text)] font-bold'
                        : 'text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--panel-hover)]'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ background: t.dotColor }} />
                      {t.label}
                    </span>
                    {s.theme === t.id && <Check size={13} className="text-[var(--accent)]" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Respawn */}
          <button
            onClick={s.reset}
            className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl text-black shadow-md active:scale-95 transition-all"
            style={{ background: 'var(--accent)' }}
          >
            <RotateCcw size={13} />
            <span>Respawn</span>
          </button>

          {/* E-STOP Button */}
          <button
            onClick={() => s.set({ eStop: !s.eStop })}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-mono text-xs font-black uppercase tracking-widest border transition-all active:scale-95 ${
              s.eStop
                ? 'bg-red-600 text-white border-red-500 animate-pulse shadow-lg shadow-red-600/50'
                : 'bg-red-600/10 text-red-400 border-red-600/40 hover:bg-red-600/25 hover:border-red-500 hover:text-red-300'
            }`}
            title={s.eStop ? 'E-Stop ACTIVE — click to resume' : 'Emergency Stop — halts all robot motion'}
          >
            <span className={`w-2 h-2 rounded-full ${s.eStop ? 'bg-white animate-ping' : 'bg-red-500'}`} />
            {s.eStop ? '⚠ STOPPED' : 'E-STOP'}
          </button>
        </div>
      </header>

      {/* ── Sub-Header Telemetry Status Bar (32px) ─────────────────────────── */}
      <div className="h-8 border-b border-[var(--border)] bg-[var(--bg-elevated)] px-5 flex items-center justify-between shrink-0 text-[11px] font-mono z-20">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <Gauge size={13} className="text-[var(--accent)]" />
            <span className="text-[var(--muted)]">SPEED:</span>
            <span className="text-[var(--text)] font-bold">
              {s.telemetry.speed.toFixed(2)} m/s
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <Battery size={13} className="text-emerald-400" />
            <span className="text-[var(--muted)]">BATTERY:</span>
            <span className="text-emerald-400 font-bold">
              {s.telemetry.batteryVolts.toFixed(1)} V
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <Activity size={13} className="text-purple-400" />
            <span className="text-[var(--muted)]">CONTROL LOOP:</span>
            <span className="text-[var(--accent-lite)] font-bold">
              {s.telemetry.loopTimeMs.toFixed(1)} ms (50Hz)
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[var(--muted)]">RAPIER PHYSICS:</span>
            <span className="text-emerald-400 font-bold">200Hz Sub-Stepping</span>
          </div>
        </div>

        <div className="flex items-center gap-3 text-[10px] text-[var(--muted)]">
          <span className="flex items-center gap-1">
            <Gamepad2 size={12} className={s.gamepadConnected ? 'text-emerald-400' : 'text-zinc-600'} />
            {s.gamepadConnected ? 'USB JOYSTICK CONNECTED' : 'KEYBOARD DRIVE READY'}
          </span>
          <span className="text-zinc-600">•</span>
          <span className="text-[var(--accent-lite)]">CHAMPIONSHIP DIVISION • 2027</span>
        </div>
      </div>

      {/* ── Main Application Body ──────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* ── SIM TAB ──────────────────────────────────────────────────────── */}
        {activeTab === 'sim' && (
          <>
            {/* Left Sidebar */}
            <aside className="w-96 shrink-0 border-r border-[var(--border)] bg-[var(--panel)]/80 backdrop-blur-sm z-10 overflow-hidden shadow-xl">
              <SimSidebar />
            </aside>

            {/* 3D Viewport */}
            <main className="relative flex-1 h-full">
              <Sim />

              {/* AdvantageScope HUD top-right */}
              <div className="absolute top-4 right-4 z-10 w-72 pointer-events-none">
                <AdvantageScopeHUD />
              </div>

              {/* Virtual Controls bottom-left */}
              <div className="absolute bottom-4 left-4 z-10 w-96 pointer-events-none">
                <VirtualControls onOpenGamepadEditor={() => setGamepadEditorOpen(true)} />
              </div>

              {/* Floating Quick Drive Assist Pill */}
              <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 bg-black/80 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-cyan-500/30 flex items-center gap-3 text-[11px] font-mono shadow-2xl pointer-events-auto">
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                  <span className="text-zinc-400 text-[10px]">DRIVE:</span>
                </div>
                <div className="flex items-center gap-1 font-bold">
                  {(['W', 'A', 'S', 'D'] as const).map((k) => {
                    const isDown = s.activeKeys.includes(k) || s.activeKeys.includes(k.toLowerCase())
                    return (
                      <span
                        key={k}
                        className={`px-1.5 py-0.5 rounded text-[10px] border transition-all ${
                          isDown
                            ? 'bg-cyan-500 text-black border-cyan-400 shadow-[0_0_8px_#22d3ee]'
                            : 'bg-white/5 border-white/10 text-zinc-300'
                        }`}
                      >
                        {k}
                      </span>
                    )
                  })}
                  <span className="text-zinc-600 mx-0.5">•</span>
                  {(['Q', 'E'] as const).map((k) => {
                    const isDown = s.activeKeys.includes(k) || s.activeKeys.includes(k.toLowerCase())
                    return (
                      <span
                        key={k}
                        className={`px-1.5 py-0.5 rounded text-[10px] border transition-all ${
                          isDown
                            ? 'bg-amber-500 text-black border-amber-400 shadow-[0_0_8px_#f59e0b]'
                            : 'bg-white/5 border-white/10 text-zinc-300'
                        }`}
                      >
                        {k}
                      </span>
                    )
                  })}
                </div>
                <div className="h-3 w-px bg-white/10" />
                <div className="flex gap-1">
                  {[
                    { label: 'CREEP', v: 1.5 },
                    { label: 'MATCH', v: 4.8 },
                    { label: 'TURBO', v: 6.2 },
                  ].map((preset) => (
                    <button
                      key={preset.label}
                      onClick={() => s.set({ maxSpeed: preset.v })}
                      className={`px-1.5 py-0.5 rounded text-[9px] font-bold transition ${
                        Math.abs(s.maxSpeed - preset.v) < 0.2
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                          : 'text-zinc-500 hover:text-white'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Key hint bottom-right */}
              <div className="absolute bottom-4 right-4 z-10 text-[10px] font-mono text-[var(--muted)] bg-black/70 backdrop-blur-sm px-3 py-1.5 rounded-xl border border-white/10 pointer-events-none">
                [W/A/S/D] Strafe • [Q/E] Spin • Orbit: Mouse Drag
              </div>
            </main>
          </>
        )}

        {/* ── EXPERIMENTS TAB (Interactive Mechanism & Physics Labs) ───────── */}
        {activeTab === 'experiments' && (
          <div className="flex-1 overflow-hidden">
            <InteractiveExperimentsLab />
          </div>
        )}

        {/* ── PREDICTIONS TAB (Statistics & Sample Space Analytics) ─────────── */}
        {activeTab === 'stats' && (
          <div className="flex-1 overflow-hidden">
            <StatsPredictions />
          </div>
        )}

        {/* ── CONTROL TAB ──────────────────────────────────────────────────── */}
        {activeTab === 'control' && (
          <div className="flex flex-1 overflow-hidden">
            <div className="flex-1 relative">
              <Sim />
              <div className="absolute top-4 right-4 z-10 w-72 pointer-events-none">
                <AdvantageScopeHUD />
              </div>
              <div className="absolute bottom-4 left-4 z-10 w-96 pointer-events-none">
                <VirtualControls onOpenGamepadEditor={() => setGamepadEditorOpen(true)} />
              </div>
            </div>

            <aside className="w-96 shrink-0 border-l border-[var(--border)] bg-[var(--panel)]/80 backdrop-blur-sm z-10 overflow-hidden shadow-xl">
              <DirectControlBridge />
            </aside>
          </div>
        )}

        {/* ── HARDWARE TAB ─────────────────────────────────────────────────── */}
        {activeTab === 'hardware' && (
          <div className="flex-1 overflow-hidden">
            <HardwareSimulator />
          </div>
        )}

        {/* ── TOOLS HUB TAB ────────────────────────────────────────────────── */}
        {activeTab === 'tools' && (
          <div className="flex-1 overflow-hidden">
            <WPILibToolLauncher />
          </div>
        )}
      </div>

      {/* AI Copilot Reasoning Modal */}
      <AICopilotModal isOpen={copilotOpen} onClose={() => setCopilotOpen(false)} />

      {/* WPILib Java Config Exporter Modal */}
      <JavaConfigExporter isOpen={javaExporterOpen} onClose={() => setJavaExporterOpen(false)} />

      {/* Engineering Roadmap & Tasks Modal */}
      <RoadmapPanel isOpen={roadmapOpen} onClose={() => setRoadmapOpen(false)} />

      {/* Gamepad Profile & Axis Curve Editor Modal */}
      <GamepadProfileEditor isOpen={gamepadEditorOpen} onClose={() => setGamepadEditorOpen(false)} />

      {/* ── Footer Pipeline Banner ─────────────────────────────────────────── */}
      <footer className="h-8 border-t border-[var(--border)] bg-[var(--bg-elevated)] px-5 flex items-center justify-between shrink-0 text-[10px] font-mono z-20 overflow-x-auto">
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[9px] uppercase tracking-widest text-[var(--muted)]">5ms Telemetry:</span>
          {[
            { name: 'GAMEPAD', sub: 'WebHID' },
            { name: 'WEBSOCKET', sub: '200Hz' },
            { name: 'NT4 PROTOCOL', sub: 'MsgPack' },
            { name: 'roboRIO', sub: 'Phoenix 6' },
            { name: 'RAPIER 3D', sub: 'WASM Physics' },
            { name: 'ADVANTAGESCOPE', sub: 'WPILOG' },
          ].map((step, idx, arr) => (
            <div key={step.name} className="flex items-center gap-1.5 shrink-0">
              <span className="font-bold text-[var(--text)] text-[10px]">{step.name}</span>
              <span className="text-[8px] text-[var(--muted)]">({step.sub})</span>
              {idx < arr.length - 1 && <span className="text-[var(--accent)] font-black text-[9px]">→</span>}
            </div>
          ))}
        </div>
        <div className="flex items-center gap-3 shrink-0 text-[9px] text-[var(--muted)] ml-4">
          <span className="flex items-center gap-1 text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            200Hz Deterministic Loop Active
          </span>
          <span>CHAMPIONSHIP DIVISION • 2027</span>
        </div>
      </footer>
    </div>
  )
}
