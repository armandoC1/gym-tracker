'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import Link from 'next/link'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'

interface SetLog {
  id: string
  setNumber: number
  weight: string | null
  reps: number | null
  completed: boolean
}

interface ExerciseLog {
  id: string
  exerciseId: string
  done: boolean
  setsCompleted: number | null
  notes: string | null
  exercise: {
    id: string
    name: string
    sets: number
    repsOrTime: string
    weight: string | null
    notes: string | null
    isSuperset: boolean
    supersetGroup: string | null
    videoUrl: string | null
    order: number
  }
  setLogs: SetLog[]
}

interface Workout {
  id: string
  date: string
  completed: boolean
  notes: string | null
  durationSeconds: number | null
  routine: {
    name: string
    label: string
    color: string
    description: string | null
    exercises: any[]
  }
  exerciseLogs: ExerciseLog[]
}

function VideoModal({ url, name, onClose }: { url: string; name: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={onClose}>
      <div className="w-full max-w-lg bg-[#111] rounded-2xl overflow-hidden border border-white/10" onClick={(e) => e.stopPropagation()}>
        <div className="p-4 flex items-center justify-between border-b border-white/10">
          <h3 className="font-bold text-sm truncate pr-4">{name}</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 flex-shrink-0">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="aspect-video">
          <iframe src={url + '?autoplay=1&rel=0'} className="w-full h-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
        </div>
      </div>
    </div>
  )
}

function RestTimer({ seconds, onClose }: { seconds: number; onClose: () => void }) {
  const [remaining, setRemaining] = useState(seconds)
  const [isRunning, setIsRunning] = useState(true)

  useEffect(() => {
    if (!isRunning || remaining <= 0) return
    const timer = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          clearInterval(timer)
          if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate([200, 100, 200])
          }
          return 0
        }
        return r - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [isRunning, remaining])

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#111] border-t border-white/10 px-6 py-4">
      <div className="max-w-2xl mx-auto flex items-center gap-4">
        <div className={`text-2xl font-black font-mono ${remaining <= 5 ? 'text-[#ff4444]' : 'text-white'}`}>
          {formatTime(remaining)}
        </div>
        <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
          <div className="h-full bg-[#ff4444] rounded-full transition-all duration-1000" style={{ width: `${(remaining / seconds) * 100}%` }} />
        </div>
        <button onClick={() => setIsRunning(!isRunning)} className="px-3 py-1.5 rounded-lg bg-white/10 text-xs font-bold hover:bg-white/20">
          {isRunning ? 'Pausa' : 'Play'}
        </button>
        <button onClick={onClose} className="px-3 py-1.5 rounded-lg bg-white/10 text-xs font-bold hover:bg-white/20">
          Cerrar
        </button>
      </div>
    </div>
  )
}

function ExerciseTimer({ onComplete }: { onComplete: () => void }) {
  const [seconds, setSeconds] = useState(0)
  const [isRunning, setIsRunning] = useState(false)

  useEffect(() => {
    if (!isRunning) return
    const timer = setInterval(() => setSeconds((s) => s + 1), 1000)
    return () => clearInterval(timer)
  }, [isRunning])

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  return (
    <div className="flex items-center gap-2 mt-2">
      <div className="text-lg font-mono text-yellow-400">{formatTime(seconds)}</div>
      <button onClick={() => setIsRunning(!isRunning)} className="px-2 py-1 rounded bg-yellow-500/20 text-yellow-400 text-xs font-bold">
        {isRunning ? 'Stop' : 'Start'}
      </button>
      {seconds > 0 && (
        <button onClick={() => { setIsRunning(false); setSeconds(0); onComplete(); }} className="px-2 py-1 rounded bg-green-500/20 text-green-400 text-xs font-bold">
          Guardar
        </button>
      )}
    </div>
  )
}

function WorkoutContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const routineId = searchParams.get('routineId') || ''
  const date = searchParams.get('date') || format(new Date(), 'yyyy-MM-dd')

  const [videoModal, setVideoModal] = useState<{ url: string; name: string } | null>(null)
  const [restTimer, setRestTimer] = useState<number | null>(null)
  const [notesEditing, setNotesEditing] = useState<string | null>(null)
  const [startTime] = useState(Date.now())

  const { data: workout, isLoading } = useQuery<Workout>({
    queryKey: ['workout', routineId, date],
    queryFn: async () => {
      const res = await fetch(`/api/workouts?routineId=${routineId}&date=${date}`)
      if (!res.ok) throw new Error('Error fetching workout')
      return res.json()
    },
    enabled: !!routineId,
  })

  const updateSetLog = useMutation({
    mutationFn: async (payload: { setLogId: string; weight?: string; reps?: number; completed?: boolean }) => {
      const res = await fetch('/api/exercises', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error('Error updating set')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workout', routineId, date] })
    },
  })

  const updateExerciseLog = useMutation({
    mutationFn: async (payload: { logId: string; done?: boolean; notes?: string }) => {
      const res = await fetch('/api/exercises', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error('Error updating exercise')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workout', routineId, date] })
    },
  })

  const updateWorkout = useMutation({
    mutationFn: async (payload: { workoutId: string; durationSeconds?: number; notes?: string; completed?: boolean }) => {
      const res = await fetch('/api/workouts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error('Error updating workout')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workout', routineId, date] })
      queryClient.invalidateQueries({ queryKey: ['workouts'] })
    },
  })

  const handleSetToggle = (setLog: SetLog) => {
    const newCompleted = !setLog.completed
    updateSetLog.mutate({ setLogId: setLog.id, completed: newCompleted })
    if (newCompleted) {
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(50)
      }
      setRestTimer(90)
    }
  }

  const handleSetWeightChange = (setLogId: string, weight: string) => {
    updateSetLog.mutate({ setLogId, weight })
  }

  const handleSetRepsChange = (setLogId: string, reps: number) => {
    updateSetLog.mutate({ setLogId, reps })
  }

  const handleSaveNotes = (logId: string, notes: string) => {
    updateExerciseLog.mutate({ logId, notes })
    setNotesEditing(null)
  }

  const handleFinishWorkout = () => {
    const duration = Math.floor((Date.now() - startTime) / 1000)
    if (workout) {
      updateWorkout.mutate({ workoutId: workout.id, completed: true, durationSeconds: duration })
      toast.success('Entrenamiento completado!')
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-white/30 text-sm">Cargando entrenamiento...</div>
      </div>
    )
  }

  if (!workout) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-white/30 text-sm">Rutina no encontrada</div>
      </div>
    )
  }

  const logs = [...workout.exerciseLogs].sort((a, b) => a.exercise.order - b.exercise.order)
  const doneCount = logs.filter((l) => l.done).length
  const progress = logs.length > 0 ? (doneCount / logs.length) * 100 : 0
  const allSets = logs.flatMap((l) => l.setLogs)
  const completedSets = allSets.filter((s) => s.completed).length
  const totalSets = allSets.length

  // Group supersets
  const groupedLogs: (ExerciseLog | ExerciseLog[])[] = []
  const seenGroups = new Set<string>()
  logs.forEach((log) => {
    if (log.exercise.isSuperset && log.exercise.supersetGroup) {
      if (!seenGroups.has(log.exercise.supersetGroup)) {
        seenGroups.add(log.exercise.supersetGroup)
        const group = logs.filter((l) => l.exercise.supersetGroup === log.exercise.supersetGroup)
        groupedLogs.push(group)
      }
    } else {
      groupedLogs.push(log)
    }
  })

  return (
    <main className="min-h-screen bg-[#0a0a0f] text-white pb-10">
      {videoModal && <VideoModal url={videoModal.url} name={videoModal.name} onClose={() => setVideoModal(null)} />}
      {restTimer !== null && <RestTimer seconds={restTimer} onClose={() => setRestTimer(null)} />}

      {/* Header */}
      <header className="sticky top-0 z-10 bg-[#0a0a0f]/90 backdrop-blur border-b border-white/10 px-6 py-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3 mb-3">
            <Link href="/" className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] bg-[#ff4444] text-white px-2 py-0.5 rounded-full font-bold">RUTINA {workout.routine.label}</span>
                {workout.completed && (
                  <span className="text-[10px] bg-green-500/20 text-green-400 border border-green-500/30 px-2 py-0.5 rounded-full font-bold">✓ COMPLETADO</span>
                )}
              </div>
              <h1 className="font-black text-base mt-1 truncate">{workout.routine.name}</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-[#ff4444] rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>
            <span className="text-xs text-white/50 flex-shrink-0">{doneCount}/{logs.length} ej</span>
          </div>
          <div className="text-xs text-white/30 mt-1">{completedSets}/{totalSets} series</div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-6 py-6 space-y-4">
        {/* Date & Description */}
        <div>
          <div className="text-white/40 text-sm">{format(new Date(date + 'T12:00:00'), "EEEE d 'de' MMMM yyyy", { locale: es })}</div>
          {workout.routine.description && <div className="text-white/60 text-sm mt-1">🎯 {workout.routine.description}</div>}
        </div>

        {/* Warmup notice */}
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 text-sm">
          <div className="font-bold text-yellow-400 mb-1">⏱️ Calentamiento antes de iniciar</div>
          <div className="text-white/50 text-xs leading-relaxed">Movilidad 2 min → Aproximación: 10-12 reps con 10 lb → Activación: 4-5 reps con 20 lb → Descansar 2 min</div>
        </div>

        {/* Exercises */}
        {groupedLogs.map((item, idx) => {
          if (Array.isArray(item)) {
            const allDone = item.every((l) => l.done)
            return (
              <div key={idx} className="border border-[#ff4444]/30 rounded-2xl overflow-hidden">
                <div className="bg-[#ff4444]/10 px-4 py-2 flex items-center gap-2">
                  <span className="text-[#ff4444] text-xs font-bold uppercase tracking-widest">🔄 Superserie – {item[0].exercise.sets} rondas</span>
                  {allDone && <span className="text-green-400 text-xs">✓</span>}
                </div>
                <div className="divide-y divide-white/5">
                  {item.map((log) => (
                    <ExerciseCard
                      key={log.id}
                      log={log}
                      onSetToggle={handleSetToggle}
                      onSetWeightChange={handleSetWeightChange}
                      onSetRepsChange={handleSetRepsChange}
                      onVideo={() => log.exercise.videoUrl && setVideoModal({ url: log.exercise.videoUrl, name: log.exercise.name })}
                      notesEditing={notesEditing}
                      onEditNotes={setNotesEditing}
                      onSaveNotes={handleSaveNotes}
                      isSuperset
                    />
                  ))}
                </div>
              </div>
            )
          }
          return (
            <ExerciseCard
              key={item.id}
              log={item}
              onSetToggle={handleSetToggle}
              onSetWeightChange={handleSetWeightChange}
              onSetRepsChange={handleSetRepsChange}
              onVideo={() => item.exercise.videoUrl && setVideoModal({ url: item.exercise.videoUrl, name: item.exercise.name })}
              notesEditing={notesEditing}
              onEditNotes={setNotesEditing}
              onSaveNotes={handleSaveNotes}
            />
          )
        })}

        {/* Rest reminder */}
        <div className="text-center py-4 text-white/20 text-xs">💡 Descansa 90-120 segundos entre series efectivas</div>

        {/* Finish button */}
        {!workout.completed && (
          <button
            onClick={handleFinishWorkout}
            className="w-full py-4 rounded-2xl bg-[#ff4444] text-white font-bold text-sm hover:bg-[#ff4444]/90 transition-colors"
          >
            FINALIZAR ENTRENAMIENTO
          </button>
        )}
      </div>
    </main>
  )
}

