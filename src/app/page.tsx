'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { format, startOfWeek, addDays, isToday, isSameDay } from 'date-fns'
import { es } from 'date-fns/locale'

interface Routine {
  id: string
  name: string
  label: string
  dayOfWeek: string
  color: string
  description: string
  exercises: Exercise[]
}

interface Exercise {
  id: string
  name: string
  sets: number
  repsOrTime: string
  weight?: string
  notes?: string
}

interface Workout {
  id: string
  routineId: string
  date: string
  completed: boolean
  routine: { name: string; label: string; color: string; dayOfWeek: string }
}

const DAY_MAP: Record<string, number> = {
  LUNES: 1,
  MARTES: 2,
  MIERCOLES: 3,
  JUEVES: 4,
  VIERNES: 5,
  SABADO: 6,
  DOMINGO: 0,
}

const DAY_LABELS: Record<string, string> = {
  LUNES: 'Lun',
  MARTES: 'Mar',
  MIERCOLES: 'Mié',
  JUEVES: 'Jue',
  VIERNES: 'Vie',
  SABADO: 'Sáb',
  DOMINGO: 'Dom',
}

export default function Home() {
  const [routines, setRoutines] = useState<Routine[]>([])
  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [activeTab, setActiveTab] = useState<'A' | 'B'>('A')
  const [loading, setLoading] = useState(true)
  const today = new Date()

  useEffect(() => {
    Promise.all([
      fetch('/api/routines').then((r) => r.json()),
      fetch('/api/workouts').then((r) => r.json()),
    ]).then(([r, w]) => {
      setRoutines(r)
      setWorkouts(w)
      setLoading(false)
    })
  }, [])

  const filteredRoutines = routines.filter((r) => r.label === activeTab)

  const getWorkoutForRoutineToday = (routineId: string) => {
    return workouts.find(
      (w) =>
        w.routineId === routineId &&
        isSameDay(new Date(w.date), today)
    )
  }

  const recentWorkouts = workouts.slice(0, 14)

  // Stats
  const thisWeekStart = startOfWeek(today, { weekStartsOn: 1 })
  const thisWeekWorkouts = workouts.filter((w) => {
    const d = new Date(w.date)
    return d >= thisWeekStart && w.completed
  })
  const totalCompleted = workouts.filter((w) => w.completed).length

  return (
    <main className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Header */}
      <header className="border-b border-white/10 px-6 py-5">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black tracking-tight">
              <span className="text-[#ff4444]">GYM</span>
              <span className="text-white">TRACKER</span>
            </h1>
            <p className="text-white/40 text-xs mt-0.5">Heavy Duty · Enfoque Brazos</p>
          </div>
          <div className="flex gap-4 text-center">
            <div>
              <div className="text-2xl font-black text-[#ff4444]">{thisWeekWorkouts.length}</div>
              <div className="text-[10px] text-white/40 uppercase tracking-widest">Esta semana</div>
            </div>
            <div className="w-px bg-white/10" />
            <div>
              <div className="text-2xl font-black text-white">{totalCompleted}</div>
              <div className="text-[10px] text-white/40 uppercase tracking-widest">Total</div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
        {/* Today Banner */}
        <div className="bg-gradient-to-r from-[#ff4444]/20 to-transparent border border-[#ff4444]/30 rounded-2xl p-5">
          <div className="text-white/50 text-xs uppercase tracking-widest mb-1">Hoy</div>
          <div className="text-xl font-bold">
            {format(today, "EEEE d 'de' MMMM", { locale: es })}
          </div>
        </div>

        {/* Routine Tabs */}
        <div>
          <div className="flex gap-2 mb-6">
            {(['A', 'B'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${
                  activeTab === tab
                    ? 'bg-[#ff4444] text-white'
                    : 'bg-white/5 text-white/50 hover:bg-white/10'
                }`}
              >
                RUTINA {tab}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="text-center py-20 text-white/30">Cargando rutinas...</div>
          ) : (
            <div className="space-y-3">
              {filteredRoutines.map((routine) => {
                const workout = getWorkoutForRoutineToday(routine.id)
                const isToday_ =
                  DAY_MAP[routine.dayOfWeek] === today.getDay()

                return (
                  <Link
                    key={routine.id}
                    href={`/workout?routineId=${routine.id}&date=${format(today, 'yyyy-MM-dd')}`}
                    className={`block rounded-2xl border transition-all hover:scale-[1.01] active:scale-[0.99] ${
                      isToday_
                        ? 'border-[#ff4444]/60 bg-[#ff4444]/10'
                        : 'border-white/10 bg-white/5'
                    }`}
                  >
                    <div className="p-5 flex items-center gap-4">
                      {/* Day indicator */}
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center font-black text-sm flex-shrink-0"
                        style={{ backgroundColor: routine.color + '33', color: routine.color }}
                      >
                        {DAY_LABELS[routine.dayOfWeek]}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm">{routine.name}</span>
                          {isToday_ && (
                            <span className="text-[10px] bg-[#ff4444] text-white px-2 py-0.5 rounded-full font-bold uppercase">
                              HOY
                            </span>
                          )}
                        </div>
                        <div className="text-white/40 text-xs mt-0.5">{routine.description}</div>
                        <div className="text-white/30 text-xs mt-1">
                          {routine.exercises.length} ejercicios
                        </div>
                      </div>

                      {/* Status */}
                      <div className="flex-shrink-0">
                        {workout?.completed ? (
                          <div className="w-8 h-8 rounded-full bg-green-500/20 border border-green-500/50 flex items-center justify-center">
                            <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-white/5 border border-white/20 flex items-center justify-center">
                            <svg className="w-4 h-4 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>

        {/* History */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-white/70 text-sm uppercase tracking-widest">
              Historial reciente
            </h2>
            <Link href="/history" className="text-[#ff4444] text-xs hover:underline">
              Ver todo →
            </Link>
          </div>

          {recentWorkouts.length === 0 ? (
            <div className="text-center py-10 text-white/20 text-sm">
              Aún no has registrado entrenamientos
            </div>
          ) : (
            <div className="space-y-2">
              {recentWorkouts.map((w) => (
                <div
                  key={w.id}
                  className="flex items-center gap-3 py-3 px-4 rounded-xl bg-white/5 border border-white/5"
                >
                  <div
                    className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      w.completed ? 'bg-green-400' : 'bg-white/20'
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{w.routine?.name}</div>
                    <div className="text-white/30 text-xs">Rutina {w.routine?.label}</div>
                  </div>
                  <div className="text-white/30 text-xs flex-shrink-0">
                    {format(new Date(w.date), 'd MMM', { locale: es })}
                  </div>
                  {w.completed && (
                    <span className="text-green-400 text-xs font-bold">✓</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
