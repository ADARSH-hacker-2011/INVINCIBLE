import { useState } from 'react'
import {
  Zap,
  Shield,
  Bot,
  Cpu,
  Layers,
  Gauge,
  ArrowRight,
  ChevronRight,
  CheckCircle2,
  Sliders,
  Palette,
  Boxes,
  FlaskConical,
  AlertTriangle,
  X,
  Users,
  Compass,
} from 'lucide-react'
import { useSim, type ThemeName } from '../store'
import { RobotModelCanvas } from './RobotModelCanvas'

interface TeamShowcasePortalProps {
  onEnterInventory: () => void
  teamNumber?: string
  teamName?: string
}

export function TeamShowcasePortal({
  onEnterInventory,
  teamNumber: initialTeamNumber = '12364',
  teamName = 'THE TITANIUM TITANS',
}: TeamShowcasePortalProps) {
  const [teamNumber, setTeamNumber] = useState(initialTeamNumber)
  const [isEditingTeam, setIsEditingTeam] = useState(false)
  const [experimentalModalOpen, setExperimentalModalOpen] = useState(false)
  const { theme, alliance, set: setSimState } = useSim()

  const THEMES: { id: ThemeName; label: string; color: string }[] = [
    { id: 'argos', label: 'Argos Indigo', color: '#6366F1' },
    { id: 'midnight', label: 'Midnight Blue', color: '#3B82F6' },
    { id: 'ocean', label: 'Ocean Teal', color: '#14B8A6' },
    { id: 'ember', label: 'Ember Orange', color: '#F97316' },
    { id: 'championship', label: 'Championship Gold', color: '#EAB308' },
    { id: 'neon', label: 'Neon Cyberpunk', color: '#10B981' },
    { id: 'stealth', label: 'Stealth Carbon', color: '#71717A' },
  ]

  const SUBSYSTEMS = [
    {
      id: '01',
      title: 'Swerve Drive System',
      tag: 'MOBILITY',
      icon: <Cpu className="w-6 h-6 text-cyan-400" />,
      desc: 'Four independent steering modules with Kraken X60 motors. Fast, omnidirectional translation with automated traction control and smooth steering.',
      specs: ['4.8 m/s (15.7 ft/s) Top Speed', 'Instant Multi-Directional Strafing', 'Regulated Field Carpet Calibration'],
    },
    {
      id: '02',
      title: 'High-Speed Elevator',
      tag: 'LIFT MECHANISM',
      icon: <Layers className="w-6 h-6 text-purple-400" />,
      desc: 'Rapid vertical lift powered by dual brushless motors. Balanced weight transfer prevents tilting during fast auto-scoring runs.',
      specs: ['Full 1.2m Lift in 0.42 Seconds', 'Smooth Motion Profiling', 'Automatic Balance Compensation'],
    },
    {
      id: '03',
      title: 'Dual-Wheel Note Launcher',
      tag: 'SCORING SYSTEM',
      icon: <Zap className="w-6 h-6 text-amber-400" />,
      desc: 'Twin high-speed compliant wheels with automated motorized angle adjustment. Predicts aerodynamic flight curves and locks onto target speakers.',
      specs: ['6,000 RPM Max Wheel Speed', 'Automated Target Lock', 'Consistent Flight Trajectory'],
    },
    {
      id: '04',
      title: 'Smart Optical Tracking',
      tag: 'VISION & AI',
      icon: <Gauge className="w-6 h-6 text-emerald-400" />,
      desc: 'Four high-speed cameras continuously reading field AprilTag markers to pinpoint the exact location on the field within centimeters.',
      specs: ['Quad Wide-Angle Cameras', 'Field Target Identification', 'Sub-Centimeter Accuracy'],
    },
  ]

  const STATS = [
    { label: 'TOP SPEED', value: '4.8 m/s', sub: 'High-Power Brushless Motors' },
    { label: 'SIMULATION RATE', value: '200 Hz', sub: 'Smooth Real-Time Physics' },
    { label: 'CONTROL FREQUENCY', value: '50 Hz', sub: 'Official Match Loop Standard' },
    { label: 'INTERNAL TOOLS', value: '13 Apps', sub: 'Desktop Testing Suite' },
  ]

  const DIVISIONS = [
    {
      title: 'Mechanical Design & CAD',
      icon: <Boxes className="w-5 h-5 text-cyan-400" />,
      desc: 'Full 3D modeling, precision CNC fabrication, and structural balance for rapid game piece manipulation.',
    },
    {
      title: 'Autonomous & Controls',
      icon: <Sliders className="w-5 h-5 text-purple-400" />,
      desc: 'Custom motion profiling, sensor fusion, and 15-second multi-piece autonomous scoring routines.',
    },
    {
      title: 'Electrical & Sensors',
      icon: <Bot className="w-5 h-5 text-amber-400" />,
      desc: '24-channel power distribution, CAN bus telemetry, ultrasonic sensors, and addressable signaling LEDs.',
    },
    {
      title: 'Drive Team & Match Strategy',
      icon: <Compass className="w-5 h-5 text-emerald-400" />,
      desc: 'Tactical defense analysis, alliance coordination, and rapid-response pit maintenance.',
    },
  ]

  const handleOpenExperimentalModal = () => {
    setExperimentalModalOpen(true)
  }

  const handleConfirmEnterLab = () => {
    setExperimentalModalOpen(false)
    onEnterInventory()
  }

  return (
    <div className="w-full min-h-screen bg-[var(--bg)] text-[var(--text)] font-sans antialiased overflow-x-hidden selection:bg-[var(--accent)] selection:text-white">
      {/* ── Ambient Background Lighting ───────────────────────────────── */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div
          className="absolute -top-48 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] rounded-full blur-[160px] opacity-20"
          style={{ background: 'radial-gradient(circle, var(--accent) 0%, var(--grad-to) 100%)' }}
        />
        <div className="absolute top-[800px] -left-64 w-[700px] h-[500px] rounded-full blur-[180px] opacity-10 bg-cyan-600" />
        <div className="absolute top-[1200px] -right-64 w-[700px] h-[500px] rounded-full blur-[180px] opacity-10 bg-purple-600" />
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage:
              'linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />
      </div>

      {/* ── Top Navigation Bar ────────────────────────────────────────── */}
      <header className="relative z-30 h-20 border-b border-[var(--border)] bg-[var(--panel)]/80 backdrop-blur-2xl px-6 md:px-14 flex items-center justify-between">
        {/* Left: Emblem & Team Title */}
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 via-indigo-600 to-pink-500 p-0.5 shadow-lg shadow-indigo-500/20 flex items-center justify-center">
            <div className="w-full h-full bg-[var(--panel)] rounded-[14px] flex items-center justify-center">
              <Shield className="w-5 h-5 text-cyan-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono font-bold tracking-widest uppercase text-cyan-400">
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
                  className="w-20 px-1.5 py-0.5 rounded text-xs bg-[var(--bg-elevated)] border border-[var(--accent)] font-mono text-center outline-none ml-1"
                />
              ) : (
                <button
                  onClick={() => setIsEditingTeam(true)}
                  className="text-[10px] font-mono text-[var(--muted)] hover:text-[var(--accent)] underline ml-1"
                  title="Click to edit team number"
                >
                  Edit #
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Center / Right Nav Items */}
        <div className="flex items-center gap-4 sm:gap-6">
          <nav className="hidden lg:flex items-center gap-6 text-xs font-mono font-semibold text-[var(--muted)]">
            <a href="#robot" className="hover:text-[var(--text)] transition-colors">
              ROBOT
            </a>
            <a href="#subsystems" className="hover:text-[var(--text)] transition-colors">
              MECHANISMS
            </a>
            <a href="#divisions" className="hover:text-[var(--text)] transition-colors">
              TEAM DIVISIONS
            </a>
            <a href="#lab" className="hover:text-[var(--text)] transition-colors">
              LAB ACCESS
            </a>
          </nav>

          {/* Quick Theme Switcher */}
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
                title={`Theme: ${t.label}`}
              />
            ))}
          </div>

          {/* Enter Experimental Lab Action Button */}
          <button
            onClick={handleOpenExperimentalModal}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-mono text-xs font-bold tracking-wider uppercase transition-all shadow-lg active:scale-95 group"
            style={{
              background: 'linear-gradient(135deg, var(--accent) 0%, var(--grad-to) 100%)',
              color: '#ffffff',
              boxShadow: '0 4px 20px var(--accent-glow)',
            }}
          >
            <FlaskConical className="w-4 h-4 text-amber-300 group-hover:rotate-12 transition-transform" />
            <span>ENTER LAB (EXPERIMENTAL)</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </header>

      {/* ── Hero Showcase Section with Underlying 3D Robot Canvas ─────── */}
      <section id="robot" className="relative z-10 pt-16 pb-20 px-6 md:px-14 max-w-7xl mx-auto">
        {/* Championship Pill Badge */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-[var(--bg-elevated)] border border-[var(--border-bright)] shadow-md backdrop-blur-md">
            <Zap className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-mono font-semibold tracking-wider text-[var(--muted)]">
              FRC WORLD CHAMPIONSHIP CONTENDER • 2027 CHASSIS
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          </div>
        </div>

        {/* 2-Column Hero: Left Typography & Stats, Right 3D Robot Canvas */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          {/* Left Column (6 cols) */}
          <div className="lg:col-span-6 flex flex-col text-left">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight font-mono leading-[1.08] mb-6">
              Championship Robotics, <br />
              <span className="gradient-text-brand drop-shadow-sm">
                Engineered for Dominance.
              </span>
            </h1>

            <p className="text-base sm:text-lg text-[var(--muted)] font-sans font-normal leading-relaxed mb-8">
              Official web portal of FRC Team {teamNumber}. Designed with high-performance swerve kinematics, real-time WPILib wire telemetry, and precision autonomous navigation.
            </p>

            {/* CTA Buttons Row */}
            <div className="flex flex-col sm:flex-row items-center gap-4 mb-10">
              <button
                onClick={handleOpenExperimentalModal}
                className="w-full sm:w-auto flex items-center justify-center gap-3 px-7 py-3.5 rounded-2xl text-xs font-mono font-bold tracking-wider uppercase transition-all shadow-xl active:scale-95 group text-white"
                style={{
                  background: 'linear-gradient(135deg, var(--accent) 0%, var(--grad-to) 100%)',
                  boxShadow: '0 8px 30px var(--accent-glow)',
                }}
              >
                <FlaskConical className="w-4 h-4 text-amber-300 group-hover:scale-110 transition-transform" />
                <span>ENTER ENGINEERING LAB</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>

              <a
                href="#subsystems"
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl text-xs font-mono font-semibold tracking-wider text-[var(--muted)] hover:text-[var(--text)] bg-[var(--bg-elevated)] border border-[var(--border)] hover:border-[var(--accent)] transition-all shadow-sm"
              >
                <span>EXPLORE MECHANISMS</span>
              </a>
            </div>

            {/* Key Metrics Row */}
            <div className="grid grid-cols-2 gap-3.5 w-full">
              {STATS.map((m, i) => (
                <div
                  key={i}
                  className="p-3.5 rounded-2xl bg-[var(--panel)]/70 border border-[var(--border)] backdrop-blur-md text-left flex flex-col justify-between hover:border-[var(--border-bright)] transition-all"
                >
                  <span className="text-[10px] font-mono font-bold text-[var(--muted)] tracking-wider">
                    {m.label}
                  </span>
                  <span className="text-xl sm:text-2xl font-black font-mono text-[var(--text)] mt-1">
                    {m.value}
                  </span>
                  <span className="text-[11px] font-mono text-cyan-400 mt-1 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3 h-3" />
                    {m.sub}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column (6 cols): 3D Robot Interactive Canvas */}
          <div className="lg:col-span-6 w-full">
            <RobotModelCanvas alliance={alliance} teamNumber={teamNumber} />
          </div>
        </div>
      </section>

      {/* ── Subsystems & Mechanisms Section ───────────────────────────── */}
      <section id="subsystems" className="relative z-10 py-24 px-6 md:px-14 max-w-7xl mx-auto border-t border-[var(--border)]">
        <div className="max-w-3xl mb-16">
          <div className="inline-flex items-center gap-2 text-xs font-mono font-bold tracking-widest uppercase text-cyan-400 mb-3">
            <Sliders className="w-4 h-4" />
            <span>ROBOT ARCHITECTURE</span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black font-mono tracking-tight text-[var(--text)] mb-4">
            Subsystems & Mechanisms
          </h2>
          <p className="text-base text-[var(--muted)] font-sans leading-relaxed">
            Every mechanism on Team {teamNumber}&apos;s robot is designed for rapid game piece scoring, extreme field durability, and precision closed-loop control.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {SUBSYSTEMS.map((sub) => (
            <div
              key={sub.id}
              className="p-8 rounded-3xl bg-[var(--panel)] border border-[var(--border)] hover:border-[var(--border-bright)] transition-all flex flex-col justify-between shadow-xl"
            >
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="p-3 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border)]">
                    {sub.icon}
                  </div>
                  <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-[var(--accent-soft)] text-[var(--accent)] border border-[var(--accent-glow)]">
                    {sub.tag}
                  </span>
                </div>

                <div className="flex items-center gap-3 mb-2">
                  <span className="text-xs font-mono font-black text-[var(--muted)]">#{sub.id}</span>
                  <h3 className="text-xl font-bold font-mono text-[var(--text)]">
                    {sub.title}
                  </h3>
                </div>

                <p className="text-sm text-[var(--muted)] leading-relaxed mb-6 font-sans">
                  {sub.desc}
                </p>
              </div>

              <div className="pt-5 border-t border-[var(--border)] space-y-2">
                {sub.specs.map((spec, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs font-mono text-[var(--muted)]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
                    <span>{spec}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Team Divisions & Structure Section ────────────────────────── */}
      <section id="divisions" className="relative z-10 py-24 px-6 md:px-14 max-w-7xl mx-auto border-t border-[var(--border)]">
        <div className="max-w-3xl mb-16">
          <div className="inline-flex items-center gap-2 text-xs font-mono font-bold tracking-widest uppercase text-cyan-400 mb-3">
            <Users className="w-4 h-4" />
            <span>STUDENT & MENTOR EXCELLENCE</span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black font-mono tracking-tight text-[var(--text)] mb-4">
            Team Divisions
          </h2>
          <p className="text-base text-[var(--muted)] font-sans leading-relaxed">
            Organized like a professional engineering firm. Students collaborate with industry mentors across four core engineering pillars.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          {DIVISIONS.map((div, idx) => (
            <div
              key={idx}
              className="p-6 rounded-3xl bg-[var(--bg-elevated)] border border-[var(--border)] hover:border-[var(--accent)] transition-all flex flex-col justify-between"
            >
              <div>
                <div className="p-3 rounded-2xl bg-[var(--panel)] border border-[var(--border)] w-fit mb-4">
                  {div.icon}
                </div>
                <h3 className="text-base font-bold font-mono text-[var(--text)] mb-2">
                  {div.title}
                </h3>
                <p className="text-xs text-[var(--muted)] leading-relaxed font-sans">
                  {div.desc}
                </p>
              </div>
              <div className="mt-6 pt-3 border-t border-[var(--border)] flex items-center justify-between text-[11px] font-mono text-emerald-400 font-semibold">
                <span>TEAM 12364</span>
                <span>ACTIVE</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Experimental Engineering Lab Access Gateway ───────────────── */}
      <section id="lab" className="relative z-10 py-24 px-6 md:px-14 max-w-7xl mx-auto border-t border-[var(--border)]">
        <div className="rounded-3xl glass-luxury p-8 sm:p-12 md:p-16 border border-[var(--border-bright)] relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-10">
          <div className="max-w-xl text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-mono font-bold mb-4">
              <FlaskConical className="w-3.5 h-3.5" />
              <span>EXPERIMENTAL TESTING ENVIRONMENT</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black font-mono tracking-tight text-[var(--text)] mb-4">
              Enter Team 12364 Engineering Lab
            </h2>
            <p className="text-sm sm:text-base text-[var(--muted)] leading-relaxed font-sans mb-6">
              Access the complete testing suite: real-time 3D Rapier swerve physics simulator, 13 native desktop WPILib tools (Glass, AdvantageScope, SysId), and motor dynamometer benches.
            </p>
            <div className="flex items-center gap-2 text-xs font-mono text-amber-400/90">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>Notice: This is an internal testing lab for active driver practice and code development.</span>
            </div>
          </div>

          <button
            onClick={handleOpenExperimentalModal}
            className="shrink-0 flex items-center gap-3 px-8 py-5 rounded-2xl font-mono text-sm font-bold tracking-wider uppercase text-white shadow-2xl transition-all active:scale-95 group"
            style={{
              background: 'linear-gradient(135deg, var(--accent) 0%, var(--grad-to) 100%)',
              boxShadow: '0 8px 32px var(--accent-glow)',
            }}
          >
            <FlaskConical className="w-5 h-5 text-amber-300 group-hover:rotate-12 transition-transform" />
            <span>LAUNCH EXPERIMENTAL LAB</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1.5 transition-transform" />
          </button>
        </div>
      </section>

      {/* ── Partner & Technology Ecosystem ───────────────────────────── */}
      <footer className="relative z-10 border-t border-[var(--border)] bg-[var(--panel)]/80 py-14 px-6 md:px-14 text-center text-xs font-mono text-[var(--muted)]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-cyan-400" />
            <span className="font-bold text-[var(--text)]">FRC TEAM {teamNumber}</span>
            <span>•</span>
            <span>CHAMPIONSHIP PLATFORM 2027</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-[11px]">
            <span>FIRST® Robotics</span>
            <span>WPILib</span>
            <span>AdvantageScope</span>
            <span>CTRE Phoenix 6</span>
            <span>REV Robotics</span>
            <span>Swerve Drive Specialties</span>
          </div>

          <button
            onClick={handleOpenExperimentalModal}
            className="text-[var(--accent)] hover:underline flex items-center gap-1.5 font-bold"
          >
            <span>Launch Experimental Lab</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </footer>

      {/* ── Experimental Lab Confirmation Modal ──────────────────────── */}
      {experimentalModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg p-6 sm:p-8 rounded-3xl bg-[var(--panel)] border border-[var(--border-bright)] shadow-2xl glass-luxury">
            {/* Close Button */}
            <button
              onClick={() => setExperimentalModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--muted)] hover:text-white transition"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Modal Content */}
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-300">
                <FlaskConical className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-mono font-bold tracking-widest text-amber-400 uppercase">
                  INTERNAL R&D WORKBENCH
                </span>
                <h3 className="text-xl font-bold font-mono text-[var(--text)]">
                  Entering Experimental Lab
                </h3>
              </div>
            </div>

            <p className="text-sm text-[var(--muted)] leading-relaxed mb-6 font-sans">
              You are switching from the Team 12364 public website to the <strong className="text-[var(--text)]">internal engineering and simulation lab</strong>.
            </p>

            {/* Warning Checklist */}
            <div className="p-4 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border)] space-y-3 mb-6 text-xs font-mono text-[var(--muted)]">
              <div className="flex items-start gap-2.5">
                <span className="text-amber-400 font-bold shrink-0">⚠️</span>
                <span><strong className="text-[var(--text)]">Active 200Hz Physics</strong>: Runs live rigid-body Rapier dynamics, carpet friction, and back-EMF deceleration.</span>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="text-cyan-400 font-bold shrink-0">🛠️</span>
                <span><strong className="text-[var(--text)]">Local Tool Launcher</strong>: Can spawn native WPILib desktop executables (Glass, AdvantageScope) on your computer.</span>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="text-emerald-400 font-bold shrink-0">⚡</span>
                <span><strong className="text-[var(--text)]">Experimental Testing</strong>: Contains parameter tuning, hardware Wokwi bridges, and motor dyno stress testing.</span>
              </div>
            </div>

            {/* Modal Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <button
                onClick={handleConfirmEnterLab}
                className="w-full sm:flex-1 py-3 px-5 rounded-xl font-mono text-xs font-bold tracking-wider uppercase text-white shadow-lg transition active:scale-95 flex items-center justify-center gap-2"
                style={{
                  background: 'linear-gradient(135deg, var(--accent) 0%, var(--grad-to) 100%)',
                }}
              >
                <FlaskConical className="w-4 h-4 text-amber-300" />
                <span>UNDERSTOOD, ENTER LAB</span>
              </button>

              <button
                onClick={() => setExperimentalModalOpen(false)}
                className="w-full sm:w-auto py-3 px-5 rounded-xl font-mono text-xs font-bold text-[var(--muted)] hover:text-white bg-[var(--bg-elevated)] border border-[var(--border)] transition"
              >
                STAY ON WEBSITE
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
