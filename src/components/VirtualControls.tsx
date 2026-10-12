import { useEffect, useRef, useState, useCallback } from 'react'
import { Gamepad, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, RotateCcw, RotateCw, Play, Square } from 'lucide-react'
import { useSim } from '../store'

export function VirtualControls() {
  const {
    virtualInput,
    setVirtualInput,
    elevatorHeight,
    intakeActive,
    gamepadConnected,
    set,
  } = useSim()

  const [activeKeys, setActiveKeys] = useState<Set<string>>(new Set())
  const joyPadRef = useRef<HTMLDivElement>(null)
  const isDraggingRef = useRef(false)

  // Track raw keyboard states
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in an input
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

      // Keyboard
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
        // Left stick: axes 0 (strafe), axes 1 (fwd inverted)
        const deadzone = 0.12
        const rawStrafe = gp.axes[0] ?? 0
        const rawFwd = -(gp.axes[1] ?? 0)
        const rawTurn = gp.axes[2] ?? gp.axes[3] ?? 0

        if (Math.abs(rawFwd) > deadzone) fwd = rawFwd
        if (Math.abs(rawStrafe) > deadzone) strafe = rawStrafe
        if (Math.abs(rawTurn) > deadzone) turn = rawTurn

        // Gamepad buttons for intake (A button) and elevator (triggers)
        if (gp.buttons[0]?.pressed) {
          useSim.getState().set({ intakeActive: true })
        }
      }

      if (hasGamepad !== gamepadConnected) {
        set({ gamepadConnected: hasGamepad })
      }

      // If dragging touch joystick, preserve touch fwd/strafe
      if (!isDraggingRef.current) {
        setVirtualInput({ fwd, strafe, turn })
      }

      animId = requestAnimationFrame(pollInputs)
    }

    animId = requestAnimationFrame(pollInputs)
    return () => cancelAnimationFrame(animId)
  }, [activeKeys, gamepadConnected, set, setVirtualInput])

  // Virtual Touch / Mouse Joystick drag handling
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    isDraggingRef.current = true
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }, [])

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDraggingRef.current || !joyPadRef.current) return
      const rect = joyPadRef.current.getBoundingClientRect()
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

  const handlePointerUp = useCallback(() => {
    isDraggingRef.current = false
    setVirtualInput({ fwd: 0, strafe: 0, turn: virtualInput.turn })
  }, [setVirtualInput, virtualInput.turn])

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--panel)]/95 backdrop-blur-md p-3 shadow-xl space-y-3 pointer-events-auto">
      {/* Title & Gamepad Status */}
      <div className="flex items-center justify-between pb-1 border-b border-[var(--border)]">
        <span className="flex items-center gap-1.5 text-xs font-bold text-[var(--accent)] uppercase tracking-wider">
          <Gamepad size={14} /> Drive & Mechanism Controls
        </span>
        <span
          className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
            gamepadConnected
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              : 'bg-black/30 text-[var(--muted)]'
          }`}
        >
          {gamepadConnected ? 'GAMEPAD CONNECTED' : 'KEYBOARD / TOUCH'}
        </span>
      </div>

      <div className="flex items-center justify-between gap-4">
        {/* Virtual On-screen Drivetrain Joystick */}
        <div className="flex flex-col items-center">
          <div className="text-[10px] text-[var(--muted)] mb-1 font-mono">VIRTUAL STICK</div>
          <div
            ref={joyPadRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            className="relative w-24 h-24 rounded-full border-2 border-[var(--border)] bg-black/40 flex items-center justify-center touch-none cursor-grab active:cursor-grabbing select-none"
          >
            {/* Direction hints */}
            <ArrowUp size={12} className="absolute top-1 text-white/30 pointer-events-none" />
            <ArrowDown size={12} className="absolute bottom-1 text-white/30 pointer-events-none" />
            <ArrowLeft size={12} className="absolute left-1 text-white/30 pointer-events-none" />
            <ArrowRight size={12} className="absolute right-1 text-white/30 pointer-events-none" />

            {/* Thumbstick nub */}
            <div
              className="w-8 h-8 rounded-full border border-white/20 shadow-md transition-transform"
              style={{
                backgroundColor: 'var(--accent)',
                transform: `translate(${virtualInput.strafe * 24}px, ${-virtualInput.fwd * 24}px)`,
              }}
            />
          </div>
        </div>

        {/* Turn & Articulations */}
        <div className="flex-1 space-y-2">
          {/* Turn Buttons */}
          <div>
            <div className="text-[10px] text-[var(--muted)] font-mono mb-1">AZIMUTH ROTATION</div>
            <div className="flex gap-1.5">
              <button
                onPointerDown={() => setVirtualInput({ ...virtualInput, turn: -1 })}
                onPointerUp={() => setVirtualInput({ ...virtualInput, turn: 0 })}
                className="flex-1 py-1.5 rounded border border-[var(--border)] bg-[var(--bg)] hover:bg-[var(--panel)] active:scale-95 text-xs flex items-center justify-center gap-1 font-mono"
              >
                <RotateCcw size={12} /> Spin L (Q)
              </button>
              <button
                onPointerDown={() => setVirtualInput({ ...virtualInput, turn: 1 })}
                onPointerUp={() => setVirtualInput({ ...virtualInput, turn: 0 })}
                className="flex-1 py-1.5 rounded border border-[var(--border)] bg-[var(--bg)] hover:bg-[var(--panel)] active:scale-95 text-xs flex items-center justify-center gap-1 font-mono"
              >
                <RotateCw size={12} /> Spin R (E)
              </button>
            </div>
          </div>

          {/* Intake Toggle */}
          <div>
            <div className="text-[10px] text-[var(--muted)] font-mono mb-1">INTAKE ROLLERS</div>
            <button
              onClick={() => set({ intakeActive: !intakeActive })}
              className={`w-full py-1.5 rounded text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                intakeActive
                  ? 'bg-emerald-600 text-white shadow-[0_0_15px_rgba(34,197,94,0.4)]'
                  : 'border border-[var(--border)] bg-[var(--bg)] text-[var(--muted)]'
              }`}
            >
              {intakeActive ? <Square size={12} /> : <Play size={12} />}
              {intakeActive ? 'INTAKE ACTIVE (SPINNING)' : 'ACTIVATE INTAKE'}
            </button>
          </div>

          {/* Elevator Articulation Slider */}
          <div>
            <div className="flex justify-between text-[10px] text-[var(--muted)] font-mono mb-0.5">
              <span>ELEVATOR HEIGHT</span>
              <span className="text-[var(--text)]">{elevatorHeight.toFixed(2)} m</span>
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
    </div>
  )
}
