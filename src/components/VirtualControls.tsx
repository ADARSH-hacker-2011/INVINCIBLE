import { useEffect, useRef, useState, useCallback } from 'react'
import {
  Gamepad2,
  Play,
  Square,
  Sliders,
} from 'lucide-react'
import { useSim } from '../store'

interface VirtualControlsProps {
  onOpenGamepadEditor?: () => void
}

export function VirtualControls({ onOpenGamepadEditor }: VirtualControlsProps) {
  const {
    virtualInput,
    setVirtualInput,
    elevatorHeight,
    intakeActive,
    gamepadConnected,
    maxSpeed,
    set,
  } = useSim()

  const [activeKeys, setActiveKeys] = useState<Set<string>>(new Set())
  const leftPadRef = useRef<HTMLDivElement>(null)
  const rightPadRef = useRef<HTMLDivElement>(null)
  const isDraggingLeftRef = useRef(false)
  const isDraggingRightRef = useRef(false)

  // Track raw keyboard states
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return
      setActiveKeys((prev) => {
        const next = new Set(prev)
        next.add(e.code)
        return next
      })
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      setActiveKeys((prev) => {
        const next = new Set(prev)
        next.delete(e.code)
        return next
      })
    }

    const handleBlur = () => {
      setActiveKeys(new Set())
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    window.addEventListener('blur', handleBlur)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
      window.removeEventListener('blur', handleBlur)
    }
  }, [])

  // Combine keyboard & gamepad inputs into store's virtualInput
  useEffect(() => {
    let animId: number

    const pollInputs = () => {
      let fwd = 0
      let strafe = 0
      let turn = 0

      // Keyboard (WASD + Arrows)
      if (activeKeys.has('KeyW') || activeKeys.has('ArrowUp')) fwd += 1
      if (activeKeys.has('KeyS') || activeKeys.has('ArrowDown')) fwd -= 1
      if (activeKeys.has('KeyD')) strafe += 1
      if (activeKeys.has('KeyA')) strafe -= 1
      if (activeKeys.has('KeyQ') || activeKeys.has('ArrowLeft')) turn -= 1
      if (activeKeys.has('KeyE') || activeKeys.has('ArrowRight')) turn += 1

      // Gamepad API
      const gamepads = typeof navigator !== 'undefined' && navigator.getGamepads ? navigator.getGamepads() : []
      const gp = gamepads[0]
      const hasGamepad = !!gp

      if (hasGamepad) {
        const deadzone = 0.08
        const rawStrafe = gp.axes[0] ?? 0
        const rawFwd = -(gp.axes[1] ?? 0)
        const rawTurn = gp.axes[2] ?? gp.axes[3] ?? 0

        if (Math.abs(rawFwd) > deadzone) fwd = rawFwd
        if (Math.abs(rawStrafe) > deadzone) strafe = rawStrafe
        if (Math.abs(rawTurn) > deadzone) turn = rawTurn

        // Button 0 (A button) toggles intake
        if (gp.buttons[0]?.pressed) {
          useSim.getState().set({ intakeActive: true })
        }
      }

      if (hasGamepad !== gamepadConnected) {
        set({ gamepadConnected: hasGamepad })
      }

      // If neither virtual touch stick is currently being dragged, update store
      if (!isDraggingLeftRef.current && !isDraggingRightRef.current) {
        setVirtualInput({ fwd, strafe, turn })
      }

      animId = requestAnimationFrame(pollInputs)
    }

    animId = requestAnimationFrame(pollInputs)
    return () => cancelAnimationFrame(animId)
  }, [activeKeys, gamepadConnected, set, setVirtualInput])

  // Left Stick: Translation (Fwd / Strafe)
  const handleLeftDown = useCallback((e: React.PointerEvent) => {
    isDraggingLeftRef.current = true
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }, [])

  const handleLeftMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDraggingLeftRef.current || !leftPadRef.current) return
      const rect = leftPadRef.current.getBoundingClientRect()
      const centerX = rect.left + rect.width / 2
      const centerY = rect.top + rect.height / 2

      const dx = (e.clientX - centerX) / (rect.width / 2)
      const dy = -(e.clientY - centerY) / (rect.height / 2)

      const clampedX = Math.max(-1, Math.min(1, dx))
      const clampedY = Math.max(-1, Math.min(1, dy))

      setVirtualInput({
        fwd: clampedY,
        strafe: clampedX,
        turn: virtualInput.turn,
      })
    },
    [setVirtualInput, virtualInput.turn],
  )

  const handleLeftUp = useCallback(() => {
    isDraggingLeftRef.current = false
    setVirtualInput({ fwd: 0, strafe: 0, turn: virtualInput.turn })
  }, [setVirtualInput, virtualInput.turn])

  // Right Stick: Azimuth Rotation
  const handleRightDown = useCallback((e: React.PointerEvent) => {
    isDraggingRightRef.current = true
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }, [])

  const handleRightMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDraggingRightRef.current || !rightPadRef.current) return
      const rect = rightPadRef.current.getBoundingClientRect()
      const centerX = rect.left + rect.width / 2
      const dx = (e.clientX - centerX) / (rect.width / 2)
      const clampedX = Math.max(-1, Math.min(1, dx))

      setVirtualInput({
        fwd: virtualInput.fwd,
        strafe: virtualInput.strafe,
        turn: clampedX,
      })
    },
    [setVirtualInput, virtualInput.fwd, virtualInput.strafe],
  )

  const handleRightUp = useCallback(() => {
    isDraggingRightRef.current = false
    setVirtualInput({ fwd: virtualInput.fwd, strafe: virtualInput.strafe, turn: 0 })
  }, [setVirtualInput, virtualInput.fwd, virtualInput.strafe])

  return (
    <div
      className="rounded-2xl border border-[var(--border)] bg-[var(--panel)]/95 backdrop-blur-md p-3.5 shadow-2xl space-y-3 pointer-events-auto"
      style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}
    >
      {/* Title & Gamepad Status */}
      <div className="flex items-center justify-between pb-2 border-b border-[var(--border)]">
        <div className="flex items-center gap-1.5">
          <Gamepad2 size={15} className="text-[var(--accent)]" />
          <span className="text-xs font-black tracking-wider uppercase font-mono text-[var(--text)]">
            Flight & Drive Deck
          </span>
        </div>

        <div className="flex items-center gap-2">
          {onOpenGamepadEditor && (
            <button
              onClick={onOpenGamepadEditor}
              className="px-2 py-0.5 rounded text-[10px] font-mono border border-[var(--border)] bg-[var(--bg)] hover:border-[var(--accent)] text-[var(--muted)] hover:text-white transition flex items-center gap-1"
              title="Open Gamepad Response Tuning"
            >
              <Sliders size={11} className="text-[var(--accent)]" />
              Tune Axis
            </button>
          )}

          <span
            className={`text-[9px] font-mono px-2 py-0.5 rounded font-bold border ${
              gamepadConnected
                ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                : 'bg-black/40 text-[var(--muted)] border-[var(--border)]'
            }`}
          >
            {gamepadConnected ? '● USB GAMEPAD' : 'KEYBOARD & TOUCH'}
          </span>
        </div>
      </div>

      {/* Dual Joystick Physical Array */}
      <div className="grid grid-cols-2 gap-3 items-center">
        {/* Left Stick: Translation (Fwd/Strafe) */}
        <div className="flex flex-col items-center">
          <div className="text-[9px] text-[var(--muted)] mb-1 font-mono uppercase tracking-wider">
            TRANSLATION (FWD / STRAFE)
          </div>
          <div
            ref={leftPadRef}
            onPointerDown={handleLeftDown}
            onPointerMove={handleLeftMove}
            onPointerUp={handleLeftUp}
            className="relative w-24 h-24 rounded-full border-2 border-[var(--border)] bg-black/60 flex items-center justify-center touch-none cursor-grab active:cursor-grabbing select-none"
          >
            {/* Inner deadband marker */}
            <div className="absolute w-6 h-6 rounded-full border border-dashed border-white/20 pointer-events-none" />
            {/* Crosshairs */}
            <div className="absolute w-full h-px bg-white/10 pointer-events-none" />
            <div className="absolute h-full w-px bg-white/10 pointer-events-none" />

            {/* Nub */}
            <div
              className="w-8 h-8 rounded-full border border-white/30 shadow-lg transition-transform"
              style={{
                backgroundColor: 'var(--accent)',
                transform: `translate(${virtualInput.strafe * 26}px, ${-virtualInput.fwd * 26}px)`,
                boxShadow: '0 0 12px var(--accent-glow)',
              }}
            />
          </div>
          <div className="text-[9px] font-mono text-[var(--muted)] mt-1">
            X:{virtualInput.strafe.toFixed(2)} Y:{virtualInput.fwd.toFixed(2)}
          </div>
        </div>

        {/* Right Stick: Azimuth Rotation */}
        <div className="flex flex-col items-center">
          <div className="text-[9px] text-[var(--muted)] mb-1 font-mono uppercase tracking-wider">
            ROTATION (SPIN θ)
          </div>
          <div
            ref={rightPadRef}
            onPointerDown={handleRightDown}
            onPointerMove={handleRightMove}
            onPointerUp={handleRightUp}
            className="relative w-24 h-24 rounded-full border-2 border-[var(--border)] bg-black/60 flex items-center justify-center touch-none cursor-grab active:cursor-grabbing select-none"
          >
            {/* Inner deadband marker */}
            <div className="absolute w-6 h-6 rounded-full border border-dashed border-white/20 pointer-events-none" />
            {/* Crosshairs */}
            <div className="absolute w-full h-px bg-white/10 pointer-events-none" />
            <div className="absolute h-full w-px bg-white/10 pointer-events-none" />

            {/* Nub */}
            <div
              className="w-8 h-8 rounded-full border border-white/30 shadow-lg transition-transform"
              style={{
                backgroundColor: 'var(--warning)',
                transform: `translate(${virtualInput.turn * 26}px, 0px)`,
                boxShadow: '0 0 12px rgba(234, 179, 8, 0.4)',
              }}
            />
          </div>
          <div className="text-[9px] font-mono text-[var(--muted)] mt-1">
            SPIN: {virtualInput.turn.toFixed(2)} rad/s
          </div>
        </div>
      </div>

      {/* Speed Multiplier Segmented Selector */}
      <div>
        <div className="flex justify-between text-[9px] font-mono text-[var(--muted)] mb-1">
          <span>DRIVETRAIN SPEED LIMIT</span>
          <span className="text-[var(--accent-lite)] font-bold">{maxSpeed.toFixed(1)} m/s</span>
        </div>
        <div className="speed-segment">
          {[
            { label: 'CREEP (1.5 m/s)', val: 1.5 },
            { label: 'MATCH (4.8 m/s)', val: 4.8 },
            { label: 'TURBO (6.2 m/s)', val: 6.2 },
          ].map((mode) => (
            <button
              key={mode.label}
              onClick={() => set({ maxSpeed: mode.val })}
              className={Math.abs(maxSpeed - mode.val) < 0.3 ? 'active' : ''}
            >
              {mode.label}
            </button>
          ))}
        </div>
      </div>

      {/* Mechanism Controls: Intake & Elevator */}
      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-[var(--border)]">
        {/* Intake Toggle */}
        <button
          onClick={() => set({ intakeActive: !intakeActive })}
          className={`py-1.5 rounded-lg text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition ${
            intakeActive
              ? 'bg-emerald-600 text-white shadow-[0_0_15px_rgba(34,197,94,0.4)]'
              : 'border border-[var(--border)] bg-[var(--bg)] text-[var(--muted)] hover:text-white'
          }`}
        >
          {intakeActive ? <Square size={12} /> : <Play size={12} />}
          {intakeActive ? 'INTAKE ON' : 'SPIN INTAKE'}
        </button>

        {/* Elevator Slider */}
        <div className="flex flex-col justify-center">
          <div className="flex justify-between text-[9px] font-mono text-[var(--muted)] mb-0.5">
            <span>ELEVATOR</span>
            <span className="text-[var(--text)]">{elevatorHeight.toFixed(2)}m</span>
          </div>
          <input
            type="range"
            min={0}
            max={1.1}
            step={0.05}
            value={elevatorHeight}
            onChange={(e) => set({ elevatorHeight: parseFloat(e.target.value) })}
          />
        </div>
      </div>
    </div>
  )
}
