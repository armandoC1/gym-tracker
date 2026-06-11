import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const workouts = await prisma.workout.findMany({
      include: {
        routine: true,
        exerciseLogs: {
          include: {
            exercise: true,
            setLogs: true,
          },
        },
      },
      orderBy: { date: 'desc' },
    })

    const rows: string[] = []
    rows.push('Date,Routine,Exercise,Set,Weight,Reps,Completed,Notes')

    for (const w of workouts) {
      for (const el of w.exerciseLogs) {
        if (el.setLogs.length === 0) {
          rows.push(
            `${w.date.toISOString().split('T')[0]},${w.routine.name},${el.exercise.name},,,,${el.done},${el.notes || ''}`
          )
        } else {
          for (const sl of el.setLogs) {
            rows.push(
              `${w.date.toISOString().split('T')[0]},${w.routine.name},${el.exercise.name},${sl.setNumber},${sl.weight || ''},${sl.reps || ''},${sl.completed},${el.notes || ''}`
            )
          }
        }
      }
    }

    const csv = rows.join('\n')
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="gym-tracker-export.csv"',
      },
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to export CSV' }, { status: 500 })
  }
}
