import { useState, useEffect } from 'react'
import {
  RefreshCw,
  Info,
  Terminal,
  Play,
  CheckCircle2,
  AlertCircle,
  FolderOpen,
} from 'lucide-react'

export interface WPITool {
  id: string
  name: string
  exeName: string
  description: string
  icon: string
  category: 'dashboard' | 'analysis' | 'path' | 'system'
  officialDocs: string
}

export const WPILIB_DESKTOP_TOOLS: WPITool[] = [
  {
    id: 'glass',
    name: 'WPILib Glass',
    exeName: 'glass.exe',
    description: 'ImGui C++ real-time NetworkTables 4 dashboard with live hardware plotting, field, and mechanism views',
    icon: '🔷',
    category: 'dashboard',
    officialDocs: 'https://docs.wpilib.org/en/stable/docs/software/dashboards/glass/index.html',
  },
  {
    id: 'advantagescope',
    name: 'AdvantageScope',
    exeName: 'AdvantageScope.exe',
    description: 'Official high-performance robot log visualizer & 3D field viewer for AdvantageKit (.wpilog)',
    icon: '🔭',
    category: 'analysis',
    officialDocs: 'https://github.com/Mechanical-Advantage/AdvantageScope',
  },
  {
    id: 'shuffleboard',
    name: 'Shuffleboard',
    exeName: 'Shuffleboard.exe',
    description: 'Extensible JavaFX FRC driver station dashboard with customizable tab layouts & sensor widgets',
    icon: '📊',
    category: 'dashboard',
    officialDocs: 'https://docs.wpilib.org/en/stable/docs/software/dashboards/shuffleboard/index.html',
  },
  {
    id: 'sysid',
    name: 'WPILib SysId',
    exeName: 'sysid.exe',
    description: 'System Identification tool suite: Quasistatic & Dynamic characterization for feedforward (kS/kV/kA)',
    icon: '⚡',
    category: 'analysis',
    officialDocs: 'https://docs.wpilib.org/en/stable/docs/software/advanced-controls/system-identification/index.html',
  },
  {
    id: 'elastic',
    name: 'Elastic Dashboard',
    exeName: 'Elastic.exe',
    description: 'Fast, modern, GPU-accelerated driver dashboard with auto-layout and camera stream support',
    icon: '⚡',
    category: 'dashboard',
    officialDocs: 'https://github.com/Gold872/elastic-dashboard',
  },
  {
    id: 'outlineviewer',
    name: 'OutlineViewer',
    exeName: 'outlineviewer.exe',
    description: 'Low-level NetworkTables 4 browser to inspect, debug, and publish raw NT key-value topic trees',
    icon: '🌿',
    category: 'system',
    officialDocs: 'https://docs.wpilib.org/en/stable/docs/software/network-communication/index.html',
  },
  {
    id: 'pathweaver',
    name: 'PathWeaver',
    exeName: 'PathWeaver.exe',
    description: 'Visual autonomous path trajectory designer for differential and tank drivetrains',
    icon: '🗺️',
    category: 'path',
    officialDocs: 'https://docs.wpilib.org/en/stable/docs/software/pathplanning/pathweaver/index.html',
  },
  {
    id: 'datalogtool',
    name: 'DataLogTool',
    exeName: 'datalogtool.exe',
    description: 'Download, inspect, and convert on-robot .wpilog binary data logs directly from roboRIO storage',
    icon: '💾',
    category: 'analysis',
    officialDocs: 'https://docs.wpilib.org/en/stable/docs/software/telemetry/datalog.html',
  },
  {
    id: 'robotbuilder',
    name: 'RobotBuilder',
    exeName: 'RobotBuilder.exe',
    description: 'Graphical command-based robot project generator for rapid WPILib Java scaffolding',
    icon: '🤖',
    category: 'system',
    officialDocs: 'https://docs.wpilib.org/en/stable/docs/software/wpilib-tools/robotbuilder/index.html',
  },
]

type FilterCategory = 'all' | 'dashboard' | 'analysis' | 'path' | 'system'

