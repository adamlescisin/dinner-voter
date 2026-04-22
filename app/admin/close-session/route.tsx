import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const { sessionId } = await req.json()

  const session = await prisma.votingSession.findUnique({
    where: { id: sessionId },
    include: { votes: { where: { votedAt: { not: null } } } }
  })
  if (!session) return NextResponse.json({ error: 'Nenalezeno' }, { status: 404 })

  const proposals = JSON.parse(session.proposals as unknown as string) as any[]
  const counts: Record<string, number> = {}
  for (const vote of session.votes) {
    if (vote.customDish) {
      counts[`custom:${vote.customDish}`] = (counts[`custom:${vote.customDish}`] || 0) + 1
    } else if (vote.proposalIndex !== null) {
      counts[`proposal:${vote.proposalIndex}`] = (counts[`proposal:${vote.proposalIndex}`] || 0) + 1
    }
  }
  const winnerKey = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0]
  let winnerName = null
  if (winnerKey?.startsWith('proposal:')) {
    winnerName = proposals[parseInt(winnerKey.split(':')[1])]?.name
  } else if (winnerKey?.startsWith('custom:')) {
    winnerName = winnerKey.replace('custom:', '')
  }

  await prisma.votingSession.update({
    where: { id: sessionId },
    data: { status: 'closed', winnerName, closedAt: new Date() }
  })

  return NextResponse.json({ success: true, winnerName })
}