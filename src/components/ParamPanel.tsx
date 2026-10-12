import { useState, useRef } from 'react'
import {
  ChevronDown,
  ChevronRight,
  RotateCcw,
  Download,
  Upload,
  Search,
  FileCode,
} from 'lucide-react'
import {
  useParams,
  PARAM_DEFS,
  PARAM_CATEGORIES,
  type ParamDef,
} from '../stores/paramStore'
import { JavaConfigExporter } from './JavaConfigExporter'

// ─── Category color accents ─────────────────────────────────────────────────
const CATEGORY_COLORS: Record<string, string> = {
  'World Physics': '#38bdf8',
  'Field & Terrain': '#4ade80',
  'Robot Base': '#f59e0b',
  Drivetrain: '#a78bfa',
  Mechanisms: '#fb923c',
  Electrical: '#facc15',
  Sensors: '#34d399',
  Control: '#f472b6',
  'Vision/Game': '#60a5fa',
  Testing: '#f87171',
}

// ─── Single parameter row ───────────────────────────────────────────────────
function ParamRow({ def }: { def: ParamDef }) {
  const { values, setParam } = useParams()
  const val = values[def.key]

  if (def.type === 'bool') {
    return (
      <label className="flex items-center justify-between text-[11px] cursor-pointer select-none">
        <span className="text-[var(--muted)] truncate pr-2">{def.name}</span>
        <button
          onClick={() => setParam(def.key, !(val as boolean))}
          className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold border transition-all ${
            val
              ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
              : 'bg-black/30 border-[var(--border)] text-[var(--muted)]'
          }`}
        >
          {val ? 'ON' : 'OFF'}
        </button>
      </label>
    )
  }

  if (def.type === 'enum') {
    // Parse enum values from description like "flat / rough / ramp / stairs"
    const allOpts = def.description.includes('/')
      ? def.description.split('/').map((s) => s.trim().replace(/^.*?([\w\d_-]+)$/, '$1')).filter(Boolean)
      : [String(def.default)]

    return (
      <label className="block text-[11px]">
        <div className="flex justify-between text-[var(--muted)] mb-0.5">
          <span className="truncate">{def.name}</span>
          <span className="font-mono text-[10px] text-[var(--text)]">{String(val)}</span>
        </div>
        <select
          value={String(val)}
          onChange={(e) => setParam(def.key, e.target.value)}
          className="w-full text-[10px]"
        >
          {allOpts.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      </label>
    )
  }

  if (def.type === 'string') {
    return (
      <label className="block text-[11px]">
        <span className="text-[var(--muted)] block mb-0.5">{def.name}</span>
        <input
          type="text"
          value={String(val)}
          onChange={(e) => setParam(def.key, e.target.value)}
          className="w-full bg-black/40 border border-[var(--border)] rounded px-2 py-0.5 text-[10px] font-mono text-[var(--text)]"
        />
      </label>
    )
  }

  // float / int — slider + number input
  const numVal = val as number
  const min = def.min ?? 0
  const max = def.max ?? 100
  const step = def.type === 'int' ? 1 : (max - min) / 200

  const pct = max > min ? ((numVal - min) / (max - min)) * 100 : 0

  return (
    <div className="text-[11px] space-y-0.5">
      <div className="flex justify-between text-[var(--muted)]">
        <span className="truncate pr-1">{def.name}</span>
        <div className="flex items-center gap-1 shrink-0">
          <input
            type="number"
            min={min}
            max={max}
            step={step}
            value={numVal}
            onChange={(e) => setParam(def.key, def.type === 'int' ? parseInt(e.target.value) : parseFloat(e.target.value))}
            className="w-16 bg-black/50 border border-[var(--border)] rounded px-1 text-[10px] font-mono text-right text-[var(--text)] focus:outline-none focus:border-[var(--accent)]"
          />
          {def.unit && (
            <span className="text-[9px] text-[var(--muted)] w-8 truncate">{def.unit}</span>
          )}
        </div>
      </div>
      <div className="relative h-1.5 rounded-full bg-black/40 overflow-hidden">
        <div
          className="absolute h-full rounded-full transition-all"
          style={{ width: `${pct}%`, background: 'var(--accent)' }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={numVal}
          onChange={(e) =>
            setParam(
              def.key,
              def.type === 'int' ? parseInt(e.target.value) : parseFloat(e.target.value)
            )
          }
          className="absolute inset-0 w-full opacity-0 cursor-pointer"
        />
      </div>
    </div>
  )
}

// ─── Collapsible category section ───────────────────────────────────────────
function CategorySection({
  category,
  params,
  query,
}: {
  category: string
  params: ParamDef[]
  query: string
}) {
  const [open, setOpen] = useState(category === 'World Physics' || category === 'Robot Base')
  const filtered = query
    ? params.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.key.toLowerCase().includes(query) ||
          p.description.toLowerCase().includes(query)
      )
    : params

  if (query && filtered.length === 0) return null

  const accent = CATEGORY_COLORS[category] || 'var(--accent)'
  const count = filtered.length

  return (
    <div className="border border-[var(--border)] rounded-lg overflow-hidden mb-1.5">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-3 py-2 bg-[var(--panel)]/80 hover:bg-[var(--panel)] transition-colors"
      >
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: accent }} />
          <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: accent }}>
            {category}
          </span>
          <span className="text-[9px] font-mono bg-black/30 px-1.5 py-0.5 rounded text-[var(--muted)]">
            {count}
          </span>
        </div>
        {open ? (
          <ChevronDown size={13} className="text-[var(--muted)]" />
        ) : (
          <ChevronRight size={13} className="text-[var(--muted)]" />
        )}
      </button>

      {(open || query) && (
        <div className="px-3 py-2 space-y-2.5 bg-[var(--bg)]/60">
          {filtered.map((p) => (
            <ParamRow key={p.key} def={p} />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Main panel ─────────────────────────────────────────────────────────────
export function ParamPanel() {
  const { resetAll, importJSON, exportJSON, values } = useParams()
  const [query, setQuery] = useState('')
  const [showJavaExporter, setShowJavaExporter] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const lq = query.toLowerCase().trim()

  function handleExport() {
    const blob = new Blob([exportJSON()], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'frc_sim_params_export.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => importJSON(ev.target?.result as string)
    reader.readAsText(file)
    e.target.value = ''
  }

  // Count non-default values
  const modifiedCount = PARAM_DEFS.filter((d) => {
    const v = values[d.key]
    return v !== d.default
  }).length

  return (
    <div className="flex flex-col h-full">
      {/* Header toolbar */}
      <div className="flex items-center gap-1.5 px-3 py-2 border-b border-[var(--border)] shrink-0">
        <span className="text-[11px] font-bold text-[var(--accent)] uppercase tracking-wider flex-1">
          {PARAM_DEFS.length} Active Tuner Params
        </span>
        <button
          onClick={() => setShowJavaExporter(true)}
          className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/15 border border-cyan-500/40 text-cyan-300 hover:text-white hover:bg-cyan-500/25 transition font-bold"
          title="Export to WPILib Java Code"
        >
          <FileCode size={11} />
          <span>Export Java</span>
        </button>
        {modifiedCount > 0 && (
          <span className="text-[9px] font-mono bg-amber-500/20 border border-amber-500/40 text-amber-400 px-1.5 py-0.5 rounded">
            {modifiedCount} modified
          </span>
        )}
        <button
          onClick={handleExport}
          title="Export JSON"
          className="p-1 rounded hover:bg-[var(--panel)] text-[var(--muted)] hover:text-[var(--accent)] transition-colors"
        >
          <Download size={13} />
        </button>
        <button
          onClick={() => fileRef.current?.click()}
          title="Import JSON"
          className="p-1 rounded hover:bg-[var(--panel)] text-[var(--muted)] hover:text-[var(--accent)] transition-colors"
        >
          <Upload size={13} />
        </button>
        <button
          onClick={() => { if (confirm('Reset all 190 parameters to defaults?')) resetAll() }}
          title="Reset all"
          className="p-1 rounded hover:bg-[var(--panel)] text-[var(--muted)] hover:text-red-400 transition-colors"
        >
          <RotateCcw size={13} />
        </button>
        <input ref={fileRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
      </div>

      {/* Search bar */}
      <div className="px-3 py-2 border-b border-[var(--border)] shrink-0">
        <div className="flex items-center gap-2 bg-black/40 border border-[var(--border)] rounded-lg px-2.5 py-1.5">
          <Search size={11} className="text-[var(--muted)] shrink-0" />
          <input
            type="text"
            placeholder="Search parameters…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-[11px] text-[var(--text)] placeholder-[var(--muted)] outline-none font-mono"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="text-[var(--muted)] hover:text-[var(--text)] text-[10px]"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Scrollable param list */}
      <div className="flex-1 overflow-y-auto px-2 py-2">
        {PARAM_CATEGORIES.map((cat) => {
          const catParams = PARAM_DEFS.filter((p) => p.category === cat)
          return (
            <CategorySection
              key={cat}
              category={cat}
              params={catParams}
              query={lq}
            />
          )
        })}
      </div>

      {/* WPILib Java Config Exporter Modal */}
      <JavaConfigExporter
        isOpen={showJavaExporter}
        onClose={() => setShowJavaExporter(false)}
      />
    </div>
  )
}
