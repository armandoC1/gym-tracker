import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { logId, done, notes } = body

    const log = await prisma.exerciseLog.update({
      where: { id: logId },
      data: {
        ...(done !== undefined && { done }),
        ...(notes !== undefined && { notes }),
      },
    })

    // Check if all exercises in workout are done → auto-complete workout
    const allLogs = await prisma.exerciseLog.findMany({
      where: { workoutId: log.workoutId },
    })

    const allDone = allLogs.every((l) => l.done)

    if (allDone) {
      await prisma.workout.update({
        where: { id: log.workoutId },
        data: { completed: true },
      })
    }

    return NextResponse.json(log)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update exercise log' }, { status: 500 })
  }
}