export function WPILibToolLauncher() {
  const [filter, setFilter] = useState<FilterCategory>('all')
  const [installedExes, setInstalledExes] = useState<string[]>([])
  const [toolsDir, setToolsDir] = useState<string>('C:\\Users\\Public\\wpilib\\2026\\tools')
  const [launchStatus, setLaunchStatus] = useState<{ id: string; message: string; ok: boolean } | null>(null)
  const [loading, setLoading] = useState(false)

  // Fetch installed tools from Vite bridge
  const refreshInstalledTools = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/tools/list')
      const data = await res.json()
      if (data.tools) {
        setInstalledExes(data.tools.map((t: string) => t.toLowerCase()))
        if (data.toolsDir) setToolsDir(data.toolsDir)
      }
    } catch (err) {
      console.warn('Could not contact Vite WPILib bridge:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refreshInstalledTools()
  }, [])

  // Launch tool via local Vite bridge
  const launchTool = async (tool: WPITool) => {
    try {
      setLaunchStatus({ id: tool.id, message: `Starting ${tool.exeName}...`, ok: true })
      const res = await fetch(`/api/tools/launch?tool=${encodeURIComponent(tool.exeName)}`)
      const data = await res.json()
      if (data.success) {
        setLaunchStatus({
          id: tool.id,
          message: `✅ Launched ${tool.exeName} (PID: ${data.pid || 'Process Active'})! Check your taskbar.`,
          ok: true,
        })
      } else {
        setLaunchStatus({
          id: tool.id,
          message: `❌ Failed: ${data.error || 'Executable not found'}`,
          ok: false,
        })
      }
    } catch (err: any) {
      setLaunchStatus({
        id: tool.id,
        message: `❌ Bridge error: ${err.message}`,
        ok: false,
      })
    }
  }

  const filteredTools = WPILIB_DESKTOP_TOOLS.filter((t) => filter === 'all' || t.category === filter)

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background: 'var(--bg)' }}>
      <div className="flex-1 overflow-y-auto p-5">
        {/* Top Hero Banner */}
        <div className="hero-banner p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xl">🛠️</span>
                <span className="gradient-text-brand text-2xl font-black tracking-tight uppercase">
                  WPILib Desktop Tool Launcher Bridge
                </span>
                <span className="badge badge-ready font-mono text-[10px]">LOCAL BRIDGE ACTIVE</span>
              </div>
              <p style={{ color: 'var(--muted)', fontSize: 13 }}>
                One-click direct desktop launcher for WPILib Glass, AdvantageScope, Shuffleboard, SysId, and Elastic installed on your PC.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={refreshInstalledTools}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-mono font-semibold transition"
                style={{
                  background: 'var(--bg-elevated)',
                  borderColor: 'var(--border)',
                  color: 'var(--text)',
                }}
              >
                <RefreshCw size={13} className={`text-[var(--accent)] ${loading ? 'animate-spin' : ''}`} />
                Scan Directory
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 mt-4 pt-3 border-t border-[var(--border)] text-xs font-mono text-[var(--muted)]">
            <FolderOpen size={14} className="text-[var(--accent)] shrink-0" />
            <span>Target Tools Path:</span>
            <span className="text-[var(--accent-lite)] font-bold truncate">{toolsDir}</span>
            <span className="badge badge-ready ml-auto text-[10px]">{installedExes.length} TOOLS DETECTED</span>
          </div>
        </div>

        {/* Launch Status Banner */}
        {launchStatus && (
          <div
            className={`p-3.5 rounded-xl border mb-6 flex items-center justify-between font-mono text-xs ${
              launchStatus.ok
                ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                : 'bg-rose-500/10 border-rose-500/40 text-rose-300'
            }`}
          >
            <div className="flex items-center gap-2">
              {launchStatus.ok ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
              <span>{launchStatus.message}</span>
            </div>
            <button onClick={() => setLaunchStatus(null)} className="text-xs hover:text-white">
              ✕
            </button>
          </div>
        )}

        {/* Category Filters */}
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div className="flex gap-1.5">
            {[
              { id: 'all', label: 'All Desktop Tools' },
              { id: 'dashboard', label: 'Dashboards' },
              { id: 'analysis', label: 'Analysis & SysId' },
              { id: 'path', label: 'Path Planning' },
              { id: 'system', label: 'System & Bus' },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setFilter(cat.id as FilterCategory)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                  filter === cat.id
                    ? 'btn-glow font-bold'
                    : 'border border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--muted)] hover:text-white'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="text-[11px] font-mono text-[var(--muted)] flex items-center gap-2">
            <span className="flex items-center gap-1 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400" /> Detected On PC
            </span>
          </div>
        </div>

        {/* Tool Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {filteredTools.map((tool) => {
            const isInstalled = installedExes.includes(tool.exeName.toLowerCase())

            return (
              <div key={tool.id} className="tool-card p-4 flex flex-col justify-between">
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
                        style={{
                          background: 'var(--accent-soft)',
                          border: '1px solid var(--border-bright)',
                        }}
                      >
                        {tool.icon}
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-[var(--text)]">{tool.name}</h3>
                        <span className="text-[10px] font-mono text-[var(--accent-lite)] uppercase">
                          {tool.category}
                        </span>
                      </div>
                    </div>

                    <span className={isInstalled ? 'badge badge-ready' : 'badge badge-offline'}>
                      {isInstalled ? 'INSTALLED' : 'NOT FOUND'}
                    </span>
                  </div>

                  {/* Card Description */}
                  <p className="text-xs text-[var(--muted)] leading-relaxed mb-3">
                    {tool.description}
                  </p>

                  <div className="rounded-lg p-2 bg-black/30 border border-[var(--border)] text-[10px] font-mono mb-3 flex items-center gap-1.5 text-[var(--faint)]">
                    <Terminal size={11} className="shrink-0 text-[var(--muted)]" />
                    <span className="text-[var(--text)] truncate">{tool.exeName}</span>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="flex items-center gap-2 pt-2 border-t border-[var(--border)]">
                  <button
                    onClick={() => launchTool(tool)}
                    disabled={!isInstalled}
                    className="flex-1 py-2 rounded-xl text-xs font-bold font-mono btn-glow flex items-center justify-center gap-2 disabled:opacity-40"
                  >
                    <Play size={13} />
                    LAUNCH {tool.name.toUpperCase()}
                  </button>

                  <a
                    href={tool.officialDocs}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 rounded-xl border border-[var(--border)] hover:bg-[var(--panel-hover)] text-[var(--muted)] hover:text-white transition"
                    title="Official WPILib Documentation"
                  >
                    <Info size={14} />
                  </a>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
