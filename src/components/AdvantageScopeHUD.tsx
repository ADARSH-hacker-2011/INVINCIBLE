import { Gauge, Zap, Activity, Navigation, Compass } from 'lucide-react'
import { useSim, type SwerveModuleState } from '../store'

function ModuleVector({ mod, label }: { mod: SwerveModuleState; label: string }) {
  const angleDeg = (mod.angle * 180) / Math.PI
  const speedPct = Math.min(100, (mod.speed / 5.0) * 100)
  
  // Arrow vector components
  const arrowLength = Math.max(12, (speedPct / 100) * 26)
  const rad = mod.angle
  const dx = Math.sin(rad) * arrowLength
  const dy = -Math.cos(rad) * arrowLength

  return (
    <div className="flex flex-col items-center p-2 rounded-lg bg-[var(--bg)]/80 border border-[var(--border)]">
      <div className="flex items-center justify-between w-full text-[10px] text-[var(--muted)] font-mono mb-1">
        <span className="font-bold text-[var(--text)]">{label}</span>
        <span>{mod.speed.toFixed(1)} m/s</span>
      </div>

      {/* Vector Compass Canvas */}
      <div className="relative w-14 h-14 rounded-full border border-[var(--border)] bg-black/40 flex items-center justify-center overflow-hidden">
        {/* Crosshairs */}
        <div className="absolute w-full h-[1px] bg-white/10" />
        <div className="absolute h-full w-[1px] bg-white/10" />

        {/* Center pivot */}
        <div className="w-1.5 h-1.5 rounded-full bg-white/40" />

        {/* Dynamic Vector Arrow */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="-28 -28 56 56">
          <line
            x1="0"
            y1="0"
            x2={dx}
            y2={dy}
            stroke="var(--accent)"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          {speedPct > 5 && (
            <circle
              cx={dx}
              cy={dy}
              r="2.5"
              fill="var(--accent)"
            />
          )}
        </svg>
      </div>

      <div className="mt-1 text-[9px] font-mono text-[var(--muted)]">
        {angleDeg.toFixed(0)}°
      </div>
    </div>
  )
}

export function AdvantageScopeHUD() {
  const { telemetry, swerveModules, drivetrain } = useSim()
  const [fl, fr, bl, br] = swerveModules

  return (
    <aside className="space-y-3 pointer-events-auto">
      {/* AdvantageScope Swerve Module Vector Display */}
      {drivetrain === 'swerve' && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--panel)]/95 backdrop-blur-md p-3 shadow-xl">
          <div className="flex items-center justify-between gap-2 mb-2 pb-1 border-b border-[var(--border)]">
            <span className="flex items-center gap-1.5 text-xs font-bold text-[var(--accent)] uppercase tracking-wider">
              <Compass size={14} /> Swerve Modules
            </span>
            <span className="text-[10px] font-mono text-[var(--muted)]">AdvantageScope</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <ModuleVector mod={fl} label="FL" />
            <ModuleVector mod={fr} label="FR" />
            <ModuleVector mod={bl} label="BL" />
            <ModuleVector mod={br} label="BR" />
          </div>
        </div>
      )}

      {/* Main Robot Telemetry Card */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--panel)]/95 backdrop-blur-md p-3 shadow-xl space-y-2">
        <div className="flex items-center justify-between pb-1 border-b border-[var(--border)]">
          <span className="flex items-center gap-1.5 text-xs font-bold text-[var(--accent)] uppercase tracking-wider">
            <Activity size={14} /> Robot Telemetry
          </span>
          <span className="text-[10px] font-mono text-emerald-400">ONLINE</span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-2 rounded-lg bg-[var(--bg)]/80 border border-[var(--border)]">
            <div className="text-[10px] text-[var(--muted)] flex items-center gap-1">
              <Gauge size={11} /> Chassis Speed
            </div>
            <div className="text-sm font-bold font-mono text-[var(--text)] mt-0.5">
              {telemetry.speed.toFixed(2)} <span className="text-[10px] font-normal text-[var(--muted)]">m/s</span>
            </div>
          </div>

          <div className="p-2 rounded-lg bg-[var(--bg)]/80 border border-[var(--border)]">
            <div className="text-[10px] text-[var(--muted)] flex items-center gap-1">
              <Navigation size={11} /> Acceleration
            </div>
            <div className="text-sm font-bold font-mono text-[var(--text)] mt-0.5">
              {telemetry.accel.toFixed(2)} <span className="text-[10px] font-normal text-[var(--muted)]">m/s²</span>
            </div>
          </div>

          <div className="p-2 rounded-lg bg-[var(--bg)]/80 border border-[var(--border)]">
            <div className="text-[10px] text-[var(--muted)] flex items-center gap-1">
              <Zap size={11} /> Battery Sag
            </div>
            <div className="text-sm font-bold font-mono text-[var(--text)] mt-0.5">
              {telemetry.batteryVolts.toFixed(2)} <span className="text-[10px] font-normal text-[var(--muted)]">V</span>
            </div>
          </div>

          <div className="p-2 rounded-lg bg-[var(--bg)]/80 border border-[var(--border)]">
            <div className="text-[10px] text-[var(--muted)] flex items-center gap-1">
              <Activity size={11} /> RIO Loop Time
            </div>
            <div className="text-sm font-bold font-mono text-[var(--text)] mt-0.5">
              {telemetry.loopTimeMs.toFixed(1)} <span className="text-[10px] font-normal text-[var(--muted)]">ms</span>
            </div>
          </div>
        </div>

        {/* Pose Readout */}
        <div className="p-2 rounded-lg bg-[var(--bg)]/60 border border-[var(--border)] font-mono text-[10px] flex justify-between text-[var(--muted)]">
          <span>X: <b className="text-[var(--text)]">{telemetry.pose.x.toFixed(2)}m</b></span>
          <span>Z: <b className="text-[var(--text)]">{telemetry.pose.z.toFixed(2)}m</b></span>
          <span>Yaw: <b className="text-[var(--text)]">{((telemetry.pose.heading * 180) / Math.PI).toFixed(0)}°</b></span>
        </div>
      </div>
    </aside>
  )
}
