'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import Link from 'next/link'

interface ExerciseLog {
  id: string
  exerciseId: string
  done: boolean
  notes?: string
  exercise: {
    id: string
    name: string
    sets: number
    repsOrTime: string
    weight?: string
    notes?: string
    isSuperset: boolean
    supersetGroup?: string
    videoUrl?: string
    order: number
  }
}

interface Workout {
  id: string
  date: string
  completed: boolean
  routine: {
    name: string
    label: string
    color: string
    description: string
    exercises: any[]
  }
  exerciseLogs: ExerciseLog[]
}

function VideoModal({ url, name, onClose }: { url: string; name: string; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-[#111] rounded-2xl overflow-hidden border border-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 flex items-center justify-between border-b border-white/10">
          <h3 className="font-bold text-sm truncate pr-4">{name}</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 flex-shrink-0"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="aspect-video">
          <iframe
            src={url + '?autoplay=1&rel=0'}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      </div>
    </div>
  )
}

function WorkoutContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const routineId = searchParams.get('routineId') || ''
  const date = searchParams.get('date') || format(new Date(), 'yyyy-MM-dd')

  const [workout, setWorkout] = useState<Workout | null>(null)
  const [loading, setLoading] = useState(true)
  const [videoModal, setVideoModal] = useState<{ url: string; name: string } | null>(null)
  const [toggling, setToggling] = useState<string | null>(null)

  useEffect(() => {
    if (!routineId) return
    fetch(`/api/workouts?routineId=${routineId}&date=${date}`)
      .then((r) => r.json())
      .then((w) => {
        setWorkout(w)
        setLoading(false)
      })
  }, [routineId, date])

  const toggleExercise = async (log: ExerciseLog) => {
    if (toggling) return
    setToggling(log.id)

    const newDone = !log.done

    // Optimistic update
    setWorkout((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        exerciseLogs: prev.exerciseLogs.map((l) =>
          l.id === log.id ? { ...l, done: newDone } : l
        ),
      }
    })

    await fetch('/api/exercises', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ logId: log.id, done: newDone }),
    })

    // Refresh to get updated completed status
    const updated = await fetch(`/api/workouts?routineId=${routineId}&date=${date}`).then((r) =>
      r.json()
    )
    setWorkout(updated)
    setToggling(null)
  }

  if (loading) {
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

  const logs = [...workout.exerciseLogs].sort(
    (a, b) => a.exercise.order - b.exercise.order
  )

  const doneCount = logs.filter((l) => l.done).length
  const progress = logs.length > 0 ? (doneCount / logs.length) * 100 : 0

  // Group supersets
  const groupedLogs: (ExerciseLog | ExerciseLog[])[] = []
  const seenGroups = new Set<string>()

  logs.forEach((log) => {
    if (log.exercise.isSuperset && log.exercise.supersetGroup) {
      if (!seenGroups.has(log.exercise.supersetGroup)) {
        seenGroups.add(log.exercise.supersetGroup)
        const group = logs.filter(
          (l) => l.exercise.supersetGroup === log.exercise.supersetGroup
        )
        groupedLogs.push(group)
      }
    } else {
      groupedLogs.push(log)
    }
  })

  return (
    <main className="min-h-screen bg-[#0a0a0f] text-white pb-10">
      {videoModal && (
        <VideoModal
          url={videoModal.url}
          name={videoModal.name}
          onClose={() => setVideoModal(null)}
        />
      )}

      {/* Header */}
      <header className="sticky top-0 z-10 bg-[#0a0a0f]/90 backdrop-blur border-b border-white/10 px-6 py-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3 mb-3">
            <Link
              href="/"
              className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] bg-[#ff4444] text-white px-2 py-0.5 rounded-full font-bold">
                  RUTINA {workout.routine.label}
                </span>
                {workout.completed && (
                  <span className="text-[10px] bg-green-500/20 text-green-400 border border-green-500/30 px-2 py-0.5 rounded-full font-bold">
                    ✓ COMPLETADO
                  </span>
                )}
              </div>
              <h1 className="font-black text-base mt-1 truncate">{workout.routine.name}</h1>
            </div>
          </div>

          {/* Progress bar */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#ff4444] rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-xs text-white/50 flex-shrink-0">
              {doneCount}/{logs.length}
            </span>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-6 py-6 space-y-4">
        {/* Date & Description */}
        <div>
          <div className="text-white/40 text-sm">
            {format(new Date(date + 'T12:00:00'), "EEEE d 'de' MMMM yyyy", { locale: es })}
          </div>
          {workout.routine.description && (
            <div className="text-white/60 text-sm mt-1">🎯 {workout.routine.description}</div>
          )}
        </div>

        {/* Warmup notice */}
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 text-sm">
          <div className="font-bold text-yellow-400 mb-1">⏱️ Calentamiento antes de iniciar</div>
          <div className="text-white/50 text-xs leading-relaxed">
            Movilidad 2 min → Aproximación: 10-12 reps con 10 lb → Activación: 4-5 reps con 20 lb → Descansar 2 min
          </div>
        </div>

        {/* Exercises */}
        {groupedLogs.map((item, idx) => {
          if (Array.isArray(item)) {
            // Superset group
            const allDone = item.every((l) => l.done)
            return (
              <div key={idx} className="border border-[#ff4444]/30 rounded-2xl overflow-hidden">
                <div className="bg-[#ff4444]/10 px-4 py-2 flex items-center gap-2">
                  <span className="text-[#ff4444] text-xs font-bold uppercase tracking-widest">
                    🔄 Superserie – {item[0].exercise.sets} rondas
                  </span>
                  {allDone && <span className="text-green-400 text-xs">✓</span>}
                </div>
                <div className="divide-y divide-white/5">
                  {item.map((log) => (
                    <ExerciseCard
                      key={log.id}
                      log={log}
                      onToggle={() => toggleExercise(log)}
                      onVideo={() =>
                        log.exercise.videoUrl &&
                        setVideoModal({ url: log.exercise.videoUrl, name: log.exercise.name })
                      }
                      toggling={toggling === log.id}
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
              onToggle={() => toggleExercise(item)}
              onVideo={() =>
                item.exercise.videoUrl &&
                setVideoModal({ url: item.exercise.videoUrl, name: item.exercise.name })
              }
              toggling={toggling === item.id}
            />
          )
        })}

        {/* Rest reminder */}
        <div className="text-center py-4 text-white/20 text-xs">
          💡 Descansa 90-120 segundos entre series efectivas
        </div>
      </div>
    </main>
  )
}

function ExerciseCard({
  log,
  onToggle,
  onVideo,
  toggling,
  isSuperset = false,
}: {
  log: ExerciseLog
  onToggle: () => void
  onVideo: () => void
  toggling: boolean
  isSuperset?: boolean
}) {
  const ex = log.exercise

  return (
    <div
      className={`${
        isSuperset ? '' : 'rounded-2xl border'
      } transition-all ${
        log.done
          ? isSuperset
            ? 'bg-green-500/5'
            : 'border-green-500/30 bg-green-500/5'
          : isSuperset
          ? 'bg-white/2'
          : 'border-white/10 bg-white/5'
      }`}
    >
      <div className="p-4 flex items-start gap-3">
        {/* Checkbox */}
        <button
          onClick={onToggle}
          disabled={toggling}
          className={`w-7 h-7 rounded-lg border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${
            log.done
              ? 'bg-green-500 border-green-500'
              : 'border-white/30 hover:border-white/60'
          } ${toggling ? 'opacity-50' : ''}`}
        >
          {log.done && (
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </button>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div
            className={`font-semibold text-sm ${log.done ? 'text-white/50 line-through' : 'text-white'}`}
          >
            {ex.name}
          </div>

          <div className="flex flex-wrap gap-2 mt-1.5">
            <span className="text-[11px] bg-white/10 px-2 py-0.5 rounded-full text-white/60">
              {ex.sets} series
            </span>
            <span className="text-[11px] bg-white/10 px-2 py-0.5 rounded-full text-white/60">
              {ex.repsOrTime}
            </span>
            {ex.weight && (
              <span className="text-[11px] bg-[#ff4444]/20 text-[#ff8888] px-2 py-0.5 rounded-full">
                {ex.weight}
              </span>
            )}
          </div>

          {ex.notes && (
            <div className="mt-1.5 text-[11px] text-yellow-400/70 leading-relaxed">
              ⚡ {ex.notes}
            </div>
          )}
        </div>

        {/* Video button */}
        {ex.videoUrl && (
          <button
            onClick={onVideo}
            className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-[#ff4444]/30 transition-colors flex-shrink-0 mt-0.5"
            title="Ver video demostrativo"
          >
            <svg className="w-4 h-4 text-white/60" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 6.82v10.36c0 .79.87 1.27 1.54.84l8.14-5.18c.62-.39.62-1.29 0-1.69L9.54 5.98C8.87 5.55 8 6.03 8 6.82z" />
            </svg>
          </button>
        )}
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
