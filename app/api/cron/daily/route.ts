// app/api/cron/daily/route.ts
// Denní cron job: vygeneruje návrhy, vytvoří sezení, rozešle emaily
// Voláno přes GitHub Actions nebo Vercel Cron

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateDinnerProposals } from '@/lib/generateProposals'
import { sendVotingEmails } from '@/lib/sendEmails'
import { randomUUID } from 'crypto'

export async function GET(req: NextRequest) {
  // Ověření tajného klíče (ochrana endpointu)
  const secret = req.headers.get('x-cron-secret')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Sezení pro dnešek nesmí existovat
  const existing = await prisma.votingSession.findUnique({
    where: { sessionDate: today }
  })
  if (existing) {
    return NextResponse.json({ message: 'Sezení pro dnešek již existuje', id: existing.id })
  }

  // Posledních 7 vítězů – vyloučit z návrhů
  const recentWinners = await prisma.votingSession.findMany({
    where: { winnerName: { not: null } },
    orderBy: { sessionDate: 'desc' },
    take: 7,
    select: { winnerName: true }
  })
  const excludeRecent = recentWinners.map(s => s.winnerName!).filter(Boolean)

  // Generování návrhů přes Claude
  const proposals = await generateDinnerProposals(excludeRecent)

  // Vytvoření sezení v DB
  const session = await prisma.votingSession.create({
  data: {
     sessionDate: today,
     proposals: JSON.stringify(proposals),
     status: 'open'
  }
  })

  // Vytvoření hlasovacích tokenů pro každého člena
  const members = await prisma.member.findMany({ where: { active: true } })

  const votes = await Promise.all(
    members.map(member =>
      prisma.vote.create({
        data: {
          sessionId: session.id,
          memberId: member.id,
          voteToken: randomUUID()
        }
      })
    )
  )

  // Odeslání emailů
  await sendVotingEmails({ session, members, votes, proposals })

  return NextResponse.json({
    success: true,
    sessionId: session.id,
    proposals: proposals.map(p => p.name),
    emailsSent: members.length
  })
}
