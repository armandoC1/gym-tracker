import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const querySchema = z.object({
  exerciseId: z.string().cuid(),
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const parsed = querySchema.parse({
      exerciseId: searchParams.get('exerciseId'),
    })

    const logs = await prisma.exerciseLog.findMany({
      where: { exerciseId: parsed.exerciseId },
      include: {
        workout: true,
        setLogs: true,
      },
      orderBy: { workout: { date: 'desc' } },
    })

    return NextResponse.json(logs)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 })
    }
    console.error(error)
    return NextResponse.json({ error: 'Failed to fetch progress' }, { status: 500 })
  }
}
