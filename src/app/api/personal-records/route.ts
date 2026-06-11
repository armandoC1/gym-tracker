import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const prs = await prisma.personalRecord.findMany({
      include: { exercise: { include: { routine: true } } },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(prs)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to fetch PRs' }, { status: 500 })
  }
}
