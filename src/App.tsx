import { useEffect, useState, type ReactNode } from 'react'
import {
  Globe2,
  Bot,
  RotateCcw,
  Cpu,
  FlaskConical,
  Radio,
  Sparkles,
  ChevronRight,
  Zap,
  FileCode,
} from 'lucide-react'
import Sim from './Sim'
import { GROUNDS, useSim, type ThemeName } from './store'
import { AdvantageScopeHUD } from './components/AdvantageScopeHUD'
import { VirtualControls } from './components/VirtualControls'
import { CADModelLoader } from './components/CADModelLoader'
import { ParamPanel } from './components/ParamPanel'
import { MonteCarloRunner } from './components/MonteCarloRunner'
import { DirectControlBridge } from './components/DirectControlBridge'
import { AICopilotModal } from './components/AICopilotModal'
import { HardwareSimulator } from './components/HardwareSimulator'
import { JavaConfigExporter } from './components/JavaConfigExporter'

// ─── Shared panel wrapper ───────────────────────────────────────────────────
function Panel({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <section className="rounded-xl border border-[var(--border)] bg-[var(--panel)] p-3 mb-3">
      <h2
        className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider mb-2"
        style={{ color: 'var(--accent)' }}
      >
        {icon}
        {title}
      </h2>
      <div className="space-y-3">{children}</div>
    </section>
  )
}

// ─── Reusable slider ────────────────────────────────────────────────────────
function Slider({
  label, value, min, max, step, unit, onChange,
}: {
  label: string; value: number; min: number; max: number; step: number; unit: string; onChange: (v: number) => void
}) {
  return (
    <label className="block text-xs">
      <div className="flex justify-between text-[var(--muted)] mb-1 font-mono">
        <span>{label}</span>
        <span className="text-[var(--text)] font-semibold">{value} {unit}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))} />
    </label>
  )
}

// ─── Tab type ───────────────────────────────────────────────────────────────
type Tab = 'sim' | 'test' | 'control' | 'hardware'

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
    description: '3D Physics Simulator',
  },
  {
    id: 'test',
    label: 'TEST',
    icon: <FlaskConical size={13} />,
    accentColor: '#4ade80',
    description: 'Monte Carlo Robustness',
  },
  {
    id: 'control',
    label: 'CONTROL',
    icon: <Radio size={13} />,
    accentColor: '#f472b6',
    description: 'Direct Robot Link',
  },
  {
    id: 'hardware',
    label: 'HARDWARE',
    icon: <Zap size={13} />,
    accentColor: '#f59e0b',
    description: 'Wokwi Circuits & Motor Dyno',
  },
]

// ─── SIM tab sidebar (existing controls + 190-param engine) ─────────────────
type SidePanel = 'environment' | 'robot' | 'params' | 'cad'

