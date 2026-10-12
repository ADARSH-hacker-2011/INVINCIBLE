import { create } from 'zustand'
import rawParams from '../data/frc_sim_parameters.json'

// ─── Parameter descriptor (shape of each JSON entry) ───────────────────────
export interface ParamDef {
  category: string
  name: string
  key: string
  type: 'float' | 'int' | 'bool' | 'enum' | 'string'
  default: number | boolean | string | null
  min: number | null
  max: number | null
  unit: string
  description: string
}

export const PARAM_DEFS: ParamDef[] = rawParams as ParamDef[]

// Build unique ordered category list
export const PARAM_CATEGORIES: string[] = Array.from(
  new Set(PARAM_DEFS.map((p) => p.category))
)

// ─── Flat key → value map ───────────────────────────────────────────────────
export type ParamValues = Record<string, number | boolean | string>

function buildDefaults(): ParamValues {
  const out: ParamValues = {}
  for (const p of PARAM_DEFS) {
    if (p.default !== null) {
      out[p.key] = p.default as number | boolean | string
    }
  }
  return out
}

// ─── Store ──────────────────────────────────────────────────────────────────
interface ParamStore {
  values: ParamValues
  setParam: (key: string, value: number | boolean | string) => void
  resetAll: () => void
  importJSON: (json: string) => void
  exportJSON: () => string
}

const STORAGE_KEY = 'frcsim:params'

function loadFromStorage(): ParamValues {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Record<string, string | number | boolean>
      const merged: ParamValues = { ...buildDefaults() }
      for (const [k, v] of Object.entries(parsed)) {
        if (v !== undefined && v !== null) merged[k] = v
      }
      return merged
    }
  } catch {
    /* ignore malformed storage */
  }
  return buildDefaults()
}

export const useParams = create<ParamStore>((set, get) => ({
  values: loadFromStorage(),

  setParam: (key, value) => {
    // Enforce min/max for numeric types
    const def = PARAM_DEFS.find((p) => p.key === key)
    let clamped = value
    if (def && typeof value === 'number') {
      if (def.min !== null) clamped = Math.max(def.min, value)
      if (def.max !== null) clamped = Math.min(def.max as number, clamped as number)
    }
    set((s) => {
      const next: ParamValues = { ...s.values, [key]: clamped }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return { values: next }
    })
  },

  resetAll: () => {
    const defaults = buildDefaults()
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaults))
    set({ values: defaults })
  },

  importJSON: (json) => {
    try {
      const parsed = JSON.parse(json) as Record<string, string | number | boolean>
      const next: ParamValues = { ...buildDefaults() }
      for (const [k, v] of Object.entries(parsed)) {
        if (v !== undefined && v !== null) next[k] = v
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      set({ values: next })
    } catch {
      alert('Invalid parameter JSON file.')
    }
  },

  exportJSON: () => {
    return JSON.stringify(get().values, null, 2)
  },
}))
