import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const { sessionId } = await req.json()

  await prisma.vote.deleteMany({ where: { sessionId } })
  await prisma.votingSession.delete({ where: { id: sessionId } })

  return NextResponse.json({ success: true })
}