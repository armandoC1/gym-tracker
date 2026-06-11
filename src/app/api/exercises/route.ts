import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const setLogPatchSchema = z.object({
  setLogId: z.string().cuid(),
  weight: z.string().optional(),
  reps: z.number().int().min(0).optional(),
  completed: z.boolean().optional(),
})

const exerciseLogPatchSchema = z.object({
  logId: z.string().cuid(),
  done: z.boolean().optional(),
  notes: z.string().optional(),
})

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()

    // Handle SetLog update
    if (body.setLogId) {
      const parsed = setLogPatchSchema.parse(body)

      const setLog = await prisma.setLog.update({
        where: { id: parsed.setLogId },
        data: {
          ...(parsed.weight !== undefined && { weight: parsed.weight }),
          ...(parsed.reps !== undefined && { reps: parsed.reps }),
          ...(parsed.completed !== undefined && { completed: parsed.completed }),
        },
      })

      // Check for PR if completed with weight and reps
      if (setLog.completed && setLog.weight && setLog.reps) {
        const exerciseLog = await prisma.exerciseLog.findUnique({
          where: { id: setLog.exerciseLogId },
          include: { exercise: true },
        })

        if (exerciseLog) {
          const existingPrs = await prisma.personalRecord.findMany({
            where: { exerciseId: exerciseLog.exerciseId },
          })

          // Simple PR logic: if weight is higher than any existing PR, or same weight with higher reps
          const isNewPr = existingPrs.every((pr) => {
            const prWeight = parseFloat(pr.weight.replace(/[^0-9.]/g, ''))
            const newWeight = parseFloat(setLog.weight!.replace(/[^0-9.]/g, ''))
            if (newWeight > prWeight) return true
            if (newWeight === prWeight && setLog.reps! > pr.reps) return true
            return false
          })

          if (isNewPr || existingPrs.length === 0) {
            await prisma.personalRecord.create({
              data: {
                exerciseId: exerciseLog.exerciseId,
                weight: setLog.weight,
                reps: setLog.reps,
                date: new Date(),
              },
            })
          }
        }
      }

      // Auto-update exerciseLog done status based on all sets
      const allSets = await prisma.setLog.findMany({
        where: { exerciseLogId: setLog.exerciseLogId },
      })
      const allSetsDone = allSets.length > 0 && allSets.every((s) => s.completed)
      await prisma.exerciseLog.update({
        where: { id: setLog.exerciseLogId },
        data: {
          done: allSetsDone,
          setsCompleted: allSets.filter((s) => s.completed).length,
        },
      })

      // Check if all exercises in workout are done -> auto-complete workout
      const exerciseLog = await prisma.exerciseLog.findUnique({
        where: { id: setLog.exerciseLogId },
      })
      if (exerciseLog) {
        const allLogs = await prisma.exerciseLog.findMany({
          where: { workoutId: exerciseLog.workoutId },
        })
        const allDone = allLogs.every((l) => l.done)
        if (allDone) {
          await prisma.workout.update({
            where: { id: exerciseLog.workoutId },
            data: { completed: true },
          })
        }
      }

      return NextResponse.json(setLog)
    }

    // Handle ExerciseLog update
    if (body.logId) {
      const parsed = exerciseLogPatchSchema.parse(body)

      const log = await prisma.exerciseLog.update({
        where: { id: parsed.logId },
        data: {
          ...(parsed.done !== undefined && { done: parsed.done }),
          ...(parsed.notes !== undefined && { notes: parsed.notes }),
        },
      })

      // Check if all exercises in workout are done -> auto-complete workout
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
    }

    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 })
    }
    console.error(error)
    return NextResponse.json({ error: 'Failed to update exercise log' }, { status: 500 })
  }
}
