'use client'

import { useState } from 'react'
import { format, startOfWeek, endOfWeek, isSameDay, subWeeks } from 'date-fns'
import { es } from 'date-fns/locale'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { Workout } from '@prisma/client'

interface WorkoutWithDetails extends Workout {
  routine: { id: string; name: string; label: string; color: string; dayOfWeek: string }
  exerciseLogs: { done: boolean; setLogs: { completed: boolean; weight: string | null; reps: number | null }[] }[]
}

function useWorkouts() {
  return useQuery<WorkoutWithDetails[]>({
    queryKey: ['workouts'],
    queryFn: async () => {
      const res = await fetch('/api/workouts')
      if (!res.ok) throw new Error('Error fetching workouts')
      return res.json()
    },
  })
}

function calculateStreak(workouts: WorkoutWithDetails[]) {
  if (workouts.length === 0) return 0
  const completed = workouts.filter((w) => w.completed)
  if (completed.length === 0) return 0

  const weeks = new Set<string>()
  completed.forEach((w) => {
    const week = format(startOfWeek(new Date(w.date), { weekStartsOn: 1 }), 'yyyy-MM-dd')
    weeks.add(week)
  })

  const sortedWeeks = Array.from(weeks).sort((a, b) => b.localeCompare(a))
  let streak = 0
  const today = new Date()
  const thisWeekStart = format(startOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd')

  let checkWeek = thisWeekStart
  for (const week of sortedWeeks) {
    if (week === checkWeek) {
      streak++
      checkWeek = format(subWeeks(new Date(checkWeek + 'T12:00:00'), 1), 'yyyy-MM-dd')
    } else {
      break
    }
  }
  return streak
}

export default function HistoryPage() {
  const { data: workouts, isLoading } = useWorkouts()
  const [weekLimit, setWeekLimit] = useState(4)

  const totalCompleted = (workouts || []).filter((w) => w.completed).length
  const totalStarted = (workouts || []).length
  const completionRate = totalStarted > 0 ? Math.round((totalCompleted / totalStarted) * 100) : 0
  const streak = calculateStreak(workouts || [])

  const totalSets = (workouts || []).reduce((acc, w) => acc + w.exerciseLogs.reduce((acc2, el) => acc2 + el.setLogs.length, 0), 0)
  const completedSets = (workouts || []).reduce((acc, w) => acc + w.exerciseLogs.reduce((acc2, el) => acc2 + el.setLogs.filter((s) => s.completed).length, 0), 0)

  const grouped: Record<string, WorkoutWithDetails[]> = {}
  ;(workouts || []).forEach((w) => {
    const weekStart = format(startOfWeek(new Date(w.date + 'T12:00:00'), { weekStartsOn: 1 }), 'yyyy-MM-dd')
    if (!grouped[weekStart]) grouped[weekStart] = []
    grouped[weekStart].push(w)
  })

  const sortedWeeks = Object.entries(grouped).sort(([a], [b]) => b.localeCompare(a))
  const visibleWeeks = sortedWeeks.slice(0, weekLimit)
  const hasMore = sortedWeeks.length > weekLimit

  const handleExport = () => {
    window.open('/api/export', '_blank')
  }

  return (
    <main className="min-h-screen bg-[#0a0a0f] text-white pb-10">
      <header className="border-b border-white/10 px-6 py-5">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <Link href="/" className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div>
            <h1 className="font-black text-lg">Historial</h1>
            <p className="text-white/40 text-xs">Todos tus entrenamientos</p>
          </div>
          <button
            onClick={handleExport}
            className="ml-auto px-3 py-1.5 rounded-lg bg-white/10 text-xs font-bold hover:bg-white/20 transition-colors"
          >
            📥 Exportar CSV
          </button>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-6 py-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Completados', value: totalCompleted, color: 'text-green-400' },
            { label: 'Iniciados', value: totalStarted, color: 'text-white' },
            { label: 'Tasa', value: `${completionRate}%`, color: 'text-[#ff4444]' },
            { label: 'Racha', value: `${streak} sem`, color: 'text-yellow-400' },
          ].map((s) => (
            <div key={s.label} className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
              <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
              <div className="text-white/40 text-[10px] uppercase tracking-widest mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between">
          <div>
            <div className="text-xs text-white/40 uppercase tracking-widest">Series totales</div>
            <div className="text-lg font-black text-white mt-0.5">{completedSets}/{totalSets}</div>
          </div>
          <div className="text-right">
            <div className="text-xs text-white/40 uppercase tracking-widest">Volumen</div>
            <div className="text-lg font-black text-[#ff4444] mt-0.5">{totalSets > 0 ? Math.round((completedSets / totalSets) * 100) : 0}%</div>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-20 text-white/30">Cargando historial...</div>
        ) : Object.keys(grouped).length === 0 ? (
          <div className="text-center py-20 text-white/20">
            <div className="text-4xl mb-3">🏋️</div>
            <div>Aún no hay entrenamientos registrados</div>
            <Link href="/" className="text-[#ff4444] text-sm mt-2 block hover:underline">Empezar ahora →</Link>
          </div>
        ) : (
          <div className="space-y-6">
            {visibleWeeks.map(([weekStart, weekWorkouts]) => {
              const start = new Date(weekStart + 'T12:00:00')
              const end = endOfWeek(start, { weekStartsOn: 1 })
              const completedInWeek = weekWorkouts.filter((w) => w.completed).length

              return (
                <div key={weekStart}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-xs text-white/40 uppercase tracking-widest">
                      Semana del {format(start, 'd MMM', { locale: es })} al {format(end, 'd MMM', { locale: es })}
                    </div>
                    <div className="text-xs text-white/40">{completedInWeek}/{weekWorkouts.length} completados</div>
                  </div>

                  <div className="space-y-2">
                    {weekWorkouts
                      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                      .map((w) => {
                        const doneEx = w.exerciseLogs.filter((l) => l.done).length
                        const totalEx = w.exerciseLogs.length

                        return (
                          <Link
                            key={w.id}
                            href={`/workout?routineId=${w.routine.id}&date=${w.date.toString().split('T')[0]}`}
                            className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/[0.08] transition-colors"
                          >
                            <div className={`w-3 h-3 rounded-full flex-shrink-0 ${w.completed ? 'bg-green-400' : 'bg-white/20'}`} />
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-sm truncate">{w.routine?.name}</div>
                              <div className="text-white/30 text-xs">Rutina {w.routine?.label} · {doneEx}/{totalEx} ejercicios</div>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <div className="text-white/50 text-xs">{format(new Date(w.date + 'T12:00:00'), 'EEE d MMM', { locale: es })}</div>
                              {w.completed && <div className="text-green-400 text-xs font-bold mt-0.5">✓ LISTO</div>}
                            </div>
                          </Link>
                        )
                      })}
                  </div>
                </div>
              )
            })}

            {hasMore && (
              <button
                onClick={() => setWeekLimit((l) => l + 4)}
                className="w-full py-3 rounded-xl bg-white/5 border border-white/10 text-white/60 text-sm font-bold hover:bg-white/10 transition-colors"
              >
                Cargar más semanas
              </button>
            )}
          </div>
        )}
      </div>
    </main>
  )
}
