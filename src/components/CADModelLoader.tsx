import { useState, useRef } from 'react'
import { Upload, CheckCircle2, X } from 'lucide-react'
import { useSim } from '../store'

export function CADModelLoader() {
  const { customModelUrl, set } = useSim()
  const [modelName, setModelName] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.name.endsWith('.glb') && !file.name.endsWith('.gltf')) {
      alert('Please upload a .glb or .gltf 3D robot model file.')
      return
    }

    const url = URL.createObjectURL(file)
    setModelName(file.name)
    set({ customModelUrl: url })
  }

  const handleRemove = () => {
    if (customModelUrl) {
      URL.revokeObjectURL(customModelUrl)
    }
    setModelName(null)
    set({ customModelUrl: null })
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--panel)] p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-[var(--accent)] flex items-center gap-1.5">
          <Upload size={14} /> 3D CAD Robot Importer
        </span>
        <span className="text-[10px] font-mono text-[var(--muted)]">.GLB / .GLTF</span>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".glb,.gltf"
        onChange={handleFileChange}
        className="hidden"
        id="cad-upload-input"
      />

      {customModelUrl ? (
        <div className="flex items-center justify-between p-2 rounded-lg bg-[var(--bg)] border border-emerald-500/30">
          <div className="flex items-center gap-2 overflow-hidden">
            <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
            <span className="text-xs font-mono text-[var(--text)] truncate max-w-[150px]">
              {modelName}
            </span>
          </div>
          <button
            onClick={handleRemove}
            className="p-1 rounded hover:bg-white/10 text-rose-400 text-xs"
            title="Reset to procedural FRC robot"
          >
            <X size={14} />
          </button>
        </div>
      ) : (
        <label
          htmlFor="cad-upload-input"
          className="flex flex-col items-center justify-center p-3 rounded-lg border-2 border-dashed border-[var(--border)] hover:border-[var(--accent)]/60 cursor-pointer bg-[var(--bg)]/50 transition-all text-center"
        >
          <Upload size={18} className="text-[var(--muted)] mb-1" />
          <span className="text-xs font-medium text-[var(--text)]">Drop CAD Robot (.glb / .gltf)</span>
          <span className="text-[10px] text-[var(--muted)] mt-0.5">From Onshape / Fusion 360 / Adobe</span>
        </label>
      )}
    </div>
  )
}
