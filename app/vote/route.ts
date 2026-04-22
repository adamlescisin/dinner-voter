import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const { token, proposalIndex, customDish } = await req.json()

  const vote = await prisma.vote.findUnique({
    where: { voteToken: token }
  })

  if (!vote) {
    return NextResponse.json({ error: 'Token nenalezen' }, { status: 404 })
  }

  if (vote.votedAt) {
    return NextResponse.json({ error: 'Již hlasováno' }, { status: 409 })
  }

  await prisma.vote.update({
    where: { voteToken: token },
    data: {
      proposalIndex: proposalIndex ?? null,
      customDish: customDish ?? null,
      votedAt: new Date()
    }
  })

  return NextResponse.json({ success: true })
}