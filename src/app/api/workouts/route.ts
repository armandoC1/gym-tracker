import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const date = searchParams.get('date')
  const routineId = searchParams.get('routineId')

  try {
    if (date && routineId) {
      // Get or create workout for specific date + routine
      let workout = await prisma.workout.findUnique({
        where: {
          routineId_date: {
            routineId,
            date: new Date(date),
          },
        },
        include: {
          exerciseLogs: {
            include: { exercise: true },
          },
          routine: {
            include: {
              exercises: { orderBy: { order: 'asc' } },
            },
          },
        },
      })

      if (!workout) {
        // Create workout with exercise logs
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
              })),
            },
          },
          include: {
            exerciseLogs: {
              include: { exercise: true },
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
        exerciseLogs: true,
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
    const { workoutId, completed } = body

    const workout = await prisma.workout.update({
      where: { id: workoutId },
      data: { completed },
    })

    return NextResponse.json(workout)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update workout' }, { status: 500 })
  }
}
