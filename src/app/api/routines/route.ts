import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const label = searchParams.get('label')

  try {
    const routines = await prisma.routine.findMany({
      where: label ? { label } : undefined,
      include: {
        exercises: {
          orderBy: { order: 'asc' },
        },
      },
      orderBy: [{ label: 'asc' }],
    })

    return NextResponse.json(routines)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch routines' }, { status: 500 })
  }
}
