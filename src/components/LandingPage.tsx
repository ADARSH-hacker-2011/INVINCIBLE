import { useState } from 'react'
import {
  Zap,
  Bot,
  ArrowRight,
  Shield,
  Activity,
  Cpu,
  Layers,
  Gauge,
  Terminal,
  Sliders,
  Wrench,
  Flame,
  Sparkles,
  ChevronRight,
  CheckCircle2,
  Palette,
} from 'lucide-react'
import { useSim, type ThemeName } from '../store'

interface LandingPageProps {
  onEnterLab: () => void
  teamNumber?: string
  teamName?: string
}

export function LandingPage({
  onEnterLab,
  teamNumber: initialTeamNumber = '1236',
  teamName = 'THE TITANIUM TITANS',
}: LandingPageProps) {
  const [teamNumber, setTeamNumber] = useState(initialTeamNumber)
  const [isEditingTeam, setIsEditingTeam] = useState(false)
  const { theme, set: setSimState } = useSim()

  const THEMES: { id: ThemeName; label: string; color: string }[] = [
    { id: 'argos', label: 'Argos Indigo', color: '#6366F1' },
    { id: 'midnight', label: 'Midnight Blue', color: '#3B82F6' },
    { id: 'ocean', label: 'Ocean Teal', color: '#14B8A6' },
    { id: 'ember', label: 'Ember Orange', color: '#F97316' },
    { id: 'championship', label: 'Championship Gold', color: '#EAB308' },
    { id: 'neon', label: 'Neon Cyberpunk', color: '#10B981' },
    { id: 'stealth', label: 'Stealth Carbon', color: '#71717A' },
  ]

  const CAPABILITIES = [
    {
      icon: <Cpu className="w-5 h-5 text-cyan-400" />,
      title: '200 Hz Deterministic Physics',
      desc: 'Rapier 3D rigid body dynamics decoupled from render deltas. Real carpet friction (μ=1.15), motor back-EMF, and dynamic Center-of-Mass shift.',
      tag: 'CORE ENGINE',
    },
    {
      icon: <Terminal className="w-5 h-5 text-emerald-400" />,
      title: 'Native WPILib Tool Suite',
      desc: 'One-click desktop execution for Glass, AdvantageScope, Shuffleboard, and SysId directly from the web command center via local bridge.',
      tag: 'NATIVE EXE',
    },
    {
      icon: <Activity className="w-5 h-5 text-purple-400" />,
      title: 'Interactive Physics Labs',
      desc: 'Live aerodynamic note shooter ballistics, swerve skidpad friction circles, superstructure tilt boundaries, and motor thermal ODE dyno.',
      tag: 'EXPERIMENTS',
    },
    {
      icon: <Gauge className="w-5 h-5 text-amber-400" />,
      title: 'Monte Carlo & SysId Regression',
      desc: '100Hz parallel Web Worker trajectory distributions, Ordinary Least Squares kV/kA system identification, and 150s battery drain modeling.',
      tag: 'PREDICTIONS',
    },
    {
      icon: <Sliders className="w-5 h-5 text-pink-400" />,
      title: 'CTRE Phoenix 6 & WPILib Configs',
      desc: 'Real-time gamepad axis calibration with deadbands and cubic polynomial shaping, instantly exportable to clean Java robot code.',
      tag: 'CODE EXPORT',
    },
    {
      icon: <Layers className="w-5 h-5 text-blue-400" />,
      title: 'Multi-Sensor & AprilTag Fusion',
      desc: 'PhotonVision MultiTag 3D camera raycasting, Pigeon 2.0 gyro drift modeling, and Wokwi virtual hardware CANdle status signaling.',
      tag: 'AVENUE 2027',
    },
  ]

  const SPEC_METRICS = [
    { label: 'PEAK VELOCITY', value: '4.8 m/s', sub: 'Kraken X60 FOC' },
    { label: 'PHYSICS INTEGRATION', value: '200 Hz', sub: 'Deterministic Sub-steps' },
    { label: 'CONTROL FREQUENCY', value: '50 Hz', sub: 'WPILib Loop Sync' },
    { label: 'CARPET FRICTION', value: 'μ = 1.15', sub: 'Regulation Field Standard' },
  ]

  const SUBSYSTEMS = [
    { name: 'Drivetrain', detail: 'SDS MK4i L3 Swerve, 4x Kraken X60 Motors, CANcoder Absolute' },
    { name: 'Superstructure', detail: 'Dual-Stage Cascading Elevator, 0–1.2m Continuous Range' },
    { name: 'Shooter System', detail: 'Twin 4" Compliant Flywheels, Closed-Loop Flywheel Bang-Bang / PIDF' },
    { name: 'Vision Pipeline', detail: 'Quad-Camera AprilTag 3D Pose Estimation with Latency Compensation' },
  ]

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] font-sans antialiased overflow-x-hidden selection:bg-[var(--accent)] selection:text-white">
      {/* ── Background Glow & Grid Ornaments ───────────────────────────── */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div
          className="absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[550px] rounded-full blur-[140px] opacity-25"
          style={{ background: 'radial-gradient(circle, var(--accent) 0%, var(--grad-to) 100%)' }}
        />
        <div className="absolute top-[600px] -left-48 w-[600px] h-[400px] rounded-full blur-[160px] opacity-15 bg-cyan-600" />
        <div className="absolute top-[800px] -right-48 w-[600px] h-[400px] rounded-full blur-[160px] opacity-15 bg-purple-600" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              'linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
      </div>

      {/* ── Top Navigation Bar ────────────────────────────────────────────── */}
      <header className="relative z-20 h-20 border-b border-[var(--border)] bg-[var(--panel)]/80 backdrop-blur-xl px-6 md:px-12 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 via-indigo-600 to-pink-500 p-0.5 shadow-lg shadow-indigo-500/25 flex items-center justify-center">
            <div className="w-full h-full bg-[var(--panel)] rounded-[14px] flex items-center justify-center">
              <Zap className="w-5 h-5 text-cyan-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold tracking-widest uppercase text-cyan-400">
                FIRST® ROBOTICS COMPETITION
              </span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                2027 ACTIVE
              </span>
            </div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-black tracking-tight font-mono text-[var(--text)]">
                TEAM {teamNumber}
              </h1>
              <span className="text-xs font-bold text-[var(--muted)]">•</span>
              <span className="text-xs font-mono font-semibold tracking-wider text-[var(--muted)]">
                {teamName}
              </span>
              {isEditingTeam ? (
                <input
                  type="text"
                  value={teamNumber}
                  onChange={(e) => setTeamNumber(e.target.value)}
                  onBlur={() => setIsEditingTeam(false)}
                  onKeyDown={(e) => e.key === 'Enter' && setIsEditingTeam(false)}
                  autoFocus
                  className="w-16 px-1.5 py-0.5 rounded text-xs bg-[var(--bg-elevated)] border border-[var(--accent)] font-mono text-center outline-none"
                />
              ) : (
                <button
                  onClick={() => setIsEditingTeam(true)}
                  className="text-[10px] font-mono text-[var(--muted)] hover:text-[var(--accent)] underline ml-1"
                  title="Click to change team number"
                >
                  Edit #
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Center / Right Nav Elements */}
        <div className="flex items-center gap-4">
          {/* Theme Quick Selector */}
          <div className="hidden sm:flex items-center gap-1.5 p-1 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)]">
            <Palette className="w-3.5 h-3.5 text-[var(--muted)] ml-1" />
            {THEMES.slice(0, 4).map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  setSimState({ theme: t.id })
                  document.documentElement.dataset.theme = t.id
                }}
                className={`w-5 h-5 rounded-lg transition-transform ${
                  theme === t.id ? 'scale-110 ring-2 ring-white/50' : 'opacity-70 hover:opacity-100'
                }`}
                style={{ backgroundColor: t.color }}
                title={`Switch theme: ${t.label}`}
              />
            ))}
          </div>

          {/* Primary Action Button to enter Backend Lab */}
          <button
            onClick={onEnterLab}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-mono text-xs font-bold tracking-wider uppercase transition-all shadow-lg active:scale-95 group"
            style={{
              background: 'linear-gradient(135deg, var(--accent) 0%, var(--grad-to) 100%)',
              color: '#ffffff',
              boxShadow: '0 4px 20px var(--accent-glow)',
            }}
          >
            <Bot className="w-4 h-4 text-white group-hover:rotate-12 transition-transform" />
            <span>ENTER LAB & SIMULATOR</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </header>

      {/* ── Hero Section ─────────────────────────────────────────────────── */}
      <section className="relative z-10 pt-16 pb-20 px-6 md:px-12 max-w-7xl mx-auto flex flex-col items-center text-center">
        {/* Championship Pill */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--bg-elevated)] border border-[var(--border-bright)] shadow-md mb-8 backdrop-blur-md">
          <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
          <span className="text-xs font-mono font-semibold tracking-wider text-[var(--muted)]">
            FRC GOD PLATFORM 2027 • OFFICIAL WORKBENCH
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
        </div>

        {/* Hero Title */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight font-mono max-w-5xl leading-[1.08] mb-6">
          Welcome to <br />
          <span className="gradient-text-brand drop-shadow-sm">
            FRC Team {teamNumber}
          </span>
        </h1>

        <p className="text-base sm:text-xl text-[var(--muted)] max-w-2xl font-sans font-normal leading-relaxed mb-10">
          World-class robotics engineering, full-physics swerve simulation, real-time WPILib telemetry, and advanced autonomous path planning for the 2027 championship season.
        </p>

        {/* Hero Action CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full justify-center max-w-md mb-16">
          <button
            onClick={onEnterLab}
            className="w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-4 rounded-2xl text-sm font-mono font-bold tracking-wider uppercase transition-all shadow-xl active:scale-95 group text-white"
            style={{
              background: 'linear-gradient(135deg, var(--accent) 0%, var(--grad-to) 100%)',
              boxShadow: '0 8px 30px var(--accent-glow)',
            }}
          >
            <Zap className="w-5 h-5 text-amber-300 group-hover:scale-110 transition-transform" />
            <span>LAUNCH SIMULATOR & BACKEND</span>
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>

          <a
            href="#capabilities"
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-4 rounded-2xl text-sm font-mono font-semibold tracking-wider text-[var(--muted)] hover:text-[var(--text)] bg-[var(--bg-elevated)] border border-[var(--border)] hover:border-[var(--accent)] transition-all shadow-sm"
          >
            <span>EXPLORE PLATFORM</span>
          </a>
        </div>

        {/* ── Metric Badges ────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-4xl">
          {SPEC_METRICS.map((m, i) => (
            <div
              key={i}
              className="p-4 rounded-2xl bg-[var(--panel)]/70 border border-[var(--border)] backdrop-blur-md text-left flex flex-col justify-between hover:border-[var(--border-bright)] transition-all"
            >
              <span className="text-[11px] font-mono font-bold text-[var(--muted)] tracking-wider">
                {m.label}
              </span>
              <span className="text-2xl font-black font-mono text-[var(--text)] mt-1">
                {m.value}
              </span>
              <span className="text-[11px] font-mono text-cyan-400 mt-1 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                {m.sub}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Subsystem Architecture Highlights ────────────────────────────── */}
      <section className="relative z-10 py-16 px-6 md:px-12 max-w-7xl mx-auto border-t border-[var(--border)]">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono font-bold tracking-widest uppercase text-cyan-400 mb-2">
              <Shield className="w-4 h-4" />
              <span>ROBOT CHASSIS & MECHANISMS</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-black font-mono tracking-tight text-[var(--text)]">
              Subsystem Specifications
            </h2>
          </div>
          <p className="text-sm text-[var(--muted)] max-w-md font-sans">
            Calibrated against real-world FRC field tolerances, Krakens X60 dyno thermal limits, and 2027 game piece dynamics.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {SUBSYSTEMS.map((sub, i) => (
            <div
              key={i}
              className="p-5 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border)] hover:border-[var(--accent)] transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-[var(--accent-soft)] text-[var(--accent)]">
                    #0{i + 1}
                  </span>
                  <Wrench className="w-4 h-4 text-[var(--muted)]" />
                </div>
                <h3 className="text-base font-bold font-mono text-[var(--text)] mb-1">
                  {sub.name}
                </h3>
                <p className="text-xs text-[var(--muted)] leading-relaxed font-sans">
                  {sub.detail}
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-[var(--border)] flex items-center justify-between text-[11px] font-mono text-[var(--muted)]">
                <span>STATUS</span>
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  CALIBRATED
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Engineering Capabilities Grid ─────────────────────────────────── */}
      <section id="capabilities" className="relative z-10 py-16 px-6 md:px-12 max-w-7xl mx-auto border-t border-[var(--border)]">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-[var(--accent-soft)] text-[var(--accent)] text-xs font-mono font-bold mb-3">
            <Flame className="w-3.5 h-3.5" />
            <span>ADVANCED ROBOTICS CAPABILITIES</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-black font-mono tracking-tight text-[var(--text)] mb-4">
            Six Pillars of Team {teamNumber} Engineering
          </h2>
          <p className="text-sm md:text-base text-[var(--muted)]">
            Everything your drive team, autonomous programmers, and mechanical engineers need in one unified, real-time command station.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {CAPABILITIES.map((cap, i) => (
            <div
              key={i}
              className="p-6 rounded-2xl bg-[var(--panel)] border border-[var(--border)] hover:border-[var(--border-bright)] transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] group-hover:scale-105 transition-transform">
                    {cap.icon}
                  </div>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[var(--bg-elevated)] text-[var(--muted)] border border-[var(--border)]">
                    {cap.tag}
                  </span>
                </div>
                <h3 className="text-lg font-bold font-mono text-[var(--text)] mb-2 group-hover:text-[var(--accent-lite)] transition-colors">
                  {cap.title}
                </h3>
                <p className="text-xs text-[var(--muted)] leading-relaxed">
                  {cap.desc}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-[var(--border)] flex items-center justify-between text-xs font-mono font-semibold text-[var(--accent)]">
                <span>View in Lab</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Big Call To Action Banner ────────────────────────────────────── */}
      <section className="relative z-10 py-16 px-6 md:px-12 max-w-7xl mx-auto">
        <div
          className="rounded-3xl p-8 md:p-14 border border-[var(--border-bright)] backdrop-blur-xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8"
          style={{
            background:
              'linear-gradient(135deg, rgba(17,25,39,0.95) 0%, rgba(13,20,36,0.95) 100%)',
          }}
        >
          <div className="max-w-xl text-left">
            <span className="text-xs font-mono font-bold tracking-wider text-cyan-400 uppercase">
              READY FOR DRIVER PRACTICE & TUNING
            </span>
            <h2 className="text-3xl md:text-4xl font-black font-mono tracking-tight text-[var(--text)] mt-2 mb-4">
              Enter the Team {teamNumber} Engineering Lab
            </h2>
            <p className="text-sm text-[var(--muted)] leading-relaxed">
              Drive with virtual touch joysticks or USB Xbox controller, run ballistic trajectories, tune swerve PIDF parameters, and launch native WPILib tools immediately.
            </p>
          </div>

          <button
            onClick={onEnterLab}
            className="shrink-0 flex items-center gap-3 px-8 py-5 rounded-2xl font-mono text-sm font-bold tracking-wider uppercase text-white shadow-2xl transition-all active:scale-95 group"
            style={{
              background: 'linear-gradient(135deg, var(--accent) 0%, var(--grad-to) 100%)',
              boxShadow: '0 8px 32px var(--accent-glow)',
            }}
          >
            <Bot className="w-5 h-5 text-white group-hover:rotate-12 transition-transform" />
            <span>ENTER BACKEND LAB NOW</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1.5 transition-transform" />
          </button>
        </div>
      </section>

      {/* ── Partner & Technology Ecosystem ───────────────────────────────── */}
      <footer className="relative z-10 border-t border-[var(--border)] bg-[var(--panel)]/90 py-10 px-6 md:px-12 text-center text-xs font-mono text-[var(--muted)]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[var(--text)]">FRC TEAM {teamNumber}</span>
            <span>•</span>
            <span>GOD PLATFORM 2027</span>
          </div>
          <div className="flex items-center gap-6">
            <span>WPILib</span>
            <span>AdvantageScope</span>
            <span>CTRE Phoenix 6</span>
            <span>REVLib</span>
            <span>PathPlanner</span>
            <span>PhotonVision</span>
          </div>
          <button
            onClick={onEnterLab}
            className="text-[var(--accent)] hover:underline flex items-center gap-1 font-bold"
          >
            <span>Open Simulator Backend</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </footer>
    </div>
  )
}
