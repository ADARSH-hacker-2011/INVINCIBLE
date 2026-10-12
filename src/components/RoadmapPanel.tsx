import { useState, useEffect } from 'react'
import {
  CheckCircle2,
  Clock,
  Circle,
  Plus,
  Trash2,
  X,
  ListTodo,
} from 'lucide-react'

export type TaskStatus = 'todo' | 'in_progress' | 'done'

export interface RoadmapTask {
  id: string
  title: string
  category: 'Physics & Kinematics' | 'Hardware & Electrical' | 'Controls & WPILib' | 'Testing & Validation' | 'UI & Architecture'
  description: string
  status: TaskStatus
  priority: 'high' | 'medium' | 'low'
}

const DEFAULT_TASKS: RoadmapTask[] = [
  {
    id: 't-1',
    title: 'Replace Fake Monte Carlo with 100Hz Numerical Integrator',
    category: 'Physics & Kinematics',
    description: '400-step numerical simulation tracking actual trajectory drift, wheel slip limit (F <= mu*m*g), and battery voltage sag.',
    status: 'done',
    priority: 'high',
  },
  {
    id: 't-2',
    title: 'Prune 165 Dead Parameters to 34 Active Parameters',
    category: 'Controls & WPILib',
    description: 'Keep strictly parameters that alter Rapier 3D, feed the 100Hz Monte Carlo engine, or export to Java.',
    status: 'done',
    priority: 'high',
  },
  {
    id: 't-3',
    title: 'WPILib Java Config Exporter (Phoenix 6 & REVLib)',
    category: 'Controls & WPILib',
    description: '1-click generator emitting official TalonFXConfiguration and SparkMaxConfig matching tuned current limits and gear ratios.',
    status: 'done',
    priority: 'high',
  },
  {
    id: 't-4',
    title: 'Swerve Module Second-Order Kinematics & Desaturation',
    category: 'Physics & Kinematics',
    description: 'Model individual module azimuth steering lag, wheel scrub friction, and WPILib chassis speed desaturation to avoid skew.',
    status: 'in_progress',
    priority: 'high',
  },
  {
    id: 't-5',
    title: 'Coupled Motor Thermal Heating & Dynamic Coil Degradation',
    category: 'Hardware & Electrical',
    description: 'Integrate continuous I²R heating ODE (temperature rise over 2:30 match) triggering realistic motor controller thermal throttling.',
    status: 'todo',
    priority: 'medium',
  },
  {
    id: 't-6',
    title: 'NetworkTables 4 (NT4) Binary Wire Protocol Client',
    category: 'Controls & WPILib',
    description: 'Upgrade JSON websocket stub to authentic binary msgpack NT4 framing matching WPILib 2026/2027 desktop simulation.',
    status: 'todo',
    priority: 'high',
  },
  {
    id: 't-7',
    title: 'Direct Gamepad API Axis & Button Remapping Profile Matrix',
    category: 'Controls & WPILib',
    description: 'Auto-detect Xbox/F310 controllers, configurable deadbands, cubic response curves, and custom button bindings.',
    status: 'todo',
    priority: 'medium',
  },
  {
    id: 't-8',
    title: 'Low-Spec Performance Verification (60 FPS on Chromebook/Integrated GPU)',
    category: 'Testing & Validation',
    description: 'Profile WebGL render loops, shadow maps, and physics WASM execution on low-spec hardware without discrete GPUs.',
    status: 'todo',
    priority: 'medium',
  },
]

const STORAGE_KEY = 'frcsim:pending_tasks'