function ExerciseCard({
  log,
  onSetToggle,
  onSetWeightChange,
  onSetRepsChange,
  onVideo,
  notesEditing,
  onEditNotes,
  onSaveNotes,
  isSuperset = false,
}: {
  log: ExerciseLog
  onSetToggle: (sl: SetLog) => void
  onSetWeightChange: (id: string, w: string) => void
  onSetRepsChange: (id: string, r: number) => void
  onVideo: () => void
  notesEditing: string | null
  onEditNotes: (id: string | null) => void
  onSaveNotes: (id: string, notes: string) => void
  isSuperset?: boolean
}) {
  const ex = log.exercise
  const [localNotes, setLocalNotes] = useState(log.notes || '')
  const isTimeExercise = ex.repsOrTime.toLowerCase().includes('seg') || ex.repsOrTime.toLowerCase().includes('tiempo') || ex.repsOrTime.toLowerCase().includes('plancha') || ex.name.toLowerCase().includes('isométrico')

  return (
    <div className={`${isSuperset ? '' : 'rounded-2xl border'} transition-all ${log.done ? (isSuperset ? 'bg-green-500/5' : 'border-green-500/30 bg-green-500/5') : isSuperset ? 'bg-white/2' : 'border-white/10 bg-white/5'}`}>
      <div className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start gap-3">
          <div className={`w-7 h-7 rounded-lg border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${log.done ? 'bg-green-500 border-green-500' : 'border-white/30'}`}>
            {log.done && (
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className={`font-semibold text-sm ${log.done ? 'text-white/50 line-through' : 'text-white'}`}>{ex.name}</div>
            <div className="flex flex-wrap gap-2 mt-1">
              <span className="text-[11px] bg-white/10 px-2 py-0.5 rounded-full text-white/60">{ex.sets} series</span>
              <span className="text-[11px] bg-white/10 px-2 py-0.5 rounded-full text-white/60">{ex.repsOrTime}</span>
              {ex.weight && <span className="text-[11px] bg-[#ff4444]/20 text-[#ff8888] px-2 py-0.5 rounded-full">{ex.weight}</span>}
            </div>
            {ex.notes && <div className="mt-1 text-[11px] text-yellow-400/70 leading-relaxed">⚡ {ex.notes}</div>}
          </div>
          {ex.videoUrl && (
            <button onClick={onVideo} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-[#ff4444]/30 transition-colors flex-shrink-0 mt-0.5" title="Ver video demostrativo">
              <svg className="w-4 h-4 text-white/60" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 6.82v10.36c0 .79.87 1.27 1.54.84l8.14-5.18c.62-.39.62-1.29 0-1.69L9.54 5.98C8.87 5.55 8 6.03 8 6.82z" />
              </svg>
            </button>
          )}
        </div>

        {/* Sets */}
        <div className="space-y-2 pl-10">
          {log.setLogs.map((sl) => (
            <div key={sl.id} className="flex items-center gap-2">
              <button
                onClick={() => onSetToggle(sl)}
                className={`w-6 h-6 rounded border flex items-center justify-center flex-shrink-0 transition-all ${sl.completed ? 'bg-green-500 border-green-500' : 'border-white/20 hover:border-white/40'}`}
              >
                {sl.completed && (
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
              <span className="text-xs text-white/40 w-8">Set {sl.setNumber}</span>
              <input
                type="text"
                defaultValue={sl.weight || ex.weight || ''}
                onBlur={(e) => onSetWeightChange(sl.id, e.target.value)}
                placeholder="Peso"
                className="w-20 bg-white/5 border border-white/10 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-[#ff4444]/50"
              />
              {isTimeExercise ? (
                <span className="text-xs text-white/30">Timer ↓</span>
              ) : (
                <input
                  type="number"
                  defaultValue={sl.reps || ''}
                  onBlur={(e) => onSetRepsChange(sl.id, parseInt(e.target.value) || 0)}
                  placeholder="Reps"
                  className="w-16 bg-white/5 border border-white/10 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-[#ff4444]/50"
                />
              )}
            </div>
          ))}
          {isTimeExercise && <ExerciseTimer onComplete={() => {}} />}
        </div>

        {/* Notes */}
        <div className="pl-10">
          {notesEditing === log.id ? (
            <div className="flex gap-2">
              <input
                type="text"
                value={localNotes}
                onChange={(e) => setLocalNotes(e.target.value)}
                className="flex-1 bg-white/5 border border-white/10 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-[#ff4444]/50"
                placeholder="Notas..."
                autoFocus
              />
              <button onClick={() => onSaveNotes(log.id, localNotes)} className="px-2 py-1 rounded bg-green-500/20 text-green-400 text-xs font-bold">Guardar</button>
              <button onClick={() => onEditNotes(null)} className="px-2 py-1 rounded bg-white/10 text-white/60 text-xs">Cancelar</button>
            </div>
          ) : (
            <button onClick={() => { onEditNotes(log.id); setLocalNotes(log.notes || '') }} className="text-xs text-white/30 hover:text-white/60 transition-colors">
              {log.notes ? `📝 ${log.notes}` : '+ Añadir notas'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default function WorkoutPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0a0a0f]" />}>
      <WorkoutContent />
    </Suspense>
  )
}