function SimSidebar() {
  const s = useSim()
  const [activePanel, setActivePanel] = useState<SidePanel>('environment')

  const planets: [string, number][] = [
    ['Earth', 9.81], ['Moon', 1.62], ['Mars', 3.71], ['Jupiter', 24.79], ['Zero-g', 0],
  ]

  const sidePanels: { id: SidePanel; label: string; icon: ReactNode }[] = [
    { id: 'environment', label: 'Env', icon: <Globe2 size={11} /> },
    { id: 'robot', label: 'Robot', icon: <Bot size={11} /> },
    { id: 'params', label: 'Tuner', icon: <Cpu size={11} /> },
    { id: 'cad', label: 'CAD', icon: <ChevronRight size={11} /> },
  ]

  return (
    <div className="flex h-full">
      {/* Sub-nav icons */}
      <div className="w-14 shrink-0 border-r border-[var(--border)] flex flex-col items-center py-2 gap-1 bg-[var(--panel)]/50">
        {sidePanels.map((p) => (
          <button
            key={p.id}
            onClick={() => setActivePanel(p.id)}
            title={p.label}
            className={`w-10 flex flex-col items-center justify-center gap-0.5 py-2 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all ${
              activePanel === p.id
                ? 'bg-[var(--accent)]/15 text-[var(--accent)] border border-[var(--accent)]/30'
                : 'text-[var(--muted)] hover:text-[var(--text)] hover:bg-black/20'
            }`}
          >
            {p.icon}
            <span className="leading-tight text-center">{p.label}</span>
          </button>
        ))}
      </div>

      {/* Panel content */}
      <div className="flex-1 overflow-y-auto p-3">
        {activePanel === 'environment' && (
          <>
            <Panel icon={<Globe2 size={14} />} title="What-If Environment">
              <Slider label="Gravity" value={s.gravity} min={0} max={30} step={0.01} unit="m/s²"
                onChange={(v) => s.set({ gravity: v })} />
              <div className="flex flex-wrap gap-1">
                {planets.map(([n, g]) => (
                  <button
                    key={n}
                    onClick={() => s.set({ gravity: g })}
                    className={`text-[10px] font-mono px-2 py-0.5 rounded border border-[var(--border)] hover:bg-[var(--bg)] transition-colors ${
                      Math.abs(s.gravity - g) < 0.05
                        ? 'border-[var(--accent)] text-[var(--accent)] font-bold'
                        : 'text-[var(--muted)]'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
              <label className="block text-xs">
                <span className="text-[var(--muted)] font-mono block mb-1">Surface Preset</span>
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
              <Slider label="Traction Friction (μ)" value={s.mu} min={0.05} max={1.8} step={0.01} unit=""
                onChange={(v) => s.set({ mu: v })} />
            </Panel>
          </>
        )}

        {activePanel === 'robot' && (
          <Panel icon={<Bot size={14} />} title="Robot & Powertrain">
            <label className="block text-xs">
              <span className="text-[var(--muted)] font-mono block mb-1">Drivetrain Architecture</span>
              <select
                value={s.drivetrain}
                onChange={(e) => s.set({ drivetrain: e.target.value as 'swerve' | 'tank' })}
              >
                <option value="swerve">Swerve Drive (4-Pod Holonomic)</option>
                <option value="tank">Tank Drive (Differential)</option>
              </select>
            </label>
            <Slider label="Total Robot Mass" value={s.robotMass} min={25} max={75} step={1} unit="kg"
              onChange={(v) => s.set({ robotMass: v })} />
            <Slider label="Max Motor Drive Force" value={s.motorForce} min={100} max={900} step={10} unit="N"
              onChange={(v) => s.set({ motorForce: v })} />
            <Slider label="Max Linear Speed" value={s.maxSpeed} min={1.5} max={6.5} step={0.1} unit="m/s"
              onChange={(v) => s.set({ maxSpeed: v })} />
            <Slider label="Game Piece Mass" value={s.objectMass} min={0.1} max={2.0} step={0.05} unit="kg"
              onChange={(v) => s.set({ objectMass: v })} />
          </Panel>
        )}

        {activePanel === 'params' && <ParamPanel />}
        {activePanel === 'cad' && <CADModelLoader />}

        {/* Multi-AI synergy box (always at bottom of SIM sidebar) */}
        {activePanel !== 'params' && (
          <div className="p-3 rounded-xl border border-sky-500/20 bg-sky-950/20 text-xs space-y-1.5 mt-2">
            <div className="flex items-center gap-1.5 text-sky-400 font-bold text-[11px]">
              <Sparkles size={13} /> Multi-AI Synergy
            </div>
            <p className="text-[10px] text-[var(--muted)] leading-relaxed">
              🤖 <strong>DeepSeek</strong>: Swerve IK math, PID tuning<br />
              🦙 <strong>Meta AI</strong>: Standalone canvas modules<br />
              🧠 <strong>Claude</strong>: Architecture reviews<br />
              ⚡ <strong>Antigravity</strong>: Live pair programming
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Main App ───────────────────────────────────────────────────────────────
export default function App() {
  const s = useSim()
  const [activeTab, setActiveTab] = useState<Tab>('sim')
  const [copilotOpen, setCopilotOpen] = useState<boolean>(false)
  const [javaExporterOpen, setJavaExporterOpen] = useState<boolean>(false)

  useEffect(() => {
    document.documentElement.dataset.theme = s.theme
  }, [s.theme])

  const currentTab = TABS.find((t) => t.id === activeTab)!

  return (
    <div className="flex flex-col h-full bg-[var(--bg)] text-[var(--text)] overflow-hidden">
      {/* ── Top Mission Control Header ────────────────────────────────────── */}
      <header className="h-12 border-b border-[var(--border)] bg-[var(--panel)]/90 backdrop-blur-md px-4 flex items-center justify-between shrink-0 z-20">
        {/* Left: Brand + Tab navigation */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <h1 className="text-sm font-black tracking-wider uppercase font-mono">
              FRC <span style={{ color: 'var(--accent)' }}>SIM LAB</span>
            </h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-black/40 text-[var(--muted)] border border-[var(--border)] hidden sm:inline">
              MISSION CONTROL • 2027
            </span>
          </div>

          {/* AI Copilot Launch Button */}
          <button
            onClick={() => setCopilotOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gradient-to-r from-cyan-500/15 via-purple-500/15 to-pink-500/15 border border-cyan-500/40 text-cyan-300 hover:text-white hover:border-cyan-400 text-[11px] font-bold font-mono transition shadow-sm hover:shadow-cyan-500/20 active:scale-95"
            title="Open AI Natural Language Parameter Copilot"
          >
            <Sparkles size={12} className="text-cyan-400 animate-pulse" />
            <span>AI COPILOT</span>
          </button>

          {/* WPILib Java Config Exporter Launch Button */}
          <button
            onClick={() => setJavaExporterOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 hover:text-white hover:border-emerald-400 text-[11px] font-bold font-mono transition shadow-sm active:scale-95"
            title="Export Tuned Swerve Configs to Official WPILib Java Code"
          >
            <FileCode size={12} className="text-emerald-400" />
            <span>EXPORT JAVA</span>
          </button>

          {/* Tab buttons */}
          <nav className="flex gap-1">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all ${
                  activeTab === tab.id
                    ? 'text-black'
                    : 'text-[var(--muted)] hover:text-[var(--text)] bg-black/20'
                }`}
                style={
                  activeTab === tab.id
                    ? { background: tab.accentColor }
                    : {}
                }
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Right: Alliance + Theme + Reset */}
        <div className="flex items-center gap-2">
          {/* Alliance Selector */}
          <div className="flex rounded-lg border border-[var(--border)] overflow-hidden p-0.5 bg-black/30 text-xs">
            <button
              onClick={() => s.set({ alliance: 'blue' })}
              className={`px-2 py-0.5 rounded font-mono text-[11px] transition-colors ${
                s.alliance === 'blue' ? 'bg-blue-600 text-white font-bold' : 'text-[var(--muted)] hover:text-white'
              }`}
            >
              BLUE #2027
            </button>
            <button
              onClick={() => s.set({ alliance: 'red' })}
              className={`px-2 py-0.5 rounded font-mono text-[11px] transition-colors ${
                s.alliance === 'red' ? 'bg-red-600 text-white font-bold' : 'text-[var(--muted)] hover:text-white'
              }`}
            >
              RED #2027
            </button>
          </div>

          {/* Theme Selector */}
          <div className="flex gap-1">
            {(['midnight', 'ocean', 'ember'] as ThemeName[]).map((t) => (
              <button
                key={t}
                onClick={() => s.set({ theme: t })}
                className={`text-[10px] font-mono px-2 py-1 rounded border capitalize transition-all ${
                  s.theme === t
                    ? 'border-[var(--accent)] bg-[var(--accent)]/15 text-[var(--accent)] font-bold'
                    : 'border-[var(--border)] bg-black/30 text-[var(--muted)]'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <button
            onClick={s.reset}
            className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded text-black shadow-md active:scale-95 transition-all"
            style={{ background: 'var(--accent)' }}
          >
            <RotateCcw size={13} />
            <span>Respawn</span>
          </button>
        </div>
      </header>

      {/* ── Tab indicator strip ───────────────────────────────────────────── */}
      <div
        className="h-0.5 transition-all duration-300"
        style={{ background: currentTab.accentColor, opacity: 0.7 }}
      />

      {/* ── Main Body ─────────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden relative">

        {/* ── SIM TAB ──────────────────────────────────────────────────── */}
        {activeTab === 'sim' && (
          <>
            {/* Left Sidebar */}
            <aside className="w-84 shrink-0 border-r border-[var(--border)] bg-[var(--panel)]/70 backdrop-blur-sm z-10 overflow-hidden">
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
                <VirtualControls />
              </div>

              {/* Floating Quick Drive Assist Pill (Solves the "where are the controls" user problem) */}
              <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-cyan-500/30 flex items-center gap-3 text-[11px] font-mono shadow-xl pointer-events-auto">
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
                {/* Speed Multiplier Quick Toggle */}
                <div className="flex gap-1">
                  {[
                    { label: 'CREEP', v: 2.5 },
                    { label: 'MATCH', v: 4.8 },
                    { label: 'TURBO', v: 6.0 },
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
              <div className="absolute bottom-4 right-4 z-10 text-[10px] font-mono text-[var(--muted)] bg-black/60 px-2.5 py-1 rounded border border-white/10 pointer-events-none">
                KEYS: [W/A/S/D] Strafe • [Q/E] Spin • [Arrows] Drive • Orbit: Drag mouse
              </div>
            </main>
          </>
        )}

        {/* ── TEST TAB ─────────────────────────────────────────────────── */}
        {activeTab === 'test' && (
          <div className="flex flex-1 overflow-hidden">
            {/* Left: param panel (test category focused) */}
            <aside className="w-84 shrink-0 border-r border-[var(--border)] bg-[var(--panel)]/70 backdrop-blur-sm z-10 overflow-hidden">
              <ParamPanel />
            </aside>

            {/* Right: Monte Carlo */}
            <main className="flex-1 overflow-hidden bg-[var(--bg)]">
              <MonteCarloRunner />
            </main>
          </div>
        )}

        {/* ── CONTROL TAB ──────────────────────────────────────────────── */}
        {activeTab === 'control' && (
          <div className="flex flex-1 overflow-hidden">
            {/* Left: 3D Sim (for visual reference while controlling) */}
            <div className="flex-1 relative">
              <Sim />
              <div className="absolute top-4 right-4 z-10 w-72 pointer-events-none">
                <AdvantageScopeHUD />
              </div>
              <div className="absolute bottom-4 left-4 z-10 w-96 pointer-events-none">
                <VirtualControls />
              </div>
              <div className="absolute bottom-4 right-4 z-10 text-[10px] font-mono text-[var(--muted)] bg-black/60 px-2.5 py-1 rounded border border-white/10 pointer-events-none">
                KEYS: [W/A/S/D] Strafe • [Q/E] Spin
              </div>
            </div>

            {/* Right: Direct Control Bridge panel */}
            <aside className="w-84 shrink-0 border-l border-[var(--border)] bg-[var(--panel)]/70 backdrop-blur-sm z-10 overflow-hidden">
              <DirectControlBridge />
            </aside>
          </div>
        )}

        {/* ── HARDWARE TAB (Wokwi & Motor Dyno Lab) ────────────────────── */}
        {activeTab === 'hardware' && (
          <div className="flex-1 overflow-hidden">
            <HardwareSimulator />
          </div>
        )}
      </div>

      {/* AI Copilot Interactive Reasoning Modal */}
      <AICopilotModal isOpen={copilotOpen} onClose={() => setCopilotOpen(false)} />

      {/* WPILib Java Config Exporter Modal */}
      <JavaConfigExporter isOpen={javaExporterOpen} onClose={() => setJavaExporterOpen(false)} />

      {/* ── Architecture Pipeline Flow Banner (from Turkey 2026 Mission Control) ── */}
      <footer className="h-8 border-t border-[var(--border)] bg-[#070A12] px-4 flex items-center justify-between shrink-0 text-[10px] font-mono z-20 overflow-x-auto">
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[9px] uppercase tracking-widest text-[var(--muted)]">5ms Pipeline:</span>
          {[
            { name: 'GAMEPAD', sub: 'WebHID' },
            { name: 'WEBSOCKET', sub: '200Hz' },
            { name: 'FASTAPI/NT4', sub: 'Bridge' },
            { name: 'roboRIO', sub: 'WPILib' },
            { name: 'RAPIER 3D', sub: 'WASM Physics' },
            { name: 'ADVANTAGESCOPE', sub: 'Log / HUD' },
          ].map((step, idx, arr) => (
            <div key={step.name} className="flex items-center gap-1.5 shrink-0">
              <span className="font-bold text-white text-[10px]">{step.name}</span>
              <span className="text-[8px] text-[var(--muted)]">({step.sub})</span>
              {idx < arr.length - 1 && <span className="text-[var(--accent)] font-black text-[9px]">→</span>}
            </div>
          ))}
        </div>
        <div className="flex items-center gap-3 shrink-0 text-[9px] text-[var(--muted)] ml-4">
          <span className="flex items-center gap-1 text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            200Hz Loop Active
          </span>
          <span>TURKEY REGIONAL • 2027</span>
        </div>
      </footer>
    </div>
  )
}
