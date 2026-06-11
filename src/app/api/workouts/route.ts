import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const patchSchema = z.object({
  workoutId: z.string().cuid(),
  completed: z.boolean().optional(),
  notes: z.string().optional(),
  durationSeconds: z.number().int().optional(),
})

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const date = searchParams.get('date')
  const routineId = searchParams.get('routineId')

  try {
    if (date && routineId) {
      let workout = await prisma.workout.findUnique({
        where: {
          routineId_date: {
            routineId,
            date: new Date(date),
          },
        },
        include: {
          exerciseLogs: {
            include: { exercise: true, setLogs: { orderBy: { setNumber: 'asc' } } },
          },
          routine: {
            include: {
              exercises: { orderBy: { order: 'asc' } },
            },
          },
        },
      })

      if (!workout) {
        const routine = await prisma.routine.findUnique({
          where: { id: routineId },
          include: { exercises: true },
        })

        if (!routine) {
          return NextResponse.json({ error: 'Routine not found' }, { status: 404 })
        }

        workout = await prisma.workout.create({
          data: {
            routineId,
            date: new Date(date),
            exerciseLogs: {
              create: routine.exercises.map((ex) => ({
                exerciseId: ex.id,
                done: false,
                setLogs: {
                  create: Array.from({ length: ex.sets }, (_, i) => ({
                    setNumber: i + 1,
                    weight: ex.weight,
                    completed: false,
                  })),
                },
              })),
            },
          },
          include: {
            exerciseLogs: {
              include: { exercise: true, setLogs: { orderBy: { setNumber: 'asc' } } },
            },
            routine: {
              include: {
                exercises: { orderBy: { order: 'asc' } },
              },
            },
          },
        })
      }

      return NextResponse.json(workout)
    }

    // Get all workouts for history
    const workouts = await prisma.workout.findMany({
      include: {
        routine: true,
        exerciseLogs: { include: { setLogs: true } },
      },
      orderBy: { date: 'desc' },
    })

    return NextResponse.json(workouts)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to fetch workouts' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = patchSchema.parse(body)

    const data: any = {}
    if (parsed.completed !== undefined) data.completed = parsed.completed
    if (parsed.notes !== undefined) data.notes = parsed.notes
    if (parsed.durationSeconds !== undefined) data.durationSeconds = parsed.durationSeconds

    const workout = await prisma.workout.update({
      where: { id: parsed.workoutId },
      data,
    })

    return NextResponse.json(workout)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to update workout' }, { status: 500 })
  }
}