export function RoadmapPanel({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [tasks, setTasks] = useState<RoadmapTask[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) return JSON.parse(saved)
    } catch {
      /* ignore */
    }
    return DEFAULT_TASKS
  })

  const [filter, setFilter] = useState<'all' | TaskStatus>('all')
  const [newTitle, setNewTitle] = useState('')
  const [newCategory, setNewCategory] = useState<RoadmapTask['category']>('Physics & Kinematics')
  const [showAddForm, setShowAddForm] = useState(false)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks))
  }, [tasks])

  if (!isOpen) return null

  const handleToggleStatus = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t
        const nextStatus: TaskStatus =
          t.status === 'todo' ? 'in_progress' : t.status === 'in_progress' ? 'done' : 'todo'
        return { ...t, status: nextStatus }
      })
    )
  }

  const handleDeleteTask = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setTasks((prev) => prev.filter((t) => t.id !== id))
  }

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTitle.trim()) return

    const newTask: RoadmapTask = {
      id: `custom-${Date.now()}`,
      title: newTitle.trim(),
      category: newCategory,
      description: 'Custom team milestone added via Pending Tasks panel.',
      status: 'todo',
      priority: 'high',
    }

    setTasks((prev) => [newTask, ...prev])
    setNewTitle('')
    setShowAddForm(false)
  }

  const filteredTasks = tasks.filter((t) => (filter === 'all' ? true : t.status === filter))

  const countDone = tasks.filter((t) => t.status === 'done').length
  const countInProgress = tasks.filter((t) => t.status === 'in_progress').length
  const countTodo = tasks.filter((t) => t.status === 'todo').length
  const completionPct = Math.round((countDone / Math.max(1, tasks.length)) * 100)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-3xl rounded-xl border border-cyan-500/40 bg-[#0B0F19] text-zinc-200 shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#1E2D4A] bg-[#070A12]">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <ListTodo size={16} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold font-mono tracking-wider uppercase text-white">
                  FRC 2027 Engineering Roadmap & Pending Tasks
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono font-bold border border-cyan-500/30">
                  {completionPct}% Complete
                </span>
              </div>
              <p className="text-[10px] text-zinc-400 font-mono">
                Click any task card to advance status: <span className="text-zinc-500">TODO</span> → <span className="text-amber-400">IN PROGRESS</span> → <span className="text-emerald-400">DONE</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-zinc-400 hover:text-white hover:bg-white/10 transition"
          >
            <X size={16} />
          </button>
        </div>

        {/* Status Tracker Stats Bar */}
        <div className="px-5 py-2.5 bg-[#0e1424] border-b border-[#1E2D4A] flex items-center justify-between">
          <div className="flex gap-2 font-mono text-xs">
            <button
              onClick={() => setFilter('all')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition ${
                filter === 'all'
                  ? 'bg-cyan-500 text-black shadow'
                  : 'bg-black/40 text-zinc-400 hover:text-white border border-white/5'
              }`}
            >
              All ({tasks.length})
            </button>
            <button
              onClick={() => setFilter('in_progress')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition flex items-center gap-1.5 ${
                filter === 'in_progress'
                  ? 'bg-amber-500 text-black shadow'
                  : 'bg-black/40 text-zinc-400 hover:text-white border border-white/5'
              }`}
            >
              <Clock size={12} className={filter === 'in_progress' ? 'text-black' : 'text-amber-400'} />
              In Progress ({countInProgress})
            </button>
            <button
              onClick={() => setFilter('todo')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition flex items-center gap-1.5 ${
                filter === 'todo'
                  ? 'bg-zinc-300 text-black shadow'
                  : 'bg-black/40 text-zinc-400 hover:text-white border border-white/5'
              }`}
            >
              <Circle size={12} />
              Pending ({countTodo})
            </button>
            <button
              onClick={() => setFilter('done')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition flex items-center gap-1.5 ${
                filter === 'done'
                  ? 'bg-emerald-500 text-black shadow'
                  : 'bg-black/40 text-zinc-400 hover:text-white border border-white/5'
              }`}
            >
              <CheckCircle2 size={12} className={filter === 'done' ? 'text-black' : 'text-emerald-400'} />
              Done ({countDone})
            </button>
          </div>

          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-white/10 hover:bg-white/20 text-white font-mono text-[11px] transition active:scale-95 border border-white/10"
          >
            <Plus size={12} />
            <span>Add Task</span>
          </button>
        </div>

        {/* Add Task Form (Collapsible) */}
        {showAddForm && (
          <form onSubmit={handleAddTask} className="p-3 bg-[#070A12] border-b border-[#1E2D4A] flex gap-2">
            <input
              type="text"
              placeholder="Enter new engineering milestone or task..."
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="flex-1 bg-black/50 border border-[#1E2D4A] rounded-lg px-3 py-1 text-xs font-mono text-white outline-none focus:border-cyan-500"
              autoFocus
            />
            <select
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value as any)}
              className="bg-black/50 border border-[#1E2D4A] rounded-lg px-2 py-1 text-xs font-mono text-zinc-300 outline-none"
            >
              <option value="Physics & Kinematics">Physics & Kinematics</option>
              <option value="Hardware & Electrical">Hardware & Electrical</option>
              <option value="Controls & WPILib">Controls & WPILib</option>
              <option value="Testing & Validation">Testing & Validation</option>
              <option value="UI & Architecture">UI & Architecture</option>
            </select>
            <button
              type="submit"
              className="px-3 py-1 rounded-lg bg-cyan-500 text-black font-mono text-xs font-bold hover:bg-cyan-400"
            >
              Save
            </button>
          </form>
        )}

        {/* Task Cards List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-[#050810]">
          {filteredTasks.length === 0 ? (
            <div className="text-center py-12 text-zinc-500 font-mono text-xs">
              No tasks found under this filter.
            </div>
          ) : (
            filteredTasks.map((task) => {
              const isDone = task.status === 'done'
              const isInProgress = task.status === 'in_progress'

              return (
                <div
                  key={task.id}
                  onClick={() => handleToggleStatus(task.id)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer select-none flex items-start justify-between gap-3 ${
                    isDone
                      ? 'bg-emerald-950/10 border-emerald-500/20 hover:border-emerald-500/40 text-zinc-400'
                      : isInProgress
                      ? 'bg-amber-950/15 border-amber-500/40 hover:border-amber-500/60 text-zinc-200'
                      : 'bg-[#0B0F19] border-[#1E2D4A] hover:border-white/20 text-zinc-300'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="pt-0.5">
                      {isDone ? (
                        <CheckCircle2 size={16} className="text-emerald-400" />
                      ) : isInProgress ? (
                        <Clock size={16} className="text-amber-400 animate-pulse" />
                      ) : (
                        <Circle size={16} className="text-zinc-600" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold font-mono ${isDone ? 'line-through text-zinc-500' : 'text-white'}`}>
                          {task.title}
                        </span>
                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-black/40 text-zinc-400 border border-white/5">
                          {task.category}
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-400 mt-0.5 leading-relaxed font-mono">
                        {task.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded-full border ${
                        isDone
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                          : isInProgress
                          ? 'bg-amber-500/20 border-amber-500/40 text-amber-400'
                          : 'bg-zinc-800 border-zinc-700 text-zinc-400'
                      }`}
                    >
                      {task.status.replace('_', ' ')}
                    </span>
                    <button
                      onClick={(e) => handleDeleteTask(task.id, e)}
                      title="Delete Task"
                      className="text-zinc-600 hover:text-red-400 p-1 rounded hover:bg-black/30 transition"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-2.5 bg-[#070A12] border-t border-[#1E2D4A] flex items-center justify-between text-[11px] font-mono text-zinc-400">
          <span>Click any milestone to cycle its progress state. Changes auto-save to local storage.</span>
          <button
            onClick={() => {
              if (confirm('Reset roadmap to default milestones?')) {
                setTasks(DEFAULT_TASKS)
              }
            }}
            className="text-[10px] text-zinc-500 hover:text-zinc-300 underline"
          >
            Reset Defaults
          </button>
        </div>
      </div>
    </div>
  )
}
